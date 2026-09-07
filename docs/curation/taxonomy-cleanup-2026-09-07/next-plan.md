# Taxonomy cleanup — next plan (semantic re-audit)

_Rewritten 2026-09-07 after a direct measurement pass against PostgreSQL.
Supersedes the earlier Fable draft (which is preserved in git history at
`docs/curation/taxonomy-cleanup-2026-09-07/next-plan.md`, pre-rewrite).
Policy: `policy.md`. State: `batch-plan.md`. Prior per-concept analysis:
`findings.md` — reuse, do not re-derive._

## Target end state

A teacher planning a lesson opens `/admin/curriculum`, picks a Topic, and the
Families they see are parallel branches of one clear idea. They open a Group
and find exactly the concepts its name promised. Nothing they need is hiding
in a bucket named something else. Where they need a beginner word, it is
there, marked `core`, in the group they looked in first.

The structural half of that is done: 0 orphans, 0 within-topic gaps, 0 stale
groups, confusion groups confined to the two Mappings pages, numbered
partitions merged. This plan does the semantic half — the part that needs
judgment about what a group *means*, which was never checked.

## Design verdict: keep the model, fix the data

I considered replacing the Topic → Family → Group model, the `facet:value`
tagging, or the config-driven navigation. **No structural replacement is
warranted**, and I want the reasoning on record so it is not relitigated.

I measured the four worst-smelling areas directly. Every one of them is a
**curation defect inside a sound model**, not a limitation of the model:

| Symptom | Actual cause (measured) |
|---|---|
| Adjectives has two parallel suffix axes | `topic:adj-abs-<suffix>` and `topic:adj-<suffix>` are **near-identical sets** (e.g. `-able` 13 vs 13, 12 shared; `-ivo` 11 vs 13, 11 shared). Two generator scripts tagged the same rows twice under different names. |
| Nouns has two family taxonomies | `topic:family-immediate` (14) and `-extended` (10) are **strict subsets** of `topic:people-family-rel` (30). One collection is a container for the others — a level confusion, not a model gap. |
| "Formal & Rare Verbs" (219) | Not formal and not rare. It holds `acabar`, `enviar`, `comer`, `mostrar`, `cruzar`, `lograr`, `depender`, `aceptar`. It is the **unsorted remainder** of the verb-theme pass, given an inaccurate name. |
| Cognates "Spelling patterns" (48 groups) | Three different axes filed as one family. A `family:` string edit fixes it. |

A new classification model would migrate every one of those defects intact,
cost the whole remaining credit budget, and break the deep links, the Lesson
Builder joins, and the coverage tooling on the way. The three-level model
already expresses everything this plan needs; where a family is too flat
(Nouns, Cognates), the fix is *more families*, which the config already
supports. `facet:value` with a registry-enforced vocabulary is a better fit
for a catalog where one concept legitimately belongs to several axes than any
single-parent tree would be.

**One thing I am adding, and it is not a second tag system.** Collections
today carry no statement of *which axis they belong to* — that lives only in
the `family:` string in `topics.ts`, which is why two generators could
produce a duplicate axis without anything noticing. Batch 1 adds an
axis-consistency assertion to the existing registry in `collections.ts` and a
structure-snapshot test. That is a check over the existing vocabulary, not a
parallel classification.

### Amendment (2026-09-07): topic base exclusions

The verdict above survives, with one addition to the model that the original
measurement pass missed. The Verbs page is based on `pos:verb`, and **315 of
its 1804 rows were Latinate cognate verbs**. The ~205 at `reference` role
(to abstain, to depose, to allude) are reference material, not teaching
vocabulary, and they were what actually made the Verbs browser untrustworthy:
"Formal & Rare Verbs" held 219 rows and "Formal Actions — Business & Process"
was 14 reference cognates and nothing else.

A topic may now declare `baseExclusions` — material that carries the base tag
but does not belong in that page's browser:

