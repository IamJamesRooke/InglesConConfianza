import assert from "node:assert/strict";
import test from "node:test";

import { summarizeCourse } from "../../src/lib/lesson-builder/course-summary-core";
import type { LessonFile } from "../../src/lib/lesson-builder/types";

function baseFile(): LessonFile {
  return {
    version: 2,
    modules: [
      {
        id: "m-published",
        name: "Confianza I",
        description: "Al terminar puedes decir lo que quieres.",
        lessonIds: ["l-published", "l-draft"],
      },
      {
        id: "m-draft",
        name: "Confianza III",
        status: "draft",
        lessonIds: ["l-in-draft-module"],
      },
    ],
    lessons: [
      { id: "l-published", name: "Published lesson", concepts: [], blocks: [] },
      { id: "l-draft", name: "Draft lesson", status: "draft", concepts: [], blocks: [] },
      {
        id: "l-in-draft-module",
        name: "Lesson in a draft module",
        concepts: [],
        blocks: [],
      },
    ],
  };
}

test("summarizeCourse hides a draft module entirely and passes through its description", () => {
  const course = summarizeCourse(baseFile());
  assert.deepEqual(
    course.modules.map((m) => m.id),
    ["m-published"],
  );
  assert.equal(course.modules[0].description, "Al terminar puedes decir lo que quieres.");
});

test("summarizeCourse hides a draft lesson inside a published module", () => {
  const course = summarizeCourse(baseFile());
  const published = course.modules.find((m) => m.id === "m-published")!;
  assert.deepEqual(
    published.lessons.map((l) => l.id),
    ["l-published"],
  );
  assert.deepEqual(
    course.lessons.map((l) => l.id),
    ["l-published"],
  );
});

test("summarizeCourse leaves a fully-published course untouched", () => {
  const file = baseFile();
  file.modules = [{ ...file.modules[0], lessonIds: ["l-published"] }];
  file.lessons = [file.lessons[0]];
  const course = summarizeCourse(file);
  assert.equal(course.modules.length, 1);
  assert.equal(course.lessons.length, 1);
});

test("summarizeCourse: module with no description reports null", () => {
  const file = baseFile();
  file.modules = [
    { ...file.modules[0], description: undefined, lessonIds: ["l-published"] },
  ];
  file.lessons = [file.lessons[0]];
  const course = summarizeCourse(file);
  assert.equal(course.modules[0].description, null);
});
