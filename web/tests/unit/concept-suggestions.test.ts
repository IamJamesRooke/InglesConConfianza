import assert from "node:assert/strict";
import test from "node:test";

import {
  conceptPriority,
  suggestConceptsForLesson,
} from "../../src/lib/lesson-builder/concept-suggestions";
import type { Lesson, LessonConcept } from "../../src/lib/lesson-builder/types";

function concept(id: string | null): LessonConcept {
  return { id: `lesson-${id ?? "freehand"}`, conceptId: id, label: id ?? "note" };
}

function lesson(id: string, conceptIds: Array<string | null>): Lesson {
  return {
    id,
    name: id,
    concepts: conceptIds.map(concept),
    blocks: [],
  };
}

const displays = {
  core: { spanish: "núcleo", english: "core", role: "P1" },
  support: {
    spanish: "apoyo",
    english: "support",
    role: "P3",
  },
  reference: {
    spanish: "referencia",
    english: "reference",
    role: "P5",
  },
  trash: { spanish: "basura", english: "trash", role: "Trash" },
};

test("suggestions rank cold concepts from their latest earlier appearance", () => {
  const lessons = [
    lesson("one", ["core", "support", "trash", null]),
    lesson("two", ["core", "reference"]),
    lesson("three", ["reference"]),
    lesson("target", ["reference"]),
  ];

  assert.deepEqual(
    suggestConceptsForLesson({ lessons, lessonId: "target", conceptDisplays: displays }),
    [
      {
        conceptId: "support",
        ...displays.support,
        lessonGap: 3,
        priorityBand: "medium",
      },
      {
        conceptId: "core",
        ...displays.core,
        lessonGap: 2,
        priorityBand: "high",
      },
    ],
  );
});

test("suggestions respond only to the supplied current lesson order", () => {
  const target = lesson("target", []);
  const old = lesson("old", ["support"]);
  const recent = lesson("recent", ["core"]);

  assert.deepEqual(
    suggestConceptsForLesson({
      lessons: [old, recent, target],
      lessonId: "target",
      conceptDisplays: displays,
    }).map(({ conceptId, lessonGap }) => [conceptId, lessonGap]),
    [
      ["support", 2],
      ["core", 1],
    ],
  );

  assert.deepEqual(
    suggestConceptsForLesson({
      lessons: [recent, old, target],
      lessonId: "target",
      conceptDisplays: displays,
    }).map(({ conceptId, lessonGap }) => [conceptId, lessonGap]),
    [
      ["core", 2],
      ["support", 1],
    ],
  );
});

test("priority bands follow canonical role order with a neutral fallback", () => {
  assert.equal(conceptPriority("P1").band, "high");
  assert.equal(conceptPriority("P3").band, "medium");
  assert.equal(conceptPriority("P5").band, "low");
  assert.equal(conceptPriority("future-tier").band, "neutral");
});