```ts
baseExclusions: [
  { collection: "topic:cognate", unlessRole: ["core", "supporting"] },
]
```

Rationale, recorded so this is not relitigated:

- It is a **display policy, not a fact about the concept**, so it belongs in
  config, not in the data. No row is retagged. `pos:verb` stays true. A row
  promoted to `supporting` later reappears on Verbs by itself.
- The **role gate is essential**. 110 cognate verbs are core or supporting —
  to prepare, to decide, to receive, to accept, to offer, to continue, to
  include, to use, to visit, to explain. A teacher planning a lesson by theme
  must find those on Verbs. Excluding *all* cognates would gut the page.
- The excluded rows lose nothing: all 205 already carry a `cognate:` pattern
  tag and stay fully reachable on Cognates.
- **One predicate, three consumers.** `conceptInTopicScope` in
  `src/lib/curriculum/scope.ts` and its Prisma twin in `curriculum-store.ts`
  are called by the page query, the inventory script and the reachability
  test, so the rule cannot drift between what the page shows and what the
  audit measures.

Result: Verbs base 1804 → 1599, "Formal & Rare Verbs" 219 → 128, global
orphans still 0, within-topic gaps still 0. Applied in Batch P2-2a
(commit `35b5d1be`).

## How each batch changes things

- **Code-only:** moving a group between families, renaming a family or a
  button label, reordering, splitting a family. Pure `topics.ts` edits. No DB
  write, no snapshot diff, free. Verify with `npm run db:test`.
- **Manifest:** only when *concepts* move between groups
  (`curriculum:concepts:apply`, merge-only), a collection is genuinely
  redundant (`curriculum:collections:apply` MERGE/RENAME), a wrong tag must
  come off (`curriculum:concepts:untag`), or a row retires
  (`curriculum:roles:apply` → `trash`, with a per-row reason).
- Every batch: one commit, `npm run curriculum:apply <manifest> --apply` (it
  chains snapshot + `db:verify` + `db:test`) or plain `npm run db:test` for
  code-only, then a ledger row in `batch-plan.md`.

**Family renames and deep links.** Family `id` is `slugify(label)`, so a
rename breaks a bare `?family=<slug>` link. Any link carrying a `leaf`
survives, because `resolveCurriculumPath` derives the family from the leaf.
Judgment: bare family links are not worth an alias map — they are rare, they
degrade to the topic view rather than erroring, and every leaf-bearing link
still works. Batch 1 asserts that in a test so the exposure stays bounded.
Renamed families get listed in the commit message.

---

## Model routing and escalation

Most of this plan is executable by a mid-tier model, because the judgment has
already been spent and recorded. The table says which model each batch wants.
An executing session must **stop and say so** rather than pushing through a
batch marked `escalate`.

| Batch | Model | Note |
|---|---|---|
| 1 Tooling | Sonnet | **Done** (`bea7ac3e`). |
| 2a Base exclusions | Opus | **Done** (`35b5d1be`). Touched the page query and the scope model. |
| 2b Verb remainder | Sonnet, **manifest reviewed before apply** | Semantic sorting, now 128 rows of ordinary vocabulary. Merge-only, reviewable TSV, inventory catches losses. Do not apply unreviewed. |
| 3 Adjectives merge | Sonnet | Decision made. Step 4's seam judgment is the only soft spot. |
| 4 Nouns restructure | Sonnet | Design decided; mostly `family:` edits. |
| 5 Cognates | Sonnet | Code-only regroup. |
| 6 Verb family names | Sonnet, **one-line justification per rename** | Naming is where a weaker model reaches for generic labels. |
| 7 Small topics | Sonnet | Specific named fixes. |
| 8 Beginner core | **Opus — escalate** | Decides what the course is built from, promotes roles, writes new bilingual rows. Additions are harder to unwind than tag moves. |
| 9 Mappings verification | Sonnet | Assertions only. |
| 10 Close out | Sonnet | Re-run tools, update ledger. |

