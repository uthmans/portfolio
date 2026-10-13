# Uthman Salama’s portfolio

A personal portfolio for practical websites, databases, and workflows. The portfolio itself is the first implemented project; all other previews are original, static concepts labeled as planned. No private organizational materials or datasets are used.

## Run locally

Use Node.js 22.12+ or 24 LTS and npm. This environment was verified with Node.js 24.

```sh
npm ci
npm run dev
```

Vite prints the local development address (normally port 5173). The development server listens on all interfaces for cloud development. It is not a production server.

```sh
npm run build     # strict TypeScript checks, then production build
npm run preview   # serve the production build for local inspection
```

`dist/` is the generated static site. Vite uses `/portfolio/` as the base path for GitHub project Pages. Open the development or preview server at that path.

### GitHub Pages deployment

In the repository’s **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**, rather than deploying `main` directly. The source `index.html` references TypeScript that browsers cannot run without a build.

The **Deploy portfolio to GitHub Pages** workflow builds the site and deploys only `dist/`. It runs on pushes to `main`; you can also run it manually from the **Actions** tab. After enabling the Actions source, wait for a successful workflow, or select **Run workflow** to retry it.

Keep `deploy-pages.yml` as the sole Pages deployment workflow, so every deployment publishes the compiled Vite output. A generic Jekyll workflow can overwrite it with unbuilt source files and produce a blank page.

The website address is https://uthmans.github.io/portfolio/. Changing hosting or the repository name requires updating `base` in `vite.config.ts`.

Fonts are bundled locally, and the site does not require API credentials or external services.

### Browser verification

With the development server running, use a Playwright browser:

```sh
npx playwright install chromium
npm run test:browser
```

In this cloud environment, Chromium is already installed:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
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

Project records in `src/content.ts` contain the problem, audience, features, contribution, technology, decisions, and optional real demo/source URLs. Update a status only when supported by working evidence. The roadmap gallery currently displays its first three entries, with the fourth shown as a later idea. To feature an additional completed project, extend the selected-work section rather than presenting it as a planned concept. The static preview components are visual illustrations, not applications.

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
- No standalone demo apps, AI API, login, database, analytics, or working enquiry form.
- English only. Content is centralized for future translations; Spanish and Arabic navigation should be added only with real translations, and Arabic will need RTL verification.
- The first implementation was created with AI coding assistance from Uthman’s requirements. His review, testing, and learning are ongoing; no technical seniority or completed client work is implied.

See `ROADMAP.md` for the next small milestone.

## Saving code and publishing

Publishing the cloud environment snapshots the development workspace and tools. It does not commit or push code to GitHub, and it does not deploy a public website. Git commits record code changes; pushing sends those commits to the repository. Hosting the built site is a separate step requiring authorization.
