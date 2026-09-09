# Refactor for smaller, safer agent tasks

Proposed September 9, 2026, against `27fb6a67`. Planning only; implementation has not started. Refresh the inventory if HEAD changes.

## Recommendation

Do a targeted refactor, beginning with Lesson Builder. Keep the application architecture, data stores, teaching behavior, and UI intact. The objective is to let an agent solve a routine problem by reading its owner and immediate dependencies, without loading an entire feature.

Measure the code an agent needs to understand a task, not just individual file length. Moving 500 lines into a hook that still requires reading five tightly coupled files is not a success. Splitting every helper into its own file can cost more context than it saves.

Complete A–D first, then return to lesson authoring. E is useful shared-style work but needs visual verification. F–G are optional later curriculum tasks. H is optional learner cleanup. Do not turn this into a prerequisite for writing lessons.

## Evidence and priorities

Source review, not a new browser walkthrough. Working tree was clean at review start. Counts exclude generated code and data files.

| Current file | Lines | Why it matters | Task |
| --- | ---: | --- | --- |
| `web/src/app/learner.css` | 3,403 | Learner, authoring, document, responsive, and later override rules share one cascade | E |
| `web/src/lib/curriculum/topics.ts` | 2,401 | Mostly static navigation configuration; unrelated topic definitions dominate reads | F |
| `web/src/components/curriculum/curriculum-table.tsx` | 2,150 | Navigation, editing, requests, selection, bulk actions, table, and details in one component | G |
| `web/src/components/practice/practice-markdown.tsx` | 703 | Read-only rendering, parsing, DOM serialization, selection, and editable UI together | B |
| `web/src/components/learner/lesson-dashboard.tsx` | 647 | Course/module presentation, progress, and lesson rows together | H |
| `web/src/components/practice/sentence-practice-card.tsx` | 591 | Learner practice interleaved with an older optional authoring interface | B audit |
| `web/src/components/lesson-builder/lesson-document.tsx` | 572 | Document orchestration, insertion picker, sentence/table entry, and caret helpers | C |
| `web/src/lib/lesson-builder/mutations.ts` | 487 | Coherent pure transformations with tests; length alone does not justify splitting | Leave |
| `web/src/lib/lesson-builder/reducer.ts` | 406 | Domain dispatch and undo history have a clean separable boundary | D |
| `web/src/app/admin/lesson-builder/page.tsx` | 401 | Loading, autosave, commands, course placement, deletion, preview, and rendering | D |

Some callbacks occupy very long lines. Formatting those blocks for readability helps review, but does not itself reduce the amount of code a model needs to read. Do not use compressed formatting as a token strategy.

## Rules for every task

- Read root and applicable nested `AGENTS.md`. Before implementation, read only the relevant installed Next.js guide under `web/node_modules/next/dist/docs/`; preserve client/server boundaries.
- Work on one task per agent session. No concurrent writes to shared files. The order below is sequential; multiple agents are optional execution capacity, not a requirement.
- Preserve JSON Lesson Builder persistence and PostgreSQL curriculum persistence. Do not touch live lessons, seed snapshots, manifests, schema, curriculum records, IDs, or instructional text.
- Keep URLs, storage keys, API payloads, exported behavior, shortcut meanings, DOM order, focus ownership, and styling stable. Moving a component must not remount its editor on every keystroke: declare extracted components at module scope and retain keys.
- Do not add an editor framework, state library, generic command bus, broad React context, repository layer, or new dependency. Keep pure helpers free of React, browser globals at module evaluation, and server imports.
- Export narrow interfaces. Prefer explicit named imports; avoid directories full of barrel exports. Retain an existing entry point where it meaningfully protects callers, not as an endless compatibility wrapper.
- Keep types next to their owner; shared lesson data stays in `lib/lesson-builder/types.ts`. Create a feature-local contract file only for types shared across real boundaries. Do not move all types to a project-wide file.
- Aim for cohesive components/hooks of roughly 100–300 lines. This is a review prompt, not a hard cap. A focused 400-line editor can be better than six fragments that share every ref.
- Separate structural moves from behavior fixes. If a regression scenario fails before refactoring, record it and handle a fix in a separate, explicitly identified change. Do not preserve a known data-loss bug as a new expected test result or quietly rewrite its behavior during extraction.
- No commits, pushes, or deployment unless requested for the implementation session. Preserve unrelated dirty work.

