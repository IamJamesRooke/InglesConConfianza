import assert from "node:assert/strict";
import test from "node:test";

import type { LessonBuilderActions } from "../../src/lib/lesson-builder/builder-context";
import { configureLeaveSlide, isRealBlurAway, leaveSlide } from "../../src/lib/lesson-builder/editing";
import type { Lesson, SentenceBlock } from "../../src/lib/lesson-builder/types";

// `leaveSlide` reads the live English draft from the DOM when one exists
// (see editing.ts's `liveEnglishValue`) and falls back to the committed
// `acceptedAnswers` when there is no `document` (these tests run under
// plain Node, no jsdom) — so every case here exercises the fallback path,
// which is exactly "the pair as the store already has it."

function piece(overrides: Partial<SentenceBlock["languageBlocks"][number]> = {}) {
  return { id: "p1", spanish: "", callout: null, acceptedAnswers: [""], ...overrides };
}

function sentenceLesson(
  pieces: SentenceBlock["languageBlocks"],
  promptText = "",
): Lesson {
  const block: SentenceBlock = {
    id: "block-1",
    type: "sentence",
    promptLabel: "",
    promptText,
    helperText: "",
    answerFeedback: null,
    languageBlocks: pieces,
  };
  return { id: "lesson-1", name: "Lesson", concepts: [], blocks: [block] };
}

const LEAVE_REASONS = [
  "escape",
  "insert",
  "finish",
  "move",
  "preview",
  "collapse",
  "blur",
] as const;

function fakeActions(): LessonBuilderActions & {
  deleted: string[];
  deletedBlocks: string[];
  endedGroup: boolean;
} {
  const deleted: string[] = [];
  const deletedBlocks: string[] = [];
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
    addBlock: () => ({ blockId: "new-block" }),
    deleteBlock: (_lessonId: string, blockId: string) => {
      deletedBlocks.push(blockId);
    },
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
    get deletedBlocks() {
      return deletedBlocks;
    },
    get endedGroup() {
      return endedGroup;
    },
  } as unknown as LessonBuilderActions & {
    deleted: string[];
    deletedBlocks: string[];
    endedGroup: boolean;
  };
}

test("leaveSlide prunes a blank trailing pair, keeping the non-blank ones, for every LeaveReason", () => {
  for (const reason of LEAVE_REASONS) {
    const lesson = sentenceLesson([
      piece({ id: "p1", spanish: "hola", acceptedAnswers: ["hello"] }),
      piece({ id: "p2", spanish: "", acceptedAnswers: [""] }),
    ]);
    const actions = fakeActions();
    configureLeaveSlide({ lessons: [lesson], actions });
    leaveSlide("lesson-1", "block-1", reason);
    assert.deepEqual(actions.deleted, ["p2"], `reason=${reason}`);
    assert.deepEqual(actions.deletedBlocks, [], `reason=${reason}`);
    assert.equal(actions.endedGroup, true, `reason=${reason}`);
  }
});

test("leaveSlide leaves a fully non-blank pair untouched", () => {
  const lesson = sentenceLesson([piece({ id: "p1", spanish: "hola", acceptedAnswers: ["hello"] })]);
  const actions = fakeActions();
  configureLeaveSlide({ lessons: [lesson], actions });
  leaveSlide("lesson-1", "block-1", "escape");
  assert.deepEqual(actions.deleted, []);
  assert.deepEqual(actions.deletedBlocks, []);
});

test("leaveSlide deletes an entirely empty sentence slide (single blank pair, no instruction), for every LeaveReason", () => {
  for (const reason of LEAVE_REASONS) {
    const lesson = sentenceLesson([piece({ id: "only" })]);
    const actions = fakeActions();
    configureLeaveSlide({ lessons: [lesson], actions });
    leaveSlide("lesson-1", "block-1", reason);
    assert.deepEqual(actions.deleted, [], `reason=${reason}`);
    assert.deepEqual(actions.deletedBlocks, ["block-1"], `reason=${reason}`);
    assert.equal(actions.endedGroup, true, `reason=${reason}`);
  }
});

test("leaveSlide keeps a sentence slide with just one character of Spanish text", () => {
  const lesson = sentenceLesson([piece({ id: "only", spanish: "h" })]);
  const actions = fakeActions();
  configureLeaveSlide({ lessons: [lesson], actions });
  leaveSlide("lesson-1", "block-1", "escape");
  assert.deepEqual(actions.deletedBlocks, []);
});

