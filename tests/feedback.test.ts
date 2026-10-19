import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analysisErrorMessage, validateFeedback, validateAnalysis, exampleAnalysis, feedbackSample, analysisReport } from '../src/survey/feedback.ts';

test('only known diagnostic codes become user-facing error messages', () => {
  assert.match(analysisErrorMessage('provider_billing')!, /OpenAI API credits/);
  assert.equal(analysisErrorMessage('untrusted-provider-text'), undefined);
  assert.equal(analysisErrorMessage('constructor'), undefined);
  assert.equal(analysisErrorMessage(null), undefined);
});

test('feedback bounds, anonymous IDs and whole-file validation', () => {
  assert.deepEqual(validateFeedback(feedbackSample), feedbackSample);
  for (const rows of [[], Array(101).fill(feedbackSample[0]), [{ id: 'x', feedback: ' ' }], [{ id: '=SUM()', feedback: 'text' }], [{ id: 'x', feedback: 'a'.repeat(1001) }], [feedbackSample[0], feedbackSample[0]]]) assert.throws(() => validateFeedback(rows));
});
test('analysis rejects invented or repeated evidence and malformed findings', () => {
  assert.deepEqual(validateAnalysis(exampleAnalysis, feedbackSample), exampleAnalysis);
  for (const ids of [['invented'], [], ['F01', 'F01']]) assert.throws(() => validateAnalysis({ ...exampleAnalysis, findings: [{ ...exampleAnalysis.findings[0], responseIds: ids }] }, feedbackSample));
  assert.throws(() => validateAnalysis({ summary: 'summary', findings: [] }, feedbackSample));
  const report = analysisReport(exampleAnalysis, feedbackSample, 'Hand-written example');
  assert.match(report, /Hand-written example/);
  assert.ok(report.includes(feedbackSample[0].feedback));
});
