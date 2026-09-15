# MVP plan — Level 1 and the tooling around it (2026-09-15)

Owner's goals, in order: (1) declutter everything DB-related, (2) a Level 1–10 system
where only L1 is decided now, (3) `/curriculum` filters "up to level N", (4) a checklist
of what's taught / still to teach, in the lesson builder. Plus the things below that
were implied but not said.

**Model routing** (owner runs the cheapest model that works): **Haiku** = file moves,
manifests, doc edits with exact instructions. **Sonnet** = code changes with tests.
**Opus/Fable** = only the judgement calls marked ★ (there are two). Every task lists its
gate; nothing touches the database or `web/src` without the gate.

**Standing rules for every agent:** read `AGENTS.md` + `docs/curation/README.md` first;
`web/src` belongs to the lesson-builder session — coordinate, don't collide; never write
to the DB except through `npm run curriculum:apply <manifest> --apply`; after any DB
change run the snapshot export + `db:verify` + `db:test`; one commit per batch.

---

## Track 1 — Declutter (Haiku, ~1 hour)

**1.1 Reorganise `docs/curation/`** — gate: owner approved the layout on 2026-09-15.
`git mv` (history kept):
- `applied/` ← all 309 applied `*.tsv`, `pronoun-batches/`, `role-granularity/`,
  `sentence-record-triage-2026-08-24.json`, `sentence-record-normalization-2026-09-02.{md,tsv}`,
  `pronoun-untag-control-frames-2026-09-02.md`
- `specs/` ← `determiner-matrix.md`, `pronoun-matrix.md`, `verb-conjugation-matrix.md`,
  `verb-organization-plan-2026-09-05.md`, `cognates-plan-2026-09-05.md`
- `archive/` ← `BACKLOG.md`, `collation-brief.md`, `collation-kickoff-prompt.md`,
  `full-audit-{plan,progress,findings}.md`, `pronoun-inventory.md`,
  `foundations-draft.md`, `foundations-items.md`
- **leave in place:** `taxonomy-cleanup-2026-09-07/` (`web/scripts/curriculum-inventory.ts` reads `inventory.json` from it),
  `level-1.md`, `level-1-checklist.md`, `level-1-P1-2026-09-15.tsv`, `mvp-plan.md`, `README.md`
- Do **not** move `level-1-P1-2026-09-15.tsv` into `applied/` until Track 2 applies it.

**1.2 Rewrite `docs/curation/README.md`** to ≤ 60 lines: what the folder is; how to run a
batch (keep the existing command block and script table); naming rule; "the log is
`git log -- docs/curation/applied`"; the level system in three sentences pointing at
`level-1.md`. Delete the 40-row log table.

**1.3 Fix path references** — `grep -rn "docs/curation" web/ docs/ AGENTS.md` and update
every path that moved. Script comments under `web/scripts` may be edited (they are not
`web/src`). Two scripts cite `docs/curation/phrasal-verbs-plan-2026-09-05.md`, which
never existed: change the comment to point at `specs/verb-organization-plan-2026-09-05.md`
or remove the reference.

**1.4 One role ladder in the docs.** `docs/curriculum-database.md` says core/supporting/
reference; the old README said core/essential/common/extended/rare; the schema says
P1–P5. After Track 2 the truth is "Level 1–10 + Unranked + Trash". Edit
`docs/curriculum-database.md` §Curriculum roles, `docs/teaching-methodology.md` §three
disciplines (the paragraph on Core/Supporting/Reference), `AGENTS.md` priorities line 1,
and `web/CLAUDE.md` to say so. Gate: after 2.1 lands.

**1.5 Dead scripts.** `web/scripts/gen-*-manifest.ts` are one-off generators for batches
already applied (their headers say so). Propose deletion in a list; owner decides.
`docs/curation/BACKLOG.md` is archived, not deleted.

## Track 2 — Level system (Haiku for manifests; Sonnet for the migration)

**2.1 Enum → ten levels** (Sonnet; gate ★ owner confirms the migration). Today
`CurriculumRole = P1..P5 | Unranked | Trash` and every row is `Unranked`. Rename to
`L1..L10 | Unranked | Trash` via a Prisma migration; declaration order stays the sort
order (comment in `schema.prisma`). Update `web/src/lib/curriculum/collections.ts`
/ role lists, `web/scripts/lib/manifest.ts` role parsing, `audit-status.ts` guardrail
bands, tests. Run `web/scripts/backup-db.sh` first. Snapshot export after. Coordinate
with the builder session (touches `web/src`).
*Cheaper alternative if the owner prefers zero migration:* keep `P1..P5` and label them
"Level 1–5" in the UI; add L6–L10 only when needed. Either is fine; the doc paths below
say `L1`.

**2.2 Apply Level 1** (Haiku; gate: owner says "apply"). Manifest already generated:
`docs/curation/level-1-P1-2026-09-15.tsv` (101 rows). If 2.1 renamed the enum,
`sed 's/\tP1\t/\tL1\t/'` first. Dry-run, show the owner the diff, `--apply`, export,
verify, commit, move the manifest to `applied/`.

