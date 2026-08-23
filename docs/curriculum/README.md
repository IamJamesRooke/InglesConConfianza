# Curriculum Body of Knowledge

This directory is the working source of truth for the Inglés Con Confianza body of knowledge. It is organized by what a lesson teaches, not by a fixed course level or final teaching sequence.

| Pillar | Purpose |
|---|---|
| Mappings (PostgreSQL) | The translation core, now preserved as canonical concepts plus a lossless queryable source archive. |
| Cognates (PostgreSQL) | Reliable similarities, spelling patterns, word families, memory bridges, and false-cognate confusion sets. |
| [Past and Past Participle](past-and-past-participle/README.md) | The canonical sound-based inventory of English past and participle forms. |
| [Transformations](transformations/README.md) | Productive prefix and suffix families that turn one useful English word or form into another. |
| [Structure](structure/README.md) | Reusable machinery for building statements, questions, negations, descriptions, and connected ideas. |
| [Vocabulary](vocabulary/README.md) | Compact reference tables for useful words that do not require independent mapping lessons. |

Each lesson has one canonical home. Indexes may cross-link a lesson when it supports more than one area. The future teaching sequence should express prerequisites and reinforcement without duplicating curriculum objects or encoding difficulty into this folder hierarchy.

## How to use this curriculum

- Use the PostgreSQL **mappings** archive when a frequent source form has several context-dependent translations.
- Use **structure** for reusable sentence-building rules.
- Use **transformations**, PostgreSQL **cognates**, and **past and past participle** for visible word- or form-building relationships.
- Use **vocabulary** for compact reference material that does not currently justify an independent lesson family.
- Build course lessons separately by referencing the smallest relevant curriculum objects and deliberately revisiting earlier ones.

## Current maturity

Mappings are fully captured in PostgreSQL as 2,225 immutable source documents and 4,322 extracted table rows. Cognates are captured as 265 immutable documents and 1,250 extracted rows, with all 751 staged catalog items promoted into the same canonical concept table used by mappings. The remaining pillars are primarily human-facing references and should gain metadata only when real lesson authoring or import work requires it. Vocabulary is intentionally flat and table-first.

The active step is database-driven normalization and curation of the captured mappings archive. The [active backlog](../backlog.md) defines the current order and completion gates; lesson-contract discovery is paused until the owner changes priority.

## Curation Boundary

This body of knowledge preserves the useful migrated curriculum as an authoring reference. It is deliberately “good enough,” not frozen or complete. Building real lessons may promote supplemental material, expose missing mappings, or reveal that two objects should be merged. Those changes should be driven by teaching and product evidence rather than by a requirement to perfect every folder before implementation begins.
