# Uthman Salama’s portfolio

A personal portfolio for practical websites, databases, and workflows. All four core projects are implemented. Survey Insights Studio includes a written-feedback workspace with a hand-written example and a prepared AI backend integration. No private organizational materials or datasets are used.

## Run locally

Use Node.js 24 LTS and npm (the calculation tests use its built-in TypeScript support). This environment was verified with Node.js 24.

```sh
npm ci
npm run dev
```

Vite prints the local development address (normally port 5173). The development server listens on all interfaces for cloud development. It is not a production server.

```sh
npm test          # survey calculations, CSV validation, and generation checks
npm run build     # strict TypeScript checks, then production build
npm run preview   # serve the production build for local inspection
```

`dist/` is the generated static site. Vite uses `/portfolio/` as the base path for GitHub project Pages. Open the development or preview server at that path.

### GitHub Pages deployment

In the repository’s **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**, rather than deploying `main` directly. The source `index.html` references TypeScript that browsers cannot run without a build.

The **Deploy portfolio to GitHub Pages** workflow builds the site and deploys only `dist/`. It runs on pushes to `main`; you can also run it manually from the **Actions** tab. After enabling the Actions source, wait for a successful workflow, or select **Run workflow** to retry it.

Keep `deploy-pages.yml` as the sole Pages deployment workflow, so every deployment publishes the compiled Vite output. A generic Jekyll workflow can overwrite it with unbuilt source files and produce a blank page.

Each build verifies all seven HTML pages and their asset files, then writes `dist/deployment.json` with its Git commit and build timestamp. The published `/portfolio/deployment.json` can be compared with the successful workflow’s commit when diagnosing an outdated deployment.

The website address is https://uthmans.github.io/portfolio/. Changing hosting or the repository name requires updating `base` in `vite.config.ts`.

Fonts are bundled locally, and the site does not require API credentials or external services.

### Browser verification

With the development server running, use a Playwright browser:

```sh
npx playwright install chromium
npm run test:browser
npm run test:survey
npm run test:business
```

