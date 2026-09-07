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
| 5 | Numbered-partition & label cleanup | **done** | _(this commit)_ | user decision 2026-09-07: one group per Mappings/Phrasal headword; merge-and-accept-large on semantic-domain pages; **size rule retired**. Merged all 435 `topic:<stem>-<N>` / `-<N>-<M>` numbered facet families → one `topic:<stem>` group each (`ser (1..23)` → `ser`; `Formal & Rare Verbs (1..15)` → `Formal & Rare Verbs`; `el, -o (1..8)` → `el, -o`; …). `~250` buttons removed. Old deep links (`?facets=topic:map-ser-7`) still resolve via new `canonicalFacetCollection()` in `navigation.ts` (+ test). All gaps/orphans/counts unchanged. Still open (flagged Batch 7): Verbs lacks "needing"/"reading" families, Adjectives lacks a "word order" group — deferred to Batch 6. |
| 6 | Explicit Family config | **done** | _(this commit)_ | every facet button in `topics.ts` now carries an explicit `family: string` (784 buttons). `navigation.ts` `buildCurriculumFamilies` groups by `facet.family` directly; deleted `verbFamily`/`alphabeticFamily`/`exploreFamilyLabels` name-inference (~140 lines). `facetGroup()` kept as a thin button lookup for the `topic-presentation` re-export. `page.tsx` / `curriculum-store.ts` unchanged (same `buildCurriculumFamilies` shape). Family labels frozen from the prior inference output — behavior identical, verified by the full test suite. **Still open (flagged):** semantic family-name audit + the Batch-7 additions (Verbs "needing"/"reading" families; Adjectives "word order" group) — see `findings.md#core`. |
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
- 2026-09-07 · Batch 5 · db1662b3 · B5-merge (435 MERGE ops) · ~250 numbered facet buttons removed · size rule retired · canonicalFacetCollection() keeps old deep links working · gaps/orphans/counts unchanged.
- 2026-09-07 · Batch 6 · _(this commit)_ · (code only — no manifest) · explicit `family` on 784 buttons; name-inference deleted from navigation.ts; behavior identical, 77/79 tests green (2 pre-existing lesson-content failures unrelated).

## Checkpoint (2026-09-07, after Batch 6)

**Done:** 0–8 (8 is code-complete; browser click-through still pending).
- global orphans **0** · within-topic gaps **0** (every topic) · confusion
  groups outside Mappings **0** · every core concept reachable · no stale
  groups · deep links survive the Batch-5 merge · `db:verify` + 11 DB tests +
  6 nav/reachability unit tests green.
- roles: core 310 (0 demotions) · supporting 1111 · reference 2799 · trash
  227 (+5 metalinguistic rows, Batch 2) · non-trash 4220.
- facet buttons ~530 → ~280 (numbered partitions merged); every button has an
  explicit `family`.

**Follow-ups (Batch 9, done — commit `_(next)_`):**
1. **done** — new "Needing & requiring (necesitar)" group under "Modals, time
   & possibility" (5 `necesitar` senses); `leer`/`memorizar`/`practicar` →
   Learning & Teaching; `preferir` ×2 → Deciding & Considering. All out of
   "Formal & Rare Verbs" (228 → 218, now genuinely formal/rare cognate verbs).
2. **done** (commit `175796a2`) — Adjectives "Word order & sentence frame".
3. **done** — `t0gq5vym7f` trashed (garbled, redundant with `necesitar
   información (en general)`); `nmfskm5zko` "needa" typo dup trashed.
4. **done** — `j69jaw6dew` (garbled generic-article row) trashed; replaced by
   a clean core concept `los [sustantivos] (en general) → [nouns] in general`
   ("En general, me gustan los gatos. / In general, I like cats."). Both
   original `full-audit-findings.md` flags now resolved.

Core 310 → **309** net: −2 garbled rows trashed with logged reasons, +1 new
generic-article concept. No other demotions anywhere in the cleanup.

**Still open:**
5. **done** — browser-verified against the running dev server (`:3000`):
   `?topic=mappings&family=common-confusions&leaf=topic:confusable-possessive`
   renders the 3-level browser with "Common confusions" → "su / sus / mi / tu
   — whose is it?" (14 rows, correct roles, table beside the selector);
   `?topic=verbs&family=modals-time-possibility&leaf=topic:verb-needing`
   shows the new "Needing & requiring (necesitar)" group (5 senses) and the
   merged single Modal groups (no `(1)/(2)`). Lesson-Builder "Taught" column
   intact. No error overlay. Screenshots in the session scratchpad.
