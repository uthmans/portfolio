export type ResponseRow = {
  id: string;
  track: "Websites" | "Automations" | "Data";
  format: "Online" | "In person";
  satisfaction: number | null;
  confidence: number | null;
};

export type Question = "satisfaction" | "confidence";
export const questions: Record<Question, { label: string; prompt: string }> = {
  satisfaction: {
    label: "Session satisfaction",
    prompt: "How satisfied were you with the session?",
  },
  confidence: {
    label: "Confidence to apply learning",
    prompt: "How confident do you feel about applying what you learned?",
  },
};

// Original fictional feedback for a made-up community learning series.
// No names, real participants, or organizational data.
export const sample: ResponseRow[] = [
  {
    id: "R01",
    track: "Websites",
    format: "Online",
    satisfaction: 5,
    confidence: 4,
  },
  {
    id: "R02",
    track: "Websites",
    format: "Online",
    satisfaction: 4,
    confidence: 3,
  },
  {
    id: "R03",
    track: "Websites",
    format: "In person",
    satisfaction: 4,
    confidence: 4,
  },
  {
    id: "R04",
    track: "Websites",
    format: "In person",
    satisfaction: null,
    confidence: 2,
  },
  {
    id: "R05",
    track: "Automations",
    format: "Online",
    satisfaction: 3,
    confidence: 3,
  },
  {
    id: "R06",
    track: "Automations",
    format: "Online",
    satisfaction: 5,
    confidence: 5,
  },
  {
    id: "R07",
    track: "Automations",
    format: "In person",
    satisfaction: 4,
    confidence: 4,
  },
  {
    id: "R08",
    track: "Automations",
    format: "In person",
    satisfaction: 2,
    confidence: null,
  },
  {
    id: "R09",
    track: "Data",
    format: "Online",
    satisfaction: 4,
    confidence: null,
  },
  {
    id: "R10",
    track: "Data",
    format: "Online",
    satisfaction: null,
    confidence: null,
  },
  {
    id: "R11",
    track: "Data",
    format: "In person",
    satisfaction: 5,
    confidence: 4,
  },
  {
    id: "R12",
    track: "Data",
    format: "In person",
    satisfaction: 1,
    confidence: 2,
  },
];

export function summarize(rows: ResponseRow[], question: Question) {
  const values = rows
    .map((row) => row[question])
    .filter((value): value is number => value !== null);
  const counts = [1, 2, 3, 4, 5].map((score) => ({
    score,
    count: values.filter((value) => value === score).length,
  }));
  return {
    total: rows.length,
    answered: values.length,
    missing: rows.length - values.length,
    mean: values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null,
    counts: counts.map((bin) => ({
      ...bin,
      percentage: values.length ? (bin.count / values.length) * 100 : 0,
    })),
  };
}

export function filterResponses(
  rows: ResponseRow[],
  track: string,
  format: string,
) {
  return rows.filter(
    (row) =>
      (track === "All" || row.track === track) &&
      (format === "All" || row.format === format),
  );
}

export function toCsv(rows: ResponseRow[]) {
  return (
    [
      "id,track,format,satisfaction,confidence",
      ...rows.map((row) =>
        [
          row.id,
          row.track,
          row.format,
          row.satisfaction ?? "",
          row.confidence ?? "",
        ].join(","),
      ),
    ].join("\r\n") + "\r\n"
  );
}
