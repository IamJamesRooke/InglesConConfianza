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
| Explanation (focused) | `Ctrl Alt Q` / `Ctrl Alt W` / `Ctrl Alt E` | Mark current word / clear caret's typing mode / mark as Spanish / English. With a selection: wraps it in `<mark data-language="es\|en">`; with a collapsed caret: marks the word around it, or arms "typing mode" so subsequently typed text is marked live. |
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
| Slide (anywhere inside, via the shared document-body handler) | `Ctrl Alt Enter` | Opens the insert chooser positioned after the active slide (or at the end, if none active). |
| Insert chooser (open) | `Ctrl Alt 1` / `2` / `3` | Insert Explanation / Sentence / Vocabulary table directly after the active slide, without opening the chooser UI. |
| Insert chooser (open, focus inside it) | `E` / `S` / `T` | Pick that type immediately (only while focus is inside the open chooser). |
| Insert chooser (open, focus inside it) | `←/→/↑/↓` | Move focus between the three choice buttons (wraps). |
| Insert chooser (open) | `Escape` | Closes the chooser and restores the caret to wherever it was before the chooser opened. |
| Insert chooser (open) | click outside | Closes the chooser (pointerdown listener on `document`, ignores clicks inside `.lesson-document-insert`). |
| Slide (any) | `Ctrl Alt ArrowUp` / `ArrowDown` | Move the active slide up/down. |
| Slide (any) | `Ctrl Alt D` | Finish this lesson: collapses its row. |
| Slide (any) | `Ctrl Alt Shift D` | Same, but via the doc-body handler's Enter+Shift path — see `lesson-document.tsx`: `Ctrl Alt Shift Enter` finishes the lesson (`onDone`) instead of opening the insert chooser. |
| Slide (any) | `Ctrl Alt L` | Add a new lesson in the current module (focuses its title). |
| Slide (any) | `Ctrl Alt Shift L` | Start a brand-new lesson at the end of the last module (page-level listener, works from anywhere, not slide-scoped). |
| Lesson row (any) | `Ctrl/⌘ Z` / `Ctrl/⌘ Shift Z` | Undo / redo (page-level; disabled while the event target is itself a text-editing target, so it doesn't fight native field undo). |
| Lesson row (any) | `Ctrl/⌘ S` | Save now (autosave also runs independently). |
| Module navigator drag-handle button (focused) | `Alt ArrowUp` / `Alt ArrowDown` | Reorder that module up/down (plain Alt is safe here — a single non-typing button, not a global page listener). |
| Anywhere in the builder | `Ctrl/⌘ .` | Toggle the keyboard-help dialog. |
| Keyboard-help dialog (open) | `Escape` | Closes it and restores focus to whatever was focused before it opened. |

## 4. Shortcut table (as shown in `keyboard-help.tsx`)

| Keys | Behaviour |
|---|---|
| `Enter` | From the title: start writing. In an explanation: new paragraph. |
| `Ctrl Alt Q` · `Ctrl Alt W` · `Ctrl Alt E` | In an explanation: type in Spanish · neutral · English. With text selected, marks it. |
| `Ctrl Alt 1` `2` `3` | Add an Explanation / Sentence / Vocabulary table after the current slide. |
| `Ctrl Alt Enter` | Open insert choices after this slide — Explanation, Sentence (focused first), Table; press `E`/`S`/`T` to pick. |
| `Ctrl Alt ↑` `↓` | Move the active slide up or down. |
| `Ctrl Alt D` | Finish this lesson (collapse it). |
| `Ctrl Alt L` · `Ctrl Alt Shift L` | Add a lesson here · start a whole new lesson. |
| `Tab` / `Shift Tab` | Move between Spanish, English, and active tools. |
| `Alt ↓` · `/` · `Ctrl Alt Backspace` | On a sentence pair: jump to its hint · separate alternative English answers in the same field · delete the pair. |
| `Ctrl/⌘ B` / `I` | Bold or italic. |
| `Ctrl/⌘ Z` · `Shift Z` | Undo · redo. |
| `Ctrl/⌘ S` | Save now (it also autosaves). |
| `Esc` | Close a nested tool first; otherwise leave slide editing. |

This table is authoritative for what the teacher is told. If a shortcut in
section 3 isn't here (e.g. `Ctrl Alt Shift Enter` to finish a lesson,
`Ctrl/⌘ .` itself), it exists in code but isn't advertised — treat that as a
gap to reconcile, not as license to invent more undocumented shortcuts.

## 5. Visual rules (current)

Pulled from `web/src/styles/lesson-library-document.css` as it stands today,
not from any proposal doc's aspirations.

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
- **Insert "+" controls are hover/focus-reveal, not always-visible**: both
  `.lesson-document-insert` (between/after slides) and `.lesson-library-insert`
  (between lesson rows) collapse to a 1–4px hairline at rest and expand only
  on hover, `:focus-within`, or (for the slide one) when `.labelled` is set
  for an empty lesson's first insert point. Any older doc describing these
  as permanently-visible circles is describing a since-changed design —
  the code today is reveal-on-interaction.
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

- `.lesson-library-insert` (the "add a lesson here" control between lesson
  rows) is still hover/focus-only, not discoverable by a first-time glance.
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
| 0c | `LessonBuilderContext` to replace the LessonLibrary→LessonDocument→SentenceEditor prop chain | Sonnet | todo |
| 0d | Sweep process/history comments ("Track E", "S3", "/tmp/…", "owned by lesson-ux") from lesson-builder code | Haiku | todo |
| 0e | AGENTS.md "Lesson builder task protocol" section | Sonnet | done |
| 1a | One lesson open at a time: collapse all on load except `?lesson=` / last-edited; opening one folds the others | Sonnet | todo |
| 1b | Calmer resting palette for sentence slides (owner A/B with screenshots) | Sonnet | todo |
| 1c | One quiet next-action cue under the active slide (`Ctrl Alt Enter · next slide`) | Sonnet | todo |
| 1d | Shortcut diet: essentials vs power tier; unify chooser letters with global add chords | Sonnet | todo |
| 1e | Keyboard help dialog: two tiers, even columns | Haiku | todo |
| 1f | "Covers" concept chips: plain pills, priority as a dot | Haiku | todo |
| 1g | Hint input shown only on demand, not on every activated pair | Haiku | todo |
| 1h | Make both insert controls (between slides and between lessons) discoverable at rest — they currently collapse to a hairline | Haiku | todo |
