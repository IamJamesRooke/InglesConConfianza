# Backlog

> Last updated: 2026-08-23. PostgreSQL is the canonical curriculum store; Lesson Builder remains JSON-backed. All six former curriculum source trees are retained losslessly in PostgreSQL and its immutable seed snapshots. Detailed migration evidence is in the [curriculum migration log](history/curriculum-migration-log.md).

## Current objective

Turn the complete PostgreSQL curriculum archive into a trustworthy, queryable teaching catalog, then use it to build and validate the first lesson sequence.

## Now

- [ ] Run database-first curriculum cleanup: correct normalization mistakes, merge true duplicates, and retain ambiguous useful material as `reference` pending curation.
- [ ] Establish a durable collection taxonomy for grammatical patterns, semantic families, cognate groups, transformations, morphology, and pronunciation families.
- [ ] Audit curriculum roles deliberately: protect the elite `core` tier and review provisional `supporting` and `reference` assignments through database queries.
- [ ] Complete the pronunciation-family pass for the 337 past-form concepts tagged `sound metadata pending review`.
- [ ] Prove every archived source row is either linked to a canonical concept, retained as intentional evidence, or explicitly dismissed without changing immutable source records.

## Paused product work

- [ ] Build five representative lessons as the first vertical slice, including vocabulary retrieval, a one-to-many mapping, a form family, a structural or transformation concept, and deliberate review.
- [ ] Derive the minimum lesson, question, and learner-history contracts from those five lessons.
- [ ] Build the smallest complete learner flow: choose a lesson, answer Spanish-to-English prompts, receive feedback, and save progress.

## Database modeling considerations

- [ ] Define how lesson context maps to canonical curriculum data without creating competing editable sources of truth.
- [ ] Derive each lesson's newly introduced concepts and words from stable concept references and lesson order.

## Future product work

- [ ] Design low-friction learner onboarding once accounts are in scope.
- [ ] Add AI-assisted lesson drafting only after the canonical curriculum and authored lesson workflow have proved their needs.
- [ ] Add alpha learner feedback after the application has accounts and a complete learning flow.
- [ ] Evaluate authentication, payments, deployment, and broader infrastructure when the MVP requires them.

## Security practice record

- [x] Curriculum writes use PostgreSQL transactions, relational constraints, an empty-database seed guard, and exact post-import parity verification.
- [x] Source Markdown was retired only after PostgreSQL capture, immutable snapshot export, `db:verify`, and `db:test` passed.
- [x] The Markdown editor's vulnerable `js-yaml` and Prisma's vulnerable `deepmerge-ts` transitives are pinned to patched releases; `npm audit` reported no known vulnerabilities when last checked.
- [ ] Create an initial threat model when persistent lesson authoring, authentication, or other meaningful trust boundaries are introduced.
- [ ] Add authorization tests alongside the first protected authoring or learner-data endpoints.
- [ ] Perform a controlled OWASP-based security assessment after the first complete application flow is deployable.

## Deliberate non-goals

- Perfecting every curriculum classification before building lessons.
- Encoding course order, exposure counts, or learner mastery in the immutable source archive.
- Expanding beyond Spanish-speaking adults learning English before the core learning experience has evidence behind it.
