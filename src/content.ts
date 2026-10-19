// English content lives here so future translations can use the same structure.
// Add only confirmed contact details. Empty fields never produce placeholder links.
export const profile = {
  name: "Uthman Salama",
  headline: ["Websites.", "Automations.", "Made useful."],
  introduction:
    "I build thoughtful websites and practical automations that help people get things done. Drawing on experience with databases, forms, and everyday workflows, I’m developing original projects through AI-assisted coding.",
  availability: "Open to remote roles & freelance projects",
  email: "uthmansalama@gmail.com",
  linkedInUrl: "",
  githubUrl: "",
  cvUrl: "Uthman-Salama-CV-2026.pdf",
};

export type Project = {
  id: string;
  number: string;
  title: string;
  category: string;
  status: "First version" | "Version 2 · AI-ready";
  description: string;
  problem: string;
  audience: string;
  features: string[];
  contribution: string;
  technology: string[];
  decisions: string;
  demoUrl?: string;
  sourceUrl?: string;
};

export const portfolioProject: Project = {
  id: "portfolio",
  number: "01",
  title: "A portfolio with a purpose",
  category: "Website · Design · Development",
  status: "First version",
  description:
    "A personal home for my work, experience, and the things I’m learning to build.",
  problem:
    "Make it easy for hiring managers and potential clients to understand my background and explore honest evidence of my work.",
  audience: "Hiring managers, collaborators, and potential freelance clients.",
  features: [
    "Responsive gallery of four working projects",
    "Keyboard-accessible project details",
    "Editable content and contact configuration",
    "Reduced-motion support",
  ],
  contribution:
    "I defined the goals and content requirements. This first implementation was built with AI coding assistance. I’m reviewing the design, testing it, and learning to maintain and improve it.",
  technology: ["React", "TypeScript", "Vite", "CSS"],
  decisions:
    "Keep the portfolio fast and straightforward: no login, database, paid services, or unnecessary tracking. Feature working independent projects and show contact links only when confirmed.",
};

export const surveyProject: Project = {
  id: "survey",
  number: "02",
  title: "Survey Insights Studio",
  category: "Data exploration",
  status: "Version 2 · AI-ready",
  description:
    "Explore survey ratings and written feedback, with validated imports, evidence-linked example findings, downloadable reports, and a prepared AI integration.",
  problem:
    "Make a small survey easier to explore without hiding response counts or the effect of missing values.",
  audience:
    "People exploring feedback and learning to interpret survey results.",
  features: [
    "12 original fictional sample responses and a random fictional-data generator",
    "Validated CSV import with a format guide and downloadable example",
    "Two rating questions with track and format filters",
    "Response counts, distributions, and means",
    "Explicit missing-value rules and an unanswered state",
    "Filtered CSV download and a source-row table",
    "One CSV import for ratings and optional written feedback, with expandable source-linked findings",
    "Downloadable feedback reports and a validated backend integration for live AI",
  ],
  contribution:
    "I set the project goals and scope. This first version was implemented with AI coding assistance, including calculation and browser checks. I’m reviewing the result and learning to explain and maintain it.",
  technology: ["React", "TypeScript", "CSS"],
  decisions:
    "A single CSV uses five required rating columns plus an optional feedback column. Charts and written feedback share the same dataset and filters. Data stays in the tab and resets on reload; download to keep it. Invalid files preserve the current dataset. Missing ratings are excluded from averages and percentages. The hand-written feedback example is fictional, not AI-generated. An AI request sends selected anonymised comments to OpenAI through a Cloudflare backend after consent. Requests support at most 100 comments, with public-demo usage limits. Source-ID validation does not guarantee accurate interpretations. The application does not persist feedback on its server; provider processing terms apply. There is no login.",
  demoUrl: "survey/",
};

export const businessProject: Project = {
  id: "business",
  number: "03",
  title: "A small business, online",
  category: "Interactive website",
  status: "First version",
  description:
    "Form & Field: an original fictional interiors studio with service pages, a transparent estimate calculator, and a validated enquiry preview.",
  problem:
    "Help visitors understand a service, compare clear pricing, and take a useful next step without misleading them about bookings or delivery.",
  audience:
    "Potential customers of a fictional interior-planning studio, and people evaluating website design and interaction work.",
  features: [
    "Original responsive brand and illustrated concept spaces",
    "Three service pages with scope and illustrative pricing",
    "Room-count and add-on quote calculator with explicit rules",
    "Accessible enquiry validation and sample details",
    "Local enquiry preview and a downloadable text summary",
  ],
  contribution:
    "I chose this project to demonstrate website design and useful interactions. The fictional brand and implementation were created with AI coding assistance, including pricing, validation, and browser checks. My next step is reviewing the design and testing the journey so I can explain and maintain the work.",
  technology: ["React", "TypeScript", "CSS", "Original SVG illustrations"],
  decisions:
    "Form & Field is fictional. Prices are illustrative USD amounts; this is not a real business offer. The form creates a local preview only: no enquiry, booking, or payment is sent. No client testimonials, completed client projects, or real business contact details are invented. Enquiry data resets on reload; download to keep the preview.",
  demoUrl: "business/",
};

export const hubProject: Project = {
  id: "hub",
  number: "04",
  title: "Freelancer Project Hub",
  category: "Internal application",
  status: "First version",
  description:
    "A browser-local workspace for projects, clients, tasks, stages, and budgets, with validated backups you can download and restore.",
  problem:
    "Bring scattered project details and next steps into one view, while keeping budget and task calculations clear.",
  audience: "Independent freelancers organising a small set of projects.",
  features: [
    "Three original fictional projects to explore",
    "Create, edit and delete projects with validated USD amounts",
    "Task checklists, project stages and due dates",
    "Search, stage and overdue filters with matching summary totals",
    "Browser-local saving, JSON backup and validated restore",
    "Empty states and explicit confirmation before replacing a workspace",
  ],
  contribution:
    "I set the goals and chose a freelancer workspace to demonstrate useful application workflows. The first version was implemented with AI coding assistance, including calculation, persistence, and browser checks. I’m learning to explain and maintain the work.",
  technology: ["React", "TypeScript", "CSS", "Browser localStorage"],
  decisions:
    "The starting projects and clients are fictional. Changes are saved in this browser only: no account, server storage, multi-device sync, invoices or payments. Browser storage can be cleared; download a backup to keep a copy. Invalid backups preserve the current workspace. Project stages and task completion are independent.",
  demoUrl: "hub/",
};

export const experienceTools = [
  "Airtable",
  "Fillout",
  "Zite",
  "Google Workspace",
  "Spreadsheets",
  "Mailchimp",
  "WordPress / Elementor",
];
