import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterResponses,
  sample,
  summarize,
  toCsv,
} from "../src/survey/data.ts";

test("sample satisfaction matches manually checked counts and mean", () => {
  const result = summarize(sample, "satisfaction");
  assert.equal(result.total, 12);
  assert.equal(result.answered, 10);
  assert.equal(result.missing, 2);
  assert.equal(result.mean, 37 / 10);
  assert.deepEqual(
    result.counts.map((bin) => bin.count),
    [1, 1, 1, 4, 3],
  );
  assert.deepEqual(
    result.counts.map((bin) => bin.percentage),
    [10, 10, 10, 40, 30],
  );
});

test("track and format combine; percentages exclude blanks", () => {
  const rows = filterResponses(sample, "Data", "Online");
  assert.deepEqual(
    rows.map((row) => row.id),
    ["R09", "R10"],
  );
  const result = summarize(rows, "satisfaction");
  assert.equal(result.mean, 4);
  assert.equal(result.answered, 1);
  assert.equal(result.missing, 1);
  assert.equal(result.counts[3].percentage, 100);
});

test("all-missing answers and empty selections never become zero or NaN", () => {
  for (const rows of [filterResponses(sample, "Data", "Online"), []]) {
    const result = summarize(rows, "confidence");
    assert.equal(result.answered, 0);
    assert.equal(result.mean, null);
    assert.ok(
      result.counts.every((bin) => bin.count === 0 && bin.percentage === 0),
    );
  }
});

test("CSV preserves the filtered rows and represents missing ratings as blank", () => {
  assert.equal(
    toCsv(filterResponses(sample, "Data", "Online")),
    "id,track,format,satisfaction,confidence\r\nR09,Data,Online,4,\r\nR10,Data,Online,,\r\n",
  );
});
