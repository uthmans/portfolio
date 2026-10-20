export type Feedback = { id: string; feedback: string };
export type Finding = { title: string; observation: string; responseIds: string[]; nextStep: string };
export type Analysis = { summary: string; findings: Finding[] };
export function analysisErrorMessage(code: unknown): string | undefined {
  if (typeof code !== "string") return undefined;
  const messages: Record<string, string> = {
    invalid_service_advice: "The AI returned an invalid service suggestion. Your description was kept and the calculator has not changed.",
    workers_ai_format: "The AI service rejected the planner’s response-format settings. No project was added. Your brief was kept; this needs a service fix, not a rewritten brief.",
    invalid_plan: "The AI draft did not match the planner’s required format. No project was added, and your brief was kept. You do not need to rewrite the example brief; the service needs attention.",
    ai_binding_missing: "Cloudflare Workers AI is not connected to this deployment yet. The portfolio owner needs to check the AI binding.",
    workers_ai_limit: "Cloudflare’s free AI allowance or request limit has been reached. Please try again later; no paid fallback is used.",
    workers_ai_unavailable: "Cloudflare Workers AI could not complete this request. Please try again later. If it persists, the portfolio owner should check Workers AI activation and model availability.",
    provider_timeout: "The AI request took too long. Your responses were kept. Please try again later.",
    invalid_analysis: "The AI returned an incomplete analysis or invalid source references. No new report was accepted. Your responses were kept.",
    quota_unavailable: "The service could not check its usage limits. No AI request was sent. Please try again later.",
  };
  return Object.hasOwn(messages, code) ? messages[code] : undefined;
}
export const feedbackSample: Feedback[] = [
  { id: "F01", feedback: "The facilitator explained the automation examples clearly. I wanted more time to practise." },
  { id: "F02", feedback: "The step-by-step website exercise was useful, but the last part felt rushed." },
  { id: "F03", feedback: "I liked the practical examples. A recording would help me revisit the steps." },
  { id: "F04", feedback: "Please share a written checklist after the session so I can try it again." },
  { id: "F05", feedback: "The examples made the tools easier to understand. More practice time would be great." },
  { id: "F06", feedback: "The introduction was clear. I would appreciate follow-up notes with the main steps." },
];
export const exampleAnalysis: Analysis = {
  summary: "This fictional sample values clear, practical teaching and asks for more practice time and materials to revisit afterward.",
  findings: [
    { title: "Keep the practical explanations", observation: "These responses describe clear explanations or useful practical examples.", responseIds: ["F01", "F02", "F03", "F05", "F06"], nextStep: "Retain step-by-step examples and ask which exercises were most useful." },
    { title: "Allow more time to practise", observation: "Two responses explicitly request practice time; another says the final section felt rushed.", responseIds: ["F01", "F02", "F05"], nextStep: "Try a shorter agenda with a dedicated practice block, then collect feedback on pacing." },
    { title: "Offer follow-up materials", observation: "Respondents request a recording, checklist, or follow-up notes.", responseIds: ["F03", "F04", "F06"], nextStep: "Pilot a written recap and check whether it helps participants repeat the exercise." },
  ],
};
export function validateFeedback(value: unknown): Feedback[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) throw new Error("Use 1–100 feedback responses.");
  const ids = new Set<string>();
  return value.map((row, i) => {
    if (!row || typeof row !== "object" || typeof row.id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(row.id) || ids.has(row.id)) throw new Error(`Response ${i + 1}: use a unique anonymous ID (letters, numbers, hyphens or underscores; up to 64 characters).`);
    if (typeof row.feedback !== "string" || !row.feedback.trim() || row.feedback.length > 1000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(row.feedback)) throw new Error(`Response ${i + 1}: feedback must contain 1–1,000 characters of text.`);
    ids.add(row.id);
    return { id: row.id, feedback: row.feedback.trim() };
  });
}
export function validateAnalysis(value: unknown, rows: Feedback[]): Analysis {
  const text = (x: unknown, max: number): x is string => typeof x === "string" && !!x.trim() && x.length <= max;
  const a = value as Analysis;
  const ids = new Set(rows.map(r => r.id));
  if (!a || !text(a.summary, 1500) || !Array.isArray(a.findings) || a.findings.length < 1 || a.findings.length > 6) throw new Error("The analysis has an invalid format. No report was accepted.");
  return { summary: a.summary, findings: a.findings.map(f => {
    if (!f || !text(f.title, 150) || !text(f.observation, 1000) || !text(f.nextStep, 1000) || !Array.isArray(f.responseIds) || !f.responseIds.length || f.responseIds.length > rows.length || new Set(f.responseIds).size !== f.responseIds.length || f.responseIds.some(id => !ids.has(id))) throw new Error("The analysis contains invalid source references. No report was accepted.");
    return { title: f.title, observation: f.observation, nextStep: f.nextStep, responseIds: f.responseIds };
  }) };
}
export function analysisReport(a: Analysis, rows: Feedback[], mode: string): string {
  return [`Survey Insights Studio — ${mode}`, `Responses analysed: ${rows.length}`, "Findings are suggestions for human review. Source references do not guarantee the interpretation is correct.", "", a.summary, ...a.findings.flatMap(f => ["", f.title, f.observation, `Suggested next step: ${f.nextStep}`, ...f.responseIds.map(id => `${id}: ${rows.find(r => r.id === id)!.feedback}`)])].join("\n");
}
