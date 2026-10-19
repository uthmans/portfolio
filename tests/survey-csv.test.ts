import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, MAX_ROWS, MAX_FILE_BYTES } from "../src/survey/csv.ts";
import { generateResponses } from "../src/survey/generate.ts";
import { sample, summarize, toCsv } from "../src/survey/data.ts";

const header = "id,track,format,satisfaction,confidence\n";

test("a generated 15-response dataset includes analysable comments and exports them in the same CSV", () => {
  const rows = generateResponses(15, 42);
  assert.equal(rows.length, 15);
  assert.ok(rows.every(row => typeof row.feedback === "string" && row.feedback.trim().length > 0 && row.feedback.length <= 1000));
  assert.match(toCsv(rows), /^id,track,format,satisfaction,confidence,feedback\r\n/);
  assert.deepEqual(parseCsv(toCsv(rows)), { ok: true, rows });
});

test("optional feedback shares the ratings CSV and survives quoting, filtering and export", () => {
  const parsed = parseCsv('id,track,format,satisfaction,confidence,feedback\r\nA,Data,Online,5,4,"Useful, but please add ""notes"".\nMore practice too."\r\nB,Websites,Online,3,2,\r\n');
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.rows[0].feedback, 'Useful, but please add "notes".\nMore practice too.');
  assert.deepEqual(parseCsv(toCsv(parsed.rows)), parsed);
  assert.equal(parseCsv('id,track,format,satisfaction,confidence,feedback\nA,Data,Online,5,4,' + 'x'.repeat(1001)).ok, false);
});
function errors(text: string) {
  const result = parseCsv(text);
  assert.equal(result.ok, false);
  if (result.ok) throw new Error("Expected invalid input");
  return result.errors.join("\n");
}

test("sample exports and imports losslessly, with the same calculations", () => {
  const result = parseCsv(toCsv(sample));
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("Import failed");
  assert.deepEqual(result.rows, sample);
  assert.equal(summarize(result.rows, "satisfaction").mean, 3.7);
});

test("accepts BOM, reordered quoted headers, CRLF, whitespace, and missing ratings", () => {
  const result = parseCsv(
    '\uFEFF"confidence",format,id,satisfaction,track\r\n 3 ,"In person",R01,,"Data"\r\n\r\n',
  );
  assert.deepEqual(result, {
    ok: true,
    rows: [
      {
        id: "R01",
        track: "Data",
        format: "In person",
        satisfaction: null,
        confidence: 3,
      },
    ],
  });
});

test("headers and empty files get actionable errors", () => {
  assert.match(errors("  \n"), /empty/);
  assert.match(errors(header), /no response rows/);
  assert.match(
    errors("id,track,format,satisfaction,satisfaction\n"),
    /five headers/,
  );
  assert.match(
    errors("ID,track,format,satisfaction,confidence\n"),
    /case-sensitive/,
  );
  assert.match(errors(header.replace(/,/g, ";")), /five headers/);
});

test("all rows must pass: duplicate IDs, invalid categories, and invalid ratings reject the whole CSV", () => {
  const text = header + "R1,Data,Online,4,\nR1,data,Remote,0,3.5\n";
  const message = errors(text);
  assert.match(message, /Line 3.*duplicated/);
  assert.match(message, /track must/);
  assert.match(message, /format must/);
  assert.match(message, /satisfaction must/);
  assert.match(message, /confidence must/);
  for (const value of ["NaN", "N/A", "Infinity", "1e0", "2.0", "-1", "6"])
    assert.match(
      errors(header + `R1,Data,Online,${value},4`),
      /satisfaction must/,
    );
});

test("malformed quotes and wrong field counts include useful line numbers", () => {
  assert.match(errors(header + 'R1,Data,"Online,4,3'), /Line 2.*closing quote/);
  assert.match(
    errors(header + 'R1,Data,"Online"x,4,3'),
    /Line 2.*closing quote/,
  );
  assert.match(errors(header + 'R1,Da"ta,Online,4,3'), /Line 2.*whole field/);
  assert.match(
    errors(header + "R1,Data,Online,4"),
    /Line 2.*expected 5 fields/,
  );
  assert.match(errors(header + '""'), /Line 2.*expected 5 fields/);
});

test("quoted commas, escaped quotes, and multiline fields are read before schema validation", () => {
  assert.match(errors(header + 'R1,"Da,ta",Online,4,3'), /track must/);
  assert.match(errors(header + 'R1,"Da""ta",Online,4,3'), /track must/);
  const message = errors(header + 'R1,"Da\nta",Online,4,3\nR2,Data,Online,7,3');
  assert.match(message, /Line 2.*track must/);
  assert.match(message, /Line 4.*satisfaction must/);
});

test("safe anonymous IDs, row/file limits, and capped errors are enforced", () => {
  for (const id of ["=SUM(1)", "@value", "-value", "R 1", "x".repeat(65)])
    assert.match(errors(header + `${id},Data,Online,4,3`), /id must/);
  const lines = Array.from(
    { length: MAX_ROWS + 1 },
    (_, i) => `R${i},Data,Online,4,3`,
  ).join("\n");
  assert.match(errors(header + lines), /at most 5,000/);
  assert.match(errors("x".repeat(MAX_FILE_BYTES + 1)), /too large/);
  const message = errors(
    header +
      Array.from({ length: 30 }, (_, i) => `R${i},Invalid,Online,4,3`).join(
        "\n",
      ),
  );
  assert.match(message, /first 20 errors/);
});

test("generator is reproducible, diverse, valid, and round-trippable", () => {
  const rows = generateResponses(1000, 42);
  assert.deepEqual(rows, generateResponses(1000, 42));
  assert.notDeepEqual(rows, generateResponses(1000, 43));
  assert.equal(new Set(rows.map((row) => row.id)).size, 1000);
  assert.equal(new Set(rows.map((row) => row.track)).size, 3);
  assert.ok(rows.some((row) => row.satisfaction === null));
  const result = parseCsv(toCsv(rows));
  assert.deepEqual(result, { ok: true, rows });
  assert.throws(() => generateResponses(9, 42));
  assert.throws(() => generateResponses(1001, 42));
  assert.throws(() => generateResponses(10.5, 42));
  assert.throws(() => generateResponses(10, -1));
});
