import assert from "node:assert/strict";
import test from "node:test";

import { unclaimedConceptsForLevel, type ByLevelConcept } from "../../src/lib/lesson-builder/syllabus-fill";
import type { LessonModule } from "../../src/lib/lesson-builder/types";

function row(id: string, pos: string | null): ByLevelConcept {
  return { id, spanish: id, english: id, curriculumRole: "P1", pos };
}

function moduleWith(main: string[], review: string[]): LessonModule {
  return {
    id: `module_${main.join("-")}_${review.join("-")}`,
    name: "Module",
    lessonIds: [],
    syllabus: {
      main: main.map((conceptId) => ({ id: `syl_${conceptId}`, conceptId, label: conceptId })),
      review: review.map((conceptId) => ({ id: `syl_${conceptId}`, conceptId, label: conceptId })),
    },
  };
}

test("excludes ids already in any module's Main list", () => {
  const rows = [row("querer", "verb"), row("saber", "verb"), row("yo", "pronoun")];
  const modules = [moduleWith(["querer"], [])];
  const groups = unclaimedConceptsForLevel(rows, modules);
  const ids = groups.flatMap((g) => g.entries.map((e) => e.item.id));
  // Fixed group order (Pronouns before Verbs) wins over source-row order.
  assert.deepEqual(ids, ["yo", "saber"]);
});

test("excludes ids already in any module's Review list", () => {
  const rows = [row("querer", "verb"), row("saber", "verb")];
  const modules = [moduleWith([], ["saber"])];
  const groups = unclaimedConceptsForLevel(rows, modules);
  const ids = groups.flatMap((g) => g.entries.map((e) => e.item.id));
  assert.deepEqual(ids, ["querer"]);
});

test("excludes ids claimed by ANY module, not just the first", () => {
  const rows = [row("querer", "verb"), row("saber", "verb"), row("poder", "verb")];
  const modules = [moduleWith(["querer"], []), moduleWith([], ["saber"])];
  const groups = unclaimedConceptsForLevel(rows, modules);
  const ids = groups.flatMap((g) => g.entries.map((e) => e.item.id));
  assert.deepEqual(ids, ["poder"]);
});

test("modules without a syllabus claim nothing", () => {
  const rows = [row("querer", "verb")];
  const modules: LessonModule[] = [{ id: "m1", name: "M1", lessonIds: [] }];
  const groups = unclaimedConceptsForLevel(rows, modules);
  assert.deepEqual(
    groups.flatMap((g) => g.entries.map((e) => e.item.id)),
    ["querer"],
  );
});

test("keeps the rows' own order within a group", () => {
  const rows = [row("comer", "verb"), row("estar", "verb"), row("querer", "verb")];
  const groups = unclaimedConceptsForLevel(rows, []);
  assert.equal(groups.length, 1);
  assert.deepEqual(
    groups[0].entries.map((e) => e.item.id),
    ["comer", "estar", "querer"],
  );
});

test("groups via syllabus-groups, fixed order, untagged last", () => {
  const rows = [row("mesa", "noun"), row("yo", "pronoun"), row("comer", "verb"), row("x", null)];
  const groups = unclaimedConceptsForLevel(rows, []);
  assert.deepEqual(
    groups.map((g) => g.label),
    ["Pronouns", "Verbs", "Words", "Untagged"],
  );
});

test("nothing unclaimed returns no groups", () => {
  const rows = [row("querer", "verb")];
  const modules = [moduleWith(["querer"], [])];
  assert.deepEqual(unclaimedConceptsForLevel(rows, modules), []);
});
