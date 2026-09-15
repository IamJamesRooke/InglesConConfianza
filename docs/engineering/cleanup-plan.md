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

## D. Learner stylesheets (with the learner polish phase, not now)
`practice-responsive-overrides.css` (994), `learner-foundations-home.css` (979),
`authoring-base.css` (865) carry two eras of rules; apply the lesson-builder
per-component treatment when the learner surfaces get their polish pass.

## E. Tests (with B)
`tests/` is 11,390 lines; after B, delete assertions that only pin structure a split
moved (class names, file-internal helpers), keep behaviour and saved-JSON assertions.

## Gate
`npm run test:unit`, `npx tsc --noEmit`, `npm run lint` (+ `lint:dead`),
`npm run build`, `npm run ux:check` twice, `git diff --check`; and a re-measure of the
numbers above in the final report.
