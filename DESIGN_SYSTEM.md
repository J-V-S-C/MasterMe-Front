# MasterMe frontend design system

This document describes the visual and interaction contract for the current product. The rendered components and theme tokens are the implementation source of truth. Read `skills/front-skill.md` before changing a frontend screen, then check this document against the affected code. Update this document when a durable decision changes.

## Product and audience

MasterMe is a study workspace for people learning technical subjects from material they choose. They need to understand what a concept means, test their own explanation, inspect a diagnosis, and choose a practical next action. The product does not claim that one approved answer proves mastery. The student owns the source material; the application keeps short, grounded evidence close to a question and does not reproduce an entire book as a second reader.

The application has four destinations in this order: **Study → Tasks → Analyze → Create**. Their functions are distinct, but they must feel like one system. A person should recognize the page header, control treatment, spacing, surface hierarchy, and action states when moving between them.

| Destination | Primary job | Main surface |
| --- | --- | --- |
| Study | Choose a material and concept, explain, and review a diagnosis | Question, context, answer, diagnosis |
| Tasks | Decide what to finish and when | Editable list and working calendar |
| Analyze | Inspect concept relationships and evidence | Map with contextual inspector |
| Create | Prepare and generate a practice project | Focus controls and project preview |

## Shared visual language

The authenticated application uses a cool ink and blue-gray palette. It starts at the top of the content frame, below the header. `PageShell`, `page-main`, and `WorkspaceHeading` are shared across Study, Tasks, Analyze, and Create. The shared page opening is an editorial header: a compact amber eyebrow, a large blue heading, one supporting sentence, and a thin separator. A page can add a material selector or a small piece of status information beside the heading, but it should not replace the header with a large isolated card or center the entire workspace.

The characteristic visual moment belongs to Analyze: a navigable map with an inspector that explains selected relationships. Other pages stay quieter. Tasks derives its visual meaning from dates and planned actions; Create from a focus decision and preview; Study from the question and answer. Numbering, labels, badges, and color must encode real state, sequence, or meaning.

The application shell uses the available width up to 1520 px, with page padding. Domain work areas use grids when two surfaces need to be compared or used together; they collapse to one column at narrower widths. Avoid arbitrary page-level widths that leave the main work stranded in the middle of a wide screen. Readable text can have its own line-length limit inside a surface.

## Tokens and type

Use semantic tokens from `app/themes.css`, not isolated feature colors. The current default light theme and dark override are:

| Role | Token | Light | Dark |
| --- | --- | --- | --- |
| Page | `--bg` | `#faf8ff` | `#070d13` |
| Primary surface | `--low` | `#ffffff` | `#0e1a25` |
| Nested surface | `--deep` / `--card` | `#f2f3ff` | `#09131c` / `#132432` |
| Primary text | `--text` | `#0d1b36` | `#edf4fb` |
| Secondary text | `--muted` | `#434655` | `#bdcad5` |
| Action and focus | `--blue` | `#0037b0` | `#adc6ff` |
| Completion | `--green` | `#006b2f` | `#4edea3` |
| Attention and eyebrow | `--amber` | `#9b4500` | `#ffb95f` |

`--line-faint`, `--line-soft`, and `--line` define separator strength. `--blue-ink` supplies text on blue controls. `--accent-soft`, `--success-soft`, and `--warning-soft` distinguish selection, confirmation, and caution. Theme variants must retain readable contrast; a color never stands alone as the state indicator.

`--font-editorial` (Iowan Old Style, Palatino, Georgia fallback) carries page headings and selected narrative statements. `--font-ui` carries controls, data, task text, and most body copy. The shared type floor lives in `app/readable-type.css`: body text is 17 px, controls and supporting text are at least 16 px, and labels and metadata are at least 14 px. Small uppercase labels use the UI face with restrained letter spacing. Page headings use `clamp()` and reach about 50 px on wide screens; section titles are about 24 px. At narrow widths, shorten labels or allow wrapping instead of shrinking readable text. Inputs use at least 16 px type to avoid mobile zoom. Do not shrink instructions or diagnosis to metadata size.

Panels are quiet `--low` surfaces, usually with an 8–11 px radius, faint border or soft shadow, and around 20 px of internal spacing. Controls have clear borders, visible focus, and comfortable targets. The primary button is blue; neutral actions live on `--deep`. Motion is brief and purpose driven. Respect `prefers-reduced-motion`.

## Public landing

The landing is the acquisition surface at `/`; it is not part of the authenticated shell and has no navigation into the product except sign-in. It uses the same semantic tokens as the application, so the theme control switches both palettes without a second color source. No remote stylesheet or font is loaded: the content security policy allows only self-hosted assets, and the landing keeps the system UI, editorial serif, and monospace stacks. The monospace face is reserved for eyebrows, diagram labels, and specification notes; body copy stays in the UI face.

The header carries the brand, the application's four area tabs with their icons — Study, Tasks, Analyze, Create — the locale select, the theme control, a separate Plans link, sign-in, and one primary call to action. The tabs scroll to the matching landing sections; they do not enter the authenticated app. Below it, the hero states the product promise — **Organize what to study. Discover what you really learned.** — and offers one primary and one secondary action before the material card. The material card links to authentication; it never pretends to accept a file or process it on the page.

The public footer renders the same four-tab component and visual treatment as the header, including icons at mobile widths. Plans and sign-in remain separate links beside those tabs. The landing's responsive tab rules must keep all four tabs visible even where the application shell hides middle navigation links.

Route directories, URLs, and landing section fragments use English names. Portuguese remains a supported interface locale. Legacy Portuguese URLs redirect to their English equivalents, including the payment return URL used by existing checkout links.

