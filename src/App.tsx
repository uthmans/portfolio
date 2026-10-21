import { useEffect, useRef, useState } from "react";
import Chart from "./survey/Chart";
import PortfolioBanner from "./components/PortfolioBanner";
import ContactForm from "./components/ContactForm";
import Walkthrough from "./components/Walkthrough";
import RoomScene from "./business/RoomScene";
import HubPreview from "./hub/Preview";
import { sample, summarize } from "./survey/data";
import {
  experienceTools,
  services,
  portfolioProject,
  surveyProject,
  businessProject,
  profile,
  hubProject,
  type Project,
} from "./content";

function Arrow() {
  return (
    <svg
      className="arrow-icon"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M5 19 19 5M5 5h14v14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PortfolioPreview() {
  return (
    <div className="portfolio-preview" aria-hidden="true">
      <div className="preview-top">
        <b>
          us<span>.</span>
        </b>
        <span>Work &nbsp; About &nbsp; Contact</span>
      </div>
      <div className="preview-body">
        <span className="preview-eyebrow">
          A LITTLE CLARITY GOES A LONG WAY
        </span>
        <h3>
          Ideas into
          <br />
          useful things<span>.</span>
        </h3>
        <p>Websites, data & everyday workflows.</p>
        <span className="preview-cta">Explore my work ↗</span>
      </div>
      <div className="preview-bottom">
        <span>SELECTED WORK</span>
        <span>01 — 04</span>
      </div>
      <div className="preview-tiles">
        <div>
          <i className="mini-bars">
            <i />
            <i />
            <i />
            <i />
          </i>
        </div>
        <div>
          <span className="mini-sun">✳</span>
        </div>
        <div>
          <i className="mini-lines">
            <i />
            <i />
            <i />
          </i>
        </div>
      </div>
    </div>
  );
}

function ProjectDetails({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (project && element && !element.open) element.showModal();
    if (!project && element?.open) element.close();
  }, [project]);
  return (
    <dialog
      ref={dialog}
      className="project-dialog"
      aria-labelledby="project-detail-title"
      onCancel={onClose}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button, a[href], input, select, textarea, summary, [tabindex="0"]',
          ),
        ).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            onClose();
        }
      }}
    >
      {project && (
        <>
          <div className="dialog-top">
            <span className="eyebrow">
              CASE STUDY {project.number} / INDEPENDENT PROJECT
            </span>
            <button
              className="close-button"
              onClick={onClose}
              aria-label="Close project details"
            >
              ×
            </button>
          </div>
          <h2 id="project-detail-title">{project.title}</h2>
          <p className="dialog-intro">{project.description}</p>
          <p className="case-study-context">
            {project.demoUrl ? "Fictional demo · " : "Personal website · "}
            Built with AI coding assistance · {project.status}
          </p>
          {project.demoUrl && (
            <a className="text-button case-study-demo" href={project.demoUrl}>
              Try the demo <Arrow />
            </a>
          )}
          <div className="detail-block">
            <h3>The problem</h3>
            <p>{project.problem}</p>
            <p>
              <strong>For:</strong> {project.audience}
            </p>
          </div>
          <div className="detail-block">
            <h3>The solution</h3>
            <p>{project.result}</p>
          </div>
          <div className="detail-block">
            <h3>Try the workflow</h3>
            <ol>
              {project.walkthrough.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <details className="detail-block case-study-features">
            <summary>All features in this version</summary>
            <ul>
              {project.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </details>
          <div className="detail-block">
            <h3>My role & AI assistance</h3>
            <p>{project.contribution}</p>
          </div>
          <div className="detail-block">
            <h3>Key decisions & limitations</h3>
            <p>{project.decisions}</p>
          </div>
          <div className="detail-block">
            <h3>How it was checked</h3>
            <ul>
              {project.verification.map((check) => (
                <li key={check}>{check}</li>
              ))}
            </ul>
            {project.demoUrl && (
              <p className="case-study-testing-note">
                Automated AI checks use controlled responses. Live AI wording
                can vary; review suggestions before using them. The demos share
                a limited free AI allowance.
              </p>
            )}
          </div>
          <div className="tags">
            {project.technology.map((tech) => (
              <span key={tech}>{tech}</span>
            ))}
          </div>
          {project.sourceUrl && (
            <div className="project-links">
              <a href={project.sourceUrl} target="_blank" rel="noreferrer">
                Source code ↗
              </a>
            </div>
          )}
        </>
      )}
    </dialog>
  );
}