**Escalation triggers.** Stop, state the reason, and ask the user to switch
models when any of these hit, regardless of the batch:

- A new concept row must be **created** rather than retagged.
- A `core` promotion or any role change is in question.
- A row would be sent to `trash` and the reason is not obviously mechanical.
- The plan's recorded decision turns out to be wrong against the live data.
  Say what the data shows; do not quietly improvise a different design.
- A batch would touch `navigation.ts` reachability logic or
  `curriculum-store.ts`, rather than config and labels.
- Two batches' worth of scope has to merge to make progress.

**Do not escalate** for ordinary volume, an unfamiliar Spanish sense, or a
manifest that fails validation. Those are execution work.

---

## Ordered batches

Ordered by value to a teacher building a beginner course. Batches 2, 3, 5 are
the ones that actually change what a teacher sees; everything after is
tightening.

### Batch 1 — enabling tooling (do first)

- **Scope:** make the audit executable and freeze the structure so every later
  edit is a reviewed diff.
- **Steps:**
  1. `scripts/curriculum-inventory.ts`: add `--members <topic-slug>`, printing
     per family → group each member as `id · role · spanish → english`. The
     rows are already loaded; this is a formatting addition.
  2. `tests/curriculum-reachability.test.ts`: add a **family-structure
     snapshot** — the exact `{topic: [family labels]}` map plus each family's
     group count, asserted inline. Every later batch updates it deliberately.
  3. Add a **duplicate-axis guard**: fail if two collections on the same topic
     share more than 80% of their members. This is what would have caught the
     adjectives duplication.
  4. Add a test asserting a leaf-bearing deep link resolves its family even
     when the family label changes.
- **Manifest:** none.
- **Size:** ~60 lines script, ~70 lines test.
- **Done when:** `npm run db:test` green; `npm run curriculum:inventory --
   --members verbs` prints readable members; the duplicate-axis guard is
   temporarily allow-listed for the adjectives pairs Batch 3 removes.

### Batch 2a — Verbs: exclude reference cognates — **DONE** (`35b5d1be`)

See the amendment above. Verbs base 1804 → 1599; the remainder bucket
219 → 128; the empty "Formal Actions — Business & Process" button removed.

### Batch 2b — Verbs: sort the 128-row remainder into themes — **DONE** (this commit)

With the reference cognates gone, what is left in `topic:verb-formal-remainder`
is ordinary everyday vocabulary that was never themed. This is now a
straightforward sort, not a taxonomy problem.

- **Scope:** `topic:verb-formal-remainder`, 128 rows.
- **Shape of the contents** (from `--members verbs`): clusters around
  `acabar` (13 senses), `dirigir` (5), `enviar` (4), `encontrar` (4),
  `caber` (4), `depender` (3), plus singles — aceptar, comer, cruzar,
  conectar, contactar, crear, editar, celebrar, cancelar, confirmar,
  controlar, corregir, adaptar, adoptar, admirar, atraer, atrapar, apagarlo,
  arrancar, brindar, bastar, causar, chocar con, cuidarlo, despejar,
  disfrutar.
- **Steps:**
  1. Sort every row into an **existing** thematic verb group. Most fit:
     `comer` → Eating & Drinking, `enviar` → Giving & Lending, `cruzar` /
     `chocar con` / `dirigirse hacia` → Movement, `acabar`/`acabarse` →
     Following & Continuing, `atrapar` → Getting & Obtaining, `apagarlo` →
     Turning On/Off, `cuidarlo` → Daily Routine & Self-care, `contactar` /
     `comunicarse con` → Communication, `crear`/`editar` → Creating, Fixing
     & Changing.
  2. Two **new groups** where no existing one fits, both high-frequency:
     `Achieving & Managing (lograr, conseguir)` and `Depending, Fitting &
     Being Enough (depender, caber, bastar)`.
  3. **Not verbs:** `[alguien] no [hace algo]` / `[hizo algo]` are negation
     frames. Untag `pos:verb`; both already carry `topic:verb-pattern` and
     stay reachable on Verb Patterns. Both are `core` — verify reachability
     after, do not change their role.
  4. **Drill rows:** `intentar ==> intenta`, `tratar ==> trata` are inflection
     drills, not lexical entries. Untag `pos:verb`.
  5. **Garbled:** `necesitar [hacer algo] → needa [do something]` and any
     other malformed row → `trash` with a logged reason.
  6. Once empty, **delete the `Formal & Rare Verbs` button**. Then reassess the
     `Formal & specialized` family, whose remaining groups are now tiny
     (Technology 2, Weather/Time 4, Formal Abstract 4, Analysis 8, Health 10,
     Admin/Legal 17) — merge the smallest into siblings or fold the family.
