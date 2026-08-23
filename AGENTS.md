# Repository guidance

Ingles Con Confianza is a language-learning application built from the owner's teaching methodology for Spanish-speaking adults in Bogota. Treat the curriculum as core intellectual content and preserve its teaching logic.

## Current priorities

1. Curate the PostgreSQL curriculum: remove low-value material, correct normalization, merge duplicates, simplify collections, and make curriculum roles selective.
2. Build the first course module from the curated database and validate the lesson-authoring and learner experience.

Migration is complete. Do not recreate the retired Markdown source trees, build another import pipeline, or add specialized curriculum tables. New curriculum work consists of deliberate database inserts, edits, merges, and deletions.

## Start here

- `docs/backlog.md` records the active sequence and completion gates.
- `docs/curriculum-database.md` defines the canonical curriculum record and curation rules.
- `docs/teaching-methodology.md` defines lesson design and the intended learner experience.
- `web/prisma/schema.prisma` models the PostgreSQL curriculum database.
- `web/src/lib/curriculum/server/` owns curriculum reads and writes.
- `web/data/lessons.json` remains the Lesson Builder store until the owner expands PostgreSQL scope.

## Curriculum boundaries

- PostgreSQL is the only canonical machine-readable curriculum store. Teachable content belongs in `curriculum_concepts`; collections provide queryable grouping without parallel catalogs.
- Immutable JSON snapshots under `web/prisma/seed-data/` exist for reproducible bootstrap and parity verification. Update them through the established export workflow after approved database changes; do not edit them as the primary store.
- The archived source documents and extracted rows in PostgreSQL are immutable provenance. They do not create an obligation to retain every imported concept.
- Each concept is Spanish-first, has exactly one English target, one generic bilingual example, reusable collections, and one role: `core`, `supporting`, or `reference`.
- `core` is an elite functional tier. `supporting` is selective and broadly reusable. `reference` is the default home for valid but secondary, situational, inferable, or specialized material.
- Compare proposed inserts and merges with PostgreSQL before writing. Prefer small, reversible curation batches with tests and snapshot parity after each batch.
- Do not perform database curation concurrently with the owner unless responsibility for the current batch is explicit.

## Product and engineering decisions

- Work MVP-first. Prefer the smallest clear, maintainable solution to a demonstrated need.
- Follow existing Next.js, React, TypeScript, Tailwind CSS, Prisma, and PostgreSQL patterns. Introduce planned infrastructure only when the current task requires it.
- Do not add microservices, Kubernetes, enterprise patterns, or speculative abstractions for portfolio signaling.
- Keep Lesson Builder persistence separate from the curriculum database until the owner explicitly changes that boundary.
- Treat security as part of design and testing. Record only controls that were actually implemented and verified.
- Keep changes within the requested scope and preserve unrelated user work in a dirty worktree.