The repository instructions still describe `core/supporting/reference/trash`, while current runtime types use `P1`–`P5`, `Unranked`, and `Trash`. Record this documentation discrepancy; this refactor must not rename roles, migrate data, or decide a new taxonomy.

## A — provide a short map before moving code

Create `docs/engineering/code-map.md`, at most about 100 lines. It should answer “where do I start for this task?” with current paths and stable exported symbols. Cover sentence keyboard entry, explanation formatting, save/retry, document history, preview, lesson/module movement, concept tagging, curriculum browsing, learner playback, and styling. Include the relevant test command per area.

Add one short pointer in root `AGENTS.md`. Do not duplicate the map into several instruction files or automatically load design history on every task. Link to teaching methodology for tasks that change teaching behavior. Keep historical design plans labeled as history/proposals, not a second source of current implementation truth.

Record the baseline commit, dirty files, unit/lint/build results, and browser availability in a compact execution log at `docs/engineering/refactor-progress.md`. Update this one log after each task with status, changed paths, checks, and unresolved issues; do not maintain multiple reports.

Acceptance: an agent can identify the owner and tests for the ten tasks above from one short page. The map contains existing paths, not proposed destinations.

## B — separate explanation rendering from editing

Read: `practice-markdown.tsx`, `lib/lesson-builder/markdown.ts`, and its actual importers. Use `rg` for `PracticeMarkdown`, `EditablePracticeMarkdown`, `ExplanationStep`, and `SentencePracticeCard`.

Deliver:

- Keep `components/practice/practice-markdown.tsx` as the read-only renderer and its presentation types.
- Move `EditablePracticeMarkdown` and its formatting controls into `components/lesson-builder/explanation-editor.tsx`.
- Move the existing DOM serializer into `lib/lesson-builder/serialize-explanation.ts`. It stays a browser-only function, with no browser access at import time. Keep DOM selection/formatting logic together with the editor initially.
- Move pure Markdown parsing into `lib/lesson-builder/markdown.ts` if this gives the renderer and tests one clear owner. Preserve the supported syntax and whitespace; do not replace the parser.
- Update all actual importers. Audit the older `authoring` props in `sentence-practice-card.tsx` and `explanation-step.tsx`: search runtime call sites, spreads, tests, and exports. If no caller supplies them, remove that unreachable authoring branch in a separate diff after the extraction. Never remove live `LessonDocument` authoring or learner hint behavior. Also audit `overview-markdown.tsx` and `language-block-callout.tsx` before deleting either; names alone are insufficient evidence.

Validation: add small, fixed fixtures for existing paragraphs, line breaks, bold, italic, bilingual marks, and empty explanations. Verify rendered output before/after; do not assert implementation source strings. Serializer/selection changes require the browser checks below. Record any pre-existing formatting/undo failures separately.

Acceptance: a lesson explanation editing task can start in its editor without reading the learner renderer; learner playback no longer imports an unused editing interface. If an older authoring caller is found, preserve it and document that boundary.

## C — extract the actual writing surfaces

Read: `lesson-document.tsx`, `lesson-library.tsx`, `focus.ts`, `use-focus-context.ts`, and the B outputs.

Deliver under `components/lesson-builder/`:

- `sentence-editor.tsx`: the current sentence/table editor, its field refs, draft/composition state, and pair actions. Keep sentence and vocabulary entry together because they share the same model and Tab flow.
- `slide-insert-control.tsx`: the current chooser and its arrow/letter navigation. Document orchestration retains the insertion target and origin.
- `keyboard-help.tsx`: help dialog and its keyboard map from the library. The HUD stays in its existing file.
- `lesson-document.tsx`: compose slides, own slide order/insertion, and bind lesson/slide IDs to callbacks. Keep simple drag rendering local if it does not have another owner.

Do not simultaneously introduce a shortcut registry or reconcile different caret algorithms. Extract the existing caret-origin functions into the existing `focus.ts` only if their contract can be stated without moving unrelated editor internals there.

Keep prop types local unless genuinely shared. Avoid multiplying the page→library→document callback list across each new component: pass the minimal callbacks that a surface already consumes. Do not replace explicit callbacks with a bag of all application state.

