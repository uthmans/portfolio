// Run npm run worker:check first. Uses Wrangler's local simulator; no API key or paid calls.
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import assert from 'node:assert/strict';
import { exampleAnalysis, feedbackSample } from '../src/survey/feedback.ts';
const examplePlan = { title: 'Bakery website', summary: 'Draft a simple bakery website.', tasks: ['Clarify enquiry requirements'], questions: ['Who supplies menu content?'], risks: ['Content delivery is unconfirmed.'] };
const exampleAdvice = { serviceId: 'workspace', reason: 'A workspace concept fits the home-office goal.', questions: ['What storage is available?'], caveat: 'This is not an ergonomic assessment.' };
const mf = new Miniflare(convertV4MiniflareOptions({
  workers: [{ name: 'portfolio',
  modules: true, modulesRoot: '/tmp/portfolio-worker-bundle', scriptPath: '/tmp/portfolio-worker-bundle/index.js', compatibilityDate: '2026-10-19',
  durableObjects: { FEEDBACK_QUOTA: { className: 'FeedbackQuota', useSQLite: true } },
  bindings: { SURVEY_ALLOWED_ORIGIN: 'https://uthmans.github.io' },
  serviceBindings: { AI: 'ai-mock' },
  outboundService: async () => { throw Error('External network calls are forbidden in this test'); },
  }, {
    name: 'ai-mock', modules: true, compatibilityDate: '2026-10-19',
    script: `import { WorkerEntrypoint } from 'cloudflare:workers'; let calls = 0; export default class extends WorkerEntrypoint { async run(model, inputs) { if (model !== '@cf/meta/llama-3.1-8b-instruct-fp8-fast' || inputs.response_format.type !== 'json_schema') throw Error('Wrong model or format'); calls++; const body = JSON.parse(inputs.messages[1].content); return { response: body.description ? ${JSON.stringify(exampleAdvice)} : body.brief ? ${JSON.stringify(examplePlan)} : ${JSON.stringify(exampleAnalysis)} }; } async fetch() { return Response.json({calls}); } }`,
  }],
}));
try {
  const health = await mf.dispatchFetch('https://worker.example/api/health');
  assert.equal((await health.json()).ready, true);
  for (let i = 0; i < 4; i++) {
    const response = await mf.dispatchFetch('https://worker.example/api/feedback', { method: 'POST', headers: { Origin: 'https://uthmans.github.io', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' }, body: JSON.stringify({ responses: feedbackSample }) });
    assert.equal(response.status, i < 3 ? 200 : 429);
    if (i < 3) assert.deepEqual(await response.json(), exampleAnalysis);
  }
  const mock = await mf.getWorker('ai-mock');
  assert.equal((await (await mock.fetch('https://mock/count')).json()).calls, 3);
  const planning = await mf.dispatchFetch('https://worker.example/api/project-plan', { method: 'POST', headers: { Origin: 'https://uthmans.github.io', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.2' }, body: JSON.stringify({ brief: 'Build a small website for a fictional bakery with a menu and enquiry form.' }) });
  assert.equal(planning.status, 200); assert.deepEqual(await planning.json(), examplePlan);
  const guiding = await mf.dispatchFetch('https://worker.example/api/service-guide', { method: 'POST', headers: { Origin: 'https://uthmans.github.io', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.3' }, body: JSON.stringify({ description: 'My fictional home office needs a clearer desk layout and storage.' }) });
  assert.equal(guiding.status, 200); assert.deepEqual(await guiding.json(), exampleAdvice);
  console.log('Cloudflare runtime passed: Worker entry, native Durable Object storage, mocked provider round trip, and quota rejection before provider call.');
} finally { await mf.dispose(); }
