# MasterMe — Frontend

MasterMe web interface built with Next.js, React and TypeScript. The production version is adapted with Vinext and runs on Cloudflare Workers.

Before changing the interface or its components, read [`skills/front-skill.md`](skills/front-skill.md) and [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md). Update the design system when a durable visual decision changes.

## Access

- Application: <https://masterme-frontend.joaovictorcortabitart.workers.dev>
- API repository: <https://github.com/J-V-S-C/MasterMe-API>

Calls to `/api/*` made to the frontend domain are forwarded to the OCI API. The destination URL is defined by the `BACKEND_URL` variable of the `production` environment in GitHub.

## Local development

```bash
bun install
bun run dev
```

Full validation:

```bash
bun run typecheck
bun test
bun run build
BACKEND_URL=https://masterme-api.duckdns.org bun run build:vinext
```

Install the versioned pre-commit hook once per clone with `git config --local core.hooksPath .githooks`. It runs `scripts/ci-local.sh` before every commit: validation, dependency audit, and the built Next.js smoke test. Stage all changes before committing; a failed gate aborts the commit.

## Visual validation with Playwright MCP

Playwright MCP is the project's manual inspection browser. It complements, but does not replace, automated tests: use it to observe the rendered interface, capture screenshots, interact with controls, and investigate console or network errors.

If MCP is not yet configured in Codex CLI, install it to the developer profile and confirm the connection:

```bash
codex mcp add playwright -- npx "@playwright/mcp@latest"
codex mcp list
```

With `bun run dev` running, validate the changed route at widths of 390 px, 768 px and 1440 px. In each viewport, check horizontal overflow, alignment, spacing, typography, focus and relevant states; test the controls and review console errors and failed requests. Repeat this inspection after correcting any findings.

For regressions that need to be run in CI, prefer a versioned Playwright Test suite instead of depending on MCP. MCP serves for exploration and diagnosis during development; the E2E tests document and protect critical flows in a repeatable manner.

## CI/CD and production

Every push to `main` triggers two independent workflows:

1. `CI` installs dependencies with lockfile, runs typecheck, tests, Next.js build and vinext build.
2. `Deploy frontend to Cloudflare` repeats typecheck, tests and build of vinext and publishes the Worker `masterme-frontend`.

Deploy uses GitHub's `production` environment and requires:

- `BACKEND_URL` variable with the HTTPS URL of the API without a trailing slash;
- secret `CLOUDFLARE_ACCOUNT_ID`;
- secret `CLOUDFLARE_API_TOKEN` with permission to edit Workers in the account.

The workflow only ends successfully after Cloudflare accepts and activates the new version. To prevent immediate publication on every push, configure reviewers or other protection rules in GitHub's `production` environment.

`production` environment also requires `PUBLIC_APP_URL`: frontend canonical HTTPS origin without a path or trailing slash. `APP_BUILD_ID` is filled by workflow with the published SHA; do not configure manually. `BACKEND_URL` should point to the public API before deploy. Manual execution of the workflow outside `main` is refused. After the first deploy, associate the desired domain with the Worker. Rollback is reverting or republishing the last green SHA.

CI installs with `bun install --frozen-lockfile`, executes `bun run validate`, production dependencies audit, Next/Vinext builds, and landing/login HTTP smoke with CSP and `nosniff`. Deploy repeats the gate before publishing. In an independent clone, code, tests, and workflows define behavior; this README describes operations. In the main workspace, `agents.md` contains the conventions. Code changes need an objective, acceptance criteria, tests, and independent review before completion.

## Security and billing

In the free release, `NEXT_PUBLIC_PAYMENTS_ENABLED` is `false` in the build: the landing only shows the free plan and the checkout experience does not open, even with `?plan=PRO`. The API must be in the same mode, with `INFINITEPAY_HANDLE` empty. The free plan offers 100 credits/day, with no monthly ceiling; each real generation attempt in Gemini consumes one credit. The values displayed on the landing must follow the catalog and the backend reservation function.

