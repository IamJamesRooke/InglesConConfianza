# Curriculum curation log

The Postgres curriculum (`web/prisma/seed-data/curriculum.json`) is curated from
reviewed TSV manifests in this folder. See
[`../../web/CLAUDE.md`](../../web/CLAUDE.md) and the memory note
`curriculum-curation-plan` for the workflow and rationale.

## How to run a batch

```
cd web
npm run curriculum:apply docs/curation/<manifest>.tsv [...] --apply
```

`curriculum:apply` detects each manifest's type, applies it, then re-exports the
snapshot and runs `db:verify` + `db:test`, halting on the first failure. Then
`git add docs/curation/ web/prisma/seed-data/` and commit, one commit per batch,
listing the manifests in the message.

Individual scripts (each dry-run by default, `--apply` to write):

| script | manifest columns |
|---|---|
| `curriculum:concepts:apply` | `concept-id · spanish · english · role · \|-collections-to-add · reason · [exSpanish · exEnglish]` — rewrites a row (collections merge, never remove) |
| `curriculum:concepts:add` | `spanish · english · exSpanish · exEnglish · role · \|-collections` — new rows |
| `curriculum:concepts:untag` | `concept-id · collection-name · reason` — removes one membership |
| `curriculum:roles:apply` | `concept-id · role · reason` — move tiers |
| `curriculum:collections:apply` | `DELETE\|MERGE\|RENAME · from · [into/to] · reason` |
| `curriculum:audit [slug]` | audits `topic:*` macrotags against `TOPIC_AUDIT_SPECS` |
| `curriculum:audit:verbs` | audits `sense:`/`conjugation:` paradigm completeness (bespoke, not `TopicAuditSpec`) |
| `curriculum:audit:cognates` | audits `cognate:` type/pattern-family structure (bespoke, not `TopicAuditSpec`) |

`trash` is the only deletion path — move a row there, never hard-delete as a
judgement call.

## Naming

Going forward: `curation-YYYY-MM-DD-<slug>.tsv`. A canonical topic spec is
`<topic>-matrix.md`.

## Log

| date | batch | commit | manifests |
|---|---|---|---|
| 2026-08-23 | Migrate & retire the file-based curriculum into Postgres | `7361be93`..`eb7be422` | — |
| 2026-08-24 | Snapshot before deletions; sentence-record triage | `d3acde73`, `c8ae0ddf` | `sentence-record-triage-2026-08-24.json` |
| 2026-09-02 | Curate corrupted sentence records; add `trash` role | `ec40f38e` | — |
| 2026-09-02 | Sort every concept into a role tier | `b891bc17` | `role-sort-2026-09-02.tsv` |
| 2026-09-02 | Normalize sentence-shaped records into constructions | `a1c42c62` | `sentence-record-normalization-2026-09-02.{md,tsv}` |
| 2026-09-02 | Retire the review pipeline; curate via `trash` | `8f6f39c4` | — |
| 2026-09-02 | Retire migration-artifact collections | `b3f4b6a3` | `collections-phase1-2026-09-02.tsv` |
| 2026-09-02 | `es:` / `en:` lemma facets | `07b0d1ac` | `collections-phase3a-*-2026-09-02.tsv` |
| 2026-09-02 | Namespace collections into `facet:value` + registry | `b1ebb13e` | `collections-phase3b-facet-rename-2026-09-02.tsv` |
| 2026-09-02 | Topic subpages; Pronouns first | `86693cef` | `collections-phase4-pronoun-facets-2026-09-02.tsv` |
| 2026-09-02 | Normalize pronoun rows; fix facet bugs | `9c56a8f3`, `d54b5cae`, `922fb652` | `pronoun-phaseA-facet-fixes-2026-09-02.tsv`, `pronoun-phaseC-normalize-2026-09-02.tsv`, `pronoun-untag-control-frames-2026-09-02.md` |
| 2026-09-02 | Split slashed determiner/demonstrative rows | `9c683ccf` | `pronoun-slash-split-2026-09-02.tsv` |
| 2026-09-02 | Lock the pronoun topic; add `contrast:` facet | `83e734f1`, `9fde0359` | — |
| 2026-09-03 | Compound-indefinite prefix/suffix morphology | `50cc254d` | — |
| 2026-09-03 | Close the pronoun matrix (author every cell) | `75969e17` | `pronoun-batches/`, `pronoun-matrix.md` |
| 2026-09-03 | Manner adverb `bien` | `470aefdd` | `add-hacer-algo-bien-2026-09-03.tsv` |
| 2026-09-03 | **Determiners topic** (137 rows) | `57d80529`..`71c8b694`, `af920218` | `determiner-matrix.md`, `determiner-2026-09-04-{A,B,C,E,F,G}-*.tsv` |
| 2026-09-03 | **Curation pass** — tag hygiene, number examples, Interrogatives topic, bundled-row splits, determiner contrasts | `eb30a60b`..`e38ce2b2` | `curation-2026-09-04-{1b,1c,1d,2,3,4,5a,5b,5c}-*.tsv` |
| 2026-09-03 | Tooling cleanup — unified topic auditor, `scripts/lib/manifest.ts`, `curriculum:apply` | `7aeb207e`, `8828832e`, `6f81a081` | — |
| 2026-09-05 | **Verb organization** — `sense:` facet, 5-person present-tense paradigms for ser/estar/ir/tener/haber, `audit-verb-conjugation.ts` | `0ee27928`..`4261360e` | `verb-organization-plan-2026-09-05.md`, `curation-2026-09-05-verbs-*.tsv`, `curation-2026-09-05-voy-a-*.tsv` |
| 2026-09-05 | **Cognates topic** — promoted misfiled `morphology:suffix-*` root/etymology data to named `cognate:<stem>-to-<root>` families, retired 6 legacy junk values, modeled false friends as `contrast:` pairs, `audit-cognates.ts` | `cba02c4`, `3e8acf1` | `cognates-plan-2026-09-05.md`, `curation-2026-09-05-cognates-*.tsv` |
| 2026-09-04 | Nouns/adjectives: bracket the article/copula, `gender:` facet | `8ec42013` | `curation-2026-09-04-nouns-gender-bracket.tsv`, `curation-2026-09-04-adjectives-copula-bracket.tsv` |
| 2026-09-04 | Adjectives: `degree:` facet on existing comparative/superlative rows | `498d83db` | `curation-2026-09-04-adjectives-degree.tsv` |
| 2026-09-04 | Nouns/adjectives theme categorization (`topic:` facet) | `465f2e4` | `curation-2026-09-04-nouns-adjectives-theme.tsv` |
| 2026-09-04 | **Nouns/Adjectives topics** — tag degree: derivation rows `pos:adjective` so they surface on the new pages | *(pending commit)* | `curation-2026-09-04-adjectives-degree-pos-tag.tsv` |
| 2026-09-05 | **Spanish-to-English Mappings topic** — `topic:multi-sense` facet on the 44 `es:` lemmas with 14+ distinct English senses, excluding `es:be` and `es:mañana` as mistagging bugs | `88502be7` | `curation-2026-09-05-multi-sense-topic.tsv` |
| 2026-09-05 | **English-to-Spanish Mappings topic** — `topic:en-multi-sense` facet on the 107 `en:` lemmas with 7+ distinct Spanish senses and a >=0.6 lemma-containment ratio (screens out topical bucket-tags like `en:place`, `en:expression`, `en:order`) | `25f8c94` | `curation-2026-09-05-en-multi-sense-topic.tsv` |
