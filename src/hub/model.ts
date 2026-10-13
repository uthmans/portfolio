export const stages = ["Planned", "In progress", "Complete"] as const;
export type Stage = (typeof stages)[number];
export type Task = { id: string; title: string; done: boolean };
export type Project = {
  id: string;
  title: string;
  client: string;
  stage: Stage;
  budget: number;
  spent: number;
  due: string;
  notes: string;
  tasks: Task[];
};
export type Workspace = { version: 1; projects: Project[] };
export const storageKey = "uthman-freelancer-hub-v1";
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function dayOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDate(date);
}
export function sampleWorkspace(): Workspace {
  return {
    version: 1,
    projects: [
      {
        id: "demo-website",
        title: "A clearer studio website",
        client: "Willow Studio (fictional)",
        stage: "In progress",
        budget: 120000,
        spent: 45000,
        due: dayOffset(7),
        notes: "Build a small service website with an estimate calculator.",
        tasks: [
          { id: "site-1", title: "Outline the service pages", done: true },
          { id: "site-2", title: "Build the estimate calculator", done: false },
          { id: "site-3", title: "Check mobile navigation", done: false },
        ],
      },
      {
        id: "demo-workflow",
        title: "A simpler enquiry workflow",
        client: "Little Pine (fictional)",
        stage: "Planned",
        budget: 65000,
        spent: 0,
        due: dayOffset(14),
        notes: "Map a fictional enquiry workflow and prototype the steps.",
        tasks: [
          { id: "flow-1", title: "Map the current steps", done: false },
          { id: "flow-2", title: "Create a sample intake form", done: false },
        ],
      },
      {
        id: "demo-data",
        title: "Feedback, made readable",
        client: "Common Ground (fictional)",
        stage: "Complete",
        budget: 80000,
        spent: 70000,
        due: dayOffset(-3),
        notes:
          "Explore fictional survey responses and explain the calculations.",
        tasks: [
          { id: "data-1", title: "Validate the sample data", done: true },
          { id: "data-2", title: "Review the rating distribution", done: true },
        ],
      },
    ],
  };
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function parseMoney(value: string): number | null {
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().split(".");
  const id = (v: unknown): v is string =>
    typeof v === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(v);
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return cents <= 100000000 ? cents : null;
}
export function parseWorkspace(value: string): Workspace {
  let data: unknown;
  try {
    data = JSON.parse(value);
  } catch {
    throw new Error(
      "This file is not valid JSON. Choose a Hub backup. The current workspace has not changed.",
    );
  }
  const fail = () => {
    throw new Error(
      "Use a valid Hub backup (version 1), with at most 50 projects and 100 tasks per project. The current workspace has not changed.",
    );
  };
  const obj = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);
  const text = (v: unknown, max: number, required = true): v is string =>
    typeof v === "string" &&
    v.length <= max &&
    (!required || v.trim().length > 0);
  const id = (v: unknown): v is string =>
    typeof v === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(v);
  const cents = (v: unknown): v is number =>
    typeof v === "number" &&
    Number.isSafeInteger(v) &&
    v >= 0 &&
    v <= 100000000;
  if (
    !obj(data) ||
    data.version !== 1 ||
    !Array.isArray(data.projects) ||
    data.projects.length > 50
  )
    return fail();
  const ids = new Set<string>();
  const projects: Project[] = [];
  for (const p of data.projects) {
    if (
      !obj(p) ||
      !id(p.id) ||
      ids.has(p.id) ||
      !text(p.title, 80) ||
      !text(p.client, 80) ||
      !stages.includes(p.stage as Stage) ||
      !cents(p.budget) ||
      !cents(p.spent) ||
      !text(p.due, 10, false) ||
      (p.due !== "" && !validDate(p.due)) ||
      !text(p.notes, 1000, false) ||
      !Array.isArray(p.tasks) ||
      p.tasks.length > 100
    )
      return fail();
    ids.add(p.id);
    const taskIds = new Set<string>();
    const tasks: Task[] = [];
    for (const t of p.tasks) {
      if (
        !obj(t) ||
        !id(t.id) ||
        taskIds.has(t.id) ||
        !text(t.title, 120) ||
        typeof t.done !== "boolean"
      )
        return fail();
      taskIds.add(t.id);
      tasks.push({ id: t.id, title: t.title, done: t.done });
    }
    projects.push({
      id: p.id,
      title: p.title,
      client: p.client,
      stage: p.stage as Stage,
      budget: p.budget,
      spent: p.spent,
      due: p.due,
      notes: p.notes,
      tasks,
    });
  }
  return { version: 1, projects };
}
export function summary(projects: Project[], today = localDate()) {
  return projects.reduce(
    (s, p) => ({
      ...s,
      budget: s.budget + p.budget,
      spent: s.spent + p.spent,
      active: s.active + Number(p.stage !== "Complete"),
      overdue:
        s.overdue +
        Number(p.stage !== "Complete" && p.due !== "" && p.due < today),
      tasks: s.tasks + p.tasks.length,
      done: s.done + p.tasks.filter((t) => t.done).length,
    }),
    { budget: 0, spent: 0, active: 0, overdue: 0, tasks: 0, done: 0 },
  );
}
export function filterProjects(
  projects: Project[],
  search: string,
  stage: Stage | "All",
  overdue: boolean,
  today = localDate(),
) {
  const term = search.trim().toLowerCase();
  return projects.filter(
    (p) =>
      (stage === "All" || p.stage === stage) &&
      (!overdue || (p.stage !== "Complete" && p.due !== "" && p.due < today)) &&
      `${p.title} ${p.client}`.toLowerCase().includes(term),
  );
}
export function replaceProject(
  workspace: Workspace,
  project: Project,
): Workspace {
  if (workspace.projects.some((p) => p.id === project.id))
    return {
      ...workspace,
      projects: workspace.projects.map((p) =>
        p.id === project.id ? project : p,
      ),
    };
  if (workspace.projects.length >= 50)
    throw new Error(
      "The demo supports up to 50 projects. Export a backup before removing older projects.",
    );
  return { ...workspace, projects: [...workspace.projects, project] };
}
