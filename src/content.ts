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
  cvUrl: "",
};

export type Project = {
  id: string;
  number: string;
  title: string;
  category: string;
  status: "First version" | "Planned";
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
    "Responsive project gallery and roadmap",
    "Keyboard-accessible project details",
    "Editable content and contact configuration",
    "Reduced-motion support",
  ],
  contribution:
    "I defined the goals and content requirements. This first implementation was built with AI coding assistance. My next steps are reviewing the design, testing it, and learning to maintain and improve it.",
  technology: ["React", "TypeScript", "Vite", "CSS"],
  decisions:
    "Keep the portfolio fast and straightforward: no login, database, paid services, or unnecessary tracking. Separate working projects from future concepts and show contact links only when confirmed.",
};

export const surveyProject: Project = {
  id: "survey",
  number: "02",
  title: "Survey Insights Studio",
  category: "Data exploration",
  status: "First version",
  description:
    "A working survey explorer with fictional responses, filters, rating charts, and calculations you can check.",
  problem:
    "Make a small survey easier to explore without hiding response counts or the effect of missing values.",
  audience:
    "People exploring feedback and learning to interpret survey results.",
  features: [
    "12 original fictional sample responses",
    "Two rating questions with track and format filters",
    "Response counts, distributions, and means",
    "Explicit missing-value rules and an unanswered state",
    "Filtered CSV download and a source-row table",
  ],
  contribution:
    "I set the project goals and scope. This first version was implemented with AI coding assistance, including calculation and browser checks. I’m reviewing the result and learning to explain and maintain it.",
  technology: ["React", "TypeScript", "CSS"],
  decisions:
    "The first version uses a built-in fictional sample only. CSV import is not implemented yet. There is no AI integration, login, server storage, or real participant data. Missing answers are excluded from averages and percentages, and shown separately.",
  demoUrl: "survey/",
};

export const roadmap: Project[] = [
  {
    id: "business",
    number: "03",
    title: "A small business, online",
    category: "Interactive website",
    status: "Planned",
    description:
      "An original service-business website that helps visitors explore services and estimate a project.",
    problem:
      "A service website should help visitors make a decision, with clear information and an understandable estimate.",
    audience: "Customers of a fictional service business.",
    features: [
      "Original fictional brand and responsive pages",
      "Quote calculator with explicit rules",
      "Validated demo enquiry flow",
      "Potential multilingual support",
    ],
    contribution:
      "Planned independent demonstration project. The brand, interface, and rules will be created from scratch with AI-assisted implementation.",
    technology: ["Stack to be confirmed"],
    decisions:
      "The concept preview is not a completed website. Enquiries will be labeled as a demo unless a real delivery service is connected.",
  },
  {
    id: "hub",
    number: "04",
    title: "Freelancer Project Hub",
    category: "Internal application",
    status: "Planned",
    description:
      "A calmer place to organize clients, tasks, project stages, and budgets.",
    problem:
      "Scattered project information makes it difficult to see what needs attention. A simple hub could bring it together.",
    audience: "Independent freelancers managing a small set of projects.",
    features: [
      "Fictional clients and projects",
      "Editing and filtering",
      "Clear project overview",
      "Browser-local saved state to begin",
    ],
    contribution:
      "Possible later independent demo. Scope and implementation will follow the survey and business website projects.",
    technology: ["Stack to be confirmed"],
    decisions:
      "Start simple. Authentication and shared server storage will only be added if needed. The preview is a static concept, with no task management or saving behind it.",
  },
  {
    id: "documents",
    number: "05",
    title: "Document Q&A assistant",
    category: "AI integration",
    status: "Planned",
    description:
      "A possible later experiment in answers grounded in a public or fictional handbook.",
    problem:
      "Help readers locate information while showing the passages that support an answer.",
    audience: "Readers of a public or original fictional handbook.",
    features: [
      "Supporting source passages",
      "Clear handling of unanswered questions",
      "Quality evaluation before release",
    ],
    contribution:
      "Possible later project, contingent on a real integration and a plan for testing response quality.",
    technology: ["Not selected"],
    decisions:
      "No chatbot or AI connection exists yet. A real API would require server-side secrets, usage limits, and clear data handling.",
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
