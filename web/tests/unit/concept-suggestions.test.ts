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

test("extractLessonPairTerms pulls Spanish text and English answers from pairs only, never explanation prose", () => {
  const withPairs: Lesson = {
    id: "l1",
    name: "l1",
    concepts: [],
    blocks: [
      {
        id: "b1",
        type: "explanation",
        contentMarkdown: "Say [[es:hoy]] to mean [[en:today]]. I mean, anything works.",
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

  assert.deepEqual(extractLessonPairTerms(withPairs), ["Quieres", "Do you want", "you want"]);
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

test("matchPairTermsToConcepts requires whole-term equality, not a prefix or substring", () => {
  const candidates = [
    candidate("c-hoy", "hoy", "today"),
    candidate("c-hoy-mismo", "hoy mismo", "this very day"),
  ];

  // "hoy mis" is neither term nor concept text in full — no match, not a
  // prefix hit against "hoy mismo".
  assert.deepEqual(matchPairTermsToConcepts(["hoy", "hoy mis"], candidates), [
    { term: "hoy", concept: candidates[0] },
  ]);
});

test("matchPairTermsToConcepts is accent- and case-insensitive, strips bracket placeholders and punctuation", () => {
  const candidates = [candidate("c-querer", "querer [algo]", "to want [something]")];

  assert.deepEqual(matchPairTermsToConcepts(["QUERER"], candidates), [
    { term: "QUERER", concept: candidates[0] },
  ]);
  assert.deepEqual(matchPairTermsToConcepts(["¿to want?"], candidates), [
    { term: "¿to want?", concept: candidates[0] },
  ]);
});

test("matchPairTermsToConcepts skips terms with no whole-term or example match", () => {
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

// --- Owner report regression (2026-09-15): "I want to do something today."
// suggested "to have [something] repaired", "stuff", "anything", "I mean" —
// all substring/prefix hits on "something"/"algo"/"I". None of those may
// match now; only the terms the pairs actually name should surface.

test("owner-report lesson pairs match only their own concepts, never a loose substring hit", () => {
  const candidates = [
    candidate("c-querer", "querer [algo]", "to want [something]"),
    candidate("c-hacer", "hacer [algo]", "to do [something]"),
    candidate("c-algo", "algo", "something"),
    candidate("c-hoy", "hoy", "today"),
    // Loose substring/prefix traps the owner actually hit — none may match.
    candidate("c-repair", "reparar [algo]", "to have [something] repaired"),
    candidate("c-stuff", "cosas", "stuff"),
    candidate("c-anything", "cualquier cosa", "anything"),
    candidate("c-i-mean", "quiero decir", "I mean"),
  ];

  const terms = ["quiero", "I want", "hacer", "to do", "algo", "something", "hoy", "today"];
  const matches = matchPairTermsToConcepts(terms, candidates);
  const matchedIds = new Set(matches.map((match) => match.concept.id));

  assert.ok(matchedIds.has("c-hacer"));
  assert.ok(matchedIds.has("c-algo"));
  assert.ok(matchedIds.has("c-hoy"));
  for (const bad of ["c-repair", "c-stuff", "c-anything", "c-i-mean"]) {
    assert.equal(matchedIds.has(bad), false, `must not suggest ${bad}`);
  }
});

test("a conjugated 'I want' reaches the infinitive 'to want […]' concept by dropping the leading pronoun/to", () => {
  const candidates = [candidate("c-querer", "querer [algo]", "to want [something]")];
  assert.deepEqual(matchPairTermsToConcepts(["I want"], candidates), [
    { term: "I want", concept: candidates[0] },
  ]);
});

test("an example-sentence match exists only as a fallback and ranks below a direct match", () => {
  const direct = candidate("c-hoy", "hoy", "today");
  const viaExample: PairMatchCandidate = {
    id: "c-querer",
    spanish: "querer [algo]",
    english: "to want [something]",
    role: "P1",
    exampleSpanish: "Quiero un café.",
    exampleEnglish: "I want a coffee.",
  };

  // "quiero" is not the concept's own Spanish text ("querer") — it only
  // shows up in the example sentence, so it's a tier-2 fallback.
  const matches = matchPairTermsToConcepts(["hoy", "quiero"], [direct, viaExample]);
  assert.deepEqual(
    matches.map((match) => match.concept.id),
    ["c-hoy", "c-querer"],
  );
});

test("example-sentence matches are capped at 3 per lesson", () => {
  const withExample = (id: string, exampleSpanish: string): PairMatchCandidate => ({
    id,
    spanish: `concepto-${id}`,
    english: `concept ${id}`,
    role: "P1",
    exampleSpanish,
    exampleEnglish: "",
  });

  // Four terms, each a whole phrase in exactly one candidate's example only
  // (none is the candidate's own Spanish/English text) — all four clear only
  // the tier-2 example net.
  const candidates = [
    withExample("a", "Vamos a comprar pan hoy."),
    withExample("b", "Ella vive aqui siempre."),
    withExample("c", "Hoy no trabajo nunca."),
    withExample("d", "Hoy es un buen dia."),
  ];

  const matches = matchPairTermsToConcepts(["pan", "vive", "trabajo", "dia"], candidates);
  assert.equal(matches.length, 3);
});
