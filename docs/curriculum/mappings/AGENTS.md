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

Completeness currently matters more than brevity. Preserve useful teaching material during normalization; cutting and final course sequencing happen later.

## Canonical ownership

- Each top-level directional folder represents one frequent source-language lemma or simple source word.
- Put inflected or surface variants under their lemma when the form changes the natural translation, restriction, time meaning, or teaching value. For example, English `am`, `is`, `are`, `was`, and `were` belong under `be`; Spanish `puedo`, `pude`, `podía`, and `podría` belong under `poder`.
- Put a multiword expression under its most useful lexical headword. Default to atomic files directly inside that source bucket; create another expression subfolder only when a genuine internal hierarchy is necessary and the owner approves it.
- Keep pronominal variants under the unmarked lemma, such as `quedarse` under `quedar`.
- A lesson has one canonical physical file but may be linked from multiple README indexes when that materially improves retrieval. Do not copy the same directional object into several locations merely for navigation.
- During the current normalization and completeness passes, follow the owner's preservation rule: **when in doubt, duplicate** uncertain or overlapping teaching content into plausible retrieval locations instead of filtering it out. Canonicalize and deconflict only in a later approved curation phase. Stable IDs must still prevent two files from accidentally claiming to be the same machine object.
- Preserve intentional owner-approved exceptions, but update the durable rule when the owner revises an earlier decision. The former `to-too-and-two` bundle was split in Phase 2: `to` and `too` are canonical maps, while direct `two` material belongs in supplemental number vocabulary and the shared sound contrast is indexed from both maps.

Known top-level ownership corrections identified in Phase 1:

- English `end-up` → `end`
- English `in-front-of` → `in`
- English `next-to` → `next`
- English `no-longer` → reconcile with the existing `long` lesson
- Spanish `a-pesar-de` → `pesar`
- Spanish `asi-que` → `asi`
- English `to-too-and-two` → separate `to` and `too`; route direct `two` material to supplemental number vocabulary

## Direction and reverse coverage

- Keep mappings directional and asymmetric. A frequent source with several useful outputs deserves a canonical map; do not manufacture a reverse folder merely for symmetry.
- Every important edge must still be checked in reverse. If the reverse source independently qualifies, create or link its separate reverse-direction object.
- Record reverse state explicitly as `linked`, `pending`, or `not-applicable`.
- A reverse object has its own examples and teaching context; it is not the same JSON object with the languages swapped.

## Atomic mapping files

- Every non-README file with `kind: mapping` represents exactly one source-to-target meaning.
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

Use this initial contract for pilot mapping objects. Refine it only through an approved phase after testing it on real lessons.

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

Follow the complete metadata contract in [`DATA-READINESS.md`](DATA-READINESS.md). In particular, distinguish source-side `aliases` from target-side `accepted_targets`, use `target_lemma` for canonical target lookup, distinguish grammatical person from referent person, and keep source and target features separate. Do not invent conditional values merely to fill fields.

IDs must be unique, stable, ASCII slugs. Allowed review states are `draft`, `reviewed`, and `owner-approved`.

## Mapping boundaries

- A contextual translation choice belongs in mappings.
- A reusable sentence-building rule belongs in structure, even if mapping lessons link to it.
- Productive word formation belongs in transformations.
- A contrast lesson may remain for teaching, but mark it separately from an atomic mapping object when YAML is introduced. Only `kind: mapping` becomes a basic translation JSON object.
- Source-side contractions and spelling variants are `aliases`; target-side equivalents are `accepted_targets`. Either becomes an independent object when it changes meaning, use, register, or another teaching choice.
- Mapping examples are explanatory evidence, not learner-tracked exercises. Lesson membership, exposure counts, answers, errors, mastery, and spaced-repetition state must eventually reference mapping IDs from separate records rather than being embedded in mapping YAML.

## Loss prevention and validation

- Before each migration phase, inventory the exact source files and extract or count their unique teaching rows.
- Do not delete or replace a source lesson until every useful meaning and example is represented in a canonical destination or deliberately retained contrast lesson.
- Preserve the owner's concurrent changes and never restore intentionally moved or deleted material without evidence.
- Validate YAML syntax, required fields, unique IDs, direction/language agreement, one-to-three examples, reverse IDs, README coverage, local links, unindexed lessons, empty directories, and stale paths.
- Use small commits organized by bilingual hub or narrowly defined batch.

## Durable normalization roadmap

1. **Contract and inventory — Sol High.** Establish these rules, record the baseline, classify top-level expression ownership, and select the pilot. Completed 2026-08-09.
2. **Atomic `lo` pilot and `to/too/two` topology correction — Sol High.** Apply the YAML contract and human filenames to the individual `lo` meanings, preserve all examples, remove the combined lesson only after a loss audit, test validation, split `to` and `too`, and route direct `two` material to supplemental number vocabulary.
3. **English `be` form topology — Sol High.** Organize `be`, `am`, `is`, `are`, `was`, `were`, `been`, `being`, and high-value expressions without flattening grammar into mappings. Completed 2026-08-09 with 230 atomic objects and all original teaching sets retained.
4. **Reverse `be` hub — Sol High or XHigh.** Phase 4A completed 2026-08-09: normalize and cross-audit `ser`, `estar`, and `haber` as 298 atomic Spanish objects, expand English `be` to 321 objects, preserve all 16 source lessons, and link 225 reciprocal edges. A mappings-only data-readiness pilot was followed on 2026-08-10 by a complete metadata audit of all 629 normalized objects. Phase 4B remains pending: normalize `tener` and especially `poder`, including source forms such as `puedo`, `pude`, `podía`, and `podría`, then audit their real reverse hubs.
5. **Top-level expression ownership cleanup — Sol High.** Rehome the known ownership violations and audit all remaining top-level buckets under the approved rules.
6. **High-frequency bilingual hubs — Terra High for specified batches, with separate Sol review when judgment remains.** Normalize `have/tener/haber`, `do/make/hacer`, `get`, movement verbs, perception/knowledge verbs, request verbs, pronouns, particles, and connectors in reviewable commits.
7. **Remaining mapping normalization — Terra High in bounded batches.** Split mixed files, add YAML, preserve contrasts, and update indexes.
8. **Bidirectional completeness audit — Sol XHigh.** Recheck frequency coverage, missing reverse edges, variants, false cognates, and Spanish-speaker interference.
9. **JSON dry run — Terra High.** Parse YAML into temporary JSON, compare object counts and links, and keep Markdown as the editable source until the application data workflow is approved.

The model recommendation and exact scope must still be presented to the owner for approval before every phase.
