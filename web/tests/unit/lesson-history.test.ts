import assert from "node:assert/strict";
import test from "node:test";

import {
  findRestoredFocusTarget,
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

test("edits to the same field only coalesce within a 1000ms window", (t) => {
  t.mock.timers.enable({ apis: ["Date"] });
  try {
    let state = reduce([{ type: "SET_LESSONS", lessons: historyLessons() }]);
    state = undoableLessonsReducer(state, {
      type: "RENAME_LESSON",
      lessonId: "lesson_a",
      name: "O",
    });
    t.mock.timers.tick(500);
    state = undoableLessonsReducer(state, {
      type: "RENAME_LESSON",
      lessonId: "lesson_a",
      name: "On",
    });
    // Still within the window — coalesces with the previous edit.
    assert.equal(state.past.length, 1);

    t.mock.timers.tick(1500);
    state = undoableLessonsReducer(state, {
      type: "RENAME_LESSON",
      lessonId: "lesson_a",
      name: "One",
    });
    // Past the window — starts a new step even though it's the same field.
    assert.equal(state.past.length, 2);
    assert.equal(state.present[0].name, "One");
  } finally {
    t.mock.timers.reset();
  }
});

function explanationLessons(): Lesson[] {
  return [
    {
      id: "lesson_a",
      name: "A",
      concepts: [],
      blocks: [
        { id: "explanation_a", type: "explanation", contentMarkdown: "" },
      ],
    },
  ];
}

test("a formatting op is its own undo step, isolated from surrounding typing", () => {
  // Simulates: type a sentence, bold a word (boundary edit to the same
  // field/action type as plain typing), type another sentence. Target:
  // three undo steps, not one merged step.
  const edited = reduce([
    { type: "SET_LESSONS", lessons: explanationLessons() },
    {
      type: "UPDATE_EXPLANATION_BLOCK",
      lessonId: "lesson_a",
      blockId: "explanation_a",
      contentMarkdown: "First sentence.",
    },
    {
      type: "UPDATE_EXPLANATION_BLOCK",
      lessonId: "lesson_a",
      blockId: "explanation_a",
      contentMarkdown: "First sentence. **bold**",
      boundary: true,
    },
    {
      type: "UPDATE_EXPLANATION_BLOCK",
      lessonId: "lesson_a",
      blockId: "explanation_a",
      contentMarkdown: "First sentence. **bold** Second sentence.",
    },
  ]);

  assert.equal(edited.past.length, 3);
  const block = edited.present[0].blocks[0];
  assert.equal(
    block.type === "explanation" ? block.contentMarkdown : null,
    "First sentence. **bold** Second sentence.",
  );

  // The boundary step (the bold) is undoable on its own — undoing once only
  // removes the trailing "Second sentence." addition, not the bold too.
  const undone = undoableLessonsReducer(edited, { type: "UNDO" });
  const undoneBlock = undone.present[0].blocks[0];
  assert.equal(
    undoneBlock.type === "explanation" ? undoneBlock.contentMarkdown : null,
    "First sentence. **bold**",
  );
});

test("findRestoredFocusTarget reports a restored slide", () => {
  const before = reduce([
    { type: "SET_LESSONS", lessons: historyLessons() },
    {
      type: "DELETE_CONTENT_BLOCK",
      lessonId: "lesson_a",
      blockId: "sentence_a",
    },
  ]).present;
  const after = historyLessons();

  const target = findRestoredFocusTarget(before, after);
  assert.deepEqual(target, { kind: "block", blockId: "sentence_a" });
});

test("findRestoredFocusTarget reports a restored pair", () => {
  const lessons = historyLessons();
  const withoutPiece: Lesson[] = lessons.map((lesson) =>
    lesson.id === "lesson_a"
      ? {
          ...lesson,
          blocks: lesson.blocks.map((block) =>
            block.type === "sentence"
              ? { ...block, languageBlocks: [] }
              : block,
          ),
        }
      : lesson,
  );

  const target = findRestoredFocusTarget(withoutPiece, lessons);
  assert.deepEqual(target, {
    kind: "piece",
    blockId: "sentence_a",
    pieceId: "language_a",
  });
});

test("findRestoredFocusTarget returns null when nothing was restored", () => {
  const lessons = historyLessons();
  assert.equal(findRestoredFocusTarget(lessons, lessons), null);
});