Acceptance: changing Spanish/English Tab behavior normally requires the sentence editor and its relevant tests; changing the chooser requires its component and document integration. Creating, canceling, moving, and deleting content retains IDs, focus, selection, and sequence.

## D — separate persistence and history from page composition

Read: builder `page.tsx`, `reducer.ts`, `mutations.ts` by needed symbol, `types.ts`, and API routes only to confirm request contracts. This is the highest-risk task; do it after B–C and in two checkpoints.

**D1: persistence.** Extract `lib/lesson-builder/use-lesson-persistence.ts`. This hook owns initial loading, acknowledged snapshots, request sequencing, dirty status, save/retry, and unload protection. Preserve existing serialization order, timings, and error handling. Route lesson deletion through the same persistence owner; do not leave a second independent network writer in the page. Keep the existing server-side file mutation queue and API implementation unchanged.

Give the hook an explicit input/output contract: current course draft and initial-load callback in; load/save status, initial concept displays, save/retry and lesson-delete operations out. Acknowledgements may update saved snapshots, never overwrite a newer current draft. If preserving that contract exposes an existing ordering defect, isolate its correction before continuing the extraction. Do not move everything into one large controller hook.

**D2: history and preview.** Move undo wrapper types/coalescing/limits to `lib/lesson-builder/history.ts`; leave domain dispatch in `reducer.ts` and pure mutations in `mutations.ts`. Extract preview origin/open/close state into `lib/lesson-builder/use-lesson-preview.ts`, preserving current focus behavior. Keep course state and command orchestration visibly owned by the page unless a further boundary is demonstrated.

Do not add a third copy of course state, expose mutable save refs to presentation components, or create a cyclic page↔hook dependency. Preserve existing public callbacks or deliberately update each caller in this task.

Validation: history fixture tests; controlled deferred fetch responses covering edits to two lessons, edits during save, failure/retry, and deletion with a pending save. Use a small injected transport seam if necessary to test ordering; no new general HTTP framework. Browser checks must cover trailing field save and preview return. Existing unit tests alone do not exercise DOM undo or autosave timing.

Acceptance: a save issue starts in persistence; an undo grouping issue starts in history; JSX layout changes do not require reading fetch sequencing. A page over 200 lines is acceptable if the remaining lines coherently bind commands to views.

## E — split styles without changing the cascade

Read: `app/learner.css`, its imports in `app/layout.tsx`, and class-name consumers found with `rg`. CSS changes can affect both authoring and playback.

First move contiguous, semantically meaningful ranges into `web/src/styles/`: learner foundations/home, practice base, authoring base, lesson library/document, and later practice/responsive overrides. Choose exact boundaries after inspecting full rules; do not cut through a media block. Import these files directly from root layout in the exact original order, after `globals.css`. Preserve the current direct-import hot-reload behavior.

This first extraction must preserve selector/declaration/media order exactly. A small mechanically verified concatenation comparison against the original stylesheet is sufficient for the move itself. Do not regroup interleaved rules by prefix, add cascade layers, convert to CSS modules, or deduplicate overrides in the same patch. Some later practice rules intentionally affect the authoring canvas.

Then remove only proven unreachable styles from B's deleted UI in a separate diff. Record runtime selector searches, including dynamic class construction. Do not treat repeated selectors as automatically redundant. Leave override consolidation for a later task if browser evidence is unavailable.

Acceptance: unchanged computed styles/screenshots for course home, builder at rest/focus/open menu, explanation, sentence, table, hints, completion, and relevant responsive layouts. Confirm hot reload after changing an extracted rule. A visual pass is required before calling this complete.

## F — partition static curriculum navigation, later

Keep `lib/curriculum/topics.ts` as the stable ordered assembly and `findCurriculumTopic` entry point. Move `CurriculumTopic` into `lib/curriculum/topic-types.ts`. Add a `topic-definitions/` directory with one named configuration per existing top-level topic slug, using type-only imports; the assembly imports those explicitly in their existing order.

These are navigation definitions, not a second curriculum catalog. Preserve every slug, label, facet, exclusion, and ordering value. Do not extract individual facet rows into files or introduce runtime discovery/code generation. Leave `collections.ts` alone unless there is a separate concrete task.

Validation: serialize the ordered configuration before and after in an isolated temporary location and compare exact data; run `curriculum-navigation.test.ts` and topic presentation tests. No database writes or snapshot exports.

