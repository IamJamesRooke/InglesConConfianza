# Refactor progress

Execution log for completed checkpoints in `docs/design/agent-friendly-refactor.md`.

| Field | Baseline / task A result |
| --- | --- |
| Baseline commit | `27fb6a6748c06174c119dc4f62c165cdf8aab961` |
| Date | 2026-09-09 |
| Dirty files at start | `docs/design/agent-friendly-refactor.md` (pre-existing, untracked) |
| Browser availability | No browser or browser tab surfaces available in the session; browser checks remain unavailable. |
| Status | Complete: code map, execution log, and root pointer added. Application behavior and data were not changed. |
| Changed paths | `AGENTS.md`, `docs/engineering/code-map.md`, `docs/engineering/refactor-progress.md` |
| Unit tests | `npm run test:unit` — pass, 71 tests / 0 failures |
| Lint | `npm run lint` — exit 0; 2 pre-existing warnings in `scripts/curriculum-inventory.ts:69` and `scripts/gen-theme-manifest.ts:120` |
| Production build | `npm run build` — pass |
| Diff check | `git diff --check` — pass |
| Unresolved issues | Browser-dependent verification was not possible; no baseline test, lint error, or build failure. |

## Task B — explanation rendering and editing

| Field | Result |
| --- | --- |
| Status | Complete: rendering, editing, and DOM serialization have distinct owners. |
| Changed paths | `web/src/components/practice/practice-markdown.tsx`, `web/src/components/lesson-builder/explanation-editor.tsx`, `web/src/lib/lesson-builder/markdown.ts`, `web/src/lib/lesson-builder/serialize-explanation.ts`, `web/src/components/practice/explanation-step.tsx`, `web/src/components/practice/sentence-practice-card.tsx`, `web/src/components/lesson-builder/lesson-document.tsx`, `web/tests/unit/learner-surfaces.test.ts`, `docs/engineering/code-map.md` |
| Context outcome | Explanation editing now starts with the editor and serializer; learner playback starts with the read-only renderer. |
| Authoring audit | Runtime searches found no `authoring` prop, spread, test, or export consumer for `ExplanationStep` or `SentencePracticeCard`; their unreachable authoring branches were removed. `OverviewMarkdown` and `LanguageBlockCallout` have no importers but were retained because no deletion was required by this task. |
| Browser gates | Browser surfaces remain unavailable. Selection, focus, composition, DOM undo, serializer interaction, learner hints, and two-lesson workflow require a later browser pass. |
| Focused unit tests | `npm run test:unit -- tests/unit/learner-surfaces.test.ts` — pass, 73 tests / 0 failures. |
| Unit tests | `npm run test:unit` — pass, 73 tests / 0 failures. |
| Lint | `npm run lint` — exit 0; unchanged warnings in `scripts/curriculum-inventory.ts:69` and `scripts/gen-theme-manifest.ts:120`. |
| Production build | `npm run build` — pass. |
| Diff check | `git diff --check` — pass. |

## Task C — writing surfaces

| Field | Result |
| --- | --- |
| Status | Complete: the sentence/vocabulary editor, slide chooser, and keyboard help each have focused component owners. |
| Changed paths | `web/src/components/lesson-builder/lesson-document.tsx`, `lesson-library.tsx`, `sentence-editor.tsx`, `slide-insert-control.tsx`, `keyboard-help.tsx`, `docs/engineering/code-map.md`, `docs/engineering/refactor-progress.md` |
| Context outcome | Spanish/English Tab flow, field refs, draft/composition state, and pair actions start in `sentence-editor.tsx`; chooser navigation starts in `slide-insert-control.tsx`; help content starts in `keyboard-help.tsx`. `LessonDocument` retains slide order, insertion target/origin, ID binding, and local drag rendering. |
| Caret helpers | Retained in `lesson-document.tsx`: their origin capture/restore contract is specific to document orchestration and was not broadened into `focus.ts`. |
| Browser gates | Browser surfaces remain unavailable. Title-to-writing, forward/reverse Tab, accented input/paste/composition, chooser insertion/cancel, focus/selection, drag, delete/restore, and two-lesson workflows require a later browser pass. |
| Focused unit tests | `npm run test:unit -- tests/unit/lesson-builder-logic.test.ts tests/unit/lesson-mutations.test.ts` — pass, 73 tests / 0 failures. |
| Unit tests | `npm run test:unit` — pass, 73 tests / 0 failures. |
| Lint | `npm run lint` — exit 0; unchanged warnings in `scripts/curriculum-inventory.ts:69` and `scripts/gen-theme-manifest.ts:120`. |
| Production build | `npm run build` — pass. |
| Diff check | `git diff --check` — pass. |

