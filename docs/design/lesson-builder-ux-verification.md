# Lesson Builder UX verification

Verified 2026-09-13 against the acceptance checklist using the isolated
Playwright lesson store and `.next-ux-check` output directory. The owner's
`web/data/lessons.json`, PostgreSQL data, and localhost:3000 server were not
used by the browser checks.

## Verified behavior

- Lesson creation and keyboard-only authoring persist the expected lesson
  structure. The existing UX test authors one explanation and three sentence
  pairs across two sentence slides using the Tab flow.
- The active explanation editor exposes Español, English, Normal, Bold, and
  Italic controls without requiring a selection. Mouse selection and a
  collapsed caret survive toolbar use; the exact Ctrl+Alt and Ctrl/Command
  shortcuts are displayed. Spanish and bold formatting survive save/reload.
- Sentence fields carry persistent Español/English text labels. A visible add
  pair action and the existing Tab-to-next-pair path both remain available.
- Every sentence/table has an always-visible, compact optional instruction
  field above its pairs. Empty, filled, cleared, saved, and reloaded states are
  exercised; non-empty prompt text still renders in learner practice.
- Sentence-level helperText and after-correct controls/rendering are retired.
  Legacy `helperText` and `answerFeedback` values survive an ordinary save but
  remain inert. Per-piece callouts, answer reveal, generated success checks,
  progression, and lesson completion remain active.
- A lesson selected from a collapsed module opens by itself; sibling lessons
  remain folded.
- The primary visual hierarchy is shared blue, writing/reading surfaces are
  neutral, Add lesson is a compact outline action, and the module header has no
  decorative red divider. The retired authored-feedback container is absent,
  so no empty colored rectangle is reserved.
- Completion retains the existing `Lección completada` and `Inicio` copy and
  behavior, with a larger success seal and prominent primary Inicio action.
- Vocabulary tables use four compact, full-width two-column rows inside a
  centered 42rem card. Completed answers become scannable text, active answers
  retain an input focus ring and keyboard-reachable help, long phrases wrap at
  390px without page overflow, and the ordinary sentence layout remains
  non-grid.

## Automated evidence

- `npx playwright test`: 6 passed. This covers the full isolated authoring,
  accessibility, keyboard, vocabulary, and learner-flow suite.
- Focused final reruns after the last width and round-trip assertions:
  `authoring-ergonomics.spec.ts` 2 passed; combined authoring/learner polish 3
  passed.
- `npm run test:unit`: 84 passed.
- `npm run lint`: 0 errors, 2 pre-existing unused-variable warnings in
  `scripts/curriculum-inventory.ts` and `scripts/gen-theme-manifest.ts`.
- `npm run build`: passed compilation, TypeScript, and static generation; it
  retains the existing Turbopack warning about dynamic lesson-store filesystem
  tracing.
- `git diff --check`: passed.
- Axe found zero serious/critical violations on the active authoring surface,
  vocabulary table, and completion screen. Direct WCAG contrast calculations:
  primary/white 7.40:1, success/white 5.37:1, ink/white 15.97:1, and help
  text/help-soft 13.21:1.

## Visual evidence

- `/tmp/lesson-builder-authoring-after.png`
- `/tmp/vocabulary-table-after.png`
- `/tmp/vocabulary-table-narrow-after.png`
- `/tmp/lesson-completion-after.png`
- `/tmp/lesson-completion-narrow-after.png`

## Checklist limits

Preview-origin restoration, undo/redo, and failed-save retry remain covered by
unit tests rather than a fresh visual browser pass. No intentional save-failure
was injected in this slice. The requested Claude review file was not available
at `/tmp/lesson-ux-final-review.md` during finalization.

## Ownership-transfer completion (Claude, 2026-09-13)

Codex ran out of credit and transferred sole application-write ownership
(`/tmp/design-impl-transfer.md`). This section documents the remaining bounded
work completed after transfer, and what was found while validating the
already-applied learner-keyboard patch, using the same isolated Playwright
store/distDir — `web/data/lessons.json` and `localhost:3000` were not touched.

### Authoring-layout cleanup (previously unfinished)