Acceptance: changing one topic's display configuration requires one definition and, only when needed, its shared type/assembly.

## G — break up the curriculum table, later

Read `curriculum-table.tsx` by responsibility, its route props, and `lib/curriculum/navigation.ts`. Execute G1 and G2 as separate sessions.

- **G1, presentation:** extract `curriculum-browse-panel.tsx` from `renderBrowsePanel`; extract the details surface into `curriculum-concept-details.tsx`; extract editable cell/collection controls together into `curriculum-row-editor.tsx`. Keep state/requests in `CurriculumTable` for this move. Preserve focus refs, mobile/desktop behavior, and selection IDs.
- **G2, state boundaries:** extract URL/query navigation into `use-curriculum-navigation.ts` and mutation/error/pending state into `use-curriculum-editing.ts`, colocated with curriculum UI. Navigation owns URL changes; editing owns concept draft/acknowledgement and selection/bulk operations. The table composes them and renders rows. Pass narrow callbacks to the G1 components; do not spread the full hook result everywhere.

Keep existing endpoint contracts and deletion restrictions intact. Test edits and bulk actions using mocked requests or explicitly isolated disposable data, never owner curriculum records. No changes to curation policy are authorized by this refactor.

Acceptance: a filter bug, a cell-edit bug, and a details-layout change each have a clear different starting file. Test back/forward navigation, pagination/filter selection, save failure, bulk-action eligibility, and dialog focus.

## H — learner presentation, only when needed

Extract the already separate `ConceptPills` and `LessonRow` from `lesson-dashboard.tsx` into cohesive learner presentation files, plus module navigation only if it forms a clear prop boundary. Keep progress in its established `lib/learner/progress.ts` owner. Leave `lesson-selector.tsx` as the session owner unless an actual task needs further extraction.

Acceptance: existing `learner-surfaces.test.ts` and progress tests pass, lesson destinations and empty states remain identical, and public rendering does not acquire admin imports. Avoid a blanket split of all 400-line components.

## Verification and stopping rules

At A, run `npm run test:unit`, `npm run lint`, and `npm run build` from `web` to establish the current baseline. The preceding session reported 71 passing unit tests and two unrelated lint warnings; recheck rather than assuming those results still hold.

For each implementation task, run relevant tests during iteration, then unit suite, lint, build, and `git diff --check` at handoff. Keep useful existing test entry points; split tests by responsibility only when necessary. Never alter expectations solely to make an extraction pass.

For B–E, use isolated lesson fixtures and the browser: title→explanation→sentence→table; forward/reverse Tab; accented input, paste and composition; insertion/cancel; bold/italic/language selection; text/document undo; delete→edit elsewhere→restore; save→reload; preview→return; lesson/module movement. Exercise two open lessons. Record pre-existing failures separately from extraction regressions.

The live lesson store resolves `data/lessons.json` from the process working directory. Do not casually test against the owner's running dev server or replace the whole live file with fixtures. Use a separate checkout/process with its own lesson file and isolated or mocked curriculum access. Do not introduce new production persistence configuration just to support this refactor.

If browser access is unavailable, record the limitation and keep browser-dependent completion gates open. Do not report passing compilation as proof that focus, undo, composition, or CSS is unchanged.

After each task, update the code map with actual paths and record the smallest read set for its common maintenance task. Target roughly 2–4 relevant source files for routine localized work, not a mandatory limit. Report whether the task actually reduced unrelated context. Do not promise a percentage token saving without measurement.

Stop splitting when files have clear owners, common edits stay local, and further extraction adds indirection. Leave generated Prisma code, JSON data, archived curation manifests, and historical documentation outside this exercise.

## Copyable Sonnet assignment

> Implement task A only from `docs/design/agent-friendly-refactor.md`. Read its rules and verification requirements. Create the small current code map and baseline execution log, and add the single AGENTS.md pointer. Do not implement B–H or change application behavior/data. Report the files changed, checks, and any baseline failures briefly. Do not commit or publish.

For later sessions, replace “A” with exactly one task/checkpoint ID (`B`, `C`, `D1`, `D2`, `E`, `F`, `G1`, `G2`, or `H`). Read the current code map, the chosen task, and shared rules; do not reread unrelated implementation files or prior conversation transcripts. A future task described here is not permission to expand the current assignment.
