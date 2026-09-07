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
| 2 | Global orphans (24) | **done** | _(this commit)_ | 19 homed (Adverbs/Time & Place, Determiners/Quantifier, Verbs, Transformations); 5 metalinguistic template/grammar-term rows → `trash` (logged in `findings.md`). `globalOrphanCount` 24 → **0**. `un poco` also got a real example (Determiners audit needs head word in example). |
| 3 | Verbs within-topic gap (301) | **done** | _(this commit)_ | all 301 were English past/participle **form drills** (`[participio] dive → dived`), given a false `pos:verb` by an earlier coverage-maximizing pass. Removed `pos:verb`; they stay fully reachable on Past-Tense & Past-Participle Formation via `topic:verb-form`. No themed "Other" bucket needed. Verbs gap 301 → **0**. |
| 4 | Small within-topic gaps (~45) | **done** | _(this commit)_ | 24 rows tagged into an existing group (Pronouns indef-quantity, Determiners quant/article, Nouns time-of-day, Adjectives -ible/-able/-al, Connectors conditional, Prepositions location, en-mappings confusion); 24 rows had a **wrong base tag** removed (question sentences tagged `pos:adjective`, verb phrases tagged `pos:adverb`/`pos:connector`/`pos:number`, "let's" tagged `topic:en-multi-sense`, 7 predicate-idioms tagged `topic:phrasal-verb`, `disponible`/`disponibilidad` tagged `topic:cognate`). 5 predicate idioms added to `audit-phrasal-verbs.ts` `SWEEP_EXEMPTIONS`. **Every topic now has within-topic gap 0.** |
| 5 | Numbered-partition & label cleanup | **BLOCKED — needs user decision** | | 435 `(N)` facet buttons. This directly reverses the user's documented standing "subtopic-size rule" (`curriculum_subtopic_size_rule`) + a completed project + an explicit "push harder, don't stop at close enough". Two axes: (a) Mappings / Phrasal-Verb pages — the numbered per-headword splits (`ser (1..23)`, `be (1..5)`) contradict each page's own stated purpose ("click a chip to see the **full range**"); recommend merge to one group per headword. (b) Nouns / Adjectives / Verbs — `el, -o (1..8)`, `Abstract quality — General (1..9)`, `Formal & Rare Verbs (1..15)` are real category overflow with no finer semantic axis; options are merge-and-accept-large, or find a new sub-axis, or keep numbered. Also: "Formal & Rare Verbs" is a dumping ground holding core verbs (`necesitar`, `leer`) — Verbs taxonomy needs "needing"/"reading" families; Adjectives needs a "word order" group (Batch 7 flags). |
| 6 | Explicit Family config | todo (after Batch 5 direction) | | replace name-inference in `navigation.ts` `facetGroup()` with an explicit `family` on each facet button (or a `families[]` block per topic) in `topics.ts`. Larger refactor: touches `page.tsx` requiredCollections, `readCurriculumNavigationCounts`, deep-link resolution, ~24 topics. Safer once Batch 5's grouping is settled. |
| 7 | Core complete pass | **done** | _(this commit)_ | 310 core, **no demotions in any batch** (original == final set); all reachable. Fixed 2 (`tener [número] años` missing `pos:`; `encontrar` misfiled in "Formal & Rare Verbs" → Getting & Obtaining). Flagged 4 for Batch 5/6 / user: `necesitar`/`leer` (Verbs taxonomy lacks needing/reading families), `[artículo][sustantivo][adjetivo]` (Adjectives lacks a word-order group), `necesitar la información específica` (questionable core — recommend trash/rewrite). See `findings.md#core`. |
| 8 | Verify + regression coverage | **partly done** | _(this commit)_ | `tests/curriculum-reachability.test.ts` added to `db:test`: no global orphans, every topic concept reaches a Group, every **core** concept reaches a Group, no confusion group outside Mappings, no stale/empty group, family counts are distinct unions. `tests/unit/curriculum-navigation.test.ts` gained the confusion-boundary + legacy-link tests (Batch 1). Remaining: deep-link retention after Batch 5/6 renames; browser click-through of representative paths incl. the moved `su` mapping. |

## Ledger

Append one row per applied batch: date · batch # · commit · manifests ·
inventory delta (orphans / confusion-outside / gaps).

- 2026-09-07 · Batch 0 · 4a28515a · — · baseline captured.
- 2026-09-07 · Batch 1 · 7920c631 · confusion-A-collections, confusion-B-buckets, confusion-C-untag · confusion-outside-mappings 9→0 · orphans 24 (unchanged) · mappings base 1555→1586 · new cognates gap +2 (deferred to Batch 4).
- 2026-09-07 · Batch 2 · 3481b696 · orphans-A-home, orphans-B-trash, orphans-C-fix · global orphans 24→0 · non-trash 4225→4220 (5 trashed) · trash 222→227.
- 2026-09-07 · Batch 3 · 3744afc2 · verbs-untag-form-drills · verbs within-topic gap 301→0 · Verbs base 2106→1806 (301 form drills removed, still on Verb-Forms).
- 2026-09-07 · Batch 4 · c3c15ab9 · gaps-A-tag, gaps-B-untag (+ audit-phrasal-verbs.ts exemptions) · **all within-topic gaps → 0** · global orphans 0 · confusion-outside 0.
- 2026-09-07 · Batch 8 (partial) · f875eb6f · tests/curriculum-reachability.test.ts · locks in Batches 1–4.
- 2026-09-07 · Batch 7 · f90b32a8 · core-A-fix, core-B-untag · 310 core, 2 fixed, 4 flagged, 0 demoted.

## Checkpoint (2026-09-07, after Batch 7)

**Done:** 0, 1, 2, 3, 4, 7, 8 (partial). Hard requirements met:
- global orphans **0** · within-topic gaps **0** (every topic) · confusion
  groups outside Mappings **0** · every core concept reachable · no stale
  groups · db:verify + 16 tests green.
- roles unchanged except 5 metalinguistic rows → trash (Batch 2):
  core 310 · supporting 1111 · reference 2799 · trash 227 · non-trash 4220.

**Blocked on user:** Batch 5 (numbered partitions — conflicts with the
standing size-rule) and, downstream of it, Batch 6 (explicit family config)
and the rest of Batch 8 (deep-link + browser verification of renamed paths).

**Not yet started within scope:** browser click-through verification of
representative paths (incl. the moved `su` mapping); the 4 Batch-7 flags;
the 2 pre-existing `full-audit-findings.md` flags.
