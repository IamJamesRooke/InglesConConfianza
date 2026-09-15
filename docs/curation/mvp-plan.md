# MVP plan — Level 1, delegated (rev. 2026-09-15 evening)

Goal: teach Level 1 as the MVP. Four tracks, each run by the cheapest agent that can do
it well. Fable/Opus never executes; it only reviews the two ★ judgement outputs.

**State now:** Track 1 done and committed (`9a2e6e5c`). Enum decision made: `P1..P5` =
Level 1–5, no migration. Level-1 manifest merged with the owner's hand-set levels,
infinitives only, **dry-run clean (64 rows, 0 conflicts)** — not applied.

## Agent roster

| agent | model | why this model | runs |
|---|---|---|---|
| **A — Curator** | Haiku 4.5 | fully specified manifests, one command each; the verify chain catches mistakes | 2.2, 2.3 |
| **B — Curriculum UI** | Sonnet 5 | TypeScript/React with tests; must read a 1,100-line table component | 3.1–3.3 |
| **C — Checklist** | Sonnet 5 | small join + UI; runs after B merges | 4.1–4.4 |
| **D — Docs** | Haiku 4.5 | mechanical wording edits with exact targets | 1.4 |
| **★ Reviewer** | Fable/Opus | reads only: B's report + diff stat; later the Level-2 draft | R1, 2.4 |

Standing brief, pasted into every agent prompt:
> Read `AGENTS.md`, `docs/curation/README.md`, `docs/curation/level-1.md`. Never write to
> the database except via `npm run curriculum:apply -- <manifest> --apply` (run from
> `web/`; env is `web/.env`). The chain re-exports the snapshot and runs `db:verify` +
> `db:test`; if it fails, stop and report. Commit only the files you touched, one commit
> per task, message ends with the repo's `Co-Authored-By:` line. Another session owns
> `web/src/components/lesson-builder`, `web/src/lib/lesson-builder`,
> `web/src/app/admin/lesson-builder`, `web/data/lessons.json` — never edit those.
> Report in ≤ 15 lines: what changed, commands run, test results, anything unsure.

## Track 2 — Level 1 in the database (Agent A, Haiku)

**2.2 Apply Level 1.** Gate: owner says go.
```
cd web && npm run curriculum:apply -- ../docs/curation/level-1-P1-2026-09-15.tsv --apply
git mv docs/curation/level-1-P1-2026-09-15.tsv docs/curation/applied/
git add docs/curation web/prisma/seed-data && git commit
```
Done-check: `db:verify` clean; rows at P1 = 99 (35 owner-set + 64).

**2.3 Rule rows + 3 gaps.** Gate: owner approves the wording below (edit freely).
`curriculum:concepts:add` manifest with a `#` comment header; columns
`spanish · english · exSpanish · exEnglish · role · |-collections` (copy the shape from a
`*-add.tsv` in `applied/`). Collections: `grammar:rule` (in the registry) + a `pos:`.

| spanish | english | example es → en | role |
|---|---|---|---|
| ser y estar → *be* | ser and estar are both *be* | Soy profesor. Estoy aquí. → I am a teacher. I am here. | P1 |
| contracciones: I'm / you're / it's / there's | contractions of *be* | Soy yo. → It's me. | P1 |
| *to* después de want / need / have / going | want **to**, need **to**, have **to**, going **to** | Quiero hacerlo. → I want to do it. | P1 |
| verbo sin *to* después de *can* | can + verb (no *to*) | Puedo hacerlo. → I can do it. | P1 |
| el pronombre objeto va después del verbo | object pronoun after the verb | Lo quiero. → I want it. | P1 |
| mirar [algo] | to look at [something] | Mira esto. → Look at this. | Unranked |
| aprender [algo] | to learn [something] | Quiero aprender inglés. → I want to learn English. | Unranked |
| no | not | No es fácil. → It is not easy. | Unranked |

Done-check: 8 new rows in the snapshot; `db:test` green; `curriculum:audit:status` unchanged.

