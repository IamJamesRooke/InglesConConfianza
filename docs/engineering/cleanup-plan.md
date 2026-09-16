# Cleanup & re-org plan — token economy (2026-09-15)

Goal: every future agent session reads less to do the same work. Measured baseline
(`web/`): components 10,544 lines / lib 11,223 / styles 6,216 / tests 11,390 /
scripts 3,080; docs 9,257 lines. `knip` reports 13 unused files, 8 unused
dependencies, 18 unused exports.

Rules: behaviour-preserving only (suite must stay 81/81, 330 unit); one commit per
group; nothing visual; the owner's `data/lessons.json` untouched.

## A. Dead code, dead deps, stray files (mechanical — Sonnet)
1. Delete unused files: `web/scratch-check-all-bucket-sizes.ts`,
   `web/scratch-remaining-report2.ts`, `src/components/ui/{button,card}.tsx`,
   `src/components/lesson-builder/{language-block-callout,overview-markdown}.tsx`,
   `src/lib/lesson-builder/server/course-view.ts`, `src/lib/curriculum/id.ts`,
   `src/lib/utils.ts` (verify each with `rg` first; keep anything a script imports).
2. Scripts: move one-off curation scripts that already ran
   (`split-slashed-concepts`, `split-verb-system`, `derive-lemma-collections`,
   `audit-lessons-answers`) to `web/scripts/archive/` with a README line each; keep
   the `npm run curriculum:*` entry points working.
3. Remove unused dependencies: `@lexical/markdown`, `@lexical/react`,
   `@mdxeditor/editor`, `@base-ui/react`, `class-variance-authority`, `clsx`,
   `tailwind-merge`, `nanoid`, `pg`, `@types/pg` — after `rg` confirms no import
   (`@prisma/client` is used via the generated client: keep). Add `server-only` to
   dependencies (it is imported but unlisted).
4. Remove the 18 unused exports (or un-export them); add `knip` as a dev dependency
   with a config that ignores `src/generated/**`, and a `npm run lint:dead` script.
5. Docs: move dated one-off specs to `docs/curation/archive/`
   (`specs/cognates-plan-2026-09-05.md`, `specs/verb-organization-plan-2026-09-05.md`,
   `taxonomy-cleanup-2026-09-07/`), leaving `docs/curation/` with the live briefs
   only; `docs/history/project-timeline.md` gets a two-line pointer. Fix links.

## B. Long files in the builder (structure-preserving splits — Sonnet)
1. `src/app/admin/lesson-builder/page.tsx` (782): move the `builderActions` wiring
   into `src/lib/lesson-builder/use-builder-actions.ts`; module-structure handlers
   into `use-course-modules.ts`; page keeps layout + composition (< 250 lines).
2. `src/lib/lesson-builder/keymap.ts` (718): one file per scope under
   `src/lib/lesson-builder/keymap/` (`title.ts`, `explanation.ts`, `pair.ts`,
   `block.ts`, `lesson.ts`, `page.ts`, `syllabus.ts` if any) + `index.ts` that
   assembles `KEYMAP`, `chordOf`, `scopeOf`, `dispatchKeymap`. Generated docs/HUD
   must keep working.
3. `src/components/lesson-builder/lesson-concepts-field.tsx` (787): split into
   `concept-typeahead.tsx` (popover + search), `covers-summary.tsx` (the quiet line),
   `concept-suggestion-chips.tsx` (auto-Covers + review suggestions), field shell.
4. `src/components/lesson-builder/module-navigator.tsx` (666): extract the compact
   `<900px` disclosure and the status/undo footer into their own components.
5. `src/components/lesson-builder/syllabus-panel.tsx` (456) / `syllabus.ts` (467):
   fine for now; only extract the drag-list into `chip-list.tsx` if it is shared
   with the Covers chips.

## C. Curriculum admin (later, not now)
`src/components/curriculum/curriculum-table.tsx` (1,243) was already decomposed once
(G1/G2); a second pass waits until the "used in a module" filter work settles.

