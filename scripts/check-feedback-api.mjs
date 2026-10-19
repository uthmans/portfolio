// Run against Vite started with VITE_FEEDBACK_API_URL=http://127.0.0.1:5173/mock-feedback.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { exampleAnalysis } from '../src/survey/feedback.ts';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  let status = 200; let output = exampleAnalysis; let calls = 0;
  await page.route('**/mock-feedback', async route => { calls++; assert.equal(route.request().postDataJSON().responses.length, 6); await route.fulfill({ status, json: output }); });
  await page.goto('http://127.0.0.1:5173/portfolio/survey/');
  const area = page.locator('#written-feedback');
  const button = area.getByRole('button', { name: 'Analyse with AI' });
  assert.equal(await button.isDisabled(), true); assert.equal(calls, 0);
  await area.getByRole('checkbox').check(); await button.click();
  await area.getByRole('status').filter({ hasText: 'Analysis ready.' }).waitFor();
  assert.match(await area.locator('.feedback-mode').innerText(), /AI-generated/);
  output = { ...exampleAnalysis, findings: [{ ...exampleAnalysis.findings[0], responseIds: ['invented'] }] };
  await button.click(); await area.getByRole('status').filter({ hasText: 'invalid source references' }).waitFor();
  assert.equal(await area.locator('.feedback-results article').count(), 3);
  status = 429; await button.click(); await area.getByRole('status').filter({ hasText: 'limit has been reached' }).waitFor();
  assert.equal(calls, 3);
  console.log('Configured AI browser path passed with mocked responses: consent, submission, accepted report, unknown-ID rejection, and rate-limit error.');
} finally { await browser.close(); }
