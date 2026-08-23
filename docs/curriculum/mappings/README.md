# Mappings

Mappings are the practical translation core of Inglés Con Confianza. They teach how one Spanish or English form becomes different natural expressions depending on meaning, function, sentence pattern, and context.

The hierarchy is intentionally flat. Each direction contains individual source-form map families rather than categories such as verbs, pronouns, or connectors. The Spanish-to-English source tree has been consumed into PostgreSQL; the English-to-Spanish tree remains active source material for future reverse-audit work.

A canonical mapping family is intentionally asymmetric: the source word or fixed expression must be frequent and must have multiple useful translations in the other language. A reverse family is not created merely for symmetry. Related forms may appear under more than one retrieval path when that materially helps the learner, as with **inside/outside** under both the **side** family and **in/out**.

| Direction | Starting point |
|---|---|
| Spanish to English (migrated to PostgreSQL) | Choose the natural English form from a Spanish word, form, or construction. |
| [English to Spanish](english-to-spanish/README.md) | Choose the natural Spanish form from an English word, form, or construction; migrate only after rewriting useful rows into neutral Spanish-first database concepts. |

Each map folder contains a README plus concrete micro-lessons or mapping-concept files. Their records teach individual choices such as **querer algo**, **querer hacer algo**, and **querer que alguien haga algo**. PostgreSQL preserves approved concept-level data, review history, bilingual examples, source-path provenance, and reusable collections.

Mappings may link to reusable machinery in [`structure/`](../structure/README.md), but the learner-facing translation decision belongs here. This pillar is a canonical body of knowledge, not a final course sequence.

The durable atomic-object, canonical-ownership, and phased-normalization rules are recorded in [`AGENTS.md`](AGENTS.md). Query metadata and the boundary between mapping concepts, lessons, and future learner records are documented in [`DATA-READINESS.md`](DATA-READINESS.md). The active PostgreSQL migration plan, canonical concept forms, and collection/tag vocabulary live in [`POSTGRES-MIGRATION-PLAN.md`](POSTGRES-MIGRATION-PLAN.md).
