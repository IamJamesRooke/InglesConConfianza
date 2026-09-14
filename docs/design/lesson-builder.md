# Lesson Builder — current design truth

This is the single living design document for the Lesson Builder. It replaces
eleven overlapping proposal/verification docs (now archived under
`docs/design/archive/lesson-builder/`) that had accumulated contradictions.
**When this doc and the code disagree, the code wins.** Update this file
in the same change that changes behavior; do not let it drift again.

## 1. Purpose & audience

The Lesson Builder is written for one non-technical teacher who authors
bilingual (Spanish→English) lessons for adult Spanish-speaking learners. She
is not a developer and does not read code. The product goals are: typing
should feel like a word processor (MS Word), not a form; the mouse should be
optional for every common action; and the visual surface should stay calm —
no chrome, no boxes, no badges that aren't earning their place. Every
interaction decision below is in service of those three goals, not of
"more features."

## 2. Vocabulary

- **Module** — a named group of lessons, shown in the left `ModuleNavigator`.
  A module can be `kind: "course"` or `"onboarding"`.
- **Lesson** — a titled sequence of slides (`Lesson.blocks`). Lessons render
  as collapsible rows inside their module.
- **Slide** (called `block` in code, `LessonBlock`) — one of three types:
  - **Explanation** — a rich-text note (`ExplanationBlock.contentMarkdown`),
    edited as WYSIWYG contentEditable, serialized to a constrained Markdown
    dialect by `serialize-explanation.ts`.
  - **Sentence** — a `SentenceBlock` with `layout` left as `"sentence"`
    (default): one or more **pairs**.
  - **Vocabulary table** — a `SentenceBlock` with `layout: "vocabulary_table"`:
    the same data shape as Sentence, rendered as table rows instead of a
    sentence-builder card. Both share `SentenceEditor`.
- **Pair** (`LanguageBlock`) — one row of a Sentence/Vocabulary block: a
  Spanish piece (`spanish`) and one or more accepted English answers
  (`acceptedAnswers: string[]`). In the UI, alternates are typed into a
  single English field separated by `/` (a literal slash is typed as `\/`);
  see `answer-entry.ts` for the parse/format contract.
- **Hint** (`callout`) — an optional small pill of extra context attached to
  one pair, shown/edited only while that pair is active.
- **Instruction** (`promptText`) — an optional line of learner-facing
  guidance shown above a Sentence/Vocabulary block's pairs.
- **"Covers" concepts** (`Lesson.concepts: LessonConcept[]`) — curriculum
  concepts a lesson teaches, tagged from the compact field under the slide
  list via `LessonConceptsField`.
- Two fields on `SentenceBlock` — `helperText` and `answerFeedback` — are
  **deprecated**: retained only for on-disk compatibility with older lesson
  files, intentionally inert in both authoring and learner UI. Do not build
  new UI against them.

**Data file:** `web/data/lessons.json`, shape `LessonFile` (`version: 2`,
`{ modules: LessonModule[], lessons: Lesson[] }`) — `modules[].lessonIds`
must stay ordered and same-membership as `lessons`. Types live in
`web/src/lib/lesson-builder/types.ts`. A pre-modules `LessonFileV1` shape is
still read (never written) for back-compat.

## 3. Interaction contract