## D. Learner stylesheets — done 2026-09-15
The three-way cascade bug (`.lesson-session`/`.lesson-topbar`/etc. declared once
each in `learner-foundations-home.css` and `practice-base.css`, and twice within
`practice-responsive-overrides.css`, with import/file order silently choosing the
winner) is fixed: every property was folded into the single rule that already won
the cascade, verified with a small script that computes the same cascade merge
independently (`for each exact top-level selector across the target files, in
import order, last-declared-property-wins`) and cross-checked against the source
files before any edit. `authoring-base.css`'s three internal duplicates
(`.authoring-session .lesson-stage`, `.authoring-save-state`,
`.authoring-controls .lesson-controls-inner`) were merged the same way; two
unused rules with a bare (non-media) `!important` (`.authoring-next-button`,
`.authoring-ending-ready` — no references anywhere in `src/`) were deleted rather
than kept with the `!important` stripped. `globals.css` had two `.dark` blocks
(a small token override and the full theme palette); merged into one.
`admin-header.css` moved to `styles/admin/header.css` (import updated in
`site-header.tsx`).

`scripts/lint-css.mjs` now covers all of `src/styles/**/*.css` plus
`src/app/globals.css` (previously only `styles/lesson-builder/*.css`), and its
duplicate check compares whole selector-list preludes verbatim instead of
exploding comma groups into individual selectors (the explode approach flagged
ordinary, non-buggy selector-list reuse — e.g. `.a, .b { … }` beside a separate
`.a { … }` — as noise across ~30 legitimate rules once the wider file set was
in scope). `!important` is now also allowed inside an explicit
`@media (prefers-reduced-motion: reduce)` block, not only in `print.css`.

Not done, descoped for time: the full per-surface file split named in the
original brief (`styles/learner/home.css`, `lesson-row.css`,
`practice-stage.css`, `practice-card.css`, `practice-completion.css`). The fix
instead merges in place — each selector now has exactly one declaration site
(mostly `practice-responsive-overrides.css`, which already won the cascade for
most of them), so file *names* are unchanged but the cascade ambiguity is gone
and `lint-css` now enforces it can't come back. Revisit the file split in the
learner polish phase if the current organization (three big files) becomes
hard to navigate.

Zero-visual-change was verified pixel-by-pixel: a throwaway `next dev` server
on port 3250 (isolated `LESSON_BUILDER_DATA_PATH` copy of `lessons.json`)
captured home, practice explanation, retrieval (empty + wrong-answer-with-hint),
vocabulary table, completion, `/admin/lesson-builder`, and `/admin/curriculum`
at 390×844 and 1280×900 — 16 states — first against the working tree, then
against a `git stash`ed clean `HEAD`, compared with ImageMagick
`compare -metric AE`. The first pass caught a real bug the merge introduced:
`.answer-input:focus` and `.answer-input.showing-hint` share specificity, and
a duplicate `:focus` declaration further down the original file (now folded
into the single rule) used to win over `showing-hint`, so a focused field
showing a hint has always rendered with the focus ring's blue, not the hint's
gold — merging by "last-declared-property-wins" without preserving that
declaration's position relative to `showing-hint` flipped the winner. Fixed by
placing the merged `.answer-input:focus` rule after `.answer-input.showing-hint`,
matching the original's effective order. Final diff: 14 of 16 pairs exactly
0 AE; the other two (completion, both from animation/font-rendering timing,
confirmed via `-compose difference -threshold 0.5%` finding no surviving
region) at 0.0002%–0.016%, both far under the 0.1% budget.

## E. Tests (with B)
`tests/` is 11,390 lines; after B, delete assertions that only pin structure a split
moved (class names, file-internal helpers), keep behaviour and saved-JSON assertions.

## Gate
`npm run test:unit`, `npx tsc --noEmit`, `npm run lint` (+ `lint:dead`),
`npm run build`, `npm run ux:check` twice, `git diff --check`; and a re-measure of the
numbers above in the final report.
