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
    /Invalid files preserve the current dataset/,
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
  await page
    .getByText("Required CSV format & example", { exact: true })
    .click();
  const examplePromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download example CSV", exact: true })
    .click();
  const example = await examplePromise;
  assert.equal(example.suggestedFilename(), "survey-example.csv");
  assert.equal(
    (await readFile(await example.path(), "utf8")).split("\r\n").filter(Boolean)
      .length,
    13,
  );
  assert.equal(await page.locator("tbody tr").count(), 12);

  const valid =
    "\uFEFFconfidence,format,id,satisfaction,track\r\n1,Online,A1,5,Data\r\n,In person,B2,1,Websites\r\n4,Online,C3,,Data\r\n";
  const fileInput = page.getByLabel("Choose CSV file", { exact: true });
  await fileInput.setInputFiles({
    name: "feedback.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(valid),
  });
  await page
    .getByText("Imported 3 responses from feedback.csv. Filters reset.", {
      exact: true,
    })
    .waitFor();
  assert.match(await page.locator(".sample-badge").innerText(), /Imported CSV/);
  assert.equal(await page.locator("tbody tr").count(), 3);
  assert.match(await page.locator(".summary-grid").innerText(), /3.00/);
  await page.getByLabel("Learning track").selectOption("Data");
  await page.getByLabel("Session format").selectOption("Online");
  assert.match(await page.locator(".summary-grid").innerText(), /5.00/);

  await fileInput.setInputFiles({
    name: "invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "id,track,format,satisfaction,confidence\nR1,Data,Online,5,4\nR1,Data,Online,6,4\n",
    ),
  });
  await page.getByRole("alert").waitFor();
  assert.match(await page.getByRole("alert").innerText(), /Line 3.*duplicated/);
  assert.match(await page.getByRole("alert").innerText(), /satisfaction must/);
  assert.equal(await page.getByLabel("Learning track").inputValue(), "Data");
  assert.equal(await page.getByLabel("Session format").inputValue(), "Online");
  assert.equal(await page.locator("tbody tr").count(), 2);
  assert.match(await page.locator(".summary-grid").innerText(), /5.00/);
  await fileInput.setInputFiles({
    name: "invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(valid),
  });
  await page
    .getByText("Imported 3 responses from invalid.csv. Filters reset.", {
      exact: true,
    })
    .waitFor();
  assert.equal(await page.getByRole("alert").count(), 0);

  await page.getByLabel("Number of responses", { exact: true }).fill("150");
  await page
    .getByRole("button", { name: "Generate fictional dataset", exact: true })
    .click();
  assert.match(
    await page.locator(".results-status").innerText(),
    /Showing 150 of 150/,
  );
  assert.equal(await page.locator("tbody tr").count(), 100);
  assert.match(await page.locator("caption").innerText(), /showing 100 of 150/);
  await page.getByLabel("Number of responses", { exact: true }).fill("9");
  await page
    .getByRole("button", { name: "Generate fictional dataset", exact: true })
    .click();
  assert.match(await page.getByRole("alert").innerText(), /10 to 1,000/);
  assert.match(
    await page.locator(".results-status").innerText(),
    /Showing 150 of 150/,
  );
  const generatedPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download filtered CSV" }).click();
  const generatedDownload = await generatedPromise;
  const generatedCsv = await readFile(await generatedDownload.path(), "utf8");
  const generatedRecords = generatedCsv.trim().split("\r\n").slice(1);
  assert.equal(generatedRecords.length, 150);
  const generatedRatings = generatedRecords
    .map((row) => row.split(",")[3])
    .filter(Boolean)
    .map(Number);
  const manualMean = generatedRatings.length
    ? (
        generatedRatings.reduce((sum, value) => sum + value, 0) /
        generatedRatings.length
      ).toFixed(2)
    : "—";
  assert.ok(
    (await page.locator(".summary-grid").innerText()).includes(manualMean),
  );
  await fileInput.setInputFiles({
    name: "generated.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(generatedCsv),
  });
  await page
    .getByText("Imported 150 responses from generated.csv. Filters reset.", {
      exact: true,
    })
    .waitFor();
  assert.ok(
    (await page.locator(".summary-grid").innerText()).includes(manualMean),
  );
  assert.equal(await page.locator("tbody tr").count(), 100);
  const importedPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download filtered CSV" }).click();
  const importedDownload = await importedPromise;
  assert.equal(
    importedDownload.suggestedFilename(),
    "imported-survey-responses.csv",
  );
  assert.equal(
    await readFile(await importedDownload.path(), "utf8"),
    generatedCsv,
  );

  await page
    .getByRole("button", { name: "Reset to sample", exact: true })
    .click();
  assert.equal(await page.locator("tbody tr").count(), 12);
  assert.match(await page.locator(".summary-grid").innerText(), /3.70/);
  await fileInput.setInputFiles({
    name: "bad-encoding.csv",
    mimeType: "text/csv",
    buffer: Buffer.from([0xff, 0xfe, 0x00]),
  });
  await page.getByRole("alert").waitFor();
  assert.match(await page.getByRole("alert").innerText(), /UTF-8/);
  assert.equal(await page.locator("tbody tr").count(), 12);
  // Include the open format guide and validation alert in accessibility/reflow checks.
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
    "PASS: survey calculations, CSV guide/example, valid and invalid imports, preserved filters/data, random generation, full CSV round-trip, preview limits, reset, encoding errors, five widths, and axe accessibility.",
  );
} finally {
  await browser.close();
}
