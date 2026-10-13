import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateQuote,
  enquiryText,
  validateEnquiry,
  type Enquiry,
} from "../src/business/model.ts";

test("service prices and room multiplication match the published demo rules", () => {
  assert.equal(calculateQuote("room-planning", 1, []).total, 180);
  assert.equal(calculateQuote("styling", 2, []).total, 240);
  assert.equal(calculateQuote("workspace", 5, []).total, 1100);
});
test("add-ons are charged once per project and itemized, without hidden charges", () => {
  const quote = calculateQuote("room-planning", 3, [
    "palette",
    "shopping",
    "call",
  ]);
  assert.equal(quote.total, 690);
  assert.deepEqual(
    quote.lines.map((line) => line.amount),
    [540, 45, 75, 30],
  );
  assert.equal(
    calculateQuote("workspace", 2, ["palette", "shopping"]).total,
    560,
  );
  assert.equal(calculateQuote("styling", 2, ["call"]).total, 270);
});
test("invalid room counts, unknown options, and duplicated add-ons are rejected", () => {
  for (const rooms of [0, 6, 1.5, NaN, Infinity])
    assert.throws(() => calculateQuote("room-planning", rooms, []));
  assert.throws(() => calculateQuote("unknown" as never, 1, []));
  assert.throws(() => calculateQuote("styling", 1, ["unknown" as never]));
  assert.throws(() => calculateQuote("styling", 1, ["palette", "palette"]));
});
const valid: Enquiry = {
  name: " Alex Sample ",
  email: " alex@example.com ",
  brief:
    "An imaginary living room needs a clearer furniture layout and a reading corner.",
  consent: true,
};
test("enquiry validation identifies all required fields and honors boundaries", () => {
  assert.deepEqual(validateEnquiry(valid), {});
  assert.deepEqual(
    Object.keys(
      validateEnquiry({
        name: "",
        email: "not-an-email",
        brief: "Too short",
        consent: false,
      }),
    ),
    ["name", "email", "brief", "consent"],
  );
  assert.ok(validateEnquiry({ ...valid, name: "a".repeat(81) }).name);
  assert.ok(validateEnquiry({ ...valid, brief: "x".repeat(1201) }).brief);
  assert.deepEqual(
    validateEnquiry({ ...valid, name: "ab", brief: "x".repeat(20) }),
    {},
  );
});
test("downloaded enquiry is explicitly a local demo and uses the exact estimate", () => {
  const text = enquiryText(valid, calculateQuote("styling", 2, ["call"]));
  assert.match(text, /DEMO ENQUIRY \/ NOT SENT/);
  assert.match(text, /Name: Alex Sample/);
  assert.match(text, /Total: \$270 USD/);
  assert.match(
    text,
    /No message, booking, payment, or real quote has been sent/,
  );
});