In this cloud environment, Chromium is already installed:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
CHROMIUM_PATH=/usr/bin/chromium npm run test:survey
CHROMIUM_PATH=/usr/bin/chromium npm run test:business
```

Set `PORTFOLIO_URL` if testing another local port or the production preview. The script checks dialogs, focus, filtering, mobile navigation, five viewport widths, reduced motion, browser errors, and axe accessibility results. Screenshots are written to ignored `test-results/`. Automated checks do not replace manual accessibility review.

The Rollup override pins its official npm tarball because the registry’s full Rollup metadata response stalled in this environment. The lockfile’s artifact integrity was checked against the official registry metadata; TLS and integrity verification remain enabled.

## Edit content

- `src/content.ts`: name, headline, introduction, availability, tool experience, project details, and contact links.
- `src/App.tsx`: section structure and original interface concept previews.
- `src/styles.css`: colors, typography, layout, and responsive styling.
- `src/components/PortfolioBanner.tsx` and `portfolio-banner.css`: the shared thin green banner used on the portfolio, demos, and service pages. New project pages should reuse it, with a back-to-portfolio link on the left and the page title/context on the right.
- `index.html`: page title, description, and document language.

The confirmed public email is `uthmansalama@gmail.com`; other contact fields remain empty. Set `profile.email`, `linkedInUrl`, `githubUrl`, or `cvUrl` only to confirmed public details. Empty fields never become fake links. For a CV, place a public PDF in `public/` and set `cvUrl` to a relative path such as `uthman-salama-cv.pdf`, so the link works below `/portfolio/`. A direct email link opens the visitor’s email application; no form or delivery service is connected.

## Add projects

Project records in `src/content.ts` contain the problem, audience, features, contribution, technology, decisions, and optional real demo/source URLs. Update a status only when supported by working evidence. Selected work features all four working projects: the portfolio, Survey Insights Studio, Form & Field, and Freelancer Project Hub. The home page contains no planned-project gallery or promised AI integration. Preview panels illustrate the real demonstrations; open a live demo to interact with it.

## Main interactions to check

1. Section navigation and “Explore my work” scroll to the correct section.
2. Project previews and titles open accessible native dialog details.
3. Escape and the close button dismiss details; focus returns to the opener.
4. Tab stays inside an open dialog.
5. All three standalone demos — survey, business and freelancer hub — are linked from selected work.
6. On mobile, Menu opens navigation, and selecting a section closes it.
7. No horizontal overflow at small widths. Reduced-motion preferences disable smooth scrolling and transitions.

## Current limitations

- The approved updated CV is downloadable from the contact section; the attached photo still needs a downloadable file.
- Survey uses one CSV with five required rating columns and an optional feedback column (up to 5,000 rows and 2 MB). Live AI requires backend configuration and at most 100 selected comments; the public example is hand-written. No login, server database or analytics. Business enquiries are local previews with no external delivery.
- English only. Content is centralized for future translations; Spanish and Arabic navigation should be added only with real translations, and Arabic will need RTL verification.
- The first implementation was created with AI coding assistance from Uthman’s requirements. His review, testing, and learning are ongoing; no technical seniority or completed client work is implied.

See `ROADMAP.md` for completed milestones and internal future ideas.

## Saving code and publishing

Publishing the cloud environment snapshots the development workspace and tools. It does not commit or push code to GitHub, and it does not deploy a public website. Git commits record code changes; pushing sends those commits to the repository. Hosting the built site is a separate step requiring authorization.

## Survey Insights Studio

### Written feedback and AI-ready version 2

The written-feedback section uses the same uploaded CSV and filters as the rating charts. Add an optional `feedback` column, up to 1,000 characters per comment; blanks are allowed. Expand a theme to see its interpretation, suggested action and supporting responses together. Sample findings appear automatically for the selected fictional comments and are never applied to imported data. A single report-download button replaces the former multi-step controls. Invalid imports preserve the workspace; successful imports or filter changes clear stale AI analysis and consent. Live requests allow 1–100 nonblank comments; larger selections must be filtered explicitly, never silently truncated. Older five-column files continue to work.

See [AI-SETUP.md](AI-SETUP.md) for Cloudflare deployment, the free daily allowance, privacy considerations, and the implementation case study. The public build uses `https://portfolio.uthmansalama.workers.dev/api/feedback`. The Worker calls Cloudflare Workers AI using an `AI` binding and a fixed Llama model covered by the free allowance. No OpenAI key or paid-provider fallback is used. Stay on Workers Free to have requests stop when the daily allowance is exhausted; Workers Paid may bill overages. Wrangler deploys only the backend, not a second portfolio. Run `npm run test:feedback` against a production preview; `npm test` runs mocked integration tests. `npm run worker:check` bundles the Worker and `npm run worker:test` verifies a mocked AI-binding round trip and real Durable Object quotas locally, with no external inference. Live access and model quality require a separate actual request after deployment.

Open `/portfolio/survey/`. This is a separate built page with direct-refresh support on GitHub Pages. It offers two rating questions, combined learning-track and session-format filters, response counts, a rating distribution, a mean, an explicit missing-answer state, a source-row table, and a filtered CSV download. It starts with 12 original fictional responses. Visitors can import a validated CSV or generate 10–1,000 random fictional responses, then filter, calculate, and download them. Rating data is processed locally. The separate feedback workspace sends text only when a backend is configured and the visitor consents and requests AI analysis.

- `src/survey/data.ts`: original sample, question definitions, filtering, calculations, and CSV export.
- `src/survey/csv.ts`: CSV parsing and whole-file validation with physical line numbers.
- `src/survey/generate.ts`: seeded random fictional-data generation.
- `src/survey/App.tsx`: the interactive application.
- `src/survey/Chart.tsx`: shared chart used by the demo and the accurate portfolio preview.
- `src/survey/styles.css`: application styling.
- `tests/survey-data.test.ts`: hand-checked counts, combined filters, missing/empty states, and export checks.
- `tests/survey-csv.test.ts`: CSV edge cases, boundaries, whole-file rejection, and generator round-trips.

Blank ratings are excluded from the mean and percentages, while total rows and missing counts remain visible. Percentages use the answered count for the selected question. CSV columns are `id,track,format,satisfaction,confidence`; ratings are 1–5 and blanks mean missing. The download contains the currently filtered rows and both question columns.

### Import format and behavior

