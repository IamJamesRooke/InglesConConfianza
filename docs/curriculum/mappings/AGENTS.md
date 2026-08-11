# Mapping normalization guidance

These instructions govern everything under `/docs/curriculum/mappings`. They preserve the owner's long-term normalization plan across Codex sessions and context compaction.

## Phase gate protocol

- Work in explicit, reviewable phases.
- Before each phase, tell the owner the phase name, exact scope, recommended Codex model and reasoning level, and what will not change.
- Ask for approval before editing files. Do not treat approval for one phase as approval for the next.
- After each approved phase, validate the affected mappings, update `docs/backlog.md`, commit the phase, and report the commit before proposing another phase.
- Recheck current official model guidance before making a model recommendation if model availability may have changed.

As of 2026-08-09, use **Sol High** for curriculum architecture, source-direction decisions, semantic splitting, missing-meaning review, and difficult bilingual hubs. Reserve **Sol XHigh** for final completeness and reverse-coverage audits. Use **Terra High** only after a phase is sufficiently specified to be mostly mechanical. Use **Luna** for deterministic inventories and validation, not for deciding teaching content.

## Objective

Treat mappings as the primary practical vocabulary system of Inglés Con Confianza. The final collection is a bilingual graph of atomic, directional translation choices:

> one source word, form, or expression → one target meaning, supported by one to three self-disambiguating examples

The atomic translation choice remains the database-ready unit, but it does not always require its own physical Markdown file. When several conjugated forms express the same directional translation concept, use one `mapping-concept` file and retain each independently trackable form-and-meaning edge as a nested atomic mapping with its original stable ID.

Completeness currently matters more than brevity. Preserve useful teaching material during normalization; cutting and final course sequencing happen later.

## Canonical ownership

- Each top-level directional folder represents one frequent source-language lemma or simple source word.
- A source does not earn a top-level mapping folder merely because it has direct synonyms or register alternatives that a learner can infer. Route ordinary vocabulary to `/vocabulary`, reusable grammar to `/structure`, and productive or cognate relationships to `/transformations`.
- Closely related derived words may live under the strongest human-facing lexical owner when separate top-level folders would make the curriculum harder to scan. Keep each source independently searchable through filenames, YAML `source_lemma`, aliases, and `index_under` metadata.
- Put inflected or surface variants under their lemma when the form changes the natural translation, restriction, time meaning, or teaching value. For example, English `am`, `is`, `are`, `was`, and `were` belong under `be`; Spanish `puedo`, `pude`, `podía`, and `podría` belong under `poder`.
- Put a multiword expression under its most useful lexical headword. Default to atomic files directly inside that source bucket; create another expression subfolder only when a genuine internal hierarchy is necessary and the owner approves it.
- Keep pronominal variants under the unmarked lemma, such as `quedarse` under `quedar`.
- A lesson has one canonical physical file but may be linked from multiple README indexes when that materially improves retrieval. Do not copy the same directional object into several locations merely for navigation.
- During the current normalization and completeness passes, follow the owner's preservation rule: **when in doubt, duplicate** uncertain or overlapping teaching content into plausible retrieval locations instead of filtering it out. Canonicalize and deconflict only in a later approved curation phase. Stable IDs must still prevent two files from accidentally claiming to be the same machine object.
- Preserve intentional owner-approved exceptions, but update the durable rule when the owner revises an earlier decision. The former `to-too-and-two` bundle was split in Phase 2: `to` and `too` are canonical maps, while direct `two` material belongs in supplemental number vocabulary and the shared sound contrast is indexed from both maps.

Completed directional ownership corrections:

