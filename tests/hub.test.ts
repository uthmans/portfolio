import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterProjects,
  parseMoney,
  parseWorkspace,
  replaceProject,
  sampleWorkspace,
  summary,
  validDate,
  type Workspace,
} from "../src/hub/model.ts";
test("budget input converts exact decimal cents and rejects invalid or out-of-range amounts", () => {
  assert.equal(parseMoney("1200.15"), 120015);
  assert.equal(parseMoney("0.1"), 10);
  assert.equal(parseMoney("1000000.00"), 100000000);
  for (const input of [
    "-1",
    "1.001",
    "1e3",
    "NaN",
    "Infinity",
    "",
    "1000000.01",
    "1,200",
  ])
    assert.equal(parseMoney(input), null, input);
});
test("calendar validation rejects impossible dates", () => {
  assert.equal(validDate("2024-02-29"), true);
  for (const date of ["2025-02-29", "2026-04-31", "2026-13-01", "x"])
    assert.equal(validDate(date), false);
});
test("visible summaries count budgets, task completion and overdue projects independently", () => {
  const data = sampleWorkspace();
  data.projects[0].due = "2026-10-01";
  data.projects[1].due = "";
  data.projects[2].due = "2026-09-01";
  assert.deepEqual(summary(data.projects, "2026-10-13"), {
    budget: 265000,
    spent: 115000,
    active: 2,
    overdue: 1,
    tasks: 7,
    done: 3,
  });
  const visible = filterProjects(
    data.projects,
    "willow",
    "In progress",
    true,
    "2026-10-13",
  );
  assert.equal(visible.length, 1);
  assert.deepEqual(summary(visible, "2026-10-13"), {
    budget: 120000,
    spent: 45000,
    active: 1,
    overdue: 1,
    tasks: 3,
    done: 1,
  });
  assert.equal(
    filterProjects(data.projects, "not found", "All", false).length,
    0,
  );
  assert.equal(
    filterProjects(data.projects, "", "Complete", true, "2026-10-13").length,
    0,
  );
});
test("backup validation round-trips data and preserves an empty workspace", () => {
  const data = sampleWorkspace();
  assert.deepEqual(parseWorkspace(JSON.stringify(data)), data);
  assert.deepEqual(parseWorkspace('{"version":1,"projects":[]}'), {
    version: 1,
    projects: [],
  });
});
test("invalid backups reject whole-file corruption and untrusted structure", () => {
  const data = sampleWorkspace();
  for (const value of [
    "not JSON",
    "null",
    "{}",
    '{"version":2,"projects":[]}',
    JSON.stringify({ ...data, projects: [...data.projects, data.projects[0]] }),
  ])
    assert.throws(() => parseWorkspace(value));
  for (const patch of [
    { spent: -1 },
    { id: "invalid id" },
    { budget: 1.5 },
    { budget: 100000001 },
    { due: "2026-02-30" },
    { stage: "Unknown" },
    { title: "" },
    { client: 123 },
    { tasks: [{ id: "x", title: "x", done: "true" }] },
    {
      tasks: [
        { id: "x", title: "x", done: true },
        { id: "x", title: "y", done: false },
      ],
    },
    {
      tasks: Array.from({ length: 101 }, (_, i) => ({
        id: String(i),
        title: "x",
        done: false,
      })),
    },
  ]) {
    assert.throws(() =>
      parseWorkspace(
        JSON.stringify({
          ...data,
          projects: [{ ...data.projects[0], ...patch }],
        }),
      ),
    );
  }
});
test("project updates preserve unrelated tasks and cap workspace growth", () => {
  const data = sampleWorkspace();
  const edited = { ...data.projects[0], title: "Updated", spent: 150000 };
  const next = replaceProject(data, edited);
  assert.equal(data.projects[0].title, "A clearer studio website");
  assert.deepEqual(next.projects[1], data.projects[1]);
  assert.equal(next.projects[0].spent, 150000);
  const full: Workspace = {
    version: 1,
    projects: Array.from({ length: 50 }, (_, i) => ({
      ...edited,
      id: String(i),
    })),
  };
  assert.throws(() => replaceProject(full, { ...edited, id: "new" }));
  assert.equal(
    replaceProject(full, { ...edited, id: "0" }).projects.length,
    50,
  );
});
