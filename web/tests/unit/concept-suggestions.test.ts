import assert from "node:assert/strict";
import test from "node:test";

import {
  conceptPriority,
  extractLessonPairTerms,
  matchPairTermsToConcepts,
  suggestConceptsForLesson,
  type PairMatchCandidate,
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

// --- Auto-Covers (E5): extractLessonPairTerms + matchPairTermsToConcepts.

test("extractLessonPairTerms pulls Spanish text, English answers, and language marks", () => {
  const withPairs: Lesson = {
    id: "l1",
    name: "l1",
    concepts: [],
    blocks: [
      {
        id: "b1",
        type: "explanation",
        contentMarkdown: "Say [[es:hoy]] to mean [[en:today]].",
      },
      {
        id: "b2",
        type: "sentence",
        promptLabel: "",
        promptText: "",
        helperText: "",
        answerFeedback: null,
        languageBlocks: [
          {
            id: "p1",
            spanish: "¿Quieres?",
            callout: null,
            acceptedAnswers: ["Do you want?", "you want"],
          },
        ],
      },
    ],
  };

  assert.deepEqual(extractLessonPairTerms(withPairs), [
    "hoy",
    "today",
    "Quieres",
    "Do you want",
    "you want",
  ]);
});

test("extractLessonPairTerms drops empties/short fragments and dedupes case-insensitively", () => {
  const lesson: Lesson = {
    id: "l1",
    name: "l1",
    concepts: [],
    blocks: [
      {
        id: "b1",
        type: "sentence",
        promptLabel: "",
        promptText: "",
        helperText: "",
        answerFeedback: null,
        languageBlocks: [
          { id: "p1", spanish: "hoy", callout: null, acceptedAnswers: ["today", "a"] },
          { id: "p2", spanish: "Hoy", callout: null, acceptedAnswers: ["Today"] },
        ],
      },
    ],
  };

  assert.deepEqual(extractLessonPairTerms(lesson), ["hoy", "today"]);
});

function candidate(
  id: string,
  spanish: string,
  english: string,
  role = "P1",
): PairMatchCandidate {
  return { id, spanish, english, role };
}

test("matchPairTermsToConcepts prefers an exact match over a prefix match", () => {
  const candidates = [
    candidate("c-hoy", "hoy", "today"),
    candidate("c-hoy-mismo", "hoy mismo", "this very day"),
  ];

  assert.deepEqual(
    matchPairTermsToConcepts(["hoy", "hoy mis"], candidates),
    [
      { term: "hoy", concept: candidates[0] },
      { term: "hoy mis", concept: candidates[1] },
    ],
  );
});

test("matchPairTermsToConcepts is accent- and case-insensitive and strips bracket placeholders", () => {
  const candidates = [candidate("c-querer", "querer [algo]", "to want [something]")];

  assert.deepEqual(matchPairTermsToConcepts(["QUERER"], candidates), [
    { term: "QUERER", concept: candidates[0] },
  ]);
  assert.deepEqual(matchPairTermsToConcepts(["to want"], candidates), [
    { term: "to want", concept: candidates[0] },
  ]);
});

test("matchPairTermsToConcepts skips terms with no exact/prefix match", () => {
  const candidates = [candidate("c-hoy", "hoy", "today")];
  assert.deepEqual(matchPairTermsToConcepts(["mañana"], candidates), []);
});

test("matchPairTermsToConcepts breaks a tie between equally-tiered candidates by priority", () => {
  const candidates = [
    candidate("c-low", "con", "with", "P5"),
    candidate("c-high", "con", "along with", "P1"),
  ];
  const [match] = matchPairTermsToConcepts(["con"], candidates);
  assert.equal(match.concept.id, "c-high");
});
