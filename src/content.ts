// English content lives here so future translations can use the same structure.
// Add only confirmed contact details. Empty fields never produce placeholder links.
export const profile = {
  name: "Uthman Salama",
  headline: ["Websites.", "Automations.", "Made useful."],
  introduction:
    "I build websites, data tools, and AI-assisted workflows that make everyday work easier. Explore working demos, see the decisions behind them, and imagine what we could build for your business.",
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
  status: "First version" | "Version 2";
  description: string;
  problem: string;
  audience: string;
  features: string[];
  contribution: string;
  technology: string[];
  decisions: string;
  result: string;
  walkthrough: string[];
  verification: string[];
  demoUrl?: string;
  sourceUrl?: string;
};

export const portfolioProject: Project = {
  id: "portfolio",
  number: "04",
  title: "A portfolio with a purpose",
  category: "Website · Design · Development",
  status: "First version",
  description:
    "A responsive home for working demos, project case studies, my experience, and a downloadable CV.",
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
    "I defined the audience, content, and visual direction, then refined the site through feedback and hands-on testing. AI coding assistance supported implementation and checks. I’m continuing to learn how to explain and maintain the code.",
  technology: ["React", "TypeScript", "Vite", "CSS"],
  decisions:
    "Keep the portfolio fast and straightforward: no login, database, paid services, or unnecessary tracking. Feature working independent projects and show contact links only when confirmed.",
  result:
    "Visitors can explore working demos, understand how they were built, download my CV, and contact me directly. This is my own portfolio, not a commissioned client website.",
  walkthrough: [
    "Open a project case study and try its demo.",
    "Explore my background and download the CV.",
    "Use the contact link to start a conversation.",
  ],
  verification: [
    "Browser checks cover project dialogs, keyboard focus, mobile navigation, and working demo links.",
    "Layout checks cover five viewport widths, reduced motion, and automated accessibility scans.",
  ],
};

export const surveyProject: Project = {
  id: "survey",
  number: "01",
  title: "Survey Insights Studio",
  category: "Data exploration",
  status: "Version 2",
  description:
    "Turn survey responses into clear charts and AI feedback themes, with original comments beside each finding and downloadable reports.",
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
    "Downloadable feedback reports and live AI analysis through Cloudflare Workers AI",
  ],
  contribution:
    "I defined the feedback workflow and refined it through testing: one dataset for charts and written comments, fewer controls, and expandable findings beside their source responses. AI coding assistance supported implementation and checks. I’m learning to explain and maintain the work.",
  technology: ["React", "TypeScript", "Cloudflare Workers AI", "CSV"],
  decisions:
    "A single CSV uses five required rating columns plus an optional feedback column. Charts and written feedback share the same dataset and filters. Data stays in the tab and resets on reload; download to keep it. Invalid files preserve the current dataset. Missing ratings are excluded from averages and percentages. The hand-written feedback example is fictional, not AI-generated. An AI request sends selected anonymised comments to Cloudflare Workers AI after consent, using its free daily allowance. Requests support at most 100 comments, with public-demo usage limits and no paid-provider fallback. Source-ID validation does not guarantee accurate interpretations. The application does not persist feedback on its server; provider processing terms apply. There is no login.",
  demoUrl: "survey/",
  result:
    "A single dataset powers both the rating charts and written-feedback analysis. Visitors can check the original responses behind a finding and export the results for further review.",
  walkthrough: [
    "Use the fictional sample or generate a dataset with written comments.",
    "Change a filter and see the counts and charts update together.",
    "Review the consent notice, analyse the written feedback, then expand a theme to inspect its source comments.",
    "Download the filtered CSV or feedback report.",
  ],
  verification: [
    "Calculation checks cover missing ratings, response counts, distributions, and averages.",
    "Import and browser checks cover invalid CSV files, shared filters, generated comments, and report downloads.",
    "AI output is checked for structure and valid response IDs. Interpretations still need human review.",
  ],
};

export const businessProject: Project = {
  id: "business",
  number: "02",
  title: "A small business, online",
  category: "Interactive website",
  status: "Version 2",
  description:
    "Form & Field: a fictional interiors studio with an AI service guide, clear service pages, fixed-rule estimates, and a validated enquiry preview.",
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
    "AI service suggestions with explanations, scope limits and follow-up questions",
    "Explicit handoff to the calculator with listed pricing and preserved room/add-on choices",
  ],
  contribution:
    "I chose the service journey, refined the brand and navigation, and tested the estimate and enquiry flow. I then added an optional AI guide with an explicit handoff to the calculator. AI coding assistance supported the design, implementation, illustrations, and checks. I’m learning to explain and maintain the work.",
  technology: [
    "React",
    "TypeScript",
    "Cloudflare Workers AI",
    "Original SVG illustrations",
  ],
  decisions:
    "Form & Field is fictional. Prices are illustrative USD amounts; this is not a real business offer. Only a description you approve is sent to Cloudflare Workers AI, sharing the portfolio’s free-demo limits. AI suggests a listed service or asks for clarification; it does not set prices or provide construction or safety assessments. You choose whether to apply a suggestion. The form creates a local preview only: no enquiry, booking, or payment is sent. No client testimonials, completed client projects, or real business contact details are invented. Enquiry data resets on reload; download to keep the preview.",
  demoUrl: "business/",
  result:
    "Visitors can understand the services, get a guided recommendation, and build an estimate before previewing an enquiry. The fictional studio demonstrates a service website journey without presenting a demo as a real booking system.",
  walkthrough: [
    "Explore a service page and its scope.",
    "Use the fictional home-office brief in the AI service guide.",
    "Apply the recommendation to the calculator, then change the room count or add-ons.",
    "Fill with sample details, preview the enquiry, and download its summary. Nothing is sent.",
  ],
  verification: [
    "Pricing checks verify room rates and one-time add-ons independently of AI output.",
    "Browser checks cover service links, calculator scrolling, form validation, mobile layouts, and accessibility.",
    "The guide handoff preserves rooms and add-ons, clears stale enquiry previews, and rejects unknown services. Unclear or out-of-scope requests can return no recommendation.",
  ],
};

