import { useState, type FormEvent } from "react";
import RoomScene from "./RoomScene";
import PortfolioBanner from "../components/PortfolioBanner";
import {
  calculateQuote,
  enquiryText,
  extras,
  money,
  services,
  validateEnquiry,
  type Enquiry,
  type EnquiryErrors,
  type ExtraId,
  type Quote,
  type ServiceId,
} from "./model";

const homeUrl = `${import.meta.env.BASE_URL}business/`;
const pathname = window.location.pathname.replace(/\/$/, "");
const currentService = services.find((service) =>
  pathname.endsWith(`/services/${service.id}`),
);
const homeSection = (anchor: string) =>
  currentService ? `${homeUrl}#${anchor}` : `#${anchor}`;
const initialService =
  services.find(
    (service) =>
      service.id === new URLSearchParams(window.location.search).get("service"),
  )?.id ?? "room-planning";

function Arrow({
  direction = "out",
}: {
  direction?: "out" | "down" | "up" | "left";
}) {
  return (
    <svg
      className={`ff-arrow ff-arrow-${direction}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M5 19 19 5M5 5h14v14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Process() {
  return (
    <section className="ff-process" aria-labelledby="process-title">
      <div>
        <span className="ff-eyebrow">A CONSIDERED PROCESS</span>
        <h2 id="process-title">
          Small steps.
          <br />
          <em>A clearer space.</em>
        </h2>
      </div>
      <ol>
        {[
          [
            "Start with your space",
            "Describe the room, what works, and what gets in the way.",
          ],
          [
            "Choose a direction",
            "Explore a practical layout and a small set of design decisions.",
          ],
          [
            "Make it your own",
            "Use the concept as a starting point for your own next steps.",
          ],
        ].map(([title, text], index) => (
          <li key={title}>
            <span>0{index + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function BusinessApp() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [serviceId, setServiceId] = useState<ServiceId>(initialService);
  const [rooms, setRooms] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<ExtraId[]>([]);
  const [form, setForm] = useState<Enquiry>({
    name: "",
    email: "",
    brief: "",
    consent: false,
  });
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [preview, setPreview] = useState<{
    form: Enquiry;
    quote: Quote;
  } | null>(null);
  const [downloadNotice, setDownloadNotice] = useState("");
  const quote = calculateQuote(serviceId, rooms, selectedExtras);
  const errorEntries = Object.entries(errors).filter(([, message]) =>
    Boolean(message),
  );
  function updateForm<K extends keyof Enquiry>(key: K, value: Enquiry[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
    setPreview(null);
    setDownloadNotice("");
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const next = validateEnquiry(form);
    setErrors(next);
    setPreview(null);
    const first = Object.keys(next)[0];
    if (first) document.getElementById(`enquiry-${first}`)?.focus();
    else
      setPreview({
        form: {
          ...form,
          name: form.name.trim(),
          email: form.email.trim(),
          brief: form.brief.trim(),
        },
        quote,
      });
  }
  function downloadPreview() {
    if (!preview) return;
    const url = URL.createObjectURL(
      new Blob([enquiryText(preview.form, preview.quote)], {
        type: "text/plain;charset=utf-8",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "form-and-field-demo-enquiry.txt";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloadNotice(
      "Demo preview download requested. Nothing has been sent.",
    );
  }
  return (
    <div className="ff-site">
      <a className="ff-skip" href="#ff-main">
        Skip to content
      </a>
      <PortfolioBanner
        title={
          currentService
            ? `Form & Field / ${currentService.name}`
            : "Form & Field"
        }
        context="Fictional business demo"
      />
      <header className="ff-header">
        <a href={homeUrl} className="ff-brand">
          FORM <span>&</span> FIELD<small>Spaces for everyday living</small>
        </a>
        <button
          className="ff-menu"
          aria-expanded={menuOpen}
          aria-controls="ff-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "Close menu" : "Menu"}
        </button>
        <nav
          id="ff-navigation"
          className={menuOpen ? "ff-nav-open" : ""}
          aria-label="Business navigation"
        >
          {[
            ["Services", "services"],
            ["Concept spaces", "spaces"],
            ["Our approach", "approach"],
          ].map(([label, anchor]) => (
            <a
              key={anchor}
              href={homeSection(anchor)}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
          <a
            className="ff-nav-cta"
            href={homeSection("estimate")}
            onClick={() => setMenuOpen(false)}
          >
            Estimate a project <Arrow />
          </a>
        </nav>
      </header>
      <main id="ff-main">
        {currentService ? (
          <>
            <section className="ff-service-hero">
              <div>
                <a className="ff-back-link" href={`${homeUrl}#services`}>
                  <Arrow direction="left" /> All services
                </a>
                <span className="ff-eyebrow">
                  FORM & FIELD / {currentService.name.toUpperCase()}
                </span>
                <h1>{currentService.tagline}</h1>
                <p>{currentService.description}</p>
                <p className="ff-service-price">
                  {money(currentService.price)} USD / room{" "}
                  <span>Illustrative demo price</span>
                </p>
                <a
                  className="ff-button"
                  href={`${homeUrl}?service=${currentService.id}#estimate`}
                >
                  Estimate this service <Arrow />
                </a>
              </div>
              <RoomScene variant={currentService.variant} />
            </section>
            <section className="ff-service-detail">
              <div>
                <span className="ff-eyebrow">THE PACKAGE</span>
                <h2>
                  A useful direction,
                  <br />
                  <em>without the overwhelm.</em>
                </h2>
              </div>
              <div>
                <h3>What’s included</h3>
                <ul>
                  {currentService.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <h3>The boundaries</h3>
                <p>{currentService.boundary}</p>
                <p>
                  This is an independent fictional-business demonstration. No
                  service can be purchased or booked here.
                </p>
              </div>
            </section>
            <Process />
            <section className="ff-service-next">
              <h2>See how the estimate works.</h2>
              <a
                className="ff-button"
                href={`${homeUrl}?service=${currentService.id}#estimate`}
              >
                Build a demo estimate <Arrow />
              </a>
            </section>
          </>
        ) : (
          <>
            <section className="ff-hero">
              <div className="ff-hero-copy">
                <span className="ff-eyebrow">
                  THOUGHTFUL SPACES. EVERYDAY LIVING.
                </span>
                <h1>
                  Make room
                  <br />
                  for{" "}
                  <em>
                    something
                    <br />
                    good.
                  </em>
                </h1>
                <p>
                  A clearer layout. A warmer corner. A workspace that makes
                  sense. Explore small, considered changes for the spaces you
                  use every day.
                </p>
                <div className="ff-hero-actions">
                  <a className="ff-button" href="#services">
                    Find your starting point <Arrow />
                  </a>
                  <a className="ff-text-link" href="#estimate">
                    Build an estimate <Arrow direction="down" />
                  </a>
                </div>
                <span className="ff-hero-note">
                  An original fictional studio, built as an interactive website
                  demo.
                </span>
              </div>
              <div className="ff-hero-art">
                <RoomScene />
                <span className="ff-art-label">
                  CONCEPT STUDY 01 — A QUIETER CORNER
                </span>
              </div>
            </section>
            <section id="services" className="ff-section">
              <div className="ff-section-heading">
                <div>
                  <span className="ff-eyebrow">
                    01 / FIND YOUR STARTING POINT
                  </span>
                  <h2>
                    A little help,
                    <br />
                    <em>where it matters.</em>
                  </h2>
                </div>
                <p>
                  Three focused, fictional service packages. Clear scope, simple
                  choices, and an estimate you can understand.
                </p>
              </div>
              <div className="ff-service-grid">
                {services.map((service, index) => (
                  <article key={service.id}>
                    <span className="ff-service-number">0{index + 1}</span>
                    <h3>{service.name}</h3>
                    <p>{service.description}</p>
                    <div className="ff-card-bottom">
                      <span>
                        {money(service.price)} <small>USD / room</small>
                      </span>
                      <a href={`${homeUrl}services/${service.id}/`}>
                        Explore service <Arrow />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <section id="spaces" className="ff-section ff-spaces">
              <div className="ff-section-heading">
                <div>
                  <span className="ff-eyebrow">
                    02 / A SENSE OF POSSIBILITY
                  </span>
                  <h2>
                    Same space.
                    <br />
                    <em>A different feeling.</em>
                  </h2>
                </div>
                <p>
                  Original illustrated concept studies. These are fictional
                  design directions, not photographs of completed client work.
                </p>
              </div>
              <div className="ff-spaces-grid">
                {[
                  ["living", "Room to gather", "A warmer living room"],
                  ["nook", "A slower moment", "A reading corner"],
                  ["work", "Space to focus", "A home workspace"],
                ].map(([variant, title, caption]) => (
                  <figure key={variant}>
                    <RoomScene
                      variant={variant as "living" | "nook" | "work"}
                    />
                    <figcaption>
                      <strong>{title}</strong>
                      <span>{caption} · Concept illustration</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
            <section id="approach" className="ff-section ff-approach">
              <Process />
            </section>
            <section id="estimate" className="ff-section ff-estimate">
              <div className="ff-section-heading">
                <div>
                  <span className="ff-eyebrow">
                    03 / MAKE THE NUMBERS CLEAR
                  </span>
                  <h2>
                    A plan for your space.
                    <br />
                    <em>An estimate you can follow.</em>
                  </h2>
                </div>
                <p>
                  Try the calculator with illustrative USD prices. It’s a demo
                  estimate, not a booking or binding quote.
                </p>
              </div>
              <div className="ff-estimate-grid">
                <div className="ff-quote-controls">
                  <label htmlFor="quote-service">Choose a service</label>
                  <select
                    id="quote-service"
                    value={serviceId}
                    onChange={(event) => {
                      setServiceId(event.target.value as ServiceId);
                      setPreview(null);
                    }}
                  >
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} — {money(service.price)} / room
                      </option>
                    ))}
                  </select>
                  <label htmlFor="quote-rooms">Number of rooms</label>
                  <select
                    id="quote-rooms"
                    value={rooms}
                    onChange={(event) => {
                      setRooms(Number(event.target.value));
                      setPreview(null);
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((number) => (
                      <option key={number} value={number}>
                        {number} {number === 1 ? "room" : "rooms"}
                      </option>
                    ))}
                  </select>
                  <fieldset>
                    <legend>Optional add-ons · charged once per project</legend>
                    {extras.map((extra) => (
                      <label className="ff-extra" key={extra.id}>
                        <input
                          type="checkbox"
                          checked={selectedExtras.includes(extra.id)}
                          onChange={(event) => {
                            setSelectedExtras((previous) =>
                              event.target.checked
                                ? [...previous, extra.id]
                                : previous.filter((id) => id !== extra.id),
                            );
                            setPreview(null);
                          }}
                        />
                        <span>
                          <strong>
                            {extra.name} <small>+{money(extra.price)}</small>
                          </strong>
                          <span>{extra.description}</span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                </div>
                <div className="ff-quote-result">
                  <span className="ff-eyebrow">YOUR ILLUSTRATIVE ESTIMATE</span>
                  <dl>
                    {quote.lines.map((line) => (
                      <div key={line.label}>
                        <dt>{line.label}</dt>
                        <dd>{money(line.amount)}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="ff-total" role="status">
                    <span>Demo total</span>
                    <strong>
                      {money(quote.total)} <small>USD</small>
                    </strong>
                  </div>
                  <p>
                    Service price × rooms, plus selected one-time add-ons.
                    Furniture, installation, taxes, and purchases are outside
                    this demo calculation.
                  </p>
                  <a className="ff-button" href="#enquire">
                    Preview an enquiry with this estimate{" "}
                    <Arrow direction="down" />
                  </a>
                  <details>
                    <summary>See every pricing rule</summary>
                    <ul>
                      {services.map((service) => (
                        <li key={service.id}>
                          {service.name}: {money(service.price)} per room
                        </li>
                      ))}
                      {extras.map((extra) => (
                        <li key={extra.id}>
                          {extra.name}: {money(extra.price)} once per project
                        </li>
                      ))}
                    </ul>
                    <p>
                      No discounts, hidden multipliers, or real charges. Choose
                      1–5 rooms.
                    </p>
                  </details>
                </div>
              </div>
            </section>
            <section id="enquire" className="ff-section ff-enquiry">
              <div className="ff-enquiry-intro">
                <span className="ff-eyebrow">04 / TRY THE NEXT STEP</span>
                <h2>
                  Tell us about
                  <br />
                  <em>your imaginary space.</em>
                </h2>
                <p>
                  This form creates a local preview only. Nothing is sent, saved
                  to a server, or booked. Use fictional details to try it.
                </p>
                <button
                  className="ff-sample-button"
                  onClick={() => {
                    setForm({
                      name: "Alex Sample",
                      email: "alex@example.com",
                      brief:
                        "An imaginary living room needs a clearer furniture layout and a warmer reading corner. I would like a simple plan using the existing pieces.",
                      consent: true,
                    });
                    setErrors({});
                    setPreview(null);
                    setDownloadNotice("");
                  }}
                >
                  Fill with sample details
                </button>
                <div className="ff-selected-estimate">
                  <span>Current demo estimate</span>
                  <strong>
                    {quote.serviceName} · {quote.rooms}{" "}
                    {quote.rooms === 1 ? "room" : "rooms"}
                  </strong>
                  <span>{money(quote.total)} USD</span>
                  <a href="#estimate">
                    Adjust the estimate <Arrow direction="up" />
                  </a>
                </div>
              </div>
              <form onSubmit={submit} noValidate className="ff-enquiry-form">
                {errorEntries.length > 0 && (
                  <div role="alert" className="ff-errors">
                    <h3>Check your enquiry details</h3>
                    <ul>
                      {errorEntries.map(([key, message]) => (
                        <li key={key}>
                          <a
                            href={`#enquiry-${key}`}
                            onClick={() =>
                              document.getElementById(`enquiry-${key}`)?.focus()
                            }
                          >
                            {message}
                          </a>
                        </li>
                      ))}
                    </ul>
                    <p>Nothing has been sent.</p>
                  </div>
                )}
                <label htmlFor="enquiry-name">Name</label>
                <input
                  id="enquiry-name"
                  autoComplete="off"
                  maxLength={80}
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="ff-field-error">
                    {errors.name}
                  </p>
                )}
                <label htmlFor="enquiry-email">Email</label>
                <input
                  id="enquiry-email"
                  type="email"
                  autoComplete="off"
                  maxLength={254}
                  placeholder="alex@example.com"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="ff-field-error">
                    {errors.email}
                  </p>
                )}
                <label htmlFor="enquiry-brief">
                  What would you like to change?
                </label>
                <textarea
                  id="enquiry-brief"
                  rows={5}
                  maxLength={1200}
                  value={form.brief}
                  onChange={(event) => updateForm("brief", event.target.value)}
                  aria-invalid={Boolean(errors.brief)}
                  aria-describedby={errors.brief ? "brief-error" : "brief-help"}
                />
                <small id="brief-help">
                  20–1,200 characters · fictional details are welcome
                </small>
                {errors.brief && (
                  <p id="brief-error" className="ff-field-error">
                    {errors.brief}
                  </p>
                )}
                <label className="ff-consent" htmlFor="enquiry-consent">
                  <input
                    id="enquiry-consent"
                    type="checkbox"
                    checked={form.consent}
                    onChange={(event) =>
                      updateForm("consent", event.target.checked)
                    }
                    aria-invalid={Boolean(errors.consent)}
                    aria-describedby={
                      errors.consent ? "consent-error" : undefined
                    }
                  />
                  <span>
                    I understand this is a demo and nothing will be sent.
                  </span>
                </label>
                {errors.consent && (
                  <p id="consent-error" className="ff-field-error">
                    {errors.consent}
                  </p>
                )}
                <button className="ff-button" type="submit">
                  Preview enquiry <Arrow />
                </button>
                {preview && (
                  <section
                    className="ff-enquiry-preview"
                    aria-labelledby="preview-title"
                  >
                    <h3 id="preview-title" aria-live="polite">
                      Local enquiry preview — not sent
                    </h3>
                    <p>
                      <strong>{preview.form.name}</strong> ·{" "}
                      {preview.form.email}
                    </p>
                    <p className="ff-preview-brief">{preview.form.brief}</p>
                    <p>
                      {preview.quote.serviceName} · {preview.quote.rooms}{" "}
                      {preview.quote.rooms === 1 ? "room" : "rooms"} ·{" "}
                      {money(preview.quote.total)} USD illustrative estimate
                    </p>
                    <button
                      type="button"
                      className="ff-sample-button"
                      onClick={downloadPreview}
                    >
                      Download enquiry preview
                    </button>
                    <p role="status">{downloadNotice}</p>
                  </section>
                )}
              </form>
            </section>
          </>
        )}
      </main>
      <footer className="ff-footer">
        <div className="ff-brand">
          FORM <span>&</span> FIELD
        </div>
        <p>
          A fictional business created for Uthman Salama’s portfolio.
          <br />
          Original illustrations · Built with AI coding assistance · No real
          bookings
        </p>
        <a href={`${import.meta.env.BASE_URL}#work`}>
          Explore the portfolio <Arrow />
        </a>
      </footer>
    </div>
  );
}
