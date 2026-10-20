import { parseMoney, parseWorkspace, validDate, type Project } from "./model.ts";

export type ProjectPlan = { title: string; summary: string; tasks: string[]; questions: string[]; risks: string[] };
// Model drafts may need shortening in the editor. Saved projects still use validatePlan.
export function validateDraft(value: unknown): ProjectPlan {
  const p = value as ProjectPlan;
  const text = (x: unknown, max: number): x is string => typeof x === "string" && !!x.trim() && x.length <= max;
  const list = (x: unknown, count: number, min = 0): x is string[] => Array.isArray(x) && x.length >= min && x.length <= count && x.every(item => text(item, 1000));
  if (!p || !text(p.title, 300) || !text(p.summary, 3000) || !list(p.tasks, 30, 1) || !list(p.questions, 10) || !list(p.risks, 10)) throw new Error("The AI response was not a readable project draft. No project was added.");
  const clean = (items: string[]) => items.map(item => item.trim());
  return { title: p.title.trim(), summary: p.summary.trim(), tasks: clean(p.tasks), questions: clean(p.questions), risks: clean(p.risks) };
}
export function planIssueMessage(issue: string): string {
  const messages: Record<string, string> = {
    title_missing: "Enter a project title.", title_too_long: "Shorten the project title to 80 characters.",
    summary_missing: "Enter a project outline.", summary_too_long: "Shorten the project outline to 300 characters.",
    tasks_count: "Keep between 1 and 10 tasks.", tasks_format: "Use one nonblank task per line.", tasks_too_long: "Shorten each task to 120 characters.", tasks_duplicate: "Each task must be different. Remove duplicated tasks.",
    questions_count: "Keep at most 3 clarification questions.", questions_format: "Use one question per line, or leave the questions blank.", questions_too_long: "Shorten each question to 90 characters.",
    risks_count: "Keep at most 3 risks.", risks_format: "Use one risk per line, or leave the risks blank.", risks_too_long: "Shorten each risk to 90 characters.",
  };
  return Object.hasOwn(messages, issue) ? messages[issue] : "Review the draft format before adding it.";
}
export function planIssues(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["format"];
  const plan = value as Record<string, unknown>;
  const issues: string[] = [];
  for (const [field, max] of [["title", 80], ["summary", 300]] as const) {
    if (typeof plan[field] !== "string" || !plan[field].trim()) issues.push(`${field}_missing`);
    else if (plan[field].length > max) issues.push(`${field}_too_long`);
  }
  for (const [field, maxCount, maxLength, minCount] of [["tasks", 10, 120, 1], ["questions", 3, 90, 0], ["risks", 3, 90, 0]] as const) {
    const items = plan[field];
    if (!Array.isArray(items)) { issues.push(`${field}_format`); continue; }
    if (items.length < minCount || items.length > maxCount) issues.push(`${field}_count`);
    if (items.some(item => typeof item !== "string" || !item.trim())) issues.push(`${field}_format`);
    if (items.some(item => typeof item === "string" && item.length > maxLength)) issues.push(`${field}_too_long`);
    if (field === "tasks" && items.every(item => typeof item === "string") && new Set(items.map(item => item.trim().toLowerCase())).size !== items.length) issues.push("tasks_duplicate");
  }
  return issues;
}
export function validateBrief(value: unknown): string {
  if (typeof value !== "string" || value.trim().length < 20 || value.length > 4000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))
    throw new Error("Describe the project in 20–4,000 characters. Remove personal and confidential information.");
  return value.trim();
}
export function validatePlan(value: unknown): ProjectPlan {
  const plan = value as ProjectPlan;
  const text = (x: unknown, max: number): x is string => typeof x === "string" && !!x.trim() && x.length <= max;
  const list = (x: unknown, max: number, length: number, min = 0): x is string[] => Array.isArray(x) && x.length >= min && x.length <= length && x.every(item => text(item, max));
  if (!plan || !text(plan.title, 80) || !text(plan.summary, 300) || !list(plan.tasks, 120, 10, 1) || !list(plan.questions, 90, 3) || !list(plan.risks, 90, 3))
    throw new Error("Use a title (up to 80 characters), summary (up to 300), 1–10 tasks (120 each), and up to 3 questions and 3 risks (90 each).");
  const clean = (items: string[]) => items.map(item => item.trim());
  if (new Set(clean(plan.tasks).map(t => t.toLowerCase())).size !== plan.tasks.length) throw new Error("Each task must be different. Remove duplicated tasks.");
  return { title: plan.title.trim(), summary: plan.summary.trim(), tasks: clean(plan.tasks), questions: clean(plan.questions), risks: clean(plan.risks) };
}
export function projectFromPlan(plan: ProjectPlan, client: string, budget: string, due: string): Project {
  const draft = validatePlan(plan);
  if (!client.trim() || client.length > 80) throw new Error("Enter a client or project owner name, up to 80 characters.");
  const amount = budget.trim() === "" ? 0 : parseMoney(budget);
  if (amount === null) throw new Error("Use a USD budget from 0 to 1,000,000, with at most two decimal places.");
  if (due && !validDate(due)) throw new Error("Choose a valid due date or leave it blank.");
  const notes = ["AI-assisted draft, reviewed before adding.", draft.summary,
    ...(draft.questions.length ? ["Questions to clarify:", ...draft.questions.map(q => `- ${q}`)] : []),
    ...(draft.risks.length ? ["Risks to review:", ...draft.risks.map(r => `- ${r}`)] : []),
  ].join("\n");
  const project: Project = { id: crypto.randomUUID(), title: draft.title, client: client.trim(), stage: "Planned", budget: amount, spent: 0, due, notes,
    tasks: draft.tasks.map(title => ({ id: crypto.randomUUID(), title, done: false })),
  };
  return parseWorkspace(JSON.stringify({ version: 1, projects: [project] })).projects[0];
}
export const fictionalBrief = "I need a small website for a fictional neighbourhood bakery. Visitors should be able to see the menu, opening hours and location, and send a catering enquiry. It should work well on phones. I have not decided on a budget, launch date, or how enquiries will be delivered.";
