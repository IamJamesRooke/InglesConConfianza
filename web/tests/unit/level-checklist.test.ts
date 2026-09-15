import assert from "node:assert/strict";
import test from "node:test";

import {
  summarizeLevelChecklist,
  untaughtAtLevel,
  type LevelChecklistRow,
} from "../../src/lib/curriculum/level-checklist";

// A small fixture of curriculum rows spanning every role, plus a fake
// "lessons.json" coverage set (the ids a lesson's Covers list would produce).
const rows: LevelChecklistRow[] = [
  { id: "querer-1", curriculumRole: "P1" },
  { id: "querer-2", curriculumRole: "P1" },
  { id: "ser-1", curriculumRole: "P1" },
  { id: "estar-1", curriculumRole: "P2" },
  { id: "poder-1", curriculumRole: "P3" },
  { id: "junk-1", curriculumRole: "Trash" },
  { id: "unsorted-1", curriculumRole: "Unranked" },
];

// Only some of the P1 rows are referenced by a lesson's concepts[].conceptId.
const coveredIds = ["querer-1", "estar-1"];

test("summarizeLevelChecklist joins must-teach (role <= N) with taught (covered ids)", () => {
  const summary = summarizeLevelChecklist(rows, 1, coveredIds);
  // must-teach at Level 1 = the three P1 rows; Trash/Unranked never count.
  assert.equal(summary.total, 3);
  // only querer-1 of the P1 rows is covered (estar-1 is P2, out of scope).
  assert.equal(summary.taught, 1);
  assert.equal(summary.maxLevel, 1);
});

test("summarizeLevelChecklist widens as the level ceiling rises", () => {
  const level3 = summarizeLevelChecklist(rows, 3, coveredIds);
  // P1 + P2 + P3 = 5 must-teach rows; querer-1 and estar-1 are both covered now.
  assert.equal(level3.total, 5);
  assert.equal(level3.taught, 2);
});

test("summarizeLevelChecklist never counts Trash or Unranked rows", () => {
  const allCovered = rows.map((row) => row.id);
  const summary = summarizeLevelChecklist(rows, 5, allCovered);
  assert.equal(summary.total, 5); // P1..P5 rows only, junk-1 and unsorted-1 excluded
  assert.equal(summary.taught, 5);
});

test("untaughtAtLevel composes with the level ceiling: raising it can only add rows", () => {
  const untaughtLevel1 = untaughtAtLevel(rows, 1, coveredIds);
  assert.deepStrictEqual(
    untaughtLevel1.map((row) => row.id).sort(),
    ["querer-2", "ser-1"],
  );

  const untaughtLevel3 = untaughtAtLevel(rows, 3, coveredIds);
  assert.deepStrictEqual(
    untaughtLevel3.map((row) => row.id).sort(),
    ["poder-1", "querer-2", "ser-1"],
  );

  // Every Level-1 untaught row is still untaught at Level 3 (the filter only
  // adds P2/P3 rows on top; it never drops an existing untaught row).
  const level1Ids = new Set(untaughtLevel1.map((row) => row.id));
  const level3Ids = new Set(untaughtLevel3.map((row) => row.id));
  for (const id of level1Ids) assert.ok(level3Ids.has(id));
});

test("untaughtAtLevel excludes Trash/Unranked even when their ids are uncovered", () => {
  const untaughtLevel5 = untaughtAtLevel(rows, 5, coveredIds);
  assert.ok(!untaughtLevel5.some((row) => row.curriculumRole === "Trash"));
  assert.ok(!untaughtLevel5.some((row) => row.curriculumRole === "Unranked"));
});
