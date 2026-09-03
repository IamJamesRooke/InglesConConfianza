import assert from "node:assert/strict";
import test from "node:test";

import {
  isLessonFile,
  migrateV1ToV2,
  parseLessonFile,
  reconcileLessonFile,
  moduleContainingLesson,
} from "../../src/lib/lesson-builder/lesson-file";
import type { Lesson, LessonFile } from "../../src/lib/lesson-builder/types";

function lesson(id: string): Lesson {
  return { id, name: null, concepts: [], blocks: [] };
}

function fileWith(moduleLessonIds: string[][], lessons: string[]): LessonFile {
  return {
    version: 2,
    modules: moduleLessonIds.map((lessonIds, index) => ({
      id: `m${index + 1}`,
      name: `Module ${index + 1}`,
      promise: "",
      finalSentence: { spanish: "", english: "" },
      lessonIds,
    })),
    lessons: lessons.map(lesson),
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
  assert.equal(parseLessonFile(v2), v2);
  assert.throws(() => parseLessonFile({ version: 3 }));
  assert.throws(() => parseLessonFile("nope"));
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
