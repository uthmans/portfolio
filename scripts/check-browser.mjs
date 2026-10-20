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
assert.equal(await page.locator(".featured-project").count(), 4);
assert.equal(await page.locator("#roadmap").count(), 0);
const offers = page.locator("#services .service-offer");
assert.equal(await offers.count(), 3);
for (const [index, route] of ["business/", "survey/", "hub/"].entries()) {
  const offer = offers.nth(index);
  assert.equal(await offer.locator("ul li").count(), 3);
  assert.equal(await offer.locator("a").first().getAttribute("href"), route);
  const enquiry = new URL(
    await offer.locator(".service-enquiry").getAttribute("href"),
  );
  assert.equal(enquiry.protocol, "mailto:");
  assert.equal(enquiry.pathname, "uthmansalama@gmail.com");
  assert.ok(enquiry.searchParams.get("subject")?.startsWith("Let’s discuss"));
  assert.ok(enquiry.searchParams.get("body")?.startsWith("Hi Uthman,\n\n"));
}
assert.equal(
  await page.getByRole("link", { name: "Try the Project Hub" }).count(),
  1,
);
assert.equal(
  await page.getByRole("link", { name: "Try Form & Field" }).count(),
  1,
);
const opener = page.getByRole("button", {
  name: "Read case study: A portfolio with a purpose",
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
    name: "Read case study: Freelancer Project Hub",
    exact: true,
  })
  .click();
await page
  .getByRole("dialog")
  .getByText("All features in this version", { exact: true })
  .click();
assert.match(
  await page.getByRole("dialog").innerText(),
  /Browser-local saving/,
);
assert.equal(
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Try the demo", exact: true })
    .getAttribute("href"),
  "hub/",
);
await page.keyboard.press("Escape");
for (const [title, route] of [
  ["Survey Insights Studio", "survey/"],
  ["A small business, online", "business/"],
  ["Freelancer Project Hub", "hub/"],
]) {
  await page
    .getByRole("button", { name: `Read case study: ${title}`, exact: true })
    .click();
  const study = page.getByRole("dialog");
  await study.getByRole("link", { name: "Try the demo", exact: true }).focus();
  await page.keyboard.press("Tab");
  assert.equal(
    await study
      .locator("summary")
      .evaluate((element) => element === document.activeElement),
    true,
    "Feature disclosure is reachable by keyboard",
  );
  await page.keyboard.press("Space");
  assert.equal(await study.locator("details").getAttribute("open"), "");
  await page.keyboard.press("Space");
  for (const heading of [
    "The problem",
    "The solution",
    "Try the workflow",
    "My role & AI assistance",
    "Key decisions & limitations",
    "How it was checked",
  ]) {
    assert.equal(
      await study.getByRole("heading", { name: heading, exact: true }).count(),
      1,
    );
  }
  assert.equal(
    await study
      .getByRole("link", { name: "Try the demo", exact: true })
      .getAttribute("href"),
    route,
  );
  assert.equal(await study.locator("ol li").count(), 4);
  await page.setViewportSize({ width: 375, height: 812 });
  assert.equal(
    await study.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
    true,
    `${title}: mobile case study overflow`,
  );
  await page.addScriptTag({
    content: await readFile(
      new URL("../node_modules/axe-core/axe.min.js", import.meta.url),
      "utf8",
    ),
  });
  const studyViolations = await page.evaluate(async () =>
    (await window.axe.run(document.querySelector("dialog"))).violations.map(
      (v) => v.id,
    ),
  );
  assert.deepEqual(studyViolations, [], `${title}: case study accessibility`);
  if (route === "survey/")
    await study.screenshot({ path: "test-results/case-study-mobile.png" });
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1440, height: 1000 });
}
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
await page
  .locator("#services")
  .screenshot({ path: "test-results/services-desktop.png" });
await page
  .locator(".featured-project")
  .first()
  .screenshot({ path: "test-results/homepage-project-card.png" });
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
  .getByRole("navigation", { name: "Main navigation" })
  .getByRole("link", { name: "Services", exact: true })
  .click();
assert.equal(new URL(page.url()).hash, "#services");
assert.equal(await page.locator("#site-navigation").isVisible(), false);
await page
  .locator("#services")
  .screenshot({ path: "test-results/services-mobile.png" });
await menu.click();
await page
  .getByRole("navigation", { name: "Main navigation" })
  .getByRole("link", { name: "About", exact: true })
  .click();
assert.equal(await page.locator("#site-navigation").isVisible(), false);
assert.equal(new URL(page.url()).hash, "#about");
await page
  .getByRole("button", {
    name: "Read case study: Freelancer Project Hub",
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
  "PASS: project dialogs, featured demo links, focus restoration, mobile menu, five viewport widths, reduced motion, no page errors, and axe accessibility checks.",
);
await browser.close();