- **Manifest:** `curation-2026-09-DD-verbs-remainder-{1,2}.tsv`
  (`concepts:apply`, ≤80 rows each), one small `concepts:untag`, one
  `roles:apply` for the garbled rows.
- **Size:** 128 rows, 2–3 commits. Sonnet, manifest reviewed before apply.
- **Done when:** the bucket button is gone; `inventory` shows verbs
  `reachable == base == 1599`, no new gap; structure snapshot updated.

### Batch 3 — Adjectives: collapse the duplicate suffix axis

- **Scope:** `topic:adj-abs-<suffix>` (8 collections) vs `topic:adj-<suffix>`
  (9 collections). Measured overlap is 75–95% per pair. This is one axis
  entered twice.
- **Decision (recorded):** they are duplicates, not a concrete/abstract
  teaching distinction. `[ser] necesario` and `[ser] fértil` appear in *both*
  `ser, general` and `Abstract quality — General`. **MERGE each
  `topic:adj-abs-X` into `topic:adj-X`.**
- **Steps:**
  1. `curriculum:collections:apply` with 8 MERGE lines
     (`topic:adj-abs-oso-osa` → `topic:adj-oso-osa`, … , `topic:adj-abs-al` →
     `topic:adj-al`, `topic:adj-abs-general` → `topic:adj-ser-general`).
  2. Relabel the survivors without the copula prefix: `ser, -oso/-osa` →
     `-oso/-osa (nervous, famous)`. The `ser` framing is not what the suffix
     group is about, and `estar` rows are in there too.
  3. Restructure Adjectives into four families: **`Adjective endings`** (the
     merged suffix groups), **`Semantic themes`** (Color, Size, Age, Emotion,
     Personality, Nationality, Value, Speed, Weather, Time, Difficulty,
     Condition), **`How it's used`** (word order, tener-idiom, `estar (state)`),
     **`Comparison`** (rename from `Comparisons`).
  4. `topic:adj-ser-general` after the merge is ~190 rows — the residue. Split
     on the one real seam available (rows that already carry a theme tag get
     dropped from it via `concepts:untag`; the rest keep it) and rename it
     `Other descriptive adjectives`.
- **Manifest:** one `collections:apply` (8 MERGE), one `concepts:untag`
  (~60 rows) for step 4.
- **Size:** medium. 2 commits.
- **Done when:** duplicate-axis guard passes with the allow-list removed;
  `inventory` adjectives `reachable == base == 413`; group count drops
  31 → ~23; structure snapshot updated.

### Batch 4 — Nouns: split the 33-group flat family, resolve the nested taxonomies

- **Scope:** `Meaning & context` — 33 groups in one unscannable list, plus two
  container/member confusions.
- **Decisions (recorded):**
  - `topic:people-family-rel` (30) strictly contains `family-immediate` (14)
    and `family-extended` (10). The container becomes a **family**, not a
    group. Retire the button; its 6 rows in neither subset go to
    `Family — Groups & terms`.
  - `topic:calendar` (33) contains `noun-time-months` (12) and 7 of
    `noun-time-days-periods`. Same treatment: `Time & calendar` becomes the
    family; the 14 uncovered rows get a `Seasons, dates & clock` group.
  - `money-business` (19), `objects-money-business` (12), `business-work` (26)
    are **disjoint** — not duplicates, just three badly named slices. Read
    members and rename for content; do not merge.
  - The `Abstract — <suffix>` groups are a **morphology** axis, not a meaning
    axis. They move out of `Meaning & context` into their own family.
