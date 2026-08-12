# Mapping normalization guidance

These instructions govern everything under `docs/curriculum/mappings/`. Mappings are the curriculum's primary practical vocabulary system and its most developed machine-readable pilot.

## Phase gate

- Work in bounded, reviewable phases.
- Before a new normalization phase, tell the owner its exact scope, the recommended Codex model and reasoning level, and what will remain unchanged. Wait for approval before editing.
- Validate and commit each approved phase before proposing the next one.
- Do not resume a historical roadmap automatically. The active priorities live in [`docs/backlog.md`](../../backlog.md), and completed decisions live in the [curriculum migration log](../../history/curriculum-migration-log.md).

## Objective

The target is a directional bilingual graph whose atomic unit is:

> one source word, form, or expression → one target meaning, supported by one to three self-disambiguating examples

The physical file boundary may be larger than one atomic edge. A `mapping-concept` file can group conjugated forms that share one translation concept while retaining every independently trackable atomic mapping and stable ID.

Completeness currently matters more than brevity. Preserve useful teaching content during normalization; final cutting and course sequencing happen through separate, evidence-based work.

## Qualification and direction

- A top-level directional folder represents one frequent source-language lemma or simple source word with several useful context-dependent translations.
- Keep the two directions asymmetric. Do not create a reverse folder merely for symmetry or because a target has synonyms that a learner can infer.
- Check every important edge in reverse. If the reverse source independently qualifies, create or link its own reverse object with its own examples.
- Use `reverse_status: linked`, `pending`, or `not-applicable`; use `reverse_ids` only for real reciprocal objects.
- A word that has one straightforward translation belongs in [`vocabulary/`](../vocabulary/README.md), even when it is important or frequent.
- Reusable sentence-building rules belong in [`structure/`](../structure/README.md). Productive word formation belongs in [`transformations/`](../transformations/README.md), and Spanish-English form similarity belongs in [`cognates/`](../cognates/README.md).

## Canonical ownership

- Put inflected or surface variants under their lemma: English `am`, `is`, and `were` under `be`; Spanish `puedo`, `pude`, and `podría` under `poder`.
- Put a multiword expression under its most useful lexical headword. A phrase such as `end up` belongs under `end`; an expression beginning with `in` normally belongs under `in`.
- Keep pronominal forms under the unmarked lemma, such as `quedarse` under `quedar`.
- Closely related forms may share the strongest human-facing owner when that makes retrieval easier, such as `ante` under `antes` or `ahí` under `allí`. Do not merge words merely because they look similar.
- Personal pronouns and article forms may remain visible top-level exceptions when completeness and quick reference justify them.
- A lesson has one canonical physical home. Cross-link it from other useful retrieval paths; do not copy the same stable object into multiple files.
- During an explicitly completeness-first pass, the owner's fallback remains “when in doubt, duplicate” teaching coverage. Provisional duplication must not produce duplicate machine IDs and should be deconflicted in a later approved curation pass.
- Treat each direction's root README as the exhaustive alphabetical index of its canonical top-level folders.

## Atomic mappings and concepts

- `kind: mapping` represents one atomic source-to-target meaning.
- `kind: mapping-concept` represents one source-lemma-to-target-concept choice and contains complete atomic surface variants in `mappings`.
- Group variants only when they share the same translation and teaching distinction. Keep present **poder → can** for ability separate from permission, and keep **pude → managed to** separate from **pude → got to**.
- Person-changing conjugations are sibling forms, not aliases. **Puedo** and **puede** share a form family but supply different morphology and subject evidence. Explicit subjects such as **yo** or **él** belong in examples, not aliases.
- Retain four queryable levels when a conjugated family needs them: lemma, form family, surface form, and atomic translation choice.
- Use separate concepts for affirmative statements, negative statements, questions, and negative questions when their natural English strategy or teaching job differs. For example, **¿No lo quieres hacer?** may require **don't**, while **¿No lo puedes hacer?** requires **can't**.
- Keep identical-looking questions separate when communicative purpose differs, such as literal ability versus a polite request.
- The target may be a word or a natural expression. Never combine distinct outputs in one target value or use slash notation as a machine target.

## Human-readable files

- Keep filenames easy for the owner to scan. UTF-8, spaces, accents, and parenthetical disambiguators are allowed.
- Prefer learner-facing names such as `lo (a un hombre).md`, `lo (a una cosa).md`, or `be able to (poder).md`.
- Do not use numeric prefixes unless sequence itself is part of the teaching set.
- Never use the filename as the data contract. Stable IDs and explicit YAML fields must survive later moves or renames.
- READMEs are navigation and synthesis, not atomic mapping objects.

## YAML contract

Follow [`DATA-READINESS.md`](DATA-READINESS.md) for the complete field contract, controlled values, and future exercise boundary.

Every normalized atomic mapping requires:

- `id`, `kind`, and `direction`;
- `source_language`, `source`, and `source_lemma`;
- `target_language`, `target`, and `target_lemma`;
- `sense` and `taxonomy`;
- `reverse_status`, `status`, and one to three `examples`.

Add `source_variant`, `aliases`, `accepted_targets`, `index_under`, `reverse_ids`, `contrast_ids`, grammatical features, register, region, or constraints only when the object genuinely requires them. Omission is better than invented precision.

A mapping concept also requires stable `family_id` and `form_family`, accurate `form_count` and `mapping_count`, and complete nested mappings. Every nested mapping retains its stable `id` and adds consistent `concept_id`, `family_id`, `form_id`, and `form_surface` references. Finite statement or question concepts carry queryable `clause_type` and `polarity`, plus `question_type` when applicable.

Source-side spelling or interchangeable surface forms are `aliases`; target-side equivalent answers are `accepted_targets`. Either deserves a separate object when it changes meaning, use, register, or another teaching choice.

IDs are globally unique, stable ASCII slugs. Allowed review states are `draft`, `reviewed`, and `owner-approved`.

## Teaching content

- Give every atomic choice one to three short, natural examples whose context resolves the intended meaning or referent.
- Put examples in YAML. Do not repeat the same examples in a hand-maintained body table; the Markdown body should provide only a clear title and concise usage note.
- Keep broad comparisons and retrieval tables in the family README or a focused contrast lesson.
- Mapping examples explain a linguistic fact. They are not lesson membership, exercise occurrences, exposure counts, error records, mastery state, or spaced-repetition schedules.

## Loss prevention and validation

- Inventory source files and teaching rows before every migration.
- Do not retire a source until every useful meaning, example, warning, and regional note is represented at a canonical destination or deliberately retained contrast lesson.
- Preserve the owner's concurrent edits and accepted moves.
- Validate YAML syntax, required fields, controlled values, unique IDs, concept counts, family/form consistency, direction and language agreement, example counts, reverse IDs, README coverage, local links, unindexed lessons, stale paths, and empty directories.
- Use small commits organized by one bilingual hub or another narrowly defined batch.

## Current boundary

The normalized pilots prove that the Markdown-to-data approach can represent atomic mappings, compressed conjugated concepts, reciprocal edges, clause shape, and form-family exposure. Do not normalize the remaining repository merely for uniformity. The next mapping batch should be selected because the five-lesson product slice needs it or because the owner explicitly approves another bounded audit.
