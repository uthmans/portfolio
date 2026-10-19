import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4173/portfolio/';
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(new URL('survey/', url).href);
  const section = page.locator('#written-feedback');
  await section.getByRole('button', { name: 'Show example analysis' }).click();
  await section.getByRole('button', { name: 'Read 3 supporting responses' }).first().click();
  assert.match(await section.locator('.feedback-sources').innerText(), /3 selected sources/);
  assert.equal(await section.locator('.feedback-sources li').count(), 3);
  const downloading = page.waitForEvent('download');
  await section.getByRole('button', { name: 'Download analysis report' }).click();
  const file = await downloading;
  assert.match(await readFile(await file.path(), 'utf8'), /Hand-written example/);
  await section.locator('input[type=file]').setInputFiles({ name: 'bad.csv', mimeType: 'text/csv', buffer: Buffer.from('id,feedback\nx,\n') });
  await page.getByRole('status').filter({ hasText: /current responses and analysis were kept/ }).waitFor();
  assert.equal(await section.locator('.feedback-results article').count(), 3);
  await section.locator('input[type=file]').setInputFiles({ name: 'feedback.csv', mimeType: 'text/csv', buffer: Buffer.from('id,feedback\r\nx,"Good examples, more time please."\r\ny,"A written recap would help."') });
  await section.getByRole('status').filter({ hasText: /Imported 2 responses/ }).waitFor();
  assert.equal(await section.locator('.feedback-results article').count(), 0);
  assert.equal(await section.getByRole('button', { name: 'Show example analysis' }).isDisabled(), true);
  assert.equal(await section.getByRole('button', { name: 'Analyse with AI' }).isDisabled(), true);
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);
  }
  await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
  const axe = await page.evaluate(async () => window.axe.run('#written-feedback', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] }));
  assert.deepEqual(axe.violations.map(v => `${v.id}: ${v.description}`), []);
  assert.deepEqual(errors, []);
  console.log('Feedback browser checks passed: examples, source drilldown, report download, validation preservation, stale clearing, mobile overflow and accessibility.');
} finally { await browser.close(); }
