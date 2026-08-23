# Repository guidance

Inglés Con Confianza is a language-learning application built from the owner's teaching methodology for Spanish-speaking adults in Bogotá. Treat the curriculum as core intellectual content and preserve its teaching logic.

## Current priorities

- The repository is currently in a lesson-authoring and curriculum data-model discovery phase. Follow `docs/curriculum/AGENTS.md` for direct curriculum-source work.
- Use the backlog and product documentation to understand the current stage; do not assume planned technology is already present.
- Infer commands, dependencies, and conventions from repository files. Never invent setup, build, lint, or test commands.

## Active handoff notes

- The Lesson Builder is the current center of product discovery. It saves handcrafted lesson content through `web/src/app/api/lesson-builder/lessons/route.ts` into `web/data/lessons.json`.
- The old SQLite/demo lesson prototype has been retired. PostgreSQL is now approved only for the curriculum database and review workflow; do not reintroduce SQLite or migrate Lesson Builder persistence until the owner explicitly expands that scope.
- The experimental curriculum graph has been retired. PostgreSQL is the canonical machine-readable curriculum store, modeled in `web/prisma/schema.prisma`; `Contenido del curso` renders its mappings and supports inline editing, deletion, bilingual search, collection filters, and teaching-priority filters. Immutable JSON snapshots under `web/prisma/seed-data/` exist only for reproducible database bootstrap and parity verification.
- For a fast handoff, start with `docs/backlog.md`, then `docs/curriculum/DATABASE-DISCOVERY.md`, then the PostgreSQL schema and server store code under `web/prisma/` and `web/src/lib/curriculum/server/`.
- Curriculum mappings are currently Spanish-first and concept-level. Preserve phrase- and construction-level mappings such as `quiero que [alguien] [haga algo]` → `to want [somebody] [to do something]`; do not expand ordinary conjugations into separate records unless the form changes the natural English meaning or teaching behavior.
- Each mapping has exactly one English target, one generic bilingual example, reusable collections, and one curriculum role: `core`, `supporting`, or `reference`.
- The former `docs/curriculum/mappings` source tree has been captured losslessly in PostgreSQL and retired. Its immutable snapshot is `web/prisma/seed-data/curriculum-sources.json`; query inventory with `npm run curriculum:mappings:inventory` and rows with `npm run curriculum:sources:query -- --search <text>` from `web/`.
- `core` remains an elite, highly selective curriculum role: every Core concept needs a strong justification that learners must explicitly master it to function in English. `supporting` is also selective. Preserve uncertain but useful language as `reference` during migration so later promotion and demotion cannot lose source coverage.
- Normalize captured mapping rows from PostgreSQL in broad, reversible passes. Preserve the immutable raw documents, compare proposed concepts with PostgreSQL before migration, default uncertain useful material to Reference, and record curation state in the database rather than recreating filesystem source hubs.
- Treat completeness and curation asymmetrically: missing Core language is costly, while temporarily retaining too much Supporting or Reference material is cheap. During audits, surface plausible non-Core mappings rather than silently excluding them, but distinguish predictable compositions from independently teachable mappings.
- Collections cover both semantic groupings and reusable grammatical/construction patterns. For example, `somebody to do something` groups `want somebody to do something`, `need somebody to do something`, and related constructions. Do not add a duplicate grammar field until repeated data demonstrates that collections are insufficient.
- `docs/curriculum/DATABASE-DISCOVERY.md` records the detailed migration rules discovered so far. Continue to treat the JSON model as exploratory and prefer small, reversible changes.
- `docs/teaching-methodology.md` is now the working reference for lesson design. It records first-attempt answerability, one teaching focus at a time, example-first discovery, immediate information/application micro-steps, limited incidental-vocabulary hints, short-lesson momentum, confidence-building endings, and learner-friendly North American pronunciation bridges without learner-facing IPA.
- `web/data/lessons.json` currently contains the tutorial placeholder plus four authored content lessons. The former long lesson 3 was split at the confidence milestone `It's important.`; preserve the current block order and teaching progression unless the owner requests another editorial change.
- Expect this model to change. Prefer small, reversible changes that help the owner inspect real lesson examples and refine the data model.

## Product and engineering decisions

- Work MVP-first. Prefer the smallest clear, maintainable solution to a demonstrated need.
- The intended application direction includes Next.js, React, TypeScript, Tailwind CSS, PostgreSQL, Prisma, authentication, payments, testing, containers, deployment, and OWASP Top 10 security practices. Introduce these only when the current task and project stage require them.
- Do not add microservices, Kubernetes, enterprise patterns, or speculative abstractions for portfolio signalling.
- Favor professional work the owner can understand, explain in an interview, and maintain independently.
- When implementation begins, treat security as part of design and testing. The long-term security portfolio should include threat modeling, authorization tests, a controlled penetration test, findings, and hardening—not unsupported claims of security.
- When updating the backlog after implementation work, record any security practice actually applied and the evidence that supports it. Keep implemented controls separate from planned security work, and do not claim protection that has not been tested.
- Keep changes within the requested scope. Do not turn focused work into unrelated architecture, automation, or maintenance.
