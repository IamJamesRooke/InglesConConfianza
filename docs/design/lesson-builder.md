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
    edited in Tiptap/ProseMirror over a four-node, three-mark schema
    (`explanation-schema.ts`) and serialized to a constrained Markdown
    dialect by `explanation-markdown.ts` (Phase 2, 2026-09-15).
  - **Sentence** — a `SentenceBlock` with `layout` left as `"sentence"`
    (default): one or more **pairs**.
  - **Vocabulary table** — a `SentenceBlock` with `layout: "vocabulary_table"`:
    the same data shape as Sentence, rendered as table rows instead of a
    sentence-builder card. Both share `SentenceEditor`.
- **Pair** (`LanguageBlock`) — one row of a Sentence/Vocabulary block: a
  Spanish piece (`spanish`) and one or more accepted English answers
  (`acceptedAnswers: string[]`). In the UI, alternates are typed into a
  single English field separated by `/` (a literal slash is typed as `\/`);
  see `answer-entry.ts` for the parse/format contract. `given?: true`
  (E8, 2026-09-15) marks a pair as shown to the learner but never tested —
  an ellipsis, a name, a number the sentence needs but the lesson isn't
  teaching. Absent (or false) means tested, the default for every existing
  lesson. Toggled with `Ctrl+Alt+G` in either field (`mutations.ts`'s
  `toggleGiven`); the editing view shows a small muted "given" pill next to
  the pair, and the resting composed view renders the pair's English in
  normal weight with a dotted underline (`lesson-sentence-presentation.tsx`,
  `sentence-presentation.css`). The learner's `SentencePracticeCard` renders a given
  piece as static Spanish/English text with no input, excluded from
  Tab/Enter progression and from completion (`isComplete`).
- **Hint** (`callout`) — an optional small pill of extra context attached to
  one pair, shown/edited only while that pair is active.
- **Instruction** (`promptText`) — an optional line of learner-facing
  guidance shown above a Sentence/Vocabulary block's pairs.
- **"Covers" concepts** (`Lesson.concepts: LessonConcept[]`) — curriculum
  concepts a lesson teaches, tagged from the compact field under the slide
  list via `LessonConceptsField`. Two independent suggestion sources feed
  that field, both dashed pills the teacher accepts with one keystroke and
  neither ever writes to the lesson on its own:
  - **Suggested review** (amber, `Snowflake` icon) — cold concepts from
    earlier lessons that haven't reappeared recently (`suggestConceptsForLesson`,
    `concept-suggestions.ts`).
  - **Auto-Covers** (`.is-pair-suggestion`, dashed outline with a leading
    "+") — concepts the lesson's own pairs already name. `extractLessonPairTerms`
    pulls terms from every pair's Spanish text and accepted English answers,
    plus `[[es:…]]`/`[[en:…]]` marks in explanation prose; `matchPairTermsToConcepts`
    matches them against the curriculum (exact, then prefix, accent/case-insensitive,
    bracket placeholders stripped) via one `POST /api/admin/curriculum/concepts/suggest`
    call, recomputed 800ms after the pairs change and once on open. Already-tagged
    concepts are excluded; `Enter`/click tags one, `Ctrl+Enter` (input focused) tags
    all, `Backspace`/`×` on a focused suggestion dismisses it for that lesson —
    dismissals live in `sessionStorage`, never in lesson data.
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

**Phase 1 (2026-09-15) replaced this whole section's mechanism.** There is
now exactly one source of truth for "what is the teacher editing"
(`EditingSelection`, `web/src/lib/lesson-builder/editing.ts`) and exactly one
keymap (`web/src/lib/lesson-builder/keymap.ts`): a table of `scope × chord →
command`, dispatched by a single capture-phase `keydown` listener mounted on
the builder root (`LessonLibrary`). No other `onKeyDown` in the builder
handles a chord — a component's own `onKeyDown` may remain only for
text-editing semantics that need the literal element (inside an explanation,
Enter/Shift+Enter/arrows/Backspace and `Ctrl/⌘+B`/`I` are ProseMirror's own
keymap, never this table's). A handled chord is both `preventDefault`ed and
`stopPropagation`ed, so ProseMirror's keydown never sees it twice. See
`docs/design/lesson-builder-editing-model.md` for the full contract
(selection shape, `leaveSlide`, the focus helper). `leaveSlide` (2026-09-15)
now deletes the slide outright — one undoable step, the usual "Slide
deleted — Undo" toast — when it's left entirely empty on any `LeaveReason`;
a click on one of the slide's own controls (Add instruction, hint lightbulb,
Add pair/row, pair ×) never counts as leaving, even when the click briefly
unmounts the clicked control itself.

Modifier scheme unchanged: chords use **Ctrl+Alt** (not plain Alt, not plain
Ctrl) — plain Alt+letter is commonly eaten by Linux window managers before
the page sees the keydown, and plain Ctrl+letter collides with the browser.
`chordOf` reads `event.code` (not `event.key`), so macOS Ctrl+Option+letter
still resolves. `Ctrl/⌘+Z/Shift+Z/S` and `Ctrl/⌘+.` keep plain modifiers (see
the `page` scope below). The mark chords `Ctrl+Alt+S/E/N` are now real
`explanation`-scope entries; `Ctrl/⌘+B`/`I` are registered as deliberate
no-ops (they return false) so the event falls through to Tiptap's own
`Mod-b`/`Mod-i` bindings.

