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
  const businessUrl = new URL("business/", portfolioUrl).href;
  async function assertEstimatePosition(service) {
    await page.waitForFunction(() => {
      const section = document.getElementById("estimate");
      if (!section) return false;
      const top = section.getBoundingClientRect().top;
      return top >= 0 && top <= 30;
    });
    assert.equal(
      await page.getByLabel("Choose a service", { exact: true }).inputValue(),
      service,
    );
    assert.equal(new URL(page.url()).hash, "#estimate");
  }
  await page.goto(portfolioUrl);
  await page
    .getByRole("button", { name: "Business project details", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("dialog")
      .getByRole("link", { name: "Live demo" })
      .getAttribute("href"),
    "business/",
  );
  assert.match(
    await page.getByRole("dialog").innerText(),
    /no enquiry, booking, or payment is sent/i,
  );
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Try Form & Field" }).click();
  assert.equal(page.url(), businessUrl);
  assert.match(await page.locator("h1").innerText(), /Make room/);
  assert.match(
    await page
      .getByRole("navigation", { name: "Portfolio navigation" })
      .innerText(),
    /Fictional business demo/,
  );
  assert.match(await page.locator(".ff-total").innerText(), /\$180/);
  for (const slug of ["room-planning", "styling", "workspace"]) {
    await page.goto(`${businessUrl}services/${slug}/`);
    await page.reload();
    assert.equal(await page.locator("h1").count(), 1);
    assert.match(
      await page.locator(".ff-service-detail").innerText(),
      /No service can be purchased or booked/,
    );
    if (slug === "styling") {
      await page.getByRole("link", { name: "Estimate this service" }).click();
      await assertEstimatePosition(slug);
      assert.equal(
        await page.getByLabel("Choose a service", { exact: true }).inputValue(),
        "styling",
      );
      assert.match(await page.locator(".ff-total").innerText(), /\$120/);
    }
  }
  // Cross-page anchors must scroll after React mounts, including on a cold load
  // with delayed fonts. Check both service CTAs and preserve service selection.
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    for (const slug of ["room-planning", "styling", "workspace"]) {
      for (const name of ["Build a demo estimate", "Estimate this service"]) {
        await page.goto(`${businessUrl}services/${slug}/`);
        await page.getByRole("link", { name, exact: true }).click();
        await assertEstimatePosition(slug);
      }
    }
  }
  const coldContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const coldPage = await coldContext.newPage();
  await coldPage.route("**/*.woff2", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.continue();
  });
  await coldPage.goto(`${businessUrl}?service=styling#estimate`);
  await coldPage.evaluate(() => document.fonts.ready);
  await coldPage.waitForFunction(() => {
    const top = document.getElementById("estimate")?.getBoundingClientRect().top;
    return top !== undefined && top >= 0 && top <= 30;
  });
  await coldPage.reload();
  await coldPage.waitForFunction(() => {
    const top = document.getElementById("estimate")?.getBoundingClientRect().top;
    return top !== undefined && top >= 0 && top <= 30;
  });
  await coldContext.close();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(businessUrl);
  await page
    .getByLabel("Choose a service", { exact: true })
    .selectOption("workspace");
  await page.getByLabel("Number of rooms", { exact: true }).selectOption("2");
  await page.getByRole("checkbox", { name: /Color palette/ }).check();
  await page.getByRole("checkbox", { name: /Shopping shortlist/ }).check();
  assert.match(await page.locator(".ff-total").innerText(), /\$560/);
  assert.equal(await page.locator(".ff-quote-result dl > div").count(), 3);
  await page.getByRole("checkbox", { name: /Color palette/ }).uncheck();
  assert.match(await page.locator(".ff-total").innerText(), /\$515/);
  await page.getByRole("button", { name: "Preview enquiry" }).click();
  assert.equal(await page.getByRole("alert").isVisible(), true);
  assert.equal(
    await page
      .getByLabel("Name", { exact: true })
      .evaluate((element) => element === document.activeElement),
    true,
  );
  assert.equal(await page.locator(".ff-enquiry-preview").count(), 0);
  await page.getByRole("button", { name: "Fill with sample details" }).click();
  await page.getByLabel("Email", { exact: true }).fill("invalid");
  await page.getByRole("button", { name: "Preview enquiry" }).click();
  assert.match(await page.getByRole("alert").innerText(), /name@example.com/);
  await page.getByRole("button", { name: "Fill with sample details" }).click();
  await page.getByRole("button", { name: "Preview enquiry" }).click();
  assert.equal(await page.getByRole("alert").count(), 0);
  assert.match(
    await page.locator(".ff-enquiry-preview").innerText(),
    /Local enquiry preview — not sent/,
  );
  assert.match(
    await page.locator(".ff-enquiry-preview").innerText(),
    /\$515 USD/,
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download enquiry preview" }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "form-and-field-demo-enquiry.txt");
  const text = await readFile(await download.path(), "utf8");
  assert.match(text, /DEMO ENQUIRY \/ NOT SENT/);
  assert.match(text, /Total: \$515 USD/);
  await page.getByLabel("Number of rooms", { exact: true }).selectOption("3");
  assert.equal(await page.locator(".ff-enquiry-preview").count(), 0);
  await page.getByLabel("Choose a service", { exact: true }).focus();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Tab");
  assert.equal(
    await page.getByLabel("Choose a service", { exact: true }).inputValue(),
    "styling",
  );
  await page.goto(businessUrl);
  await page.evaluate(() => document.fonts.ready);
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
      `Business overflow at ${width}px`,
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
      assert.deepEqual(violations, [], `Business accessibility at ${width}px`);
      await page.evaluate(() => {
        document.activeElement.blur();
        window.scrollTo({ top: 0, behavior: "instant" });
      });
      await page.screenshot({
        path: `test-results/business-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  assert.equal(
    await page
      .getByRole("navigation", { name: "Business navigation" })
      .isVisible(),
    true,
  );
  await page
    .getByRole("navigation", { name: "Business navigation" })
    .getByRole("link", { name: "Services", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("navigation", { name: "Business navigation" })
      .isVisible(),
    false,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
    "auto",
  );
  await page.reload();
  assert.equal(await page.getByLabel("Name", { exact: true }).inputValue(), "");
  for (const slug of ["room-planning", "styling", "workspace"]) {
    await page.goto(`${businessUrl}services/${slug}/`);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
      `${slug} mobile overflow`,
    );
    await page.addScriptTag({
      content: await readFile(
        new URL("../node_modules/axe-core/axe.min.js", import.meta.url),
        "utf8",
      ),
    });
    const violations = await page.evaluate(async () =>
      (await window.axe.run()).violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map((node) => node.target),
      })),
    );
    assert.deepEqual(violations, [], `${slug} accessibility`);
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: business demo navigation, three service pages/direct reload, both estimate CTAs on desktop/mobile, cold-load and reload anchor positioning, query-selected service, quote rules, validation/focus, honest preview/download, stale-preview removal, mobile menu, five widths, reduced motion, and accessibility.",
  );
} finally {
  await browser.close();
}