- Price, plan, balance and payment confirmation come from the API; the client does not grant entitlement. BFF obtains session authorization and only forwards `Idempotency-Key` to checkout, without passing arbitrary cookies/headers.
- The purchase intent is kept in `sessionStorage` per plan, during redirect/retry, until confirmation `PAID`. The browser does not persist financial payloads. External checkout only opens in HTTPS on the exact host `checkout.infinitepay.com.br`; no remote iframe.
- The return flow validates allowlisted parameters and ownership in the backend; pending status is not presented as confirmed access. The session token stays in secure cookies renewed by the proxy; token signature and ownership are validated by the API.
- `bun audit --production` must remain clean. Vinext/adapter Cloudflare are in `devDependencies`; frozen lockfile is required in CI/deploy. Also audit build dependencies and register real transitive risk in the PR, with update plan, without perpetuating an expired exception in the README.

## Client observability

The frontend collects only experience signals and stable error classes: page views, LCP, INP, CLS, FCP, TTFB and API result. It uses an ephemeral cohort of 10% per session; the seed is in the `sessionStorage` and is not sent. Do not collect full URL, query, email, user/material/request ID, response, error message, stack, cookie or token. No session replay, fingerprinting or marketing analytics.

`POST /api/observability` limits body to 2 KiB and requires the Cloudflare Rate Limiting binding, with 30 events/minute per origin at each location. No binding or failure answers `503`; validates allowlisted fields, ignores cookies/headers received and fills the build on the server. Configure `OBSERVABILITY_INGEST_URL` HTTPS, `OBSERVABILITY_ALLOWED_ORIGINS` with exact origins and `OBSERVABILITY_INGEST_TOKEN` Worker secret, without `NEXT_PUBLIC_`. Destination outside the allowlist and redirect are refused. Without a URL, valid events receive `202` and are discarded; this also shuts off export immediately. Deploy verifies that the token does not appear in the artifact when configured.

Initial objectives in 28-day window per route/build: LCP p75 ≤ 2.5 s, INP p75 ≤ 200 ms, CLS p75 ≤ 0.1; client errors and API 5xx observed below 1% of the same cohort. Compare regressions between builds before reacting. Do not increase collection or enable arbitrary payloads during incidents.

## MVP notes

- Authentication uses secure Supabase cookies with renewal in Next proxy.
- The header and the study space use `/api/billing/me` as an authoritative source for plan, daily/period credits, and conservative estimates per operation.
- Paid CTAs reach `/study?plan=...`, confirm the server catalog, and only open HTTPS URLs from InfinitePay's allowed host. Return on `/payment/return` never releases access before API reconciliation. The frontend uses English route names; redirects from the previous Portuguese paths preserve bookmarks and existing payment-provider return URLs until the backend return path is updated.
- The interface accepts `pt-BR` and `en-US`; the preference is only in the browser.
- New materials inform the language chosen to the API. Old content in another language is only translated after explicit confirmation, as the operation consumes an AI call and preserves the map identifiers and sessions.
- The map selects nodes locally and shows the diagnosis in the same context; transitive relationships are hidden by default to reduce crossings.
- The practice previews up to three active gaps before consuming AI and does not automatically include concepts already mastered.
- The listing only loads metadata; the full text is fetched for the active material. Recent readings use a short cache with ETag and are invalidated by SSE events after changes in any tab.
- The proxy only forwards the session token; signature and ownership continue to be validated by the API. This prevents a duplicate remote Supabase query on each call without turning the frontend into an authentication authority.
- BFF forwards `Idempotency-Key` exclusively to the checkout endpoint and never transfers arbitrary browser cookies or headers to the backend.
- The `workers.dev` domain can be replaced by a custom domain.
- Material processing occurs in the OCI API and worker, not in Cloudflare Worker.
