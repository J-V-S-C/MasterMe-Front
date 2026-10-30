# MasterMe design system

## Purpose

MasterMe is a place to think seriously and study deliberately. It helps a student decide what deserves attention, work through ideas from their own material, understand what they can explain, and choose what to do next.

The design should make that work feel possible and worth doing. Its emotional register is **power, intelligence, refinement, and elegance**, held inside a calm and safe environment. Power means the student can act on their plan. Intelligence means the interface reveals useful structure and reasoning. Refinement means every element has a purpose. Elegance means the work feels clear even when the subject is difficult.

This is the enduring design direction. Colors, typefaces, dimensions, components, routes, and implementation patterns may change without changing it.

## The central promise

A student should be able to enter with an uncertain topic and leave with a clearer picture of:

- what they are studying;
- what they understand and what still needs work;
- why a next step is useful;
- when they intend to do it.

The interface should support the student's judgment, not perform confidence on their behalf. It can suggest, diagnose, organize, and make relationships visible. It should not present a generated judgment as absolute truth or turn a suggested path into a mandatory one.

A safe study environment is candid and steady. It gives feedback without shaming, shows uncertainty when it matters, preserves the student's control, and makes recovery from mistakes straightforward.

## Character

### Serious without being severe

The product should feel composed and capable. Use confident hierarchy, readable language, and enough quiet space to think. Avoid visual noise, gamified rewards, cartoon imagery, exaggerated friendliness, and motivational slogans. Seriousness does not require coldness: a precise next step is more encouraging than praise that says little.

### Editorial, not ornamental

Typography, alignment, rhythm, and carefully chosen emphasis should give the product personality. Decorative elements need a reason to exist. A line may connect two ideas, divide two tasks, or show a boundary. A number may mark an actual sequence or quantity. A color may identify an action or a meaningful state. If an element cannot be explained in those terms, it probably should not be there.

### Powerful through agency

The student should feel able to change a plan, move a task, choose a concept, inspect evidence, or take a different route. Controls should make those actions direct and legible. Motion should show what moved and where it landed. A polished interface that obscures control is not powerful.

### Intelligent through explanation

Show relationships, causes, priorities, and evidence. Do not use abstract shapes to imply intelligence. A diagram should let someone learn something that a heading alone would not. A preview should accurately show the kind of result they will receive. A diagnosis should say what is strong, what is missing, and what action follows.

## Design decisions

When choosing between treatments, prefer the one that:

1. makes the student's next useful action clearer;
2. preserves the meaning and provenance of information;
3. gives the important work more room than its introduction;
4. makes distinct activities visibly distinct;
5. remains calm, readable, and usable under pressure.

A screen may be sparse when there is little to show, but it should never feel unfinished. It may be dense when the work requires it, but the relationships between parts must remain apparent. Avoid filling empty space merely to balance a composition.

## One product, distinct work

Shared controls should give the three destinations a familiar feel. The select field uses the browser's native selection behavior with the product's label, spacing, and focus treatment. Reuse the shared button and loading state components so controls stay consistent across routes.

The three primary destinations are Study, Tasks, and Practice. Shared navigation and control behavior should make the system familiar. The main work area should express what is special about that destination. Saved assessments and recurring gaps are available within Study; old Analyze links lead there.

The public landing page should demonstrate these same three destinations with clearly marked examples. Lead with the original source and the question it supports, show feedback and saved gaps within Study, let visitors try a local task preview, and present the focused exercise before the optional project. Do not show retired navigation or imply that a project solution is evaluated in the app.

### Study: examine an idea

The center of Study is the student's source, a question, their explanation, and a grounded response. It should feel focused and private enough for an imperfect first attempt. The answer area deserves space and calm. The diagnosis should separate what the student established from what remains uncertain. A recommendation should name the concept and explain why it follows.

Questions and the saved history with gaps are two visible choices at the top of Study. Keep both choices available in the same position so students can find their earlier answers and return to the current question without searching for a secondary action.

Keep the question readable on its own. Offer a short, source-grounded concept explanation behind an explicit control beside the question, with a separate control for reading the original source. Open a new question with the explanation closed so the student chooses when to use help.
For uploaded PDFs, show the original pages in a book reader that uses the available Study width, with little space around the page and clear page controls. Clicking the left or right edge of a page turns it; the labeled controls and arrow keys remain available. Mark the studied passage only when it can be matched to text on a page; otherwise say that its location is uncertain and let the student browse. Do not repeat the selected PDF passage as raw text below the page. Source disclosure, page navigation, and other secondary actions need a visible control surface, readable label, and clear focus state; they should never resemble unstyled text. For text and Markdown, keep readable prose with its editorial section and page when known, and mark the selected passage within that prose instead of duplicating it above. Selecting a concept opens its question directly. Keep saved explanations accessible and make a new attempt after approval an explicit confirmed choice that preserves the original result.

