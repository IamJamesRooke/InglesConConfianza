# Mappings PostgreSQL Migration Plan

## Objective

Move every useful item in `docs/curriculum/mappings/english-to-spanish` into the canonical Spanish-first PostgreSQL curriculum. This is a completeness pass, not final curation. Keep Core highly selective, assign provisional Supporting or Reference roles, and defer broad promotion, demotion, and collection cleanup until the source tree is exhausted.

The remaining source currently contains 298 top-level English hubs and 2,300 Markdown files. It mixes atomic mappings, YAML pilots, tables, examples, contrasts, pronunciation notes, and synthesis READMEs. A file count is therefore an inventory boundary, not a concept count.

## Non-negotiable record shape

Every migrated concept has:

- one neutral Spanish concept or construction;
- exactly one natural English target;
- one short bilingual example stored only in the example fields;
- one provisional `core`, `supporting`, or `reference` role;
- collections sufficient to retrieve its family and important teaching pattern;
- source-path provenance in its review candidate.

Full source sentences are evidence, not canonical concept fields. Rewrite `Estoy bien, gracias. -> I'm fine, thanks.` as a concept such as `estar bien -> to be okay`, retaining a short sentence in the example fields.

## Canonical normalization

Use dictionary-like forms unless a surface form changes meaning or teaching behavior.

| Source evidence | Spanish concept | English target | Required pattern collections |
|---|---|---|---|
| eating an object | `comer [algo]` | `to eat [something]` | `comer`, source hub, `verb + direct object` |
| permanent characteristic | `ser listo` | `to be smart` | `ser`, `adjective`, `ser adjectives` |
| temporary/readiness state | `estar listo` | `to be ready` | `estar`, `adjective`, `estar adjectives` |
| English adjective expressed with `tener` | `tener hambre` | `to be hungry` | `tener`, `adjective`, `tener adjectives` |
| English verb selects a base form | `ir a [hacer algo]` | `to go [do something]` | `verb + bare infinitive` |
| English verb selects a `to`-infinitive | `decirle a [alguien] que [haga algo]` | `to tell [somebody] [to do something]` | `verb + full infinitive`, `somebody to do something` |

Use masculine singular dictionary forms for Spanish adjectives unless gender or number changes the mapping. Show natural agreement in examples. Store nouns with a natural article. Preserve fixed questions, commands, conjugated forms, and lexicalized participles only when their form supplies an independently teachable English realization.

### Controlled placeholders

Prefer these reusable pairs and extend them only when the source requires a genuinely different slot:

| Spanish | English |
|---|---|
| `[algo]` | `[something]` |
| `[alguien]` | `[somebody]` |
| `[hacer algo]` | `[to do something]` after a full infinitive selector |
| `[hacer algo]` | `[do something]` after a bare infinitive selector |
| `[lugar]` | `[place]` |

Bracket the complete replaceable constituent. Text outside brackets is the stable part of the mapping.

### English `be` exception

The `be` hub is a deliberate exception. Preserve useful mappings for `be`, `am`, `is`, `are`, `was`, `were`, `been`, and `being` when the surface form itself matters for retrieval or teaching. Give every such concept the `to be` collection plus its exact surface-form collection and the Spanish mechanism involved, such as `ser`, `estar`, `tener`, or `haber`.

Do not use this exception to expand ordinary conjugations of other verbs. The exact Spanish-first shape for each `be` surface row must still be neutral enough to reuse and specific enough that its English target is natural.

## Collection/tag contract

Collections are the existing many-to-many tag system. Curriculum role is not a collection.

Add collections in this order when applicable:

1. Spanish lexical family: `comer`, `ser`, `estar`, `tener`.
2. English source hub or target family: `eat`, `to be`, `am`, `is`.
3. Grammatical or construction pattern: `adjective`, `ser adjectives`, `verb + bare infinitive`, `verb + full infinitive`, `somebody to do something`, `phrasal verb`, `verb + preposition`.
4. Stable particle or connector: `up`, `with`, `con => with`.
5. Semantic or lesson-planning collection only when it groups otherwise non-obvious concepts.
6. Provenance collection: `english-to-spanish mappings` for concepts or revisions discovered in this pass.

Use lowercase collection names. Prefer an existing collection when it expresses the same concept. During this completeness pass, useful extra collections are acceptable; cleanup comes later.

## Role policy

- `core`: indispensable structural or referential language that learners must explicitly control to function. Commonness alone is insufficient.
- `supporting`: extremely useful, broadly reusable language worth teaching around Core material.
- `reference`: the default for valid secondary, situational, inferable, advanced, uncertain, or alternate material retained for retrieval.
- Delete only malformed data, true duplicates, unwanted course content, or material with no curriculum/reference value. Keep the decision in review history.

Promotion and demotion are not migration blockers. When uncertain, preserve the concept as `reference` and record the uncertainty in the rationale.

## Hub workflow

1. Inventory the hub and select the recommended model. Use Sol with high reasoning for ambiguous, structural, high-collision, or form-heavy hubs. Use Terra for repeatable small hubs after the rules are stable. Use Luna only for mechanical inventory or formatting whose output will be checked by preflight.
2. Read every file in the hub plus linked teaching/contrast material. Build a file-level ledger before deleting anything.
3. Extract every useful meaning, construction, warning, example, register distinction, and related-pillar item.
4. Normalize useful mappings into a review batch. Record non-concept material as `non-concept`, `moved`, or `represented-by` in the ledger.
5. Run database-backed preflight. Resolve exact duplicates as revisions or documented duplicates; inspect probable duplicates and sentence-shape warnings.
6. Import the batch with a dry run and then apply it to the Review inbox.
7. Approve completeness-pass candidates with provisional roles. Preserve deletions and rationale in review history.
8. Migrate with a dry run and then apply it transactionally.
9. Export/update immutable seed snapshots, run `db:verify` and `db:test`, and confirm the batch has no unresolved candidates.
10. Mark every hub file disposed, delete only fully consumed source files, update the backlog, and commit the coherent batch.

## Completion proof

The mappings pillar is complete only when all of these are true:

- all 298 original top-level hubs have a terminal manifest status;
- every original source file has a disposition and no pending useful material;
- no source file was deleted before its disposition and database/review destination were recorded;
- every imported batch passed duplicate preflight;
- no review candidate from this migration remains unresolved;
- the active English-to-Spanish source tree is empty except for intentionally retained navigation or moved-source links;
- PostgreSQL exactly matches the seed snapshots and all curriculum database tests pass.

After that proof, run separate passes for role curation, collection consolidation, and the remaining curriculum pillars.
