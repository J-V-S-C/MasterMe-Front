# MasterMe — Frontend

**A study workspace that keeps the reading, the question, the answer, and the next step together.**

MasterMe is for people teaching themselves programming and other technical subjects. Reading can feel clear in the moment, yet be difficult to explain or use later. It is also easy to collect more material than anyone can study. The app lets a learner bring their own book, article, or notes; see the important ideas alongside the original source; answer in their own words; and decide what to review or practice next. It never presents a completed task or one correct answer as proof of overall mastery.

This repository contains the **web app**: the pages the learner sees, the browser session, the interface for reading and studying, and a server-side proxy to the API. The [backend is a separate repository](https://github.com/J-V-S-C/MasterMe-API); it stores material and study history, runs extraction, evaluates answers, and enforces ownership and AI credits. Both repositories are needed for the complete experience, but this README explains the frontend without relying on a parent workspace.

- [Open the app](https://masterme-frontend.joaovictorcortabitart.workers.dev)
- [Backend repository and API reference](https://github.com/J-V-S-C/MasterMe-API)

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

The visible main navigation is **Study**, **Library**, and **Practice**. AI operations use internal credits displayed in the header; the backend supplies the balance.

## How the frontend works

```text
Browser → Next.js pages and components → same-origin /api proxy → backend API
                                                     ↘ processing events via SSE
```

The proxy attaches the current Supabase session token. The backend checks identity, ownership, state, and credits before reading or changing saved data. Study receives extraction progress through `/api/events` and can recover the current job state if the stream drops. The frontend keeps temporary interface state, such as a draft answer and language preference; materials, attempts, tasks, and balances come from the API.

```text
app/                  pages, auth routes, API proxy, event relay
components/study/     reader, concept selection, questions, history
components/tasks/     library, task board, calendar, plans
components/practice/  drills and Practice Projects
components/ui/        shared controls
lib/api/              typed backend requests and responses
lib/auth/             browser and server session helpers
lib/study/            active material and extraction state
lib/localization/     Portuguese and English interface text
```

The interface supports Brazilian Portuguese and English, light and dark themes, keyboard use, and reduced motion. The reader shows the original PDF page and highlights a passage when it can locate it reliably. Concepts remain selectable; activities do not lock one another. Today suggestions explain their reasons and only become tasks when accepted.

## Run locally

Start the [backend API and worker](https://github.com/J-V-S-C/MasterMe-API#run-locally), then run from this repository:

```bash
cp .env.example .env.local
# Set BACKEND_URL, PUBLIC_APP_URL, and Supabase URL and publishable key.
bun install
bun run dev
```

Open `http://localhost:3000`; set `BACKEND_URL` to `http://localhost:3333` for a local backend. A Gemini key and database are needed in the backend for the complete upload and study flow. Check the frontend with `bun run typecheck`, `bun test`, and `bun run build`.

The frontend is deployed as a Cloudflare Worker through `.github/workflows/`. Deployment requires the API URL, public app URL, and Cloudflare credentials in the GitHub production environment. The backend and frontend are released separately.

## Current limits

PDFs need selectable text; there is no OCR. Passage highlights appear only when the source location can be matched reliably. AI questions and feedback can be imperfect, so the original source and saved attempts remain available for inspection and contestation. Practice Projects are briefs rather than automatically graded submissions. The current `/knowledge-map` route redirects into Study. Payment checkout is disabled in the free release; the backend remains responsible for balances and payment confirmation when paid plans are enabled.

The [backend repository](https://github.com/J-V-S-C/MasterMe-API) contains the API contract, data and worker implementation, and deployment details. The [design system](DESIGN_SYSTEM.md) documents the interface conventions.