Modifier scheme: chords use **Ctrl+Alt** (not plain Alt, not plain Ctrl).
Plain Alt+letter is commonly eaten by Linux window managers before the page
sees the keydown; plain Ctrl+letter collides with the browser (save,
history, address bar). Ctrl+Alt is free of both in practice. Handlers check
`event.code` (not `event.key`) so macOS Ctrl+Option+letter — which composes
accented characters — still resolves correctly. A few narrow, already-safe
exceptions keep plain modifiers: Ctrl/⌘+S/Z/Shift+Z (save/undo/redo, global,
guarded against firing while a text field that wants those keys is
focused), Ctrl/⌘+B/I (bold/italic, only inside the explanation editor), and
plain Alt+↑/↓ on the module drag-handle button specifically (a single
non-typing target, so the WM-collision risk doesn't apply the same way).

| Context | Keys | Behaviour |
|---|---|---|
| Lesson title (collapsed row) | `Enter` | Focus jumps into writing: the first slide's field, creating an explanation slide if the lesson has none. |
| Explanation (focused) | `Enter` | New paragraph (native contentEditable behavior). |
| Explanation (focused) | `Ctrl Alt S` / `Ctrl Alt N` / `Ctrl Alt E` | Mark as Spanish / neutral / English. With a selection: wraps it in `<mark data-language="es\|en">`; with a collapsed caret: marks the word around it, or arms "typing mode" so subsequently typed text is marked live. Memorable letters (Spanish/Neutral/English) — chosen over the old adjacent `Q`/`W`/`E` on purpose. |
| Explanation (selection active) | Floating format toolbar (`Spanish` / `English` / `Normal` / `B` / `I`) | Same actions as the shortcuts, mouse-driven; shown only while `isActive` and there is a live/saved selection. |
| Explanation (focused) | `Ctrl/⌘ B`, `Ctrl/⌘ I` | Bold / italic via `document.execCommand`. |
| Explanation (focused) | `Escape` | If a typing mode is armed, clears it first (one Escape = one step back); otherwise finishes editing and calls `onExit` (bubbles to slide-level exit). |
| Sentence/Vocabulary — Spanish field | `Tab` / `Shift Tab` | Move to this pair's English field / previous pair's English field. |
| Sentence/Vocabulary — Spanish or English field | `Enter` | Blocked (no newline) — pairs are single-line. `Shift/Ctrl/⌘+Enter` are exempted from the block (composition-safe) but still don't insert a newline in practice since the field is `rows={1}`. |
| Sentence/Vocabulary — English field | `Tab` | Commits the draft, then: not-last pair → focuses next pair's Spanish field; last pair, complete → creates and focuses a new pair; last pair, incomplete → does **not** preventDefault, so Tab continues to the next real focusable control (Add pair / toolbar). |
| Sentence/Vocabulary — English field | `Shift Tab` | Commits the draft, focuses this pair's own Spanish field. |
| Sentence/Vocabulary — Spanish or English field | `Escape` | Commits any pending draft, prunes any pair left entirely blank, then exits the slide (`onExit`). |
| Sentence/Vocabulary — Spanish or English field | `Alt ArrowDown` | Opens/focuses that pair's hint pill, remembering the caret to restore on return. |
| Sentence/Vocabulary — Spanish or English field | `Ctrl Alt Backspace` | Deletes the pair outright. |
| Sentence/Vocabulary — English field | `/` | Not a shortcut — literal separator between accepted alternatives in the same field (`\/` escapes a literal slash). |
| Hint pill input | `Enter` | Blurs (commits, closes). |
| Hint pill input | `Escape` | Closes the hint (clearing it if left blank) and returns focus + caret to the field it was opened from. |
| Instruction field | `Escape` | Blank → collapses the field back to the "Add instruction" button; non-blank → exits the slide like other fields. |
| Slide (focused container, not a nested field) | `Enter` / `Space` | Enters editing: focuses the slide's first writing field. |
| Slide (focused container) | `Escape` | Exits editing back to the container (`exitBlock`), which then refocuses the slide wrapper itself (not the lesson row). |
| Slide (anywhere inside, via the shared document-body handler) | `Ctrl Alt Enter` | Opens the insert chooser positioned after the active slide (or at the end, if none active). Also counts one use toward `lesson-builder:next-slide-uses` (§5's inline cue fades after 5). |
| Insert chooser (open, focus inside it) | `E` / `S` / `T` | Pick that type immediately (only while focus is inside the open chooser). |
| Insert chooser (open, focus inside it) | `←/→/↑/↓` | Move focus between the three choice buttons (wraps). |
| Insert chooser (open) | `Escape` | Closes the chooser and restores the caret to wherever it was before the chooser opened. |
| Insert chooser (open) | click outside | Closes the chooser (pointerdown listener on `document`, ignores clicks inside `.lesson-document-insert`). |
| Slide (any) | `Ctrl Alt ArrowUp` / `ArrowDown` | Move the active slide up/down. |
| Slide (any) | `Ctrl Alt D` | Finish this lesson: collapses its row. |
| Slide (any) | `Ctrl Alt L` | Add a new lesson in the current module, right after this one (focuses its title). |
| Lesson row (any) | `Ctrl/⌘ Z` / `Ctrl/⌘ Shift Z` | Undo / redo (page-level; disabled while the event target is itself a text-editing target, so it doesn't fight native field undo). |
| Lesson row (any) | `Ctrl/⌘ S` | Save now (autosave also runs independently). Not advertised in the help dialog (§4) — autosave is the story — but it still works. |
| Module navigator drag-handle button (focused) | `Alt ArrowUp` / `Alt ArrowDown` | Reorder that module up/down (plain Alt is safe here — a single non-typing button, not a global page listener). |
| Anywhere in the builder | `Ctrl/⌘ .` | Toggle the keyboard-help dialog. |
| Keyboard-help dialog (open) | `Escape` | Closes it and restores focus to whatever was focused before it opened. |

## 4. Shortcut table (as shown in `keyboard-help.tsx`)

A teacher needs to know **six things** to write a whole lesson; everything
else is optional power-user territory. The dialog reflects that split with
two labelled sections — this table mirrors it exactly, in the same order.

### Writing a lesson

| Keys | Behaviour |
|---|---|
| `Enter` | From the title: start writing. In an explanation: new paragraph. |
| `Tab` / `Shift Tab` | Spanish → English → next pair. |
| `Ctrl Alt Enter` | Open insert choices after this slide, then `E`/`S`/`T` to pick Explanation, Sentence, or Table. |
| `Ctrl/⌘ B` · `Ctrl/⌘ I` | Bold / italic. |
| `Ctrl/⌘ Z` · `Ctrl/⌘ Shift Z` | Undo / redo. |
| `Esc` | Close the nested tool / leave the slide. |

A compact QWERTY graphic (`KeyboardMap` in `keyboard-help.tsx`) follows this
section, highlighting only the keys used above (`Tab`, `Ctrl`, `Alt`,
`Enter`, `E`/`S`/`T`, `B`, `I`, `Z`, `Esc`) so a teacher can visually locate
them without reading the table.

### More

| Keys | Behaviour |
|---|---|
| `Ctrl Alt S` · `Ctrl Alt E` · `Ctrl Alt N` | In an explanation: mark as Spanish · English · neutral. With text selected, marks it. |
| `Ctrl Alt ↑` `↓` | Move the active slide up or down. |
| `Ctrl Alt D` | Finish this lesson (collapse it). |
| `Ctrl Alt L` | Add a new lesson right after this one. |
| `Alt ↓` | On a sentence pair: open its hint. |
| `Ctrl Alt Backspace` | Delete the pair. |

This table is authoritative for what the teacher is told. `Ctrl/⌘ S` (save
now) and `Ctrl/⌘ .` (this dialog) exist in code but are deliberately not
advertised here — autosave is the story for the former, and the latter is
how you got here. The insert chooser's `E`/`S`/`T` key badges, and `/` as
the literal separator between accepted English alternatives in the same
field, are covered inline where they're used rather than in this dialog.
`Ctrl Alt Q` / `W` (old Spanish/neutral marks), `Ctrl Alt 1`/`2`/`3` (direct
add), and `Ctrl Alt Shift L` (page-level new lesson) were retired in the
1d shortcut diet — see §9.

## 5. Visual rules (current)

Pulled from `web/src/styles/lesson-library-document.css` as it stands today,
not from any proposal doc's aspirations.

- **Lesson focus**: strict single-open — at most one lesson is expanded
  across the whole builder at a time (`lesson-library.tsx`'s `openLessonId`
  state, replacing the old `collapsedLessons: Set<string>` model). On load,
  exactly one lesson opens: the `?lesson=<id>` URL param if it names a
  lesson that still exists, else `localStorage["lesson-builder:last-lesson"]`
  if it still exists, else the active module's first lesson. Expanding any
  lesson (chevron, title-row `Enter`, `jumpToLesson` from the navigator or
  search, creating a lesson, `Ctrl Alt L`) collapses whichever other lesson
  was open; collapsing the open one ("Finish"/`Ctrl Alt D`/chevron) leaves
  none open. The open lesson id is written to `localStorage` on every
  change (including back to `null`), so "Finish" also clears the memory,
  not just the screen. Switching modules in the navigator opens that
  module's own remembered-or-first lesson by the same rule, but only when
  the currently open lesson doesn't already belong to the module being
  switched to. All storage access is wrapped in try/catch.
- **Slide focus indicator**: a `4px` solid `var(--primary)` left bar
  (`.lesson-document-block[data-active="true"]::after`) is the *only* focus
  signal at the slide level — no background tint, no border, no shadow on
  the block itself (`background: transparent` is forced for hover/focus/
  active states alike). Primary blue is the only focus color used anywhere
  in the builder; the red/blue language-ink accents (below) are never used
  for focus.
- **Hover-reveal chrome cluster**: the drag/duplicate/delete icon cluster
  (`.lesson-document-block-actions`) sits absolutely positioned top-right,
  `opacity: 0` at rest, `opacity: 1` on slide `:hover` or `:focus-within`
  (always visible on touch/coarse pointers via a `(hover: none)` media
  query). Not tied to entering editing.
- **Insert "+" controls are discoverable at rest, but the palette itself is
  never invisibly hit-testable**: both `.lesson-document-insert` (between/
  after slides) and `.lesson-library-insert` (between lesson rows) show a
  20px circle "+" signpost at rest with `opacity: 0.45`, positioned
  absolutely in the left gutter (slides) or centered (lessons) so no flow
  space is reserved — for slides this is `.lesson-document-insert::after`,
  a container-level pseudo-element with `pointer-events: none` (it's a cue;
  hovering the seam, not the circle specifically, reveals the real
  palette). The actual action palette (`.lesson-document-insert-actions`,
  three buttons) is `opacity: 0; visibility: hidden; pointer-events: none`
  at rest — `visibility`, not just `opacity`, so an unrevealed palette can
  never intercept a click meant for a neighboring slide, and is correctly
  absent from the accessibility tree and tab order. Hover, `:focus-within`,
  `.labelled` (empty-lesson tail), or `.open` (set from React when the
  palette was focused via `Ctrl+Alt+Enter`'s `requestAnimationFrame`
  focus — needed since that focus call requires the button already
  visible) reveal it at full opacity/visibility/pointer-events, alongside
  the horizontal seam line. On touch (`@media (hover: none)`), always
  fully visible. `.lesson-library-insert`'s button is a real, always-
  `visibility: visible` element (only its text label hides at rest) since
  it has no equivalent keyboard-reveal path to gate on.
- **Inline next-action cue**: since the HUD bar's removal left nothing
  telling a first-time teacher how to continue after a slide,
  `.lesson-document-next-cue` (in `lesson-document.tsx`/`document.css`)
  renders `Ctrl Alt Enter · next slide` absolutely positioned at the active
  slide's bottom-right (`right: 8px; bottom: -14px`), 11px,
  `var(--muted-foreground)`, `opacity: 0.8`, `pointer-events: none` — it
  reserves no layout space. Rendered only on the block with
  `data-active="true"`, hidden while that lesson's insert chooser is open
  (`insertAt !== null`), and hidden under 700px viewport width. Learnability
  fade: each successful `Ctrl Alt Enter` increments
  `localStorage["lesson-builder:next-slide-uses"]`; once that reaches 5 the
  cue stops rendering for good (storage access wrapped in try/catch).
- **Explanation slide**: a grey card — `background: var(--muted)`, `border:
  0`, `border-radius: 6px`, no min-height, padding-driven sizing. No focus
  glow of its own; the slide-level blue bar carries the focus signal.
- **Sentence/Vocabulary pieces**: resting pairs carry no visible box
  (`border: 1px solid transparent; background: transparent`); only the
  `.active` pair gets a visible card (`border-color: var(--primary)`,
  a faint primary-tinted background). Cards are content-sized
  (`field-sizing: content`, `min-height: 1lh`), never fixed-height boxes.
- **Language ink, not fill**: Spanish text/marks render in `var(--lesson-hl-es)`
  (a red-family `oklch`), English in `var(--lesson-hl-en)` (a blue-family
  `oklch`) — as text color and `font-weight` only. Inside the builder itself
  (`.lesson-document-explanation mark`, `.lesson-document-language-field`),
  `background: transparent` — ink only, no fill. (The learner-facing preview
  surface, `.lesson-preview-explanation mark`, does add a faint 16% tinted
  background — that's the practice/preview treatment, not the authoring one.)
  **Pending owner A/B (§9, 1b)**: a calmer *resting*-only palette variant
  exists behind a single delimited block in `sentence.css` (comment `/* 1b:
  calmer resting palette */`), currently enabled — Spanish
  `color: var(--foreground); font-weight: 600`, English
  `color: var(--muted-foreground); font-weight: 400`, scoped to
  `.lesson-document-sentence.resting` only. Editing fields, explanation
  marks, and the learner preview are untouched and keep red/blue ink. Owner
  has not yet chosen between this and the original red/blue resting
  treatment — revert by commenting out that one block.
- **Hint input shown only on demand**: an empty hint no longer renders
  under every active pair. The input (`.lesson-document-hint-pill-input`)
  renders only when the pair already has a stored hint (`piece.callout !==
  null`) or the teacher just asked for one on this pair (local
  `hintRequested` state in `sentence-editor.tsx`, set by `Alt ArrowDown` or
  by clicking the pair's lightbulb button). That lightbulb
  (`.lesson-document-hint-add`, 18px circular, `lucide-react` `Lightbulb`,
  `aria-label="Add hint to <pair label>"`) appears only beside the active
  pair when it has no hint yet. Blur/Escape on an empty hint input clears
  `hintRequested` and sets `callout` back to `null`, same as before. An
  existing non-empty hint still renders as the read-only pill when its pair
  isn't active, and as the input when it is.
- **Sentence field focus**: a `box-shadow` ring in primary blue on the
  individual textarea, layered on top of the pair's own `.active` border —
  intentionally one visual system (border = which pair, ring = which field),
  not two independent glows.
- **Placeholders are neutral**: language-field placeholders are explicitly
  `var(--muted-foreground)`, not inherited red/blue at reduced opacity —
  unwritten guidance must not look like authored (if faint) content.

## 6. Owner decisions & rejected ideas

These were explicitly settled or explicitly rejected. Do not re-propose them
without a fresh, explicit ask:

- **Zen mode retired.** An earlier full-screen single-slide editing mode was
  removed; editing happens inline, in the document flow, at all times.
- **HUD bar removed.** A persistent bottom heads-up-display (lesson name,
  live shortcut legend) was cut in favor of the on-demand keyboard-help
  dialog (`Ctrl/⌘ .`) and inline per-context affordances.
- **Lessons collapse to rows.** Only the active module's lessons render
  expanded; a lesson can be individually collapsed/expanded
  (`ChevronDown`/`ChevronRight`), and "Finish this lesson" (`Ctrl Alt D`)
  collapses it and returns focus to the title.
- **No delete confirmation on slides.** Deleting a slide is one click/one
  shortcut with no "are you sure" — undo (`Ctrl/⌘ Z`) is considered
  sufficient safety net. (Lesson and module deletion *do* still confirm
  inline — that's a different, higher-stakes action.)
- **"Add slide" wording**, not "Insert block" or similar — the empty-lesson
  tail control is user-facing copy aimed at a teacher, not a technical term.
- **Module "Key Concepts" removed** — a prior per-module concept-summary
  feature was cut; only per-lesson "Covers" concepts remain.
- **No collapse toggle on the "Covers" concepts field** — it stays as a
  compact, always-visible inline field under the slide list, not a
  disclosure the teacher has to open.
- **No grey/tinted focus background on slide blocks** — the block-level
  focus signal is the blue left bar only (see §5); a background shift here
  was tried and rejected as visually noisy against the explanation card's
  own grey.
- **Desktop is the authoring target.** Narrow/mobile authoring is
  explicitly out of scope for now (see Known gaps).

## 7. Verification protocol

Lesson data (`web/data/lessons.json`) belongs to the owner. **Never edit it
by hand, and never point any test or manual check at `localhost:3000`** —
that's the owner's live authoring session. All checks below either run
statically or spin up their own isolated server against a throwaway file.

- `npm run test:unit` — Node's test runner over `tests/unit/*.test.ts`
  (includes `lesson-builder-logic`, `lesson-mutations`, `lesson-history`,
  `lesson-persistence`, `lesson-preview`, `learner-surfaces`, `course`).
  Can be scoped: `npm run test:unit -- tests/unit/<file>.test.ts`.
- `npx eslint <touched files>` — lint just what you changed.
- `npx tsc --noEmit` — full type check.
- `npm run build` — production build must succeed.
- `npm run ux:check` — Playwright, config in `web/playwright.config.ts`.
  It starts its **own** `next dev` server on port `3100` with
  `LESSON_BUILDER_DATA_PATH` pointed at a throwaway file in the OS temp dir
  (`iccf-ux-check-lessons.json`) — safe to run anytime, including while the
  owner is actively authoring, and requires the curriculum DB reachable
  (`npm run db:up`) for concept search (read-only there).
- **Known flake**: `web/tests/ux/authoring-ergonomics.spec.ts` has a
  documented pre-existing timing flake around the concept-search box
  (`getByPlaceholder("Search lessons, phrases, or concepts…")`) — a rerun
  clearing it without code changes is not a regression signal.

## 8. Known gaps

- The authoring page overflows horizontally at a 390px viewport when a long
  sentence piece is present; desktop is the deliberate current target (see
  §6), so this is unfixed by design for now, not unnoticed.
- Preview-origin restoration and failed-save retry are covered by unit
  tests (`lesson-preview.test.ts`, `lesson-persistence.test.ts`) only — no
  browser-level `ux:check` coverage exists for either path yet.

## 9. Roadmap

| # | Item | Model | Status |
|---|---|---|---|
| 0a | Consolidate design docs into this file | Sonnet | done |
| 0b | Split `lesson-library-document.css` into per-component files, prune unused selectors and `!important`s, drop process comments | Sonnet | todo |
| 0c | `LessonBuilderContext` to replace the LessonLibrary→LessonDocument→SentenceEditor prop chain | Sonnet | done |
| 0d | Sweep process/history comments ("Track E", "S3", "/tmp/…", "owned by lesson-ux") from lesson-builder code | Haiku | done |
| 0e | AGENTS.md "Lesson builder task protocol" section | Sonnet | done |
| 1a | One lesson open at a time: collapse all on load except `?lesson=` / last-edited; opening one folds the others | Sonnet | done |
| 1b | Calmer resting palette for sentence slides (owner A/B with screenshots) | Sonnet | awaiting owner |
| 1c | One quiet next-action cue under the active slide (`Ctrl Alt Enter · next slide`) | Sonnet | done |
| 1d | Shortcut diet: essentials vs power tier; unify chooser letters with global add chords | Sonnet | done |
| 1e | Keyboard help dialog: two tiers, even columns | Haiku | done |
| 1f | "Covers" concept chips: plain pills, priority as a dot | Haiku | done |
| 1g | Hint input shown only on demand, not on every activated pair | Haiku | done |
| 1h | Make both insert controls (between slides and between lessons) discoverable at rest — they currently collapse to a hairline | Haiku | done |
