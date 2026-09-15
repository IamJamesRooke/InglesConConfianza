# Curriculum curation

The Postgres curriculum (`web/prisma/seed-data/curriculum.json` is its committed
snapshot) is edited only through reviewed TSV manifests kept in this folder. Workflow
and rationale: `../../web/CLAUDE.md` and the memory note `curriculum-curation-plan`.

## Layout

| path | what | read when |
|---|---|---|
| `level-1.md` | **the MVP spine** — 58 items / 101 rows that must be taught first | building lessons, tagging levels |
| `level-1-checklist.md` | how "taught / still to teach" is computed and shown | building the checklist |
| `mvp-plan.md` | the execution plan (declutter, levels, `/curriculum` filter, checklist) | picking up work |
| `specs/` | canonical topic specs the audit scripts enforce (verb org, cognates, pronoun/determiner/verb matrices) | running `curriculum:audit:*` |
| `taxonomy-cleanup-2026-09-07/` | topic → family → group browser inventory; `curriculum-inventory.ts` reads `inventory.json` | touching topic navigation |
| `applied/` | every manifest already applied (audit trail) | never — `git log -- docs/curation/applied` |
| `archive/` | superseded plans and drafts | never |

## Levels

`curriculumRole` is a level: **P1 = Level 1 … P5 = Level 5**, `Unranked` = not yet
placed, `Trash` = deletion staging. Level 1 is defined in `level-1.md`; everything else
stays `Unranked` until the owner promotes it while writing lessons. The old
core/essential/common ladders are gone.

## How to run a batch

```
cd web
npm run curriculum:apply docs/curation/<manifest>.tsv [...] --apply
```

`curriculum:apply` detects each manifest's type, applies it, re-exports the snapshot and
runs `db:verify` + `db:test`, halting on the first failure. Then `git add docs/curation/
web/prisma/seed-data/` and commit, one commit per batch; move the manifest to `applied/`.

Individual scripts (dry-run by default, `--apply` to write):

| script | manifest columns |
|---|---|
| `curriculum:roles:apply` | `concept-id · role · reason` — set a row's level |
| `curriculum:concepts:apply` | `concept-id · spanish · english · role · \|-collections-to-add · reason · [exSpanish · exEnglish]` — rewrite a row (collections merge, never remove) |
| `curriculum:concepts:add` | `spanish · english · exSpanish · exEnglish · role · \|-collections` — new rows |
| `curriculum:concepts:untag` | `concept-id · collection-name · reason` — remove one membership |
| `curriculum:collections:apply` | `DELETE\|MERGE\|RENAME · from · [into/to] · reason` |
| `curriculum:audit [slug]` · `:verbs` · `:cognates` · `:phrasal-verbs` · `:status` | audits against `specs/` |

`Trash` is the only deletion path — move a row there, never hard-delete as a judgement call.

## Naming

`curation-YYYY-MM-DD-<slug>.tsv`; level manifests `level-N-<role>-YYYY-MM-DD.tsv`.
