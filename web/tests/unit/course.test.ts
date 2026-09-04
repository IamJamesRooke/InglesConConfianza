import assert from "node:assert/strict";
import test from "node:test";

import {
  conceptKey,
  isLessonFile,
  isLessonModule,
  migrateV1ToV2,
  moduleCoveredConceptKeys,
  parseLessonFile,
  reconcileLessonFile,
  moduleContainingLesson,
} from "../../src/lib/lesson-builder/lesson-file";
import type {
  Lesson,
  LessonConcept,
  LessonFile,
} from "../../src/lib/lesson-builder/types";

function lesson(id: string, concepts: LessonConcept[] = []): Lesson {
  return { id, name: null, concepts, blocks: [] };
}

function concept(conceptId: string | null, label: string): LessonConcept {
  return { id: `lc_${label}`, conceptId, label };
}

function fileWith(moduleLessonIds: string[][], lessons: string[]): LessonFile {
  return {
    version: 2,
    modules: moduleLessonIds.map((lessonIds, index) => ({
      id: `m${index + 1}`,
      name: `Module ${index + 1}`,
      keyConcepts: [],
      lessonIds,
    })),
    lessons: lessons.map((id) => lesson(id)),
  };
}

test("migrateV1ToV2 wraps every lesson in one module, order kept", () => {
  const v2 = migrateV1ToV2({
    version: 1,
    lessons: [lesson("a"), lesson("b"), lesson("c")],
  });
  assert.equal(v2.version, 2);
  assert.equal(v2.modules.length, 1);
  assert.deepEqual(v2.modules[0].lessonIds, ["a", "b", "c"]);
  assert.deepEqual(
    v2.lessons.map((l) => l.id),
    ["a", "b", "c"],
  );
  assert.ok(isLessonFile(v2));
});

test("parseLessonFile accepts v1 and v2, rejects junk", () => {
  assert.equal(parseLessonFile({ version: 1, lessons: [] }).version, 2);
  const v2 = fileWith([["a"]], ["a"]);
  assert.deepEqual(parseLessonFile(v2), v2);
  assert.throws(() => parseLessonFile({ version: 3 }));
  assert.throws(() => parseLessonFile("nope"));
});

test("a pre-Key-Concepts module still parses and is normalized", () => {
  const legacy = {
    version: 2,
    modules: [
      {
        id: "m1",
        name: "Module 1",
        promise: "old text",
        finalSentence: { spanish: "", english: "" },
        lessonIds: ["a"],
      },
    ],
    lessons: [lesson("a")],
  };
  assert.ok(isLessonModule(legacy.modules[0]));
  const parsed = parseLessonFile(legacy);
  assert.deepEqual(parsed.modules[0].keyConcepts, []);
  assert.ok(!("promise" in parsed.modules[0]));
});

test("module kind accepts onboarding and rejects unknown values", () => {
  const onboarding = {
    id: "welcome",
    name: "Empieza aquí",
    kind: "onboarding",
    keyConcepts: [],
    lessonIds: [],
  };
  assert.ok(isLessonModule(onboarding));
  assert.equal(isLessonModule({ ...onboarding, kind: "private" }), false);
});

test("moduleCoveredConceptKeys unions the module's lesson concepts", () => {
  const lessons = [
    lesson("a", [concept("c-querer", "querer"), concept(null, "Freehand One")]),
    lesson("b", [concept("c-poder", "poder")]),
    lesson("c", [concept("c-hablar", "hablar")]), // not in the module
  ];
  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const keys = moduleCoveredConceptKeys({ lessonIds: ["a", "b"] }, lessonById);

  assert.ok(keys.has("c-querer"));
  assert.ok(keys.has("c-poder"));
  assert.ok(keys.has("freehand one")); // freehand matches on lowercased label
  assert.ok(!keys.has("c-hablar"));

  assert.ok(keys.has(conceptKey(concept("c-querer", "querer"))));
  assert.ok(keys.has(conceptKey(concept(null, "  FREEHAND one "))));
});

test("isLessonFile enforces the ordering invariant", () => {
  assert.ok(isLessonFile(fileWith([["a", "b"], ["c"]], ["a", "b", "c"])));
  // lessons out of module order
  assert.equal(
    isLessonFile(fileWith([["a", "b"], ["c"]], ["b", "a", "c"])),
    false,
  );
  // extra lesson not in any module
  assert.equal(isLessonFile(fileWith([["a"]], ["a", "b"])), false);
  // duplicate lessonId across modules
  assert.equal(isLessonFile(fileWith([["a"], ["a"]], ["a"])), false);
});

test("reconcileLessonFile sorts lessons, drops danglers, re-homes orphans", () => {
  const messy: LessonFile = {
    ...fileWith([["c", "ghost", "a"], ["b"]], ["a", "b", "c", "orphan"]),
  };
  const clean = reconcileLessonFile(messy);
  assert.deepEqual(clean.modules[0].lessonIds, ["c", "a"]); // ghost dropped
  assert.deepEqual(clean.modules[1].lessonIds, ["b", "orphan"]); // orphan -> last
  assert.deepEqual(
    clean.lessons.map((l) => l.id),
    ["c", "a", "b", "orphan"],
  );
  assert.ok(isLessonFile(clean));
});

test("reconcileLessonFile de-dupes a lessonId listed twice", () => {
  const clean = reconcileLessonFile(fileWith([["a", "a", "b"]], ["a", "b"]));
  assert.deepEqual(clean.modules[0].lessonIds, ["a", "b"]);
});

test("moduleContainingLesson", () => {
  const file = fileWith([["a", "b"], ["c"]], ["a", "b", "c"]);
  assert.equal(moduleContainingLesson(file, "b")?.id, "m1");
  assert.equal(moduleContainingLesson(file, "c")?.id, "m2");
  assert.equal(moduleContainingLesson(file, "z"), undefined);
});
