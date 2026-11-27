import { useState } from "react";

export default function ContactForm() {
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
              organisation: String(data.get("organisation") || "").trim(),
              role: String(data.get("role") || "").trim(),
              message: String(data.get("message") || "").trim(),
              _subject: "New portfolio message",
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
        Send me a message.
      </h3>
      <p className="enquiry-intro">
        Recruiting for a role, or want to talk about my experience? Required
        fields are marked *.
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
        <div className="enquiry-options">
          <label>
            Organisation (optional)
            <input name="organisation" autoComplete="organization" maxLength={150} />
          </label>
          <label>
            Role (optional)
            <input name="role" maxLength={150} />
          </label>
        </div>
        <label>
          Your message *
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={4000}
            rows={5}
            placeholder="Tell me about the role, the team, and how to reach you."
          />
        </label>
        <label className="enquiry-honeypot" aria-hidden="true">
          Leave this empty
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <p className="enquiry-privacy">
          Your details go through Formspree to Uthman so he can reply to your
          message. Your unsent draft resets if you reload or close this page.
          Please leave out passwords and other private data.
        </p>
        <button className="enquiry-submit" type="submit">
          {busy ? "Sending…" : sent ? "Message sent" : "Send message"}
        </button>
      </fieldset>
      <div role="status" aria-live="polite">
        {sent && (
          <p className="enquiry-success">
            Thank you! Your message was sent. I’ll reply to the email address
            you provided.
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
