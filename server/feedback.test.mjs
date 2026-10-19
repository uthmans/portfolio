import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFeedbackServer } from './feedback.mjs';
import { exampleAnalysis, feedbackSample } from '../src/survey/feedback.ts';
test('backend enforces origin, input, provider errors and source validation', async () => {
  let output = exampleAnalysis; let calls = 0;
  const server = createFeedbackServer({ key: 'test-key', fetchImpl: async (_url, options) => { calls++; assert.equal(JSON.parse(options.body).messages[1].role, 'user'); return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(output) } }] }) }; } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/feedback`;
  const request = (data, origin = 'http://127.0.0.1:5173') => fetch(url, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ responses: data }) });
  try {
    assert.equal((await request(feedbackSample, 'https://other.example')).status, 403);
    assert.equal((await request([])).status, 400); assert.equal(calls, 0);
    const response = await request(feedbackSample); assert.equal(response.status, 200); assert.deepEqual(await response.json(), exampleAnalysis);
    output = { ...exampleAnalysis, findings: [{ ...exampleAnalysis.findings[0], responseIds: ['invented'] }] };
    assert.equal((await request(feedbackSample)).status, 502);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