6. Optional: full semantic re-audit of the ~40 family display names
   (spot-checked clean; "Cognate types(1)", "How it's used(2)" thin but valid).

---

## Phase 2 — semantic re-audit (plan: `next-plan.md`)

The frozen family→group grouping from phase-1 Batch 6 was never content-checked.
Phase 2 does that. Batches renumbered P2-1..P2-10 to avoid colliding with the
phase-1 rows above. Model routing per batch is in `next-plan.md`.

| # | Batch | Status | Commit | Notes |
|---|---|---|---|---|
| P2-1 | Enabling tooling | **done** | _(this commit)_ | `curriculum-inventory.ts` gains `--members <slug>` and `--structure`. `curriculum-reachability.test.ts` gains: family-structure snapshot, duplicate-axis guard (Jaccard > 0.8, allow-list for the adjectives pairs Batch P2-3 merges), leaf-bearing deep-link family resolution. Guard surfaced 2 more dup-axis pairs in Transformations (`morph-ward`~`morph-expr-to-adv`, `suffix-ly`~`adjective-to-adverb`) — allow-listed, folded into P2-7 scope. `db:test` 14/14 green. |

| P2-2a | Verbs: exclude reference cognates | **done** | `35b5d1be` | New declarative `baseExclusions` on a topic (`src/lib/curriculum/scope.ts` + Prisma twin in `curriculum-store.ts`). Verbs excludes `topic:cognate` rows that are not core/supporting. **No data change** — a display policy in config; every row keeps every tag. Verbs base 1804→1599; "Formal & Rare Verbs" 219→128; removed the emptied "Formal Actions — Business & Process" button. One predicate shared by page query / inventory / test so the rule cannot drift. |

| P2-2b | Verbs: dissolve the "Formal & Rare Verbs" bucket | **done** | `35952be0` | 128 on-page rows sorted: 124 retagged into existing thematic groups + one new group `topic:verb-depending-fitting` ("Depending, Fitting & Being Enough", Modals/time/possibility family, for depender/caber/bastar); 2 core negation frames (`[alguien] no [hace algo]`/`[hizo algo]`) lost `pos:verb`, stay on Verb Patterns; 2 inflection drills (`intentar/tratar ==> …`) → `trash`. All 219 rows lost `topic:verb-formal-remainder`; the button is deleted. **20 assignments flagged `REVIEW:` in manifest A** for spot-check (to act, to occur, to cause, to function, to explore, …). Verbs base 1599→1595. |

| P2-5 | Cognates: reorganize by part of speech | **done** | `f7790c3c` | 3 families -> 9, by POS with verb patterns split by conjugation class: `-ar/-er/-ir verb cognates`, `Noun cognates`, `Adjective cognates`, `Adverb cognates`, `Verb form endings`, `How close is it?` (transparent + opaque + false friends), `Latin roots — not yet sorted by stem`. Retired the 48-leaf `Spelling patterns` and the 1-group `Cognate types`. Family assigned by each group's dominant part of speech (measured), verb groups by infinitive class. **Code-only**, no DB change. |

### Phase 2 ledger

- 2026-09-07 · P2-1 · `bea7ac3e` · none (tooling + tests) · no DB change; inventory counts unchanged; `db:test` 11→14 tests.
- 2026-09-07 · P2-2a · `35b5d1be` · none (config + code) · no DB change; verbs base 1804→1599 (205 reference cognate verbs now Cognates-only); orphans 0; gaps 0; verb facet buttons −1; `db:test` 14/14.
- 2026-09-07 · P2-5 · `f7790c3c` · none (config only) · cognates families 3→9, groups 71 (unchanged); base/reachable 787 unchanged; `db:test` 14/14.
- 2026-09-07 · P2-2b · `35952be0` · verbs-remainder-{A-retag,B-untag-bucket,C-untag-posverb,D-trash-drills} · verb-formal-remainder dissolved (219→0); verbs base 1599→1595; orphans 0; gaps 0; new group `topic:verb-depending-fitting`; 2 rows trashed; `db:test` 14/14.
