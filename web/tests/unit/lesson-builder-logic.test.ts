import assert from "node:assert/strict";
import test from "node:test";

import * as m from "../../src/lib/lesson-builder/mutations";
import { lessonsReducer } from "../../src/lib/lesson-builder/reducer";
import {
  conceptKey,
  moduleContainingLesson,
  moduleCoveredConceptKeys,
  normalizeModule,
  parseLessonFile,
  reconcileLessonFile,
} from "../../src/lib/lesson-builder/lesson-file";
import {
  getAnswerValidationMessage,
  getSentenceValidationIssueCount,
  normalizeAnswer,
  normalizeLessons,
} from "../../src/lib/lesson-builder/utils";
import type {
  Lesson,
  LessonFile,
  SentenceBlock,
} from "../../src/lib/lesson-builder/types";

// --- test data -----------------------------------------------------------

function lang(id: string, over: Partial<SentenceBlock["languageBlocks"][number]> = {}) {
  return {
    id,
    spanish: "hola",
    callout: null,
    acceptedAnswers: ["hi"],
    ...over,
  };
}

function sentence(id: string, langIds: string[] = ["l1"]): SentenceBlock {
  return {
    id,
    type: "sentence",
    promptLabel: "",
    promptText: "",
    helperText: "",
    answerFeedback: null,
    languageBlocks: langIds.map((lid) => lang(lid)),
  };
}

function lesson(id: string, blocks: Lesson["blocks"] = []): Lesson {
  return { id, name: null, concepts: [], blocks };
}

// --- reorder semantics (via the three public movers) --------------------

test("reorder is a no-op when either id is absent", () => {
  const lessons = ["a", "b"].map((id) => lesson(id));
  assert.deepEqual(
    m.moveLesson(lessons, { draggedId: "a", targetId: "zzz", position: "after" }),
    lessons,
  );
  assert.deepEqual(
    m.moveLesson(lessons, { draggedId: "zzz", targetId: "a", position: "before" }),
    lessons,
  );
});

test("reorder before/after adjusts for the removed dragged item", () => {
  const ids = () => ["a", "b", "c", "d"].map((id) => lesson(id));
  // drag a downward, drop after c -> b c a d
  assert.deepEqual(
    m.moveLesson(ids(), { draggedId: "a", targetId: "c", position: "after" }).map((l) => l.id),
    ["b", "c", "a", "d"],
  );
  // drag a downward, drop before c -> b a c d
  assert.deepEqual(
    m.moveLesson(ids(), { draggedId: "a", targetId: "c", position: "before" }).map((l) => l.id),
    ["b", "a", "c", "d"],
  );
  // drag d upward, drop before b -> a d b c
  assert.deepEqual(
    m.moveLesson(ids(), { draggedId: "d", targetId: "b", position: "before" }).map((l) => l.id),
    ["a", "d", "b", "c"],
  );
  // NB: a self-target is not inert at this layer ("after" nudges it down one) —
  // the drag hook is what suppresses a dropTarget when dragged.id === target.id.
  assert.deepEqual(
    m.moveLesson(ids(), { draggedId: "b", targetId: "b", position: "after" }).map((l) => l.id),
    ["a", "c", "b", "d"],
  );
});

test("moveContentBlock / moveLanguageBlock reorder only within their parent", () => {
  const lessons = [
    lesson("L", [sentence("s1"), sentence("s2"), sentence("s3")]),
    lesson("other", [sentence("s1")]),
  ];
  const moved = m.moveContentBlock(lessons, "L", {
    draggedId: "s3",
    targetId: "s1",
    position: "before",
  });
  assert.deepEqual(moved[0].blocks.map((b) => b.id), ["s3", "s1", "s2"]);
  assert.deepEqual(moved[1].blocks.map((b) => b.id), ["s1"], "other lesson untouched");

  const lessons2 = [lesson("L", [sentence("s1", ["l1", "l2", "l3"])])];
  const langMoved = m.moveLanguageBlock(lessons2, "L", "s1", {
    draggedId: "l1",
    targetId: "l3",
    position: "after",
  });
  assert.deepEqual(
    (langMoved[0].blocks[0] as SentenceBlock).languageBlocks.map((l) => l.id),
    ["l2", "l3", "l1"],
  );
});

// --- setLessonOrder ----------------------------------------------------

test("setLessonOrder keeps only listed ids, in listed order", () => {
  const lessons = ["a", "b", "c"].map((id) => lesson(id));
  assert.deepEqual(
    m.setLessonOrder(lessons, ["c", "a"]).map((l) => l.id),
    ["c", "a"],
  );
  assert.deepEqual(
    m.setLessonOrder(lessons, ["c", "ghost", "b", "a"]).map((l) => l.id),
    ["c", "b", "a"],
  );
});