The signature element is the map-and-diagnostic diptych, preceded by a four-step tour of the product's areas — Study, Tasks, Analyze, Create — which share one private library. The numbering is an index, not a required order, and the copy keeps each area usable on its own. The diptych uses a labelled illustrative example (database indexes), never a borrowed paper as if it were the visitor's own source: the figure says **exemplo ilustrativo**, and the panel notes that a real diagnostic uses the visitor's material. It is a figure, not an interactive control, and it must stay legible at 390 px when the two surfaces stack. A planning section then shows dated tasks, the calendar, and optional suggestions. Its mock is decorative and `aria-hidden`; the bullets carry the meaning. Four path cards follow and state that exploration, explanation, edge cases, and practice do not block one another. A Create section then shows a practice brief with goal, deliverables, constraints, and first step, labelled as an example and explicitly not a submission flow. Pricing and the FAQ remain after it: with payments disabled the plan grid shows only the free plan, and paid-plan questions stay hidden. Claims stay factual — the page does not claim local processing, zero telemetry, or a demo flow the product does not have.

Calls to action reuse `planLoginHref` and carry only a plan ID in the destination, never a price. The landing renders no session fetch or realtime connection. Language and theme preferences persist in browser storage, and the document language follows the selected locale.

## Layout by destination

### Study

The top header identifies the active study material with the shared eyebrow, title, and supporting sentence. The material and concept controls form one decision band below it. The header contains navigation and account controls, without a credit control. Study shows the full credit quota beside the primary study work on wide screens and below it on narrow screens. It starts expanded and can be minimized to a row that still shows the available balance. When a concept is ready and no question is open, the main area names that concept, explains why to begin, and offers one prominent **Start studying** action directly below the controls. A saved question resumes automatically. With no saved choice, a review concept is proposed first, then an available concept; this is a suggestion, never a lock. Status labels use the active locale. Once started, the question, optional short evidence excerpt, answer, and diagnosis form a focused content column. Each next-step recommendation names its concept. **New question** is a secondary action only after a question is open. Adding another material appears below the study controls and above the next step or active question. The student refers to their own material for full reading. Removing the former reference reader must not cause the question area to float in a narrow centered sliver; it uses the shared work frame and readable internal width.

Concept relationships do not lock study actions. An approved explanation and an optional edge-case test remain separate events. Error and extraction states explain what can happen next.

### Tasks

Tasks appears immediately after Study in the main navigation. Its page header has the same hierarchy and top alignment as Analyze and Create. The add form is a control band. The work area places the task list beside a calendar on wide screens; the calendar moves below the list on narrow screens. The list remains usable with no dated tasks.

The calendar is a working control, not decoration: it displays dated open tasks, choosing a day selects it and fills the new task's target date, choosing an event locates that task in the list, and moving an event changes its date. The task form and edit form provide date changes by keyboard. The calendar ends at the month grid; the task list is the place to read task details. Failed updates restore the prior event position and show an error. Calendar and list reflect the same task data.

Open tasks appear by date, undated tasks afterward. **To do** and **Completed** are visible controls at the top of the task list, each with its count; completed tasks never require scrolling to a separate bottom section. Each row shows the task, its target date, optional material, and actions to edit, complete, reopen, or remove it. Completion changes the task's list and does not imply learning. Suggestions based on study evidence remain optional and collapsed. The task page does not dump raw book text, relation excerpts, or concept cards. Calendar navigation uses text labels so it stays legible even when icon assets do not load.

### Analyze

The map occupies the main area, with the inspector nearby. A selected concept or relationship has a readable explanation and short source evidence. The inspector names the selected concept beside its next-step recommendation. Connections inform the student; they do not enforce a path. Dense graphs need a usable list or focused view and visible keyboard focus. Graph layout is presentation, not an authority over study order.

### Create

The material selector belongs in the shared page header. The focus controls lead to an explainable preview before generation. The result occupies the companion area. Automatic and manual focus are clear student choices. Generated projects remain available independently of a mandatory study session.

## Interaction rules

- Controls stay in predictable locations while content changes. Rows may grow for editing, but primary navigation, calendar controls, and page actions should not jump because a neighboring paragraph is longer.
- A primary action names its outcome. Use secondary actions for edit, reopen, cancel, and remove. Destructive operations need a clear target and confirmation when they remove material or history.
- Selection needs text, shape, or an accessible state such as `aria-current` or `aria-pressed` in addition to color.
- Date controls use the student's local day. The task list, task date field, and calendar must agree about that day. A date is an editable target, not an automatic penalty or mastery signal.
- Keyboard access is required for every task operation. Calendar drag is an enhancement; the date field remains the equivalent way to reschedule.
- Empty states explain the next action. Errors remain visible near the affected work and never imply success. Loading surfaces preserve enough structure to avoid a false empty state.
- AI-generated material is untrusted and can be wrong. Evidence must be source grounded and concise. Do not hide uncertainty behind dense text or decoration.

## Responsive and validation contract

Check the rendered screen at 390, 768, and 1440 px. At wide widths, preserve the two-surface relationship where useful. At 768 px, allow a one-column work area without horizontal overflow. At 390 px, forms, task actions, navigation, calendar controls, and long titles must remain readable and operable. Check both themes and both locales (`pt-BR`, `en-US`), keyboard focus, selected and error states, and reduced motion.

Run `bun run validate` in the affected repository. For a significant visual change, inspect the real page in a browser at those widths. If authentication prevents that inspection, report the limitation instead of claiming visual validation. Keep durable product decisions here; executable code, tests, and API contracts determine what is implemented.