- Phase 2 split English `to-too-and-two` into canonical `to` and `too` maps and routed direct `two` material to supplemental number vocabulary.
- Phase 5A moved English `end up` under `end`, `in front of` under `in`, `next to` under `next`, and `no longer` under `long`.
- Phase 5A consolidated the `aside` lessons under the owner-approved `side` family and moved the misplaced English source object `authority` out of `power` into its own canonical bucket.
- The English directional root README is the exhaustive alphabetical index of canonical top-level source buckets. Do not restore historical “frequency additions” or separate expression sections there.
- Phase 5B moved Spanish `a pesar de` under `pesar`, `así que` under `así`, `hace` under `hacer`, `cuántos/cuántas` under `cuánto`, and `juntos/juntas` under `junto`.
- Phase 5C superseded the earlier blanket rule that lexicalized Spanish words must remain top-level. **Llamado** now lives under `llamar`, **muerto** under `morir`, **vivo** under `vivir`, **costo** under `costar`, **parecido** under `parecer`, and **pregunta** under `preguntar`. Keep a derived form top-level only when its independent mapping value outweighs the benefit of a cleaner lexical family.
- Owner-approved close-form families may use one human-facing owner even when the forms are not inflections: **ante** lives under `antes`; **abajo** and **debajo** under `bajo`; **cuán** under `cuánto`; **tan** under `tanto`; and accented **sí** under `si`. Use this exception only when the visible relationship improves retrieval, not for words that merely resemble one another.
- Personal-pronoun and article forms remain top-level Spanish reference exceptions under the owner's completeness decision.
- The Spanish directional root README is the exhaustive alphabetical index of canonical top-level source buckets. Do not restore historical adjective, frequency-addition, or other layered index sections there.

## Direction and reverse coverage

- Keep mappings directional and asymmetric. A frequent source with several useful outputs deserves a canonical map; do not manufacture a reverse folder merely for symmetry.
- Every important edge must still be checked in reverse. If the reverse source independently qualifies, create or link its separate reverse-direction object.
- Record reverse state explicitly as `linked`, `pending`, or `not-applicable`.
- A reverse object has its own examples and teaching context; it is not the same JSON object with the languages swapped.

## Atomic mapping files

- Every top-level or nested object with `kind: mapping` represents exactly one source-to-target meaning.
- A file with `kind: mapping` contains one atomic object. A file with `kind: mapping-concept` contains one source-lemma-to-target-concept choice and a `mappings` list of its atomic surface variants. Do not use a grammatical family as the physical file boundary.
- Group variants only when they share the same translation concept and teaching distinction. Keep **poder → can** for present ability separate from **poder → can** for permission, and keep **pude → managed to** separate from **pude → got to**.
- Give each concept a stable ID. Retain a stable `family_id` for the grammatical roll-up, a stable `form_id` for each trackable surface form, and the existing stable ID for each nested atomic mapping. Repeat `form_family` as metadata across concept files instead of creating one oversized tense-family container.
- A nested mapping records `form_surface` alongside `form_id`. This keeps the bare conjugated form explicit even when the mapping source contains negation, a question frame, or a larger expression such as **no pude**, **¿puedo...?**, or **puede que**.
- Record `clause_type` and `polarity` whenever the concept represents a reusable statement or question frame. Add `question_type: yes-no` to ordinary inverted questions. These are independently queryable construction facts, not aliases and not substitutes for the semantic `sense`.
- Keep identical-looking questions separate when their communicative job differs. For example, **¿Puedes levantar esto?** may test ability while **¿Puedes cerrar la ventana?** makes a request; both use **Can you...?**, but they are different mapping concepts.
- The target may be a word or a natural expression, such as `pude` → `managed to`.
- Split context-dependent outputs into separate files. Do not create files such as `pude (could and managed to).md`.
- Use one to three simple, natural examples whose context resolves the intended referent or meaning without relying on the filename.
- Keep a short usage explanation only when it resolves a real choice. Put broad comparisons in the folder README or a focused contrast lesson.
- Do not repeat the same examples in YAML and a hand-maintained Markdown table. YAML is the machine-readable source; the Markdown body supplies the title and concise teaching note.
- READMEs are navigation and synthesis, not atomic mapping objects.

## Human-readable filenames

- Keep filenames easy for the owner to scan. UTF-8, spaces, accents, and parenthetical disambiguators are allowed.
- Prefer learner-facing context such as `lo (a un hombre).md`, `lo (a una cosa).md`, and `lo (a usted).md`.
- For expressions, use names such as `end up (terminar).md` or `be able to (poder).md`.
- Never use the filename as the data contract. Stable IDs and mapping fields live in YAML and survive later file moves.

## YAML contract

Use this contract for atomic mapping objects. Refine it only through an approved phase after testing it on real lessons.

