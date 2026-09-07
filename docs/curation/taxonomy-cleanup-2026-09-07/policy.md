# Curriculum taxonomy — organization policy (2026-09-07)

Scope: the three-level admin browser (`/admin/curriculum?topic=…`) — Topic →
Family → Group — and the collections + navigation config behind it. Builds on
the phased curation in `docs/curation/README.md` and the completed
facet-by-facet audit in `docs/curation/full-audit-*`. This document is the
fixed standard for the cleanup; batches and live state are in `batch-plan.md`.

## The three levels

| Level | Question it answers | Where it lives |
|---|---|---|
| **Topic** | What broad area am I in? | `CURRICULUM_TOPICS[].slug/title` + `baseCollection` in `src/lib/curriculum/topics.ts` |
| **Family** | Which coherent branch of that area? | grouping of facet buttons — today inferred by `facetGroup()` in `navigation.ts`, moving to explicit config (Batch 6) |
| **Group** | Which specific set of concepts do I inspect/teach? | one facet button = one collection, `topics.ts` `facetButtons[]` |

Reachability (mirrors `readCurriculumPage` / `readCurriculumNavigationCounts`):

- Topic scope = `baseCollection` (AND).
- Group = `baseCollection` AND `leaf.collection`.
- Family = `baseCollection` AND (some `leaf.collection` in that family).
- "Outside these families" = `baseCollection` AND NOT any leaf collection.

A concept is **meaningfully reachable** iff it carries the base tag **and** at
least one facet-button collection of that topic. Carrying a collection is not
enough — the button only shows it if the base tag is also present.

## Organizing principles (choose one per topic, don't mix siblings)

- **Grammatical function** — Pronouns, Determiners, Interrogatives, Connectors,
  Questions & Negation, Verb Patterns.
- **Communicative purpose** — Expressions, Imperatives, Collocations.
- **Semantic domain** — Nouns, Adjectives, Adverbs, Verbs (thematic).
- **Word-building pattern** — Cognates, Transformations, Verb-Forms.
- **Mapping headword** — Spanish-to-English / English-to-Spanish Mappings,
  Phrasal Verbs by Root / by Particle.

## Group sizing

8–15 concepts is the design reference, not a quota. Keep a small coherent group
whole; split a large group only when distinct meanings or teaching purposes
justify it. Do **not** manufacture numbered `(1)/(2)/(3)` partitions for
uniformity — those are a naming defect to fix (Batch 5), not a feature. The
prior "subtopic-size rule" pass created many of them; where the split axis is
arbitrary, merge back and let the group run large rather than keep a numbered
partition. **Retired 2026-09-07 (Batch 5, user sign-off):** all 435
`topic:<stem>-<N>` numbered facet families merged to one `topic:<stem>` group.
`canonicalFacetCollection()` in `navigation.ts` keeps pre-merge deep links
resolving. Future work splits only on a meaningful seam, never for size.

## Naming

- No internal codes, unexplained abbreviations, or redundant topic-name
  prefixes in a group label.
- No arbitrary `(1)/(2)` suffixes. If a concept set genuinely needs
  subdivision, name each part for its content ("Family & relationships",
  "Professions & roles"), never by number.
- No dumping-ground labels ("Other", "Misc", "General") as the *only* home for
  a concept. A small residual "Other …" group is acceptable when its siblings
  are well-defined and it is genuinely a short tail.
- Keep meaningful linguistic notation: headwords, accents, `-ción → -tion`
  arrows, IPA rime keys, `[ser]/[estar]/[el]/[la]` brackets.
- Fix membership first, then the label. Never just rename a misleading group.
- Display label ≠ collection identifier. Prefer relabelling in `topics.ts`
  (free) over renaming a DB collection (needs `collections:apply` + deep-link
  updates). Rename a collection only when the identifier itself is wrong or
  will collide.

## The confusion-group boundary

Dedicated confusion / translation-choice groups belong **only** under:

- **Spanish-to-English Mappings** — group starts from a Spanish form whose
  English rendering depends on context (`su → his/her/its/your/their`;
  `realizar → carry out`, not "realize").
- **English-to-Spanish Mappings** — group starts from an English form with
  several Spanish equivalents (`you → tú/usted/ustedes/te/ti`).

They must **not** appear as groups under Pronouns, Determiners, Interrogatives,
Verbs, Nouns, Adjectives, Cognates, or any other ordinary topic. This is
applied by teaching purpose, not by tag prefix: `topic:confusable-*` groups are
in scope too.

Distinguish the **group** from its **concepts**:

- The translation-choice *group* for `su` moves to the Mappings browser.
- Each *concept* (`su → his`, `su → her`, …) keeps its real grammatical
  memberships (`grammar:possessive-determiner`, `topic:pronoun`,
  `topic:determiner`). Removing the confusion path must not orphan them or
  strip grammar classification.
- Mechanism: a Spanish-side confusion concept carries `topic:multi-sense`
  (semantically true — that is the Mappings page's definition); an
  English-side one carries `topic:en-multi-sense`. `contrast:*` collections
  stay as the retrieval label; the "Confusions" family on each Mappings page
  unions them.
- Respect direction — do not mirror a group into both Mappings pages.
- Inspect membership before moving. If `mi → my` sits in a `su/sus` group,
  decide whether it is a needed contrast (`mí` vs `mi`) or unrelated; neither
  keep nor drop blindly.

## Change discipline

- PostgreSQL is authoritative. Measure with `npm run curriculum:inventory`
  (writes `inventory.json`), not old counts or snapshots.
- Apply via the existing manifests only (`curriculum:concepts:apply` merges
  collections, never removes; `curriculum:concepts:untag` is the removal path;
  `curriculum:collections:apply` for DELETE/MERGE/RENAME; `curriculum:roles:apply`
  only with a logged reason). Dry-run first, then `npm run curriculum:apply … --apply`.
- Preserve concept IDs. Preserve roles by default — flag questionable role
  assignments in `findings.md`, do not demote Core to pass a coverage check.
- Retirement candidates go to `trash`, never hard-deleted.
- Update `topics.ts` / `navigation.ts` / audit specs / tests in the same batch
  as the DB change so deep links and counts stay correct.
- One commit per batch; snapshot + `db:verify` + `db:test` green before commit.