## Task D1 — persistence

| Field | Result |
| --- | --- |
| Status | Complete: Lesson Builder loading, acknowledgement snapshots, dirty state, autosave/manual save/retry, request sequencing, unload protection, and lesson deletion have one hook owner. |
| Changed paths | `web/src/lib/lesson-builder/use-lesson-persistence.ts`, `web/src/app/admin/lesson-builder/page.tsx`, `web/src/lib/lesson-builder/types.ts`, `web/src/components/lesson-builder/lesson-concepts-field.tsx`, `web/tests/unit/lesson-persistence.test.ts`, `docs/engineering/code-map.md`, `docs/engineering/refactor-progress.md` |
| Hook contract | Current `{ lessons, modules }` draft and an initial-load callback in; save state, dirty state, initial concept displays, save/retry, and queued lesson deletion out. Acknowledgements retain serialized request snapshots and never replace the current draft. |
| Context outcome | Save and deletion issues now start in `use-lesson-persistence.ts` and its focused tests. The page keeps the authoritative course state and command/view composition; it has no independent persistence fetch. |
| Isolated behavior fix | Pre-existing ordering defect corrected: deleting a newly created lesson during its pending first save could skip DELETE before acknowledgement, allowing the pending PUT to recreate it. Deletion now shares the request queue, checks acknowledgement when its turn begins, and later saves omit a pending deletion. No API route or server mutation-queue behavior changed. |
| Focused tests | `node --import tsx --test tests/unit/lesson-persistence.test.ts` — pass; all four controlled deferred-request scenarios passed. |
| Unit tests | `npm run test:unit` — pass, 77 tests / 0 failures. |
| Lint | `npm run lint` — exit 0; unchanged warnings in `scripts/curriculum-inventory.ts:69` and `scripts/gen-theme-manifest.ts:120`. |
| Production build | `npm run build` — pass. |
| Diff check | `git diff --check` — pass. |
| Browser gates | Browser surfaces remain unavailable. Trailing-field save/reload and the wider two-open-lesson browser workflow remain open; compilation and controlled request tests do not close those gates. |
| Documentation discrepancy | Root repository guidance still names `core` / `supporting` / `reference` / `trash`, while runtime curriculum types use `P1`–`P5`, `Unranked`, and `Trash`. D1 did not change curriculum roles or data. |

## Task D2 — history and preview

| Field | Result |
| --- | --- |
| Status | Complete in code: undo history and Lesson Builder preview state now have separate owners. The browser-dependent preview-return gate remains open. |
| Changed paths | `web/src/lib/lesson-builder/history.ts`, `web/src/lib/lesson-builder/reducer.ts`, `web/src/lib/lesson-builder/use-lesson-preview.ts`, `web/src/app/admin/lesson-builder/page.tsx`, `web/tests/unit/lesson-history.test.ts`, `web/tests/unit/lesson-preview.test.ts`, `web/tests/unit/lesson-mutations.test.ts`, `docs/engineering/code-map.md`, `docs/engineering/refactor-progress.md` |
| Boundaries | `history.ts` owns undo wrapper types, coalescing keys, the 100-step limit, and undo/redo transitions. `reducer.ts` retains domain action dispatch, and `mutations.ts` retains pure transforms. `use-lesson-preview.ts` owns preview origin capture, open/close state, learner preview shape, and deferred focus/selection/scroll restoration. Course state and command orchestration remain in the page. |
| Context outcome | Undo grouping work starts in `history.ts` and its fixture tests; preview return work starts in `use-lesson-preview.ts`. Page layout work no longer requires reading either implementation, while domain actions and course commands remain visible at their existing owners. No controller hook, extra course-state copy, cyclic dependency, route change, or API change was introduced. |
| Focused tests | `node --import tsx --test tests/unit/lesson-history.test.ts tests/unit/lesson-preview.test.ts tests/unit/lesson-mutations.test.ts` — pass. History fixtures cover structural undo/redo, field grouping boundaries, redo invalidation, load reset, and the 100-snapshot limit. Preview fixtures cover lesson numbering/shape and input/range/detached-element restoration through an injected browser seam. |
| Unit tests | `npm run test:unit` — pass, 85 tests / 0 failures. |
| Lint | `npm run lint` — exit 0; unchanged warnings in `scripts/curriculum-inventory.ts:69` and `scripts/gen-theme-manifest.ts:120`. |
| Production build | `npm run build` — pass. |
| Diff check | `git diff --check` — pass. |
| Browser gate | Browser surfaces remain unavailable. Preview close must still be verified in a browser to confirm the overlay unmounts before the animation-frame return, the prior scroll position returns, and focus plus input or contenteditable selection returns to the originating field. Compilation and the injected-platform tests do not close this DOM gate. |
| Preserved behavior | Public routes, command meanings, callbacks, lesson numbering and preview shape, focus/scroll/selection logic, coalescing keys, and the 100-step history limit remain unchanged. |

