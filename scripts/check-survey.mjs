import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  const portfolioUrl =
    process.env.PORTFOLIO_URL || "http://127.0.0.1:5173/portfolio/";
  await page.goto(portfolioUrl);
  await page
    .getByRole("button", { name: "Project details", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("dialog")
      .getByRole("link", { name: "Live demo" })
      .getAttribute("href"),
    "survey/",
  );
  assert.match(
    await page.getByRole("dialog").innerText(),
    /CSV import is not implemented yet/,
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("link", { name: "Try the live demo", exact: true })
    .click();
  const surveyUrl = new URL("survey/", portfolioUrl).href;
  assert.equal(page.url(), surveyUrl);
  assert.match(await page.locator("h1").innerText(), /Survey Insights Studio/);
  assert.match(await page.locator(".summary-grid").innerText(), /3.70/);
  assert.equal(await page.locator("tbody tr").count(), 12);
  await page.getByLabel("Learning track").selectOption("Data");
  await page.getByLabel("Session format").selectOption("Online");
  assert.equal(await page.locator("tbody tr").count(), 2);
  assert.match(
    await page.locator(".results-status").innerText(),
    /1 answered this question · 1 missing/,
  );
  assert.match(await page.locator(".summary-grid").innerText(), /4.00/);
  assert.match(
    await page.locator(".rating-row").nth(3).innerText(),
    /1\s*\(100%\)/,
  );
  await page.getByLabel("Question").selectOption("confidence");
  assert.equal(
    await page
      .getByRole("heading", { name: "No answers for this selection" })
      .isVisible(),
    true,
  );
  assert.equal(await page.locator(".rating-chart").count(), 0);
  assert.match(
    await page.locator(".results-status").innerText(),
    /0 answered this question · 2 missing/,
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download filtered CSV" }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "fictional-survey-responses.csv");
  const csv = await readFile(await download.path(), "utf8");
  assert.equal(
    csv,
    "id,track,format,satisfaction,confidence\r\nR09,Data,Online,4,\r\nR10,Data,Online,,\r\n",
  );
  await page.getByRole("button", { name: "Clear filters" }).click();
  assert.equal(await page.getByLabel("Learning track").inputValue(), "All");
  assert.equal(await page.getByLabel("Session format").inputValue(), "All");
  assert.equal(await page.locator("tbody tr").count(), 12);
  await page.reload();
  assert.equal(await page.getByLabel("Question").inputValue(), "satisfaction");
  await page.getByLabel("Question").focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  assert.equal(await page.getByLabel("Question").inputValue(), "confidence");
  await page.getByLabel("Question").selectOption("satisfaction");
  await page.addScriptTag({
    content: await readFile(
      new URL("../node_modules/axe-core/axe.min.js", import.meta.url),
      "utf8",
    ),
  });
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
      `Survey overflow at ${width}px`,
    );
    if ([375, 1440].includes(width)) {
      const violations = await page.evaluate(async () =>
        (await window.axe.run()).violations.map(({ id, nodes }) => ({
          id,
          nodes: nodes.map((node) => ({
            target: node.target,
            summary: node.failureSummary,
          })),
        })),
      );
      assert.deepEqual(violations, [], `Survey accessibility at ${width}px`);
      await page.evaluate(() => {
        document.activeElement.blur();
        window.scrollTo({ top: 0, behavior: "instant" });
      });
      await page.screenshot({
        path: `test-results/survey-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page.getByRole("link", { name: "Uthman’s portfolio" }).click();
  assert.equal(page.url(), portfolioUrl);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: live-demo navigation, filtered calculations, missing-answer state, real CSV download, clearing filters, direct reload, keyboard controls, five widths, and axe accessibility.",
  );
} finally {
  await browser.close();
}
