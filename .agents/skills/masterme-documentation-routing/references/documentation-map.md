# Document map — frontend

Always read `AGENTS.md` and this map. Select documents as follows.

| Task scope | Read before acting |
| --- | --- |
| Any code change | `docs/ENGINEERING_WORKFLOW.md`, the task's local `.task-prds/*.md` |
| Route, component, design system, copy or localization | `README.md`, relevant component/page/tests and styles |
| Authentication, cookie, proxy, redirect, BFF or secret exposure | `SECURITY.md`, `.env.example`, `proxy.ts`, relevant auth code/tests |
| Checkout, plan display or entitlement UI | payment task PRD, relevant API client/types and backend contract/OpenAPI |
| Accessibility, themes, motion or responsive UI | relevant components/styles/tests; include the affected design-system primitives |
| Cache, SSE, Web Vitals, bundle or performance | `README.md`, relevant provider/client/cache code and tests |
| Cloudflare, CI/CD, environment or rollback | `DEPLOYMENT.md`, `.github/workflows/`, `wrangler.*` |
| Documentation-only change | only the document being changed plus documents it directly links or contradicts |

Read a global workspace PRD only when the change alters a permanent product,
architecture, operational or commercial contract. Update only the affected
sections at initiative close.