export default function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [enquiryService, setEnquiryService] = useState("");
  const hasContact = Boolean(profile.email || profile.linkedInUrl);
  const surveySummary = summarize(sample, "satisfaction");

  useEffect(() => {
    if (!selectedProject) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selectedProject]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <PortfolioBanner title="Websites & automations" home />
      <header className="site-header">
        <a href="#" className="wordmark" aria-label="us. — Uthman Salama, home">
          us<span>.</span>
        </a>
        <span className="header-name">
          Uthman Salama
          <br />
          <small>Independent portfolio</small>
        </span>
        <button
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "Close" : "Menu"}{" "}
          <span aria-hidden="true">{menuOpen ? "×" : "+"}</span>
        </button>
        <nav
          id="site-navigation"
          className={menuOpen ? "nav-open" : ""}
          aria-label="Main navigation"
        >
          {[
            ["Work", "#work"],
            ["Services", "#services"],
            ["About", "#about"],
            ["Contact", "#contact"],
          ].map(([label, link]) => (
            <a key={link} href={link} onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
          <a className="nav-contact" href="#contact">
            Let’s connect <Arrow />
          </a>
        </nav>
      </header>

      <main id="main">
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-meta">
            <span className="eyebrow">WEBSITES & WORKFLOW AUTOMATION</span>
            <span className="availability">
              <i />
              {profile.availability}
            </span>
          </div>
          <div className="hero-layout">
            <div>
              <h1 id="hero-heading">
                {profile.headline[0]}
                <br />
                {profile.headline[1]}
                <br />
                <span>{profile.headline[2]}</span>
              </h1>
              <p>{profile.introduction}</p>
              <a className="primary-link" href="#work">
                Explore my work{" "}
                <span className="arrow-down">
                  <Arrow />
                </span>
              </a>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="art-grid" />
              <div className="art-note">
                <span>THE APPROACH</span>
                <p>
                  A little structure.
                  <br />A little curiosity.
                  <br />
                  <em>Something useful.</em>
                </p>
                <div>IDEA → BUILD → IMPROVE</div>
              </div>
              <svg className="art-symbol" viewBox="0 0 100 100" fill="none">
                <path
                  d="M50 8v84M8 50h84M20 20l60 60M20 80l60-60"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
              </svg>
              <span className="art-caption">MADE WITH INTENTION, ALWAYS.</span>
            </div>
          </div>
          <div className="hero-footer">
            <span>People first. Systems second.</span>
            <span>
              SCROLL TO EXPLORE{" "}
              <span className="arrow-down">
                <Arrow />
              </span>
            </span>
          </div>
        </section>

        <section
          id="work"
          className="section work-section"
          aria-labelledby="work-heading"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">01 / SELECTED WORK</span>
              <h2 id="work-heading">
                A place for things
                <br />
                that <em>work.</em>
              </h2>
            </div>
            <p>
              Working websites, data tools, and AI workflows.
              <br />
              Try a demo or read the decisions behind the build.
            </p>
          </div>
          <Walkthrough />
          <article
            id="project-survey"
            className="featured-project survey-feature"
          >
            <div className="survey-feature-visual">
              <span className="eyebrow">WORKING DEMO / FICTIONAL SAMPLE</span>
              <div className="survey-feature-screen" aria-hidden="true">
                <div className="survey-preview-heading">
                  <strong>Survey Insights Studio</strong>
                  <span>{sample.length} fictional responses</span>
                </div>
                <p>Session satisfaction</p>
                <Chart summary={surveySummary} />
                <span>
                  {surveySummary.answered} answered · {surveySummary.missing}{" "}
                  missing · Mean {surveySummary.mean?.toFixed(2) ?? "—"} / 5
                </span>
              </div>
              <a href="survey/" className="survey-preview-action">
                Open the live demo <Arrow />
              </a>
            </div>
            <div className="featured-copy">
              <div className="project-meta">
                <span>PROJECT {surveyProject.number}</span>
                <span className="status">
                  <i />
                  {surveyProject.status}
                </span>
              </div>
              <h3>{surveyProject.title}</h3>
              <p>{surveyProject.description}</p>
              <div className="tags">
                <span>CSV → charts → AI themes</span>
                <span>Source-linked findings</span>
              </div>
              <a className="text-button" href="survey/">
                Try the live demo <Arrow />
              </a>
              <button
                className="text-button survey-details-button"
                aria-label={`Read case study: ${surveyProject.title}`}
                onClick={() => setSelectedProject(surveyProject)}
              >
                Read case study <Arrow />
              </button>
              <p className="honesty-note">
                Independent demo · Built with AI coding assistance
              </p>
            </div>
          </article>
          <article
            id="project-business"
            className="featured-project business-feature"
          >
            <div className="business-feature-visual">
              <span className="eyebrow">WORKING DEMO / FICTIONAL BUSINESS</span>
              <div className="business-feature-scene" aria-hidden="true">
                <div>
                  <strong>FORM & FIELD</strong>
                  <span>Thoughtful spaces. Everyday living.</span>
                </div>
                <RoomScene variant="nook" />
              </div>
              <a href="business/" className="survey-preview-action">
                Explore the business demo <Arrow />
              </a>
            </div>
            <div className="featured-copy">
              <div className="project-meta">
                <span>PROJECT {businessProject.number}</span>
                <span className="status">
                  <i />
                  {businessProject.status}
                </span>
              </div>
              <h3>{businessProject.title}</h3>
              <p>{businessProject.description}</p>
              <div className="tags">
                <span>AI service guide</span>
                <span>Fixed-rule estimates</span>
              </div>
              <a className="text-button" href="business/">
                Try Form & Field <Arrow />
              </a>
              <button
                className="text-button survey-details-button"
                aria-label={`Read case study: ${businessProject.title}`}
                onClick={() => setSelectedProject(businessProject)}
              >
                Read case study <Arrow />
              </button>
              <p className="honesty-note">
                Independent demo · Fictional brand · AI-assisted build
              </p>
            </div>
          </article>
          <article id="project-hub" className="featured-project hub-feature">
            <div className="hub-feature-visual">
              <span className="eyebrow">
                WORKING DEMO / FICTIONAL WORKSPACE
              </span>
              <HubPreview />
              <a href="hub/" className="survey-preview-action">
                Open the project workspace <Arrow />
              </a>
            </div>
            <div className="featured-copy">
              <div className="project-meta">
                <span>PROJECT {hubProject.number}</span>
                <span className="status">
                  <i />
                  {hubProject.status}
                </span>
              </div>
              <h3>{hubProject.title}</h3>
              <p>{hubProject.description}</p>
              <div className="tags">
                <span>AI planning & task tracking</span>
                <span>Browser-local saving</span>
              </div>
              <a className="text-button" href="hub/">
                Try the Project Hub <Arrow />
              </a>
              <button
                className="text-button survey-details-button"
                aria-label={`Read case study: ${hubProject.title}`}
                onClick={() => setSelectedProject(hubProject)}
              >
                Read case study <Arrow />
              </button>
              <p className="honesty-note">
                Independent demo · Fictional sample · AI-assisted build
              </p>
            </div>
          </article>
          <article className="featured-project">
            <div className="featured-visual">
              <span className="visual-label">
                THE PORTFOLIO / PERSONAL WEBSITE
              </span>
              <PortfolioPreview />
              <button
                className="visual-open preview-trigger"
                onClick={() => setSelectedProject(portfolioProject)}
                aria-label="View details for A portfolio with a purpose"
              >
                <Arrow />
              </button>
            </div>
            <div className="featured-copy">
              <div className="project-meta">
                <span>PROJECT {portfolioProject.number}</span>
                <span className="status">
                  <i />
                  Personal website
                </span>
              </div>
              <h3>{portfolioProject.title}</h3>
              <p>{portfolioProject.description}</p>
              <div className="tags">
                <span>Responsive website</span>
                <span>React & TypeScript</span>
              </div>
              <button
                className="text-button"
                aria-label={`Read case study: ${portfolioProject.title}`}
                onClick={() => setSelectedProject(portfolioProject)}
              >
                Read case study <Arrow />
              </button>
              <p className="honesty-note">
                Independent work · Built with AI coding assistance
              </p>
            </div>
          </article>
        </section>

        <section
          id="services"
          className="section services-section"
          aria-labelledby="services-heading"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">02 / HOW I CAN HELP</span>
              <h2 id="services-heading">
                Useful tools.
                <br />
                <em>Built around your work.</em>
              </h2>
            </div>
            <p>
              Start with a website, a data problem, or a workflow that takes too
              much time. We can discuss a practical scope together.
            </p>
          </div>
          <div className="service-offers">
            {services.map((service, index) => (
              <article
                className="service-offer"
                key={service.id}
                aria-labelledby={`service-${service.id}`}
              >
                <span className="eyebrow">0{index + 1}</span>
                <h3 id={`service-${service.id}`}>{service.title}</h3>
                <p>{service.description}</p>
                <ul>
                  {service.deliverables.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="service-offer-actions">
                  <span className="service-example-label">
                    See an independent demo
                  </span>
                  <a className="text-button" href={service.demoUrl}>
                    {service.example}
                    <Arrow />
                  </a>
                  {profile.email && (
                    <a
                      className="text-button service-enquiry"
                      href="#contact"
                      onClick={() => {
                        setEnquiryService(service.id);
                        requestAnimationFrame(() =>
                          document
                            .getElementById("enquiry-heading")
                            ?.focus({ preventScroll: true }),
                        );
                      }}
                    >
                      {service.contactLabel}
                      <Arrow />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
          <p className="services-next-step">
            Have something in mind? Tell me your goal, the tools you use, and
            your preferred timeline. We’ll discuss scope and costs before
            starting.
          </p>
        </section>

        <section
          id="about"
          className="section about-section"
          aria-labelledby="about-heading"
        >
          <div className="about-art" aria-hidden="true">
            <div className="about-monogram">
              us<span>.</span>
            </div>
            <div className="about-sticker">
              Curious by nature.
              <br />
              Practical by choice.
              <Arrow />
            </div>
            <span className="about-art-caption">
              A PERSON BEHIND THE PROJECTS.
            </span>
          </div>
          <div className="about-copy">
            <span className="eyebrow">03 / A LITTLE ABOUT ME</span>
            <h2 id="about-heading">Hi, I’m Uthman.</h2>
            <p className="about-lead">
              I’m drawn to the work between people and technology.
            </p>
            <p>
              From May 2021 to September 2026, I worked at Tech2Peace across
              technology coordination, community and program operations,
              databases and CRM, reporting, website management, and
              administrative systems.
            </p>
            <div className="experience-summary">
              <span className="eyebrow">TECH2PEACE / 2021–2026</span>
              <h3>Operations, Systems &amp; Resource Development Lead</h3>
              <p>
                Built and administered Airtable-based CRM and operations systems
                covering more than 10,000 records, and created tools for
                recruitment, events, contracts, fundraising, and feedback
                analysis.
              </p>
            </div>
            <p>
              Now, I’m exploring how AI-assisted coding can help me turn that
              practical experience into original digital tools. I’m learning by
              building, asking questions, testing, and improving.
            </p>
            <div
              className="tool-list"
              aria-label="Tools I have experience with"
            >
              {experienceTools.map((tool) => (
                <span key={tool}>{tool}</span>
              ))}
            </div>
            <p className="languages">English · Arabic · Spanish</p>
            <p className="about-note">
              All projects here are independent. Organizational systems, data,
              and materials remain private; this portfolio does not imply an
              endorsement.
            </p>
          </div>
        </section>

        <section
          id="contact"
          className="contact-section"
          aria-labelledby="contact-heading"
        >
          <div className="contact-overview">
            <div>
              <span className="eyebrow">04 / LET’S CONNECT</span>
              <h2 id="contact-heading">
                Good work starts
                <br />
                with a <em>conversation.</em>
              </h2>
              <p>
                I’m interested in remote opportunities and freelance projects
                <br className="desktop-break" /> where I can build, organize,
                and keep learning.
              </p>
            </div>
            <div className="contact-actions">
              {hasContact ? (
                <>
                  {profile.email && (
                    <a className="contact-link" href="#enquiry-heading">
                      Start an enquiry <Arrow />
                    </a>
                  )}
                  {profile.linkedInUrl && (
                    <a
                      className="contact-secondary"
                      href={profile.linkedInUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Connect on LinkedIn <Arrow />
                    </a>
                  )}
                </>
              ) : (
                <div className="contact-pending">
                  <span className="contact-mark" aria-hidden="true">
                    <Arrow />
                  </span>
                  <strong>Contact details coming soon</strong>
                  <p>
                    This portfolio is taking shape.
                    <br />A direct way to reach me will be added here.
                  </p>
                </div>
              )}
              {profile.githubUrl && (
                <a
                  className="contact-secondary"
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub <Arrow />
                </a>
              )}
              {profile.cvUrl && (
                <a className="contact-secondary" href={profile.cvUrl} download>
                  Download my CV <Arrow />
                </a>
              )}
            </div>
          </div>
          <ContactForm
            service={enquiryService}
            onServiceChange={setEnquiryService}
          />
        </section>
      </main>
      <footer className="site-footer">
        <a className="wordmark" href="#" aria-label="us. — Back to top">
          us<span>.</span>
        </a>
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span>Made with curiosity & AI assistance.</span>
        <a href="#">Back to top ↑</a>
      </footer>
      <ProjectDetails
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </>
  );
}
