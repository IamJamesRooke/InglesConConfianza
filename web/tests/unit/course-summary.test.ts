import assert from "node:assert/strict";
import test from "node:test";

import {
  findOnboardingModule,
  hasPublishedOnboarding,
  summarizeCourse,
} from "../../src/lib/lesson-builder/course-summary-core";
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

function fileWithOnboarding(): LessonFile {
  return {
    version: 2,
    modules: [
      {
        id: "welcome",
        name: "Onboarding",
        kind: "onboarding",
        lessonIds: ["ob-1", "ob-2"],
      },
      { id: "m1", name: "Confianza I", lessonIds: ["c1", "c2"] },
    ],
    lessons: [
      { id: "ob-1", name: "Hola", concepts: [], blocks: [{ id: "b1", type: "explanation", contentMarkdown: "hi" }] },
      { id: "ob-2", name: "Mi nombre", concepts: [], blocks: [{ id: "b2", type: "explanation", contentMarkdown: "hi" }] },
      { id: "c1", name: "Lesson 1", concepts: [], blocks: [{ id: "b3", type: "explanation", contentMarkdown: "hi" }] },
      { id: "c2", name: "Lesson 2", concepts: [], blocks: [{ id: "b4", type: "explanation", contentMarkdown: "hi" }] },
    ],
  };
}

test("summarizeCourse: learner-facing lesson numbers skip the onboarding module", () => {
  const course = summarizeCourse(fileWithOnboarding());
  const byId = new Map(course.lessons.map((l) => [l.id, l.lessonNumber]));
  assert.equal(byId.get("ob-1"), 0);
  assert.equal(byId.get("ob-2"), 0);
  assert.equal(byId.get("c1"), 1);
  assert.equal(byId.get("c2"), 2);
});

test("hasPublishedOnboarding: true only for a published module with a published, non-empty lesson", () => {
  assert.equal(hasPublishedOnboarding(fileWithOnboarding()), true);

  const noOnboarding = fileWithOnboarding();
  noOnboarding.modules = noOnboarding.modules.filter((m) => m.kind !== "onboarding");
  assert.equal(hasPublishedOnboarding(noOnboarding), false);

  const draftModule = fileWithOnboarding();
  draftModule.modules[0].status = "draft";
  assert.equal(hasPublishedOnboarding(draftModule), false);

  const allLessonsDraftOrEmpty = fileWithOnboarding();
  allLessonsDraftOrEmpty.lessons[0].status = "draft";
  allLessonsDraftOrEmpty.lessons[1].blocks = [];
  assert.equal(hasPublishedOnboarding(allLessonsDraftOrEmpty), false);

  const oneUsableLesson = fileWithOnboarding();
  oneUsableLesson.lessons[0].status = "draft";
  assert.equal(hasPublishedOnboarding(oneUsableLesson), true);
});

test("findOnboardingModule returns the onboarding module or undefined", () => {
  assert.equal(findOnboardingModule(fileWithOnboarding())?.id, "welcome");
  const none = fileWithOnboarding();
  none.modules = none.modules.filter((m) => m.kind !== "onboarding");
  assert.equal(findOnboardingModule(none), undefined);
});
