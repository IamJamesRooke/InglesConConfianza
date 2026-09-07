# Taxonomy cleanup — batch plan & ledger (2026-09-07)

Policy: `policy.md`. Inventory: `inventory.json` (regenerate with
`npm run curriculum:inventory`). Per-item findings: `findings.md`.

**Resume protocol:** run `npm run curriculum:inventory`, compare its summary to
the "Baseline" column below, then continue at the first batch whose Status is
not `done`. Do not re-derive analysis that is already in `findings.md`.

## Baseline (inventory, 2026-09-07, pre-cleanup)

| Metric | Value |
|---|---|
| concepts (all / non-trash) | 4447 / 4225 |
| roles | core 310 (7.0%) · supporting 1112 · reference 2803 · trash 222 |
| global orphans (non-trash, no topic base tag) | 24 |
| confusion groups outside the two Mappings topics | 9 buttons / 6 topics |
| within-topic gaps (base tag, no group) | verbs 301 · nouns 6 · adjectives 7 · adverbs 5 · connectors 5 · determiners 3 · pronouns 2 · prepositions 2 · numbers 1 · verb-patterns 1 · en-mappings 5 · phrasal-verbs-by-root 7 |
| empty configured groups | interrogatives `contrast:confusable` (0 rows) |

Track A (facet audit) and Track B (per-concept audit) from
`docs/curation/full-audit-*` are ~99.8% complete and are treated as prior work;
this cleanup re-examines taxonomy structure, not every concept again.

## Batches (ordered)

| # | Batch | Status | Commit | Notes |
|---|---|---|---|---|
| 0 | Inventory tooling + policy + plan + findings | **done** | _(this commit)_ | `scripts/curriculum-inventory.ts`, `npm run curriculum:inventory` |
| 1 | Confusion-group boundary | **done** | _(this commit)_ | 9 buttons removed from 7 topics; "Common confusions" family added to both Mappings pages (5 buckets: `topic:confusable-possessive` / `-pronoun` / `-determiner` / `-verb` / `-false-friend`); `-pronoun-other`/`-determiner-other` renamed to canonical; 65 concepts bucketed + given `topic:multi-sense` where Spanish-anchored; 4 non-pairs untagged from `contrast:confusable`. `confusionOutsideMappingsCount` 9 → **0**. New `navigation.ts` test enforces it. Residual: cognates gap 0→2 (`disponibilidad`/`disponible` — pre-existing `topic:cognate` with no `cognate:` pattern, exposed; → Batch 4). |
| 2 | Global orphans (24) | todo | | time-expression phrases (`el año pasado`, `la mañana`…), comparative phrases (`más de …`, `menos …`), bare adverbials (`a casa`, `cerca de un lugar`), grammar-term rows (`tiempo pasado → past time`). Route each to an existing topic group or `trash`. See `findings.md#orphans`. |
| 3 | Verbs within-topic gap (301) | todo | | the thematic Verbs redesign dropped the `topic:verb-other` catch-all; 301 `pos:verb` rows now reach no group. Decide: re-introduce a themed residual family vs. extend existing verb themes. Largest single item — own sub-plan. |
| 4 | Small within-topic gaps (~45) | todo | | nouns/adjectives/adverbs/connectors/prepositions/numbers/verb-patterns/en-mappings/phrasal-root residuals from the table above — mostly a missing facet tag or a genuine one-off for "Other". See `findings.md#gaps`. |
| 5 | Numbered-partition & label cleanup | todo | | kill `(1)/(2)/…` suffixes across `topics.ts` (Verbs "Formal & Rare Verbs (15)", Nouns "el, -o (8)", Cognates "Identical / transparent (19)", Mappings "ser (23)", etc.). Merge where the split axis is arbitrary; rename for content where a real split exists. Label-only where possible; `collections:apply RENAME` where the identifier is bad. |
| 6 | Explicit Family config | todo | | replace name-inference in `navigation.ts` `facetGroup()` with an explicit `family` on each facet button (or a `families[]` block per topic) in `topics.ts`. Audit every Topic→Family→Group name against contents. Keep the side-by-side browse UX and all deep links. |
| 7 | Core complete pass | todo | | audit every `core` concept (310 now; re-check original + final set) for a discoverable home, correct group, correct grammar/semantic/construction/headword tags, no misleading membership, mapping-group membership where translation is ambiguous. |
| 8 | Verify + regression coverage | todo | | snapshot parity + `db:verify` + `db:test`; add tests: full Core reachability, no confusion group outside Mappings, valid nav refs, distinct-count accuracy on overlapping groups, deep-link retention after renames. Browser-verify representative paths incl. the moved `su` mapping. |

## Ledger

Append one row per applied batch: date · batch # · commit · manifests ·
inventory delta (orphans / confusion-outside / gaps).

- 2026-09-07 · Batch 0 · 4a28515a · — · baseline captured.
- 2026-09-07 · Batch 1 · _(this commit)_ · confusion-A-collections, confusion-B-buckets, confusion-C-untag · confusion-outside-mappings 9→0 · orphans 24 (unchanged) · mappings base 1555→1586 · new cognates gap +2 (deferred to Batch 4).
