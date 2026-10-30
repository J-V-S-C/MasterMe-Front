# MasterMe — Frontend

**A study workspace that keeps the reading, the question, the answer, and the next step together.**

MasterMe is for people teaching themselves programming and other technical subjects. Reading can feel clear in the moment, yet be difficult to explain or use later. It is also easy to collect more material than anyone can study. The app lets a learner bring their own book, article, or notes; see the important ideas alongside the original source; answer in their own words; and decide what to review or practice next. It never presents a completed task or one correct answer as proof of overall mastery.

This repository contains the **web app**: the pages the learner sees, the browser session, the interface for reading and studying, and a server-side proxy to the API. The [backend is a separate repository](https://github.com/J-V-S-C/MasterMe-API); it stores material and study history, runs extraction, evaluates answers, and enforces ownership and AI credits. Both repositories are needed for the complete experience, but this README explains the frontend without relying on a parent workspace.

- [Open the app](https://masterme-frontend.joaovictorcortabitart.workers.dev)
- [Backend repository and API reference](https://github.com/J-V-S-C/MasterMe-API)

## Contents

- [The learner journey](#the-learner-journey)
- [Screens and routes](#screens-and-routes)
- [How the frontend works](#how-the-frontend-works)
- [Interface decisions](#interface-decisions)
- [Code structure](#code-structure)
- [Local development](#local-development)
- [Visual validation with Playwright MCP](#visual-validation-with-playwright-mcp)
- [CI/CD and production](#cicd-and-production)
- [Security and billing](#security-and-billing)
- [Client observability](#client-observability)
- [Current limits](#current-limits)

## The learner journey

1. **Bring a source.** In **Study**, paste text or upload a PDF, Markdown, or TXT file. The app shows meaningful processing stages while the backend extracts concepts. The source remains available; PDFs can be read as their original pages when they contain selectable text.
2. **Choose an idea.** Browse the visible concept list and choose one. The selected concept, its cited passage, and the question stay in the same study context. A concept relationship is information, never a gate that forces a sequence.
3. **Show understanding.** Answer a custom question without having the answer written into the question itself. The learner can switch among explanation, reasoning, application, and recall activities. Feedback describes the specific answer as passed, incomplete, or logically broken; earlier attempts remain accessible.
4. **Choose the next action.** **Library** holds materials and an editable task board, calendar, availability, goals, and plans. The Today view offers a few actions with reasons; suggestions do not become tasks until the learner chooses them.
5. **Practice a gap.** **Practice** can show a focused drill or generate a Practice Project brief from selected concepts or available evidence. A project is a proposal to do work, not an automatically graded submission.

These are independent choices. Someone may read without answering immediately, create a task without a study result, or generate a project after extraction. Confidence, answers, recall, and task completion are kept as different signals.

## Screens and routes

| Browser route | What a person sees | Main interaction |
| --- | --- | --- |
| `/` | Public introduction to MasterMe. | Open the product or sign in. |
| `/login` | Account access through Supabase Auth. | Sign in or create an account. |
| `/study` | Source import, original reading, concepts, questions, feedback, saved attempts, and reviews. | Choose a material and concept, read the source, answer, or revisit an attempt. |
| `/library` | Materials, shelves, goals, plans, task board, day agenda, calendar, and Today suggestions. | Organize work, set availability, and accept or ignore suggestions. |
| `/practice` | Focused drills and Practice Project briefs. | Pick a gap or concepts and request practice. |
| `/knowledge-map` | Compatibility address. | Redirects to the Study record; it is not a separate current workspace. |
| `/payment/return` | Return from hosted checkout when payments are enabled. | Wait for server-confirmed payment status. |

The visible main navigation is **Study**, **Library**, and **Practice**. The interface supports Brazilian Portuguese and English, light and dark themes, keyboard operation, and reduced motion. AI operations use internal credits displayed in the header; the backend supplies the balance.

## How the frontend works

```text
Learner in browser
  → Next.js page and components
  → same-origin /api proxy with the browser session
  → backend API checks identity, ownership, state, and credits
  → database, background worker, or AI provider as needed
  → response or progress event returns to the page
```

The browser talks to its own `/api/*` paths. The Next.js proxy attaches the current Supabase session token and forwards the request to the backend. This keeps the backend address and session handling in one place; the backend still makes every access and billing decision. Long-running material extraction reports progress through `/api/events`, which relays server-sent events. If the live stream drops, the Study screen can recover progress by asking for the job state again.

The frontend keeps only the interface state it needs, such as the active material, draft answer, theme, and language preference. The saved material, questions, attempts, tasks, and balances come from the API. Reopening Study restores saved work instead of treating a browser refresh as a new learning attempt.

## Interface decisions

| Decision | Reason and effect |
| --- | --- |
| Show the source beside the activity | A learner can check what a question refers to. The PDF viewer shows the original page and highlights the passage only when it can locate it reliably. |
| Make concepts visible and selectable | A long hidden selector made it difficult to discover another concept. The current list keeps that choice in view. |
| Keep activities optional | Explaining, applying, and recalling provide different evidence. One activity does not unlock or certify another. |
| Show feedback in the same study context | The learner can compare the diagnosis with their answer and the source without losing their place. |
| Let the learner control planning | Today suggestions explain themselves; accepting, editing, or ignoring them is a deliberate choice. |
| Use shared accessible controls | Reused controls and native browser behavior keep keyboard, focus, and mobile interaction consistent. |
| Keep permissions on the server | Hiding a button is useful for the interface, but only the backend can authorize a resource or spend a credit. |

## Code structure

The route files in `app/` select a screen. Feature behavior lives mostly in components and `lib/`, so a route does not also become the place for API, authentication, and visual logic.

```text
app/                    pages, auth routes, same-origin API proxy, event relay
components/
  study/                source reader, concept selection, activities, history
  tasks/                library, task board, calendar, goals, plans
  practice/             drills and Practice Projects
  shell/                navigation and page frame
  ui/                   shared controls and loading states
  providers/            shared billing and realtime state
lib/
  api/                  typed API requests and responses
  auth/                 browser and server session helpers
  study/                active material, extraction state, drafts
  localization/         Portuguese and English interface text
  billing/              checkout and balance helpers
  observability/        limited client experience signals
styles/                 shared layout and base styles
app/themes.css          semantic light and dark palette
```

`components/study/live-study.tsx` coordinates the Study screen; `components/tasks/library-workspace.tsx` coordinates Library; `components/practice/practice-workspace.tsx` coordinates Practice. Shared UI components provide consistent labels and focus behavior. A feature-specific control stays with its feature. The [design system](DESIGN_SYSTEM.md) and [frontend design guide](skills/front-skill.md) are versioned here for interface changes.

## Local development

```bash
cp .env.example .env.local
# Set BACKEND_URL, PUBLIC_APP_URL, and your Supabase URL and publishable key in .env.local.
bun install
bun run dev
```

Run these commands from this repository's root after starting the backend API and worker. The app opens at `http://localhost:3000`; `BACKEND_URL` should point to the local API at `http://localhost:3333`. A Gemini key and database are required for a full upload-to-feedback journey; follow the [backend repository’s local setup](https://github.com/J-V-S-C/MasterMe-API#local-development) before opening Study.

Full validation for the owner or commit automation (the coding agent does not run it unless explicitly asked):

```bash
bun run typecheck
bun test
bun run build
BACKEND_URL=https://masterme-api.duckdns.org bun run build:vinext
```

Playwright writes screenshots, traces, and its `.last-run.json` marker to `test-results/`. This is generated, ignored output for inspecting test failures; it is not application source and can be removed locally after inspection.

Install the versioned pre-commit hook once per clone with `git config --local core.hooksPath .githooks`. It runs `scripts/ci-local.sh` before every commit: validation, dependency audit, and the built Next.js smoke test. Stage all changes before committing; a failed gate aborts the commit.

## Visual validation with Playwright MCP

Playwright MCP is the project's manual inspection browser. It complements, but does not replace, automated tests: use it to observe the rendered interface, capture screenshots, interact with controls, and investigate console or network errors.

If MCP is not yet configured in Codex CLI, install it to the developer profile and confirm the connection:

```bash
codex mcp add playwright -- npx "@playwright/mcp@latest"
codex mcp list
```

When the owner requests browser validation, use `bun run dev` and inspect the changed route at widths of 390 px, 768 px and 1440 px. In each viewport, check horizontal overflow, alignment, spacing, typography, focus and relevant states; test the controls and review console errors and failed requests.

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

CI installs with `bun install --frozen-lockfile`, executes `bun run validate`, a production dependency audit, Next/Vinext builds, and landing/login HTTP smoke checks with CSP and `nosniff`. Deploy repeats the gate before publishing. Code, tests, and workflows in this repository define the released frontend behavior.

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

## Current limits

- PDFs need selectable text; the app does not perform OCR. A passage is highlighted on the original page only when its location can be matched with confidence.
- Questions and feedback come from AI and can be imperfect. The source and saved attempts stay available so the learner can inspect or contest a diagnosis. MasterMe does not claim a global mastery score or proven learning outcomes.
- A Practice Project is a brief. The app does not accept, execute, or grade a submitted project solution.
- The free release has payments disabled in the frontend build and backend configuration. The return route remains for compatibility with the hosted checkout flow when paid plans are enabled.
- The current `/knowledge-map` address redirects into Study. Relationships can still inform concept exploration, but they do not control which concept the learner may open.
- Material lists fetch summaries first; the full source is requested only for the active material. Recent readings use private caching and refresh when progress events report changes.
- The interface language preference is stored in the browser. Older material in another language is translated only after explicit confirmation because that action uses an AI credit.

The [backend repository](https://github.com/J-V-S-C/MasterMe-API) contains the complete HTTP route catalogue, data and worker architecture, migrations, and operations. This README remains the entry point for the browser experience and frontend design decisions.