## Task E — stylesheet extraction

| Field | Result |
| --- | --- |
| Status | Implemented mechanically. Visual and hot-reload acceptance gates remain OPEN because browser surfaces are unavailable. |
| Changed paths | `web/src/app/layout.tsx`, deleted `web/src/app/learner.css`, `web/src/styles/learner-foundations-home.css`, `practice-base.css`, `authoring-base.css`, `lesson-library-document.css`, `practice-responsive-overrides.css`, `docs/engineering/code-map.md`, `docs/engineering/refactor-progress.md` |
| Import and source order | After `globals.css`, root layout imports `learner-foundations-home.css` (original lines 1–974), `practice-base.css` (975–1033), `authoring-base.css` (1034–1727), `lesson-library-document.css` (1728–2729), then `practice-responsive-overrides.css` (2730–3403). No range cuts through a media block. |
| Mechanical comparison | Copied the pre-extraction stylesheet to `/tmp/learner.css.before-task-e`; concatenated the five extracted files in root-layout import order and ran `cmp -s` against that copy. Exit 0 and both SHA-256 values were `6d5b21ccfb98237c9f97b49725f68a5f8f3722a77f940145a6f5adb597316ac6`; there was no boundary-newline normalization. |
| Selector audit | Searched `web/src` for learner, practice, authoring, lesson-library, document, and answer selectors, plus dynamic construction patterns (`className` template literals, concatenation, `clsx`, and `cn`). Existing dynamic classes remain in place. No B-dead-style removal or selector consolidation was made. |
| Focused tests | `npm run test:unit -- tests/unit/learner-surfaces.test.ts tests/unit/lesson-history.test.ts tests/unit/lesson-preview.test.ts` — pass, 85 tests / 0 failures (the configured unit command also includes the full unit glob). |
| Unit tests | `npm run test:unit` — pass, 85 tests / 0 failures. |
| Lint | `npm run lint` — exit 0; unchanged warnings in `scripts/curriculum-inventory.ts:69` and `scripts/gen-theme-manifest.ts:120`. |
| Production build | `npm run build` — pass. |
| Diff check | `git diff --check` — pass. |
| Open gates | A browser pass must confirm unchanged computed styles/screenshots for course home, builder at rest/focus/open menu, explanation, sentence, table, hints, completion, and responsive layouts. It must also confirm direct-import hot reload after editing an extracted rule. |

## Task F — static curriculum navigation partition

| Field | Result |
| --- | --- |
| Status | Complete: static topic definitions have focused owners while `topics.ts` remains the explicit ordered assembly and `findCurriculumTopic` entry point. |
| Changed paths | `web/src/lib/curriculum/topics.ts`, `web/src/lib/curriculum/topic-types.ts`, `web/src/lib/curriculum/topic-definitions/*.ts`, `web/src/lib/curriculum/navigation.ts`, `docs/engineering/code-map.md`, `docs/engineering/refactor-progress.md` |
| Data preservation | Serialized ordered configuration from committed `HEAD` and current code compared exactly: 105,114 bytes each; SHA-256 `fd4368a9c9e938495d382450671c37862c742ee1d7c49d0e6a8b7999d434484e` for both; 23 slugs preserved in existing order. |
| Context outcome | A topic display change starts in its one named definition; shared topic shape is in `topic-types.ts`; no facet files, runtime discovery, collections changes, database work, snapshot exports, or catalog changes were introduced. |
| Browser gates | No browser surface was available or needed for this static navigation move. |

