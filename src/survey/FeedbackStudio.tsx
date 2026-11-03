import { useRef, useState } from "react";
import { analysisErrorMessage, analysisReport, exampleAnalysis, validateAnalysis, type Analysis, type Feedback } from "./feedback";
import type { ResponseRow } from "./data";
import "./feedback.css";

export default function FeedbackStudio({ responses, isSample }: { responses: ResponseRow[]; isSample: boolean }) {
  const rows: Feedback[] = responses.filter(row => row.feedback?.trim()).map(row => ({ id: row.id, feedback: row.feedback! }));
  const sampleAnalysis: Analysis | null = isSample && rows.length ? {
    summary: "Example themes from the written comments in your selected fictional responses.",
    findings: exampleAnalysis.findings.map((f, index) => ({
      ...f,
      observation: ["These responses mention clear explanations or useful practical examples.", "These responses ask for more practice time or describe a rushed section.", "These responses request materials to revisit after the session."][index],
      responseIds: f.responseIds.map(id => id.replace("F", "R")).filter(id => rows.some(row => row.id === id)),
    })).filter(f => f.responseIds.length > 0),
  } : null;
  const [result, setResult] = useState<Analysis | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const endpoint = import.meta.env.VITE_FEEDBACK_API_URL as string | undefined;
  const analysis = result || sampleAnalysis;
  const mode = result ? "AI-generated analysis" : "Hand-written example · Fictional sample";
  async function analyse() {
    if (!endpoint || !consent || !rows.length || rows.length > 100) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ responses: rows }), signal: AbortSignal.timeout(45000) });
      if (!response.ok) {
        const details = await response.json().catch(() => null);
        const explanation = analysisErrorMessage(details?.code);
        if (explanation) throw new Error(explanation);
        if (response.status === 429) throw new Error("The demo usage limit has been reached (3 requests per visitor per hour, 20 total per day). Please try again later.");
        if (response.status === 503) throw new Error("The AI service is not ready yet. Please try again after backend setup is complete.");
        throw new Error("The AI service could not complete the analysis. Please try again later.");
      }
      setResult(validateAnalysis(await response.json(), rows));
      setMessage("Analysis complete. Your summary and findings are ready below.");
      requestAnimationFrame(() => {
        resultHeading.current?.focus({ preventScroll: true });
        resultHeading.current?.scrollIntoView({ block: "start", behavior: "instant" });
      });
    } catch (e) { setMessage(e instanceof Error ? e.message : "Analysis failed. Your responses were kept."); }
    finally { setBusy(false); }
  }
  function download() {
    if (!analysis) return;
    const url = URL.createObjectURL(new Blob([analysisReport(analysis, rows, mode)], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "feedback-analysis.txt"; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Report download requested, including supporting responses.");
  }
  return <section id="written-feedback" className="feedback-studio" aria-labelledby="feedback-heading" aria-busy={busy}>
    <div className="feedback-heading"><span className="eyebrow">WRITTEN FEEDBACK</span><h2 id="feedback-heading">The story <em>behind the numbers.</em></h2><p>Uses the same dataset and filters as the charts above. {rows.length} of {responses.length} selected responses include a written comment.</p></div>
    {!rows.length ? <div className="feedback-empty"><p>No written comments in this selection. Add an optional <code>feedback</code> column to the CSV you import above, or change the filters. No second upload is needed.</p></div> : <>
      <p className="feedback-context">{analysis ? `${mode}. Expand a theme to see the finding, suggested action and original responses together.` : "Your comments are ready to review below."} {!endpoint && "Live AI is not connected; imported comments will not receive an automatic analysis."}</p>
      {endpoint && <div className="feedback-controls"><p>Let AI find themes and suggest next steps from your comments.</p><p className="feedback-privacy">Your selected comments are sent to Cloudflare Workers AI. Remove names and private details first.</p>{rows.length > 100 ? <p>Select at most 100 comments using the filters above before requesting AI analysis. No comments are silently omitted.</p> : <><label className="feedback-consent"><input type="checkbox" checked={consent} disabled={busy} onChange={e => setConsent(e.target.checked)} />I have permission to share these comments for AI analysis.</label><button disabled={busy || !consent} onClick={analyse}>{busy ? "Reading your comments…" : "Analyse feedback"}</button></>}<small className="feedback-limits">Free demo: 3 analyses per hour per network, 20 total per day. Daily AI availability is limited.</small></div>}
      <p className="feedback-status" role="status">{message}</p>
      {analysis && <div className="feedback-results">{result && <div className="feedback-complete"><h3 ref={resultHeading} tabIndex={-1}><span aria-hidden="true">✓ </span>Analysis complete</h3><p>{rows.length} {rows.length === 1 ? "comment" : "comments"} analysed · {result.findings.length} {result.findings.length === 1 ? "theme" : "themes"} found</p><small>AI-generated analysis · Open a theme to see the evidence.</small></div>}<h3 className="feedback-summary-title">{result ? "What your feedback says" : "Example summary"}</h3><p>{analysis.summary}</p>{analysis.findings.map((f, i) => <details className="feedback-finding" key={`${mode}-${i}`}><summary><span>{f.title}</span><small>{f.responseIds.length} supporting responses</small></summary><div className="feedback-finding-body"><p>{f.observation}</p><p><strong>Suggested next step:</strong> {f.nextStep}</p><h3>Supporting responses</h3><ul>{f.responseIds.map(id => <li key={id}><strong>{id}</strong><p>{rows.find(row => row.id === id)!.feedback}</p></li>)}</ul></div></details>)}<p className="feedback-caveat">AI can misread feedback. Check the original responses before acting on a suggestion.</p><button className="feedback-download" onClick={download}>Download analysis report</button></div>}
      <details className="feedback-originals"><summary>View all {rows.length} written responses</summary><ul>{rows.map(row => <li key={row.id}><strong>{row.id}</strong><p>{row.feedback}</p></li>)}</ul></details>
    </>}
    <details className="feedback-about"><summary>How this was built with AI assistance</summary><p>I chose evidence-linked feedback analysis to connect my reporting experience with an AI workflow. AI coding assistance helped build the interface and Cloudflare Workers AI integration. Both charts and written feedback use the same imported dataset and filters. Tests cover imports, source references, stale results, consent and downloads. Unknown source IDs are rejected. Live inference has been tried with the fictional sample; interpretation quality still needs human review against each cited response.</p></details>
  </section>;
}
