import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const base = process.env.PORTFOLIO_URL || "http://127.0.0.1:4174/portfolio/";
let requests = [];
let failure = true;
await page.route("https://formspree.io/f/**", async (route) => {
  requests.push(route.request().postDataJSON());
  await new Promise((resolve) => setTimeout(resolve, 200));
  await route.fulfill({
    status: failure ? 503 : 200,
    contentType: "application/json",
    body: JSON.stringify(failure ? { error: "unavailable" } : { ok: true }),
  });
});
await page.goto(base);
await page
  .getByRole("link", { name: "Discuss your website", exact: true })
  .click();
const form = page.locator(".enquiry-form");
assert.equal(new URL(page.url()).hash, "#contact");
assert.equal(await form.locator("select").inputValue(), "websites");
await form.getByRole("button", { name: "Send enquiry" }).click();
assert.equal(requests.length, 0, "Empty form must not send");
await form.getByLabel("Your name", { exact: false }).fill("Demo Visitor");
await form
  .getByLabel("Email address", { exact: false })
  .fill("visitor@example.com");
await form
  .locator("textarea")
  .fill("I need a clear website for a fictional bakery.");
await page
  .getByRole("link", { name: "Discuss your data tool", exact: true })
  .click();
assert.equal(await form.locator("select").inputValue(), "data-tools");
assert.equal(
  await form.locator("textarea").inputValue(),
  "I need a clear website for a fictional bakery.",
  "Changing service preserves the draft",
);
await form.getByRole("button", { name: "Send enquiry" }).click();
await page.getByRole("alert").waitFor();
assert.match(await page.getByRole("alert").innerText(), /couldn’t confirm/);
assert.equal(
  await form.locator('input[name="email"]').inputValue(),
  "visitor@example.com",
);
assert.equal(await form.locator(".enquiry-success").count(), 0);
failure = false;
await form.getByRole("button", { name: "Send enquiry" }).click();
await form.locator(".enquiry-success").waitFor();
assert.equal(requests.length, 2);
assert.equal(requests[1].service, "Dashboards & data tools");
assert.equal(requests[1].email, "visitor@example.com");
assert.equal(await page.getByRole("alert").count(), 0);
assert.equal(
  await form.getByRole("button", { name: "Message sent" }).isDisabled(),
  true,
);
assert.equal(
  new URL(page.url()).origin,
  new URL(base).origin,
  "Submission stays on the portfolio",
);
await page.screenshot({
  path: "test-results/contact-success.png",
  fullPage: false,
});
await browser.close();
console.log(
  "PASS: service prefill, draft preservation, required fields, failed delivery, confirmed submission and no navigation. Delivery responses mocked; no email sent.",
);