## Task G1 — attempt 1 backed out

| Field | Result |
| --- | --- |
| Status | A prior session (Codex) began G1 but stopped mid-edit with credits exhausted. `curriculum-table.tsx` was left syntactically broken (a function body spliced into the import block; dangling `}, {});`), and the build/lint failed. |
| Recovery | `curriculum-table.tsx` restored with `git checkout`; the three partial new files (`curriculum-browse-panel.tsx`, `curriculum-concept-details.tsx`, `curriculum-row-editor.tsx`) moved to a scratch dir for reference. Tasks A–F were unaffected. |
| Post-recovery checks | `npm run test:unit` — 85 pass / 0 fail. `npm run lint` — 0 errors, 2 pre-existing warnings. `npm run build` — pass. |
| Next | Reimplement G1 fresh from `docs/design/agent-friendly-refactor.md`. |

## Task G1 — curriculum table presentation

| Field | Result |
| --- | --- |
| Status | Complete: browse panel, concept details drawer, and editable cell/collection controls each have focused component owners. State, requests, URL navigation, focus refs, and effects stay in `CurriculumTable`. |
| Changed paths | `web/src/components/curriculum/curriculum-table.tsx` (2151 → 1504 lines), new `web/src/components/curriculum/curriculum-row-editor.tsx`, `curriculum-browse-panel.tsx`, `curriculum-concept-details.tsx`, `docs/engineering/code-map.md`, `docs/engineering/refactor-progress.md` |
| Boundaries | `curriculum-row-editor.tsx` owns the shared `EditableField`/`ActiveEditor`/`ActiveCollectionEditor` types, `curriculumRoles`, `getRoleLabel`, `renderConceptPattern`, `getEditableValue`/`updateEditableValue`, and the presentational `EditableCell` and `CollectionEditor` components. `curriculum-browse-panel.tsx` owns the topic/family/collection picker (`renderBrowsePanel`); it derives its own family/leaf view state from props and calls back with the minimal `onSelectTopic`/`onSelectFamily`/`onSelectLeaf`/`onCloseMobileBrowser`. `curriculum-concept-details.tsx` owns the detail drawer markup, save-feedback banner, grouped-collections view, and role/trash actions; the parent still holds `detailPanelRef`, focus-trap effects, and every fetch. |
| Behavior preserved | Exact class names, ARIA labels, `role-select` classes, localStorage keys, focus refs (`detailPanelRef`, `mobileBrowseRef`, `mobileBrowseOpenerRef`), mobile vs. desktop rendering, selection IDs, prev/next concept stepping, `router.push`/`router.refresh` sequencing, and the `/api/admin/curriculum/concepts/:id` PATCH/DELETE contracts. `CurriculumTable`'s public props are unchanged, so `src/app/admin/curriculum/page.tsx` needed no edit. |
| Dead code dropped | The unreachable chip-display branch of the former `renderCollections` (only its editing branch was ever rendered, from the detail drawer) was not carried over. This is a rendering no-op. |
| Unit tests | `npm run test:unit` — pass, 85 tests / 0 failures. Targeted `curriculum-navigation.test.ts` + `topic-presentation.test.ts` also pass. |
| Type check | `npx tsc --noEmit` — clean. |
| Lint | `npm run lint` — exit 0; unchanged warnings in `scripts/curriculum-inventory.ts:69` and `scripts/gen-theme-manifest.ts:120`. |
| Production build | `npm run build` — pass. |
| Diff check | `git diff --check` — pass. |
| Browser gates | Browser surfaces unavailable. A later browser pass must still confirm: back/forward navigation restoring the search value and scope, pagination and filter selection, cell-edit save + save-failure banner, bulk-action eligibility (Trash vs. move), and focus trapping / return in both the concept drawer and the mobile browse dialog. |

## Task G2 — curriculum table state boundaries

