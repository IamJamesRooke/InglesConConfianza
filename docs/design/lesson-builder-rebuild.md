# Lesson Builder — rebuild plan

Written 2026-09-15 after the owner's from-zero trial ("I want to do something.") failed
on the first `Ctrl Alt Enter` and showed square corners on a rounded card. Evidence in
`docs/engineering/lesson-builder-diagnostic.md`. This plan replaces the roadmap in
`lesson-builder.md` §9 for everything not yet started.

## Diagnosis in one paragraph

Fifteen fix passes each verified their own scripted flow; none re-walked the owner's
literal keystrokes from an empty course, and no test reads the saved file after the
keyboard-only happy path. So symptom fixes accumulated on top of three structural
faults: (1) "what is the teacher editing" has several sources of truth (React state,
DOM focus, CSS pseudo-classes) and every exit path from a slide does its own partial
cleanup — the diagnostic's confirmed data bug (an empty pair written to disk whenever
a teacher finishes a sentence slide with anything but Escape) is this fault, as were
the four focus bugs found in earlier walkthroughs; (2) keyboard handling lives in
seven files with no keymap; (3) the stylesheet is page-level selectors re-declared in
dated blocks (`.lesson-library-module-meta` ×17, `.lesson-document-explanation` ×15)
with geometry owned by nobody (`overflow: visible` on the rounded module card is why
children draw square corners). The hand-rolled contentEditable explanation editor is a
fourth, independent fault (the earlier data-loss bug lived there).

## Phases

Each phase ends with the **owner writing one lesson from an empty course, keyboard
only, at their real window width**. No phase starts until the previous trial passes.
No autonomous "improvement rounds" outside these phases.

### Phase 1 — one editing model (fixes what the owner hit)
- `lib/lesson-builder/editing.ts`: a single `EditingSelection`
  `{ lessonId, blockId, pieceId, field } | null` in a small store (context + reducer).
  Components **write** it on focus/blur of their real fields; nothing else writes it.
  Everything **reads** it: the keymap, the seam "+" placement, the resting/editing
  render of a sentence slide, CSS via one `data-state="resting|editing"` per block.
  Delete `activeBlock`/`activePiece`/`exitingBlock`/`focusAfterAdd` juggling,
  `onBlurCapture` + rAF checks, and every `:focus-within` style.
- **Leaving a slide is one function** (`leaveSlide(reason)`), run from the store when
  the selection moves off a block — it prunes blank pairs, commits English drafts, ends
  the history group. Exit paths (Escape, `Ctrl Alt Enter`, `Ctrl Alt D`, click-away,
  preview, collapse) stop doing their own cleanup.
- `lib/lesson-builder/keymap.ts`: one table `chord → command(selection)`; one
  document-level dispatcher; commands are pure functions over the store + lesson
  actions. `Ctrl Alt Enter` must work from the **title** too (opens the chooser at
  slide 0) — a likely cause of the owner's failure; confirm with the owner.
- Tests: command-level unit tests for every chord × selection kind; **four `ux:check`
  flows that end by reading the saved JSON** — finish a pair then Escape /
  `Ctrl Alt Enter` / `Ctrl Alt D` / click-away — plus the owner's literal flow from an
  empty course.
- Model: Fable designs the store + keymap signatures (≤ 150 lines); Sonnet implements.

### Phase 2 — explanation editor on a real engine
- Tiptap (ProseMirror) with a five-node schema: paragraph, bold, italic, `es` mark,
  `en` mark; hard break; no lists unless the owner wants them. A Markdown serializer
  with **round-trip property tests** (parse → serialize → parse is identity).
- Delete `serialize-explanation.ts` DOM walking, `normalizeEditorDom`, `execCommand`,
  caret-offset restore. Toolbar shows only with a non-collapsed selection (the current
  `data-has-selection` gates nothing).
- This adds a dependency (~100 kB); it is the one deliberate exception to the
  "no new editor framework" rule, because hand-rolled contentEditable is where the data
  loss was and will be again.
- Model: Sonnet.

### Phase 3 — components own their styles and geometry
- One stylesheet per component, imported by the component; one declaration per
  selector; state only via `data-state`/`data-*` attributes the component itself sets.
  All "delimited revert blocks" (F, N, 6, 1b) resolved into the base rules.
- Geometry rules: only a card's outermost element has `border-radius` and it clips
  (`overflow: hidden`) unless something must escape — then that something is portalled.
  A lint script fails the build on duplicate top-level selectors and on `!important`
  outside `print.css`.
- Replace geometry assertions in `tests/ux` with behaviour assertions; keep one visual
  regression screenshot per surface at 760 and 1280 as a diff, not as px assertions.
- Model: Sonnet for the model, Haiku for the mechanical moves.

### Phase 4 — process
- Every change to the builder ships with: the owner's literal from-zero flow green,
  saved-JSON assertions green, and a 760/1280 screenshot pair for the owner.
- `lesson-builder.md` shrinks to the editing model + keymap table + geometry rules;
  behaviour tables that merely describe accumulated code are deleted.

## Not doing
- Visual redesigns (owner: original blue theme, sans-serif, no dark mode).
- Any change to the lesson data model or the curriculum boundary.
