import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { handleRequest, FeedbackQuota } from './index.mjs';
import { feedbackSample, exampleAnalysis } from '../src/survey/feedback.ts';

const origin = 'https://uthmans.github.io';
const request = (responses = feedbackSample, extra = {}) => new Request('https://worker.example/api/feedback', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1', ...extra }, body: JSON.stringify({ responses }) });
function quota() {
  const data = new Map();
  let queue = Promise.resolve();
  const storage = { async get(key) { return structuredClone(data.get(key)); }, async put(key, value) { data.set(key, structuredClone(value)); }, transaction(fn) { const result = queue.then(() => fn(storage)); queue = result.catch(() => {}); return result; } };
  const object = new FeedbackQuota({ storage });
  return { idFromName: () => 'id', get: () => ({ fetch: (url, init) => object.fetch(new Request(url, init)) }) };
}
const environment = () => ({ SURVEY_ALLOWED_ORIGIN: origin, AI: { run: async () => { throw Error('Unexpected inference'); } }, FEEDBACK_QUOTA: quota() });
test('worker root and health respond without revealing secrets; runtime context is not a fetch implementation', async () => {
  const env = environment();
  const health = await worker.fetch(new Request('https://worker.example/'), env, {});
  const data = await health.json(); assert.equal(data.ready, true);
  assert.deepEqual(data.checks, { aiBindingConfigured: true, quotaBindingConfigured: true });
  assert.equal(data.version, 'workers-ai-1');
  assert.equal(JSON.stringify(data).includes('test-only'), false);
  assert.equal((await (await worker.fetch(new Request('https://worker.example/api/health'), {})).json()).ready, false);
  for (const [missing, expected] of [['AI', { aiBindingConfigured: false, quotaBindingConfigured: true }], ['FEEDBACK_QUOTA', { aiBindingConfigured: true, quotaBindingConfigured: false }]]) {
    const response = await worker.fetch(new Request('https://worker.example/api/health'), { ...env, [missing]: undefined });
    const diagnostics = await response.json();
    assert.equal(diagnostics.ready, false);
    assert.deepEqual(diagnostics.checks, expected);
  }
});
test('worker CORS, preflight, input and missing prerequisites fail before provider calls', async () => {
  const env = environment(); let calls = 0;
  const provider = async () => { calls++; throw Error('unexpected'); };
  assert.equal((await handleRequest(request([], { Origin: 'https://evil.example' }), env, provider)).status, 403);
  assert.equal((await handleRequest(request(), { ...env, AI: null }, provider)).status, 503);
  assert.equal((await handleRequest(request(), { ...env, FEEDBACK_QUOTA: null }, provider)).status, 503);
  assert.equal((await handleRequest(request([]), env, provider)).status, 400);
  const preflight = await handleRequest(new Request('https://worker.example/api/feedback', { method: 'OPTIONS', headers: { Origin: origin } }), env, provider);
  assert.equal(preflight.status, 204); assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), origin);
  const big = new Request('https://worker.example/api/feedback', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: 'x'.repeat(256 * 1024 + 1) });
  assert.equal((await handleRequest(big, env, provider)).status, 413); assert.equal(calls, 0);
});
test('worker uses the fixed free-allocation model and validates sources before accepting output', async () => {
  const env = environment(); let calls = 0;
  const provider = async (model, inputs) => {
    calls++; assert.equal(model, '@cf/meta/llama-3.1-8b-instruct-fp8-fast');
    assert.equal(inputs.response_format.type, 'json_schema');
    assert.deepEqual(JSON.parse(inputs.messages[1].content).responses, feedbackSample);
    return { response: exampleAnalysis };
  };
  const valid = await handleRequest(request(), env, provider);
  assert.equal(valid.status, 200); assert.deepEqual(await valid.json(), exampleAnalysis);
  assert.equal(valid.headers.get('Access-Control-Allow-Origin'), origin);
  const invalid = async () => ({ response: { ...exampleAnalysis, findings: [{ ...exampleAnalysis.findings[0], responseIds: ['made-up'] }] } });
  assert.equal((await handleRequest(request(), env, invalid)).status, 502);
  assert.equal((await handleRequest(request(), env, async () => { throw Error('private diagnostic'); })).status, 502);
  assert.equal((await handleRequest(request(), env, provider)).status, 429); assert.equal(calls, 1);
});
test('persistent global quota permits only 20 reservations across concurrent clients and blocks failed controls', async () => {
  const binding = quota();
  const reserve = client => binding.get().fetch('https://quota/reserve', { method: 'POST', body: JSON.stringify({ client }) });
  const results = await Promise.all(Array.from({ length: 30 }, (_, i) => reserve('client-' + i)));
  assert.equal(results.filter(r => r.status === 200).length, 20);
  const env = { ...environment(), FEEDBACK_QUOTA: { idFromName: () => 'x', get: () => ({ fetch: async () => new Response('', { status: 500 }) }) } };
  assert.equal((await handleRequest(request(), env, () => { throw Error('Must not call'); })).status, 503);
});

test('Workers AI failures and limits are safe and never fall back to a paid provider', async () => {
  for (const [message, expected] of [['daily neuron quota exceeded', 'workers_ai_limit'], ['429 rate limit', 'workers_ai_limit'], ['private-provider-detail', 'workers_ai_unavailable']]) {
    let calls = 0;
    const response = await handleRequest(request(), environment(), async () => { calls++; throw Error(message); });
    const body = await response.json();
    assert.equal(response.status, 502); assert.equal(body.code, expected);
    assert.ok(!JSON.stringify(body).includes('private-provider-detail'));
    assert.equal(calls, 1);
  }
  const invalid = await handleRequest(request(), environment(), async () => ({ response: 'not json' }));
  assert.equal((await invalid.json()).code, 'invalid_analysis');
  const timeout = await handleRequest(request(), environment(), async () => { throw new DOMException('private', 'TimeoutError'); });
  assert.equal((await timeout.json()).code, 'provider_timeout');
  const stringOutput = await handleRequest(request(), environment(), async () => ({ response: JSON.stringify(exampleAnalysis) }));
  assert.deepEqual(await stringOutput.json(), exampleAnalysis);
});
