import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
const base = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4173/portfolio/';
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  let status = 200; let calls = 0;
  let output = { serviceId: 'workspace', reason: 'A workspace concept fits the desk, storage and focus needs you described.', questions: ['What storage do you already use?'], caveat: 'This is a fictional concept, not an ergonomic assessment.', price: 0, total: 0 };
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/api/service-guide', async route => {
    calls++; const payload = route.request().postDataJSON(); assert.deepEqual(Object.keys(payload), ['description']);
    assert.ok(payload.description.length >= 20); await route.fulfill({ status, json: output });
  });
  await page.goto(new URL('business/', base).href); await page.evaluate(() => document.fonts.ready);
  await page.getByLabel('Number of rooms', { exact: true }).selectOption('2');
  await page.getByLabel('Color palette').check();
  assert.match(await page.locator('.ff-total').innerText(), /\$405/);
  await page.getByRole('button', { name: 'Fill with sample details' }).click();
  await page.getByRole('button', { name: 'Preview enquiry', exact: true }).click();
  assert.equal(await page.locator('.ff-enquiry-preview').count(), 1);
  const area = page.locator('#service-guide');
  await area.getByRole('button', { name: 'Use a fictional home-office example' }).click();
  const suggest = area.getByRole('button', { name: 'Suggest a service' });
  assert.equal(await suggest.isDisabled(), true); assert.equal(calls, 0);
  await area.getByRole('checkbox').check(); await suggest.click();
  await area.getByRole('heading', { name: 'Workspace refresh', exact: true }).waitFor();
  assert.match(await page.locator('.ff-total').innerText(), /\$405/);
  assert.equal(await page.locator('.ff-enquiry-preview').count(), 1);
  assert.match(await area.locator('.ff-guide-price').innerText(), /\$220/);
  await area.getByRole('button', { name: 'Build an estimate for Workspace refresh' }).click();
  assert.equal(await page.getByLabel('Choose a service', { exact: true }).inputValue(), 'workspace');
  assert.equal(await page.getByLabel('Number of rooms', { exact: true }).inputValue(), '2');
  assert.equal(await page.getByLabel('Color palette').isChecked(), true);
  assert.match(await page.locator('.ff-total').innerText(), /\$485/);
  assert.equal(await page.locator('.ff-enquiry-preview').count(), 0);
  await page.waitForFunction(() => document.activeElement?.id === 'quote-service');
  await page.waitForFunction(() => {
    const top = document.getElementById('estimate').getBoundingClientRect().top;
    return top >= 0 && top <= 30;
  });
  await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
  const axe = await page.evaluate(() => window.axe.run('#service-guide', { runOnly: ['wcag2a','wcag2aa','wcag21aa'] }));
  assert.deepEqual(axe.violations.map(v => v.id), []);
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);
  }
  await area.screenshot({ path: 'test-results/service-guide-desktop.png' });
  await area.getByLabel('Tell us about your space').fill('My fictional house needs structural wall removal and electrical rewiring.');
  assert.equal(await area.locator('.ff-guide-result').count(), 0); assert.equal(await area.getByRole('checkbox').isChecked(), false);
  output = { serviceId: 'none', reason: 'This work falls outside the studio packages.', questions: ['Are you looking for a qualified building professional?'], caveat: 'Consult qualified professionals for structural or electrical work.' };
  await area.getByRole('checkbox').check(); await suggest.click();
  await area.getByRole('heading', { name: 'Let’s clarify what you need', exact: true }).waitFor();
  assert.equal(await area.getByRole('button', { name: /Build an estimate for/ }).count(), 0);
  assert.match(await page.locator('.ff-total').innerText(), /\$485/);
  output = { ...output, serviceId: 'electrical-repairs' }; await suggest.click();
  await area.getByRole('alert').filter({ hasText: 'invalid service suggestion' }).waitFor();
  assert.match(await page.locator('.ff-total').innerText(), /\$485/);
  status = 429; output = { error: 'limit' }; await suggest.click();
  await area.getByRole('alert').filter({ hasText: 'shared demo allowance' }).waitFor();
  assert.deepEqual(errors, []);
  console.log('Service guide passed: consent, description-only requests, valid/none/invalid advice, explicit selection, fixed pricing, preserved rooms/add-ons, stale enquiry clearing, estimate scroll/focus, errors, responsive layout and accessibility.');
} finally { await browser.close(); }
