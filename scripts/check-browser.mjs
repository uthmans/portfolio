import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const resourceErrors = [];
page.on("pageerror", (error) => errors.push(error.message));
const base = process.env.PORTFOLIO_URL || "http://127.0.0.1:5173/portfolio/";
page.on("response", (response) => {
  if (
    response.status() >= 400 &&
    new URL(response.url()).origin === new URL(base).origin
  ) {
    resourceErrors.push(`${response.status()} ${response.url()}`);
  }
});
await page.goto(base);
const favicon = await page.locator('link[rel="icon"]').getAttribute("href");
assert.ok(
  favicon?.startsWith("/portfolio/"),
  "Favicon uses the Pages base path",
);
assert.equal(
  (await page.request.get(new URL(favicon, base).href)).status(),
  200,
);
await page.evaluate(() => document.fonts.ready);
assert.equal(await page.locator("h1").count(), 1);
assert.equal(await page.locator(".roadmap-card").count(), 3);
await page
  .getByRole("button", { name: "Data exploration", exact: true })
  .click();
assert.equal(await page.locator(".roadmap-card").count(), 1);
assert.match(
  await page.locator(".roadmap-card h3").innerText(),
  /Survey Insights Studio/,
);
await page.getByRole("button", { name: "All concepts", exact: true }).click();
assert.equal(await page.locator(".roadmap-card").count(), 3);
const opener = page.getByRole("button", {
  name: "Explore the project",
  exact: true,
});
await opener.click();
assert.equal(await page.getByRole("dialog").isVisible(), true);
assert.equal(
  await page.getByRole("dialog").getAttribute("aria-labelledby"),
  "project-detail-title",
);
await page.keyboard.press("Tab");
assert.equal(
  await page.evaluate(() =>
    document.querySelector("dialog").contains(document.activeElement),
  ),
  true,
);
await page.keyboard.press("Escape");
assert.equal(await page.getByRole("dialog").count(), 0);
assert.equal(
  await opener.evaluate((element) => element === document.activeElement),
  true,
);
await page
  .getByRole("button", {
    name: "Concept preview: View plan for Survey Insights Studio",
  })
  .click();
assert.match(await page.getByRole("dialog").innerText(), /Planned features/);
assert.equal(await page.getByRole("dialog").getByRole("link").count(), 0);
await page.getByRole("button", { name: "Close project details" }).click();
await page.getByRole("button", { name: /Further ahead/ }).click();
assert.match(
  await page.getByRole("dialog").innerText(),
  /No chatbot or AI connection exists yet/,
);
await page.keyboard.press("Escape");
assert.equal(await page.locator('a[href=""], a[href="mailto:"]').count(), 0);
assert.equal(
  await page.getByRole("link", { name: "Say hello" }).getAttribute("href"),
  "mailto:uthmansalama@gmail.com",
);
assert.equal(await page.getByText("Contact details coming soon").count(), 0);
await page.addScriptTag({
  content: await readFile(
    new URL("../node_modules/axe-core/axe.min.js", import.meta.url),
    "utf8",
  ),
});
const violations = await page.evaluate(async () =>
  (await window.axe.run()).violations.map(({ id, impact, nodes }) => ({
    id,
    impact,
    nodes: nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
  })),
);
console.log("Desktop accessibility:", JSON.stringify(violations));
await page.evaluate(() => {
  document.activeElement.blur();
  window.scrollTo({ top: 0, behavior: "instant" });
});
await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
for (const width of [320, 375, 768, 1024, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
    `Overflow at ${width}px`,
  );
}
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(base);
const menu = page.getByRole("button", { name: /Menu/ });
await menu.click();
assert.equal(await page.locator("#site-navigation").isVisible(), true);
await page
  .getByRole("navigation")
  .getByRole("link", { name: "About", exact: true })
  .click();
assert.equal(await page.locator("#site-navigation").isVisible(), false);
assert.equal(new URL(page.url()).hash, "#about");
await page
  .getByRole("button", {
    name: "Concept preview: View plan for Freelancer Project Hub",
  })
  .click();
assert.equal(await page.getByRole("dialog").isVisible(), true);
await page.keyboard.press("Escape");
await page.emulateMedia({ reducedMotion: "reduce" });
assert.equal(
  await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  ),
  "auto",
);
await page.goto(base);
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => {
  document.activeElement.blur();
  window.scrollTo({ top: 0, behavior: "instant" });
});
await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
await page.addScriptTag({
  content: await readFile(
    new URL("../node_modules/axe-core/axe.min.js", import.meta.url),
    "utf8",
  ),
});
const mobileViolations = await page.evaluate(async () =>
  (await window.axe.run()).violations.map(({ id, impact, nodes }) => ({
    id,
    impact,
    nodes: nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
  })),
);
console.log("Mobile accessibility:", JSON.stringify(mobileViolations));
assert.deepEqual(errors, []);
assert.deepEqual(resourceErrors, []);
assert.deepEqual(violations, []);
assert.deepEqual(mobileViolations, []);
console.log(
  "PASS: project dialogs, focus restoration, filters, mobile menu, five viewport widths, reduced motion, no page errors, and axe accessibility checks.",
);
await browser.close();
