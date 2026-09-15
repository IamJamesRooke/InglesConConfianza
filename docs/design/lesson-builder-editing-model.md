# Lesson Builder — editing model (Phase 1 contract)

Status: design, 2026-09-15. Implements Phase 1 of `lesson-builder-rebuild.md`.
This file is the contract; the implementation must match these signatures. Anything not
specified here is the implementer's call, but the invariants are not negotiable.

## 1. The selection — one source of truth

```ts
// web/src/lib/lesson-builder/editing.ts
export type Field = "title" | "explanation" | "instruction" | "spanish" | "english" | "hint";

export type EditingSelection =
  | { kind: "none" }
  | { kind: "title"; lessonId: string }
  | { kind: "block"; lessonId: string; blockId: string; field?: undefined }
  | { kind: "field"; lessonId: string; blockId: string; field: Field; pieceId?: string };

export type EditingState = {
  selection: EditingSelection;
  openLessonId: string | null;         // the single expanded lesson (Phase 1 keeps this)
  insertAfter: { lessonId: string; index: number } | null; // mouse chooser only
};
```

Invariants:
- **Only real focus events write `selection`.** A field's `onFocus` dispatches
  `{kind:"field",…}`; a block wrapper's `onFocus` (when the wrapper itself is the target)
  dispatches `{kind:"block",…}`; the title input dispatches `{kind:"title",…}`. Blur does
  **not** write `none` by itself — a `focusout` whose `relatedTarget` is outside the
  builder root writes `none`; otherwise the next `focusin` overwrites. No
  `requestAnimationFrame`, no `setTimeout`, no `document.activeElement` polling anywhere
  in the builder after this phase (`rg "requestAnimationFrame|activeElement"` in
  `src/components/lesson-builder src/lib/lesson-builder` → only `focus.ts` may match, for
  programmatic focus helpers).
- **Everything reads `selection`.** The "active block" is
  `selection.kind !== "none" && selection.kind !== "title" ? selection.blockId : null`.
  `activeBlock`, `activePiece`, `exitingBlock`, `focusAfterAdd`, `hintRequested`-as-
  focus-proxy, and every `:focus-within` style are deleted. Blocks render
  `data-state="resting" | "editing"` from the selection; CSS keys on that only.
- **Resting means presentation only** — for sentence slides AND vocabulary tables: no
  inputs, no row/pair delete `×`, no hint inputs, no add-pair/row button, no
  instruction textarea. Today the table never gets a resting render (owner saw a stray
  row `×` on a table at rest); in Phase 1 `SentenceEditor` renders `SentencePresentation`
  (extended to table layout) whenever `data-state="resting"`.
- **Programmatic focus goes through one helper**, `focusSelection(sel)` in `focus.ts`,
  which finds the DOM node for a selection (`[data-lesson-title]`, `[data-document-block]`,
  `[data-field][data-piece]`) and focuses it. Callers never call `.focus()` on nodes.

## 2. Leaving a slide — one function

```ts
// dispatched by the store whenever selection.blockId changes or becomes undefined
export type LeaveReason = "escape" | "insert" | "finish" | "move" | "preview" | "collapse" | "blur";
export function leaveSlide(lessonId: string, blockId: string, reason: LeaveReason): void;
```
Runs, in order: commit any English draft; prune pairs where Spanish, all answers and
hint are blank (keep at least one pair in a sentence slide); **delete the slide itself
if it is entirely empty** (sentence/table: no pair with any text, no instruction;
explanation: markdown blank after trim) — owner requirement 2026-09-15: "if I escape
out and it's empty, remove it"; the deletion is one undoable history step and shows the
existing "Slide deleted — Undo" affordance; then end the history group. Exception: the
slide being left because the teacher is *inserting the next slide after it*
(`reason: "insert"`) is still deleted — an empty slide is never worth keeping.
Implemented as a store effect on the selection transition, so **no key handler, click
handler, or component calls it directly**. `sentence-editor.tsx`'s `exitEditing` and
`isPieceBlank` move here.

## 3. The keymap — one table, one dispatcher

