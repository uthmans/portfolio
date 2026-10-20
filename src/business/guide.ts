import { services, type ServiceId } from "./model.ts";
export type ServiceAdvice = { serviceId: ServiceId | "none"; reason: string; questions: string[]; caveat: string };
export const exampleSpace = "My fictional home office feels cluttered. I work from a small desk in the spare room and would like a better layout, storage and lighting for focused work. I am keeping my existing furniture and am not planning any construction.";
export function validateSpace(value: unknown): string {
  if (typeof value !== "string" || value.trim().length < 20 || value.length > 2000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new Error("Describe your space and goal in 20–2,000 characters. Leave out personal details.");
  return value.trim();
}
export function validateAdvice(value: unknown): ServiceAdvice {
  const a = value as ServiceAdvice;
  const text = (s: unknown, max: number): s is string => typeof s === "string" && !!s.trim() && s.length <= max;
  if (!a || ![...services.map(s => s.id), "none"].includes(a.serviceId) || !text(a.reason, 1500) || !text(a.caveat, 800) || !Array.isArray(a.questions) || a.questions.length > 5 || a.questions.some(q => !text(q, 400))) throw new Error("The AI returned an invalid service suggestion. Your description was kept and the calculator has not changed.");
  return { serviceId: a.serviceId, reason: a.reason.trim(), questions: a.questions.map(q => q.trim()), caveat: a.caveat.trim() };
}
