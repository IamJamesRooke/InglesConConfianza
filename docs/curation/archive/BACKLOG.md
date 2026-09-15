# Curation backlog — paused 2026-09-08

Curation is **paused**. The database is in a safe, verified state:

- `npm run db:verify` — clean (DB == committed snapshot)
- `npm run db:test` — 14/14
- 4,484 concepts / 4,251 non-trash, 22 topics, 0 global orphans, 0 within-topic
  gaps, 0 confusion groups outside Mappings
- Roles: core 941 · essential 394 · common 812 · extended 1002 · rare 1102 ·
  trash 233

Nothing from the two completed phases is at risk. This file is the list of what
was left open when we stopped.

## Done and stable

- **Phase 2** — Topic → Family → Group taxonomy re-audit. `docs/curation/taxonomy-cleanup-2026-09-07/`.
- **Phase 3** — 5-tier priority ladder (`core / essential / common / extended /
  rare / trash`). `docs/curation/role-granularity/plan.md`, P3-0 … P3-10.
- A short "shrink the catalog" pass was attempted and **fully reverted**
  (commit `a0ccc708`) — it had deleted the Transformations topic, which is
  wanted for the advanced course. Everything is back.

## Open — needs a decision from the user before any work

### 1. Taxonomy — "not happy with how things are sorted"
No specifics were given. **Blocked on**: one or more concrete examples of a
group/family that is named wrong, holds the wrong things, is too granular, or is
under the wrong organizing principle. One representative example is enough to
find and fix the pattern everywhere.

### 2. Catalog size — "it's damn big"
4,251 non-trash feels large. The realistic teaching set is smaller:
`core` + `essential` = 1,335 (the MVP), + `common` = 2,147 (through the second
course). `extended` + `rare` (2,104) is a reference pool.

User decision 2026-09-08: **cut nothing for now.** If revisited, the candidates
(all real content, all a judgement call, NOT to be cut unilaterally) are:
- verb-form paradigm drills (~382, `rare`) — English irregular verb forms; one
  clean topic page (Past-Tense & Past-Participle Formation)
- transparent cognates (~294, `rare`) — the "you already know these" list on the
  Cognates page
- `X ==> Y` derivation rows (~292, `rare`) — Transformations topic content; the
  two-concepts-in-one-row format is ugly but the content is real
- Mappings example padding (~39, `rare`) — `en el baño`, `en Bogotá`: literal
  repeats of one preposition pattern. The only chunk I'd still call clearly safe.

## Open — lower stakes, do anytime

### 3. Phase 3 tier refinements
- `essential` keeps ~2 senses per multi-sense verb; a stricter MVP keeps 1.
- The `extended` / `rare` boundary within specialized vocabulary is a rule-based
  first pass; a per-topic human read would sharpen it.
- The 3 comparison rows still in `core` use the `X ==> Y` format
  (`ser bueno ==> ser mejor`). Content is right (comparison is core grammar);
  reformat to clean rows.

### 4. Grammar-point sequencing (Core I–IV)
Discussed and **shelved by the user**. If picked up: the better version is to
sequence ~70 grammar points (each row tagged with its point via a `gp:` facet,
the points ordered once), not to number the 941 rows. `core` decomposes cleanly
— a rough classifier already sorted 774/941 into 27 recognizable points.

## Git / environment loose ends (not curation)

### 5. Codex lesson-builder work tangled in two curation commits
Commits `1af0aec1` (P3-0) and `5d46785e` (P3-5) each carry an intermediate
snapshot of Codex's lesson-builder rewrite, swept in by `git add -A` before I
switched to explicit staging. The final file state is correct; only the history
attribution is wrong. Fix with `git rebase -i` to split those two commits —
**only once Codex has paused and the tree is clean**.

### 6. Stash `codex-wip-during-revert`
Made to protect Codex's uncommitted work during the Transformations revert.
`git stash pop` did not fully drop it — it still holds ~197 lines across
`learner.css`, `lesson-block-preview.tsx`, `lesson-library.tsx`, `lessons.json`
that are not in the working tree or HEAD. Someone with Codex context should
check whether that is wanted work or superseded, then `git stash drop`.
Working tree also has live Codex edits to 4 lesson-builder/learner files —
left untouched.

### 7. Pre-existing test failures (predate all curation)
3 failures in `web/tests/unit/presentation-course.test.ts`
("presentation course has onboarding plus three complete modules",
"every lesson ends in answerable sentence practice",
"onboarding is a real James introduction mini-lesson"). Lesson-content, not
curriculum. Confirmed present before Phase 3 via `git stash`.

## Backups

- `web/scripts/backup-db.sh` — timestamped `pg_dump` + snapshot copies under
  `backups/db/` (gitignored, keeps 20).
- Canonical: `web/prisma/seed-data/curriculum.json`, committed every batch,
  `db:verify`-gated.
- To restore curriculum-only without touching lesson data: truncate
  `conceptCollection`, `mappingSourceEntry`, `mappingSourceDocument`,
  `curriculumConcept`, `collection`, then run the seed
  (`seedCurriculumDatabase` from `scripts/curriculum-data.ts`).