| Field | Result |
| --- | --- |
| Status | Complete: URL navigation and concept editing/selection each have a colocated hook owner; `CurriculumTable` composes them and renders. |
| Changed paths | new `web/src/components/curriculum/use-curriculum-navigation.ts`, `use-curriculum-editing.ts`; `web/src/components/curriculum/curriculum-table.tsx` (1504 → 1108 lines); `docs/engineering/code-map.md`, `docs/engineering/refactor-progress.md` |
| `use-curriculum-navigation.ts` | Owns `useRouter`/`usePathname`/`useSearchParams`/`useTransition`. Exposes `isNavigating`, `navigate(updates, resetPage?)` (the sole URL writer — `null`/`""`/`"all"` clears a param, `resetPage` drops `page`, push wrapped in the transition), and the pure scope helpers `selectTopic`/`selectFamily`/`selectLeaf`. Holds no table state, refreshes nothing. |
| `use-curriculum-editing.ts` | Owns the editable `concepts` copy, `activeEditor`, `activeCollectionEditor`, `pendingConceptId`, `selectedIds`, `bulkDeleting`, `error`, and the transient `saveFeedback` banner (+ its dismiss timer). Owns every `/api/admin/curriculum/concepts/:id` call: inline field save, collection save, single delete, single/bulk role change, bulk delete, bulk move-to-Trash — each ending in `router.refresh()` exactly as before. Re-syncs `concepts` from `initialConcepts` and clears `selectedIds` on `resultKey`. Does not touch the URL. |
| Stayed in `CurriculumTable` | View state (`mappingSearch`, `sidebarOpen`, `mobileTopicsOpen`, `showExamples`, `detailConceptId`), all focus refs and focus-trap / body-scroll effects, the detail-drawer open/close + opener-focus-return, `resultKey` → close drawer + scroll-to-top, back/forward → restore `mappingSearch`, `clearFilters`, `sortButton`, breadcrumb wiring, and the `selectLeaf` wrapper that also closes the mobile browser. |
| Behavior preserved | Endpoint URLs and PATCH/DELETE payloads unchanged (URL building pulled into one local `conceptUrl` helper, same string). Request ordering, optimistic `setConcepts` updates, acknowledgement guards, `router.refresh()` placement, save-feedback timing (1800 ms), bulk `Promise.allSettled` + partial-failure messages, and selection semantics all identical. `CurriculumTable` public props unchanged — `src/app/admin/curriculum/page.tsx` untouched. No new dependency, context, command bus, or cyclic hook↔page reference. |
| Lint note | The detail-key `useEffect` now lists the two stable hook setters in its dep array (they are referentially stable `useState` setters, so no behavior change) to satisfy `react-hooks/exhaustive-deps`. |
| Unit tests | `npm run test:unit` — pass, 85 / 0. Targeted `curriculum-navigation.test.ts` + `topic-presentation.test.ts` pass. |
| Type check | `npx tsc --noEmit` — clean. |
| Lint | `npm run lint` — exit 0; only the two unrelated pre-existing script warnings. |
| Production build | `npm run build` — pass. |
| Diff check | `git diff --check` — pass. |
| Browser gates | Unchanged from G1 — a browser pass must still exercise back/forward, pagination/filter selection, cell-edit save + failure banner, bulk-action eligibility, and dialog focus. Compilation and the existing unit suite do not cover fetch ordering or focus. |

## Task H — learner presentation