```yaml
---
id: es-lo-direct-object-man--en-him
kind: mapping
direction: spanish-to-english
source_language: es
source: lo
source_lemma: lo
source_variant: masculine-person-direct-object
target_language: en
target: him
sense: masculine-person-direct-object
aliases: []
index_under:
  - lo
reverse_status: pending
reverse_ids: []
status: draft
examples:
  - source: "Veo a Carlos todos los días. Lo veo en la oficina."
    target: "I see Carlos every day. I see him at the office."
---
```

Required atomic fields are `id`, `kind`, `direction`, `source_language`, `source`, `source_lemma`, `target_language`, `target`, `target_lemma`, `sense`, `taxonomy`, `reverse_status`, `status`, and `examples`. Use `source_variant`, `aliases`, `index_under`, and `reverse_ids` when applicable. Add `source_features` and `target_features` whenever the corresponding side encodes an inflected verb, nonfinite verb form, grammatical person or number, or pronominal function. Add fields such as `register`, `region`, `constraints`, or migration provenance only when a real lesson requires them.

A conjugated mapping concept uses this container shape:

```yaml
---
id: es-poder-present-ability--en-can-concept
kind: mapping-concept
direction: spanish-to-english
source_language: es
source: poder
source_lemma: poder
target_language: en
target: can
target_lemma: can
sense: present-ability
clause_type: declarative
polarity: affirmative
family_id: es-poder-present-indicative-family
form_family: present-indicative
family_features:
  tense: present
  mood: indicative
  verb_form: finite
taxonomy:
  category: verb
  subcategory: ability-expression
status: draft
form_count: 5
mapping_count: 5
mappings:
  - id: es-puedo-present-ability--en-i-can
    kind: mapping
    # complete atomic mapping fields remain here
    concept_id: es-poder-present-ability--en-can-concept
    family_id: es-poder-present-indicative-family
    form_id: es-poder-present-indicative-form-puedo
    form_surface: puedo
---
```

Required concept fields are `id`, `kind`, `direction`, `source_language`, `source`, `source_lemma`, `target_language`, `target`, `target_lemma`, `sense`, `family_id`, `form_family`, `taxonomy`, `status`, `form_count`, `mapping_count`, and `mappings`. A finite statement or question concept must also contain `clause_type` and `polarity`, repeated on each nested atomic mapping so a flattened export remains self-contained. Add `question_type` when `clause_type` is `interrogative`. Nonfinite and noun concepts omit clause-shape fields rather than inventing a clause. Every nested mapping must still satisfy the complete atomic contract and add matching `concept_id`, `family_id`, `form_id`, and `form_surface` references. Concept and atomic mapping IDs are globally unique. A form ID may recur as a reference in several concept files, but it must always resolve to the same lemma, family, surface form, and grammatical features.

Follow the complete metadata contract in [`DATA-READINESS.md`](DATA-READINESS.md). In particular, distinguish source-side `aliases` from target-side `accepted_targets`, use `target_lemma` for canonical target lookup, distinguish grammatical person from referent person, and keep source and target features separate. Do not invent conditional values merely to fill fields.

IDs must be unique, stable, ASCII slugs. Allowed review states are `draft`, `reviewed`, and `owner-approved`.

## Mapping boundaries

- A contextual translation choice belongs in mappings.
- A reusable sentence-building rule belongs in structure, even if mapping lessons link to it.
- Auxiliary English `do` may still have a directional mapping object whose target is an explicit Spanish no-auxiliary frame. Keep the broader rule for forming Spanish questions and negatives in structure; the mapping object records the high-frequency fact that English `do`, `does`, and `did` do not receive a separate Spanish word in that use.
- Productive word formation belongs in transformations.
- A contrast lesson may remain for teaching, but mark it separately from an atomic mapping object when YAML is introduced. A top-level or nested `kind: mapping` becomes a basic translation record; `kind: mapping-concept` becomes a human-readable grouping of atomic variants that share one translation concept.
- Source-side contractions and spelling variants are `aliases`; target-side equivalents are `accepted_targets`. Either becomes an independent object when it changes meaning, use, register, or another teaching choice.
- Mapping examples are explanatory evidence, not learner-tracked exercises. Lesson membership, exposure counts, answers, errors, mastery, and spaced-repetition state must eventually reference mapping IDs from separate records rather than being embedded in mapping YAML.

## Loss prevention and validation

