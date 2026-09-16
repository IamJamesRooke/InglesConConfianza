import assert from "node:assert/strict";
import test from "node:test";

import {
  buildImportDiff,
  validateImportedFile,
} from "../../src/lib/lesson-builder/import-export";
import type { Lesson, LessonFile } from "../../src/lib/lesson-builder/types";

function lesson(id: string, name: string | null = null): Lesson {
  return { id, name, concepts: [], blocks: [] };
}

function fileWith(moduleLessonIds: string[][], lessonIds: string[]): LessonFile {
  return {
    version: 2,
    modules: moduleLessonIds.map((lessonIds2, index) => ({
      id: `m${index + 1}`,
      name: `Module ${index + 1}`,
      lessonIds: lessonIds2,
    })),
    lessons: lessonIds.map((id) => lesson(id)),
  };
}

test("buildImportDiff: added/removed/changed modules and lessons", () => {
  const current = fileWith([["a", "b"]], ["a", "b"]);
  const incoming: LessonFile = {
    version: 2,
    modules: [
      { id: "m1", name: "Module 1 renamed", lessonIds: ["a", "b"] },
      { id: "m2", name: "New module", lessonIds: ["c"] },
    ],
    lessons: [lesson("a"), lesson("b", "renamed"), lesson("c")],
  };
  const diff = buildImportDiff(current, incoming);
  assert.deepEqual(diff.modulesAdded, ["New module"]);
  assert.deepEqual(diff.modulesRemoved, []);
  assert.deepEqual(diff.modulesChanged, ["Module 1 renamed"]);
  assert.deepEqual(diff.lessonsAdded, ["c"]);
  assert.deepEqual(diff.lessonsChanged, ["renamed"]);
  assert.deepEqual(diff.lessonsRemoved, []);
});

test("buildImportDiff: removed module/lesson", () => {
  const current = fileWith([["a"], ["b"]], ["a", "b"]);
  const incoming = fileWith([["a"]], ["a"]);
  const diff = buildImportDiff(current, incoming);
  assert.deepEqual(diff.modulesRemoved, ["Module 2"]);
  assert.deepEqual(diff.lessonsRemoved, ["b"]);
});

test("buildImportDiff: no changes -> every list empty", () => {
  const file = fileWith([["a"]], ["a"]);
  const diff = buildImportDiff(file, file);
  assert.deepEqual(diff, {
    modulesAdded: [],
    modulesRemoved: [],
    modulesChanged: [],
    lessonsAdded: [],
    lessonsRemoved: [],
    lessonsChanged: [],
  });
});

test("validateImportedFile: rejects malformed input without throwing", () => {
  const result = validateImportedFile({ not: "a lesson file" });
  assert.ok("error" in result);
});

test("validateImportedFile: rejects junk types (string, null, array)", () => {
  assert.ok("error" in validateImportedFile("nope"));
  assert.ok("error" in validateImportedFile(null));
  assert.ok("error" in validateImportedFile([1, 2, 3]));
});

test("validateImportedFile: accepts a well-formed v2 file and normalizes it (syllabus defaulted)", () => {
  const file = fileWith([["a", "b"]], ["a", "b"]);
  const result = validateImportedFile(file);
  assert.ok("file" in result);
  if ("file" in result) {
    assert.deepEqual(result.file.modules[0].lessonIds, ["a", "b"]);
    assert.deepEqual(result.file.modules[0].syllabus, { main: [], review: [] });
  }
});

test("round trip: module/lesson metadata fields all set survive export -> import unchanged", () => {
  const file: LessonFile = {
    version: 2,
    modules: [
      {
        id: "m1",
        name: "Confianza I",
        description: "Al terminar puedes decir lo que quieres.",
        status: "draft",
        access: "premium",
        lessonIds: ["a"],
      },
    ],
    lessons: [
      {
        id: "a",
        name: "Lesson one",
        status: "draft",
        notes: "Fix the second slide.",
        concepts: [],
        blocks: [],
      },
    ],
  };
  const result = validateImportedFile(file);
  assert.ok("file" in result);
  if (!("file" in result)) return;
  assert.equal(
    result.file.modules[0].description,
    "Al terminar puedes decir lo que quieres.",
  );
  assert.equal(result.file.modules[0].status, "draft");
  assert.equal(result.file.modules[0].access, "premium");
  assert.equal(result.file.lessons[0].status, "draft");
  assert.equal(result.file.lessons[0].notes, "Fix the second slide.");
});

test("round trip: module/lesson metadata fields all absent import unchanged (no keys added)", () => {
  const file = fileWith([["a"]], ["a"]);
  const result = validateImportedFile(file);
  assert.ok("file" in result);
  if (!("file" in result)) return;
  const importedModule = result.file.modules[0];
  assert.equal(importedModule.description, undefined);
  assert.equal(importedModule.status, undefined);
  assert.equal(importedModule.access, undefined);
  const importedLesson = result.file.lessons[0];
  assert.equal(importedLesson.status, undefined);
  assert.equal(importedLesson.notes, undefined);
});