- **Hint/alternative metadata no longer widens the piece card.**
  `.lesson-document-piece` sizes to `width: max-content`, so an unconstrained
  hint or alternative-answer row could force a two-word card much wider than
  its content. Fixed with a `max-width` cap on `.lesson-document-annotation`
  and `.lesson-document-piece-actions` (280px) instead of the more common
  `width:0; min-width:100%` shrink-wrap-exclusion trick — that trick doesn't
  work here specifically because the parent's own width is *also*
  max-content-derived, making a percentage `min-width` against it a circular
  reference that resolves to 0 and collapses the row to nothing (verified this
  failure mode directly before switching approaches).
- **Accessible disclosure + focus restoration.** The hint annotation now has
  an explicit "Remove hint" button (parity with the existing alternative-answer
  "×"), and removing a hint or an alternative answer returns focus to that
  piece's Spanish field instead of letting it fall back to `<body>` when the
  button they were using unmounts. The `+ hint` / `+ another accepted answer`
  triggers carry `aria-expanded`/`aria-controls`.
- **Optional instruction field** switched from a resizable multi-line
  textarea (`resize: vertical`, fixed 38px min-height) to a compact,
  auto-growing single line (`field-sizing: content`, `resize: none`,
  `min-height: 1.5lh`), matching the sizing technique already used for
  sentence-piece fields.
- **`+ Add pair`** restyled from a solid filled primary button to a quiet
  dashed-outline chip (mirrors `.lesson-library-add-lesson`'s existing quiet
  treatment), reduced height/margin so it reads as part of the pair-entry flow
  rather than a standalone call to action.