// --- block inserts / duplicate --------------------------------------------

test("addExplanationBlock inserts at the given index", () => {
  const lessons = [lesson("L", [sentence("s1"), sentence("s2")])];
  const next = m.addExplanationBlock(lessons, "L", 1, "e1");
  assert.deepEqual(next[0].blocks.map((b) => b.id), ["s1", "e1", "s2"]);
  assert.equal(next[0].blocks[1].type, "explanation");
});

test("duplicateContentBlock places the copy right after the source with a fresh id", () => {
  const lessons = [lesson("L", [
    { id: "e1", type: "explanation", contentMarkdown: "hi" },
    sentence("s1"),
  ])];
  const next = m.duplicateContentBlock(lessons, "L", "e1");
  assert.deepEqual(next[0].blocks.map((b) => b.type), ["explanation", "explanation", "sentence"]);
  assert.notEqual(next[0].blocks[0].id, next[0].blocks[1].id);
  assert.equal(
    (next[0].blocks[1] as { contentMarkdown: string }).contentMarkdown,
    "hi",
  );
});

test("duplicateContentBlock is a no-op for an unknown block id", () => {
  const lessons = [lesson("L", [sentence("s1")])];
  assert.deepEqual(m.duplicateContentBlock(lessons, "L", "nope"), lessons);
});

test("updateLanguageBlock patches spanish and callout", () => {
  const lessons = [lesson("L", [sentence("s1", ["l1"])])];
  const next = m.updateLanguageBlock(lessons, "L", "s1", "l1", {
    spanish: "adiós",
    callout: "note",
  });
  const lb = (next[0].blocks[0] as SentenceBlock).languageBlocks[0];
  assert.equal(lb.spanish, "adiós");
  assert.equal(lb.callout, "note");
});

// --- reducer coverage for the block-level actions ---------------------

test("reducer routes block-level actions to their mutation", () => {
  let lessons: Lesson[] = [lesson("L", [sentence("s1", ["l1"])])];
  lessons = lessonsReducer(lessons, {
    type: "ADD_LANGUAGE_BLOCK",
    lessonId: "L",
    sentenceBlockId: "s1",
    languageBlockId: "l2",
  });
  assert.equal((lessons[0].blocks[0] as SentenceBlock).languageBlocks.length, 2);

  lessons = lessonsReducer(lessons, {
    type: "MOVE_CONTENT_BLOCK",
    lessonId: "L",
    draggedId: "s1",
    targetId: "s1",
    position: "after",
  });
  assert.equal(lessons[0].blocks.length, 1);

  lessons = lessonsReducer(lessons, {
    type: "SET_LESSON_ORDER",
    lessonIds: ["L"],
  });
  assert.deepEqual(lessons.map((l) => l.id), ["L"]);
});

// --- answer validation ------------------------------------------------

test("normalizeAnswer trims and collapses whitespace", () => {
  assert.equal(normalizeAnswer("  I   want  to "), "I want to");
});

test("getAnswerValidationMessage flags empty primary, empty alt, and duplicates", () => {
  assert.match(getAnswerValidationMessage([""], 0) ?? "", /required/i);
  assert.match(getAnswerValidationMessage(["ok", ""], 1) ?? "", /Complete or remove/i);
  assert.equal(getAnswerValidationMessage(["ok", "extra"], 1), null);
  assert.match(
    getAnswerValidationMessage(["same", "same"], 1) ?? "",
    /duplicated/i,
  );
  // whitespace-only counts as empty
  assert.match(getAnswerValidationMessage(["   "], 0) ?? "", /required/i);
});

test("getSentenceValidationIssueCount sums missing spanish + answer problems", () => {
  assert.equal(
    getSentenceValidationIssueCount(sentence("s", [])),
    1,
    "a sentence with no language blocks is one issue",
  );
  const clean = sentence("s", ["l1"]);
  assert.equal(getSentenceValidationIssueCount(clean), 0);
  const broken: SentenceBlock = {
    ...sentence("s"),
    languageBlocks: [
      lang("l1", { spanish: "  ", acceptedAnswers: ["dup", "dup"] }),
    ],
  };
  // 1 for blank spanish + 2 for the duplicated pair
  assert.equal(getSentenceValidationIssueCount(broken), 3);
});

// --- normalizeLessons -----------------------------------------------------

