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
  slide 0). Owner confirmed 2026-09-15 the chooser DID open — the failure was that it
  was not obvious a choice was required; E6 removes the chooser from the keyboard path.
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

### Phase 2.5 — authoring at typing speed
E3 pair proposals, E4 script mode (parser + serializer over the block model, round-trip
tested), E5 curriculum autocomplete + auto-Covers, E7 templates. See the Ergonomics
section. Model: Sonnet; Fable writes the script grammar.

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

### E3. Practice pairs proposed from the explanation
An explanation containing marked pairs already *is* the practice content. On
`Ctrl Alt Enter → S` (or automatically when the predicted next slide is a sentence),
pre-fill the new sentence slide with every adjacent (Spanish, English) pair from the
preceding explanation — "hacer / to do" — focused on the first English field so the
teacher can accept (`Enter`) or edit. Never retype a pair.

### E4. Script mode — type the whole lesson as text
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

### E6. Fewer keystrokes per pair
`Enter` in an English field = next pair (same as Tab); `Enter` on an empty last pair =
leave the slide (no junk pair — the Phase-1 `leaveSlide` prunes). `Ctrl Alt Enter`
inserts the *predicted* type immediately (explanation → sentence → explanation…);
`Ctrl Alt Enter` twice cycles the type. The chooser remains for the mouse.

### E7. Templates and reuse
"New lesson like this one": duplicate the structure (explanation, sentence, table…)
with empty content. Most lessons in this method share one skeleton.

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
