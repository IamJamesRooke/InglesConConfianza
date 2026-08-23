# Backlog

> Last updated: 2026-08-23. Curriculum migration is complete. PostgreSQL is the canonical curriculum store; Lesson Builder remains JSON-backed. The completed build narrative lives in the [project timeline](history/project-timeline.md).

## Current objective

Curate the curriculum into a selective, trustworthy teaching catalog, then build and validate the first course module.

## Phase 1: Curriculum curation

- [ ] Establish a database baseline: counts by role and collection, duplicate candidates, malformed-record patterns, and oversized or inconsistent collection families.
- [ ] Remove obvious garbage, accidental sentence records, unusable fragments, and concepts with no teaching or retrieval value.
- [ ] Merge true duplicates while preserving the strongest normalized concept, examples, useful collections, and provenance.
- [ ] Normalize retained concepts consistently: infinitives, noun articles, adjective support verbs, placeholders, transformations, phrasal roots and particles, and bilingual examples.
- [ ] Consolidate collections into a predictable taxonomy for grammar, constructions, semantics, cognates, transformations, morphology, and pronunciation.
- [ ] Gut the `core` tier using the functional-necessity test; keep `supporting` selective and demote valid secondary material to `reference`.
- [ ] Complete the pronunciation-family review for concepts still marked `sound metadata pending review` when it affects the first modules or high-priority retrieval.
- [ ] Export immutable snapshots and pass database regression and parity checks after every approved curation batch.

### Curation completion gate

Begin Module 1 when obvious structural problems are gone, role definitions are being applied consistently, and the concepts needed for the module are trustworthy. Full catalog perfection is not a prerequisite; later lessons should drive further curation.

## Phase 2: Module 1

- [ ] Define one concrete learner promise for the module and the final confidence-building sentence or interaction that proves it.
- [ ] Select only the Core and Supporting concepts required to fulfill that promise; use Reference concepts sparingly for context.
- [ ] Sequence short lessons using first-attempt answerability, one teaching focus at a time, immediate retrieval, cumulative reuse, and frequent confidence milestones.
- [ ] Include pronunciation bridges wherever English spelling would predictably mislead a Spanish-speaking learner.
- [ ] Author the module in Lesson Builder and test every prompt, accepted answer, hint, transition, and cumulative sentence in Practice.
- [ ] Record any missing, malformed, or poorly classified curriculum concepts revealed by authoring and curate them in PostgreSQL.
- [ ] Run the complete module as a learner and revise pacing, clarity, and lesson boundaries before expanding the course.

## Later

- [ ] Derive the minimum stable lesson, question, concept-reference, and learner-history contracts from the completed module.
- [ ] Add persistent learner accounts, progress, spaced repetition, authentication, and authorization only after the first module proves the learning flow.
- [ ] Create an initial threat model when persistent authoring, authentication, or learner data introduces meaningful trust boundaries.

## Deliberate non-goals

- Re-importing retired curriculum folders or rebuilding the migration pipeline.
- Perfecting all curriculum classifications before authoring Module 1.
- Encoding course sequence or learner mastery inside the immutable source archive.
- Expanding beyond Spanish-speaking adults learning English before the first learning experience has evidence behind it.