Put the material and concept controls before the question without repeating the selected material in a large page banner. After an answer is evaluated, bring the diagnosis into view and move keyboard focus to it so the student can read the result without searching below the answer.

Show the available concepts as visible, selectable choices above the question. Mark the current concept clearly. Keep the list scrollable for long materials, and keep every concept reachable regardless of status or map relationship. Concept selection is a primary Study action, so it must not be hidden behind a small disclosure or require sequential navigation.

When there is no material, the act of adding one is the main event. A concise introduction can orient the student, but it should not compete with the form or repeat its instructions.

### Tasks: make an intention concrete

Tasks turns attention into a plan. Dates, times, durations, priorities, and status should be easy to scan and change. The calendar and board are two views of the same intentions; changes in one should make sense in the other. Movement should feel physical enough to understand, while remaining available through keyboard and form controls.

The task itself should carry the student's words and timing. Avoid repeating status in every card when its location already says it. Avoid expanding controls so far that the plan disappears below the fold.

### Learning record within Study: reveal structure

The learning record makes attempts, feedback, and remaining gaps visible in the order of the source. Use color to distinguish outcomes and concise previews to support scanning; keep full answers and source evidence available on request.

Lead with the student's saved questions, answers, feedback, and source passages in the material's editorial order. Group repeated gaps as tentative difficulties and keep the supporting attempts visible. A review action creates a task only when the student chooses it.

An empty learning record should point back to the first question without suggesting that evidence or a diagnosis already exists.

### Practice: apply understanding

Practice turns a chosen difficulty into a short exercise with a criterion, an attempt, and feedback. An optional project can combine concepts. The student should understand the proposed focus before starting either activity; a project result should read like a usable brief, with a goal, deliverables, constraints, and a first step.

Preparing a focused exercise that can spend an AI credit starts from an explicit, labeled action. Selecting a concept alone does not generate its practice question.

An empty Practice screen can show the structure of a project brief. The preview explains what a project will contain, without pretending that a project has already been generated.

## States are part of the work

Empty, loading, error, and completed states deserve the same care as the main screen.

- **Empty:** Say what belongs here, why it matters, and the action that makes it possible. Give the action a visible place in the composition. If a companion visual exists, it must explain the destination's specific work.
- **Loading:** Preserve orientation. Indicate what is happening without implying that content exists or that success is certain.
- **Error:** State what failed near the affected work and offer a real way forward. Never silently discard a student's input or imply that an action succeeded.
- **Completed:** Show the result and its limits. Completion of a task is not proof of learning; one approved explanation is not mastery of a topic.

These principles apply equally to a first visit and to a screen that becomes empty after a change.

## Language and evidence

Write as a thoughtful collaborator would speak to a student: direct, precise, respectful. Prefer concrete verbs and outcomes. Avoid hype, vague claims about intelligence, and language that treats difficulty as failure. Do not use technical implementation details in the learning flow unless the student needs them to decide what to do.

AI-generated output is a proposal to inspect, not an authority to obey. Keep relevant source evidence close to the question or diagnosis. Distinguish student input, source material, generated interpretation, and confirmed action. Let the student understand why something was suggested and change course when they disagree.

Illustrative content must be clearly identified as an example. Do not present sample data, decorative charts, or a staged diagnosis as if they came from the student's material.

## Interaction and accessibility

Meaning must survive changes in device, theme, language, and input method. A selected state needs more than color. Important controls need clear names, visible focus, and predictable positions. Pointer movement should have a keyboard path. Motion should clarify transitions and respect reduced-motion preferences.

Responsive design should preserve the relationship between work surfaces. On a wide screen, related tools can sit together; on a narrow screen, stack them in the order a student needs them. Do not preserve an impressive composition by making the actual work cramped or forcing unnecessary scrolling.

The visual system should remain readable for long sessions. Contrast, type size, line length, and spacing serve comprehension before style. The current implementation expresses these choices through code; this document defines why they matter.

Product text must never render below 14px, including metadata, status labels, and controls on small screens. Every button and button-like disclosure needs an intentional visible surface, a readable label, and a clear focus state. Shared button styles are the starting point for actions; a custom control must meet the same standard.

## Using this document

Before changing a screen, identify the student's job at that moment, the information they need, and the action they should be able to take. Then ask what each visual element contributes to that job. If two destinations receive the same treatment, check whether their distinct purposes are still visible.

Keep implementation specifications in code and technical documentation. Update this document when the product's design intent or decision principles change, rather than whenever a token, component, or breakpoint changes.