```ts
// web/src/lib/lesson-builder/keymap.ts
export type Chord = string; // "Ctrl+Alt+Enter", "Tab", "Shift+Tab", "Escape", "Ctrl+Alt+ArrowUp" …
export type Scope = "title" | "explanation" | "instruction" | "spanish" | "english" | "hint" | "block" | "lesson" | "page";
export type Command = (ctx: CommandContext) => boolean; // true = handled (preventDefault)
export type CommandContext = {
  selection: EditingSelection;
  lessons: Lesson[];
  actions: LessonBuilderActions;     // existing context value
  editing: EditingActions;           // setSelection, setOpenLesson, focusSelection
  event: KeyboardEvent;
};
export const KEYMAP: Record<Scope, Partial<Record<Chord, Command>>>;
export function chordOf(event: KeyboardEvent): Chord; // uses event.code, not event.key
export function scopeOf(selection: EditingSelection): Scope[]; // innermost → outermost
```
- One `keydown` listener on the builder root (`LessonLibrary`), capture phase, ignoring
  `isComposing` and events from inside `[data-keymap-ignore]` (concept typeahead,
  quick-edit, help dialog). It computes `chordOf`, walks `scopeOf(selection)` from
  innermost to outermost, runs the first command found; if it returns true →
  `preventDefault()`. **No other `onKeyDown` in the builder handles chords.** Component
  `onKeyDown`s may remain only for text-editing semantics that need the element
  (e.g. explanation Enter = paragraph is the editor's own business).
- Chords (Phase 1 set, matching `lesson-builder.md` §4 after E6):
  `Enter` on title → open + focus first field (create explanation if empty);
  `Tab`/`Shift+Tab` in spanish/english → pair navigation, last-English-Tab creates a pair
  only if complete; `Enter` in english → same as Tab; `Enter` in an empty last pair →
  leave slide; `Escape` in a field → block; `Escape` on block → `none` (nothing selected:
  no rail, no chrome, focus parked on the builder root with no visible ring — two
  Escapes from a field fully deselect, owner requirement 2026-09-15);
  `Enter`/`Space` on block → first field; `Ctrl+Alt+Enter` (title/field/block) → insert
  predicted type after the current block (after title: at index 0) and focus it; a
  second `Ctrl+Alt+Enter` within 1.5 s on a still-empty just-inserted block → cycle its
  type; `Ctrl+Alt+ArrowUp/Down` on block/field → move block; on title → move lesson (may
  cross modules); `Ctrl+Alt+D` → finish (collapse) lesson; `Ctrl+Alt+L` → new lesson
  after current; `Ctrl+Alt+P` → preview; `Ctrl+Alt+M` → module name;
  `Ctrl+Alt+Backspace` in spanish/english → delete pair, on title → delete-lesson confirm;
  `Alt+ArrowDown` in spanish/english → hint; `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` (page) →
  undo/redo unless the target is a text field with native undo (explanation handles its
  own until Phase 2); `Ctrl/Cmd+.` → help. Explanation mark chords `Ctrl+Alt+S/E/N`
  stay inside the explanation editor for now (Phase 2 moves them).
- Predicted type: after title → explanation; after explanation → sentence; after
  sentence/vocabulary → explanation. The mouse chooser (`SlideInsertControl`) stays as
  is, driven by `insertAfter`.

## 4. Tests that would have caught the known bugs
- Unit (`tests/unit/keymap.test.ts`): for every scope × chord in `KEYMAP`, a case with a
  fake `CommandContext` asserting the dispatched actions and the resulting selection.
  `leaveSlide` cases: blank last pair pruned on each `LeaveReason`; non-blank untouched;
  single blank pair in a fresh sentence slide kept.
- `ux:check` (`tests/ux/from-zero.spec.ts`), each ending by **reading the saved JSON**:
  (a) the owner's literal flow — `Ctrl+Alt+L`, title, Enter, "Quiero es I want.",
  `Ctrl+Alt+Enter`, pairs via Tab, `Ctrl+Alt+Enter`, "Bien.", `Ctrl+Alt+D`, reload —
  asserting exactly 2 pairs, no empty pair, texts verbatim; (b)–(e) finish a pair then
  leave via Escape / `Ctrl+Alt+Enter` / `Ctrl+Alt+D` / click on another slide — same
  assertion; (f) second `Ctrl+Alt+Enter` cycles the empty block's type; (g) title
  `Ctrl+Alt+Enter` inserts at index 0.

## 5. Out of scope for Phase 1
Editor engine (Phase 2), script mode/autocomplete (2.5), styling beyond replacing
`:focus-within`/`[data-active]` with `[data-state]` (Phase 3), the mouse chooser's look.