- **Steps:**
  1. Code-only: replace `Meaning & context` with `People & family`,
     `Places`, `Time & calendar`, `Domains` (education, business, money, food,
     tech, health, government, crime, art, sport, events, communication),
     `Objects & things`, and `Abstract nouns by suffix`.
  2. `collections:apply` — retire `topic:people-family-rel` and
     `topic:calendar` as buttons (they stay as collections; the rows are
     already reachable through the sub-groups).
  3. `concepts:apply` — the 6 + 14 uncovered rows into their new groups.
  4. `Abstract — General` (118): check for a seam; if none, rename
     `Other abstract nouns`.
  5. `lo (neuter)` (1 row) folds into `No article`.
- **Manifest:** one `collections:apply`, one ~25-row `concepts:apply`. Bulk is
  code-only.
- **Size:** medium. 2 commits.
- **Done when:** no Nouns family exceeds ~12 groups; `reachable == base ==
  483`; structure snapshot updated.

### Batch 5 — Cognates: reorganize by part of speech, verbs by conjugation class

Cognates now carries the reference verbs that Batch 2a removed from Verbs, so
its organization matters more than it did. Today it is three families —
`Spelling patterns` (48 groups, three different axes jammed together),
`Cognate types` (1 group), `Latin roots` (22).

**Decision (recorded).** Reorganize by **part of speech**, and split the verb
patterns by **conjugation class**. I checked the membership: every pattern
group is dominated by one part of speech, and every verb pattern group sits in
one conjugation class. The axis partitions cleanly, so no group needs
splitting — this is almost entirely `family:` string edits.

Target structure:

| Family | Groups | Rows |
|---|---|---|
| `-ar verb cognates (preparAR → prepare)` | `-izar → -ize`, `-ar → -ate`, `-ificar → -ify`, `-inar → -ine`, `servar → -serve`, `plicar → -ply` | ~49 |
| `-er verb cognates (defendER → defend)` | `tener → -tain`, `poner → -pose`, `ceder → -cede`, `solver → -solve`, `traer → -tract`, `hender/prender → -hend` | ~34 |
| `-ir verb cognates (decidIR → decide)` | `-ir → silent -e`, `mitir → -mit`, `ferir → -fer`, `ducir → -duce`, `tribuir → -tribute`, `struir → -struct`, `escribir → -scribe`, `cluir → -clude`, `decir → -dict`, `primir → -press`, `vertir → -vert`, `gerir → -gest`, `hibir → -hibit`, `cibir → -ceive`, `currir → -cur` | ~56 |
| `Noun cognates` | the 22 noun suffix patterns (`-ción → -tion`, `-encia/-ancia`, `-ia → -y`, `-ista → -ist`, …) | ~190 |
| `Adjective cognates` | the 13 adjective suffix patterns (`-oso → -ous`, `-ico → -ic`, `-able`, `-ivo → -ive`, …) | ~130 |
| `Adverb cognates` | `-mente → -ly` | 15 |
| `Verb form endings` | `-ando → -ing`, `-iendo → -ing`, `-ado/-ido → -ed`, `-dido → -ded` | 29 |
| `How close is it?` | `Identical / transparent` (367), `Looks different` (64), `False friends` (10) | 441 |
| `Latin roots — not yet sorted by stem` | `Latin roots (any)` | 218 |

- **Naming requirement:** the three verb families hold only the *pattern-based*
  cognates. The 180 verbs in `Identical / transparent` are not in them. So
  label the last-but-one family for what it is — how close the spelling is,
  including the "no rule needed, just read it" bulk — and do **not** imply the
  class families are a complete enumeration of verb cognates.
