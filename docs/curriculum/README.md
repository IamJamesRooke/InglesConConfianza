# Curriculum Body of Knowledge

This directory is the human-readable handoff for the Inglés Con Confianza body of knowledge. PostgreSQL is the working curriculum source of truth, organized by queryable concepts and collections rather than a fixed course level or final teaching sequence.

| Pillar | Purpose |
|---|---|
| Mappings (PostgreSQL) | The translation core, now preserved as canonical concepts plus a lossless queryable source archive. |
| Cognates (PostgreSQL) | Reliable similarities, spelling patterns, word families, memory bridges, and false-cognate confusion sets. |
| Past and Past Participle (PostgreSQL) | The canonical sound-based inventory of English past and participle forms, with reviewed and pending pronunciation metadata kept distinct. |
| Transformations (PostgreSQL) | Productive, limited, irregular, and recognition-only English word-family relationships stored with normalized bilingual transformation notation and flat query collections. |
| Structure (PostgreSQL) | Reusable machinery for building statements, questions, negations, descriptions, comparisons, and connected ideas. |
| Vocabulary (PostgreSQL) | Searchable words, expressions, semantic categories, and verb families preserved as canonical concepts plus a lossless source archive. |

Each concept has one canonical database record and may belong to multiple query collections. The future teaching sequence should express prerequisites and reinforcement without duplicating curriculum objects or encoding difficulty into a filesystem hierarchy.

## How to use this curriculum

- Use the PostgreSQL **mappings** archive when a frequent source form has several context-dependent translations.
- Use PostgreSQL concepts tagged `structure` for reusable sentence-building rules.
- Use PostgreSQL **transformations** and **cognates**, plus **past and past participle**, for visible word- or form-building relationships.
- Use PostgreSQL concepts tagged `vocabulary` for compact reference material that does not currently justify an independent lesson family.
- Build course lessons separately by referencing the smallest relevant curriculum objects and deliberately revisiting earlier ones.

## Current maturity

All six pillars are captured in PostgreSQL. Mappings contain 2,225 immutable source documents and 4,322 extracted rows. Cognates contain 265 documents and 1,250 rows. Vocabulary contains 17 documents and 972 rows, normalized into 592 concepts. Transformations contain 178 documents and 594 rows, originally normalized into 312 concepts and later enriched by comparison and verb-form transformations. Structure contains 124 documents and 600 rows across two passes, normalized into 405 concepts. Past and past participle contains 134 documents and 1,077 rows, normalized into 478 atomic form concepts across 190 verb bases.

The active step is database-driven normalization and curation of the captured mappings archive. The [active backlog](../backlog.md) defines the current order and completion gates; lesson-contract discovery is paused until the owner changes priority.

## Curation Boundary

This body of knowledge preserves the useful migrated curriculum as an authoring reference. It is deliberately “good enough,” not frozen or complete. Building real lessons may promote supplemental material, expose missing mappings, or reveal that two objects should be merged. Those changes should be driven by teaching and product evidence rather than by a requirement to perfect every folder before implementation begins.