| Field | Result |
| --- | --- |
| Status | Complete: the two already-separate presentation pieces of `lesson-dashboard.tsx` have their own files; module navigation stayed in the dashboard (no clean prop boundary). |
| Changed paths | new `web/src/components/learner/types.ts`, `concept-pills.tsx`, `lesson-row.tsx`; `web/src/components/learner/lesson-dashboard.tsx` (647 → 501 lines); `docs/engineering/code-map.md`, `docs/engineering/refactor-progress.md` |
| Boundaries | `types.ts` holds the shared `LearnerConcept` / `LearnerLesson` / `LearnerModule` shapes (a real boundary now that three files use them; the `src/app/page.tsx` server component still builds them structurally). `concept-pills.tsx` is `ConceptPills` (verbatim). `lesson-row.tsx` is `LessonRow` (verbatim), importing `ConceptPills`, `lessonMinutes`, and the `LessonProgressEntry` type. The dashboard keeps course/module presentation, progress derivation, the reset-confirmation dialog, `moduleLabel`, `selectModule`, and the module-button ref. |
| Behavior preserved | No JSX, class name, `lang` attribute, icon, link target (`/practice?lesson=<id>`), or empty-state text changed. `LessonDashboard`'s props and export are unchanged; `src/app/page.tsx` untouched. Presentation files import only from `@/components/learner/*`, `@/lib/learner/*`, `next`, and `lucide-react` — no admin imports. Progress ownership stays in `@/lib/learner/progress`. |
| Unit tests | `npm run test:unit` — pass, 85 / 0 (`learner-surfaces.test.ts` renders `LessonDashboard` end to end, so it exercises both extracted children). |
| Type check | `npx tsc --noEmit` — clean. |
| Lint | `npm run lint` — exit 0; only the two unrelated pre-existing script warnings. |
| Production build | `npm run build` — pass. |
| Diff check | `git diff --check` — pass. |
| Browser gates | None required — this is a pure structural move of server-renderable presentation with full unit coverage. |

## Refactor status after this session

A, B, C, D1, D2, E, F, G1, G2, H are all complete in code and green (`test:unit` 85/0, `lint` 0 errors, `build` pass, `git diff --check` clean). Nothing committed.

## Browser verification pass — 2026-09-09

Run against an **isolated** copy: `rsync` of the working tree to `/data/icc-verify` (deep-copied `node_modules`), its own throwaway Postgres on `:5433` (`prisma migrate deploy` + `db seed` → 4250 concepts), its own `data/lessons.json`, `next dev` on `:3100`. Driven with headless Chromium over the CDP protocol (a small zero-dependency Node script using the built-in `WebSocket`). The owner's real checkout, database, and dev server were never touched. Environment fully torn down afterward; reference screenshots kept in `/tmp/icc-verify-shots/`.

**42 checks passed, 0 app failures** (one check hit a test-harness key-event bug — synthetic `char` events double-typed — not an application defect; its reload assertion still confirmed the underlying behavior).

| Area | Verified in-browser |
| --- | --- |
| E — styles | Course home, dashboard, curriculum table, concept drawer, lesson builder, learner preview all render with the split stylesheets fully applied (fonts, colours, layout, `role-*` classes, `[[es:]]`/`[[en:]]` marks as styled spans). Editing a rule in `web/src/styles/authoring-base.css` hot-reloads (outline colour changed then reverted live). |
| B — explanation | Bilingual marks render as `<span lang>` (no literal `[[es:]]`). A gentle trailing edit → autosave kept **all 20** `[[es:]]`/`[[en:]]` marks in `lessons.json`; after save+reload they still render as spans. (A deliberately destructive full-content replace correctly serialized to plain `**bold**` — the serializer emits what the DOM holds; not a regression.) |
| C / D1 — lesson builder | Sentence-piece edit → "All changes saved" → written to the isolated `lessons.json` → survives reload → restores cleanly. Explanation contenteditable edit autosaves the same way. Blocked `/api/admin/lesson-builder/*` → "Unsaved changes" surfaced, local edit retained, recovers and writes clean once unblocked. |
| D2 — preview & history | "Try lesson" opens the real learner player overlay (step 1/10, explanation card, nav); Escape closes it; page scroll position restored (400 → 400). |
| G1 — components | Curriculum table renders 100 rows + browse panel + filters + pagination. Concept drawer opens, receives focus, Escape closes it and returns focus to the "View details" opener. Mobile (500px) browse dialog opens, traps focus, Escape closes. |
| G2 — state hooks | Search navigates (URL carries `search=`); back/forward restores the submitted search value into the input. Cell edit saves against the isolated DB and **persists across reload**; role change persists across reload. Bulk bar shows "Move N to Trash" when the role filter ≠ Trash and "Delete N selected" when it = Trash. Blocked `/api/admin/curriculum/concepts/*` → "Unable to save the concept." alert, edit retained in the open input, **nothing written** (value unchanged after reload). |
| H — learner | Dashboard renders lesson rows + concept pills; every lesson link is `/practice?lesson=<id>`; empty/unavailable states intact. |