test("leaveSlide deletes an entirely empty sentence slide with every pair blank and no instruction, for every LeaveReason", () => {
  for (const reason of LEAVE_REASONS) {
    const lesson = sentenceLesson([piece({ id: "p1" }), piece({ id: "p2" }), piece({ id: "p3" })]);
    const actions = fakeActions();
    configureLeaveSlide({ lessons: [lesson], actions });
    leaveSlide("lesson-1", "block-1", reason);
    // Whole-slide delete is one dispatch — no per-piece pruning first.
    assert.deepEqual(actions.deleted, [], `reason=${reason}`);
    assert.deepEqual(actions.deletedBlocks, ["block-1"], `reason=${reason}`);
  }
});

test("leaveSlide treats a piece with only a hint (no spanish/english) as non-blank, so the slide is kept", () => {
  const lesson = sentenceLesson([piece({ id: "p1", callout: "a note" })]);
  const actions = fakeActions();
  configureLeaveSlide({ lessons: [lesson], actions });
  leaveSlide("lesson-1", "block-1", "escape");
  assert.deepEqual(actions.deleted, []);
  assert.deepEqual(actions.deletedBlocks, []);
});

test("leaveSlide keeps an instruction-only sentence slide (all pairs blank, instruction text present), pruning down to one blank pair", () => {
  const lesson = sentenceLesson(
    [piece({ id: "p1" }), piece({ id: "p2" })],
    "Fill in the blank.",
  );
  const actions = fakeActions();
  configureLeaveSlide({ lessons: [lesson], actions });
  leaveSlide("lesson-1", "block-1", "escape");
  assert.deepEqual(actions.deleted, ["p2"]);
  assert.deepEqual(actions.deletedBlocks, []);
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

test("leaveSlide is a no-op (but still ends the history group) for a non-blank explanation block", () => {
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
  assert.deepEqual(actions.deletedBlocks, []);
  assert.equal(actions.endedGroup, true);
});

test("leaveSlide deletes an explanation block whose markdown is blank after trim, for every LeaveReason", () => {
  for (const reason of LEAVE_REASONS) {
    for (const contentMarkdown of ["", "   ", "\n\n", "\n\n  \n\n"]) {
      const lesson: Lesson = {
        id: "lesson-1",
        name: null,
        concepts: [],
        blocks: [{ id: "e1", type: "explanation", contentMarkdown }],
      };
      const actions = fakeActions();
      configureLeaveSlide({ lessons: [lesson], actions });
      leaveSlide("lesson-1", "e1", reason);
      assert.deepEqual(actions.deletedBlocks, ["e1"], `reason=${reason} markdown=${JSON.stringify(contentMarkdown)}`);
      assert.equal(actions.endedGroup, true, `reason=${reason}`);
    }
  }
});

test("leaveSlide keeps an explanation block that is blank except for a leading/trailing empty paragraph around real text", () => {
  const lesson: Lesson = {
    id: "lesson-1",
    name: null,
    concepts: [],
    blocks: [{ id: "e1", type: "explanation", contentMarkdown: "\n\nHi\n\n" }],
  };
  const actions = fakeActions();
  configureLeaveSlide({ lessons: [lesson], actions });
  leaveSlide("lesson-1", "e1", "escape");
  assert.deepEqual(actions.deletedBlocks, []);
});

// isRealBlurAway backstops the builder root's native `focusout` listener
// (lesson-library.tsx): a blur whose `relatedTarget` couldn't be resolved
// to something inside the root — e.g. a control (Add instruction, hint
// lightbulb, Add pair/row, pair ×, block chrome) that unmounts itself as a
// direct result of its own click — must not collapse the selection (and
// therefore run leaveSlide) when the blurred element still belonged to the
// slide the selection already points at. Owner-reported regression
// 2026-09-15: clicking "Add instruction" on a brand-new, still-empty
// sentence slide deleted the whole slide.
test("isRealBlurAway: same slide as the current selection is never a real departure", () => {
  assert.equal(isRealBlurAway("block-1", "block-1"), false);
});

test("isRealBlurAway: a different slide than the current selection is a real departure", () => {
  assert.equal(isRealBlurAway("block-2", "block-1"), true);
});

test("isRealBlurAway: no resolvable target slide at all is a real departure", () => {
  assert.equal(isRealBlurAway(null, "block-1"), true);
});

test("isRealBlurAway: nothing was selected to begin with is a real departure (no-op selection change anyway)", () => {
  assert.equal(isRealBlurAway("block-1", null), true);
});
