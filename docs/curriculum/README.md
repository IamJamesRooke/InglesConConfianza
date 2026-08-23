# Curriculum Body of Knowledge

This directory is the working source of truth for the Inglés Con Confianza body of knowledge. It is organized by what a lesson teaches, not by a fixed course level or final teaching sequence.

| Pillar | Purpose |
|---|---|
| Mappings (PostgreSQL) | The translation core, now preserved as canonical concepts plus a lossless queryable source archive. |
| Cognates (PostgreSQL) | Reliable similarities, spelling patterns, word families, memory bridges, and false-cognate confusion sets. |
| [Past and Past Participle](past-and-past-participle/README.md) | The canonical sound-based inventory of English past and participle forms. |
| Transformations (PostgreSQL) | Productive, limited, irregular, and recognition-only English word-family relationships stored with normalized bilingual transformation notation and flat query collections. |
| Structure (PostgreSQL) | Reusable machinery for building statements, questions, negations, descriptions, comparisons, and connected ideas. |
| Vocabulary (PostgreSQL) | Searchable words, expressions, semantic categories, and verb families preserved as canonical concepts plus a lossless source archive. |

Each lesson has one canonical home. Indexes may cross-link a lesson when it supports more than one area. The future teaching sequence should express prerequisites and reinforcement without duplicating curriculum objects or encoding difficulty into this folder hierarchy.

## How to use this curriculum

- Use the PostgreSQL **mappings** archive when a frequent source form has several context-dependent translations.
- Use PostgreSQL concepts tagged `structure` for reusable sentence-building rules.
- Use PostgreSQL **transformations** and **cognates**, plus **past and past participle**, for visible word- or form-building relationships.
- Use PostgreSQL concepts tagged `vocabulary` for compact reference material that does not currently justify an independent lesson family.
- Build course lessons separately by referencing the smallest relevant curriculum objects and deliberately revisiting earlier ones.

## Current maturity

Mappings are fully captured in PostgreSQL as 2,225 immutable source documents and 4,322 extracted table rows. Cognates are captured as 265 immutable documents and 1,250 extracted rows. Vocabulary is captured as 17 immutable documents and 972 extracted rows, normalized into 592 concepts. Transformations are captured as 178 immutable documents and 594 extracted rows, normalized into 312 concepts. Structure is captured as 124 immutable documents and 600 extracted rows across its two migration passes, normalized into 405 concepts in the same canonical table. Past and past participle remains the principal human-facing pillar awaiting migration.

The active step is database-driven normalization and curation of the captured mappings archive. The [active backlog](../backlog.md) defines the current order and completion gates; lesson-contract discovery is paused until the owner changes priority.

## Curation Boundary

This body of knowledge preserves the useful migrated curriculum as an authoring reference. It is deliberately “good enough,” not frozen or complete. Building real lessons may promote supplemental material, expose missing mappings, or reveal that two objects should be merged. Those changes should be driven by teaching and product evidence rather than by a requirement to perfect every folder before implementation begins.
