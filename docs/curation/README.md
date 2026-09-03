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