export const hubProject: Project = {
  id: "hub",
  number: "03",
  title: "Freelancer Project Hub",
  category: "Internal application",
  status: "Version 2",
  description:
    "Turn a client brief into an editable AI project plan, then track projects, tasks and budgets in a browser-local workspace with downloadable backups.",
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
    "AI brief-to-plan drafts with editable tasks, clarification questions and potential risks",
    "Explicit review before adding a draft; budgets and deadlines are set manually",
  ],
  contribution:
    "I set the goals and chose a freelancer workspace to demonstrate useful application workflows. The implementation and AI planning integration were built with AI coding assistance, including calculation, persistence, validation, and browser checks. I chose an editable review step before adding suggestions, with budgets and dates kept under the visitor’s control. I’m learning to explain and maintain the work.",
  technology: [
    "React",
    "TypeScript",
    "Cloudflare Workers AI",
    "Browser localStorage",
  ],
  decisions:
    "Starting projects and clients are fictional. The optional planner sends only the brief you approve to Cloudflare Workers AI, sharing the free-demo allowance with Survey Insights. AI suggestions require review and are not agreed scope or pricing. Nothing is added until you confirm; new projects start as Planned, with unchecked tasks and no spend. Leave dates blank if undecided; an unset budget is tracked as $0 until edited. Projects stay in this browser, with no accounts or multi-device sync. Download backups to keep a copy. Invalid backups preserve the workspace. Project stages and task completion are independent.",
  demoUrl: "hub/",
  result:
    "A brief can become an editable starting plan, then a project with tasks and a budget in one workspace. Review stays with the visitor. This is a browser-local demo, not a shared team platform.",
  walkthrough: [
    "Explore the fictional sample projects and try the stage or overdue filters.",
    "Use the fictional bakery brief in the AI planner.",
    "Review and edit the proposed tasks, questions, and risks before adding the project.",
    "Set a budget or date yourself, complete a task, and download a workspace backup.",
  ],
  verification: [
    "Calculation and persistence checks cover budgets, spend, task progress, and browser-local saving.",
    "Backup validation protects the current workspace when an imported file is invalid.",
    "Planner checks cover invalid AI responses, editable draft limits, explicit review, and adding a project only after confirmation.",
  ],
};

export const services = [
  {
    id: "websites",
    title: "Business websites",
    description:
      "Give people a clear picture of your business and an easy way to take the next step.",
    deliverables: [
      "Responsive service pages and landing pages",
      "Contact forms, enquiry journeys, and estimate tools",
      "Clear navigation and accessible interactions",
    ],
    example: "Explore Form & Field",
    demoUrl: "business/",
    subject: "Let’s discuss a business website",
    contactLabel: "Discuss your website",
    prompt:
      "Tell me about your business, the pages you need, and what you want visitors to do.",
  },
  {
    id: "data-tools",
    title: "Dashboards & data tools",
    description:
      "Make spreadsheets and feedback easier to explore, understand, and use.",
    deliverables: [
      "CSV imports with useful validation",
      "Interactive charts, filters, and clear calculations",
      "Downloadable data and reports",
    ],
    example: "Explore Survey Insights Studio",
    demoUrl: "survey/",
    subject: "Let’s discuss a dashboard or data tool",
    contactLabel: "Discuss your data tool",
    prompt:
      "Tell me what data you work with, what is difficult today, and what you want to understand or track. Please leave private data out of your first message.",
  },
  {
    id: "ai-workflows",
    title: "AI-assisted workflows",
    description:
      "Turn repetitive steps or unstructured information into a practical workflow you can review and control.",
    deliverables: [
      "AI summaries and editable planning drafts",
      "Forms, databases, and workflow connections",
      "Review steps, validation, and clear usage limits",
    ],
    example: "Explore Freelancer Project Hub",
    demoUrl: "hub/",
    subject: "Let’s discuss an AI-assisted workflow",
    contactLabel: "Discuss your AI workflow",
    prompt:
      "Tell me which task you repeat, the tools you currently use, and where you would like help. Please leave private data out of your first message.",
  },
];

export const experienceTools = [
  "Airtable",
  "Fillout",
  "Zite",
  "Google Workspace",
  "Spreadsheets",
  "Mailchimp",
  "WordPress / Elementor",
];
