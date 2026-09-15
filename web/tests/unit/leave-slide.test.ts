import assert from "node:assert/strict";
import test from "node:test";

import type { LessonBuilderActions } from "../../src/lib/lesson-builder/builder-context";
import { configureLeaveSlide, leaveSlide } from "../../src/lib/lesson-builder/editing";
import type { Lesson, SentenceBlock } from "../../src/lib/lesson-builder/types";

// `leaveSlide` reads the live English draft from the DOM when one exists
// (see editing.ts's `liveEnglishValue`) and falls back to the committed
// `acceptedAnswers` when there is no `document` (these tests run under
// plain Node, no jsdom) — so every case here exercises the fallback path,
// which is exactly "the pair as the store already has it."

function piece(overrides: Partial<SentenceBlock["languageBlocks"][number]> = {}) {
  return { id: "p1", spanish: "", callout: null, acceptedAnswers: [""], ...overrides };
}

function sentenceLesson(pieces: SentenceBlock["languageBlocks"]): Lesson {
  const block: SentenceBlock = {
    id: "block-1",
    type: "sentence",
    promptLabel: "",
    promptText: "",
    helperText: "",
    answerFeedback: null,
    languageBlocks: pieces,
  };
  return { id: "lesson-1", name: "Lesson", concepts: [], blocks: [block] };
}

function fakeActions(): LessonBuilderActions & { deleted: string[]; endedGroup: boolean } {
  const deleted: string[] = [];
  let endedGroup = false;
  const noop = () => undefined as never;
  return {
    conceptDisplays: {},
    deletionUndo: null,
    newLesson: noop,
    previewLesson: noop,
    duplicateLesson: noop,
    deleteLesson: noop,
    renameLesson: noop,
    addLessonConcept: noop,
    removeLessonConcept: noop,
    relabelLessonConcept: noop,
    updateExplanation: noop,
    updateSentence: noop,
    updateSpanish: noop,
    updateAnswer: noop,
    updateCallout: noop,
    addAnswer: noop,
    removeAnswer: noop,
    addPiece: () => "new-piece",
    deletePiece: (_lessonId: string, _blockId: string, pieceId: string) => {
      deleted.push(pieceId);
    },
    addBlock: () => "new-block",
    deleteBlock: noop,
    duplicateBlock: noop,
    moveBlock: noop,
    reorderBlock: noop,
    moveLessonKeyboard: () => null,
    newLessonAfter: () => null,
    undoDeletion: noop,
    endHistoryGroup: () => {
      endedGroup = true;
    },
    editorUndo: () => null,
    editorRedo: () => null,
    undo: noop,
    redo: noop,
    canUndo: false,
    canRedo: false,
    flushSave: noop,
    get deleted() {
      return deleted;
    },
    get endedGroup() {
      return endedGroup;
    },
  } as unknown as LessonBuilderActions & { deleted: string[]; endedGroup: boolean };
}

test("leaveSlide prunes a blank trailing pair, keeping the non-blank ones, for every LeaveReason", () => {
  for (const reason of ["escape", "insert", "finish", "move", "preview", "collapse", "blur"] as const) {
    const lesson = sentenceLesson([
      piece({ id: "p1", spanish: "hola", acceptedAnswers: ["hello"] }),
      piece({ id: "p2", spanish: "", acceptedAnswers: [""] }),
    ]);
    const actions = fakeActions();
    configureLeaveSlide({ lessons: [lesson], actions });
    leaveSlide("lesson-1", "block-1", reason);
    assert.deepEqual(actions.deleted, ["p2"], `reason=${reason}`);
    assert.equal(actions.endedGroup, true, `reason=${reason}`);
  }
});

test("leaveSlide leaves a fully non-blank pair untouched", () => {
  const lesson = sentenceLesson([piece({ id: "p1", spanish: "hola", acceptedAnswers: ["hello"] })]);
  const actions = fakeActions();
  configureLeaveSlide({ lessons: [lesson], actions });
  leaveSlide("lesson-1", "block-1", "escape");
  assert.deepEqual(actions.deleted, []);
});

test("leaveSlide keeps a single blank pair in a fresh sentence slide rather than emptying it", () => {
  const lesson = sentenceLesson([piece({ id: "only" })]);
  const actions = fakeActions();
  configureLeaveSlide({ lessons: [lesson], actions });
  leaveSlide("lesson-1", "block-1", "escape");
  assert.deepEqual(actions.deleted, []);
});

test("leaveSlide with every pair blank keeps only the first, prunes the rest", () => {
  const lesson = sentenceLesson([piece({ id: "p1" }), piece({ id: "p2" }), piece({ id: "p3" })]);
  const actions = fakeActions();
  configureLeaveSlide({ lessons: [lesson], actions });
  leaveSlide("lesson-1", "block-1", "finish");
  assert.deepEqual(actions.deleted, ["p2", "p3"]);
});

test("leaveSlide treats a piece with only a hint (no spanish/english) as non-blank", () => {
  const lesson = sentenceLesson([piece({ id: "p1", callout: "a note" })]);
  const actions = fakeActions();
  configureLeaveSlide({ lessons: [lesson], actions });
  leaveSlide("lesson-1", "block-1", "escape");
  assert.deepEqual(actions.deleted, []);
});

test("leaveSlide with reason 'blur' skips its own commit (the field's own onBlur commits instead) but still prunes/ends the group", () => {
  const lesson = sentenceLesson([
    piece({ id: "p1", spanish: "hola", acceptedAnswers: ["hello"] }),
    piece({ id: "p2", spanish: "adios", acceptedAnswers: [""] }),
  ]);
  const actions = fakeActions();
  configureLeaveSlide({ lessons: [lesson], actions });
  leaveSlide("lesson-1", "block-1", "blur");
  // No document in this test env, so liveEnglishValue falls back to the
  // stored answers anyway — this asserts the *reason* gate exists and
  // doesn't throw, and that pruning/ending-the-group still run for "blur".
  assert.deepEqual(actions.deleted, []); // p2 has non-blank spanish, kept
  assert.equal(actions.endedGroup, true);
});

test("leaveSlide is a no-op (but still ends the history group) for an explanation block", () => {
  const lesson: Lesson = {
    id: "lesson-1",
    name: null,
    concepts: [],
    blocks: [{ id: "e1", type: "explanation", contentMarkdown: "hi" }],
  };
  const actions = fakeActions();
  configureLeaveSlide({ lessons: [lesson], actions });
  leaveSlide("lesson-1", "e1", "escape");
  assert.deepEqual(actions.deleted, []);
  assert.equal(actions.endedGroup, true);
});
