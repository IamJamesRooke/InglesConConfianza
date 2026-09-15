import assert from "node:assert/strict";
import test from "node:test";

import { buildModuleSyllabusUsage } from "../../src/lib/curriculum/module-usage";
import type { LessonConcept, LessonModule } from "../../src/lib/lesson-builder/types";

function concept(conceptId: string | null, label: string): LessonConcept {
  return { id: `lc_${label}`, conceptId, label };
}

test("buildModuleSyllabusUsage: main and review entries, freehand items skipped", () => {
  const modules: LessonModule[] = [
    {
      id: "m1",
      name: "Module I",
      lessonIds: [],
      syllabus: { main: [concept("querer", "querer")], review: [concept(null, "freehand")] },
    },
    {
      id: "m2",
      name: "Module II",
      lessonIds: [],
      syllabus: { main: [], review: [concept("querer", "querer")] },
    },
  ];
  const usage = buildModuleSyllabusUsage(modules);
  assert.deepEqual(usage.get("querer"), [
    { moduleId: "m1", moduleName: "Module I", list: "main" },
    { moduleId: "m2", moduleName: "Module II", list: "review" },
  ]);
  assert.equal(usage.has("freehand"), false);
  assert.equal(usage.size, 1);
});

test("buildModuleSyllabusUsage: a module without syllabus contributes nothing", () => {
  const modules: LessonModule[] = [{ id: "m1", name: "Module I", lessonIds: [] }];
  const usage = buildModuleSyllabusUsage(modules);
  assert.equal(usage.size, 0);
});
