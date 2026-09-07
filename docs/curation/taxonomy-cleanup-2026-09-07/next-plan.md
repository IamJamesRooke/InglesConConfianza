# Taxonomy cleanup — next plan (family-name / group-membership re-audit + follow-ups)

_Drafted by a Fable planning agent, 2026-09-07. Policy: `policy.md`. State:
`batch-plan.md` Checkpoint (after Batch 9). Findings already captured:
`findings.md` — do not re-derive._

## Where things stand (verified 2026-09-07 via `npm run curriculum:inventory`)

0 global orphans · 0 within-topic gaps · 0 confusion groups outside Mappings ·
0 empty groups · every core concept reachable · all reachability/nav tests
green. `roles`: core 309 / supporting 1112 / reference 2797 / trash 232.

The **frozen** work: family→group grouping was inferred by the old
`facetGroup()`/`verbFamily()` name-matching, then pinned as explicit `family:`
strings on 784 buttons in Batch 6 **without a content check**. This plan does
that check, topic-by-topic, plus the structural catch-all work.

## What kind of change each batch is

- **Code-only (no manifest):** moving a group to another family, renaming a
  family, reordering, merging a 1-leaf family — all just edit `family:` /
  `label` / button order in `topics.ts`. Free, no DB write, no snapshot diff.
- **Manifest needed** only when *concepts* move between groups or a group is
  split on a real seam:
  - `curriculum:concepts:apply` — add the new/target `topic:*` collection to
    the moved rows (merge-only, safe).
  - `curriculum:collections:apply` — `RENAME` a collection whose identifier is
    actually wrong, `MERGE` a redundant one.
  - `curriculum:roles:apply` — the only retirement path (`trash`), with a
    logged reason.
- Every batch: one commit, `npm run curriculum:apply … --apply` (chains
  snapshot + `db:verify` + `db:test`) for manifest batches, or `npm run
  db:test` for code-only batches; then append a ledger row.

## Enabling tooling (Batch 0 — do first)

**Batch 0 — inventory `--members` dump + family-structure test**
- Scope: make the re-audit executable without ad-hoc DB probes.
- Steps:
  1. `scripts/curriculum-inventory.ts`: add `--members <topic-slug>` that
     prints, per family → group, every member row as `id · role · spanish →
     english` (reuse the existing `base.filter(has(collection))`; data already
     loaded). Optionally also write `inventory-members-<slug>.json` under the
     cleanup dir.
  2. `tests/curriculum-reachability.test.ts`: add a **family-structure
     snapshot** test — assert the exact `{topic: [family labels...]}` map and
     each family's group count against an inline expected object, so every
     later batch's family edit is a visible, reviewed diff and nothing
     regresses silently.
  3. Note in the test file header that family `id = slugify(label)`;
     `?family=<id>` bare deep links break on a family rename, but any deep
     link that also carries a `leaf` survives (`resolveCurriculumPath`
     resolves family from the leaf). Bare `?family=` links are the only
     exposure — acceptable, but list renamed families in each commit message.
- Manifest: none (tooling + test only).
- Size: ~60 lines script, ~40 lines test.
- Proves: `npm run db:test` green; `npm run curriculum:inventory -- --members
  verbs` produces a readable member list.

---

## Part A — per-topic family / group semantic re-audit

Ordered by value to a teacher building a **beginner** course. Each batch: read
`--members` for the topic, then answer for every family: (a) is it a coherent
branch? (b) is any group in the wrong family? (c) 1-leaf families to merge up?
(d) oversized family needing a real (non-numbered) sub-split? (e) is the name
what a teacher would predict? Record the answers as a short table in the
commit message and a findings.md sub-section.