Use a UTF-8 comma-separated CSV of up to 2 MB and 5,000 response rows. Required headers are `id,track,format,satisfaction,confidence`, with an optional `feedback` column, in any order. Header names and category values are case-sensitive. CRLF/LF, BOM, quoted fields, escaped quotes, and empty physical lines are supported. Comments may be blank or up to 1,000 characters; quotes and line breaks round-trip through export.

- `id`: unique, 1–64 ASCII letters, numbers, hyphens, or underscores; start with a letter or number.
- `track`: `Websites`, `Automations`, or `Data`.
- `format`: `Online` or `In person`.
- Ratings: one of `1`, `2`, `3`, `4`, `5`, or blank. Text, zero, decimal notation, and out-of-range values are rejected.

The page includes a format guide and a downloadable example. Every response must validate before any data is replaced. Failures preserve the current dataset and filters and show line/field errors, capped at 20. Successful loads reset filters and the question. Generated data is clearly fictional; imported data is labeled separately.

All data resets to the sample on reload. Nothing is persisted or sent to a server. Download a CSV to retain imported or generated data. The table previews the first 100 filtered rows; calculations and downloads use all filtered rows. This keeps larger datasets usable on mobile.

## Form & Field business demo

Open `/portfolio/business/`. This is an original fictional interior-planning studio, not a real company or a client website. It includes responsive navigation, original SVG concept illustrations, three real service-detail pages, an interactive estimate, and a validated enquiry preview. All service pages are built as static HTML entries, supporting direct links and refreshes on GitHub Pages.

Edit brand copy and layout in `src/business/App.tsx`, service packages and pricing in `src/business/model.ts`, original illustrations in `src/business/RoomScene.tsx`, and styling in `src/business/styles.css`. Service HTML entry files are under `business/services/`. Their paths must also be registered in `vite.config.ts` and `scripts/verify-build.mjs`.

The illustrative USD rules are: room planning $180 per room, styling $120 per room, workspace refresh $220 per room, and 1–5 rooms. Optional palette ($45), shopping shortlist ($75), and feedback session ($30) are each charged once per project. The total is exactly the service rate times rooms plus selected extras. No purchases, taxes, furniture, installation, or real bookings are part of this demo.

The enquiry requires a 2–80-character name, a valid email-shaped address, a 20–1,200-character brief, and acknowledgement of the demo. “Fill with sample details” supplies an explicitly fictional example. “Preview enquiry” validates and creates a local snapshot, labeled not sent. The visitor can download that snapshot as text. Editing any enquiry field or estimate clears the old preview. Reloading clears the form. No network delivery, server storage, payment, or appointment integration exists.

`tests/business.test.ts` checks pricing, invalid options, validation boundaries, and the honest download text. `npm run test:business` exercises all pages, quote interactions, errors/focus, sample details, preview/download, direct refresh, mobile navigation, reduced motion, and accessibility.


### Freelancer Project Hub

Open `/portfolio/hub/`. This independent application starts with three original fictional projects and clients. Create and edit projects, track USD budgets and spending, add/remove/check tasks, change stages, and filter by client/project text, stage, or overdue status. Summary figures apply to the visible projects; completed projects are excluded from overdue counts. Stages and task completion are independent.

Data is saved under `uthman-freelancer-hub-v1` in this browser’s localStorage when a change is made. There is no backend, account, synchronization, invoice, or payment flow. Browser storage may be cleared or unavailable; save errors are visible and the current tab remains usable. Corrupt saved data is not overwritten on load. Use **Download backup** to retain a versioned JSON copy; **Restore a backup** validates it before asking to replace the workspace. Delete, reset, and restore require explicit confirmation. Invalid imports leave existing projects unchanged.

Budgets and spending are integer cents, with a maximum USD 1,000,000 per amount and at most two entered decimal places. The demo supports 50 projects, 100 tasks per project, 80-character project/client names, 120-character tasks, and 1,000-character notes. Backup files are limited to 5 MB. Sample deadlines are generated relative to the visitor’s local date; completed tasks and project stages remain independently editable. Over-budget spending is allowed and clearly shown.

`npm test` includes Hub money, calendar, summary, filtering and backup-validation checks. `npm run test:hub` checks actual creation/editing/tasks/stages, filter totals, reload persistence, backup download/restore, invalid files, delete/reset confirmation, storage failures, modal keyboard focus, five viewport widths and axe accessibility. Set `CHROMIUM_PATH` and `PORTFOLIO_URL` as with the existing browser scripts.
