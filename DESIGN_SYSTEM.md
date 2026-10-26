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

Authentication keeps mode-switching controls spatially stable: on desktop the login/sign-up tabs precede the variable heading, and the selected tab uses a clearly contrasting surface and text treatment. Switching modes must not move the tabs or cause surrounding controls to jump.

Authentication is a focused product surface, not a second landing page. On wide screens it uses the full viewport: a narrow, solid brand field groups a wordmark linking home with one editorial statement and a factual description. A compact icon picker previews the four actual product areas; selecting one shows a short functional explanation without a secondary destination link. The response to selection is brief and respects reduced motion. Language and theme controls occupy the lower part of that field because they change the actual experience; do not fill the space with redundant destination text or a second home link. The wider form field gives the controls comfortable space and centers the form vertically. On mobile the blue header spans the viewport and its heading uses the available text width; the intro and form stack compactly, without the desktop preview. Do not use large floating cards, aggressive shadows, gradients, excessive rounded corners, duplicated notes, or promotional copy that competes with the sign-in task. Surfaces should feel calm and easy to scan; personality comes from composition, typography, and the blue identity color, not decoration.

The authentication brand field and primary buttons use the same global `--blue` and `--blue-ink` tokens in both themes. The blue field is `#0037b0` in light mode and `#1f4d9b` in dark mode. Its selection, hover, and borders derive from these tokens. Focus outlines use `--focus-ring`, which switches to readable neutral text in dark mode.

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
| Action | `--blue` | `#0037b0` | `#1f4d9b` |
| Completion | `--green` | `#006b2f` | `#4edea3` |
| Attention and eyebrow | `--amber` | `#9b4500` | `#ffb95f` |

`--line-faint`, `--line-soft`, and `--line` define separator strength. `--blue-ink` supplies text on blue controls. `--blue-text` uses blue for text in light mode and primary text in dark mode, where the action blue is too dark for small text on dark surfaces. `--focus-ring` uses blue in light mode and readable neutral text in dark mode. `--accent-soft` and `--accent-medium` are derived from the same blue; they are not separate blue palette values. `--success-soft` and `--warning-soft` distinguish confirmation and caution. Theme variants must retain readable contrast; a color never stands alone as the state indicator. Define literal UI colors only in the palette blocks of `app/themes.css`. Commit and CI automation run `bun run validate:palette`; the coding agent does not run it unless explicitly asked.

`--font-editorial` (Iowan Old Style, Palatino, Georgia fallback) carries page headings and selected narrative statements. `--font-ui` carries controls, data, task text, and most body copy. The shared type floor lives in `app/readable-type.css`: body text is 17 px, controls and supporting text are at least 16 px, and labels and metadata are at least 14 px. Small uppercase labels use the UI face with restrained letter spacing. Page headings use `clamp()` and reach about 50 px on wide screens; section titles are about 24 px. At narrow widths, shorten labels or allow wrapping instead of shrinking readable text. Inputs use at least 16 px type to avoid mobile zoom. Do not shrink instructions or diagnosis to metadata size.

Panels are quiet `--low` surfaces, usually with an 8–11 px radius, faint border or soft shadow, and around 20 px of internal spacing. Controls have clear borders, visible focus, and comfortable targets. The primary button is blue; neutral actions live on `--deep`. Motion is brief and purpose driven. Respect `prefers-reduced-motion`.

## Public landing

The landing is the acquisition surface at `/`; it is not part of the authenticated shell and has no navigation into the product except sign-in. It uses the same semantic tokens as the application, so the theme control switches both palettes without a second color source. No remote stylesheet or font is loaded: the content security policy allows only self-hosted assets, and the landing keeps the system UI, editorial serif, and monospace stacks. The monospace face is reserved for eyebrows, diagram labels, and specification notes; body copy stays in the UI face.

The desktop header carries the brand, centered tabs for the application's four areas with their icons — Study, Tasks, Analyze, Create — and one primary call to action. The tabs scroll to the matching landing sections; they do not enter the authenticated app. At 760 px and below, the header shows the brand, primary action, and a menu with all four sections, language, theme, and sign-in. The desktop footer holds language and theme controls. Below the header, the hero states the product promise — **Organize what to study. Discover what you really learned.** — without an eyebrow above it, and offers one primary and one secondary action before the material card. The material card links to authentication; it never pretends to accept a file or process it on the page.

The public footer renders the same four-tab component and visual treatment as the header, including icons at mobile widths. At the narrowest widths it uses two rows so labels remain readable and all four tabs stay visible. Plans and sign-in remain separate links beside those tabs. The landing background is solid; avoid decorative blue gradients that do not communicate product information.

Route directories, URLs, and landing section fragments use English names. Portuguese remains a supported interface locale. Legacy Portuguese URLs redirect to their English equivalents, including the payment return URL used by existing checkout links.

