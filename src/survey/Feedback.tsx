import { useRef, useState, type ChangeEvent } from "react";
import { readRecords } from "./csv";
import { analysisReport, exampleAnalysis, feedbackSample, validateAnalysis, validateFeedback, type Analysis, type Feedback } from "./feedback";
import "./feedback.css";

function download(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function FeedbackStudio() {
  const [rows, setRows] = useState<Feedback[]>(feedbackSample);
  const [sample, setSample] = useState(true);
  const [result, setResult] = useState<Analysis | null>(null);
  const [mode, setMode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const sources = useRef<HTMLDivElement>(null);
  const endpoint = import.meta.env.VITE_FEEDBACK_API_URL as string | undefined;
  async function importFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0]; e.currentTarget.value = "";
    if (!file) return;
    setBusy(true); setMessage("");
    try {
      if (file.size > 256 * 1024) throw new Error("Use a UTF-8 CSV of 256 KB or less.");
      const text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
      const records = readRecords(text.replace(/^\uFEFF/, ""));
      const header = records[0]?.cells.map(c => c.trim());
      if (!header || header.length !== 2 || !header.includes("id") || !header.includes("feedback")) throw new Error("Use exactly these two headers: id,feedback (any order). This is separate from the ratings CSV.");
      const next = validateFeedback(records.slice(1).map(r => {
        if (r.cells.length !== 2) throw new Error(`Line ${r.line}: expected two columns. Put feedback containing commas or line breaks inside double quotes.`);
        return { id: r.cells[header.indexOf("id")].trim(), feedback: r.cells[header.indexOf("feedback")] };
      }));
      setRows(next); setSample(false); setResult(null); setSelected([]); setConsent(false);
      setMessage(`Imported ${next.length} responses. Previous analysis cleared. Nothing has been uploaded.`);
    } catch (e) { setMessage(`${e instanceof Error ? e.message : "Could not read the CSV."} Your current responses and analysis were kept.`); }
    finally { setBusy(false); }
  }
  async function analyse() {
    if (!endpoint || !consent) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ responses: rows }), signal: AbortSignal.timeout(45000) });
      if (!response.ok) throw new Error(response.status === 429 ? "The analysis limit has been reached. Please try again later." : "The AI service could not complete the analysis. Try again later.");
      setResult(validateAnalysis(await response.json(), rows)); setMode("AI-generated analysis"); setSelected([]);
      setMessage("Analysis ready. Review every finding against the original responses.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Analysis failed. Your responses were kept."); }
    finally { setBusy(false); }
  }
  return <section id="written-feedback" className="feedback-studio" aria-labelledby="feedback-heading" aria-busy={busy}>
    <div className="feedback-heading"><span className="eyebrow">WRITTEN FEEDBACK / FINDINGS YOU CAN CHECK</span><h2 id="feedback-heading">From responses to <em>next steps.</em></h2><p>Explore recurring themes, read the supporting responses, and review suggested actions. This workspace is separate from the rating charts above.</p></div>
    <div className="feedback-columns"><div className="feedback-panel">
      <h3>1. Choose feedback</h3><p><strong>{sample ? "Fictional sample" : "Imported feedback"} · {rows.length} responses</strong></p>
      <p>Use anonymous feedback you have permission to analyse. Remove names, contact details and sensitive information. Imports stay in this tab unless you request live AI analysis.</p>
      <details><summary>CSV format &amp; example</summary><p>UTF-8 CSV, maximum 256 KB and 100 responses. Exactly two case-sensitive headers: <code>id,feedback</code>. IDs must be unique, up to 64 letters, numbers, hyphens or underscores. Feedback must be nonblank and at most 1,000 characters. Quote text containing commas, quotes or line breaks; double any quotes inside quoted text.</p><pre>{'id,feedback\nF01,"Clear examples, but I wanted more practice."'}</pre><button onClick={() => download('id,feedback\r\nF01,"Clear examples, but I wanted more practice."\r\nF02,"A written recap would help."\r\n', "feedback-example.csv", "text/csv;charset=utf-8")}>Download feedback example</button></details>
      <label className="feedback-upload">Import feedback CSV<input type="file" accept=".csv,text/csv" disabled={busy} onChange={importFile} /></label>
      <button disabled={busy} onClick={() => { setRows(feedbackSample); setSample(true); setResult(null); setSelected([]); setConsent(false); setMessage("Fictional sample restored. Analysis cleared."); }}>Restore fictional feedback</button>
      <h3>2. Explore an analysis</h3><p>{endpoint ? "An AI endpoint is configured. Requesting analysis sends these written responses to that service." : "Live AI isn’t connected yet. The example below is a hand-written demonstration for the six fictional responses; it does not analyse uploaded files."}</p>
      <button disabled={busy || !sample} onClick={() => { setResult(exampleAnalysis); setMode("Hand-written example · Fictional sample"); setSelected([]); setMessage("Example analysis opened. No AI request was made."); }}>Show example analysis</button>
      {endpoint && <label className="feedback-consent"><input type="checkbox" checked={consent} disabled={busy} onChange={e => setConsent(e.target.checked)} />I have permission to send these anonymised responses to the AI service.</label>}
      <button disabled={busy || !endpoint || !consent} onClick={analyse}>{busy ? "Please wait…" : "Analyse with AI"}</button>
      <p className="feedback-status" role="status">{message}</p>
    </div><div className="feedback-panel feedback-results">
      <h3>3. Review findings</h3>{result ? <><p className="feedback-mode">{mode}</p><p>{result.summary}</p><p>Interpretations and actions need human review. A valid source ID does not prove a claim is accurate. These themes describe this dataset, not a wider population.</p>{result.findings.map((f, i) => <article key={i}><h4>{f.title}</h4><p>{f.observation}</p><button onClick={() => { setSelected(f.responseIds); requestAnimationFrame(() => { sources.current?.scrollIntoView({ block: "start", behavior: "instant" }); sources.current?.focus(); }); }}>Read {f.responseIds.length} supporting responses</button><p><strong>Suggested next step:</strong> {f.nextStep}</p></article>)}<button onClick={() => { download(analysisReport(result, rows, mode), "feedback-analysis.txt", "text/plain;charset=utf-8"); setMessage("Report download requested, including supporting responses."); }}>Download analysis report</button></> : <p className="feedback-empty">Choose “Show example analysis” to explore a complete example, or connect the AI service to analyse your imported feedback.</p>}
    </div></div>
    <details className="feedback-panel"><summary>How this was built with AI assistance</summary><p>I chose feedback analysis to connect my reporting experience with a useful AI workflow. AI coding assistance helped implement the interface and backend integration. The key decisions were to preserve the rating calculations, separate example findings from live output, and make every finding traceable to source responses.</p><p>Tests cover invalid CSVs, stale analysis, consent, downloads and an AI result with an invented source ID. That result is rejected, even if the rest of its structure looks correct. Valid IDs still require human review: the text may not support the interpretation. Actual model quality remains to be evaluated after connecting a provider.</p></details>
    <div className="feedback-panel feedback-sources" ref={sources} tabIndex={-1}><h3>Original responses{selected.length ? ` · ${selected.length} selected sources` : ` · ${rows.length} total`}</h3>{selected.length > 0 && <button onClick={() => setSelected([])}>Show all responses</button>}<ul>{rows.filter(r => !selected.length || selected.includes(r.id)).map(r => <li key={r.id}><strong>{r.id}</strong><p>{r.feedback}</p></li>)}</ul></div>
  </section>;
}
