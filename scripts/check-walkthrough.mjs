import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const base = process.env.PORTFOLIO_URL || "http://127.0.0.1:4174/portfolio/";
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const requests = [],
    errors = [];
  page.on("request", (r) => {
    if (r.url().endsWith("portfolio-walkthrough.mp4")) requests.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  const video = page.locator(".walkthrough video");
  assert.equal(await video.count(), 1);
  assert.equal(await video.evaluate((v) => v.autoplay), false);
  assert.equal(await video.evaluate((v) => v.paused), true);
  assert.equal(await video.getAttribute("preload"), "none");
  assert.equal(
    requests.length,
    0,
    "Video bytes must not load before a visitor chooses playback",
  );
  const poster = new URL(await video.getAttribute("poster"), base).href;
  assert.equal((await page.request.get(poster)).status(), 200);
  const track = new URL(await video.locator("track").getAttribute("src"), base)
    .href;
  assert.match(await (await page.request.get(track)).text(), /^WEBVTT/);
  await page
    .locator(".walkthrough")
    .screenshot({ path: "test-results/portfolio-walkthrough-desktop.png" });
  await video.scrollIntoViewIfNeeded();
  await video.focus();
  await page.keyboard.press("Space");
  await page.waitForFunction(() => {
    const v = document.querySelector(".walkthrough video");
    return !v.paused && v.currentTime > 0.1;
  });
  assert.ok(
    Math.abs((await video.evaluate((v) => v.duration)) - 40.7333) < 0.1,
  );
  await video.evaluate((v) => {
    v.pause();
    v.textTracks[0].mode = "showing";
  });
  await page.waitForFunction(
    () =>
      document.querySelector(".walkthrough video").textTracks[0].cues
        ?.length === 10,
  );
  await video.evaluate(
    (v) =>
      new Promise((resolve) => {
        v.addEventListener("seeked", resolve, { once: true });
        v.currentTime = 36;
      }),
  );
  await page.waitForTimeout(200);
  assert.equal(await video.evaluate((v) => v.error), null);
  await video.screenshot({
    path: "test-results/portfolio-walkthrough-playing.png",
  });
  await video.evaluate((v) => {
    v.textTracks[0].mode = "disabled";
  });
  await page.getByText("Read the video transcript", { exact: true }).click();
  assert.match(
    await page.locator(".walkthrough-transcript").innerText(),
    /My background is in technology coordination/,
  );
  await page.addScriptTag({
    content: await readFile(
      new URL("../node_modules/axe-core/axe.min.js", import.meta.url),
      "utf8",
    ),
  });
  const violations = await page.evaluate(async () =>
    (
      await window.axe.run(document.querySelector(".walkthrough"))
    ).violations.map((v) => ({ id: v.id, impact: v.impact })),
  );
  assert.deepEqual(violations, []);
  await page.getByText("Read the video transcript", { exact: true }).click();
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `No overflow at ${width}px`,
    );
    const bounds = await video.boundingBox();
    assert.ok(
      Math.abs(bounds.width / bounds.height - 16 / 9) < 0.01,
      "Player keeps its aspect ratio",
    );
    if (width === 375)
      await page
        .locator(".walkthrough")
        .screenshot({ path: "test-results/portfolio-walkthrough-mobile.png" });
  }
  await page.getByRole("link", { name: "Try the demos below" }).click();
  assert.equal(new URL(page.url()).hash, "#project-survey");
  assert.equal(
    await page.locator("#project-survey h3").innerText(),
    "Survey Insights Studio",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: click-to-load playback, keyboard controls, duration, captions, seeking, transcript, demo anchor, five screen widths and accessibility.",
  );
} finally {
  await browser.close();
}