- Before each migration phase, inventory the exact source files and extract or count their unique teaching rows.
- Do not delete or replace a source lesson until every useful meaning and example is represented in a canonical destination or deliberately retained contrast lesson.
- Preserve the owner's concurrent changes and never restore intentionally moved or deleted material without evidence.
- Validate YAML syntax, required fields, unique concept and mapping IDs, consistent family and form references, direction/language agreement, one-to-three examples, reverse IDs, README coverage, local links, unindexed lessons, empty directories, and stale paths.
- Use small commits organized by bilingual hub or narrowly defined batch.

## Durable normalization roadmap

1. **Contract and inventory — Sol High.** Establish these rules, record the baseline, classify top-level expression ownership, and select the pilot. Completed 2026-08-09.
2. **Atomic `lo` pilot and `to/too/two` topology correction — Sol High.** Apply the YAML contract and human filenames to the individual `lo` meanings, preserve all examples, remove the combined lesson only after a loss audit, test validation, split `to` and `too`, and route direct `two` material to supplemental number vocabulary.
3. **English `be` form topology — Sol High.** Organize `be`, `am`, `is`, `are`, `was`, `were`, `been`, `being`, and high-value expressions without flattening grammar into mappings. Completed 2026-08-09 with 230 atomic objects and all original teaching sets retained.
4. **Reverse `be` hub — Sol High or XHigh.** Phase 4A completed 2026-08-09: normalize and cross-audit `ser`, `estar`, and `haber` as 298 atomic Spanish objects, expand English `be` to 321 objects, preserve all 16 source lessons, and link 225 reciprocal edges. A mappings-only data-readiness pilot was followed on 2026-08-10 by a complete metadata audit of all 629 normalized objects. Phase 4B completed 2026-08-11: add 99 atomic `tener` objects and 118 atomic `poder` objects, add 199 reverse-hub objects across `have`, `can`, `could`, `manage`, `may`, `might`, `power`, `get`, `be`, and directly related lexical heads, close 46 pending `be` edges, and preserve all 51 original non-README teaching and contrast files unchanged. Phase 4C completed 2026-08-11 as a lossless compression experiment. Phase 4D replaced its oversized tense-family containers with the canonical mapping-concept template. Phase 4E retired the temporary `poder/teaching-sets` scaffold after a 42-file and 60-row loss audit, expanded `poder` to 51 concept files and 140 atomic mappings, added queryable clause and polarity metadata, and moved neighboring lexical concepts to their own canonical source hubs.
5. **Top-level expression ownership cleanup — Sol High.** Completed 2026-08-11. Phase 5A audited all 313 English top-level buckets, consolidated five misplaced source buckets, moved `authority` out of `power`, preserved 13 relocated lessons byte-for-byte, and rebuilt an exhaustive index of 310 canonical English sources. Phase 5B audited all 394 Spanish top-level buckets, consolidated five clear expression or surface-form owners, preserved seven relocated lessons byte-for-byte, and rebuilt an exhaustive index of 389 canonical Spanish sources. Phase 5C Pass 1 curated the Spanish index to 350 top-level sources by consolidating clear lexical and close-form families, routing ordinary vocabulary and cognates to their proper pillars, moving structural lessons out of mappings, and correcting several English-headed families that had been stored in the Spanish direction.
6. **High-frequency bilingual hubs — Terra High for specified batches, with separate Sol review when judgment remains.** Phase 6A completed 2026-08-11 on Sol High: normalize `do / make ↔ hacer` with eight present/past mapping concepts, 137 new atomic mappings, 43 reciprocal pairs, explicit auxiliary-zero mappings, and all 30 legacy non-index lessons unchanged. Continue with `get`, movement verbs, perception/knowledge verbs, request verbs, pronouns, particles, and connectors in separately approved commits.
7. **Remaining mapping normalization — Terra High in bounded batches.** Split mixed files, add YAML, preserve contrasts, and update indexes.
8. **Bidirectional completeness audit — Sol XHigh.** Recheck frequency coverage, missing reverse edges, variants, false cognates, and Spanish-speaker interference.
9. **JSON dry run — Terra High.** Parse YAML into temporary JSON, compare object counts and links, and keep Markdown as the editable source until the application data workflow is approved.

The model recommendation and exact scope must still be presented to the owner for approval before every phase.