The signature element is the map-and-diagnostic diptych, preceded by a four-step tour of the product's areas — Study, Tasks, Analyze, Create — which share one private library. The numbering is an index, not a required order, and the copy keeps each area usable on its own. The diptych uses a labelled illustrative example (database indexes), never a borrowed paper as if it were the visitor's own source: the figure says **exemplo ilustrativo**, and the panel notes that a real diagnostic uses the visitor's material. It is a figure, not an interactive control, and it must stay legible at 390 px when the two surfaces stack. The landing Tasks section separates choosing a date, setting a time and duration, and placing a card on the board into three accessible views of one clearly labelled example. Those controls update only the preview and never save a task. The real workspace retains material, concept, suggestions, and editing controls; the landing example does not imply those actions happen on the public page. Illustrative content uses readable labels at mobile widths and omits fake controls. Four path cards follow and state that exploration, explanation, edge cases, and practice do not block one another. A Create section then shows a practice brief with goal, deliverables, constraints, and first step, labelled as an example and explicitly not a submission flow. Pricing and the FAQ remain after it: with payments disabled the plan grid shows only the free plan, and paid-plan questions stay hidden. Claims stay factual — the page does not claim local processing, zero telemetry, or a demo flow the product does not have.

Calls to action reuse `planLoginHref` and carry only a plan ID in the destination, never a price. The landing renders no session fetch or realtime connection. Language and theme preferences persist in browser storage, and the document language follows the selected locale.

## Layout by destination

### Study

The top header identifies the active study material with the shared eyebrow, title, and supporting sentence. The material and concept controls form one decision band below it. The header contains navigation and account controls, without a credit control. Study shows a small remaining-credit count below the material and concept controls. When a concept is ready and no question is open, the main area names that concept, explains why to begin, and offers one prominent **Start studying** action directly below the controls. A saved question resumes automatically. With no saved choice, a review concept is proposed first, then an available concept; this is a suggestion, never a lock. Status labels use the active locale. Once started, the question, answer, and diagnosis form a focused content column. Each next-step recommendation names its concept. **New question** is a secondary action only after a question is open. Adding another material appears below the study controls and above the next step or active question. The student refers to their own material for full reading. Removing the former reference reader must not cause the question area to float in a narrow centered sliver; it fills the shared work frame while keeping text readable through spacing and typography.

Concept relationships do not lock study actions. An approved explanation and an optional edge-case test remain separate events. Error and extraction states explain what can happen next.

### Tasks

Tasks appears immediately after Study in the main navigation. A compact heading sits inside the task controls, leaving the calendar and board visible sooner; the page does not repeat an eyebrow, large title, or introductory paragraph. The add form is a control band and reuses the shared select and button components. The work area has a three-column To do, Doing, Done board and a calendar with a selected-day agenda. On narrow screens the columns stack, then the calendar and agenda follow.

The calendar is a working control: it displays scheduled tasks, choosing a day opens its agenda and fills the new task's date, and moving an event changes its date while preserving the time. Task forms provide the keyboard equivalent. Failed updates restore the prior event position and show the cause. The calendar, agenda, and board reflect the same task data.

Cards appear in the student's saved priority order within each stage. The whole free area of a card starts pointer dragging, and the card itself supports keyboard movement; a full-card preview follows the drag. After starting a keyboard drag with Space, W/S or ↑/↓ changes priority within a column, A/D or ←/→ changes columns, and Space drops the card. Interactive controls inside a card remain independently usable. The column names the stage, so cards do not repeat To do, Doing, and Done controls or show a separate Move button. Card hierarchy comes from a quiet blue rule, editorial title, plain date and duration line, optional student-written description, and clearly bounded Edit and Remove buttons. The add and edit forms offer an exact local time, a custom duration of 1–480 minutes alongside common choices, a student-written description of up to 500 characters, a material, and one of its concepts. The description is separate from the reason attached to a study suggestion. The edit time input has enough width for the browser's clock control and AM/PM indicator. On medium and larger screens, card editing opens in a compact native dialog with a close button, a two-column field layout, and an internally scrolling body when space is limited. On phones, editing stays inline with a sticky close control at the top. After adding a task, the selected material and concept remain selected for the next task until changed. Cards show the scheduled time, optional material, concept, description, and duration. Completion changes the task's stage and does not imply learning. When and Details share the compact two-column control and live-preview layout; Details places its description above time and duration without stretching controls to fill empty height. Board keeps usable drop columns without forcing a viewport-height scroll. The calendar uses the current language's date order; its task-count marker stays legible on narrow screens. Selecting a date reveals full task names, times, durations, and the total planned time in the day agenda. Suggestions based on study evidence remain optional and collapsed. The task page does not dump raw book text, relation excerpts, or concept cards.

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

The rendered screen must work at 390, 768, and 1440 px. At wide widths, preserve the two-surface relationship where useful. At 768 px, allow a one-column work area without horizontal overflow. At 390 px, forms, task actions, navigation, calendar controls, and long titles must remain readable and operable. Both themes and locales (`pt-BR`, `en-US`), keyboard focus, selected and error states, and reduced motion belong in the validation workflow.

Commit and CI automation run `bun run validate` in the affected repository. Browser inspection is a separate owner-invoked check. The coding agent makes the edits without running post-change checks and reports the unvalidated state. Keep durable product decisions here; executable code, tests, and API contracts determine what is implemented.
