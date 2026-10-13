import type { ResponseRow } from "./data";

export const CSV_COLUMNS = [
  "id",
  "track",
  "format",
  "satisfaction",
  "confidence",
] as const;
export const MAX_ROWS = 5000;
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_ERRORS = 20;
export type CsvResult =
  { ok: true; rows: ResponseRow[] } | { ok: false; errors: string[] };

// Small CSV reader for this documented schema: UTF-8, commas, CRLF/LF,
// quoted fields, doubled quotes, and quoted line breaks. No delimiter guessing.
function readRecords(text: string): { cells: string[]; line: number }[] {
  const records: { cells: string[]; line: number }[] = [];
  let cells: string[] = [];
  let field = "";
  let state: "plain" | "quoted" | "closed" = "plain";
  let line = 1;
  let startLine = 1;
  let quotedRecord = false;
  const finish = () => {
    cells.push(field);
    // Truly empty physical lines may be skipped, but a row of commas is data.
    if (cells.length !== 1 || cells[0].trim() !== "" || quotedRecord)
      records.push({ cells, line: startLine });
    if (records.length > MAX_ROWS + 1)
      throw new Error(
        `Use at most ${MAX_ROWS.toLocaleString("en-US")} response rows.`,
      );
    cells = [];
    field = "";
    state = "plain";
    quotedRecord = false;
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (state === "quoted") {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else state = "closed";
      } else if (char === "\r" || char === "\n") {
        field += "\n";
        if (char === "\r" && text[i + 1] === "\n") i++;
        line++;
      } else field += char;
    } else if (char === ",") {
      cells.push(field);
      field = "";
      state = "plain";
    } else if (char === "\r" || char === "\n") {
      finish();
      if (char === "\r" && text[i + 1] === "\n") i++;
      line++;
      startLine = line;
    } else if (state === "closed") {
      if (char !== " " && char !== "\t")
        throw new Error(`Line ${line}: unexpected text after a closing quote.`);
    } else if (char === '"') {
      if (field.trim() !== "")
        throw new Error(`Line ${line}: quotes must surround the whole field.`);
      field = "";
      state = "quoted";
      quotedRecord = true;
    } else field += char;
  }
  if (state === "quoted")
    throw new Error(
      `Line ${startLine}: a quoted field is missing its closing quote.`,
    );
  finish();
  return records;
}

export function parseCsv(text: string): CsvResult {
  if (
    text.length > MAX_FILE_BYTES ||
    new TextEncoder().encode(text).length > MAX_FILE_BYTES
  )
    return {
      ok: false,
      errors: ["The file is too large. Use a UTF-8 CSV of 2 MB or less."],
    };
  if (text.includes("\0"))
    return {
      ok: false,
      errors: [
        "This does not look like UTF-8 CSV text. Save the file as CSV UTF-8.",
      ],
    };
  let records: ReturnType<typeof readRecords>;
  try {
    records = readRecords(text.replace(/^\uFEFF/, ""));
  } catch (error) {
    return {
      ok: false,
      errors: [
        error instanceof Error ? error.message : "Could not read the CSV.",
      ],
    };
  }
  if (!records.length)
    return {
      ok: false,
      errors: [
        "The file is empty. Download the example CSV to see the required format.",
      ],
    };
  const header = records[0].cells.map((cell) => cell.trim());
  if (
    header.length !== CSV_COLUMNS.length ||
    new Set(header).size !== header.length ||
    CSV_COLUMNS.some((column) => !header.includes(column))
  )
    return {
      ok: false,
      errors: [
        `Use exactly these five headers (any order): ${CSV_COLUMNS.join(",")}. Header names are case-sensitive.`,
      ],
    };
  if (records.length === 1)
    return {
      ok: false,
      errors: [
        "The CSV contains a header but no response rows. Add at least one response.",
      ],
    };
  const indexes = Object.fromEntries(
    CSV_COLUMNS.map((column) => [column, header.indexOf(column)]),
  );
  const errors: string[] = [];
  const rows: ResponseRow[] = [];
  const ids = new Set<string>();
  for (const record of records.slice(1)) {
    const before = errors.length;
    const report = (message: string) =>
      errors.push(`Line ${record.line}: ${message}`);
    if (record.cells.length !== header.length)
      report(
        `expected 5 fields, found ${record.cells.length}. Check commas and quotes.`,
      );
    else {
      const get = (column: (typeof CSV_COLUMNS)[number]) =>
        record.cells[indexes[column]].trim();
      const id = get("id"),
        track = get("track"),
        format = get("format");
      if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(id))
        report(
          "id must be 1–64 letters, numbers, hyphens, or underscores, beginning with a letter or number.",
        );
      else if (ids.has(id))
        report(`id "${id}" is duplicated. Each response needs a unique id.`);
      else ids.add(id);
      if (!["Websites", "Automations", "Data"].includes(track))
        report("track must be Websites, Automations, or Data.");
      if (!["Online", "In person"].includes(format))
        report("format must be Online or In person.");
      const rating = (column: "satisfaction" | "confidence") => {
        const value = get(column);
        if (value === "") return null;
        if (!/^[1-5]$/.test(value)) {
          report(
            `${column} must be a whole number from 1 to 5, or blank for a missing answer.`,
          );
          return null;
        }
        return Number(value);
      };
      const satisfaction = rating("satisfaction"),
        confidence = rating("confidence");
      if (errors.length === before)
        rows.push({
          id,
          track: track as ResponseRow["track"],
          format: format as ResponseRow["format"],
          satisfaction,
          confidence,
        });
    }
    if (errors.length >= MAX_ERRORS)
      return {
        ok: false,
        errors: [
          ...errors.slice(0, MAX_ERRORS),
          "Showing the first 20 errors. Fix these and try again; there may be more.",
        ],
      };
  }
  return errors.length ? { ok: false, errors } : { ok: true, rows };
}