**Batch A1 — Verbs, part 1: family memberships & names** (11 families, 1804 rows)
- Scope: the 10 thematic families excluding the "Formal & specialized"
  catch-all (that's A2). Known suspects from inventory:
  - `Communication` has 7 groups incl. a `Communication — Other` sub-dump —
    check it isn't a mini-catch-all; `Offering & Providing` and `Asking &
    Requesting` may read better under a "Requests & offers" branch.
  - `Making, changing & home` — `Placing & Setting — Idioms` = 55 rows;
    confirm it's not swallowing non-idiom `poner` senses.
  - `Being & existence` — `To Be (estar) — Idioms & Uses` = 47; check overlap
    with Adjectives `estar (state)`.
  - `Modals, time & possibility` — does `Hoping & Waiting` / `Wishes &
    Hypotheticals` belong here or under a "Thinking & feeling" branch? Is
    "time" actually represented (only `Weather, Time & Duration`, which is in
    *Formal & specialized*)? Rename family to `Modals & possibility` or move a
    time group in.
  - `Perception & feelings` vs `Thinking & learning` — `Deciding &
    Considering` straddles; confirm placement.
- Steps: `--members verbs`; produce a group→family correction list; apply as
  `topics.ts` `family:`/`label` edits + button reorder; update the A0
  structure test.
- Manifest: none expected (pure regroup). If a group genuinely needs concepts
  moved (e.g. non-idiom rows out of `Placing & Setting — Idioms`), spin that
  into a tiny `curriculum:concepts:apply` follow-up, ≤20 rows.
- Size: code-only, ~11 families reviewed.
- Proves: structure-snapshot test updated + green; `inventory` reachable ==
  base (1804) unchanged.

**Batch A2 — Verbs, part 2: decompose "Formal & Rare Verbs" (217) + "Formal & specialized"**
- Scope: the single biggest verb catch-all. `topic:verb-formal-remainder` =
  217 rows, 3 core in the whole family — clearly under-organized.
- Steps:
  1. `--members verbs` filtered to `topic:verb-formal-remainder`; sort into:
     (i) rows that fit an **existing** thematic verb group (retag with
     `curriculum:concepts:apply` adding that `topic:verb-*`), (ii) 2–4 **new**
     coherent sub-groups on a real seam (e.g. "Legal & bureaucratic actions",
     "Abstract/academic verbs", "Cognate -ar/-ir formal verbs"), (iii)
     genuine long tail → keep in a residual group renamed `Other formal & rare
     verbs` (policy allows a short-tail "Other" when siblings are
     well-defined).
  2. New sub-group collections created by tagging their members in the same
     manifest.
  3. Reassess whether `Formal & specialized` should split into `Formal &
     abstract actions` and `Specialized domains (tech, health, legal,
     weather)`.
- Manifest: `curation-2026-09-DD-verbs-formal-decompose.tsv` (`concepts:apply`),
  rough 120–180 rows across 2–3 batches of ≤80 rows each if credits are tight
  (batch by target group).
- Proves: `inventory` shows `Formal & Rare Verbs` count dropping, no new gap,
  reachable == base; structure test updated.

**Batch A3 — Nouns: introduce sub-families + dedupe overlapping theme groups** (currently 2 families, 45 groups)
- Scope: `Meaning & context` is 33 groups in one flat list — the worst
  family-level organizing failure in the catalog. Also multiple near-duplicate
  theme groups.
- Steps:
  1. Split `Meaning & context` into predictable sub-families: `People &
     family`, `Places`, `Time & calendar`, `Abstract nouns`, `Objects &
     things`, `Domains (food, tech, health, politics, law, art, sport…)`. Pure
     `family:` edits.
  2. Merge/flag duplicates for a small `collections:apply` MERGE:
     `topic:business-work` vs `topic:objects-money-business` vs
     `topic:money-business`; `topic:calendar` vs
     `topic:noun-time-months`/`-days-periods`; `topic:people-professions` vs
     `topic:people-family-rel` vs
     `topic:family-immediate/-extended/-groups-terms` (two parallel family
     taxonomies exist).
  3. Decide where the `Abstract — -encia/-ancia` / `-ción/-sión` / `-dad/-tud`
     groups live — these are **morphology**, not theme; either move them under
     `Articles & gender` (which is really the form axis) or a new `Abstract
     nouns by suffix` sub-family. `Abstract — General` = 118 → check it's a
     true tail, not an unsorted bucket; sub-split if a seam exists.
  4. `lo (neuter)` = 1 row → merge that button's family or into `No article`.
- Manifest: one small `collections:apply` (3–5 MERGE lines) + possibly a
  ≤40-row `concepts:apply` for abstract-suffix rows missing the theme tag.
  Bulk of the batch is code-only.
- Proves: structure test; `inventory` nouns reachable == base (483); MERGE'd
  collections gone from registry.

**Batch A4 — Adjectives: collapse the double classification axis** (3 families, 39 groups)
- Scope: `Meaning & context` mixes three axes — copula+suffix form groups
  (`ser, -oso/-osa`), a **parallel** "Abstract quality — -oso/-osa" set (same
  suffix, "abstract" flavor), and real semantic themes (Color, Size, Age,
  Emotion). `ser, general` = 116 and `Abstract quality — General` = 135 are
  twin unsorted buckets.
- Steps:
  1. Decide: is the "Abstract quality — X" series redundant with the "ser, -X"
     series? If yes, MERGE pairwise (`collections:apply`) and keep one suffix
     family `Adjective endings`. If the "abstract" distinction is real
     (concrete vs abstract quality), make it an explicit two-group split per
     suffix, not a separate flat list.
  2. New sub-families: `Adjective endings (form)`, `Semantic themes`
     (color/size/age/speed/weather/time/value/nationality/difficulty/
     personality/emotion), `Comparison` (rename `Comparisons`), `How it's
     used` (word order + tener-idiom).
  3. `How it's used` currently 2 groups / 9 core — small but high-value;
     confirm `Word order & sentence frame` (added Batch 9) has its members and
     a teacher-predictable name.
  4. `ser, general` (116) / `Abstract quality — General` (135): sub-split on a
     seam or rename to `Other descriptive adjectives`.
- Manifest: `collections:apply` MERGE list if the abstract/concrete series
  collapses (~8 lines); otherwise code-only.
- Proves: structure test; reachable == base (413).

**Batch A5 — Adverbs + Determiners + Pronouns + Interrogatives** (small grammatical-function topics)
- Scope: quick coherence pass — these are already single-family or near it.
  - Adverbs: 2 families (`Word types`, `Meaning & context`) with
    cross-membership fuzz (`Frequency` in Word types vs `Time — Frequency` in
    Meaning & context — near-duplicate; MERGE or clearly distinguish).
    `Addition (also, either)` = 2 rows.
  - Pronouns / Determiners: one family each (`Pronoun types` / `Determiner
    types`) — fine as one family, but check the shared
    `grammar:possessive-determiner` / `grammar:demonstrative-determiner`
    buttons render sensibly on both; confirm no confusion-choice group crept
    back (test already guards this).
  - Interrogatives: 3 groups, one family — fine; just confirm names.
- Steps: `--members` for each; mostly rename/merge; adverbs may get a 3rd
  family or a 2-family clean split (form vs meaning).
- Manifest: at most one adverbs MERGE line.
- Size: code-only.
- Proves: structure test; 4 topics reachable == base.

**Batch A6 — Connectors + Prepositions + Numbers**
- Scope: single-family topics; verify group names match what a teacher
  predicts and no 1–2 row group is stranded.
  - Connectors: 11 groups one family — consider 2 families (`Everyday` vs
    `Advanced/discourse`).
  - Prepositions: `Purpose` / `Without` / `Except` reuse `grammar:*` tags —
    confirm the rows are actually prepositions on this page.
  - Numbers: cardinal/ordinal/large — fine; confirm `Fractions & decimals`
    name.
- Manifest: none.
- Size: code-only.
- Proves: structure test; 3 topics reachable == base.

**Batch A7 — Communicative-purpose topics: Expressions, Imperatives, Collocations, Questions & Negation**
- Scope: all small (21–61 rows), one family each. Verify the
  communicative-function buckets are exhaustive and mutually exclusive; check
  `coll:other` and `expr:idiom` aren't catch-alls hiding a real bucket.
- Manifest: none expected.
- Size: code-only.
- Proves: structure test; 4 topics reachable == base.

**Batch A8 — Cognates: split the 48-leaf "Spelling patterns" family + relocate "Latin roots (any)"**
- Scope: `Spelling patterns` has 48 groups including `Identical / transparent`
  (367), `Looks different` (64) and `Latin roots (any)` (218) — three
  different axes in one family.
- Steps:
  1. Move `topic:cognate-latin-root` ("Latin roots (any)", 218) into the
     existing `Latin roots` family (code-only `family:` edit). Consider
     renaming it `Latin roots — not yet sorted by stem` and, in a follow-up
     manifest, distributing its members into the 22 stem groups where they fit
     (`concepts:apply`, batchable by stem, ≤60 rows each).
  2. Split `Spelling patterns` into `Overall similarity` (`Identical /
     transparent`, `Looks different`) and `Spelling-suffix patterns` (the ~44
     `-X → -Y` groups). The suffix family is long but every group is a clean
     single pattern — acceptable per the retired size rule; do **not** number
     it.
  3. `-ma → -m` = 1 row, and other 1–2 row suffix groups → merge into the
     nearest phonetic sibling or a single `Other suffix swaps` group.
  4. `Cognate types` family = 1 group (`False friends`, 10) → keep as its own
     family (it's a distinct teaching category) but confirm the label; or fold
     `False friends` into `Overall similarity` as the "looks related but
     isn't" end of that axis.
  5. `Identical / transparent` = 367: this is a genuine "just read it" bucket;
     leave whole, but spot-check 20 rows that they're actually transparent and
     not mis-swept from the Batch-`f40fb498` backfill.
- Manifest: code-only for the regroup; optional
  `curation-2026-09-DD-cognates-latin-stem-sort.tsv` (`concepts:apply`)
  follow-ups.
- Proves: structure test; reachable == base (787).

**Batch A9 — Transformations + Verb-Forms + Verb-Patterns**
- Scope: word-building / grammar-pattern topics.
  - Transformations: `Prefixes` family = 7 groups, 17 rows total, almost all
    1–2 rows (`un-`=1, `re-`=1…). Either merge into one `Common prefixes (un-,
    dis-, re-, over-, under-…)` group or accept as a deliberately granular
    pattern list — recommend **merge to one group**, since a 1-row "pattern"
    teaches nothing browsable. `Word types` (15 groups) mixes POS-change pairs
    — fine.
  - Verb-Forms: `topic:vf-past-d` labelled "regular /d/" sits in family
    `Irregular patterns` (bug — should be `Regular endings`). Fix. Otherwise
    the ~50 rhyme groups are one coherent family.
  - Verb-Patterns: `Sentence patterns` vs `Verb complements` split — check
    each of the 18 groups is on the right side (e.g. `going to (future)`,
    `progressive` are arguably their own "Tense-like patterns" family).
- Manifest: none (the `vf-past-d` fix is a `family:` string edit; the prefix
  merge is `collections:apply` MERGE, ~6 lines — one small manifest).
- Size: code-only + 1 tiny manifest.
- Proves: structure test; 3 topics reachable == base.

**Batch A10 — Mappings ×2 + Phrasal-verbs ×2: bucket sanity + confusions family + tiny-particle cleanup**
- Scope: these are alphabetical dictionary pages — lowest semantic-audit need,
  but:
  1. Verify every headword button's `family` matches its first letter
     (A–E…U–Z) — a few may be miscoded; `--members` + a quick assertion.
  2. `Common confusions` family on both Mappings pages — confirm the 5
     (mappings) / 2 (en-mappings) buttons still resolve and the direction rule
     holds (no Spanish-side group mirrored onto en-mappings).
  3. Phrasal-verbs-by-particle `A–E` family: ~10 groups at 1–2 rows
     (`across`, `aside`, `against`, `among`, `ahead`, `below`=1, `before`=1).
     Consider a `rare particles` catch-all group, or leave (they're
     legitimately rare particles and the page's whole point is seeing a
     particle hold constant). Recommend: **leave**, but add a note so a future
     session doesn't re-flag.
- Manifest: none.
- Size: code-only, mostly verification.
- Proves: structure test + existing `canonicalFacetCollection` / legacy-link
  tests green.

---

## Part B — higher-value follow-ups for a beginner-course author

**Batch B1 — Beginner core-vocabulary coverage audit**
- Scope: the teacher is about to build a beginner course; `coreCount` per
  group is already in `inventory.json`. Find where genuinely core beginner
  vocab is thin or missing.
- Steps:
  1. From `inventory.json`, list every group with `coreCount = 0` in a family
     that should have core (e.g. Verbs `Social life & conflict` 1 core / 69
     rows, `Daily life & work` 7/130; Adjectives `Comparisons` 0/34; Nouns
     almost all families ~0 core).
  2. Cross-check against a standard beginner list (e.g. the ~500 most frequent
     Spanish words / a CEFR A1 inventory) for **absent** concepts — the
     kinship batch (`0dd79120`) is the template: it added 8 missing pairs.
     Likely gaps: days of week, months, colors, numbers 1–20 as core, body
     parts, basic food, weather adjectives, high-frequency verbs
     (ir/venir/dar/ver/saber/poder present-tense).
  3. Produce a `curation-2026-09-DD-beginner-core-{add,promote}.tsv`: new rows
     via `curriculum:concepts:add`; promote existing well-formed rows to
     `core` via `curriculum:roles:apply` **only with a per-row reason**
     (policy: never demote to pass a check; promotion is fine with
     justification).
- Manifest: `concepts:add` + `roles:apply`, batchable in ≤30-row chunks by
  domain.
- Size: 1 analysis batch + 3–5 small apply batches.
- Proves: `inventory` core count rises with logged reasons; reachability test
  still green (every new/promoted core reaches a group); `db:verify` clean.

**Batch B2 — remaining large catch-alls sweep** (after A2/A3/A4/A8 land)
- Scope: re-run `inventory` and list every group still ≥ 60 rows: after
  A-batches, candidates are Nouns `el, -o`=133 / `la, -a`=128 (gender groups —
  fine, that's the whole list of masc-o nouns), Adjectives `Abstract quality —
  General`, Cognates `Identical / transparent`=367.
- Steps: for each, decide **whole vs seam-split**. Gender-form groups stay
  whole (they're a complete enumeration). Semantic "General" buckets get a
  real sub-split or a rename to `Other …`. Document the decision per group so
  it's not revisited.
- Manifest: `concepts:apply` only where a seam-split needs new sub-group tags.
- Size: 1–2 small batches.
- Proves: structure test; `inventory` large-group list shrinks or each entry
  has a logged "keep whole" rationale.

**Batch B3 — family organizing-principle consistency pass** (final)
- Scope: with all families re-audited, verify each topic uses **one**
  principle per `policy.md` §"Organizing principles" and siblings don't mix.
  E.g. Nouns/Adjectives must not have one family on the form axis and siblings
  on the theme axis presented as peers without a labelled distinction.
- Steps: read the A0 structure snapshot; for each topic write one line stating
  its principle and confirming families are parallel. Fix stragglers
  (code-only).
- Manifest: none.
- Size: code-only, documentation-heavy.
- Proves: structure test frozen as the new baseline; `next-plan.md` marked
  complete; append a "taxonomy re-audit complete" checkpoint to
  `batch-plan.md`.

---

## Suggested execution order (resumable, one commit each)

0 → A1 → A2(×2–3) → A3 → B1-analysis → A4 → A8 → B1-apply(×3–5) → A5 → A6 →
A7 → A9 → A10 → B2 → B3.

Rationale: tooling first; Verbs and Nouns are the highest-traffic beginner
topics and have the worst family structure; the beginner-core analysis is
cheap and unblocks course-building early; the alphabetical/pattern pages last.

## Open questions for the user (judgment genuinely needed)

1. **Abstract-quality adjective series**: is the "Abstract quality — -oso/-osa"
   set a real teaching distinction from "ser, -oso/-osa", or a duplicate-axis
   artifact to MERGE? (Affects A4 size a lot.)
2. **"Formal & Rare Verbs" (217)**: acceptable to create 2–4 new named
   sub-groups by inferred theme (e.g. "Legal & bureaucratic", "Academic/
   abstract"), or keep as one honest "Other formal & rare verbs" tail? (A2.)
3. **Cognates "Latin roots (any)" (218)**: worth the credits to distribute
   into the 22 stem groups, or leave as one family-level bucket labelled "not
   yet sorted by stem"? (A8.)
4. **Nouns dual family taxonomy** (`people-*` + `family-*`, `calendar` +
   `noun-time-*`, three money groups): confirm OK to MERGE the redundant
   collections (deep links to the merged names would need an alias, or fall
   back). (A3.)
5. **Beginner-core promotions**: which external word list is authoritative for
   "genuinely core" (CEFR A1? a specific frequency list? the user's own course
   syllabus)? Needed before B1 promotes anything.
6. **Transformations "Prefixes" family** (7 one-row groups): merge to a single
   "Common prefixes" group, or keep granular as a reference pattern list?
7. **Family renames & deep links**: acceptable that bare `?family=<old-slug>`
   links fall back to the topic view after a rename (leaf-bearing deep links
   are unaffected), or should Batch 0 also add a family-id alias map to
   `navigation.ts`?

## Critical files for implementation

- `web/src/lib/curriculum/topics.ts`
- `web/src/lib/curriculum/navigation.ts`
- `web/scripts/curriculum-inventory.ts`
- `web/tests/curriculum-reachability.test.ts`
- `docs/curation/taxonomy-cleanup-2026-09-07/batch-plan.md`
