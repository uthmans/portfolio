// Run npm run worker:check first. Uses Wrangler's local simulator; no API key or paid calls.
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import assert from 'node:assert/strict';
import { exampleAnalysis, feedbackSample } from '../src/survey/feedback.ts';
let calls = 0;
const mf = new Miniflare(convertV4MiniflareOptions({
  workers: [{ name: 'portfolio',
  modules: true, modulesRoot: '/tmp/portfolio-worker-bundle', scriptPath: '/tmp/portfolio-worker-bundle/index.js', compatibilityDate: '2026-10-19',
  durableObjects: { FEEDBACK_QUOTA: { className: 'FeedbackQuota', useSQLite: true } },
  bindings: { SURVEY_ALLOWED_ORIGIN: 'https://uthmans.github.io', SURVEY_AI_KEY: 'local-test-only' },
  outboundService: async request => {
    assert.equal(new URL(request.url).hostname, 'api.openai.com'); calls++;
    return Response.json({ choices: [{ message: { content: JSON.stringify(exampleAnalysis) } }] });
  },
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
  assert.equal(calls, 3);
  console.log('Cloudflare runtime passed: Worker entry, native Durable Object storage, mocked provider round trip, and quota rejection before provider call.');
} finally { await mf.dispose(); }
