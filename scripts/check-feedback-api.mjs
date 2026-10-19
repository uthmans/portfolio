// Run against Vite started with VITE_FEEDBACK_API_URL=http://127.0.0.1:5173/mock-feedback.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { exampleAnalysis } from '../src/survey/feedback.ts';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  let status = 200; let output = { ...exampleAnalysis, findings: exampleAnalysis.findings.map(f => ({ ...f, responseIds: f.responseIds.map(id => id.replace('F', 'R')) })) }; let calls = 0;
  await page.route('**/mock-feedback', async route => { calls++; assert.equal(route.request().postDataJSON().responses.length, 6); await route.fulfill({ status, json: output }); });
  await page.goto(new URL('survey/', process.env.PORTFOLIO_URL || 'http://127.0.0.1:5173/portfolio/').href);
  const area = page.locator('#written-feedback');
  const button = area.getByRole('button', { name: 'Analyse feedback' });
  assert.equal(await button.isDisabled(), true); assert.equal(calls, 0);
  await area.getByRole('checkbox').check(); await button.click();
  await area.getByRole('status').filter({ hasText: 'Analysis ready.' }).waitFor();
  assert.match(await area.locator('.feedback-context').innerText(), /AI-generated/);
  output = { ...exampleAnalysis, findings: [{ ...exampleAnalysis.findings[0], responseIds: ['invented'] }] };
  await button.click(); await area.getByRole('status').filter({ hasText: 'invalid source references' }).waitFor();
  assert.equal(await area.locator('.feedback-finding').count(), 3);
  status = 429; await button.click(); await area.getByRole('status').filter({ hasText: 'usage limit has been reached' }).waitFor();
  assert.equal(calls, 3);
  status = 502; output = { code: 'workers_ai_limit', error: 'untrusted text should not be displayed' };
  await button.click(); await area.getByRole('status').filter({ hasText: 'free AI allowance' }).waitFor();
  assert.equal(await area.getByRole('status').innerText().then(text => text.includes('untrusted text')), false);
  await page.getByLabel('Learning track').selectOption('Automations');
  assert.equal(await area.getByRole('checkbox').isChecked(), false);
  assert.equal(await area.getByRole('button', { name: 'Analyse feedback' }).isDisabled(), true);
  assert.match(await area.locator('.feedback-context').innerText(), /Hand-written example/);
  assert.match(await area.innerText(), /2 of 4 selected responses/);
  console.log('Configured AI browser path passed with mocked responses: consent, submission, accepted report, unknown-ID rejection, and rate-limit error.');
} finally { await browser.close(); }
