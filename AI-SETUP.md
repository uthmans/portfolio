# Free AI analysis with Cloudflare Workers AI

The public survey now uses **Cloudflare Workers AI**, not OpenAI. You do not need to buy API credits, add an API key, run Ollama, or keep a computer online.

## What you need to do

1. **Keep your Cloudflare account on Workers Free.** Cloudflare's published free allowance is **10,000 neurons per day**, shared with any other Workers AI apps on your account and reset at midnight UTC. Neurons measure AI compute; they are not a fixed number of requests. On Free, further requests fail when the allowance is exhausted. Workers Paid can charge for usage above the free allowance, so do not upgrade or enable paid AI Gateway credits for this demo.
2. Wait for the latest Cloudflare deployment of `uthmans/portfolio` to finish. The root directory stays `/`, the build command stays empty and the deploy command stays `npx wrangler deploy`. The repository's Wrangler configuration automatically adds a **Workers AI** binding named **`AI`**, alongside **`FEEDBACK_QUOTA`**. No new secret is needed. If Cloudflare asks you to activate Workers AI or accept model/service terms, complete that free activation; do not accept a paid upgrade.
3. Open <https://portfolio.uthmansalama.workers.dev/api/health>. Expect `version: "workers-ai-1"`, `provider: "Cloudflare Workers AI"`, `ready: true`, and both `aiBindingConfigured` and `quotaBindingConfigured` true. This confirms the bindings are present, not that inference or model quality has been verified. If you still see `apiKeyConfigured` or `health-check-2`, older code is serving traffic.
4. Once GitHub Pages also finishes its build, open <https://uthmans.github.io/portfolio/survey/#written-feedback>. Use the fictional sample first. Check consent, click **Analyse feedback**, and inspect the expandable findings. A real result is labeled **AI-generated analysis**. The hand-written example is never presented as a model result.
5. Your old `SURVEY_AI_KEY` secret is unused by this Worker. You may remove it from Cloudflare and revoke the unused key in OpenAI after the switch. It is never read or sent by the new public backend.

If the deployment says a binding is missing, check **portfolio → Bindings** for `AI` (Workers AI) and `FEEDBACK_QUOTA` (Durable Object). The Git configuration supplies them automatically; ensure the newest deployment is active before manually changing bindings. You do not need an API token for the dashboard workflow.

## What stays free and what has limits

The fixed model is `@cf/meta/llama-3.1-8b-instruct-fp8-fast`, listed in Cloudflare's free-allocation model pricing. The Worker does not accept a client-specified model, does not use AI Gateway credits, and has no paid-provider fallback. This does not change the account's billing plan: **Free-plan limits are the no-charge safeguard**. We cannot inspect or change your account plan from the repository. Cloudflare can change pricing and availability; check the official pages below before future upgrades.

The demo also has its own persistent limits: **3 requests per IP address per UTC hour**, **20 total per UTC day**, 1–100 nonblank comments per request, 1,000 characters per comment, and a 2,500-output-token cap. Failed attempts count too; there are no automatic retries. The provider switch uses a separate quota object (`workers-ai-demo`) so old failed OpenAI attempts do not block initial Workers AI testing. These limits are not a promise that every request will fit the account's remaining compute allowance. Shared networks share an hourly limit. CORS restricts browser origins but is not authentication; the fixed global cap also bounds non-browser abuse. If used beyond a small portfolio demo, add bot protection or authentication before increasing limits.

## Understanding an error

Look at the message under the analysis section, or at the failed `/api/feedback` request's **Response** in browser developer tools. Share only the response, never credentials.

- `ai_binding_missing`: the running deployment cannot access its `AI` or quota binding. Check the latest deployment and health flags.
- `workers_ai_limit`: the free compute allowance or provider request limit was reached. Wait for the applicable reset; do not upgrade to fix it.
- `workers_ai_unavailable`: inference failed; check free Workers AI activation, service status, and model availability. No raw provider details are returned to the browser.
- `provider_timeout`: the response took too long. The waiting request times out at 35 seconds; it cannot cancel inference already started and does not retry it.
- `invalid_analysis`: the model's JSON or source references failed validation. The previous report and source comments are kept.
- HTTP 429 with the demo-limit message: our own allowance was reached. Wait rather than clicking repeatedly.

The old `provider_authentication` error referred to OpenAI. It should no longer occur once the new Worker and website have both deployed.

## Privacy and review

Ratings and written feedback share one CSV: five required rating columns and an optional `feedback` column. Both sections use the same filters. Importing stays in the browser tab; only selected nonblank comments and anonymous IDs are sent to Cloudflare after explicit consent. Changing data or filters clears stale results and consent. Comments are not stored by our application. Quota storage contains counters and hashed client IPs. Request logging is disabled in the repository's Worker configuration. Cloudflare's service/data-processing terms still apply; anonymise feedback and use text you have permission to process. Report downloads include supporting source text.

We request schema-constrained JSON, validate response structure and reject invented source IDs. Valid IDs do not prove a finding is accurate: a human must compare interpretations against the cited comments. Embedded instructions in comments are treated as untrusted data, but prompt-injection resistance and model quality are not guaranteed.

## Developer checks

Use Node.js 24. `npm test` covers CSVs, calculations, source validation, quota controls and mocked AI errors. `npm run worker:check` bundles the Worker; `npm run worker:test` uses a mock AI service and native Durable Object storage in Cloudflare's local simulator. Neither performs external AI inference. `npm run build` checks TypeScript and all production routes. Browser suites include `test:feedback` and the configured-endpoint test in `scripts/check-feedback-api.mjs`.

On restricted workspaces, set `XDG_CONFIG_HOME=/tmp/portfolio-cf-config` and `WRANGLER_SEND_METRICS=false` when running Wrangler. `npm run worker:dev` with an actual AI binding may require Cloudflare authentication and can consume the account's AI allowance; do not use it as a supposedly offline model. For free/offline verification, use the mocked runtime test. The retained `server/feedback.mjs` is a legacy optional Node/OpenAI development server; it is not deployed, is not used as a fallback, and is not needed for this setup.

## Official references (checked October 19, 2026)

- [Workers AI pricing and free allowance](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Workers AI binding configuration](https://developers.cloudflare.com/workers-ai/configuration/bindings/)
- [JSON mode](https://developers.cloudflare.com/workers-ai/features/json-mode/)
- [Selected Llama model](https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8-fast/)

## How this was built

Uthman chose evidence-linked feedback analysis and requested an option with no payment requirement. AI coding assistance implemented the interface and migrated the provider to a Workers AI binding. Key decisions were to retain deterministic ratings, use one uploaded dataset, distinguish examples from real outputs, reject unsupported source IDs, and stop on errors rather than silently switch providers. Tests include forged references, provider limits, consent and a quota-protected inference round trip. Actual model access and interpretation quality need a real post-deployment test; passing mocks alone does not establish them.