**Scope resolution** (`scopeOf`, innermost → outermost): `none` → `[page]`;
`title` → `[title, lesson, page]`; `block` → `[block, lesson, page]`;
`field` → `[<field>, block, lesson, page]`. The dispatcher walks this list
for the pressed chord and runs the first command it finds; a command
returning `true` calls `preventDefault()`. A field-shaped scope (anything
but `block`/`lesson`/`page`) is skipped entirely if the keydown's real
target isn't actually inside that field — the shared selection can be
momentarily stale relative to DOM focus (e.g. Tab-ing to a plain button
elsewhere in the row), and a stray Enter/Tab/Escape on it must never be
swallowed by e.g. the `spanish` scope's own `Enter`.

The table below is generated from `KEYMAP` — one row per scope × chord.

| Scope | Chord | Behaviour |
|---|---|---|
| `title` | `Enter` | Open the lesson and focus its first slide's field, creating an explanation slide if it has none. |
| `title` | `Ctrl+Alt+Enter` | Insert the predicted type (explanation) at index 0 and focus it. |
| `title` | `Ctrl+Alt+Shift+Enter` | E3b "extend": insert a new sentence slide at index 0 copying the pieces of the nearest preceding sentence slide (none exists from the title, so this degrades to a plain empty sentence, same as `Ctrl+Alt+Enter`'s predicted-sentence case). |
| `title` | `Ctrl+Alt+ArrowUp` / `ArrowDown` | Move the lesson within its module, or across a module boundary at the top/bottom of the list. |
| `title` | `Ctrl+Alt+Backspace` | Open this row's inline "Delete lesson?" confirm, focused on Delete. |
| `instruction` | `Enter` | Consumed — single-line field, no newline. |
| `instruction` | `Escape` | Move selection to `block` (see the field-scope `Escape` row below — registered identically on every field scope except `hint`). |
| `spanish` | `Tab` | Move to this pair's English field. |
| `spanish` | `Shift+Tab` | Move to the previous pair's English field (unhandled — lets Tab continue — at pair 1). |
| `spanish` | `Enter` | Consumed — single-line field, no newline. |
| `spanish` | `Alt+ArrowDown` | Open/focus this pair's hint. |
| `spanish` | `Ctrl+Alt+Backspace` | Delete this pair outright. |
| `spanish` | `Ctrl+Alt+G` | E8: toggle this pair's `given` flag (shown to the student, never tested). |
| `spanish` | `Escape` | Move selection to `block`. |
| `english` | `Tab` / `Enter` | Commit the draft (read from the live field, not React state), then: not the last pair → next pair's Spanish; last pair, complete → create and focus a new pair; last pair, incomplete → unhandled (Tab continues to the next real control; Enter does nothing further). |
| `english` | `Shift+Tab` | Commit the draft, focus this pair's own Spanish field. |
| `english` | `Alt+ArrowDown` | Open/focus this pair's hint. |
| `english` | `Ctrl+Alt+Backspace` | Delete this pair outright. |
| `english` | `Ctrl+Alt+G` | E8: toggle this pair's `given` flag (shown to the student, never tested). |
| `english` | `Escape` | Move selection to `block`. |
| `hint` | `Enter` / `Escape` | Close the hint (clearing the pair's `callout` if left blank) and return focus to whichever field opened it (Spanish or English — remembered per pair; defaults to Spanish for the mouse lightbulb button). |
| `explanation` | `Escape` | Move selection to `block` (registered via the same field-scope loop). |
| `explanation` | `Ctrl+Alt+S` / `Ctrl+Alt+E` | Mark the selection Spanish / English. With a collapsed caret, marks the word around it; re-applying the language already there removes it. Marking across a run marked in the other language *replaces* it — the `lang` mark excludes itself, so marks can never nest. |
| `explanation` | `Ctrl+Alt+N` | Remove any language mark from the selection, or from the word around a collapsed caret. |
| `explanation` | `Ctrl/⌘+B` / `Ctrl/⌘+I` | Registered as no-ops that return false, so Tiptap's own `Mod-b`/`Mod-i` toggle bold/italic. Documented here so the table is the whole scope. |
| `block` | `Enter` / `Space` | Enter editing: focus the slide's first field. |
| `block` | `Escape` | Fully deselect (`selection → none`): no rail, no chrome, focus parks on the builder root with no visible ring. Two Escapes from a field reach this — field → block → none. |
| `block` | `Ctrl+Alt+Enter` | Insert the predicted type after this block and focus it (explanation → sentence; sentence/vocabulary → explanation). A second `Ctrl+Alt+Enter` within 1.5s, while the just-inserted block is still empty, cycles its type instead (explanation → sentence → vocabulary → …). Also reached from every field scope (Ctrl+Alt+Enter isn't registered per-field). |
| `block` | `Ctrl+Alt+Shift+Enter` | E3b "extend": insert a new sentence slide after this block, copying the nearest preceding sentence slide's pieces (deep-copied, terminal punctuation stripped from the copied last piece in both languages) plus one new empty pair, focused. With no preceding sentence slide to copy, degrades to a plain empty sentence. Also reached from every field scope, same as `Ctrl+Alt+Enter`. |
| `block` | `Ctrl+Alt+ArrowUp` / `ArrowDown` | Move this block up/down. Also reached from every field scope. |
| `lesson` | `Ctrl+Alt+D` | Finish this lesson: fully deselect, collapse it, flush any pending save. Reached from title, block, and every field scope. |
| `lesson` | `Ctrl+Alt+P` | Preview this lesson. Reached from title, block, and every field scope. |
| `page` | `Ctrl+Alt+L` | Add a new lesson: right after the currently open lesson if one is selected, else at the end of the active module. Works with zero lessons in the module. |
| `page` | `Ctrl+Alt+M` | Focus the active module's name input. |
| `page` | `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / redo, unless the keydown's target is itself a text-editing element (input/textarea/contenteditable) — native undo wins there (the explanation editor routes its own `Ctrl+Z` internally; see §1). |
| `page` | `Ctrl+S` | Flush any pending idle-debounced save immediately. Not advertised in the help dialog (§4) — autosave is the story — but it still works. |
| `page` | `Ctrl+.` | Toggle the keyboard-help dialog, remembering whatever had focus so it can be restored on close. |

Not in `KEYMAP` — element-level or out of the selection model, so they keep
their own local handling rather than going through the dispatcher:

- The mouse-driven insert chooser (`SlideInsertControl`) — hover/focus
  reveals its three always-in-DOM buttons; `E`/`S`/`T`/arrow keys/`Escape`
  inside it are its own `onKeyDown`, guarded by `[data-keymap-ignore]` so the
  shared dispatcher never sees them. Driven by `EditingState.insertAfter`
  (mouse-only per the contract) — the keyboard path never opens it (see
  `Ctrl+Alt+Enter` above).
- The concept-tag typeahead, the concept quick-edit dialog, and the
  keyboard-help dialog are each `[data-keymap-ignore]` for the same reason.
  The Covers input's own `onKeyDown` also owns `Ctrl+Enter` (accept every
  visible auto-Covers suggestion) and, on a focused suggestion pill itself,
  `Enter` (tag it) and `Backspace` (dismiss it) — see §2's Auto-Covers entry.
- E5b's pair-field autocomplete popover (`PairLanguageField`,
  `pair-field-autocomplete.tsx`) is the one field-scope exception that's only
  *sometimes* `[data-keymap-ignore]`: the Spanish/English textarea carries
  the attribute only while its own popover is open, so the shared dispatcher
  skips the field for that stretch and the field's own `onKeyDown` handles
  `↑`/`↓` (move the highlight), `Tab`/`Enter` (accept the highlighted
  completion), and `Escape` (close the popover only, selection unchanged)
  instead. Closed, the attribute is absent and normal Tab/Enter/Escape pair
  navigation (this section's `spanish`/`english` rows) applies exactly as
  documented — nothing here changes when the popover never opens.
- The module navigator's search input and the module-name input are
  `[data-keymap-ignore]` too — nothing about typing in them is part of the
  `EditingSelection` model, so a stale selection elsewhere must never
  intercept a keystroke meant for them.
- The module-rail drag-handle's own `Alt+ArrowUp`/`ArrowDown` (module
  reorder) and the rail's own `Escape` (closes the mobile disclosure) —
  modules aren't part of `EditingSelection` at all in Phase 1, so these stay
  local, element-scoped handlers, same as before.
- Explanation-internal `Enter` (paragraph), `Shift+Enter` (hard break),
  arrows, Backspace and `Ctrl/⌘+B`/`I` — ProseMirror's own keymap. `Ctrl/⌘+Z`
  inside an explanation is also the editor's (text-level) history; the page
  scope's undo declines whenever the keydown target is a text-editing
  element. The mark chords `Ctrl+Alt+S/E/N` are in the shared table (§4).

**Autosave timing** (`use-lesson-persistence.ts`): the lesson-body save is
an *idle* debounce, not a throttle — every edit restarts a 2000ms window,
so a save only fires once the teacher has actually paused, never mid-word.
It's flushed immediately (bypassing the wait) on: collapsing a lesson
(`Ctrl Alt D` or the chevron), focus leaving a lesson's row entirely,
`Ctrl/⌘ S`, `beforeunload`, and opening Preview. The module/course-order
save (lesson order, module names) is a separate, shorter 500ms debounce,
unaffected by this.

## 4. Shortcut table (as shown in `keyboard-help.tsx`)

A teacher needs to know **six things** to write a whole lesson; everything
else is optional power-user territory. The dialog reflects that split with
two labelled sections — this table mirrors it exactly, in the same order.
(This is the *teacher-facing* subset/wording of §3's generated table, kept
hand-written for tone — `keyboard-help.tsx` is not itself generated.)

### Writing a lesson

| Keys | Behaviour |
|---|---|
| `Enter` | From the title: start writing. In an explanation: new paragraph. |
| `Tab` / `Shift Tab` | Spanish → English → next pair. |
| `Ctrl Alt Enter` | Insert the next slide (predicted type) after this one immediately — press it twice to cycle the type instead. |
| `Ctrl/⌘ B` · `Ctrl/⌘ I` | Bold / italic. |
| `Ctrl/⌘ Z` · `Ctrl/⌘ Shift Z` | Undo / redo. |
| `Esc` | Close the nested tool / leave the slide (twice, from a field, to fully deselect). |

A compact QWERTY graphic (`KeyboardMap` in `keyboard-help.tsx`) follows this
section, highlighting only the keys used above (`Tab`, `Ctrl`, `Alt`,
`Enter`, `B`, `I`, `Z`, `Esc`) so a teacher can visually locate them without
reading the table.

### More

| Keys | Behaviour |
|---|---|
| `Ctrl Alt S` · `Ctrl Alt E` · `Ctrl Alt N` | In an explanation: mark as Spanish · English · neutral. With text selected, marks the selection; with just a caret, the word around it. |
| `Ctrl Alt ↑` `↓` | Move the active slide up or down. |
| `Ctrl Alt ↑` `↓` (from a lesson's title) | Move the lesson within its module, or across a module boundary at the top/bottom of the list. |
| `Ctrl Alt D` | Finish this lesson (collapse it). |
| `Ctrl Alt L` | Add a new lesson — works from anywhere, even an empty module. Goes after the open lesson, or at the end of the module. |
| `Ctrl Alt P` | Preview this lesson, from anywhere inside its row. |
| `Ctrl Alt M` | Rename the active module — focuses its name field. |
| `Alt ↓` | On a sentence pair: open its hint. |
| `Ctrl Alt Backspace` | On a sentence pair: delete the pair. On a lesson's title: delete the lesson (confirm still required). |
| `Ctrl Alt T` | Toggle the lesson's script view (plain-text drafting surface) — see "Script mode" below. |

This table is authoritative for what the teacher is told. `Ctrl/⌘ S` (save
now) and `Ctrl/⌘ .` (this dialog) exist in code but are deliberately not
advertised here — autosave is the story for the former, and the latter is
how you got here. The mouse chooser's `E`/`S`/`T` key badges, and `/` as
the literal separator between accepted English alternatives in the same
field, are covered inline where they're used rather than in this dialog.
`Ctrl Alt Q` / `W` (old Spanish/neutral marks), `Ctrl Alt 1`/`2`/`3` (direct
add), and `Ctrl Alt Shift L` (page-level new lesson) were retired in the
1d shortcut diet — see §9.

### Script mode

`Ctrl Alt T` (any field/block/title in a lesson) or the quiet "Script ⌥"
button at the top of the open lesson toggles a monospace `<textarea>`
showing the whole lesson as plain text — the grammar is
`docs/design/lesson-script-grammar.md`, implemented in
`lib/lesson-builder/script.ts` (`parseScript`/`printScript`). An empty
lesson's tail insert row also offers a third quiet "Paste a script…"
action that opens the view blank, for pasting a whole lesson from notes.

Leaving the view — the same chord again, `Escape`, or blurring to
somewhere outside the textarea — parses the text. A clean parse dispatches
`REPLACE_LESSON_BLOCKS` (title/concepts too, when the script provided
them) as one undoable step and closes the view; a parse error shows every
offending line, with its line number, in a list under the textarea and
keeps the view open until fixed. The textarea carries
`data-keymap-ignore`, so the builder's global chord dispatcher never sees
keys typed inside it — `Ctrl Alt T` and `Escape` are handled by the
textarea itself instead.

Not covered by E4: pair-field autocomplete while typing inside the block
view (E5's other half) and auto-marking explanation text on parse — script
mode carries marked/unmarked text through verbatim, since E1's "X es Y"
auto-marking is an editor input rule, not a parser behaviour.

## 5. Visual rules (current)

Pulled from `web/src/styles/lesson-builder/*.css` (one stylesheet per
component since Phase 3a — see §9 item 0b) as it stands today, not from any
proposal doc's aspirations.

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
  for focus. This bar used to also light up on plain `:focus-within`
  (`.lesson-document-block:focus-within::after`) — that rule is gone (round
  2, item B). It was the cause of the owner-reported "stray full-height
  blue line": `exitBlock`'s own `.focus()` call (Escape) moves DOM focus
  onto the block wrapper itself, which kept `:focus-within` matched — and
  therefore this bar lit — on a slide the teacher no longer considered
  "active," persisting after clicking a pair, pressing Escape, and
  scrolling away. `[data-active="true"]::after` is now the only thing that
  paints this bar.
- **Hover-reveal chrome cluster**: the drag/duplicate/delete icon cluster
  (`.lesson-document-block-actions`) sits absolutely positioned top-right,
  `opacity: 0` at rest, `opacity: 1` on slide `:hover` or `:focus-within`
  (always visible on touch/coarse pointers via a `(hover: none)` media
  query). Not tied to entering editing.
- **Insert "+" controls show nothing at rest, except one seam** (round 2,
  item A — tightened from the earlier "discoverable at rest everywhere"
  rule, which read as a ladder of dots down the whole left gutter on a
  ten-slide lesson): `.lesson-document-insert::after`, the 20px circle "+"
  signpost, sits at `opacity: 0` by default and is revealed only via
  `[data-after-active="true"]` — set in `lesson-document.tsx` on the one
  seam immediately following the block with `data-active="true"` (computed
  from `activeBlockIndex`). That same seam also carries the `next slide ·
  Ctrl Alt Enter` cue text (see below), so a teacher always has exactly one
  lit next-step affordance, never zero and never a whole column of them.
  Every seam still reveals its "+" and the
  full action palette (`.lesson-document-insert-actions`, three buttons,
  `opacity: 0; visibility: hidden; pointer-events: none` at rest — so it
  cannot be hit-tested or tabbed to) on hover/`:focus-within`/`.labelled`
  (empty-lesson tail)/`.open` (set from React when the palette was focused
  via `Ctrl+Alt+Enter`'s `requestAnimationFrame` focus — needed since that
  focus call requires the button already visible), alongside the
  horizontal seam line. On touch (`@media (hover: none)`), always fully
  visible. Under 850px viewport width the circle's rest position (`left`)
  is pulled in to match `.lesson-document`'s own narrower left padding, so
  it stays inside the document's left indent instead of hanging off the
  card's edge. `.lesson-library-insert` (between lesson rows) follows the
  same "nothing at rest" rule at the container level (`opacity: 0`, full
  opacity only on `:hover`/`:focus-within`, always visible on touch) — it
  has no single "after the active thing" seam to light up, since lesson
  rows don't have a slide-level active concept.
- **Inline next-action cue lives on the after-active seam, not the block**
  (round 2, item 2 — moved off the active block itself): since the HUD
  bar's removal left nothing telling a first-time teacher how to continue
  after a slide, a cue used to render via `.lesson-document-next-cue`,
  absolutely positioned at the active block's own bottom-right — which
  overlapped the following slide's content (its `kbd` badges sat half
  covered by the next card). It's now `.lesson-document-insert-cue`
  (`slide-insert-control.tsx`/`slide-insert-control.css`), rendered *inside* the one seam
  that already shows the "+" signpost at rest — the seam immediately after
  the active slide (`data-after-active="true"`, §5 item A). That seam grows
  to `18px` at rest (up from the bare signpost's `4px`) to hold the text,
  shares the actions palette's own grid cell (`grid-area: 1 / 1`) so
  revealing the palette on hover swaps cleanly in place, and is
  left-aligned (`justify-self: start`) rather than centered, reading as a
  continuation of the "+" circle just to its left. Text order is `next
  slide · Ctrl Alt Enter` (label, then the three `kbd` badges), muted
  11px, `pointer-events: none`. Hidden the moment that seam's own palette
  reveals (hover/`:focus-within`/`.open`) or the lesson's insert chooser is
  open anywhere (`insertAt !== null`, passed down as the `showNextSlideCue`
  prop), and hidden under 700px viewport width (both a JS gate on the prop
  and a `@media (max-width: 699px)` backstop in CSS). Learnability fade:
  each successful `Ctrl Alt Enter` increments
  `localStorage["lesson-builder:next-slide-uses"]`; once that reaches 5 the
  cue stops rendering for good (storage access wrapped in try/catch) —
  unchanged from before, just relocated.
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
  This is the *editing*-field/explanation-mark treatment; resting sentence
  presentation and vocabulary-table rows use a different, settled palette
  (below).
- **Resting pair typography** (round 2, item C — owner-decided, no longer an
  A/B): Spanish `color: var(--foreground); font-weight: 600; font-size:
  16px`, English `color: var(--muted-foreground); font-style: italic;
  font-weight: 400; font-size: 15px`, with 6px between pairs and 2px
  between a pair's own two lines. Applies to `.lesson-document-sentence
  .resting .lesson-sentence-composed[lang="es"|"en"]` and, for consistency,
  to a vocabulary table's own unfocused rows — vocabulary tables never get
  the `.resting` class (there's no separate resting/editing presentation
  for a table, per `sentence-editor.tsx`), so the equivalent selector is
  `.lesson-document-sentence.vocab-table .lesson-document-piece:not(.active)
  .lesson-document-language-field[data-language="es"|"en"] > textarea` —
  note the full descendant chain through `.lesson-document-language-field`,
  not a `.lesson-document-piece > textarea` direct-child selector, since the
  textarea is nested inside that field wrapper, not a direct child of the
  piece. Editing fields, explanation marks, and the active vocab-table row
  keep the always-on red/blue ink from the bullet above.
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
- **Collapsed lesson row chrome** (round 2, item D): the drag/duplicate/
  delete/preview cluster (`.lesson-library-row-icons`) is `opacity: 0` at
  rest, `opacity: 1` on that row's `:hover`/`:focus-within`, always visible
  under `(hover: none)` — opacity only, not `visibility`, so Tab still
  reaches every control regardless of hover state. The Play/preview button
  (`.lesson-library-try`) is a ghost icon at rest (`color: var(--primary);
  background: transparent`, no fill) and fills solid
  (`background: var(--primary); color: var(--primary-foreground)`) only on
  hover/`:focus-visible`. aria-labels and the inline delete-confirm are
  unchanged.
- **Save status + undo/redo live in the left rail** (round 2, item E): the
  old full-width `.lesson-library-utility` header card above the module
  list is gone. The status text, undo/redo buttons, and (when
  `saveFailed`) "Retry save" now render as a footer row
  (`.module-navigator-status-row`) inside `ModuleNavigator`, under "Add
  module" — muted 12px status on the left, undo/redo icons on the right,
  `role="status"`/`aria-live="polite"` and button `title`s unchanged.
  `LessonLibrary` just forwards `saveLabel`/`saveFailed`/`canUndo`/
  `canRedo`/`onUndo`/`onRedo`/`onRetrySave` through as props; it no longer
  renders any of this itself.
- **Quiet module header** (round 2, item F, behind `/* F: quiet module
  header */ … /* end F */` in the old, now-retired `library.css`; folded
  into the single `.lesson-library-module-meta` rule in
  `lesson-library.css` as of Phase 3a): no fill, `var(--foreground)` on a
  plain/transparent background, the title input at 20px/700 with a 1px
  `var(--border)` bottom hairline instead of the filled primary-blue bar
  the old theme-slice section used to define underneath it. The
  delete-module icon is a ghost icon (muted, destructive fill only on
  hover) at the right. No longer reversible via a comment toggle — the
  filled-blue header variant was deleted, not retained, when the F block
  was folded in.
- **Freehand "Covers" concepts render dashed** (§9 item R5): a concept chip
  with no `conceptId` (typed and accepted but not matched to anything in the
  curriculum database) gets `border-style: dashed` — `.lesson-concept-chip.is-freehand`
  in `lesson-concepts-field.css`, the same visual language as the module Key Concepts
  field's `is-uncovered` state — plus `title="Not in the curriculum —
  coverage won't count it"` on the chip. Nothing else about it changes: no
  color shift, no icon, and it still isn't clickable (no `ConceptQuickEdit`,
  since there's no database row to edit).
- **Seam "next slide" cue clears the "+" circle at every width down to
  700px** (§9 item R7): under 850px the circle's `left` offset moves in to
  `-14px` (§5, above), which put its right edge at `+6px` from the seam's
  own left edge — 4px inside the cue text's old `margin-left: 2px`, visually
  swallowing the leading "n" of "next slide". Fixed with a `margin-left:
  10px` override on `.lesson-document-insert-cue` in the same `max-width:
  850px` block in `slide-insert-control.css`. The cue still hides entirely under 700px
  (unchanged).
- **Disabled module-delete explains itself** (§9 item R7): when
  `modules.length === 1`, the trash icon's `title`/`aria-label` read "Can't
  delete the only module" instead of the unconditional "Delete module", and
  it carries `aria-disabled` alongside the native `disabled` (`lesson-library.tsx`).
- **`Ctrl Alt M` renames the active module from the keyboard** (§9 item R7):
  the module name `<input>` carries `data-module-name={module.id}`;
  `lesson-library.tsx`'s existing document-level keydown handler (the one
  that already owns `Ctrl Alt L`) focuses and selects it. Removes the old
  8-`Shift Tab` walk as the only keyboard path.
- **Compact rail under 900px** (§9 item R7, behind `/* 6: compact rail under
  900px */ … /* end 6 */` in the old, now-retired `module-navigation.css`,
  `library.css`, and `document.css`; folded into the base rules of
  `module-navigator.css`, `lesson-library.css`/`lesson-row.css`, and
  `lesson-document.css` as of Phase 3a): below 900px `ModuleNavigator` renders an
  always-present "Modules ▾ <active module name>" disclosure button
  (`.module-navigator-disclosure`, hidden above 900px via `display: none`);
  the search box, module list, "Add module", and save/undo footer move into
  a sibling `.module-navigator-collapsible` div that's `display: none`
  unless `data-open="true"` (local `railOpen` state, toggled by the
  disclosure button; `Escape` inside the rail closes it and refocuses the
  button; picking a module or a search result also closes it). Above 900px
  `.module-navigator-collapsible` is unconditionally `display: flex` — the
  disclosure and `railOpen` are no-ops there. The rail also switches from
  `position: static` to `position: sticky; top: 64px` below 900px (the
  `64px` matches `.admin-header`'s own sticky height, out of this file's
  scope, so the two don't overlap once scrolled), and module-header/lesson-row
  padding and the `.lesson-library-with-navigator` stacked-layout gap are
  trimmed at the same breakpoint. Net effect measured at 760×900 with one
  short lesson: first-slide top moved from ~408px to ~224px (45% → ~25% of
  the viewport).
- **Icon-only controls meet a 24×24 hit-target floor** (§9 item R7): sizes
  grown via `min-width`/`min-height` (padding), not by enlarging the icon
  glyphs — `.lesson-document-block-actions button` (20→24), `.lesson-document-hint-add`
  (18→24), `.lesson-document-pair-delete` (16→24, with its absolute
  `top`/`right` offset pulled out from `-7px` to `-11px` so the visible
  circle stays anchored near the pair's corner instead of creeping inward),
  and `.module-navigator-row-drag` (18px-wide/content-height → 24×24).
  `.lesson-library-row-icons > button` (28×28) and `.module-navigator-history
  button` (26×26) already cleared the floor. Enforced by
  `tests/ux/accessibility.spec.ts`'s "lesson library icon-only controls meet
  the 24x24 click-target floor" test (asserts zero findings, scoped to
  `.lesson-library` and to controls with no visible text) — the pre-existing
  page-wide "icon-only controls meet a minimum click-target size" test
  stays report-only, unchanged.

## 6. Owner decisions & rejected ideas

These were explicitly settled or explicitly rejected. Do not re-propose them
without a fresh, explicit ask:

- **Zen mode retired.** An earlier full-screen single-slide editing mode was
  removed; editing happens inline, in the document flow, at all times.
- **HUD bar is wanted — restored 2026-09-15.** The bottom shortcut bar was
  removed in `5972306e` and wrongly recorded here as an owner decision; the
  owner asked for it back. It is now `EditingHud`
  (`web/src/components/lesson-builder/editing-hud.tsx`,
  `web/src/styles/lesson-builder/editing-hud.css`), generated from `KEYMAP`/`scopeOf`
  so it can't drift from the dispatcher: it mirrors the dispatcher's own
  scope-shadowing precedence to compute the chords live for the current
  selection, then orders them via a hand-owned `SCOPE_PRIORITY` (which chords
  are most useful first — cosmetic only, never hides a real chord) and labels
  them via a hand-owned `HUD_LABELS` (falls back to a humanised command name
  if a chord is missing a label). Hidden when `selection.kind === "none"` or
  when focus sits inside anything carrying `[data-keymap-ignore]` (tracked via
  a `focusin` listener, not polling). Mounted as the last child of
  `.lesson-library-modules` (`lesson-library.tsx`), `position: sticky; bottom:
  0`, so it spans the document column, not the module rail.
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
- **"New lesson like this one" (E7) skeletons are legitimately-empty
  placeholders, not a special "template" mode.** `duplicateLessonStructure`
  produces a lesson whose slides are genuinely empty (`contentMarkdown: ""`,
  one blank pair), same as any slide a teacher inserts and hasn't typed into
  yet — there is no `templateFresh`/protected flag on the lesson or its
  slides. `leaveSlide`'s empty-slide deletion (§3) only runs when a slide is
  *entered and then left* still empty; a slide the teacher never enters at
  all is never evaluated, so it survives indefinitely. Verified directly:
  entering the new lesson's title and pressing Enter opens slide 1 (the
  first explanation) and focuses it; typing into it and finishing
  (`Ctrl Alt D`) keeps that content, while the sentence/table placeholders
  after it — never entered — are untouched on save. The rule in one line:
  **an untouched placeholder you skip stays; one you enter and leave empty
  goes.** Covered by `tests/ux/duplicate-structure.spec.ts`.

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
- Preview-origin restoration is covered by unit tests
  (`lesson-preview.test.ts`) and by `tests/ux/authoring-ergonomics.spec.ts`'s
  "Ctrl Alt P previews the lesson, and closing it returns focus…" case.
  Failed-save retry is still unit-only (`lesson-persistence.test.ts`) — no
  browser-level `ux:check` coverage exists for that path yet.
- **Phase 1 (one editing model, one keymap) is done** — see
  `docs/design/lesson-builder-editing-model.md` for the contract and §3/§4
  above for the generated keymap table. Residual gaps from that work,
  deliberately left for later phases or flagged as open questions:
  - The instruction field's `Escape` now always moves to `block` like every
    other field (§3), instead of the old "if empty, collapse back to the
    'Add instruction' button" micro-behavior — a minor UX regression on a
    rarely-used sub-toggle, not restored in Phase 1.
  - Resolved by Phase 2: the explanation editor's local "mark typing mode"
    is gone. `Ctrl+Alt+S/E/N` now act on a selection or the word around the
    caret and nothing is left armed, so Escape has nothing to cancel and
    always means "leave this field."
  - Phase 2 leftover: `editorUndo`/`editorRedo` on `LessonBuilderActions`
    (`builder-context.tsx`, `page.tsx`) no longer have a caller — the
    explanation's Ctrl+Z is ProseMirror's own history. They are harmless but
    dead; remove them with the next pass over the actions surface.
  - Phase 2 leftover: a reducer-driven change to an explanation is ignored
    while that editor holds focus (see the rebuild plan's Phase 2 note).
  - Module reorder (`Alt+ArrowUp/Down` on the drag-handle button) and the
    mobile rail's own `Escape` (closes the disclosure) stay local,
    element-scoped handlers — modules aren't part of `EditingSelection` in
    Phase 1, so they don't fit the keymap's scope model.
  - `resolveFieldElement` (focus.ts) only recognizes a piece as a real match
    when its own `[data-piece]` wrapper exists — fixed during this phase
    after it was found to silently mis-focus a *different* piece's field
    while the real (just-created) one hadn't mounted yet; regression risk
    if a future change reintroduces a "fall back to any field of this type"
    branch for a `pieceId`-scoped selection.
  - `leaveSlide`'s own English-draft commit is skipped for `reason:"blur"`
    transitions (a real native focusout already triggers the field's own
    `onBlur` commit in the same tick, and doubling up on a stale
    `piece.acceptedAnswers` closure produced a duplicated accepted answer —
    caught by `tests/ux/authoring-ergonomics.spec.ts`'s long-alternative
    test). Any future new "reason" should consider whether a natural blur
    also fires in the same tick before assuming `leaveSlide`'s own commit
    is safe to run unconditionally.

## 9. Roadmap

| # | Item | Model | Status |
|---|---|---|---|
| 0a | Consolidate design docs into this file | Sonnet | done |
| 0b | Split `lesson-library-document.css` into per-component files, prune unused selectors and `!important`s, drop process comments | Sonnet | done (Phase 3a, 2026-09-15) |
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
| R2 | Round-2 calm pass: seam "+" ladder → single after-active seam, fix stray full-height blue line, settle resting pair/vocab-table typography, quiet collapsed row chrome, move save status + undo/redo into the left rail, quiet module header | Sonnet | done |
| R3 | Typing latency in a large, many-lesson module: measured with Playwright (12-slide lesson + 30 collapsed siblings), found every keystroke re-rendered every collapsed row (not the open lesson's own slides, which were already isolated per-block); extracted a memoized `LessonRow` (`lesson-library-row.tsx`) and stabilized the callbacks it depends on (`useCallback` on module-move handlers in `page.tsx`, a `lessonsRef` for `deleteBlock`/`deletePiece`/`moveBlock` so they don't need `[lessons]`) — off-field DOM mutation records per keystroke dropped ~5x (≈2300 → ≈450) | Sonnet | done |
| R4 | Walkthrough fixes 1–9 | Sonnet | done |
| R5 | Walkthrough-2 fixes | Sonnet | done |
| R6 | Explanation editor fixes (data loss, paste, lists, mark switching, undo routing) | Sonnet | done |
| R7 | First-run + 760px fixes | Sonnet | done |
| P2 | Phase 2: explanation editor on Tiptap/ProseMirror — schema + markdown round-trip, mark commands via an editor registry, floating toolbar, E1 auto-marking, mark-preserving copy/paste; `serialize-explanation.ts` and all `execCommand`/`Range` code deleted | Opus | done |
| CT1 | "Covers" concept typeahead popover: fixed overlapping/clipped option rows, restyled the active row from a saturated `--accent` fill (read as danger) to a soft primary tint + left rule, added viewport flip and `data-keymap-ignore`, and ranked the search route's results (exact → prefix → word-boundary → substring, ties by priority then length) so e.g. "with" surfaces the standalone preposition before "to work with [somebody]" | Sonnet | done |
| M1 | Merge-integration pass reconciling Phase 1, empty-slide deletion, the HUD restore, typeahead, and Phase 2 landing on top of each other same-day: fixed `lesson-library.tsx`'s `onFocusOut` treating a *resolvable* out-of-root `relatedTarget` (e.g. focus landing in the lesson-preview overlay, a sibling of the builder root) the same as an unresolved one, which wrongly kept the origin slide "active" through Preview and stopped its origin field from ever going stale enough to fall back to the title; updated four tests whose assumptions predated today's changes (a dead-end blur no longer force-exits editing — Phase 1 dropped the rAF/`activeElement` polling that used to do that and has no replacement signal; leaving a still-blank slide via any path, insert included, now deletes it, so tests that created blank sentence/table/explanation slides via the mouse and moved on need to fill them first; the restored `EditingHud` correctly shows whenever `selection.kind !== "none"`, including right after a mouse click back into a resting slide — a pre-HUD assertion of `.editing-hud` count 0 was stale, not a real check) | Sonnet | done |
| E5a | Auto-Covers: suggest "Covers" chips from a lesson's own pairs (`extractLessonPairTerms`/`matchPairTermsToConcepts` in `concept-suggestions.ts`, `POST /api/admin/curriculum/concepts/suggest`, dashed `.is-pair-suggestion` pills in `LessonConceptsField`, `Ctrl+Enter` accepts all, session-only dismissal). | Sonnet | done |
| E3/E5b | Practice pairs proposed from the explanation (`proposePairsFromMarkdown`/`proposedPairsForBlock`, `pair-proposals.ts`) — a sentence/table slide inserted right after an explanation with adjacent `[[es:X]]`/`[[en:Y]]` marks is pre-filled, focused on the first pair's English field, via all three insertion paths (`Ctrl+Alt+Enter`, its type-cycle, the mouse chooser). Pair-field autocomplete (`PairLanguageField`/`usePairFieldAutocomplete`, `pair-field-autocomplete.tsx`): typing ≥2 chars in a Spanish/English pair field offers up to 5 curriculum completions after a 250ms pause, `Tab`/`Enter` fills both fields (when the other was empty) and moves focus to the other field, `Escape` closes the popover only. Reuses the Covers field's `.concept-typeahead-*` CSS. | Sonnet | done |
| E3b/E8 | Chain building (`extendLastSentence`, `Ctrl+Alt+Shift+Enter`, the seam palette's "Extend" choice) and "given" pieces (`LanguageBlock.given?`, `Ctrl+Alt+G`, resting dotted-underline treatment, learner static rendering excluded from progression/completion). Found and fixed live: `lesson-file.ts`'s `normalizeLessonForFile` (every GET read) rebuilt each language block field-by-field and silently dropped `given` — a "given" pair round-tripped fine on disk but reverted to a normal tested blank on reload. Script syntax (`> +`, `> =`) stays open per `lesson-script-grammar.md`. | Sonnet | done |
| E7 | "New lesson like this one": a second header icon, `LessonHeaderActions`' `LayoutTemplate` button (`aria-label="Duplicate structure"`), next to "Duplicate lesson". `duplicateLessonStructure` (`mutations.ts`) inserts a new lesson right after the source — same module bookkeeping as `duplicateLesson` — with the same sequence of slide *types* (a vocabulary table keeps `layout`) but every slide emptied: explanations to `""`, sentence/table slides down to one blank pair (`emptyLanguageBlock`), title reset to `null`. Wired as one `LessonBuilderActions.duplicateLessonStructure(lessonId): string` action (`page.tsx` computes the whole `{lessons, modules, newLessonId}` result from the pure mutation up front, then applies it via the existing `SET_LESSONS`/`updateModules` — no new reducer action, so this shipped without touching `reducer.ts`'s action union). `lesson-library.tsx`'s `duplicateStructure` opens the new lesson and focuses its title, mirroring `startLesson`. See §6 for why the empty skeleton survives `leaveSlide`. | Sonnet | done |
| E4 | Script mode: `parseScript`/`printScript` (`lib/lesson-builder/script.ts`) over the block model per `lesson-script-grammar.md`, property-tested (500 generated lessons + the owner's two real lessons, ids ignored). `Ctrl+Alt+T` (new `lesson`-scope keymap entry) and a quiet "Script ⌥" button (`lesson-document.tsx`) toggle a per-lesson `<textarea>` (`lesson-script-view.tsx`, `editing.ts`'s new `scriptViewLessonId`/`setScriptView`). Leaving the view parses; success dispatches the new `REPLACE_LESSON_BLOCKS` reducer action (one undoable step, since it isn't in `history.ts`'s coalescing set) and closes; errors show inline with line numbers and the view stays open. An empty lesson's tail gains a third quiet "Paste a script…" action that opens the view blank. Does **not** auto-mark explanation text on parse (E1 stays editor-only) — see the note at the top of `script.ts`. | Sonnet | done |
