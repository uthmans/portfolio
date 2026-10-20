import { useState } from "react";
import { services } from "../content";

export default function ContactForm({
  service,
  onServiceChange,
}: {
  service: string;
  onServiceChange: (value: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const endpoint = import.meta.env.VITE_CONTACT_FORM_URL || "";
  const configured = /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(
    endpoint,
  );
  return (
    <form
      className="enquiry-form"
      aria-labelledby="enquiry-heading"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy || sent) return;
        if (!configured) {
          setError(
            "The enquiry form is not connected yet. Please try again later.",
          );
          return;
        }
        const form = event.currentTarget;
        const data = new FormData(form);
        if (String(data.get("website") || "")) return;
        if (
          !String(data.get("name") || "").trim() ||
          String(data.get("message") || "").trim().length < 10
        ) {
          setError(
            "Please enter your name and a short description of at least 10 characters.",
          );
          return;
        }
        setBusy(true);
        setError("");
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: String(data.get("name") || "").trim(),
              email: String(data.get("email") || "").trim(),
              service:
                services.find((item) => item.id === service)?.title ||
                "Something else / not sure yet",
              budget: data.get("budget"),
              timeline: data.get("timeline"),
              message: String(data.get("message") || "").trim(),
              _subject: "New portfolio enquiry",
              _gotcha: data.get("website"),
            }),
            signal: AbortSignal.timeout(20000),
          });
          if (!response.ok || (await response.json()).ok !== true)
            throw new Error("delivery");
          setSent(true);
        } catch {
          setError(
            "We couldn’t confirm your message was sent. Your details are still here. Please check your connection and try again. If you already retried, wait before sending again to avoid duplicates.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3 id="enquiry-heading" tabIndex={-1}>
        Tell me about your project.
      </h3>
      <p className="enquiry-intro">
        A few details are enough to start. Required fields are marked *.
      </p>
      <fieldset disabled={busy || sent}>
        <label>
          Your name *
          <input name="name" autoComplete="name" required maxLength={100} />
        </label>
        <label>
          Email address *
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
        <label>
          What can I help with?
          <select
            name="service"
            value={service}
            onChange={(event) => onServiceChange(event.target.value)}
          >
            <option value="">Something else / not sure yet</option>
            {services.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <div className="enquiry-options">
          <label>
            Budget (optional)
            <input
              name="budget"
              maxLength={100}
              placeholder="Not sure yet is fine"
            />
          </label>
          <label>
            Timeline (optional)
            <input
              name="timeline"
              maxLength={100}
              placeholder="Exploring options"
            />
          </label>
        </div>
        <label>
          What would you like to build? *
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={4000}
            rows={5}
            placeholder={
              services.find((item) => item.id === service)?.prompt ||
              "What’s your goal, and what would you like help with?"
            }
          />
        </label>
        <label className="enquiry-honeypot" aria-hidden="true">
          Leave this empty
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <p className="enquiry-privacy">
          Your details go through Formspree to Uthman so he can reply about your
          project. Please leave out passwords and private client data.
        </p>
        <button className="enquiry-submit" type="submit">
          {busy ? "Sending…" : sent ? "Message sent" : "Send enquiry"}
        </button>
      </fieldset>
      <div role="status" aria-live="polite">
        {sent && (
          <p className="enquiry-success">
            Thank you! Your enquiry was submitted successfully. I’ll reply to
            the email address you provided.
          </p>
        )}
      </div>
      {error && (
        <p className="enquiry-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
