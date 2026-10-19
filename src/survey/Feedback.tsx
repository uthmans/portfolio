import { useState } from "react";
import { analysisReport, exampleAnalysis, validateAnalysis, type Analysis, type Feedback } from "./feedback";
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
  const endpoint = import.meta.env.VITE_FEEDBACK_API_URL as string | undefined;
  const analysis = result || sampleAnalysis;
  const mode = result ? "AI-generated analysis" : "Hand-written example · Fictional sample";
  async function analyse() {
    if (!endpoint || !consent || !rows.length || rows.length > 100) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ responses: rows }), signal: AbortSignal.timeout(45000) });
      if (!response.ok) throw new Error(response.status === 429 ? "The analysis limit has been reached. Please try again later." : "The AI service could not complete the analysis. Try again later.");
      setResult(validateAnalysis(await response.json(), rows));
      setMessage("Analysis ready. Expand a theme to check its supporting responses.");
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
      {endpoint && <div className="feedback-controls"><p>Analysis sends the selected comments to the configured AI service. Use anonymised feedback you have permission to analyse.</p>{rows.length > 100 ? <p>Select at most 100 comments using the filters above before requesting AI analysis. No comments are silently omitted.</p> : <><label className="feedback-consent"><input type="checkbox" checked={consent} disabled={busy} onChange={e => setConsent(e.target.checked)} />I have permission to send these anonymised comments for AI analysis.</label><button disabled={busy || !consent} onClick={analyse}>{busy ? "Analysing…" : "Analyse feedback"}</button></>}</div>}
      {analysis && <div className="feedback-results"><p>{analysis.summary}</p>{analysis.findings.map((f, i) => <details className="feedback-finding" key={`${mode}-${i}`}><summary><span>{f.title}</span><small>{f.responseIds.length} supporting responses</small></summary><div className="feedback-finding-body"><p>{f.observation}</p><p><strong>Suggested next step:</strong> {f.nextStep}</p><h3>Supporting responses</h3><ul>{f.responseIds.map(id => <li key={id}><strong>{id}</strong><p>{rows.find(row => row.id === id)!.feedback}</p></li>)}</ul></div></details>)}<p className="feedback-caveat">Themes are interpretations of this selection, not claims about a wider population. Check the source text before acting.</p><button className="feedback-download" onClick={download}>Download analysis report</button></div>}
      <details className="feedback-originals"><summary>View all {rows.length} written responses</summary><ul>{rows.map(row => <li key={row.id}><strong>{row.id}</strong><p>{row.feedback}</p></li>)}</ul></details>
    </>}
    <p className="feedback-status" role="status">{message}</p>
    <details className="feedback-about"><summary>How this was built with AI assistance</summary><p>I chose evidence-linked feedback analysis to connect my reporting experience with an AI workflow. AI coding assistance helped build the interface and backend integration. Both charts and written feedback use the same imported dataset and filters. Tests cover imports, source references, stale results, consent and downloads. Unknown source IDs are rejected; valid references still need human review. Live model quality remains to be evaluated after connecting a provider.</p></details>
  </section>;
}
