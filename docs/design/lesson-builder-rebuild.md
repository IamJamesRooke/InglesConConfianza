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

### Phase 1 — one editing model (fixes what the owner hit) — DONE 2026-09-15
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
  slide 0). Owner confirmed 2026-09-15 the chooser DID open — the failure was that it
  was not obvious a choice was required; E6 removes the chooser from the keyboard path.
- One-time normalisation on load (`normalizeLessons`): drop pairs whose Spanish, all
  answers and hint are blank (keeping ≥ 1 per slide) — the owner's real lesson already
  carries one such junk pair.
- Tests: command-level unit tests for every chord × selection kind; **four `ux:check`
  flows that end by reading the saved JSON** — finish a pair then Escape /
  `Ctrl Alt Enter` / `Ctrl Alt D` / click-away — plus the owner's literal flow from an
  empty course.
- Model: Fable designs the store + keymap signatures (≤ 150 lines); Sonnet implements.

### Phase 2 — explanation editor on a real engine — **DONE 2026-09-15**
Shipped: `lib/lesson-builder/explanation-schema.ts` (doc/paragraph/text/hardBreak +
bold/italic/`lang`, plus a five-line history extension over `@tiptap/pm/history` — v3
renamed Tiptap's own History package, which is not in the approved dependency list),
`explanation-markdown.ts` (the spike's parser/serializer, property-tested in
`tests/unit/explanation-markdown.test.ts` with a deterministic generator instead of
fast-check), `explanation-commands.ts` (the editor registry the keymap's
`explanation`-scope commands resolve by blockId), `explanation-e1.ts` +
`explanation-classifier.ts` (E1, shipped ON), and a rewritten
`components/lesson-builder/explanation-editor.tsx`. `serialize-explanation.ts`,
`normalizeEditorDom` and every `execCommand`/`Range` call are gone (~640 lines).
`markdown.ts` stays: it is the learner renderer's parser, not the old editor's.

E1's classifier (`isEnglish`) is deliberately conservative, since a wrong auto-mark
costs more than a missed one: the right-hand side must contain at least one word from a
small built-in English function-word list, and at least 60 % of its words must be
English-ish (in the English list, or in neither list — an unknown content word doesn't
veto, a known Spanish word does). So "Quiero es I want." marks, "El libro es rojo."
stays neutral, and "hacer es to do, dos palabras" is a deliberate false negative. E2
replaces the lists with the curriculum word sets.

Two contract notes for Phase 3: the dispatcher now calls `stopPropagation()` on handled
chords (spike finding), and an explanation whose editor is focused ignores incoming
`contentMarkdown` props — inside an explanation the text history is ProseMirror's, so
the reducer has nothing legitimate to push into a focused editor, and re-setting content
on a lagging prop drops keystrokes.

- Tiptap (ProseMirror) with a five-node schema: paragraph, bold, italic, `es` mark,
  `en` mark; hard break; no lists unless the owner wants them. A Markdown serializer
  with **round-trip property tests** (parse → serialize → parse is identity).
- Delete `serialize-explanation.ts` DOM walking, `normalizeEditorDom`, `execCommand`,
  caret-offset restore. Toolbar shows only with a non-collapsed selection (the current
  `data-has-selection` gates nothing).
- Owner-reported bug 2026-09-15 (acceptance test, not a patch to the old editor):
  **"Normal" must remove a language mark and B/I must toggle, both at a caret inside a
  marked word and on a selection, from the toolbar (mousedown must not drop the
  selection) and from `Ctrl Alt N` / `Ctrl B` / `Ctrl I`.** Spike found: the keymap
  dispatcher must `stopPropagation()` on handled chords so Tiptap's own keydown never
  sees them. Spike artefacts: scratchpad `tiptap-spike/` (`SPIKE.md`, schema,
  round-trip + input-rule tests); packages `@tiptap/{core,pm,react,extension-document,
  extension-paragraph,extension-text,extension-hard-break,extension-bold,extension-italic}@3.31.3`,
  not starter-kit; 92 kB gzip. Model: **Opus** for the integration (editor ↔ selection
  store ↔ keymap is the judgement-heavy seam), Sonnet for the serializer port and tests.
- This adds a dependency (~100 kB); it is the one deliberate exception to the
  "no new editor framework" rule, because hand-rolled contentEditable is where the data
  loss was and will be again.
- Model: Sonnet.

### Phase 2.5 — authoring at typing speed
E3 pair proposals, E4 script mode (parser + serializer over the block model, round-trip
tested), E5 curriculum autocomplete + auto-Covers, E7 templates. See the Ergonomics
section. Model: Sonnet; Fable writes the script grammar.

### Phase 3a — one stylesheet per component, geometry cleanup — DONE 2026-09-15
- The old `library.css`, `document.css`, `explanation.css`, `sentence.css`,
  `insert.css`, `script.css`, `concepts.css`, `hud.css`, `module-navigation.css`
  are deleted; replaced by one file per component, imported from `layout.tsx` in the
  same cascade order: `lesson-library.css`, `lesson-row.css`, `module-navigator.css`,
  `lesson-document.css`, `explanation-editor.css`, `sentence-editor.css`,
  `sentence-presentation.css`, `slide-insert-control.css`, `lesson-script-view.css`,
  `lesson-concepts-field.css`, `keyboard-help.css`, `editing-hud.css`, `print.css`.
  All "delimited revert blocks" (F, N, 6, 1b) resolved into one declaration per
  top-level selector per file — folded to the winning computed result of the old
  cascade, verified against a pixel diff, not just read off the last block.
- Corner fix (diagnostic §2, root cause 3): `.lesson-library-module-meta`'s
  border-bottom radius now matches `.lesson-library-module`'s own 14px exactly, and
  `.lesson-library-row:last-child > .lesson-document` gets a matching
  `border-radius: 0 0 14px 14px`. Fixed via matching radius on each flush child's own
  box, **not** by adding `overflow: hidden` to the card — `.lesson-library-module`
  keeps `overflow: visible`, so nothing that must escape it (the concept typeahead
  popover, the editing HUD, the selection toolbar) is put at risk of being clipped.
- `scripts/lint-css.mjs` (`npm run lint:css`, wired into `npm run lint`) fails the
  build on a duplicate top-level selector in one file, `!important` outside
  `print.css`, or a `styles/lesson-builder/*.css` file nothing imports; warns
  (doesn't fail) on a lesson-builder TSX class with no matching rule anywhere in
  `styles/lesson-builder/` — noisy by design, since some of those classes are styled
  in `globals.css` instead (`.concept-suggestion`, `.lesson-document-tail` is simply
  unstyled by design).
- Verified: 273/273 unit tests, `tsc --noEmit` clean, `npm run lint` clean (CSS lint
  included), `npm run build` clean, `npm run ux:check` green (one pre-existing,
  unrelated failure carried over from before this pass — the "Edit as script" `</>`
  icon button is 15×21, under the 24×24 click-target floor; reproduces at HEAD
  `7a51dcc7`, not a Phase 3a regression, flagged for a follow-up task not this one).
- Model: Sonnet for the model, Haiku for the mechanical moves.

### Phase 3b — behaviour-first tests, remaining geometry review — pending owner
- Replace geometry assertions in `tests/ux` with behaviour assertions; keep one visual
  regression screenshot per surface at 760 and 1280 as a diff, not as px assertions.
- Owner-reported 2026-09-15: the drag/duplicate/delete cluster sits on top of the grey
  explanation card (white icon box over grey). Resolved by construction: the
  explanation is no longer a card, and block chrome lives in the gutter outside the
  text column, never over content.
- Follow-up carried from 3a: the "Edit as script" `</>` icon button fails the 24×24
  click-target floor (currently 15×21) — `tests/ux/accessibility.spec.ts:118`.
- Model: Sonnet for the model, Haiku for the mechanical moves.

### Phase 4 — process
- Every change to the builder ships with: the owner's literal from-zero flow green,
  saved-JSON assertions green, and a 760/1280 screenshot pair for the owner.
- `lesson-builder.md` shrinks to the editing model + keymap table + geometry rules;
  behaviour tables that merely describe accumulated code are deleted.

## Ergonomics — authoring at typing speed (owner brief 2026-09-15)

The teacher's main workflow is "hacer es to do" → a practice pair → next. Today that
costs: type, select "hacer", mark Spanish, select "to do", mark English, `Ctrl Alt
Enter`, `S`, retype "hacer", Tab, retype "to do", Tab, then hand-tag six concepts.
Target: **authoring speed = typing speed**. Principles: never mark what the machine can
infer; never type the same text twice; the keyboard never leaves the home row for a
common action; everything inferred is visible, predictable, and one `Ctrl Z` away.

### E1. Auto-marking from the "X es Y" pattern
The method's explanations are overwhelmingly `<spanish> es <english>` (also
`significa`, `=`, `→`). When a line matches the pattern, mark the left side Spanish and
the right side English automatically — as an editor **input rule** (Phase 2 makes this
a 20-line ProseMirror rule), applied when the sentence terminator or Enter is typed,
never mid-word. The pattern only fires when the right side is detected as English (E2),
so "El libro es rojo." stays neutral. `Ctrl Z` undoes the marking alone.

### E2. Language-aware ink without chords
We own a 4,000-concept bilingual dictionary. Classify each completed word: Spanish set /
English set / ambiguous (`no`, `me`, `a`, proper nouns) — colour only unambiguous words,
and only once the word is complete (no flicker). The three mark chords become
*overrides*, not the normal path; an override on a word is remembered per lesson. Goal:
≥ 90 % of explanations need zero marking chords. Ship behind a per-teacher toggle; keep
the manual path intact.

### E2b. Multi-selection marking (owner ask 2026-09-15) — not possible, superseded
Ctrl-selecting several ranges and marking them at once is impossible in Chrome
(no discontiguous selections in editable content; ProseMirror follows the browser).
Served instead by: E1/E2 auto-marking (nothing to select), word-at-caret marking
(`Ctrl Alt S/E/N` with a collapsed caret marks the word — repeat with `Ctrl →`), and a
**mark-all-occurrences** command (`Ctrl Alt Shift S/E`: every occurrence of the word
under the caret in this explanation) in Phase 2.5 if auto-marking leaves a need.

### E3. Practice pairs proposed from the explanation — done 2026-09-15
Shipped: `proposePairsFromMarkdown` (pure, `pair-proposals.ts`) reads the preceding
explanation's stored Markdown directly for `[[es:X]]` immediately followed by
`[[en:Y]]` — allowing only the connective word "es"/"o", punctuation, and whitespace
(including a paragraph break) between marks, so "algún o alguna es some" proposes two
pairs sharing the trailing English. `proposedPairsForBlock` gates this to "a new
sentence/vocabulary-table slide landing immediately after an explanation slide" and is
called from all three insertion paths — `Ctrl+Alt+Enter` predicted-type insertion and
its 1.5s type-cycle (`keymap.ts`'s `insertAfterBlock`), the seam palette, and the mouse
chooser (`lesson-document.tsx`'s `add`) — never on a fresh explanation-type insertion.
`addBlock` (`builder-context.tsx`/`page.tsx`) now returns `{blockId, firstPieceId}`
(ids generated by the caller, not the reducer, so they're known synchronously);
`selectionForInsertion` (`keymap.ts`) selects the first pair's English field when pairs
were proposed, so `Enter`/`Tab` walks through accepting each one, same as any other
pair. `leaveSlide` needs no change: a proposed pair has real content (Spanish + English
text), so it's never pruned as an empty trailing pair — a slide the teacher leaves
untouched right after insertion is kept. Unit tests: `tests/unit/pair-proposals.test.ts`
(the three real examples plus unbalanced-mark/English-first/comment-after edge cases).
UX: `tests/ux/pair-proposals.spec.ts`.

### E3b. Chain building (from the owner's real lesson, 2026-09-15) — done 2026-09-15
Shipped: `extendLastSentence` (`mutations.ts`), the `EXTEND_LAST_SENTENCE` reducer
action, and `Ctrl+Alt+Shift+Enter` (title/block scope, reached from every field via
the usual scope fallthrough) — a new sentence slide right after the current one,
copying the nearest preceding sentence slide's pieces (deep copies, fresh ids;
terminal punctuation stripped from the copied last piece in both languages) plus one
new empty pair, focused. With no preceding sentence slide it degrades to a plain
empty sentence, same as `Ctrl+Alt+Enter`'s predicted-sentence case. Mouse path: the
seam palette (`SlideInsertControl`) gains a fourth "Extend" choice, shown only when
the seam's preceding block is a (non-table) sentence. Script syntax (`> +`) stays
open — this is only the block-model half; `lesson-script-grammar.md` already
specifies the syntax.
The owner's lesson "I want to do something today." shows the method's practice is
cumulative: `Quiero / I want` → `Quiero · hacer · algo.` → `Quiero · hacer · algo · hoy.`
Each recombination currently retypes every earlier piece. Add **extend the last
sentence**: a command (and script syntax `> + hoy / today`) that creates a new sentence
slide = previous sentence's pieces + the new piece(s), moving terminal punctuation from
the old last piece to the new one. Tables in this method are *contrasts* introduced by
an instruction line ("Veamos la diferencia.") — script syntax: a line ending in `?`
or `:` before `|` rows becomes the instruction. Every explanation in the lesson is
`[[es:X]] es [[en:Y]]` + optional Spanish comment — E1 covers 100 % of them.

### E8. "Given" pieces — shown, not tested (owner ask 2026-09-15) — done 2026-09-15
Shipped: `LanguageBlock.given?: true` (absent = tested, back-compat preserved through
both `normalizeLessons` and `parseLessonFile`'s read-time normalization — the latter
was found dropping the flag on every read, since it rebuilds each language block
field-by-field; fixed in `lesson-file.ts`); `toggleGiven` (`mutations.ts`) bound to
`Ctrl+Alt+G` in the spanish/english field scopes. Builder: a muted "given" pill next
to the pair while editing (`sentence-editor.tsx`); the resting composed view renders
the given piece's English in normal weight with a dotted underline and a title
tooltip (`sentence-presentation.tsx`). Learner: `SentencePracticeCard` renders a
given piece as static Spanish/English text with no input, excluded from Tab/Enter
progression and from `isComplete` (verified live: a 4-piece chain with a trailing
given "…" piece completes on the 3 testable answers alone). Script syntax (`> = es /
en`) stays open, per `lesson-script-grammar.md`.
Some pieces of a sentence (an ellipsis "…", a name, a number) must be visible to the
student but never asked for. Add `LanguageBlock.given?: true`: the learner renders it as
plain text (Spanish and English both shown) and skips it in progression/completion; the
builder toggles it with `Ctrl Alt G` on the pair (and a small "given" tag in the
resting view); script syntax `> =… / …`. Back-compat: absent = tested. Lives in Phase
2.5 with chain building (same files: model, learner card, script grammar).

### E4. Script mode — type the whole lesson as text — done 2026-09-15
Shipped: `lib/lesson-builder/script.ts` (`parseScript`/`printScript`,
property-tested against 500 generated lessons and the owner's two real
lessons), `components/lesson-builder/lesson-script-view.tsx`, the
`REPLACE_LESSON_BLOCKS` reducer action, `editing.ts`'s
`scriptViewLessonId`/`setScriptView`, and the `Ctrl+Alt+T` `lesson`-scope
keymap entry. See `docs/design/lesson-builder.md`'s "Script mode"
subsection for the surface and `lesson-script-grammar.md` for the grammar
itself (unchanged by this pass). Auto-marking (E1) deliberately does not
run on parse — explanation text round-trips verbatim, marked or not.

The fastest authoring surface is a plain text stream with a tiny syntax, losslessly
convertible to and from the block model:

```
hacer es to do
> hacer / to do
> Quiero hacerlo. / I want to do it
hacerlo es to do it, tres palabras
| poder / to be able
| hablar / to speak
Veamos la diferencia.
> Quiero poder hablar. / I want to be able to speak
```
Plain lines = explanation paragraphs (blank line = new explanation slide); `> es / en`
= a practice pair (consecutive `>` lines = one sentence slide; `/` inside the English
half = alternatives, `(hint)` at the end = hint); `| es / en` = vocabulary rows; a line
ending in `:` = instruction for the following practice. Paste a whole script from notes
→ a lesson. The block view stays the polishing surface; the script is the drafting
surface, toggled per lesson (`Ctrl Alt T`). Native text editing, undo, search, copy —
for free.

### E5. Curriculum autocomplete
Typing Spanish in any pair field suggests the concept's English (and vice versa) from
the curriculum; `Tab` accepts and moves on. The same lookup **auto-fills "Covers"**
from the pairs used (`concept-suggestions.ts` already computes this — surface it as
suggested chips, `Enter` accepts all). Six hand-tagged chips per lesson is the second
biggest time sink after marking.

**Auto-Covers half: done (2026-09-15).** `extractLessonPairTerms` +
`matchPairTermsToConcepts` (`concept-suggestions.ts`) turn a lesson's own pairs
(Spanish text, accepted English answers, `[[es:…]]`/`[[en:…]]` explanation marks)
into curriculum concept matches via one `POST /api/admin/curriculum/concepts/suggest`
call; `LessonConceptsField` renders them as dashed "+" pills after the tagged chips
(`Enter`/click tags one, `Ctrl+Enter` tags all, `Backspace`/`×` dismisses for the
session only).

**Pair-field autocomplete half: done (2026-09-15).** `PairLanguageField` /
`usePairFieldAutocomplete` (`pair-field-autocomplete.tsx`) wrap each Spanish/English
pair-field textarea in `sentence-editor.tsx`. After ≥2 typed characters and a 250ms
pause it queries the existing `GET /api/admin/curriculum/concepts/search?q=` and shows
up to 5 completions in a popover under the field — reusing `lesson-concepts-field.css`'s
`.concept-typeahead-*` classes rather than a new stylesheet — Spanish bold + English
muted in a Spanish field, roles reversed in an English field. `↓`/`↑` move the
highlight; `Tab`/`Enter` accepts: fills this field with the concept's own-language text
(bracket placeholders stripped via `stripConceptPlaceholder`, `concept-suggestions.ts`)
and, when the other field is still empty, fills it too, then moves the shared selection
(and DOM focus, through `focusSelection`) to the other field. `Escape` closes the
popover only. While the popover is open the field carries `data-keymap-ignore`
dynamically (removed once it closes) so the shared keymap dispatcher skips it and the
field's own local `onKeyDown` handles the same keys instead — normal Tab/Enter/Escape
pair navigation is unaffected when the popover is closed. Never opens when the field's
text already exactly matches a concept's own-language text. UX:
`tests/ux/pair-autocomplete.spec.ts`.

### E6. Fewer keystrokes per pair
`Enter` in an English field = next pair (same as Tab); `Enter` on an empty last pair =
leave the slide (no junk pair — the Phase-1 `leaveSlide` prunes). `Ctrl Alt Enter`
inserts the *predicted* type immediately (explanation → sentence → explanation…);
`Ctrl Alt Enter` twice cycles the type. The chooser remains for the mouse.

### E7. Templates and reuse — DONE 2026-09-15
"New lesson like this one": duplicate the structure (explanation, sentence, table…)
with empty content. Most lessons in this method share one skeleton.

`duplicateLessonStructure` (`mutations.ts`) + a second `LessonHeaderActions` icon
(`LayoutTemplate`, `aria-label="Duplicate structure"`). See `lesson-builder.md` §6
and §9 (E7 row) for the shipped shape, the module-bookkeeping mirror of
`duplicateLesson`, and why the emptied placeholder slides survive `leaveSlide`.

### Aesthetics (inside the blue theme, sans-serif)
The screenshot shows four different left edges (card, pair, table, chips) and four
type sizes on one screen. Rules for Phase 3:
- **One text column, one left edge.** A 40rem measure; explanation, pairs, table rows,
  instruction and chips all start on the same x. Tables are not centred.
- **Explanation = the column with a 2px primary left rule**, not a grey card, so the
  document reads as one flow; blocks are separated by rhythm (24px), not boxes.
- **Pairs as an aligned two-column grid** (Spanish col / English col, English italic
  muted) so the eye scans down; vocabulary tables use the same grid — one visual
  language for "pair".
- **Instruction line as an eyebrow** (12px caps, muted), never a tiny grey sentence.
- **Covers as one quiet line**: `Covers · to want · to do · today · +3` with the chips
  only on focus/hover; priority dots only when priorities differ (six identical red dots
  say nothing).
- Type scale: 17px body, 15px secondary, 12px eyebrows; 8px rhythm; Geist throughout.
- Chrome appears only for the editing block; the rest of the page is text.

### Where these land
- Phase 1: E6 (`leaveSlide`, Enter-as-next), `Ctrl Alt Enter` from the title.
- Phase 2: E1, E2 (input rules and word classification live in the editor engine).
- Phase 2.5 (new): E3, E4, E5, E7 — script mode + proposals + autocomplete + templates.
- Phase 3: the aesthetics rules above, as component styles.

## Not doing
- Visual redesigns (owner: original blue theme, sans-serif, no dark mode).
- Any change to the lesson data model or the curriculum boundary.