- **Steps:**
  1. Assign every `cognates` facet button an explicit `family:` per the table.
     Pure `topics.ts` edits, no DB write.
  2. Retire the 1-group `Cognate types` family by folding `False friends` into
     `How close is it?` — "looks related but isn't" is the same axis.
  3. `-ma → -m` (1 row) merges into the nearest sibling or a single
     `Other suffix swaps` group. One small `collections:apply`.
  4. Leave `Identical / transparent` (367) whole. It is a complete enumeration
     of one teaching move; splitting it would be size-driven, which the retired
     size rule forbids.
- **Optional follow-up (5b):** `Latin roots (any)` is 218 rows, 161 of them
  verbs whose conjugation class is derivable from the infinitive ending.
  A script could distribute them into the three class families and the noun
  family. Worth it only if credits allow; the relabel above already delivers
  most of the value.
- **Manifest:** code-only for the regroup; one tiny `collections:apply`.
- **Size:** small-to-medium, mostly config. 1–2 commits.
- **Done when:** `reachable == base == 787`; no Cognates family mixes parts of
  speech; structure snapshot updated.

### Batch 6 — Verbs: family names and stragglers

- **Scope:** the 10 thematic verb families other than the catch-all.
- **Steps:** `--members verbs`; for each family answer: coherent branch? any
  group in the wrong family? name a teacher can predict? Specific suspects:
  - `Modals, time & possibility` has no time group — rename
    `Modals & possibility`, or move `Weather, Time & Duration` in from
    `Formal & specialized`.
  - `Communication — Other` (38) is a mini-catch-all inside a well-defined
    family; sort or rename.
  - `Placing & Setting — Idioms` (55) — confirm it is not swallowing plain
    `poner` senses.
  - `Deciding & Considering` (29, 0 core) straddles `Thinking & learning` and
    `Perception & feelings`; place it deliberately.
  - `Social life & conflict` has 1 core in 69 rows — flag for Batch 8.
- **Manifest:** none expected; any concept moves spin into a ≤20-row
  `concepts:apply`.
- **Size:** code-only. 1 commit.
- **Done when:** structure snapshot updated; verbs `reachable == base`.

### Batch 7 — small topics sweep

- **Scope:** Adverbs, Determiners, Pronouns, Interrogatives, Connectors,
  Prepositions, Numbers, Expressions, Imperatives, Collocations, Questions &
  Negation, Transformations, Verb-Forms, Verb-Patterns.
- **Known fixes:**
  - **Verb-Forms bug:** `topic:vf-past-d` labelled "regular /d/ (played)" sits
    in family `Irregular patterns`. Its two siblings are in `Regular endings`.
    One-word fix, confirmed at `topics.ts:880`.
  - **Transformations `Prefixes`:** 7 groups totalling 17 rows, five of them
    1–2 rows. Decision: **merge to one group**, `Common prefixes (un-, dis-,
    mis-, re-, over-, under-, fore-)`. A one-row "pattern" is not browsable.
    `collections:apply` MERGE, ~6 lines.
  - **Adverbs:** `Frequency` (Word types) and `Time — Frequency` (Meaning &
    context) are near-duplicates. Merge or distinguish explicitly.
    `Addition (also, either)` is 2 rows and duplicates the Connectors
    `Addition` group — check the base tags.
  - **Prepositions:** `Purpose` / `Without` / `Except` are 1 row each on
    borrowed `grammar:*` tags. Confirm the rows are prepositions; merge into
    one `Purpose, exception & absence` group if so.
  - **Connectors:** 11 groups, one family — consider `Everyday` vs
    `Discourse & advanced`.
  - **Verb-Patterns:** `going to (future)` and `progressive` may belong in
    their own `Tense-like patterns` family rather than `Sentence patterns`.
  - **Transformations dual-tag (surfaced by the Batch 1 axis guard):**
    `topic:morph-ward` ~ `topic:morph-expr-to-adv` (Jaccard 92%) and
    `morphology:suffix-ly` ~ `morphology:adjective-to-adverb` (100%) are the
    same rows under a suffix name and a POS-change name. MERGE each pair
    (`collections:apply`), then remove them from the guard's allow-list in
    `curriculum-reachability.test.ts`.
