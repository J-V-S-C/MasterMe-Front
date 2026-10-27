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

The four destinations belong to the same environment, but each has a different intellectual job. Shared navigation and control behavior should make the system familiar. The main work area should express what is special about that destination.

### Study: examine an idea

The center of Study is the student's source, a question, their explanation, and a grounded response. It should feel focused and private enough for an imperfect first attempt. The answer area deserves space and calm. The diagnosis should separate what the student established from what remains uncertain. A recommendation should name the concept and explain why it follows.

Keep the question readable on its own. Offer a short, source-grounded concept explanation behind an explicit control beside the question, with a separate control for reading the original source. Open a new question with the explanation closed so the student chooses when to use help.
For uploaded PDFs, show the original pages in a book reader that uses the available Study width, with little space around the page and clear page controls. Clicking the left or right edge of a page turns it; the labeled controls and arrow keys remain available. Mark the studied passage only when it can be matched to text on a page; otherwise say that its location is uncertain and let the student browse. Do not repeat the selected PDF passage as raw text below the page. Source disclosure, page navigation, and other secondary actions need a visible control surface, readable label, and clear focus state; they should never resemble unstyled text. For text and Markdown, keep readable prose with its editorial section and page when known, and mark the selected passage within that prose instead of duplicating it above. Selecting a concept opens its question directly. Keep saved explanations accessible and make a new attempt after approval an explicit confirmed choice that preserves the original result.

Put the material and concept controls before the question without repeating the selected material in a large page banner. After an answer is evaluated, bring the diagnosis into view and move keyboard focus to it so the student can read the result without searching below the answer.

When there is no material, the act of adding one is the main event. A concise introduction can orient the student, but it should not compete with the form or repeat its instructions.

### Tasks: make an intention concrete

Tasks turns attention into a plan. Dates, times, durations, priorities, and status should be easy to scan and change. The calendar and board are two views of the same intentions; changes in one should make sense in the other. Movement should feel physical enough to understand, while remaining available through keyboard and form controls.

The task itself should carry the student's words and timing. Avoid repeating status in every card when its location already says it. Avoid expanding controls so far that the plan disappears below the fold.

### Analyze: reveal structure

Analyze makes concepts, relationships, evidence, and gaps visible. Its visual language can be richer because a map can carry real information. Connections should explain how ideas relate, not simply make the page appear sophisticated. The student must be able to inspect a connection and understand its basis. The map should be navigable, with a readable alternative when it becomes dense.

An empty Analyze screen can preview the *kind* of structure that will appear: source material yielding concepts, relationships, and diagnosis. That preview must be labeled as an explanation of the process, never mistaken for the student's actual map. Meaningful connections matter more than a decorative row of shapes.

### Create: apply understanding

Create turns a chosen difficulty into a small, actionable project. Its central decision is focus: what concept is worth applying now, and why? The student should understand the proposed focus before asking for a generated result. The result should read like a usable brief, with a goal, deliverables, constraints, and a first step.

An empty Create screen can show the structure of that brief. It should look and read differently from Analyze's relationship map. The preview explains what a project will contain, without pretending that a project has already been generated.

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

## Using this document

Before changing a screen, identify the student's job at that moment, the information they need, and the action they should be able to take. Then ask what each visual element contributes to that job. If two destinations receive the same treatment, check whether their distinct purposes are still visible.

Keep implementation specifications in code and technical documentation. Update this document when the product's design intent or decision principles change, rather than whenever a token, component, or breakpoint changes.
