import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { parseLessonFile } from "../../src/lib/lesson-builder/lesson-file";
import type { LessonBlock } from "../../src/lib/lesson-builder/types";
import { normalizeAnswer } from "../../src/lib/lesson-builder/utils";

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

function isSentence(block: LessonBlock) {
  return block.type === "sentence";
}

test("presentation course has onboarding plus three complete modules", () => {
  assert.equal(course.modules.length, 4);
  assert.equal(course.modules[0].kind, "onboarding");
  assert.ok(course.modules.slice(1).every((module) => module.kind === "course"));
  assert.deepEqual(
    course.modules.map((module) => module.lessonIds.length),
    [3, 4, 5, 5],
  );
  assert.equal(course.lessons.length, 17);
  assert.ok(course.lessons.every((lesson) => lesson.blocks.length > 0));
});

test("every lesson ends in answerable sentence practice", () => {
  for (const lesson of course.lessons) {
    const practiceBlocks = lesson.blocks.filter(isSentence);
    assert.ok(practiceBlocks.length > 0, `${lesson.name} has practice`);
    assert.equal(
      lesson.blocks.at(-1)?.type,
      "sentence",
      `${lesson.name} ends with practice`,
    );

    for (const block of practiceBlocks) {
      assert.ok(block.languageBlocks.length > 0, `${lesson.name} has answer blocks`);
      for (const languageBlock of block.languageBlocks) {
        assert.ok(languageBlock.spanish.trim(), `${lesson.name} has Spanish text`);
        assert.ok(languageBlock.acceptedAnswers.length > 0);
        const normalized = languageBlock.acceptedAnswers.map(normalizeAnswer);
        assert.ok(normalized.every(Boolean), `${lesson.name} has no blank answer`);
        assert.equal(
          new Set(normalized).size,
          normalized.length,
          `${lesson.name} has no duplicate answer`,
        );
      }
    }
  }
});

test("all authored ids are unique", () => {
  const ids = collectIds(course);
  assert.equal(new Set(ids).size, ids.length);
});

test("onboarding is a real James introduction mini-lesson", () => {
  const onboardingLessons = course.modules[0].lessonIds.map((lessonId) =>
    course.lessons.find((lesson) => lesson.id === lessonId),
  );
  assert.deepEqual(
    onboardingLessons.map((lesson) => lesson?.name),
    [
      "Hello James!",
      "My name is James.",
      "Hello James, my name is Ana.",
    ],
  );
  assert.ok(
    onboardingLessons.every((lesson) =>
      lesson?.blocks.some((block) => block.type === "sentence"),
    ),
  );
});