**2.3 Add the 5 rule rows** (Haiku; gate: owner approves wording). `curriculum:concepts:add`
manifest, collections `grammar:rule pos:rule`-style (add `rule` to the `pos:` vocabulary in
`collections.ts` or reuse `grammar:`), role L1:
- *ser y estar → be* — "Soy/estoy = I am" / "I am"
- *contracciones oficiales* — "yo soy = I'm" / "I'm, you're, it's, there's"
- *to después de want/need/have/going* — "quiero hacer = I want to do"
- *verbo sin to después de can* — "puedo hacer = I can do"
- *el pronombre objeto va después del verbo* — "lo quiero = I want it"
Also add `mirar → to look at`, `aprender → to learn`, `no → not` (Unranked — needed later).

**2.4 Level candidates the owner edits later** — ★ Opus/Fable, one sitting, *not now*.
When L1 is being taught, draft `level-2.md` (questions + negation + third person + *be*)
and `level-3.md` (time + surprises) from `archive/foundations-items.md`, same format as
`level-1.md`. Owner strikes lines; Haiku generates the manifest. Levels 4–10 are
vocabulary bands, defined when the owner opens them.

## Track 3 — `/curriculum` filters up to a level (Sonnet; builder session's territory)

**3.1 Store:** `curriculum-store.ts` takes `role: CurriculumRole | "all"`. Add
`maxLevel?: 1..10` (rows with level ≤ N; Unranked/Trash excluded) alongside the existing
single-role filter. Unit test.

**3.2 UI:** on `/curriculum` and every `/curriculum/[topic]` page, a level control:
"Level ≤ [1 ▾]" default **1** during the MVP, with "all" and "Unranked" as options; the
enum shown as "Level 1…10" everywhere (never P1/L1 in the UI). Each row shows its
level as a small pill. Works with the existing collection filter so "all uses of *so*,
Level ≤ 3" is one URL (`?collection=es:so&maxLevel=3`).

**3.3 Set level in place:** on a row, a control to set the level (keyboard-driven, same
Alt-modifier convention as the builder). Writes via a server action that appends a
one-line manifest to `docs/curation/applied/inline-YYYY-MM-DD.tsv` and updates the row,
so the export/verify path stays truthful. Admin only.

## Track 4 — The checklist (Sonnet; builder session)

Spec: `docs/curation/level-1-checklist.md`. In one line: **must-teach = rows at Level ≤
target; taught = rows in any lesson's Covers; checklist = the join.** No new tables.

**4.1** Module view: `Level 1 · 14/101 rows` + bar. **4.2** Builder panel (`Alt+L`):
island-grouped list, ✓ with covering lesson / ○; clicking ○ inserts the row into the
current lesson's Covers. **4.3** Same tick column on `/curriculum` when a level filter
is active. **4.4** "Next" = untaught rows; the three L1 dependencies are hard-coded in
the checklist doc, not the DB.

**Prerequisite:** the builder's Covers data must be complete — lesson 3 in
`web/data/lessons.json` has an empty `concepts` list although it teaches *can, me,
tomorrow, help*. Owner fills it (or the auto-Covers suggester does) before 4.1 means
anything.

## Things not said but needed

- **Backups** before 2.1 and 2.2 (`web/scripts/backup-db.sh`).
- **Snapshot parity**: `web/prisma/seed-data/curriculum.json` must be re-exported after
  every DB change or `db:verify` fails and the seed diverges.
- **The uncommitted builder work** on master (≈30 files, concept-suggestions API) should
  land before Track 3/4 start, or they'll conflict.
- **Memory & AGENTS.md**: after 2.2, update `AGENTS.md` "Current priorities" to "teach
  Level 1; promote/demote while authoring" and the memory note
  `curriculum_core_means_functional` (already says the model; flip "NOT applied").
- **Tests**: `web/tests/curriculum-*.test.ts` and `db:test` (14) must stay green after 2.1;
  add one test for `maxLevel` and one for the checklist join.
- **Vocabulary bands** (L4+): when the owner starts them, the "is it swappable?" test from
  `level-1.md` decides spine vs vocabulary; no new mechanism.
- **Don't** build the dependency star-map, `stage:`/`role:` facets, or spaced repetition
  for the MVP. They were considered and parked on 2026-09-15.

## Order and gates

1. Track 1.1–1.3 (Haiku) → owner glances at `git status` → commit.
2. Track 2.1 decision ★ (owner: migrate to L1–L10, or relabel P1–P5?) → Sonnet → commit.
3. Track 2.2 + 2.3 (Haiku) after "apply" → commit → Track 1.4 doc fixes → commit.
4. Tracks 3 and 4 in the builder session (Sonnet), in that order.
5. Track 2.4 ★ only when L1 lessons are being written.