- **Manifest:** small `collections:apply` (prefixes, adverbs, the two
  transformations pairs).
- **Size:** code-only plus 2 tiny manifests. 2 commits.
- **Done when:** structure snapshot updated; all 14 topics `reachable ==
  base`.

### Batch 8 — beginner core coverage

- **Scope:** `core` is 309 of 4,220. `inventory.json` already carries
  `coreCount` per group. Whole families have almost none: Nouns 12 core in
  483 rows, Adjectives `Comparisons` 0 in 34, Verbs `Social life & conflict`
  1 in 69, Cognates 8 in 787.
- **Decision on "what counts as core" (recorded):** the authority is **the
  teacher's own beginner course need**, operationalized as: a concept is core
  if a beginner cannot hold a basic conversation about everyday life without
  it, and it is the *plainest* way to express that meaning. Concretely — the
  CEFR A1 functional inventory: greetings, numbers 1–20, days, months,
  colors, family, body, food, weather, time-telling, the present tense of the
  ~40 highest-frequency verbs, basic comparison. I am not deferring to an
  external frequency list; frequency ranks forms, and this catalog is indexed
  by *meaning pairs*, so a rank would not map cleanly.
- **Steps:**
  1. From `inventory.json`, list every group with `coreCount = 0` whose
     content is beginner material.
  2. Walk the A1 inventory above; for each item find the existing concept and
     promote it (`roles:apply`, per-row reason), or if genuinely absent add it
     (`concepts:add`). The kinship batch (`0dd79120`) is the template.
  3. Batch by domain in ≤30-row chunks: numbers/dates, colors/size, family/
     people, food/drink, weather/time, body/health, core verbs, comparison.
- **Manifest:** `roles:apply` + `concepts:add`, 5–8 small manifests.
- **Size:** 1 analysis commit + 5–8 apply commits. Stop-anywhere resumable.
- **Done when:** every beginner-facing family has non-zero core; the
  reachability test still shows every core concept reaching a group;
  `db:verify` clean. Promotions only — never demote to pass a check.

### Batch 9 — Mappings and Phrasal Verbs verification

- **Scope:** the four alphabetical dictionary pages. Lowest semantic need.
- **Steps:** assert every headword button's `family` matches its first letter;
  confirm the `Common confusions` families still resolve and the direction
  rule holds; Spanish→English Mappings is missing a `K–O` family — check
  whether that is real or a miscoded button.
- **Decision (recorded):** the 1–2 row rare-particle groups on
  Phrasal Verbs by Particle (`across`, `aside`, `ahead`, `below`, `before`)
  **stay**. That page's whole purpose is holding a particle constant, so a
  rare particle with two examples is the honest answer, not a defect. Noted
  so a future session does not re-flag it.
- **Manifest:** none.
- **Size:** verification. 1 commit.
- **Done when:** the letter-family assertion passes; existing
  `canonicalFacetCollection` and legacy-link tests green.

### Batch 10 — close out

- Re-run `npm run curriculum:inventory` and `npm run curriculum:audit:status`.
- Confirm one organizing principle per topic (`policy.md` §Organizing
  principles) and that sibling families are parallel.
- Freeze the structure snapshot as the new baseline; update `policy.md` with
  the axis rule; append a "semantic re-audit complete" checkpoint to
  `batch-plan.md`; mark this file complete.

---

## Suggested order

~~1~~ → ~~2a~~ → **2b** (×2–3) → 5 → 3 → 4 → 8-analysis → 8-apply (×5–8) →
6 → 7 → 9 → 10

Batches 1 and 2a are done. Batch 5 (Cognates) moved ahead of 3 and 4: the
reference cognate verbs excluded from Verbs in 2a now land there, so its
organization matters more than it did, and it is mostly config edits.

