import assert from "node:assert/strict";
import test from "node:test";

import type { Lesson } from "../../src/lib/lesson-builder/types";
import {
  buildLessonPreview,
  capturePreviewOrigin,
  restorePreviewOrigin,
  schedulePreviewOriginReturn,
  type LessonPreviewPlatform,
} from "../../src/lib/lesson-builder/use-lesson-preview";

function previewLessons(): Lesson[] {
  return [
    { id: "lesson_a", name: "First", concepts: [], blocks: [] },
    {
      id: "lesson_b",
      name: "Second",
      concepts: [],
      blocks: [
        { id: "explanation", type: "explanation", contentMarkdown: "Why" },
        {
          id: "sentence",
          type: "sentence",
          promptLabel: "",
          promptText: "",
          helperText: "",
          answerFeedback: null,
          languageBlocks: [],
        },
      ],
    },
  ];
}

function fakePlatform(
  calls: string[],
  element: HTMLElement | null,
  range: Range | null = null,
): LessonPreviewPlatform {
  return {
    activeElement: () => element,
    inputSelection: () => [3, 7],
    editableRange: () => range,
    scrollY: () => 480,
    requestFrame: (callback) => callback(),
    scrollTo: (top) => calls.push(`scroll:${top}`),
    contains: () => true,
    focus: () => calls.push("focus"),
    setInputSelection: (_target, selection) =>
      calls.push(`input:${selection.join("-")}`),
    restoreRange: () => calls.push("range"),
  };
}

test("preview keeps the lesson's course number, blocks, and learner shape", () => {
  const lessons = previewLessons();
  const preview = buildLessonPreview(lessons, "lesson_b");

  assert.deepEqual(preview, {
    id: "lesson_b",
    lessonNumber: 2,
    name: "Second",
    explanationCount: 1,
    practiceCount: 1,
    previewText: "",
    concepts: [],
    blocks: lessons[1].blocks,
  });
  assert.equal(buildLessonPreview(lessons, "missing"), null);
  assert.equal(buildLessonPreview(lessons, null), null);
});

test("preview origin capture and return restore scroll, focus, and input selection", () => {
  const calls: string[] = [];
  const element = {} as HTMLElement;
  const platform = fakePlatform(calls, element);

  const origin = capturePreviewOrigin(platform);
  assert.deepEqual(origin, {
    element,
    inputSelection: [3, 7],
    range: null,
    scrollY: 480,
  });

  restorePreviewOrigin(origin, platform);
  assert.deepEqual(calls, ["scroll:480", "focus", "input:3-7"]);
});

test("preview return restores an editable range when no input selection exists", () => {
  const calls: string[] = [];
  const element = {} as HTMLElement;
  const range = {} as Range;
  const platform = fakePlatform(calls, element, range);
  platform.inputSelection = () => null;

  const origin = capturePreviewOrigin(platform);
  restorePreviewOrigin(origin, platform);

  assert.deepEqual(calls, ["scroll:480", "focus", "range"]);
});

test("preview return preserves scroll but skips a detached origin element", () => {
  const calls: string[] = [];
  const element = {} as HTMLElement;
  const platform = fakePlatform(calls, element);
  platform.contains = () => false;

  restorePreviewOrigin(capturePreviewOrigin(platform), platform);

  assert.deepEqual(calls, ["scroll:480"]);
});

test("preview return waits for the next frame before consuming its origin", () => {
  const calls: string[] = [];
  const element = {} as HTMLElement;
  const platform = fakePlatform(calls, element);
  let nextFrame: (() => void) | null = null;
  platform.requestFrame = (callback) => {
    nextFrame = callback;
  };
  const originRef = { current: capturePreviewOrigin(platform) };

  schedulePreviewOriginReturn(originRef, platform);
  assert.deepEqual(calls, []);
  assert.notEqual(originRef.current, null);

  assert.ok(nextFrame);
  (nextFrame as () => void)();
  assert.equal(originRef.current, null);
  assert.deepEqual(calls, ["scroll:480", "focus", "input:3-7"]);
});
