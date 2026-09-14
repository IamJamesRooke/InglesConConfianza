# Repository guidance

Ingles Con Confianza is a language-learning application built from the owner's teaching methodology for Spanish-speaking adults in Bogota. Treat the curriculum as core intellectual content and preserve its teaching logic.

## Current priorities

1. Curate the PostgreSQL curriculum: remove low-value material, correct normalization, merge duplicates, simplify collections, and make curriculum roles selective.
2. Build the first course module from the curated database and validate the lesson-authoring and learner experience.

Migration is complete. Do not recreate the retired Markdown source trees, build another import pipeline, or add specialized curriculum tables. New curriculum work consists of deliberate database inserts, edits, merges, and deletions.

## Start here

- `docs/backlog.md` records the active sequence and completion gates.
- `docs/history/project-timeline.md` records how the product, curriculum model, and technical architecture evolved.
- `docs/curriculum-database.md` defines the canonical curriculum record and curation rules.
- `docs/teaching-methodology.md` defines lesson design and the intended learner experience.
- `web/prisma/schema.prisma` models the PostgreSQL curriculum database.
- `web/src/lib/curriculum/server/` owns curriculum reads and writes.
- `web/data/lessons.json` remains the Lesson Builder store until the owner expands PostgreSQL scope.
- `docs/engineering/code-map.md` is the short starting map for routine feature maintenance.

## Curriculum boundaries

- PostgreSQL is the only canonical machine-readable curriculum store. Teachable content belongs in `curriculum_concepts`; collections provide queryable grouping without parallel catalogs.
- Immutable JSON snapshots under `web/prisma/seed-data/` exist for reproducible bootstrap and parity verification. Update them through the established export workflow after approved database changes; do not edit them as the primary store.
- The archived source documents and extracted rows in PostgreSQL are immutable provenance. They do not create an obligation to retain every imported concept.
- Each concept is Spanish-first, has exactly one English target, one generic bilingual example, reusable collections, and one role: `core`, `supporting`, `reference`, or `trash`.
- `core` is an elite functional tier. `supporting` is selective and broadly reusable. `reference` is the default home for valid but secondary, situational, inferable, or specialized material. `trash` is a staging tier for deletion candidates only; nothing teaching-facing reads it.
- Never delete a concept outright as a curation judgement. Set its role to `trash`, so it stays filterable and recoverable, and let the owner bulk-delete the `/curriculum?role=trash` survivors after a second look.
- Curation is applied directly from reviewed TSV manifests via `curriculum:roles:apply` and `curriculum:concepts:apply`; record each applied manifest with its per-row rationale under `docs/curation/`. There is no review-candidate queue.
- Compare proposed inserts and merges with PostgreSQL before writing. Prefer small, reversible curation batches with tests and snapshot parity after each batch.
- Do not perform database curation concurrently with the owner unless responsibility for the current batch is explicit.

## Product and engineering decisions

- Work MVP-first. Prefer the smallest clear, maintainable solution to a demonstrated need.
- Follow existing Next.js, React, TypeScript, Tailwind CSS, Prisma, and PostgreSQL patterns. Introduce planned infrastructure only when the current task requires it.
- Do not add microservices, Kubernetes, enterprise patterns, or speculative abstractions for portfolio signaling.
- Keep Lesson Builder persistence separate from the curriculum database until the owner explicitly changes that boundary.
- Treat security as part of design and testing. Record only controls that were actually implemented and verified.
- Keep changes within the requested scope and preserve unrelated user work in a dirty worktree.

## Lesson builder task protocol

- Before touching the Lesson Builder, read `docs/engineering/code-map.md` and `docs/design/lesson-builder.md` first — and nothing else in `docs/design/` unless a specific question sends you there.
- Where `docs/design/lesson-builder.md` and the actual code disagree, the code wins; treat the mismatch as a doc bug to fix, not a code bug.
- Never edit `web/data/lessons.json` by hand, and never point a test, script, or manual check at the owner's `localhost:3000` — that is live authoring data.
- Verify with: `npm run test:unit` (scope with `-- tests/unit/<file>.test.ts` when possible), `npx eslint <touched files>`, `npx tsc --noEmit`, `npm run build`, and `npm run ux:check` (Playwright; runs its own dev server on an isolated port against a throwaway lessons file — safe anytime). A pre-existing timing flake around concept search in `tests/ux/authoring-ergonomics.spec.ts` is known; a clean rerun is not a regression signal.
- Do not commit unless the user explicitly asks.
- When you finish a task, update its row in the Roadmap table and the Known gaps section of `docs/design/lesson-builder.md` before reporting done.
- Keep changes inside `web/src/components/lesson-builder`, `web/src/lib/lesson-builder`, `web/src/app/admin/lesson-builder`, and `web/src/styles` unless the task explicitly asks you to touch other areas.
- Report back briefly: what changed, which checks you ran and their results, and any remaining friction or follow-up worth flagging.
