import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox"],
});
const base = process.env.PORTFOLIO_URL || "http://127.0.0.1:5173/portfolio/";
const url = new URL("hub/", base).href;
const key = "uthman-freelancer-hub-v1";
await mkdir("test-results", { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(base);
  await page
    .getByRole("button", { name: "Hub project details", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("dialog")
      .getByRole("link", { name: "Live demo" })
      .getAttribute("href"),
    "hub/",
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("link", { name: "Try the Project Hub", exact: true })
    .click();
  assert.equal(page.url(), url);
  assert.equal(await page.locator(".hub-project").count(), 3);
  assert.match(await page.locator(".hub-summary").innerText(), /\$2,650.00/);
  assert.match(await page.locator(".hub-summary").innerText(), /\$1,150.00/);
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  assert.equal(
    await page
      .getByLabel("Project name", { exact: true })
      .getAttribute("aria-invalid"),
    "true",
  );
  assert.equal(
    await page
      .getByLabel("Project name", { exact: true })
      .evaluate((e) => e === document.activeElement),
    true,
  );
  await page
    .getByLabel("Project name", { exact: true })
    .fill("A test workspace");
  await page
    .getByLabel("Client / organisation", { exact: true })
    .fill("Example client");
  await page.getByLabel("Budget (USD)", { exact: true }).fill("1250.50");
  await page.getByLabel("Spent (USD)", { exact: true }).fill("25.10");
  await page
    .getByLabel("Due date (optional)", { exact: true })
    .fill("2020-01-01");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  assert.equal(await page.locator(".hub-project").count(), 4);
  assert.match(
    await page.locator(".hub-notice").innerText(),
    /Saved in this browser/,
  );
  await page.getByLabel("Search projects or clients").fill("example client");
  assert.equal(await page.locator(".hub-project").count(), 1);
  assert.match(await page.locator(".hub-summary").innerText(), /\$1,250.50/);
  assert.match(await page.locator(".hub-project").innerText(), /Overdue/);
  await page
    .getByLabel("New task for A test workspace", { exact: true })
    .fill("Check the workflow");
  await page
    .getByRole("button", { name: "Add task to A test workspace", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Check the workflow", exact: true })
    .check();
  assert.match(
    await page.locator(".hub-task-heading").innerText(),
    /1 \/ 1 done/,
  );
  await page
    .getByLabel("Stage for A test workspace", { exact: true })
    .selectOption("Complete");
  assert.match(
    await page.locator(".hub-summary").innerText(),
    /Active projects\s*0/,
  );
  await page
    .getByRole("checkbox", { name: "Overdue only", exact: true })
    .check();
  assert.equal(await page.locator(".hub-project").count(), 0);
  assert.equal(
    await page
      .getByRole("heading", { name: "No projects match these filters." })
      .isVisible(),
    true,
  );
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .first()
    .click();
  await page.reload();
  const saved = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)),
    key,
  );
  assert.equal(saved.projects.length, 4);
  assert.equal(saved.projects.at(-1).tasks[0].done, true);
  assert.equal(saved.projects.at(-1).stage, "Complete");
  await page
    .getByRole("button", { name: "Edit A test workspace", exact: true })
    .click();
  await page
    .getByLabel("Project name", { exact: true })
    .fill("Updated test workspace");
  await page.getByLabel("Spent (USD)", { exact: true }).fill("1300");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  const card = page.locator(".hub-project").filter({
    has: page.getByRole("heading", {
      name: "Updated test workspace",
      exact: true,
    }),
  });
  assert.match(await card.innerText(), /Over budget\s*\$49.50/);
  assert.equal(
    await card
      .getByRole("checkbox", { name: "Check the workflow", exact: true })
      .isChecked(),
    true,
  );
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download backup", exact: true })
    .click();
  const download = await downloadPromise;
  const backup = await readFile(await download.path());
  assert.equal(JSON.parse(backup.toString()).projects.length, 4);
  await page.getByLabel("Restore a backup", { exact: true }).setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":1,"projects":[{"title":"bad"}]}'),
  });
  assert.match(
    await page.getByRole("alert").innerText(),
    /current workspace has not changed/,
  );
  assert.equal(await page.locator(".hub-project").count(), 4);
  await page
    .getByRole("button", {
      name: "Delete project Updated test workspace",
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  assert.equal(await card.count(), 1);
  await page
    .getByRole("button", {
      name: "Delete project Updated test workspace",
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete project", exact: true })
    .click();
  assert.equal(await page.locator(".hub-project").count(), 3);
  await page.getByLabel("Restore a backup", { exact: true }).setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: backup,
  });
  assert.equal(await page.locator(".hub-project").count(), 3);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Replace workspace", exact: true })
    .click();
  assert.equal(await page.locator(".hub-project").count(), 4);
  await page.reload();
  assert.equal(await page.locator(".hub-project").count(), 4);
  await page.getByLabel("Restore a backup", { exact: true }).setInputFiles({
    name: "empty.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":1,"projects":[]}'),
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Replace workspace", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("heading", { name: "A clear space for your next project." })
      .isVisible(),
    true,
  );
  await page
    .getByRole("button", { name: "Reset to fictional sample", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Restore sample", exact: true })
    .click();
  assert.equal(await page.locator(".hub-project").count(), 3);
  await page
    .getByLabel("Project stage", { exact: true })
    .selectOption("In progress");
  assert.equal(await page.locator(".hub-project").count(), 1);
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  const axe = await readFile(
    new URL("../node_modules/axe-core/axe.min.js", import.meta.url),
    "utf8",
  );
  await page.addScriptTag({ content: axe });
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `Overflow at ${width}`,
    );
    if ([375, 1440].includes(width)) {
      const violations = await page.evaluate(async () =>
        (await window.axe.run()).violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      );
      assert.deepEqual(violations, [], `Axe at ${width}`);
      await page.screenshot({
        path: `test-results/hub-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page.getByRole("button", { name: "New project", exact: true }).click();
  assert.equal(
    await page
      .getByLabel("Project name", { exact: true })
      .evaluate((e) => e === document.activeElement),
    true,
  );
  assert.deepEqual(
    await page.evaluate(async () =>
      (await window.axe.run()).violations.map((v) => v.id),
    ),
    [],
    "Editor accessibility",
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  assert.equal(
    await page
      .getByRole("button", { name: "New project", exact: true })
      .evaluate((e) => e === document.activeElement),
    true,
  );
  await page
    .getByRole("navigation", { name: "Portfolio navigation" })
    .getByRole("link", { name: "Back to portfolio", exact: true })
    .click();
  assert.equal(page.url(), base);
  assert.deepEqual(errors, []);
  const blocked = await browser.newContext();
  await blocked.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new Error("Storage unavailable");
    };
  });
  const bp = await blocked.newPage();
  await bp.goto(url);
  await bp
    .getByRole("checkbox", {
      name: "Build the estimate calculator",
      exact: true,
    })
    .check();
  assert.match(await bp.getByRole("alert").innerText(), /could not be saved/);
  assert.equal(
    await bp
      .getByRole("checkbox", {
        name: "Build the estimate calculator",
        exact: true,
      })
      .isChecked(),
    true,
  );
  await blocked.close();
  const corrupt = await browser.newContext();
  await corrupt.addInitScript(
    ({ key }) => localStorage.setItem(key, "broken-json"),
    { key },
  );
  const cp = await corrupt.newPage();
  await cp.goto(url);
  assert.equal(await cp.locator(".hub-project").count(), 3);
  assert.match(
    await cp.locator(".hub-notice").innerText(),
    /could not be loaded/,
  );
  assert.equal(
    await cp.evaluate((k) => localStorage.getItem(k), key),
    "broken-json",
  );
  await corrupt.close();
  console.log(
    "PASS: hub CRUD, field validation/focus, exact budgets, tasks/stages, filters and totals, saved-state reload, real backup download and restore, invalid-file preservation, confirmed delete/reset, empty states, storage failures, five widths, modal keyboard focus and accessibility.",
  );
} finally {
  await browser.close();
}
