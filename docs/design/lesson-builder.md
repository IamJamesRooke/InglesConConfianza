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
  A module can be `kind: "course"` or `"onboarding"`. `description?: string`
  (2026-09-16) is the learner-facing Spanish promise ("what will the learner
  be able to say?"), edited as a quiet single-line field under the title in
  the module's own blue header; absent/empty means no description.
  `status?: "draft" | "published"` (absent = published) hides the whole
  module — and every lesson in it — from `/` and `/practice`
  (`readCourseSummary`); the header shows a `Draft`/`Published` pill (dashed
  border while draft). `access?: "free" | "premium"` (absent = free) is
  stored and shown as a second pill but not enforced anywhere yet (see
  `docs/design/product-vision.md` §4/§6). The header's icon cluster also
  carries a "Generate audio" (`AudioLines`) button that generates any
  missing clips for the module's lessons on demand — see
  `docs/design/speech.md` "Generating clips".
- **Lesson** — a titled sequence of slides (`Lesson.blocks`). Lessons render
  as collapsible rows inside their module. `status?: "draft" | "published"`
  (absent = published, 2026-09-16) hides the lesson from `/` and `/practice`
  the same way a draft module does; the row's icon cluster carries an
  `Eye`/`EyeOff` toggle (`Ctrl+Alt+V`, lesson scope — `Ctrl+Alt+D` was
  already "finish lesson") and a draft lesson's title carries a small dashed
  "Draft" tag. `notes?: string` is teacher-only free text (why this lesson
  exists, what to fix) that survives load/save/import/export but has no
  builder UI yet — never shown to learners.
- **Slide** (called `block` in code, `LessonBlock`) — one of three types:
  - **Explanation** — a rich-text note (`ExplanationBlock.contentMarkdown`),
    edited in Tiptap/ProseMirror over a four-node, three-mark schema
    (`explanation-schema.ts`) and serialized to a constrained Markdown
    dialect by `explanation-markdown.ts` (Phase 2, 2026-09-15). An `en` mark
    can carry a pronunciation bridge for its generated voice-track clip
    (`[[en:different|DIFF-rent]]`, the `Lang` mark's `bridge` attribute) —
    edited via a "Pronunciation" field that appears in the mark popover
    whenever the caret sits inside an `en` mark (see §5). Learners see it
    rendered small after the word, never in the authored dialect's raw
    brackets. See `docs/design/speech.md` "Explanation voice track" for the
    generator/SSML side and `docs/design/student-experience.md`
    "Explanation audio" for the learner-facing playback.
    A run can also be marked **audio only** (`[[audio:…]]`, the `audio`
    mark — so the schema is four nodes and *four* marks as of 2026-09-17):
    text the narrator SAYS and the learner never SEES, e.g.
    `[[es:cosa]] es [[en:thing]][[audio:, T-H-I-N-G, [[en:thing]]]]`. Like
    bold/italic it can wrap runs containing `es`/`en` marks, and a token
    written `T-H-I-N-G` is spelled out letter by letter in the USA voice.
    `Ctrl+Alt+A` toggles it (§3/§4); the builder shows it dimmed with a
    dotted underline and a small speaker marker (§5), and the learner
    renderer drops it from the text entirely. See `docs/design/speech.md`
    "Audio-only marks".
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
  concepts a lesson teaches, tagged by hand from the compact field under the
  slide list via `LessonConceptsField`, which always renders in full (see
  §5, "Covers never collapses" and "Covers reads as the end step"). The same
  flat list is displayed split into two **fully derived** groups — never a
  teacher choice, since reordering lessons must reshuffle the split
  automatically (owner, 2026-09-17): **Introduced** (this lesson is this
  concept's first-ever appearance in the course) and **Reviewed** (it
  already appeared in an earlier lesson) — `syllabus.ts`'s
  `introducedAndReviewedForLesson`, fed by the same course-timeline
  machinery (`buildCourseTimeline`) the module syllabus card's own "Also
  taught"/"Reviewed" split uses, just applied per-lesson. A lesson with
  Covers concepts, in a course that has taught something before it, but
  reviewing none of it, shows a small "⚠ no review" warning next to the
  "Reviewed" eyebrow — never on a fresh course's first lesson, which has
  nothing to review yet (`priorConceptsExist`). One shared add-input still
  tags into the flat list; the derived split decides which eyebrow a
  concept lands under, and it moves automatically if the course changes
  around it. One suggestion source feeds the field, and it never writes to
  the lesson on its own:
  - **Suggested review** (amber, `Snowflake` icon, dashed pill) — cold
    concepts from earlier lessons that haven't reappeared recently
    (`suggestConceptsForLesson`, `concept-suggestions.ts`). This is module
    planning (which cold concepts to revisit), not derived from this
    lesson's own pairs, so it's unaffected by the "nothing guesses" decision
    below.
  - **Auto-Covers from a lesson's own pairs was removed 2026-09-17** (see
    §6, "While writing slides, nothing guesses") — a sentence pair naming
    "querer"/"to want" no longer offers itself as a Covers suggestion; the
    teacher tags it by hand.
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
keymap (`web/src/lib/lesson-builder/keymap/`, `index.ts` assembling one table
per scope from `title.ts`/`explanation.ts`/`pair.ts`/`block.ts`/`lesson.ts`/`page.ts`/`shared.ts`): a table of `scope × chord →
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
| `explanation` | `Ctrl+Alt+A` | Toggle **audio only** on the selection, or on the word around a collapsed caret — the `audio` mark, serialized `[[audio:…]]`. Spoken by the narrator, never rendered to the learner. `A` was the only free letter in this scope's `Ctrl+Alt` lane. |
| `explanation` | `Ctrl/⌘+B` / `Ctrl/⌘+I` | Registered as no-ops that return false, so Tiptap's own `Mod-b`/`Mod-i` toggle bold/italic. Documented here so the table is the whole scope. |
| `block` | `Enter` / `Space` | Enter editing: focus the slide's first field. |
| `block` | `Escape` | Fully deselect (`selection → none`): no rail, no chrome, focus parks on the builder root with no visible ring. Two Escapes from a field reach this — field → block → none. |
| `block` | `Ctrl+Alt+Enter` | Insert the predicted type after this block and focus it (explanation → sentence; sentence/vocabulary → explanation). A second `Ctrl+Alt+Enter` within 1.5s, while the just-inserted block is still empty, cycles its type instead (explanation → sentence → vocabulary → …). Also reached from every field scope (Ctrl+Alt+Enter isn't registered per-field). |
| `block` | `Ctrl+Alt+Shift+Enter` | E3b "extend": insert a new sentence slide after this block, copying the nearest preceding sentence slide's pieces (deep-copied, terminal punctuation stripped from the copied last piece in both languages) plus one new empty pair, focused. With no preceding sentence slide to copy, degrades to a plain empty sentence. Also reached from every field scope, same as `Ctrl+Alt+Enter`. |
| `block` | `Ctrl+Alt+ArrowUp` / `ArrowDown` | Move this block up/down. Also reached from every field scope. |
| `lesson` | `Ctrl+Alt+D` | Finish this lesson: fully deselect, collapse it, flush any pending save. Reached from title, block, and every field scope. |
| `lesson` | `Ctrl+Alt+V` | Toggle this lesson's draft/published status (2026-09-16). Reached from title, block, and every field scope. |
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
  (E5b's pair-field autocomplete popover and the Covers input's `Ctrl+Enter`
  "accept every suggestion" chord were removed 2026-09-17 — see §6, "While
  writing slides, nothing guesses.")
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
| `Ctrl Alt A` | In an explanation: audio only — the narrator says it, the learner never sees it. |
| `Ctrl Alt ↑` `↓` | Move the active slide up or down. |
| `Ctrl Alt ↑` `↓` (from a lesson's title) | Move the lesson within its module, or across a module boundary at the top/bottom of the list. |
| `Ctrl Alt D` | Finish this lesson (collapse it). |
| `Ctrl Alt V` | Toggle this lesson's draft/published status. |
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

`Ctrl Alt T` (any field/block/title in a lesson) or the `</>` icon in the
lesson row header's icon cluster (next to Preview/Duplicate/Delete; moved
there 2026-09-15, was previously in the document body) toggles a monospace
`<textarea>`
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
  query). Not tied to entering editing. An explanation slide gets a fourth,
  leading icon here — "Listen" (`Volume2`) — that plays the explanation's
  generated voice-track clip (`explanationClipUrl`, keyed by exact
  markdown) when one exists; disabled with a "Generate audio first (npm run
  audio:generate)" tooltip when it doesn't. Sentence/vocabulary slides never
  get this icon.
- **Pronunciation field**: the floating mark toolbar (`.authoring-format-
  menu`, the Spanish/English/Normal/B/I buttons) also opens — with only the
  Pronunciation field, no language/bold/italic buttons — when the caret
  merely sits inside an existing `en` mark with nothing selected, not only
  on a real selection. A plain text input, not a chord: it reads/writes the
  `en` mark's `bridge` attribute on blur or Enter, extending a collapsed
  caret to the whole marked word first (`setExplanationBridge`, mirroring
  how the language chords already treat a collapsed caret as "the word
  here").
- **Audio-only runs are visible to the teacher, quietly** (2026-09-17,
  `explanation-editor.css`): a `[[audio:…]]` run renders as
  `<span data-audio>` in `--ink-muted` at 80% opacity with a dotted
  underline (not the solid one a link would carry), preceded by a 12px
  speaker marker. The marker is a `::before` box filled with `currentcolor`
  and masked by an inline SVG (a lucide `Volume2` outline) — not an emoji,
  which would drag a colour font's own palette into a surface that owns its
  colour tokens, and not an `<img>`, which wouldn't dim with the text. No
  literal colour appears in the rule; it inherits and therefore works in
  either theme. The learner never sees any of this: `PracticeMarkdown`
  strips the whole run (nested `es`/`en` marks included) before rendering.
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
- **One text column, one left edge** (Phase 3b): `.lesson-document-body`'s
  measure is `40rem`; explanation, sentence pairs, vocabulary rows, the
  instruction line and Covers all start 13px in from the document body's
  own left edge (`.lesson-document-block`'s 8px padding + the 5px the
  sentence/table pieces already used) — `.lesson-document-tags` carries its
  own `padding-left: 13px` to match, since it sits outside the block
  wrapper. Block chrome (drag/duplicate/delete, the seam "+") stays in the
  gutter created by `.lesson-document`'s own left padding, never over the
  text column. Vocabulary tables are left-aligned, not centred
  (`.lesson-document-sentence-body.vocab-table` is `align-items:
  flex-start`, not `center`).
- **Explanation slide**: a quiet grey block, resting and editing alike —
  `background: var(--muted)`, `border-radius: 6px`, `padding: 10px 14px`, no
  border and no left rule (owner, 2026-09-16 — replaced the earlier 2px
  `var(--primary)` left-rule treatment, which read as a focus/accent signal).
  Blocks are separated by rhythm, not boxes: `.lesson-document-block` carries
  `padding-block: 6px` (12px total between adjacent slides), which replaced
  the explanation's own `margin-block`. No focus glow of its own; the
  slide-level blue bar carries the focus signal.
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
- **Resting pair typography** (round 2, item C; colour rule rewritten
  2026-09-17 — **colour is language**, and the document shows the author what
  the learner will see, so the 2026-09-16 "both lines plain ink" treatment is
  retired): a composed sentence slide's own two lines
  (`.lesson-document-sentence.resting .lesson-sentence-composed[lang="es"|
  "en"]`) are Spanish `color: var(--lesson-hl-es); font-weight: 700;
  font-size: 17px` and English `color: var(--lesson-hl-en); font-weight: 600;
  font-size: 17px` — same size, **no italics anywhere** — with 6px between
  pairs and 2px between a pair's own two lines. A vocabulary table's own
  unfocused rows follow the same rule through a separate selector — tables
  never get the `.resting` class (there's no separate resting/editing
  presentation for a table, per `sentence-editor.tsx`) — at
  `.lesson-sentence-presentation-row span[lang="es"|"en"]`: Spanish
  `var(--lesson-hl-es)` 600/17px, English `var(--lesson-hl-en)` 600/15px.
  Editing fields, explanation marks, and the active vocab-table row keep the
  same always-on red/blue ink from the bullet above — one palette everywhere,
  matching docs/design/learner-direction.md's "Colour, by role".
- **Small caps, weight 600 — explanation marks only** (owner correction,
  2026-09-17: an earlier pass put this on resting sentence pairs and
  vocabulary rows too and was wrong): only `.lesson-document-explanation
  mark[data-language]` carries `font-variant-caps: small-caps; font-weight:
  600; letter-spacing: 0.05em;`. Resting sentence pairs and vocabulary rows
  in sentence-presentation.css keep their original weights (700s above).
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
- **Instruction line as an eyebrow** (Phase 3b): the resting instruction
  (`.lesson-sentence-presentation-instruction`) and the editing prompt field
  (`.lesson-document-prompt`) both render 12px, `font-weight: 700`,
  `letter-spacing: 0.08em`, `text-transform: uppercase`, `var(--muted-
  foreground)` — the `text-transform` is CSS-only, so the stored
  `promptText` itself keeps whatever case the teacher typed.
- **Covers never collapses** (owner, 2026-09-16 — reverses the Phase 3b
  "quiet line at rest" rule): `LessonConceptsField`'s compact Covers field
  (`coversFor` set) always renders the full line — tagged pills and the
  add-input — with no summary/expand state (`covers-summary.tsx` and its
  `data-covers-summary` button are gone). Pair-derived Auto-Covers
  suggestions were removed 2026-09-17 (§6) — the field's only suggestion
  source now is "Suggested review" (module planning, unaffected).
  The add-input (`.lesson-concept-add`) is borderless at rest, gaining a
  border only on `:focus-visible`, with a fixed "Add concept…" placeholder
  (same wording regardless of whether the lesson already has concepts).
  Priority dots (`.lesson-concept-chip[class*="role-"]::before`) only
  render when the lesson's own concepts don't all share one curriculum role
  — `.lesson-concepts-row[data-roles-uniform="true"]` (set from the tagged
  concepts' resolved roles) hides them when every chip would show the same
  dot.
- **Linked concept pills stack English over Spanish** (owner, 2026-09-16):
  every pill backed by a curriculum concept — the syllabus card, a lesson's
  Covers field compact chips, and the "Add from Level…" picker rows — renders
  the English target as a full-ink 12px top line and the Spanish below it as
  an 11px `var(--muted-foreground)` line (`ConceptPillLabel`,
  `concept-pill-label.tsx`), replacing the old one-line `spanish → english`
  with the `→` CSS `::before`. No arrow. The level dot and the remove ×
  stay pinned to the top (English) line (`.lesson-concept-chip:has(.lesson-
  concept-pill-label)` switches the chip to `align-items: flex-start`);
  `[bracketed]` placeholders recede on both lines. A freehand pill (no
  concept) stays single-line plain text. Learner-facing pills
  (`components/learner/concept-pills.tsx`) are unaffected — separate
  component, separate audience.
- **Module syllabus pills** (round 2, item A — `syllabus-panel.tsx`;
  regrouped 2026-09-16, ninth group added round 3): Main/Review group under
  `.syllabus-pos-eyebrow` headings in a fixed order — People, Verbs,
  Sentence patterns, Connectors, Prepositions and phrases, Time and place,
  Things and describing words, Determiners, Untagged — each a rule over a
  concept's full `pos:*`/`grammar:*`/`construction:*`/`topic:*` collection
  set with explicit match precedence, not just its first `pos:*` token
  (`syllabus-groups.ts`); grouping is render-only, so drag and `Ctrl Alt`
  moves still walk the flat list. The Main list's own add control
  (round 3, item 1) is a full-width static input above the "Main teaching
  points" eyebrow (`.syllabus-main-add-row`/`.syllabus-main-add`), sharing
  the Covers field's `.lesson-concept-add` sizing/focus behaviour but with a
  visible hairline border at rest, not that field's fully borderless resting
  state — it is the card's primary control; Review keeps its own small
  trailing add field where it always was. Each pill carries the Covers
  field's 6px `role-*` level dot (hollow for Unranked), named in its `title`
  and in the card-foot legend; the header adds "· N unranked". `is-uncovered`
  is now a plain hairline (dashed = `is-missing`), `is-covered` adds a check,
  `[brackets]` recede, and the progress bar paints only once the module
  has a lesson (the 3px track stays in the layout while idle — unmounting it
  made the whole lesson list jump when the first lesson landed).
- **Freehand "Covers" concepts render dashed** (§9 item R5): a concept chip
  with no `conceptId` (typed and accepted but not matched to anything in the
  curriculum database) gets `border-style: dashed` — `.lesson-concept-chip.is-freehand`
  in `lesson-concepts-field.css`, the same visual language as a `is-missing`
  chip (`is-uncovered` stopped being dashed in round 2, item A) — plus `title="Not in the curriculum —
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
- **One visual language for bilingual marks, but only for marks** (owner,
  2026-09-16, colour restored 2026-09-16; scope narrowed 2026-09-16): a
  Spanish `<mark data-language="es">` is bold `var(--lesson-hl-es)` with no
  underline, an English one is italic theme `--primary` blue with no
  underline (`practice-responsive-overrides.css`'s shared `.learner-theme
  mark`/`.practice-markdown-content mark` rule, mirrored in
  `explanation-editor.css`).

  **Superseded 2026-09-17**: the treatment is no longer mark-only. Colour is
  language everywhere — a resting sentence slide's two lines and a vocabulary
  table's rows carry the same red/blue as the marks, and no line is italic;
  see "Resting pair typography" above and
  docs/design/learner-direction.md's "Colour, by role".

- **Header polish round (owner, 2026-09-16, cosmetic lane)**: five small
  fixes to the module list's top chrome.
  - Syllabus coverage meter moved off the card's bottom edge (where it used
    to cross the rounded corner at narrow widths) into a small `60×3px`
    fully-rounded inline meter right after the "Main 7/37 · Review 0/0 ·
    Also taught 0" summary text, in the collapsed header
    (`.syllabus-card-meter`/`.syllabus-card-meter-fill`, replacing
    `.syllabus-card-progress`).
  - `.lesson-library-module-pill` (Published/Free) toned down: text at 75%
    `--primary-foreground`, border at 35% (55% when `aria-pressed`),
    letter-spacing `0.04em`; `.lesson-library-module-description-row` is now
    `align-items: baseline` so the pills sit on the same text baseline as
    the description placeholder.
  - `.lesson-library-module`'s own border removed; `.lesson-library-module-meta`
    (header) now borders itself in its own fill colour so it bleeds cleanly
    to the card edge, and `.lesson-library-list` (body) carries the hairline
    border instead (bottom/left/right, `border-radius: 0 0 14px 14px`) —
    fixes the double-edge the header used to show against the card's
    lighter-blue outline.
  - Lesson row indent: `.lesson-document-drag` (the drag handle) is now
    `position: absolute`, hover/`:focus-within`-only via `visibility`
    (not just `opacity`, so it's not hit-testable while hidden), taking no
    layout space at rest. `.lesson-library-row-head` padding-left dropped
    `28px → 18px` so the chevron sits close to flush in the row's own
    padding and the title starts ~44px in (was ~90px).
  - `SyllabusPanel` moved from its own rounded card above the module card
    into the module card itself, as a square full-width band between the
    header and the lesson list (`header → syllabus band → lesson rows →
    Add lesson`); `.syllabus-card` lost its own `border-radius`/`box-shadow`
    and now borders like `.lesson-library-list` does (hairline,
    `border-top: 0`). `tests/ux/geometry-corners.spec.ts`'s dedicated
    `.syllabus-card` corner check was retired as moot (no radius left to
    violate); the `.lesson-library`-rooted walk still covers the module
    card's own corners, which the band now sits inside.

- **Module description input is regular weight, italic only as a
  placeholder** (owner, 2026-09-16, cosmetic lane): `.lesson-library-
  module-description`'s own `font-style: italic` was dropped from the input
  itself — it now lives only on `.lesson-library-module-description::
  placeholder`, so a teacher's typed description renders upright and the
  italic reads purely as "nothing written yet," matching every other
  placeholder in the builder.
- **One left spine** (owner, 2026-09-16, cosmetic lane): `--module-spine`
  (`16px`, set on `.lesson-library-module`, matching `.lesson-library-
  module-meta`'s own `padding-left`) is now the shared left inset for the
  syllabus band's chevron (`.syllabus-card-header`'s `padding-left`), the
  lesson row's chevron (`.lesson-library-row-head`'s `padding-left`,
  including its own `max-width: 900px` override), and the resting
  explanation block's own inner padding (`.lesson-document-block`'s
  `padding-left`, layered on top of `.lesson-document`'s separate 52px/20px
  gutter reserved for the seam's "+" circle — untouched, since that
  geometry is load-bearing for `slide-insert-control.css`). Measured at
  760px: the module title, the syllabus chevron, and the lesson-row
  chevron's own button box all now share `left: 41px` (card edge + 16px).
- **Coverage meter moved to the band's right end** (owner, 2026-09-16,
  cosmetic lane): `.syllabus-card-meter` gained `margin-left: auto` and
  grew from `60×3px` to `96×4px`, pushing it to the far right of the
  collapsed syllabus band's flex row; the `Main N/N · Review N/N · Also
  taught N` summary text stays exactly where it was, immediately after the
  title.
- **Narrow "Modules" disclosure drops the module name** (owner, 2026-09-16,
  cosmetic lane): under 900px, `ModuleNavigatorDisclosure`
  (`module-navigator-disclosure.tsx`) now renders only "Modules" and the
  chevron — the active module's name used to render inline
  (`.module-navigator-disclosure-active`, now deleted from
  `module-navigator.css`) but duplicated the module card's own title right
  below it. The name stays in the button's `aria-label` (`"Modules — <name>,
  expand/collapse"`) for screen readers, who don't get that title as a
  visual confirmation.
- **Covers reads as the end step** (owner, 2026-09-17): a small-caps
  "Covers" eyebrow (`.lesson-concepts-eyebrow`, sharing `.syllabus-group-
  eyebrow`'s size/weight/tracking/case/color with the syllabus card's own
  "Main teaching points"/"Review" eyebrows) sits above the lesson's Covers
  pills; the pills use the same shared stacked label component
  (`ConceptPillLabel`, English over Spanish for a linked concept, single
  line with a dashed border for freehand) and size as the syllabus card's
  own pills, since both already render through `.lesson-concept-chip`. The
  "Add concept…" input moves onto its own line under the pills
  (`.lesson-concepts-add-row`). `.lesson-document-tags`'s top margin dropped
  20px → 12px so the gap above the eyebrow equals one slide's own rhythm
  (`.lesson-document-block`'s 6px+6px padding meeting the next block's) —
  Covers reads as the lesson's own last block, not a separate section set
  apart by extra air. This layout only applies to the lesson's own compact
  Covers field (`coversFor` set, `hideChips` absent); the syllabus panel's
  own embed of the same component (`hideChips`, no `coversFor`) is
  untouched.
- **Covers splits into Introduced/Reviewed** (owner, 2026-09-17): when
  `reviewSplit` is supplied (`lesson-document.tsx`, from
  `actions.getLessonReviewSplit`), the single "Covers" eyebrow becomes two —
  "Introduced" then "Reviewed" — each with its own pill row
  (`.lesson-concepts-row`), priority dots suppressed independently per row
  (`rolesUniformOf`, not the flat list's uniformity). The "Reviewed" eyebrow
  carries a `TriangleAlert` + "no review" warning (`.lesson-concepts-review-
  warning`, same `--destructive` token the syllabus card's own warning count
  uses) when this lesson has Covers concepts, the course taught something
  before it, and none of that is being reviewed here. One add-input still
  serves both groups (`.lesson-concepts-add-row`, unchanged from the
  end-step layout above) — a newly tagged concept lands under whichever
  eyebrow the course timeline says it belongs to.
- **Palette** (owner, 2026-09-17, L0): `web/src/app/globals.css` is the
  ONLY place colour values may live — `scripts/lint-css.mjs` fails the
  build on any literal hex/rgb/hsl/oklch/color() elsewhere. Brand is a
  saturated purple (`--brand-primary`) with a warm coral `--brand-accent`;
  surfaces/ink/border are lavender-tinted; `--lesson-hl-es` (Spanish-flag
  red) and `--lesson-hl-en` (Union Jack royal blue, lightened from
  #012169 for italic legibility) both hold ≥4.5:1 on white and on
  `--surface-subtle`, and en-blue's hue sits 36° from `--brand-primary`
  purple. No dark theme redesign — `.dark` reuses the same hues so it
  can't drift.
- **Site-wide consistency** (cosmetic lane, 2026-09-17): the admin (Lesson
  Builder, `/admin/curriculum`, `/admin/coverage`, the admin header) now
  shares the learner site's card recipe, button recipe, and focus/role
  tokens instead of parallel one-off Tailwind hues — this is alignment, not
  a builder redesign; the document/slide rules above are unchanged.
  - Card/surface recipe applied to the curriculum table's desktop and
    mobile-row containers, the topic sidebar (`curriculum-table-sidebar.tsx`),
    the search/filter and level-progress bands (`curriculum-table-toolbar.tsx`),
    the Coverage page's metric tiles and Teaching Review/matrix panels
    (`coverage-matrix.tsx`), and the Covers "quick-edit" popover
    (`concept-quick-edit.tsx`, `rounded-2xl`/`shadow-2xl` → `12px` radius +
    `--shadow-card`, matching the popover recipe): white, hairline `--border`,
    `--shadow-card`, 16px radius for cards / 12px for the popover.
  - Buttons: the bulk-action bar's destructive action and the quick-edit
    popover's "Yes, delete" confirm moved from a solid red fill to the
    shared destructive recipe (`--destructive` text on white with a hairline
    border); its tinted selection band moved from an ad hoc `bg-primary/5`
    wash to `--surface-subtle`.
  - Removed one-off hues: `coverage-matrix.tsx`'s priority badges
    (`roleClasses`) now reuse the same `.role-P1`…`.role-Trash` tokens as
    the curriculum table's own role select instead of a second, parallel
    red/orange/amber/blue/slate scale; its "cold" badges map to
    `--success`/`--muted`/`--hint`; its Requested/Trashed/Missing rails use
    `--hint`/`--destructive` instead of raw `amber-*`/`red-*`; and
    `concept-quick-edit.tsx`'s error text, unknown-facet tag, and
    delete-confirm controls moved off raw `red-*`/`amber-*` onto
    `--destructive`/`--hint`.
  - Admin header: the active nav pill (`admin-header-nav-link-active`) now
    fills with `--primary` instead of a plain white wash, so "what's
    active" reads as the same purple as the learner site's one accent — the
    header itself keeps its dark ink bar (deliberate admin/learner cue) and
    its brand mark already matched the learner mark (same stones SVG, bare
    variant).
  - Left untouched (in scope for a future pass, not part of this round):
    `authoring-base.css`'s `.authoring-*` classes are effectively dead
    outside `explanation-editor.tsx` (protected by the explanation-block
    rule above) and were not exercised by any current admin page.
  - Site footer (2026-09-17): the dark `--ink-deep` band is now one shared
    component, `src/components/site-footer.tsx` (styles in
    `src/styles/site-footer.css`, imported from the root layout), rendered
    on the learner home and after every `/admin` page's content via
    `src/app/admin/layout.tsx` — never on `/practice`. `variant="admin"`
    swaps the learner reset control for a muted "Admin · Inglés con
    Confianza" line and links to Lessons/Coverage/Curriculum.

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
- **While writing slides, nothing guesses (owner, 2026-09-17).** "Covers" is
  a deliberate step the teacher does by hand at the end of the lesson, not
  something the document infers from what she just typed. This removed
  every automatic guess that used to live inside the lesson document: E3
  (practice pairs proposed from an explanation's `[[es:X]]`/`[[en:Y]]`
  marks), E5b (pair-field curriculum autocomplete), and the pair-derived
  half of Auto-Covers (suggesting "Covers" chips from a lesson's own
  sentence pairs). The Covers typeahead itself stays — it's the teacher
  typing on purpose — but got stricter about not guessing too: `Enter`/`Tab`
  with nothing explicitly arrowed-to only links a concept when the typed
  text exactly matches (accent/case-insensitive) a loaded result's own
  Spanish label; anything else becomes a freehand label rather than a fuzzy
  best guess (see §3's `spanish`/`english` field rows are unaffected — this
  is the Covers input, `concept-typeahead.tsx`). Coverage bookkeeping
  (`syllabus.ts`) tolerates a freehand label that names the same thing as a
  syllabus item under that same normalisation, so a deliberately freehand
  "algo" still counts as covering a linked `{conceptId, label: "algo"}`
  syllabus item — that's not a guess, it's recognizing the same word. The
  "Suggested review" chips (module planning, cold concepts from earlier
  lessons) are unaffected — they were never derived from this lesson's own
  pairs.
- **Covers splits into "Introduced"/"Reviewed," fully derived, never a
  teacher choice (owner, 2026-09-17).** "I think they should be only
  derived, teacher doesn't decide if taught for first time, that's because
  the order of lessons might change." — `introducedAndReviewedForLesson`
  (`syllabus.ts`) computes the split from the course timeline every render;
  there is no UI to override which bucket a concept lands in. "Reviewed
  only has concepts IN THAT LESSON that were present any point earlier in
  the course" — confirmed as the literal definition (not, e.g., "reviewed
  at any point in the module" or "reviewed within N lessons"). "Maybe there
  should be a warning. Because a teacher should always be reviewing old
  material." — the "no review" warning (§5) is that ask; deliberately
  gated off on a course's first lesson (nothing to review yet) rather than
  firing everywhere. Autocomplete/"get suggestions" for which concepts to
  add was explicitly deferred: "LATER we will think about some sort of
  'get suggestions' or 'autopopulate' functionality, but for now, manual" —
  consistent with the "nothing guesses" decision above; not scheduled.
- **"New lesson like this one" (E7, "Duplicate structure") was removed
  2026-09-15: the owner found no use for it.** The action, its mutation,
  its header icon, and its tests are gone; "Duplicate lesson" (full copy)
  is unaffected. The rule below about placeholder slides is retained for
  general slide-lifecycle context. The rule in one line:
  **an untouched placeholder you skip stays; one you enter and leave empty
  goes.**

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
- The explanation scope's HUD legend caps at five chips, so adding the
  fourth marking chord (`Ctrl+Alt+A`, audio only, 2026-09-17) pushed the
  universal `Ctrl+Alt+Enter` "next slide" out of *that* scope's bar. The
  chord still works, is still in the help dialog, and is still shown in
  every other scope; raise `PRIMARY_COUNT` (`editing-hud.tsx`) if the owner
  misses it there.
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
| E5a | ~~Auto-Covers: suggest "Covers" chips from a lesson's own pairs~~ — **REMOVED 2026-09-17**, same owner decision as E3/E5b: see §6, "While writing slides, nothing guesses." | Sonnet | removed |
| E3/E5b | ~~Practice pairs proposed from the explanation~~ / ~~pair-field autocomplete~~ — **REMOVED 2026-09-17**: the owner decided that while writing slides, nothing guesses; see §6. `pair-proposals.ts`, `pair-field-autocomplete.tsx`, and the pair-derived half of Auto-Covers (`isSyllabusEligiblePairMatch`, `matchPairTermsToConcepts`, `extractLessonPairTerms`, the `/api/admin/curriculum/concepts/suggest` route) are deleted outright, along with their tests. A newly inserted sentence/vocabulary slide is always blank; the Covers typeahead's `scope=label` query param is gone (nothing calls it anymore). | Sonnet | removed |
| E3b/E8 | Chain building (`extendLastSentence`, `Ctrl+Alt+Shift+Enter`, the seam palette's "Extend" choice) and "given" pieces (`LanguageBlock.given?`, `Ctrl+Alt+G`, resting dotted-underline treatment, learner static rendering excluded from progression/completion). Found and fixed live: `lesson-file.ts`'s `normalizeLessonForFile` (every GET read) rebuilt each language block field-by-field and silently dropped `given` — a "given" pair round-tripped fine on disk but reverted to a normal tested blank on reload. Script syntax (`> +`, `> =`) stays open per `lesson-script-grammar.md`. | Sonnet | done |
| E7 | "New lesson like this one" ("Duplicate structure") — removed 2026-09-15: owner found no use for it. `duplicateLessonStructure` (`mutations.ts`), its `LessonHeaderActions` icon, wiring, and tests (incl. `tests/ux/duplicate-structure.spec.ts`) were deleted outright. "Duplicate lesson" (full copy) is unaffected. | Sonnet | removed |
| E4 | Script mode: `parseScript`/`printScript` (`lib/lesson-builder/script.ts`) over the block model per `lesson-script-grammar.md`, property-tested (500 generated lessons + the owner's two real lessons, ids ignored). `Ctrl+Alt+T` (new `lesson`-scope keymap entry) and a `</>` icon in the lesson row header's icon cluster (`lesson-library-row.tsx`, moved there 2026-09-15 from `lesson-document.tsx`) toggle a per-lesson `<textarea>` (`lesson-script-view.tsx`, `editing.ts`'s new `scriptViewLessonId`/`setScriptView`). Leaving the view parses; success dispatches the new `REPLACE_LESSON_BLOCKS` reducer action (one undoable step, since it isn't in `history.ts`'s coalescing set) and closes; errors show inline with line numbers and the view stays open. An empty lesson's tail gains a third quiet "Paste a script…" action that opens the view blank. Does **not** auto-mark explanation text on parse (E1 stays editor-only) — see the note at the top of `script.ts`. | Sonnet | done |
| MM1 | Module & lesson metadata — module `description`/`status`/`access` (blue header: quiet description input, Draft/Published + Free/Premium pills), lesson `status`/`notes` (row `Draft`/`Eye`/`EyeOff` toggle, `Ctrl+Alt+V`, dashed "Draft" tag; `notes` has no UI yet, data-only), server-side filtering of draft modules/lessons out of `readCourseSummary` (`/` and `/practice`; coverage/studio surfaces are unaffected and still count drafts). | Sonnet | done (2026-09-16) |
| R2-A | Round-2 syllabus card: part-of-speech groups (`syllabus-groups.ts`, render-only over the flat lists), a `role-*` level dot per pill with tooltip + card-foot legend, "· N unranked" in the header, quiet resting tones (`is-uncovered` hairline, `is-covered` check, receding `[brackets]`), progress bar hidden until the module has a lesson, and group headings + levels in "Copy as text". `ConceptDisplayLookup` gained `collections` (its `pos:*`/`grammar:*`/`construction:*` collection names — originally just the first `pos:*` token, widened 2026-09-16 for the People/Sentence-patterns/Prepositions/Things regrouping), read by `readConceptDisplays` and the concept-search route. | Opus | done (2026-09-16) |
| R2-B | "Add from Level…" on the syllabus card: a quiet text-button next to "Copy as text" opens a portal popover (`syllabus-fill-picker.tsx`, `ConceptQuickEdit`'s pattern) with a level selector (Level 1…Level 5) and that level's concepts not yet claimed by any module's Main or Review list course-wide, grouped by `syllabus-groups.ts` with a level dot per row; `Select all`/`Clear`, "Add N to Main" appends linked `LessonConcept`s in group order, records displays, and focuses the first new pill. New read-only route `GET /api/admin/curriculum/concepts/by-level?role=P1..P5` (same `collections` array_agg subquery as the search route, ordered by `sort_order`, capped at 500); pure exclusion/grouping in `syllabus-fill.ts` (`unclaimedConceptsForLevel`). | Sonnet | done (2026-09-16) |
| R2-C | Syllabus-card regrouping (owner screenshot, 2026-09-16): the old six `pos:*`-only groups (Pronouns/Verbs/Connectors/Prepositions,time,degree/Words/Untagged) dumped facet-tagged pronouns ("conmigo", "que yo [haga algo]", "algo") in with plain "yo"/"me". Replaced with eight groups — People, Verbs, Sentence patterns, Connectors, Prepositions and phrases, Time and place, Things and describing words, Untagged — matched against a concept's full `pos:*`/`grammar:*`/`construction:*` collection set with explicit evaluation precedence (`patterns`/`prepositions`/`things` tested before the broad `people` catch-all; see the header comment and `EVALUATION_ORDER` in `syllabus-groups.ts`). Chose the smaller of the two owner-offered options: widened what `readConceptDisplays`/the by-level and search routes select (all `pos:`/`grammar:`/`construction:` collections, not just the first `pos:`) rather than precomputing the group id server-side, so the existing isomorphic `syllabus-groups.ts` stays the single source of truth for both client and server callers. `ConceptDisplayLookup`/`ByLevelConcept`/the search route's `Row` all renamed `pos` → `collections: string[]`. | Sonnet | done (2026-09-16) |
| QE1 | Fixed: focusing a field inside the `ConceptQuickEdit` popover (a `createPortal` dialog, `[data-keymap-ignore]`) closed the popover — every blur handler that watches "did focus leave X" only checked DOM containment, and the portal renders outside `X`'s subtree. `lesson-library.tsx`'s document-level `focusout` listener (the shared editing selection, `leaveSlide`) was the reproducible case for both a lesson's Covers pill and a module Syllabus-card pill; `LessonConceptsField`'s `collapseIfFocusLeft` had the same blind spot. Added one shared predicate, `isFocusStillInside` (`focus.ts`): true when the target is inside the wrapper *or* inside any `[data-keymap-ignore]` element. Both call sites now use it. The popover also returns focus to its trigger pill on every close path (Cancel/Save/Delete/Escape/backdrop, via a new `closePopover()`; Escape is now handled at all — it previously did nothing). | Sonnet | done (2026-09-16) |
| NG1 | "Nothing guesses" (owner, 2026-09-17): removed every automatic guess inside the lesson document — E3 (pair proposals from explanation marks), E5b (pair-field curriculum autocomplete, `pair-field-autocomplete.tsx`, the search route's `scope=label`), and E5a's pair-derived Auto-Covers (`isSyllabusEligiblePairMatch`/`matchPairTermsToConcepts`/`extractLessonPairTerms`, the `/api/admin/curriculum/concepts/suggest` route) — deleted outright with their tests; "Suggested review" is unaffected (module planning, not pair-derived). The Covers typeahead (`concept-typeahead.tsx`) got stricter instead of removed: `Enter`/`Tab` with nothing explicitly arrowed-to link a concept only on an exact (accent/case-insensitive) match of the typed text against a loaded result's Spanish label, freehand otherwise. `syllabus.ts` coverage/also-taught/warnings tolerate a freehand label naming the same thing as a syllabus item under that normalisation (`freehandMatchesItem`, new optional `conceptDisplays` param on `coverageOfItem`/`alsoTaughtAndReviewed`). Covers block restyled as the lesson's end step: small-caps "Covers" eyebrow (reusing `.syllabus-group-eyebrow`), add-input on its own line, 12px gap above matching slide rhythm (was 20px). | Sonnet | done (2026-09-17) |
| R3 | Round-3 syllabus card: (1) the Main list's own add control moved to a full-width static input above the "Main teaching points" eyebrow (`ConceptTypeahead`'s new `"main-add"` variant, `.syllabus-main-add-row`/`.syllabus-main-add`) — same Covers-field sizing/focus behaviour but a visible hairline at rest, since this is the card's primary control; Review is unchanged. (2) Fixed a real "stale group until reload" bug: `use-lesson-persistence.ts`'s `recordConceptDisplay` compared only spanish/english/role before skipping a display update, so a later record that changed only `collections` — a concept already known elsewhere in the file re-accepted here, or a quick-edit dialog's saved tags — compared equal and was silently dropped (new exported `conceptDisplaysEqual`, unit-tested); the two `ConceptQuickEdit` `onSaved` callers (`syllabus-panel.tsx`, `lesson-concepts-field.tsx`) also used to discard the dialog's saved `collections` outright and keep the old ones — now pass `draft.collections` through. (3) Ninth group **Determiners** (`pos:determiner` or `grammar:quantifier`), rendered after Things/before Untagged; **Time and place** widened to also claim `topic:time` and any `topic:noun-time-*` facet (día's `topic:noun-time-days-periods`); both evaluated before the broad Things/People catch-alls (`syllabus-groups.ts`). | Sonnet | done (2026-09-17) |
| NG2 | Covers splits into derived "Introduced"/"Reviewed" (owner, 2026-09-17): `introducedAndReviewedForLesson` (`syllabus.ts`, unit-tested) reuses the course-timeline machinery `alsoTaughtAndReviewed` already had for the module level, applied per-lesson; `getLessonReviewSplit` threaded through `use-course-modules.ts` → `builder-context.tsx`/`use-builder-actions.ts` → `page.tsx` → `lesson-document.tsx`, same stable-identity pattern as `getSyllabusMarkers`. `LessonConceptsField` renders two eyebrows instead of one when `reviewSplit` is given, sharing the same chip renderer and add-input; a `TriangleAlert` "no review" warning shows on "Reviewed" when the lesson has Covers concepts, the course taught something earlier, and none of it is reviewed here. | Sonnet | done (2026-09-17) |
| NG3 | Bug fix, owner report 2026-09-17 ("'to do' should be reviewed, deleting and re-adding it didn't help"): `freehandMatchesItem` (`syllabus.ts`) only tolerated a freehand *lesson concept* matching a linked syllabus item, one direction — a linked concept matching a syllabus item that was itself tagged freehand fell through to a bare `conceptKey` compare, which never matches (a real conceptId vs. a lowercased label), so no amount of deleting/re-adding the *linked* side could fix it. Made the match direction-agnostic (`candidateLabelsOf`, checked both ways) and widened it to compare a linked concept's English display too, not just Spanish, since a freehand tag can be typed in either language ("to do" vs. "hacer"). Two linked concepts with different `conceptId`s are still never merged by this path. 5 new/updated unit tests in `tests/unit/syllabus.test.ts`. | Sonnet | done (2026-09-17) |
| A1 | Audio-only marks + spoken instruction lines (owner, 2026-09-17). (1) `[[audio:…]]` is a third mark — text the narrator SAYS and the learner never SEES: parser/serializer, a Tiptap `audio` mark rendering `<span data-audio>`, `toggleAudioOnly`, the `Ctrl+Alt+A` chord in the `explanation` scope (the only free letter in that lane; the HUD and help dialog regenerate from `KEYMAP`), a dimmed/dotted/CSS-masked-speaker treatment in the builder (§5), removal from the learner's DOM (`stripAudioOnly` → `PracticeMarkdown`), and SSML that speaks it in full plus spells a `T-H-I-N-G` token letter-by-letter in the USA voice. Script mode needed no change (round-trip test added). (2) A sentence/vocabulary slide's `promptText` is now read by the narrator on slide open: `generate-clips.ts` writes `public/audio/instructions/<sha1>.mp3` and a third manifest key, `instructionClipUrl` resolves it, and `instruction-audio.tsx` (used by both cards) auto-plays, replays and stops on slide change, sharing the session "audio activated" flag with the explanation slide. See `docs/design/speech.md` "Audio-only marks" / "Spoken instruction lines". | Opus | done (2026-09-17) |