- **Long/wrapped fixture + verification**: new test
  (`authoring-ergonomics.spec.ts`, "hint and alternative metadata never widen
  the piece card...") authors a short pair, adds a long hint and a long
  alternative answer, and asserts the card's width barely moves (<4px) in
  either case — a direct regression guard for the sizing-geometry fix.
  Screenshots captured at desktop (1280px) and narrow (390px).
  **Finding, not fixed (out of this task's bounded scope):** at 390px, the
  authoring page itself overflows horizontally even with no hint/alternative
  content — reproduced in isolation with a single long Spanish field, so it's
  a pre-existing general authoring-layout limitation, not something this
  change introduced. `docs/design/lesson-builder-ux-acceptance.md` scopes
  authoring to desktop ("Desktop authoring is the initial target"), so this
  is documented rather than chased under a narrower mandate; a deliberate
  pass would be needed if narrow authoring becomes in scope.

### Learner-keyboard patch validation (not run since it was applied — now run)

Found and fixed one real regression the patch introduced, confirming the
transfer note's caution that it hadn't been tested:

- **Bug:** `sentence-practice-card.tsx`'s Tab handler called `showHelp()` on
  an incomplete/wrong answer but did not call `preventDefault()`, so focus
  still moved on natively — and since the mouse-reachable hint-toggle button
  is only rendered while `helpedBlockIndex !== languageBlockIndex`, revealing
  the hint via Tab immediately unmounted the very button Tab was about to
  land on. Net effect: Tab away from a wrong answer intermittently landed
  nowhere useful, and — more importantly — didn't actually block advancing
  the way a later, more specific owner instruction required ("Tab should not
  allow continuing to the next sentence block" on a wrong answer). Fixed by
  adding `event.preventDefault()` alongside `showHelp()` in that branch.
- Updated the two tests whose assertions encoded the old (pre-fix) behavior:
  `learner-polish.spec.ts` "vocabulary rows stay compact..." expected Tab to
  land on the hint button; now asserts it stays on the same input with the
  hint diff visible. The keyboard-lesson test's `not.toBeFocused()` after Tab
  is now `toBeFocused()`.
- **Further tightened per direct owner correction**: arrow keys must never
  drive slide navigation "even outside fields." The already-applied patch
  only excluded arrows while a text-entry element was focused
  (`!textEntry`); removed that gate entirely from `lesson-selector.tsx` so
  ArrowLeft/ArrowRight are pure no-ops for slide navigation everywhere, and
  only `PageUp`/`PageDown` (plus the visible prev/next buttons) drive
  keyboard slide navigation now. Added a test case covering arrows while
  focus is on a non-field control (the "Paso anterior" button).
- Everything else in the patch validated as already correct on inspection and
  by the existing `learner-polish.spec.ts` "learner answer keys reveal help
  without navigation, focus theft, or lost drafts" test: IME-composing Enter
  is ignored (`isComposing` guard, plus a dispatched composing keydown event
  in the test), Enter on an incomplete answer reveals the hint without moving
  focus or shifting the piece's height, and a partial draft survives
  navigating to the previous step and back.

### Automated evidence (this phase)

- `npx playwright test`: 8 passed, twice in a row for stability (one
  transient unrelated flake on a third run — the same known concept-search
  timing flake noted earlier in this project's history, not a regression).
- `npm run test:unit`: 84 passed.
- `npx eslint <touched files>`: 0 errors, 0 warnings on every file this phase
  touched (the bare `npm run lint` invocation reports thousands of
  pre-existing findings across unrelated generated/legacy files repo-wide,
  confirmed unrelated to this change and to the earlier transfer note's own
  "0 errors" run — likely a difference in how each invocation resolved lint
  scope).
- `npx tsc --noEmit`: clean.
- `npm run build` (isolated dist dir): compiled, type-checked, and
  statically generated successfully; retains the same pre-existing Turbopack
  dynamic-filesystem-tracing warning noted in the original verification pass.

### New visual evidence

- `/tmp/authoring-long-pair-desktop.png`
- `/tmp/authoring-long-pair-narrow.png` (shows the documented, unfixed narrow
  authoring overflow)

### Build-breaking bug fixed: `bg-[var(--header)]/95` corrupted the CSS build

The "Parsing CSS source code failed" build error reported earlier (and
initially misdiagnosed as stale Turbopack cache) was root-caused this phase:
`src/components/site-header.tsx` used `bg-[var(--header)]/95` — Tailwind's
arbitrary-value bracket syntax combined with an opacity modifier, applied to
a CSS variable reference rather than a literal color. That specific
combination triggers a Lightning CSS (Turbopack's CSS parser) bug that
corrupts the internal synthesized `color-mix()` variable name with a
non-printable control character, breaking the whole build — reproducibly, on
every fresh build, not just a stale cache.

**Fix:** registered `--header` as a proper Tailwind theme color
(`--color-header: var(--header);` in the `@theme inline` block of
`globals.css`) so `site-header.tsx` could use the plain `bg-header/95`
utility instead. Opacity modifiers on a registered theme color go through a
different, working code path. Confirmed no other `[var(--x)]/N` pattern
exists elsewhere in the codebase (grepped repo-wide). Verified with a clean
`npm run build` in an isolated dist dir — no parsing error, and the full
Playwright/unit/lint/typecheck suite stayed green afterward.

## Slide insertion + authoring cleanup (Claude, 2026-09-13, later session)

Owner reported the builder was broken: "Add slide buttons don't work; cannot
discover insertion between existing slides," with a screenshot showing
repeated ESPAÑOL/ENGLISH labels, a large "NUEVO PAR" draft card next to a
separate "+ Add pair" button, and a red left-border decoration. Reproduced
live against the isolated store (port 3100, `.next-ux-check`, isolated
lessons file) before touching anything, then fixed.

### Functional bug (fixed first, per priority)

**Root cause, confirmed via `getComputedStyle` in the live page, not
assumed:** every between-slide insertion control
(`.lesson-document-insert`, not the labelled tail "Add slide" button) had
`opacity: 0; height: 3px` and its button `position: absolute; left: -28px`
(or `-24px`) with a `background: var(--card)` and no border — i.e. a
genuinely invisible, off-canvas, hover-only 3px strip with a button that,
even if found, had no visible chrome against the page background. This
matches the report exactly: not "broken" in the sense of a JS error, but
undiscoverable — a keyboard user has no way to hover, and a sighted mouse
user has to know to search a 3px gap slightly left of the content column.
(The "Add slide" button itself, which has a `label` prop, was already
`opacity: 1` and worked — confirmed by direct interaction — so the report's
"Add slide buttons don't work" was this same discoverability problem
described from the user's perspective, not two separate bugs.)

**Fix**, `lesson-library-document.css`:
- `.lesson-document-insert` is now always `opacity: 1` (no hover gate).
- Its button is a small (22px) bordered circular "+" pill, centered on the
  boundary line (`top/left: 50%; transform: translate(-50%,-50%)`), with a
  visible `1px solid var(--border)` and a hover state — matching the
  already-established pattern used for the lesson-list's own insert control.
  (Note: that lesson-list control, `.lesson-library-insert`, still has the
  same opacity:0/hover-only pattern — out of this task's stated scope
  ["at every slide boundary"], but flagged for a follow-up since it's the
  identical bug in a sibling list.)
- The chooser popover repositions to open centered *below* the button
  (`top: 24px; left: 50%`) instead of `top: 14px; left: -24px`, which had
  been visually covering the slide *above* the insertion point when opened —
  a second, related bug found while fixing the first (see the "insertion
  chooser open" screenshot below: it no longer overlaps the explanation card
  it sits under).
- Fixing this required a second pass: the new circular-button styles
  initially leaked into the `.labelled` ("Add slide") and would-be `.inline`
  variants via cascade (a missing `width`/`transform`/`top` reset), which
  visibly broke the "Add slide" button's layout (wrapped text in a tiny box)
  until caught by a full-page screenshot and fixed with explicit resets on
  `.lesson-document-insert.labelled > button`.
- `slide-insert-control.tsx`: the choices toolbar's `aria-label` was
  hardcoded to `"Choose the first slide"` regardless of position — fixed to
  `"Choose a slide type"` (generic, since it's now used at every boundary),
  and the toggle button gets a position-aware `aria-label`/`title` (`"Insert
  a slide before slide N"`) passed from `lesson-document.tsx`, in place of a
  generic `"Insert slide here"` for every instance.

**Verified with actual browser interaction** (isolated store, port 3100),
not just a unit-test pass: created a lesson; authored an explanation, a
short sentence, and a long/wrapped sentence; inserted a new slide *between*
the explanation and the short sentence via the previously-invisible control
(mouse click); confirmed it landed at the correct position; inserted another
slide at the very *beginning* via keyboard alone (Tab to the "+" control,
Enter to open the chooser, letter key to pick a type — no mouse); duplicated,
deleted, and undid the duplicate on the new block; reordered two blocks via
a dispatched native `dragstart`/`dragover`/`drop` sequence (Playwright's
click-drag doesn't trigger real HTML5 DnD, so this was scripted directly)
and confirmed the order changed; saved and reloaded and confirmed the final
block count and order persisted. All of this is now also captured as an
automated Playwright test (see below) so it doesn't need re-verifying by
hand next time.

### Bounded cosmetic cleanup (owner-approved, done after the functional fix)

- **One shared "Español/English" key per sentence group**, not repeated on
  every phrase card: added `.lesson-document-language-key` (a single small
  caption row above `.lesson-document-pieces`, or a real two-column table
  header in vocabulary-table layout, aligned with the row's own grid
  template) and removed the per-piece `<span>Español</span>`/`<span>
  English</span>` labels entirely. The row order (Spanish line above English
  line in every card; Spanish column before English column in every table
  row) remains the structural, non-color cue underneath the shared label.
  Every field kept its own distinct `aria-label` (e.g. "Sentence piece 2
  English") and `lang` attribute — those were never on the removed `<span>`s
  to begin with, so nothing accessibility-relevant was lost.
- **Removed the "Nuevo par · Español" / "Nueva fila · Español" mixed-language
  microcopy** on the trailing draft field — it now shows the same shared
  header as real pieces, with a plain placeholder, and is visually
  indistinguishable from an ordinary (empty) piece card. The explicit
  "+ Add Spanish + English pair" / "+ Add vocabulary row" button remains the
  one obvious entry point; the existing keyboard-efficient Tab-to-create flow
  (Tab past the last piece's English field lands you in this same draft
  field) is unchanged in behavior — only its visual presentation changed.
- **Removed the red selection/focus decorations**: `.lesson-document-block:
  focus-within::after` used `var(--accent)` (the brand's red/coral) for the
  active-slide indicator bar; changed to `var(--primary)` (the established
  blue focus/anchor color). The explanation card's own separate `border-left:
  5px solid var(--accent)` stripe was removed outright (redundant with the
  block-level indicator, and was the second red decoration doubling up on
  the first). Also caught and fixed the same red-for-focus pattern on the
  module-title input's focus ring (`.lesson-library-module-title:focus`),
  since it's the identical token misuse.
- Did **not** touch: the vibrant color palette itself (red for Spanish, blue
  for English text — an intentional, already-reviewed bilingual-ink choice,
  not a "selection" decoration), the "+ Add pair" button's own quiet styling
  (already fixed in an earlier session), or any practice/learner-facing file
  (out of scope — that surface is separately owned; verified no edits were
  made there).

### New automated test

`authoring-ergonomics.spec.ts`, "slide insertion is always visible,
keyboard-reachable, and works at every boundary": authors a short and a
wrapped sentence, asserts every insert control has `opacity: 1` and a
≥20×20px visible button, inserts a slide between two existing slides via
click and confirms the chooser doesn't visually cover the slide above it,
inserts another via keyboard alone at the very beginning, duplicates/
deletes/undoes, asserts the shared language-key/no-"Nuevo par" cosmetic
cleanup, saves, reloads, and re-asserts persisted block count, plus an axe
scan scoped to the lesson row. Passed 6/6 consecutive runs in isolation and
was stable across 2 full-suite runs (one full-suite run hit one *pre-existing*
flake in a different, untouched test — reran clean; not a regression from
this change, see "Automated evidence" below).

### Automated evidence (this pass)

- `npx playwright test`: 9/9 passed, twice consecutively. One earlier
  full-suite run had a single flake in the pre-existing "hint and
  alternative metadata" test (an axe scan scoped to `.lesson-document-
  sentence`, likely cross-test DOM leakage since tests share one isolated
  data file within a run) — passed immediately in isolation and on the next
  two full-suite reruns; not touched by this session's changes, flagged
  rather than chased further.
- `npm run test:unit`: 84/84 passed.
- `npx tsc --noEmit`: clean.
- `npx eslint` on every file touched this pass: 0 errors, 0 warnings.

### New visual evidence

- `/tmp/authoring-short-and-wrapped-sentence.png` — short pair and a
  long/wrapped pair, each with one shared Español/English key, plain
  trailing draft, quiet add-pair button, visible "+" insert circles.
- `/tmp/authoring-insertion-chooser-open.png` — the chooser open between two
  slides, positioned below the "+" button, not covering the slide above it.
- `/tmp/authoring-newly-inserted-slide.png` — the result after choosing
  Explanation: a new slide landed at the correct position, with the calmer
  blue (not red) focus indicator.

### Known follow-up, not fixed here (flagged, not chased)

`.lesson-library-insert` (the *lesson*-list "insert a lesson here" control,
a sibling feature to the slide one, from an earlier session) still has the
identical `opacity: 0`/hover-only pattern this pass just fixed for slides.
Out of this task's literal scope ("every slide boundary"), but almost
certainly the same undiscoverability problem for lessons if a teacher ever
notices it — worth the same fix in a future pass.

## Vocabulary/sentence card declutter (Claude, 2026-09-13, later same day)

Owner reviewed three screenshots of the authoring UI and asked for a
decluttering pass: the "+another accepted answer" text button, the hint
HUD's lesson-name line, and the "Add an instruction"/ESPAÑOL·ENGLISH area.
Proposed a plan first (per the batch-approval workflow); the owner approved
with "cut it" (for the HUD line) and "do it" (for the rest). One part of the
original plan was corrected before implementation: the "+" circle above
"Add an instruction" in the screenshot was misread on first pass as a
duplicate add-instruction affordance — it's actually the slide-insert-
before-this-slide control from the previous phase, unrelated to the
instruction field. That correction is reflected below.

### HUD lesson-name line removed

`EditingHud` no longer receives or renders a `lessonLabel` — the persistent
bottom-right bar is now pure keybinding legend, nothing else. Removed the
now-dead `hudLessonLabel` computation in `lesson-library.tsx` and the
`.editing-hud-scope` CSS (base + dark-bar color-override rule).

### Accepted-answer editing collapsed into the main English field

The separate "+ another accepted answer" button and its own "Also accept"
input rows are gone. Alternate answers now live as extra lines in the same
English textarea: **Shift+Enter** (or the existing `Ctrl+Alt+A` shortcut,
which now appends an empty line and focuses it instead of opening a
separate row) starts a new accepted-answer line. `sentence-editor.tsx`
binds the field to `acceptedAnswers.join("\n")` and reconciles the line
count back into the `acceptedAnswers` array on every change
(`handleEnglishAnswerChange`), calling the pre-existing `onAddAnswer`/
`onRemoveAnswer`/`onUpdateAnswer` props — no new reducer action needed.
Plain Enter is still blocked everywhere else (it never splits a piece);
Shift+Enter is the one carved-out exception, only in the English field.
The HUD's `sentence-en` row now reads `Tab next blank · Shift Enter another
answer · Ctrl Alt H hint · Ctrl Alt Enter next slide`.

**Sizing-geometry regression found and fixed while building this**: giving
the answer field real multi-line content exposed a genuine CSS bug, not
just a test artifact — a `field-sizing: content` textarea's contribution to
an ancestor's own `width: max-content` sizing isn't reliably clamped by
either the textarea's or its wrapper `<div>`'s own `max-width` (verified
directly with `getComputedStyle`: both the textarea and its wrapper
rendered correctly clamped in isolation, while the containing
`.lesson-document-piece` card still grew past both of them, to as much as
501px for a short "sí/yes" pair with one long extra answer line). Fixed by
adding the cap directly to `.lesson-document-piece` itself
(`max-width: min(25rem, 100%)`), the same "cap the box that's actually
misbehaving" principle as the pre-existing `.lesson-document-annotation`
fix, one level further up the tree. Confirmed visually with a screenshot
(card wraps the long answer onto a third line, no overflow, no widen past
the cap) before folding the fix into the codebase.

### Icon-only hint button + corner delete

"+ hint" is now a small circular lightbulb icon button (same 18×18 circular
treatment as the existing hint-remove "×"), still gated on
`piece.callout === null && activePiece === piece.id` — reachable by Tab
(focusing either field of the pair activates it), not a hover-only
affordance. The full-width "delete" pill is now a small trash-icon button
pinned to the card's top-right corner (`.lesson-document-piece-delete`,
`position: absolute`), same gating. Removed the now-dead
`.lesson-document-piece-actions .danger` styling and the old bordered-pill
button styling (only one icon button remains in that row now).

### "Add an instruction" + insert-control spacing

Dropped "(optional)" from the placeholder text (`"Add an instruction…"`) —
the field's own emptiness already implies optionality; the
`aria-label="Optional learner instruction"` still states it non-visually.
Increased `.lesson-document-block`'s padding from `1px 8px` to `5px 8px` so
a block's own header content doesn't sit flush against the always-visible
insert-slide "+" control immediately above it — the two were visually
reading as one control after the previous phase made inserts always-visible.

### Automated evidence (this pass)

- `npx playwright test`: 9/9 passed, twice consecutively. Two of the
  updated assertions in `authoring-ergonomics.spec.ts`'s hint/alternative
  sizing test were changed from a strict "<4px" (literal zero growth) to
  bounded thresholds (<410px) that match what the `max-width` cap design
  actually guarantees — bounded growth, not zero growth; the old <4px
  threshold happened to hold under the old separate-metadata-row UI but was
  never really the intended contract, and became testably wrong once
  alternate answers moved into primary content.
- `npm run test:unit`: 84/84 passed.
- `npx tsc --noEmit`: clean.
- `npx eslint` on every file touched this pass: 0 errors, 0 warnings.
- Manually verified live in the browser against the isolated store (not
  just the automated suite): typed a pair, added a second accepted-answer
  line via Shift+Enter, confirmed it persisted to the isolated
  `lessons.json` as a real two-element `acceptedAnswers` array, deleted the
  line back down to one via Backspace, opened and removed a hint via the
  new icon button with correct focus restoration to the Spanish field, and
  confirmed the corner delete icon and HUD legend text render as designed.

No new dependencies. No commits made. Owner's real `localhost:3000` server
and `web/data/lessons.json` untouched — verification used an isolated
`LESSON_BUILDER_DATA_PATH` file and `UX_CHECK_DIST_DIR`, both deleted after
the manual browser check.