test("normalizeLessons backfills missing arrays and leaves explanation blocks", () => {
  const raw = [
    {
      id: "L",
      name: null,
      blocks: [
        { id: "e1", type: "explanation", contentMarkdown: "x" },
        {
          id: "s1",
          type: "sentence",
          promptLabel: "",
          promptText: "",
          helperText: "",
          answerFeedback: null,
          conceptLinks: [
            {
              id: "legacy-cl",
              label: "legacy",
              type: "mapping",
              direction: "es_to_en",
              sourceText: "",
              targetText: "",
              contextLabel: "",
              role: "introduced",
            },
          ],
          languageBlocks: [
            {
              id: "l1",
              spanish: "",
              callout: null,
              acceptedAnswers: [""],
              conceptLinks: [
                {
                  id: "legacy-lang-cl",
                  label: "legacy",
                  type: "mapping",
                  direction: "es_to_en",
                  sourceText: "",
                  targetText: "",
                  contextLabel: "",
                  role: "introduced",
                },
              ],
            },
          ],
        },
      ],
    },
  ] as unknown as Lesson[];
  const [out] = normalizeLessons(raw);
  assert.deepEqual(out.concepts, []);
  assert.equal(out.blocks[0].type, "explanation");
  const s = out.blocks[1] as SentenceBlock;
  assert.ok(!("conceptLinks" in s));
  assert.ok(!("conceptLinks" in s.languageBlocks[0]));
});

// --- module / lesson-file helpers --------------------------------------

function fileWith(moduleLessonIds: string[][], lessonIds: string[]): LessonFile {
  return {
    version: 2,
    modules: moduleLessonIds.map((ids, i) => ({
      id: `m${i + 1}`,
      name: `Module ${i + 1}`,
      keyConcepts: [],
      lessonIds: ids,
    })),
    lessons: lessonIds.map((id) => lesson(id)),
  };
}

test("reconcileLessonFile rehomes an orphan lesson into the last module", () => {
  const messy = fileWith([["a"], ["b"]], ["a", "b", "orphan"]);
  const clean = reconcileLessonFile(messy);
  assert.deepEqual(clean.modules[1].lessonIds, ["b", "orphan"]);
  assert.deepEqual(clean.lessons.map((l) => l.id), ["a", "b", "orphan"]);
});

test("reconcileLessonFile keeps an empty middle module", () => {
  const clean = reconcileLessonFile(fileWith([["a"], [], ["b"]], ["a", "b"]));
  assert.deepEqual(clean.modules.map((mod) => mod.lessonIds), [["a"], [], ["b"]]);
});

test("moduleContainingLesson finds the owning module or undefined", () => {
  const file = fileWith([["a", "b"], ["c"]], ["a", "b", "c"]);
  assert.equal(moduleContainingLesson(file, "c")?.id, "m2");
  assert.equal(moduleContainingLesson(file, "ghost"), undefined);
});

test("normalizeModule fills keyConcepts and drops legacy fields", () => {
  const legacy = {
    id: "m1",
    name: "M",
    promise: "old",
    finalSentence: { spanish: "s", english: "e" },
    lessonIds: ["a"],
  } as never;
  const norm = normalizeModule(legacy);
  assert.deepEqual(norm.keyConcepts, []);
  assert.ok(!("promise" in norm));
  assert.ok(!("finalSentence" in norm));
});

test("conceptKey: id when linked, lowercased trimmed label otherwise", () => {
  assert.equal(conceptKey({ conceptId: "c1", label: "Querer" }), "c1");
  assert.equal(conceptKey({ conceptId: null, label: "  Salsa Dancing " }), "salsa dancing");
});

test("moduleCoveredConceptKeys only counts lessons in the module", () => {
  const lessons: Lesson[] = [
    { ...lesson("a"), concepts: [{ id: "x", conceptId: "c-q", label: "querer" }] },
    { ...lesson("b"), concepts: [{ id: "y", conceptId: null, label: "Freehand" }] },
    { ...lesson("c"), concepts: [{ id: "z", conceptId: "c-h", label: "hablar" }] },
  ];
  const byId = new Map(lessons.map((l) => [l.id, l]));
  const keys = moduleCoveredConceptKeys({ lessonIds: ["a", "b"] }, byId);
  assert.deepEqual([...keys].sort(), ["c-q", "freehand"]);
});

test("parseLessonFile round-trips a v2 file and normalizes its modules", () => {
  const parsed = parseLessonFile(fileWith([["a"]], ["a"]));
  assert.equal(parsed.version, 2);
  assert.deepEqual(parsed.modules[0].keyConcepts, []);
});
