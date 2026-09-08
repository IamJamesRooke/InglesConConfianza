import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { parseLessonFile } from "../../src/lib/lesson-builder/lesson-file";

const course = parseLessonFile(
  JSON.parse(
    readFileSync(new URL("../../data/lessons.json", import.meta.url), "utf8"),
  ),
);

function collectIds(value: unknown, ids: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectIds(item, ids);
    return ids;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "id" && typeof child === "string") ids.push(child);
      collectIds(child, ids);
    }
  }
  return ids;
}

test("the hand-authored course has consistent lesson membership", () => {
  const orderedLessonIds = course.modules.flatMap((module) => module.lessonIds);
  assert.deepEqual(
    [...orderedLessonIds].sort(),
    course.lessons.map((lesson) => lesson.id).sort(),
  );
  assert.equal(new Set(orderedLessonIds).size, orderedLessonIds.length);
});

test("all authored course ids are unique", () => {
  const ids = collectIds(course);
  assert.equal(new Set(ids).size, ids.length);
});
