# Uthman Salama’s portfolio

A personal portfolio for practical websites, databases, and workflows. The portfolio and Survey Insights Studio are implemented first versions; the remaining previews are original, static concepts labeled as planned. No private organizational materials or datasets are used.

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

Each build verifies both HTML pages and their asset files, then writes `dist/deployment.json` with its Git commit and build timestamp. The published `/portfolio/deployment.json` can be compared with the successful workflow’s commit when diagnosing an outdated deployment.

The website address is https://uthmans.github.io/portfolio/. Changing hosting or the repository name requires updating `base` in `vite.config.ts`.

Fonts are bundled locally, and the site does not require API credentials or external services.

### Browser verification

With the development server running, use a Playwright browser:

```sh
npx playwright install chromium
npm run test:browser
npm run test:survey
```

In this cloud environment, Chromium is already installed:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
CHROMIUM_PATH=/usr/bin/chromium npm run test:survey
```

Set `PORTFOLIO_URL` if testing another local port or the production preview. The script checks dialogs, focus, filtering, mobile navigation, five viewport widths, reduced motion, browser errors, and axe accessibility results. Screenshots are written to ignored `test-results/`. Automated checks do not replace manual accessibility review.

The Rollup override pins its official npm tarball because the registry’s full Rollup metadata response stalled in this environment. The lockfile’s artifact integrity was checked against the official registry metadata; TLS and integrity verification remain enabled.

## Edit content

- `src/content.ts`: name, headline, introduction, availability, tool experience, project details, and contact links.
- `src/App.tsx`: section structure and original interface concept previews.
- `src/styles.css`: colors, typography, layout, and responsive styling.
- `index.html`: page title, description, and document language.

The confirmed public email is `uthmansalama@gmail.com`; other contact fields remain empty. Set `profile.email`, `linkedInUrl`, `githubUrl`, or `cvUrl` only to confirmed public details. Empty fields never become fake links. For a CV, place a public PDF in `public/` and set `cvUrl` to a relative path such as `uthman-salama-cv.pdf`, so the link works below `/portfolio/`. A direct email link opens the visitor’s email application; no form or delivery service is connected.

## Add projects

Project records in `src/content.ts` contain the problem, audience, features, contribution, technology, decisions, and optional real demo/source URLs. Update a status only when supported by working evidence. The roadmap gallery displays its first two entries, with the third shown as a later idea. To feature an additional completed project, extend the selected-work section rather than presenting it as a planned concept. The static preview components are visual illustrations, not applications.

## Main interactions to check

1. Section navigation and “Explore my work” scroll to the correct section.
2. Project previews and titles open accessible native dialog details.
3. Escape and the close button dismiss details; focus returns to the opener.
4. Tab stays inside an open dialog.
5. Roadmap category buttons filter planned projects and announce the resulting count.
6. On mobile, Menu opens navigation, and selecting a section closes it.
7. No horizontal overflow at small widths. Reduced-motion preferences disable smooth scrolling and transitions.

## Current limitations

- The CV download is held until an updated document is provided; the attached photo still needs a downloadable file.
- Survey CSV import requires the documented five-column schema (up to 5,000 rows and 2 MB). Ratings are limited to two 1–5 questions. No AI API, login, server database, analytics, or working enquiry form.
- English only. Content is centralized for future translations; Spanish and Arabic navigation should be added only with real translations, and Arabic will need RTL verification.
- The first implementation was created with AI coding assistance from Uthman’s requirements. His review, testing, and learning are ongoing; no technical seniority or completed client work is implied.

See `ROADMAP.md` for the next small milestone.

## Saving code and publishing

Publishing the cloud environment snapshots the development workspace and tools. It does not commit or push code to GitHub, and it does not deploy a public website. Git commits record code changes; pushing sends those commits to the repository. Hosting the built site is a separate step requiring authorization.

## Survey Insights Studio

Open `/portfolio/survey/`. This is a separate built page with direct-refresh support on GitHub Pages. It offers two rating questions, combined learning-track and session-format filters, response counts, a rating distribution, a mean, an explicit missing-answer state, a source-row table, and a filtered CSV download. It starts with 12 original fictional responses. Visitors can import a validated CSV or generate 10–1,000 random fictional responses, then filter, calculate, and download them. No data is uploaded and there is no API connection.

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

Use a UTF-8 comma-separated CSV of up to 2 MB and 5,000 response rows. It must have exactly `id,track,format,satisfaction,confidence` as headers, in any order. Header names and category values are case-sensitive. CRLF/LF, BOM, quoted fields, escaped quotes, and empty physical lines are supported.

- `id`: unique, 1–64 ASCII letters, numbers, hyphens, or underscores; start with a letter or number.
- `track`: `Websites`, `Automations`, or `Data`.
- `format`: `Online` or `In person`.
- Ratings: one of `1`, `2`, `3`, `4`, `5`, or blank. Text, zero, decimal notation, and out-of-range values are rejected.

The page includes a format guide and a downloadable example. Every response must validate before any data is replaced. Failures preserve the current dataset and filters and show line/field errors, capped at 20. Successful loads reset filters and the question. Generated data is clearly fictional; imported data is labeled separately.

All data resets to the sample on reload. Nothing is persisted or sent to a server. Download a CSV to retain imported or generated data. The table previews the first 100 filtered rows; calculations and downloads use all filtered rows. This keeps larger datasets usable on mobile.
