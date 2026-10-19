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
const environment = () => ({ SURVEY_ALLOWED_ORIGIN: origin, SURVEY_AI_KEY: 'test-only', FEEDBACK_QUOTA: quota() });
test('worker root and health respond without revealing secrets; runtime context is not a fetch implementation', async () => {
  const env = environment();
  const health = await worker.fetch(new Request('https://worker.example/'), env, {});
  const data = await health.json(); assert.equal(data.ready, true);
  assert.equal(JSON.stringify(data).includes('test-only'), false);
  assert.equal((await (await worker.fetch(new Request('https://worker.example/api/health'), {})).json()).ready, false);
});
test('worker CORS, preflight, input and missing prerequisites fail before provider calls', async () => {
  const env = environment(); let calls = 0;
  const provider = async () => { calls++; throw Error('unexpected'); };
  assert.equal((await handleRequest(request([], { Origin: 'https://evil.example' }), env, provider)).status, 403);
  assert.equal((await handleRequest(request(), { ...env, SURVEY_AI_KEY: '' }, provider)).status, 503);
  assert.equal((await handleRequest(request(), { ...env, FEEDBACK_QUOTA: null }, provider)).status, 503);
  assert.equal((await handleRequest(request([]), env, provider)).status, 400);
  const preflight = await handleRequest(new Request('https://worker.example/api/feedback', { method: 'OPTIONS', headers: { Origin: origin } }), env, provider);
  assert.equal(preflight.status, 204); assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), origin);
  const big = new Request('https://worker.example/api/feedback', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: 'x'.repeat(256 * 1024 + 1) });
  assert.equal((await handleRequest(big, env, provider)).status, 413); assert.equal(calls, 0);
});
test('worker validates model sources and strips provider errors; quota limits apply before paid requests', async () => {
  const env = environment(); let calls = 0;
  const provider = async (url, init) => {
    calls++; assert.equal(url, 'https://api.openai.com/v1/chat/completions');
    assert.equal(init.headers.Authorization, 'Bearer test-only');
    const body = JSON.parse(init.body); assert.deepEqual(JSON.parse(body.messages[1].content).responses, feedbackSample);
    return Response.json({ choices: [{ message: { content: JSON.stringify(exampleAnalysis) } }] });
  };
  const valid = await handleRequest(request(), env, provider);
  assert.equal(valid.status, 200); assert.deepEqual(await valid.json(), exampleAnalysis);
  assert.equal(valid.headers.get('Access-Control-Allow-Origin'), origin);
  const invalid = async () => Response.json({ choices: [{ message: { content: JSON.stringify({ ...exampleAnalysis, findings: [{ ...exampleAnalysis.findings[0], responseIds: ['made-up'] }] }) } }] });
  assert.equal((await handleRequest(request(), env, invalid)).status, 502);
  assert.equal((await handleRequest(request(), env, async () => new Response('private diagnostic', { status: 401 }))).status, 502);
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
