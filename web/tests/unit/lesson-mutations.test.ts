import assert from "node:assert/strict";
import test from "node:test";

import * as m from "../../src/lib/lesson-builder/mutations";
import { lessonsReducer } from "../../src/lib/lesson-builder/reducer";
import type { Lesson, SentenceBlock } from "../../src/lib/lesson-builder/types";

function sentenceBlock(overrides: Partial<SentenceBlock> = {}): SentenceBlock {
  return {
    id: "b1",
    type: "sentence",
    promptLabel: "",
    promptText: "",
    helperText: "",
    answerFeedback: null,
    conceptLinks: [],
    languageBlocks: [
      { id: "l1", spanish: "", callout: null, acceptedAnswers: [""], conceptLinks: [] },
    ],
    ...overrides,
  };
}

function baseLessons(): Lesson[] {
  return [
    { id: "lesson_a", name: "A", blocks: [sentenceBlock()] },
    { id: "lesson_b", name: null, blocks: [] },
  ];
}

test("mutations return new arrays and never mutate the input", () => {
  const lessons = baseLessons();
  const snapshot = JSON.stringify(lessons);
  m.renameLesson(lessons, "lesson_a", "Renamed");
  m.deleteContentBlock(lessons, "lesson_a", "b1");
  m.addAcceptedAnswer(lessons, "lesson_a", "b1", "l1");
  assert.equal(JSON.stringify(lessons), snapshot);
});

test("renameLesson trims leading space and empties to null", () => {
  const lessons = baseLessons();
  assert.equal(m.renameLesson(lessons, "lesson_b", "  Hi")[1].name, "Hi");
  assert.equal(m.renameLesson(lessons, "lesson_a", "   ")[0].name, null);
});

test("createLesson / deleteLesson", () => {
  const lessons = m.createLesson(baseLessons(), "lesson_c");
  assert.deepEqual(
    lessons.map((l) => l.id),
    ["lesson_a", "lesson_b", "lesson_c"],
  );
  assert.deepEqual(
    m.deleteLesson(lessons, "lesson_a").map((l) => l.id),
    ["lesson_b", "lesson_c"],
  );
});

test("moveLesson reorders with before/after and adjusts for removal", () => {
  const lessons: Lesson[] = ["a", "b", "c"].map((id) => ({
    id,
    name: null,
    blocks: [],
  }));
  assert.deepEqual(
    m.moveLesson(lessons, { draggedId: "a", targetId: "c", position: "after" }).map((l) => l.id),
    ["b", "c", "a"],
  );
  assert.deepEqual(
    m.moveLesson(lessons, { draggedId: "c", targetId: "a", position: "before" }).map((l) => l.id),
    ["c", "a", "b"],
  );
});

test("addSentenceBlock inserts at index; vocabulary layout is tagged", () => {
  const next = m.addSentenceBlock(
    baseLessons(),
    "lesson_a",
    0,
    "b_new",
    "l_new",
    "vocabulary_table",
  );
  const block = next[0].blocks[0] as SentenceBlock;
  assert.equal(block.id, "b_new");
  assert.equal(block.layout, "vocabulary_table");
  assert.equal(block.languageBlocks[0].id, "l_new");
  assert.equal(next[0].blocks.length, 2);
});

test("duplicateContentBlock deep-copies with fresh ids", () => {
  const lessons: Lesson[] = [
    {
      id: "lesson_a",
      name: null,
      blocks: [
        sentenceBlock({
          conceptLinks: [
            {
              id: "cl1",
              label: "x",
              type: "mapping",
              direction: "es_to_en",
              sourceText: "",
              targetText: "",
              contextLabel: "",
              role: "introduced",
            },
          ],
        }),
      ],
    },
  ];
  const next = m.duplicateContentBlock(lessons, "lesson_a", "b1");
  assert.equal(next[0].blocks.length, 2);
  const [original, copy] = next[0].blocks as SentenceBlock[];
  assert.notEqual(original.id, copy.id);
  assert.notEqual(original.conceptLinks[0].id, copy.conceptLinks[0].id);
  assert.notEqual(original.languageBlocks[0].id, copy.languageBlocks[0].id);
});

test("accepted-answer add / update / remove", () => {
  let lessons = baseLessons();
  lessons = m.addAcceptedAnswer(lessons, "lesson_a", "b1", "l1");
  lessons = m.updateAcceptedAnswer(lessons, "lesson_a", "b1", "l1", 1, "also");
  let lb = (lessons[0].blocks[0] as SentenceBlock).languageBlocks[0];
  assert.deepEqual(lb.acceptedAnswers, ["", "also"]);
  lessons = m.removeAcceptedAnswer(lessons, "lesson_a", "b1", "l1", 0);
  lb = (lessons[0].blocks[0] as SentenceBlock).languageBlocks[0];
  assert.deepEqual(lb.acceptedAnswers, ["also"]);
});

test("moveLanguageBlock reorders within its sentence block", () => {
  const lessons: Lesson[] = [
    {
      id: "lesson_a",
      name: null,
      blocks: [
        sentenceBlock({
          languageBlocks: ["l1", "l2", "l3"].map((id) => ({
            id,
            spanish: "",
            callout: null,
            acceptedAnswers: [""],
            conceptLinks: [],
          })),
        }),
      ],
    },
  ];
  const next = m.moveLanguageBlock(lessons, "lesson_a", "b1", {
    draggedId: "l1",
    targetId: "l3",
    position: "after",
  });
  assert.deepEqual(
    (next[0].blocks[0] as SentenceBlock).languageBlocks.map((l) => l.id),
    ["l2", "l3", "l1"],
  );
});

test("reducer dispatches through to the matching mutation", () => {
  const after = lessonsReducer(baseLessons(), {
    type: "UPDATE_SENTENCE_BLOCK",
    lessonId: "lesson_a",
    sentenceBlockId: "b1",
    patch: { promptText: "hello" },
  });
  assert.equal((after[0].blocks[0] as SentenceBlock).promptText, "hello");
});

test("reducer SET_LESSONS replaces wholesale", () => {
  assert.deepEqual(
    lessonsReducer(baseLessons(), { type: "SET_LESSONS", lessons: [] }),
    [],
  );
});
