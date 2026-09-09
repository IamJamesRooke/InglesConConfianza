import assert from "node:assert/strict";
import test from "node:test";

import {
  initialUndoableLessons,
  undoableLessonsReducer,
  type UndoableAction,
  type UndoableLessons,
} from "../../src/lib/lesson-builder/history";
import type { Lesson, SentenceBlock } from "../../src/lib/lesson-builder/types";

function historyLessons(): Lesson[] {
  return [
    {
      id: "lesson_a",
      name: "A",
      concepts: [],
      blocks: [
        {
          id: "sentence_a",
          type: "sentence",
          promptLabel: "",
          promptText: "",
          helperText: "",
          answerFeedback: null,
          languageBlocks: [
            {
              id: "language_a",
              spanish: "",
              callout: null,
              acceptedAnswers: ["", ""],
            },
          ],
        },
      ],
    },
    { id: "lesson_b", name: "B", concepts: [], blocks: [] },
  ];
}

function reduce(actions: UndoableAction[]): UndoableLessons {
  return actions.reduce(undoableLessonsReducer, initialUndoableLessons);
}

test("history restores and reapplies a structural edit", () => {
  const deleted = reduce([
    { type: "SET_LESSONS", lessons: historyLessons() },
    {
      type: "DELETE_CONTENT_BLOCK",
      lessonId: "lesson_a",
      blockId: "sentence_a",
    },
  ]);

  assert.equal(deleted.past.length, 1);
  assert.equal(deleted.present[0].blocks.length, 0);

  const restored = undoableLessonsReducer(deleted, { type: "UNDO" });
  assert.equal(restored.present[0].blocks.length, 1);
  assert.equal(restored.future.length, 1);

  const reapplied = undoableLessonsReducer(restored, { type: "REDO" });
  assert.equal(reapplied.present[0].blocks.length, 0);
});

test("history coalesces consecutive edits to the same field", () => {
  const edited = reduce([
    { type: "SET_LESSONS", lessons: historyLessons() },
    { type: "RENAME_LESSON", lessonId: "lesson_a", name: "O" },
    { type: "RENAME_LESSON", lessonId: "lesson_a", name: "On" },
    { type: "RENAME_LESSON", lessonId: "lesson_a", name: "One" },
  ]);

  assert.equal(edited.past.length, 1);
  assert.equal(edited.present[0].name, "One");
  const undone = undoableLessonsReducer(edited, { type: "UNDO" });
  assert.equal(undone.present[0].name, "A");
});

test("history keeps lesson, field, and answer index coalescing keys separate", () => {
  const edited = reduce([
    { type: "SET_LESSONS", lessons: historyLessons() },
    { type: "RENAME_LESSON", lessonId: "lesson_a", name: "First" },
    { type: "RENAME_LESSON", lessonId: "lesson_b", name: "Second" },
    {
      type: "UPDATE_SENTENCE_BLOCK",
      lessonId: "lesson_a",
      sentenceBlockId: "sentence_a",
      patch: { promptText: "Prompt" },
    },
    {
      type: "UPDATE_SENTENCE_BLOCK",
      lessonId: "lesson_a",
      sentenceBlockId: "sentence_a",
      patch: { helperText: "Help" },
    },
    {
      type: "UPDATE_ACCEPTED_ANSWER",
      lessonId: "lesson_a",
      sentenceBlockId: "sentence_a",
      languageBlockId: "language_a",
      answerIndex: 0,
      value: "one",
    },
    {
      type: "UPDATE_ACCEPTED_ANSWER",
      lessonId: "lesson_a",
      sentenceBlockId: "sentence_a",
      languageBlockId: "language_a",
      answerIndex: 1,
      value: "two",
    },
  ]);

  assert.equal(edited.past.length, 6);
  const beforeSecondAnswer = undoableLessonsReducer(edited, { type: "UNDO" });
  const sentence = beforeSecondAnswer.present[0].blocks[0] as SentenceBlock;
  assert.deepEqual(sentence.languageBlocks[0].acceptedAnswers, ["one", ""]);
});

test("ending a history group separates later edits to the same field", () => {
  const edited = reduce([
    { type: "SET_LESSONS", lessons: historyLessons() },
    { type: "RENAME_LESSON", lessonId: "lesson_a", name: "First visit" },
    { type: "END_HISTORY_GROUP" },
    { type: "RENAME_LESSON", lessonId: "lesson_a", name: "Second visit" },
  ]);

  const undone = undoableLessonsReducer(edited, { type: "UNDO" });
  assert.equal(undone.present[0].name, "First visit");
});

test("a new edit after undo clears redo history", () => {
  const edited = reduce([
    { type: "SET_LESSONS", lessons: historyLessons() },
    { type: "RENAME_LESSON", lessonId: "lesson_a", name: "First" },
    { type: "END_HISTORY_GROUP" },
    { type: "RENAME_LESSON", lessonId: "lesson_a", name: "Second" },
    { type: "UNDO" },
    { type: "RENAME_LESSON", lessonId: "lesson_b", name: "Branch" },
  ]);

  assert.equal(edited.future.length, 0);
  assert.equal(edited.present[0].name, "First");
  assert.equal(edited.present[1].name, "Branch");
});

test("loading replaces the document and clears existing history", () => {
  const replacement: Lesson[] = [
    { id: "replacement", name: null, concepts: [], blocks: [] },
  ];
  const loaded = reduce([
    { type: "SET_LESSONS", lessons: historyLessons() },
    { type: "RENAME_LESSON", lessonId: "lesson_a", name: "Edited" },
    { type: "SET_LESSONS", lessons: replacement },
  ]);

  assert.deepEqual(loaded.present, replacement);
  assert.equal(loaded.past.length, 0);
  assert.equal(loaded.future.length, 0);
  assert.equal(loaded.lastKey, null);
});

test("history retains only the latest 100 document snapshots", () => {
  const actions: UndoableAction[] = [
    { type: "SET_LESSONS", lessons: historyLessons() },
  ];
  for (let index = 0; index < 105; index += 1) {
    actions.push({ type: "CREATE_LESSON", lessonId: `created_${index}` });
  }

  const edited = reduce(actions);
  assert.equal(edited.past.length, 100);

  let earliestReachable = edited;
  for (let index = 0; index < 100; index += 1) {
    earliestReachable = undoableLessonsReducer(earliestReachable, {
      type: "UNDO",
    });
  }
  assert.equal(earliestReachable.present.length, historyLessons().length + 5);
});
