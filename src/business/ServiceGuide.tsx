import { useEffect, useRef, useState, type FormEvent } from "react";
import { analysisErrorMessage } from "../survey/feedback";
import { exampleSpace, validateAdvice, validateSpace, type ServiceAdvice } from "./guide";
import { services, money, type ServiceId } from "./model";
import "./guide.css";

export default function ServiceGuide({ onChoose }: { onChoose: (id: ServiceId) => void }) {
  const [description, setDescription] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [advice, setAdvice] = useState<ServiceAdvice | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const result = useRef<HTMLHeadingElement>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const endpoint = import.meta.env.VITE_SERVICE_GUIDE_API_URL as string | undefined;
  const service = services.find(s => s.id === advice?.serviceId);
  function change(text: string) { setDescription(text); setConsent(false); setAdvice(null); setMessage(""); setError(""); }
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setMessage("");
    try {
      const text = validateSpace(description);
      if (!endpoint || !consent) throw new Error("Confirm permission before requesting a suggestion.");
      setBusy(true); controller.current = new AbortController();
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description: text }), signal: AbortSignal.any([controller.current.signal, AbortSignal.timeout(45000)]) });
      if (!response.ok) {
        const details = await response.json().catch(() => null);
        throw new Error(analysisErrorMessage(details?.code) || (response.status === 429 ? "The shared demo allowance has been reached. Please try later." : "The guide could not finish. Your description was kept and the estimate is unchanged."));
      }
      setAdvice(validateAdvice(await response.json()));
      setMessage("Suggestion ready. Review it below; your estimate has not changed.");
      requestAnimationFrame(() => { result.current?.focus({ preventScroll: true }); result.current?.scrollIntoView({ block: "start", behavior: "instant" }); });
    } catch (e) { if (!controller.current?.signal.aborted) setError(e instanceof Error ? e.message : "Could not complete the suggestion."); }
    finally { setBusy(false); }
  }
  return <section className="ff-section ff-guide" id="service-guide" aria-labelledby="guide-title">
    <span className="ff-eyebrow">A LITTLE HELP CHOOSING</span><h2 id="guide-title">Find your <em>starting point.</em></h2><p>Describe what you would like to change. Our AI guide can suggest one of the three demo services, explain its choice, or ask for more detail.</p>
    <form onSubmit={submit} aria-busy={busy}>
      <label htmlFor="guide-description">Tell us about your space</label><textarea id="guide-description" rows={4} required minLength={20} maxLength={2000} value={description} disabled={busy} onChange={e => change(e.target.value)} aria-describedby="guide-privacy" placeholder="For example: what the room is used for, what isn’t working, and what you hope to improve." />
      <p id="guide-privacy">Only this description is sent to Cloudflare Workers AI. Leave out names, addresses and private details. This fictional studio does not offer professional construction or safety advice.</p>
      <button type="button" className="ff-text-link" disabled={busy} onClick={() => change(exampleSpace)}>Use a fictional home-office example</button>
      {endpoint ? <><label className="ff-guide-consent"><input type="checkbox" checked={consent} disabled={busy} onChange={e => setConsent(e.target.checked)} /><span>I have permission to share this description for AI guidance.</span></label><button className="ff-button" type="submit" disabled={busy || !consent}>{busy ? "Finding your starting point…" : "Suggest a service"}</button></> : <p>The AI guide is not connected yet. You can explore services and use the calculator directly.</p>}
      <p className="ff-guide-small">Free allowance shared with the portfolio’s other AI demos: 3 requests per hour per network, 20 total per day.</p>
    </form>
    <p role="status" className="ff-guide-status">{message}</p>{error && <p className="ff-guide-error" role="alert">{error}</p>}
    {advice && <div className="ff-guide-result"><span className="ff-eyebrow">AI SUGGESTION / REVIEW BEFORE CHOOSING</span><h3 ref={result} tabIndex={-1}>{service ? service.name : "Let’s clarify what you need"}</h3><p>{advice.reason}</p>
      {advice.questions.length > 0 && <details><summary>Questions to consider</summary><ul>{advice.questions.map((q, i) => <li key={i}>{q}</li>)}</ul></details>}
      <p>{advice.caveat}</p>{service && <><p className="ff-guide-price">Listed demo price: {money(service.price)} USD per room</p><p className="ff-guide-small">The calculator uses fixed listed prices. Choosing this suggestion changes only the service; your room count and add-ons stay as they are. No booking or enquiry is sent.</p><button className="ff-button" type="button" onClick={() => { onChoose(service.id); setMessage(`${service.name} selected in the calculator. Review the room count and add-ons.`); }}>Build an estimate for {service.name}</button></>}
      <p className="ff-guide-small">AI can misunderstand your description. The service pages explain the actual demo scope.</p>
    </div>}
  </section>;
}