**Remaining open:** none blocking. Not exercised in this pass (low risk, all covered by unit tests + the render checks above): full lesson create/delete lifecycle, module reordering, structural (non-text) undo grouping, and a pixel-diff of every responsive breakpoint. A human spot-check of the live app before shipping is still worthwhile but no gate is left failing.

## Committed

2026-09-09 — tasks A–H, the code map, this log, and the `AGENTS.md` pointer committed to `master` and pushed in one commit ("Refactor into smaller, agent-scoped units (A–H)"). The pre-existing uncommitted `web/data/lessons.json` content edit (a lesson swapped for "I need to go to the store.") and the earlier B/C practice-surface changes that were already in the working tree went in with the same commit. The `codex-wip-during-revert` stash was left untouched.

## Session 2026-09-09 (pm) — lesson-builder chrome declutter + polish

Interactive design pass over the builder and the learner practice card, driven by screenshots. Quick log — the CSS here is expected to get a cleanup pass in a few days.

**Practice card (`sentence-practice-card.tsx`, `practice-responsive-overrides.css`)**
- Per-blank hint lightbulb now renders only for the focused blank (new `focusedBlockIndex` state), not every blank at once. Small fade-in.

**Module concepts — removed entirely.** `keyConcepts` dropped from `LessonModule`, `CourseModuleSummary`, `LearnerModule`, the course PUT validator, `lesson-file.ts` (validation/normalize/`emptyModule`), `add-concepts` seeds, the home page + learner dashboard ("Nuevo en este módulo"), and the one array in `data/lessons.json`. `moduleCoveredConceptKeys` helper deleted; `conceptKey` kept. Tests updated (course / lesson-builder-logic / lesson-persistence). It was a bad idea; recoverable from history if ever wanted.

**Builder chrome → icons, no popups (`lesson-library.tsx`, `lesson-document.tsx`, `keyboard-help.tsx`)**
- Top utility bar: search box + `Alt K` shortcut + "N modules · N lessons · N items" + "All changes saved" text all removed. Only undo/redo (and a fail-only Retry) remain.
- Module row: added a collapse chevron (collapsed = lesson headers only), removed the "Actions" dropdown → ↑ / ↓ / 🗑 icons top-right, inline delete confirm. Removed the module lesson/item count text.
- Lesson row: "Actions" dropdown gone → play (icon-only) / duplicate / delete icons, inline delete confirm. Move-earlier/later and move-to-module dropped (drag handles cover reorder). Removed the "N items" count.
- Slide/block: "Actions" dropdown gone → drag-grip / duplicate / delete icons in the right gutter.
- "Add lesson" restyled as a flush row; "Add module" restyled as a full-width dashed placeholder.

**Builder block styling (`lesson-library-document.css`, `sentence-editor.tsx`)**
- Hover / focus-within lift: `translateY(-2px)` + shadow only, no colour change. Left accent bar is focus-within only now. `:has()` rule so only the pointed-at block is raised when another holds focus.
- Explanation blocks: on lift, the grey (`--muted`) fills the whole block and the inner box border/bg dissolve so it reads as one surface.
- At rest a sentence block collapses to its content: the "add another blank" stub, the options row (the `▼ Options` disclosure is gone), the instruction/prompt line, and the slide-notes are all `display:none` until hover/focus-within.
- Instruction/prompt restyled as an uppercase primary eyebrow.
- Slide-notes coloured by type via `data-note`: help = amber (`--hint`), after-correct = teal (`--success`) — left bar + tint + label + underline.
- Straight `::before` hairline between exercise blocks (replaces the `border-top` that bent around the radius). Tightened block padding, inter-block gap, piece row gap, and the Spanish/English line spacing.
- Vocabulary table: content-sized columns (`minmax(84px, max-content) 1fr`) in a `width: max-content` grid (cap 460px) so English sits right after the longest term instead of ~300px away; lighter row rules.

**Checks:** `tsc --noEmit` clean · `test:unit` 84/0 · `lint` 0 errors (2 pre-existing script warnings) · `build` pass. No browser pass — visual, iterated live with the owner.

**Committed:** 2026-09-09 — this batch + this log entry, one commit to `master`. `codex-wip-during-revert` stash still untouched.