Tooling first. Then the four batches that change what a teacher actually
sees, biggest misdirection first. Beginner-core early enough to unblock
course building. Verification and the alphabetical pages last, because they
are already close to right.

## Judgment calls, recorded

| Question | Decision | Why |
|---|---|---|
| Replace the taxonomy model? | **No.** Keep Topic → Family → Group and `facet:value`. | Measured every suspected model failure; all four are curation defects a migration would carry across. Migration would cost the whole budget and break deep links, Lesson Builder joins, and coverage tooling. |
| "Abstract quality — X" vs "ser, -X" adjectives | **Duplicates. Merge.** | 75–95% member overlap per pair; identical rows (`[ser] necesario`) in both "General" buckets. Two generators, one axis. |
| "Formal & Rare Verbs" (219) | **Not a formal/rare group — it is an unsorted remainder. Distribute it.** | Its contents are `comer`, `enviar`, `cruzar`, `acabar`, `lograr`. Splitting it into invented formal sub-themes would preserve a false premise. |
| Nouns dual family/calendar taxonomies | **Container becomes the family; retire the container button.** Do not merge. | `family-immediate`/`-extended` are strict subsets of `people-family-rel`; same for `calendar` over `noun-time-months`. A level confusion, not redundancy. |
| Three Nouns money/business groups | **Rename, do not merge.** | Measured pairwise intersection is zero. They are three real slices with unhelpful names. |
| Reference cognate verbs on the Verbs page | **Exclude them via a declarative topic `baseExclusions` rule, role-gated.** Not by untagging, and not all cognates. | 205 of 315 cognate verbs are reference material drowning the browser; the other 110 are core teaching verbs a theme-browsing teacher must find. A display policy belongs in config, keeps the data honest, and is self-maintaining on promotion. |
| Cognates organizing axis | **Part of speech, with verbs split by conjugation class (-ar / -er / -ir).** | Measured: every pattern group is dominated by one part of speech, and every verb pattern sits in one conjugation class. The axis partitions cleanly, so it is a config change, not a re-tagging. |
| Cognates "Latin roots (any)" (218) | **Keep as its own family, labelled "not yet sorted by stem".** Distributing it is an optional follow-up. | The relabel delivers most of the value for none of the cost; 161 of the 218 are verbs whose class a script could derive later. |
| Cognates "Identical / transparent" (367) | **Leave whole.** | It is a complete enumeration of a single teaching move ("just read it"). Splitting it would be size-driven, which the retired size rule forbids. |
| Transformations "Prefixes" (7 groups, 17 rows) | **Merge to one `Common prefixes` group.** | Five of seven are 1–2 rows. A one-row pattern group is not browsable. |
| Phrasal-verb rare particles (1–2 rows) | **Leave.** | The page exists to hold a particle constant; a rare particle honestly has two examples. |
| What counts as `core` | **The A1 functional inventory of everyday conversation**, not an external frequency list. | The catalog is indexed by meaning pairs; a frequency rank over word forms does not map onto it cleanly. |
| Family renames breaking `?family=` deep links | **Acceptable; no alias map.** | Leaf-bearing links already survive via `resolveCurriculumPath`; bare family links degrade to the topic view. A test pins this. |
| Second tag system? | **No.** The axis guard is an assertion over the existing registry. | Fixes the mechanism that let the duplicate axis exist, without a parallel vocabulary. |

## Critical files

- `web/src/lib/curriculum/topics.ts` (family/label/order — most batches)
- `web/src/lib/curriculum/navigation.ts` (`canonicalFacetCollection`, family build)
- `web/src/lib/curriculum/collections.ts` (registry, axis guard)
- `web/scripts/curriculum-inventory.ts` (`--members`)
- `web/tests/curriculum-reachability.test.ts` (structure snapshot, axis guard)
- `docs/curation/taxonomy-cleanup-2026-09-07/{batch-plan,findings}.md` (ledger)