**2.4 ★ Level 2/3 candidates** — Reviewer, *only when L1 lessons are being written*.
Source `archive/foundations-items.md`; output `level-2.md` in `level-1.md`'s format,
infinitives only; owner strikes lines; Agent A makes the manifest.

## Track 3 — `/curriculum` filters up to a level (Agent B, Sonnet)

Files: `web/src/app/admin/curriculum/page.tsx`, `web/src/components/curriculum/*`,
`web/src/lib/curriculum/server/curriculum-store.ts`, `web/src/lib/curriculum/types.ts`,
tests under `web/tests/`. Work on branch `curriculum-levels` from master.

- **3.1 Store:** add `maxLevel?: 1|2|3|4|5` to the query options → rows whose
  `curriculumRole` is in `P1..P<maxLevel>`; `Unranked`/`Trash` excluded unless the
  existing `role` filter asks for them. Keep `role` as is. Unit test on a fixture.
- **3.2 UI:** a "Level ≤ [1 ▾]" control on `/admin/curriculum` and every topic subpage,
  options 1–5 / all / Unranked / Trash, **default 1**. Display the enum as "Level 1…5"
  everywhere (never `P1`). Small level pill per row. Composes with the collection filter
  (`?collection=es:so&maxLevel=3`). Keep the existing blue theme; redesign nothing else.
- **3.3 Set level in place:** on a focused row, `Alt+1..5` / `Alt+0` (Unranked) → server
  action updates `curriculumRole` **and** appends `id \t role \t inline` to
  `docs/curation/applied/inline-levels.tsv`, then re-exports the snapshot by calling the
  export script's function (not a shell). Admin only. Test the action.
- Done-check: `npm run lint && npm run test:unit && npm run db:test` green; two
  screenshots (Level ≤ 1, Level ≤ 3) attached to the report.
- **R1 ★:** Reviewer reads the report + `git diff --stat` before merge. Five minutes.

## Track 4 — Checklist (Agent C, Sonnet) — LAST, after Track 3 merges

Spec: `level-1-checklist.md`. Must-teach = rows at level ≤ N; taught = rows referenced
by `web/data/lessons.json` (`lessons[].concepts[].conceptId`, **read-only**); the
checklist is the join. No new tables.
- **4.1** Header line on `/admin/curriculum`: `Level 1 · taught 14 / 99 rows` + bar.
- **4.2** Tick column when a level filter is active: ✓ + covering lesson, or ○.
- **4.3** `?untaught=1` → the "what's next" list.
- **4.4** No builder panel (builder files are off-limits): report it as the follow-up for
  the builder session — `Alt+L` panel, click ○ to add the row to the lesson's Covers.
- Done-check: a test for the join; numbers match a hand count of `lessons.json`.

## Track 1 leftovers

- **1.4 One ladder in the docs** (Agent D, Haiku, after 2.2): `docs/curriculum-database.md`
  §Curriculum roles, `docs/teaching-methodology.md` "three disciplines" paragraph,
  `AGENTS.md` priority 1, `web/CLAUDE.md` → all say *levels P1–P5 = Level 1–5, Unranked,
  Trash; Level 1 is `docs/curation/level-1.md`; concepts are infinitives only.* Remove
  the core/supporting/reference and core/essential/common wording.
- **1.5 Lesson 3's empty Covers** in `lessons.json` — owner, in the builder (not an agent).

## Order, gates, budget

| step | agent | gate | est. tokens |
|---|---|---|---|
| 2.2 apply Level 1 | A · Haiku | owner "go" | ~20k |
| 2.3 rule rows | A · Haiku | owner ok on wording | ~30k |
| 1.4 docs ladder | D · Haiku | after 2.2 | ~30k |
| 3.1–3.3 curriculum UI | B · Sonnet | none (own branch) | ~250k |
| R1 review | ★ | B's report | ~15k |
| 4.1–4.4 checklist | C · Sonnet | after R1 merge | ~150k |
| 2.4 Level 2 draft | ★ | when L1 lessons exist | ~60k |

Parked on purpose: dependency star-map, `stage:`/`role:` facets, spaced repetition,
Levels 6–10, the builder-side checklist panel.
