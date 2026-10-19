# Survey Insights Studio: feedback analysis

The public GitHub Pages site can run the hand-written fictional example without credentials. It never presents that example as an AI result and never uses it to analyse imported feedback. Ratings and written feedback use separate CSV formats. Importing either stays in the tab; feedback is sent only after the visitor consents and requests live analysis.

## Local AI setup (Node.js 24)

1. Obtain an OpenAI API project key with a small spending budget. Set `SURVEY_AI_KEY` securely in the backend process environment. Do not paste it in chat, commit it, or use a `VITE_` variable for it. The backend uses the OpenAI Chat Completions endpoint; `SURVEY_AI_MODEL` defaults to `gpt-4.1-mini` and can be set to a compatible model available to your account.
2. Run `node server/feedback.mjs` from this checkout. The server binds only to `127.0.0.1:8787` by default. `SURVEY_AI_PORT` overrides the port. No extra npm dependencies are required.
3. Start Vite with the non-secret variable `VITE_FEEDBACK_API_URL=http://127.0.0.1:8787/api/feedback` using `npm run dev -- --port 5173 --strictPort`. Access development using `127.0.0.1`, matching the default allowed origin. If using another origin, set `SURVEY_ALLOWED_ORIGIN` to that exact scheme/host/port in the backend. Vite needs restarting after changing its environment.
4. Import anonymised feedback or use the fictional sample, check the consent box and request AI analysis. Check source responses, contradictory opinions and unsupported claims before acting. Model output is validated structurally and against known IDs; semantic accuracy is not guaranteed.

## Public activation requires hosting

GitHub Pages cannot run this Node backend. Keep the frontend on Pages and host the backend separately. Choose hosting with a managed HTTPS gateway, real authentication or bot protection, persistent per-client rate limits and spending controls. The supplied server is a local integration reference, not an unrestricted public endpoint: CORS is not authentication, and its global 20-requests/hour limit is in memory, resets on restart and does not coordinate replicas. Put the loopback service behind the gateway, or adapt it to your chosen platform's serverless handler. Never put a shared gateway secret in public frontend code.

Set the backend's allowed origin to `https://uthmans.github.io` (origins do not include `/portfolio/`). Set the frontend build variable `VITE_FEEDBACK_API_URL` to the public HTTPS endpoint, then rebuild and redeploy. Without this variable the site clearly reports live AI as disconnected. No hosting, provider account, paid usage or public backend was created by this implementation.

Review your provider's data retention and processing terms before collecting third-party feedback. Remove identifying and sensitive text; the report download contains source feedback. The supplied service does not log or persist request text and sends it only to `api.openai.com`. Configure gateway/hosting logs accordingly. The backend applies size/count/text bounds, one concurrent request, timeouts, a model output-token limit, and source-ID validation. Feedback is passed as untrusted user data with instructions to resist embedded commands; this reduces but does not eliminate prompt-injection risk. The UI renders results as text, never model HTML.

## Verification and case study

Run `npm test`, `node --test server/feedback.test.mjs`, `npm run build`, and the browser checks. Backend tests use a mock provider, not paid AI requests. No live model quality claim is made until a real provider is configured and evaluated.

The build demonstrates an AI-assisted workflow: Uthman chose evidence-linked feedback analysis; AI coding assistance implemented the interface and integration. Key decisions were to preserve the existing deterministic ratings, separate uploaded feedback from a fixed demonstration, reject unknown source IDs, clear stale analysis when data changes, and make users approve sending text. A useful failure to test is an apparently well-formed result with an invented source ID: both backend and frontend reject it. Human review still needs to assess whether cited text supports each interpretation. Evaluate real outputs with mixed opinions, sparse feedback, irrelevant content and embedded instructions before publishing live AI functionality.
