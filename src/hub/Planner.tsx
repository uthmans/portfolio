import { useEffect, useRef, useState, type FormEvent } from "react";
import { analysisErrorMessage } from "../survey/feedback";
import { fictionalBrief, projectFromPlan, validateBrief, validatePlan, type ProjectPlan } from "./planning";
import type { Project } from "./model";
import "./planner.css";

export default function Planner({ onAdd, full }: { onAdd: (project: Project) => void; full: boolean }) {
  const [brief, setBrief] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [client, setClient] = useState("");
  const [budget, setBudget] = useState("");
  const [due, setDue] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const endpoint = import.meta.env.VITE_HUB_PLAN_API_URL as string | undefined;
  useEffect(() => () => controller.current?.abort(), []);
  function changeBrief(text: string) {
    setBrief(text); setPlan(null); setConsent(false); setReviewed(false); setError(""); setMessage("");
  }
  async function generate(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    try {
      const text = validateBrief(brief);
      if (!endpoint || !consent) throw new Error("Confirm permission before sending the brief for AI planning.");
      setBusy(true); controller.current = new AbortController();
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brief: text }), signal: AbortSignal.any([controller.current.signal, AbortSignal.timeout(45000)]) });
      if (!response.ok) {
        const details = await response.json().catch(() => null);
        throw new Error(analysisErrorMessage(details?.code) || (response.status === 429 ? "The shared demo allowance is used up. Try again later." : "The AI planner could not finish. Your workspace has not changed."));
      }
      setPlan(validatePlan(await response.json())); setReviewed(false);
      setMessage("Draft ready. Review and edit it before adding a project. Nothing has been saved yet.");
      requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: "start", behavior: "instant" }); });
    } catch (e) { if (!controller.current?.signal.aborted) setError(e instanceof Error ? e.message : "Planning failed. Your workspace has not changed."); }
    finally { setBusy(false); }
  }
  function add(event: FormEvent) {
    event.preventDefault(); setError("");
    try {
      if (!plan || !reviewed || full) throw new Error("Review the draft and confirm before adding it. The workspace supports up to 50 projects.");
      onAdd(projectFromPlan({ ...plan, tasks: lines(plan.tasks.join("\n")), questions: lines(plan.questions.join("\n")), risks: lines(plan.risks.join("\n")) }, client, budget, due));
      setPlan(null); setBrief(""); setConsent(false); setReviewed(false); setClient(""); setBudget(""); setDue("");
      setMessage("Project added to your workspace. Check its save status below.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not add the project. Your draft was kept."); }
  }
  const lines = (text: string) => text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  return <details className="hub-planner" id="hub-planner"><summary><span>Plan a project with AI</span><small>Turn a client brief into an editable checklist.</small></summary>
    <div className="hub-planner-body">
      <form onSubmit={generate} aria-busy={busy}>
        <label htmlFor="plan-brief">What does the client need?</label>
        <textarea id="plan-brief" rows={5} minLength={20} maxLength={4000} required disabled={busy} value={brief} onChange={e => changeBrief(e.target.value)} aria-describedby="plan-privacy" placeholder="Describe the goal, intended visitors, features and anything still undecided." />
        <p id="plan-privacy">Only this brief is sent to Cloudflare Workers AI. Remove names, contact details and confidential information. Existing projects stay in your browser.</p>
        <button className="hub-text-button" type="button" disabled={busy} onClick={() => changeBrief(fictionalBrief)}>Use a fictional bakery brief</button>
        {endpoint ? <><label className="hub-plan-check"><input type="checkbox" checked={consent} disabled={busy} onChange={e => setConsent(e.target.checked)} />I have permission to send this brief for AI planning.</label><button className="hub-button" disabled={busy || !consent} type="submit">{busy ? "Creating your draft…" : "Generate project plan"}</button></> : <p>The AI planner needs its backend connection configured. You can still create projects with New project.</p>}
        <p className="hub-plan-hint">Free demo allowance shared with Survey Insights: 3 requests per hour per network, 20 total per day. No paid-provider fallback.</p>
      </form>
      <p role="status" className="hub-plan-status">{message}</p>
      {error && <p role="alert" className="hub-error">{error}</p>}
      {plan && <form className="hub-plan-review" onSubmit={add} onChange={() => setError("")}>
        <h2 ref={heading} tabIndex={-1}>Your draft plan is ready</h2><p>AI suggestions, not agreed scope. Edit the text, confirm requirements with the client, and add only what you want to track.</p>
        <label htmlFor="plan-title">Project title</label><input id="plan-title" required maxLength={80} value={plan.title} onChange={e => { setPlan({ ...plan, title: e.target.value }); setReviewed(false); }} />
        <label htmlFor="plan-summary">Project outline</label><textarea id="plan-summary" required maxLength={300} rows={3} value={plan.summary} onChange={e => { setPlan({ ...plan, summary: e.target.value }); setReviewed(false); }} />
        <label htmlFor="plan-tasks">Tasks · one per line, up to 10</label><textarea id="plan-tasks" required maxLength={1210} rows={6} value={plan.tasks.join("\n")} onChange={e => { setPlan({ ...plan, tasks: e.target.value.split("\n") }); setReviewed(false); }} /><p className="hub-plan-hint">Up to 120 characters per task. Remove any task by deleting its line.</p>
        <label htmlFor="plan-questions">Questions to clarify · one per line, up to 3</label><textarea id="plan-questions" maxLength={272} rows={3} value={plan.questions.join("\n")} onChange={e => { setPlan({ ...plan, questions: e.target.value.split("\n") }); setReviewed(false); }} />
        <label htmlFor="plan-risks">Gaps or risks · one per line, up to 3</label><textarea id="plan-risks" maxLength={272} rows={3} value={plan.risks.join("\n")} onChange={e => { setPlan({ ...plan, risks: e.target.value.split("\n") }); setReviewed(false); }} />
        <p className="hub-plan-hint">Each question or risk can use up to 90 characters. These will be saved in project notes.</p>
        <div className="hub-plan-fields"><div><label htmlFor="plan-client">Client or project owner</label><input id="plan-client" required maxLength={80} value={client} onChange={e => { setClient(e.target.value); setReviewed(false); }} /></div><div><label htmlFor="plan-budget">Budget in USD · optional</label><input id="plan-budget" inputMode="decimal" value={budget} onChange={e => { setBudget(e.target.value); setReviewed(false); }} placeholder="Not set" /></div><div><label htmlFor="plan-due">Due date · optional</label><input id="plan-due" type="date" value={due} onChange={e => { setDue(e.target.value); setReviewed(false); }} /></div></div>
        <p className="hub-plan-hint">AI does not set prices or deadlines. A blank budget is tracked as $0 until you edit it; a blank due date stays unset. New projects start as Planned, with $0 spent and all tasks unchecked.</p>
        <label className="hub-plan-check"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} />I reviewed this draft and want to add it to my workspace.</label>
        {full && <p className="hub-error">Your workspace has 50 projects. Download a backup and remove an older project before adding this draft.</p>}
        <div className="hub-plan-actions"><button className="hub-button" type="submit" disabled={!reviewed || busy || full}>Add to my projects</button><button className="hub-text-button" type="button" disabled={busy} onClick={() => { setPlan(null); setReviewed(false); setError(""); setMessage("Draft discarded. Your workspace has not changed."); }}>Discard draft</button></div>
      </form>}
    </div>
  </details>;
}
