import assert from "node:assert/strict";
import test from "node:test";

import type { LessonBuilderActions } from "../../src/lib/lesson-builder/builder-context";
import type { EditingActions, EditingSelection } from "../../src/lib/lesson-builder/editing";
import {
  chordOf,
  dispatchKeymap,
  fieldSelectionForBlock,
  KEYMAP,
  scopeOf,
} from "../../src/lib/lesson-builder/keymap";
import type { Lesson, SentenceBlock } from "../../src/lib/lesson-builder/types";

function sentenceBlock(overrides: Partial<SentenceBlock> = {}): SentenceBlock {
  return {
    id: "block-1",
    type: "sentence",
    promptLabel: "",
    promptText: "",
    helperText: "",
    answerFeedback: null,
    languageBlocks: [{ id: "piece-1", spanish: "", callout: null, acceptedAnswers: [""] }],
    ...overrides,
  };
}

function lesson(blocks: Lesson["blocks"]): Lesson {
  return { id: "lesson-1", name: "Lesson", concepts: [], blocks };
}

function fakeEvent(overrides: Record<string, unknown> = {}): KeyboardEvent {
  return {
    code: "Enter",
    key: "Enter",
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    isComposing: false,
    target: null,
    preventDefault() {},
    ...overrides,
  } as unknown as KeyboardEvent;
}

function fakeActions(overrides: Partial<LessonBuilderActions> = {}): LessonBuilderActions & {
  calls: Record<string, unknown[][]>;
} {
  const calls: Record<string, unknown[][]> = {};
  function record<Args extends unknown[], Result = void>(
    name: string,
    impl?: (...args: Args) => Result,
  ) {
    return (...args: Args): Result => {
      (calls[name] ??= []).push(args);
      return impl ? impl(...args) : (undefined as Result);
    };
  }
  const base: LessonBuilderActions = {
    conceptDisplays: {},
    recordConceptDisplay: () => {},
    getSyllabusMarkers: () => ({ known: new Set(), mainOfModule: new Set(), inSyllabusUncovered: new Set() }),
    getLessonReviewSplit: () => ({ introduced: [], reviewed: [], priorConceptsExist: false }),
    deletionUndo: null,
    newLesson: record("newLesson", () => "new-lesson"),
    previewLesson: record("previewLesson"),
    duplicateLesson: record("duplicateLesson"),
    deleteLesson: record("deleteLesson"),
    renameLesson: record("renameLesson"),
    toggleLessonDraft: record("toggleLessonDraft"),
    setLessonNotes: record("setLessonNotes"),
    addLessonConcept: record("addLessonConcept"),
    removeLessonConcept: record("removeLessonConcept"),
    relabelLessonConcept: record("relabelLessonConcept"),
    updateExplanation: record("updateExplanation"),
    updateSentence: record("updateSentence"),
    updateSpanish: record("updateSpanish"),
    updateAnswer: record("updateAnswer"),
    updateCallout: record("updateCallout"),
    addAnswer: record("addAnswer"),
    removeAnswer: record("removeAnswer"),
    addPiece: record("addPiece", () => "new-piece"),
    deletePiece: record("deletePiece"),
    toggleGiven: record("toggleGiven"),
    addBlock: record("addBlock", () => ({ blockId: "new-block" })),
    extendLastSentence: record("extendLastSentence", () => ({
      blockId: "new-extend-block",
      languageBlockId: "new-extend-piece",
    })),
    deleteBlock: record("deleteBlock"),
    replaceLessonBlocks: record("replaceLessonBlocks"),
    duplicateBlock: record("duplicateBlock"),
    moveBlock: record("moveBlock"),
    reorderBlock: record("reorderBlock"),
    moveLessonKeyboard: record("moveLessonKeyboard", () => null),
    newLessonAfter: record("newLessonAfter", () => "new-lesson"),
    undoDeletion: record("undoDeletion"),
    endHistoryGroup: record("endHistoryGroup"),
    editorUndo: record("editorUndo", () => null),
    editorRedo: record("editorRedo", () => null),
    undo: record("undo"),
    redo: record("redo"),
    canUndo: false,
    canRedo: false,
    flushSave: record("flushSave"),
    ...overrides,
  };
  return Object.assign(base, { calls });
}

function fakeEditing(
  selection: EditingSelection,
  overrides: Partial<EditingActions> = {},
): EditingActions & { calls: Record<string, unknown[][]>; lastSelection: EditingSelection | null } {
  const calls: Record<string, unknown[][]> = {};
  const state = { lastSelection: null as EditingSelection | null };
  function record<T extends unknown[]>(name: string, impl?: (...args: T) => unknown) {
    return (...args: T) => {
      (calls[name] ??= []).push(args);
      return impl?.(...args);
    };
  }
  const base: EditingActions = {
    selection,
    openLessonId: null,
    insertAfter: null,
    scriptViewLessonId: null,
    activeModuleId: "module-1",
    confirmDeleteKey: null,
    helpOpen: false,
    setSelection: record("setSelection", (sel: EditingSelection) => {
      state.lastSelection = sel;
    }),
    setOpenLesson: record("setOpenLesson"),
    setInsertAfter: record("setInsertAfter"),
    setScriptView: record("setScriptView"),
    setActiveModule: record("setActiveModule"),
    requestDeleteConfirm: record("requestDeleteConfirm"),
    setHelpOpen: record("setHelpOpen"),
    focusSelection: record("focusSelection"),
    ...overrides,
  };
  const result = Object.assign(base, { calls }) as EditingActions & {
    calls: Record<string, unknown[][]>;
    lastSelection: EditingSelection | null;
  };
  Object.defineProperty(result, "lastSelection", { get: () => state.lastSelection });
  return result;
}

test("chordOf normalizes Ctrl/Cmd, uses event.code for letters, and Enter/NumpadEnter alike", () => {
  assert.equal(chordOf(fakeEvent({ code: "Enter", ctrlKey: true, altKey: true })), "Ctrl+Alt+Enter");
  assert.equal(chordOf(fakeEvent({ code: "NumpadEnter", ctrlKey: true, altKey: true })), "Ctrl+Alt+Enter");
  assert.equal(chordOf(fakeEvent({ code: "KeyD", ctrlKey: true, altKey: true })), "Ctrl+Alt+D");
  assert.equal(chordOf(fakeEvent({ code: "KeyZ", metaKey: true })), "Ctrl+Z");
  assert.equal(chordOf(fakeEvent({ code: "KeyZ", ctrlKey: true, shiftKey: true })), "Ctrl+Shift+Z");
  assert.equal(chordOf(fakeEvent({ code: "ArrowUp", ctrlKey: true, altKey: true })), "Ctrl+Alt+ArrowUp");
  assert.equal(chordOf(fakeEvent({ code: "Period", ctrlKey: true })), "Ctrl+.");
  assert.equal(chordOf(fakeEvent({ code: "Tab" })), "Tab");
  assert.equal(chordOf(fakeEvent({ code: "Tab", shiftKey: true })), "Shift+Tab");
  assert.equal(chordOf(fakeEvent({ code: "Escape" })), "Escape");
});

test("scopeOf walks innermost to outermost for each selection kind", () => {
  assert.deepEqual(scopeOf({ kind: "none" }), ["page"]);
  assert.deepEqual(scopeOf({ kind: "title", lessonId: "l" }), ["title", "lesson", "page"]);
  assert.deepEqual(scopeOf({ kind: "block", lessonId: "l", blockId: "b" }), ["block", "lesson", "page"]);
  assert.deepEqual(
    scopeOf({ kind: "field", lessonId: "l", blockId: "b", field: "spanish", pieceId: "p" }),
    ["spanish", "block", "lesson", "page"],
  );
});

test("every scope in KEYMAP is a real Scope and every chord maps to a function", () => {
  for (const [scope, chords] of Object.entries(KEYMAP)) {
    assert.ok(chords, `scope ${scope} has an entry`);
    for (const [chord, command] of Object.entries(chords ?? {})) {
      assert.equal(typeof command, "function", `${scope}/${chord} is a command function`);
    }
  }
});

test("Enter on title opens the lesson and focuses its first field (explanation), creating one if empty", () => {
  const empty = lesson([]);
  const actions = fakeActions();
  const editing = fakeEditing({ kind: "title", lessonId: "lesson-1" });
  const handled = KEYMAP.title.Enter!({
    selection: editing.selection,
    lessons: [empty],
    actions,
    editing,
    event: fakeEvent(),
  });
  assert.equal(handled, true);
  assert.deepEqual(actions.calls.addBlock, [["lesson-1", "explanation", 0]]);
  assert.deepEqual(editing.lastSelection, {
    kind: "field",
    lessonId: "lesson-1",
    blockId: "new-block",
    field: "explanation",
  });
});

test("Enter on title with an existing first block focuses that block's field directly (no addBlock)", () => {
  const withBlock = lesson([sentenceBlock()]);
  const actions = fakeActions();
  const editing = fakeEditing({ kind: "title", lessonId: "lesson-1" });
  KEYMAP.title.Enter!({ selection: editing.selection, lessons: [withBlock], actions, editing, event: fakeEvent() });
  assert.equal(actions.calls.addBlock, undefined);
  assert.deepEqual(editing.lastSelection, {
    kind: "field",
    lessonId: "lesson-1",
    blockId: "block-1",
    field: "spanish",
    pieceId: "piece-1",
  });
});

test("Ctrl+Alt+Enter on the title inserts an explanation at index 0", () => {
  const withBlock = lesson([sentenceBlock()]);
  const actions = fakeActions();
  const editing = fakeEditing({ kind: "title", lessonId: "lesson-1" });
  const handled = KEYMAP.title["Ctrl+Alt+Enter"]!({
    selection: editing.selection,
    lessons: [withBlock],
    actions,
    editing,
    event: fakeEvent({ ctrlKey: true, altKey: true }),
  });
  assert.equal(handled, true);
  assert.deepEqual(actions.calls.addBlock, [["lesson-1", "explanation", 0]]);
});

test("Ctrl+Alt+Enter after an explanation predicts sentence; after a sentence predicts explanation", () => {
  const explanationBlock = { id: "e1", type: "explanation" as const, contentMarkdown: "hi" };
  const l = lesson([explanationBlock, sentenceBlock({ id: "s1" })]);
  const actions1 = fakeActions();
  const editing1 = fakeEditing({ kind: "block", lessonId: "lesson-1", blockId: "e1" });
  KEYMAP.block["Ctrl+Alt+Enter"]!({
    selection: editing1.selection,
    lessons: [l],
    actions: actions1,
    editing: editing1,
    event: fakeEvent({ ctrlKey: true, altKey: true }),
  });
  assert.deepEqual(actions1.calls.addBlock, [["lesson-1", "sentence", 1]]);

  const actions2 = fakeActions();
  const editing2 = fakeEditing({ kind: "block", lessonId: "lesson-1", blockId: "s1" });
  KEYMAP.block["Ctrl+Alt+Enter"]!({
    selection: editing2.selection,
    lessons: [l],
    actions: actions2,
    editing: editing2,
    event: fakeEvent({ ctrlKey: true, altKey: true }),
  });
  assert.deepEqual(actions2.calls.addBlock, [["lesson-1", "explanation", 2]]);
});

test("Ctrl+Alt+Shift+Enter on the title extends with afterBlockId null and focuses the new empty pair", () => {
  const actions = fakeActions();
  const editing = fakeEditing({ kind: "title", lessonId: "lesson-1" });
  const handled = KEYMAP.title["Ctrl+Alt+Shift+Enter"]!({
    selection: editing.selection,
    lessons: [lesson([sentenceBlock()])],
    actions,
    editing,
    event: fakeEvent({ ctrlKey: true, altKey: true, shiftKey: true }),
  });
  assert.equal(handled, true);
  assert.deepEqual(actions.calls.extendLastSentence, [["lesson-1", null]]);
  assert.deepEqual(editing.lastSelection, {
    kind: "field",
    lessonId: "lesson-1",
    blockId: "new-extend-block",
    field: "spanish",
    pieceId: "new-extend-piece",
  });
});

test("Ctrl+Alt+Shift+Enter on a block extends after that block", () => {
  const actions = fakeActions();
  const editing = fakeEditing({ kind: "block", lessonId: "lesson-1", blockId: "b1" });
  const handled = KEYMAP.block["Ctrl+Alt+Shift+Enter"]!({
    selection: editing.selection,
    lessons: [lesson([sentenceBlock({ id: "b1" })])],
    actions,
    editing,
    event: fakeEvent({ ctrlKey: true, altKey: true, shiftKey: true }),
  });
  assert.equal(handled, true);
  assert.deepEqual(actions.calls.extendLastSentence, [["lesson-1", "b1"]]);
});

test("Ctrl+Alt+G in spanish/english toggles given on the current piece", () => {
  const actions = fakeActions();
  const editing = fakeEditing({
    kind: "field",
    lessonId: "lesson-1",
    blockId: "block-1",
    field: "spanish",
    pieceId: "piece-1",
  });
  const handled = KEYMAP.spanish["Ctrl+Alt+G"]!({
    selection: editing.selection,
    lessons: [lesson([sentenceBlock()])],
    actions,
    editing,
    event: fakeEvent({ ctrlKey: true, altKey: true }),
  });
  assert.equal(handled, true);
  assert.deepEqual(actions.calls.toggleGiven, [["lesson-1", "block-1", "piece-1"]]);
});

test("Escape in a field moves selection to block, same blockId", () => {
  const actions = fakeActions();
  const editing = fakeEditing({
    kind: "field",
    lessonId: "lesson-1",
    blockId: "block-1",
    field: "spanish",
    pieceId: "piece-1",
  });
  const handled = KEYMAP.spanish.Escape!({
    selection: editing.selection,
    lessons: [lesson([sentenceBlock()])],
    actions,
    editing,
    event: fakeEvent({ code: "Escape", key: "Escape" }),
  });
  assert.equal(handled, true);
  assert.deepEqual(editing.lastSelection, { kind: "block", lessonId: "lesson-1", blockId: "block-1" });
});

test("Escape on a block fully deselects (selection -> none), not 'stay'", () => {
  const actions = fakeActions();
  const editing = fakeEditing({ kind: "block", lessonId: "lesson-1", blockId: "block-1" });
  const handled = KEYMAP.block.Escape!({
    selection: editing.selection,
    lessons: [lesson([sentenceBlock()])],
    actions,
    editing,
    event: fakeEvent({ code: "Escape", key: "Escape" }),
  });
  assert.equal(handled, true);
  assert.deepEqual(editing.lastSelection, { kind: "none" });
});

test("two Escapes from a field fully deselect: field -> block -> none", () => {
  const actions = fakeActions();
  const editing = fakeEditing({
    kind: "field",
    lessonId: "lesson-1",
    blockId: "block-1",
    field: "spanish",
    pieceId: "piece-1",
  });
  KEYMAP.spanish.Escape!({
    selection: editing.selection,
    lessons: [lesson([sentenceBlock()])],
    actions,
    editing,
    event: fakeEvent({ code: "Escape", key: "Escape" }),
  });
  assert.deepEqual(editing.lastSelection, { kind: "block", lessonId: "lesson-1", blockId: "block-1" });
  const handled = KEYMAP.block.Escape!({
    selection: editing.lastSelection!,
    lessons: [lesson([sentenceBlock()])],
    actions,
    editing,
    event: fakeEvent({ code: "Escape", key: "Escape" }),
  });
  assert.equal(handled, true);
  assert.deepEqual(editing.lastSelection, { kind: "none" });
});

test("Tab in spanish moves to english of the same piece", () => {
  const actions = fakeActions();
  const editing = fakeEditing({
    kind: "field",
    lessonId: "lesson-1",
    blockId: "block-1",
    field: "spanish",
    pieceId: "piece-1",
  });
  const handled = KEYMAP.spanish.Tab!({
    selection: editing.selection,
    lessons: [lesson([sentenceBlock()])],
    actions,
    editing,
    event: fakeEvent({ code: "Tab", key: "Tab" }),
  });
  assert.equal(handled, true);
  assert.deepEqual(editing.lastSelection, {
    kind: "field",
    lessonId: "lesson-1",
    blockId: "block-1",
    field: "english",
    pieceId: "piece-1",
  });
});

test("Enter in a complete last English pair creates a new pair and focuses its Spanish field", () => {
  const block = sentenceBlock({
    languageBlocks: [{ id: "piece-1", spanish: "hola", callout: null, acceptedAnswers: ["hello"] }],
  });
  const actions = fakeActions();
  const editing = fakeEditing({
    kind: "field",
    lessonId: "lesson-1",
    blockId: "block-1",
    field: "english",
    pieceId: "piece-1",
  });
  const handled = KEYMAP.english.Enter!({
    selection: editing.selection,
    lessons: [lesson([block])],
    actions,
    editing,
    event: fakeEvent({ code: "Enter", key: "Enter", target: { value: "hello" } }),
  });
  assert.equal(handled, true);
  assert.deepEqual(actions.calls.addPiece, [["lesson-1", "block-1"]]);
  assert.deepEqual(editing.lastSelection, {
    kind: "field",
    lessonId: "lesson-1",
    blockId: "block-1",
    field: "spanish",
    pieceId: "new-piece",
  });
});

test("Enter on an empty last pair leaves the slide (selection moves to block, no new pair)", () => {
  const block = sentenceBlock(); // single blank piece
  const actions = fakeActions();
  const editing = fakeEditing({
    kind: "field",
    lessonId: "lesson-1",
    blockId: "block-1",
    field: "english",
    pieceId: "piece-1",
  });
  const handled = KEYMAP.english.Enter!({
    selection: editing.selection,
    lessons: [lesson([block])],
    actions,
    editing,
    event: fakeEvent({ code: "Enter", key: "Enter" }),
  });
  assert.equal(handled, true);
  assert.equal(actions.calls.addPiece, undefined);
  assert.deepEqual(editing.lastSelection, { kind: "block", lessonId: "lesson-1", blockId: "block-1" });
});

test("Tab on an incomplete trailing pair is unhandled (browser default Tab continues)", () => {
  const block = sentenceBlock({
    languageBlocks: [{ id: "piece-1", spanish: "hola", callout: null, acceptedAnswers: [""] }],
  });
  const actions = fakeActions();
  const editing = fakeEditing({
    kind: "field",
    lessonId: "lesson-1",
    blockId: "block-1",
    field: "english",
    pieceId: "piece-1",
  });
  const handled = KEYMAP.english.Tab!({
    selection: editing.selection,
    lessons: [lesson([block])],
    actions,
    editing,
    event: fakeEvent({ code: "Tab", key: "Tab" }),
  });
  assert.equal(handled, false);
});

test("Ctrl+Alt+Backspace in spanish/english deletes the current pair", () => {
  const actions = fakeActions();
  const editing = fakeEditing({
    kind: "field",
    lessonId: "lesson-1",
    blockId: "block-1",
    field: "spanish",
    pieceId: "piece-1",
  });
  const handled = KEYMAP.spanish["Ctrl+Alt+Backspace"]!({
    selection: editing.selection,
    lessons: [lesson([sentenceBlock()])],
    actions,
    editing,
    event: fakeEvent({ code: "Backspace", ctrlKey: true, altKey: true }),
  });
  assert.equal(handled, true);
  assert.deepEqual(actions.calls.deletePiece, [["lesson-1", "block-1", "piece-1"]]);
});

test("Ctrl+Alt+Backspace on the title opens the delete-lesson confirm", () => {
  const actions = fakeActions();
  const editing = fakeEditing({ kind: "title", lessonId: "lesson-1" });
  const handled = KEYMAP.title["Ctrl+Alt+Backspace"]!({
    selection: editing.selection,
    lessons: [lesson([])],
    actions,
    editing,
    event: fakeEvent({ code: "Backspace", ctrlKey: true, altKey: true }),
  });
  assert.equal(handled, true);
  assert.deepEqual(editing.calls.requestDeleteConfirm, [["lesson:lesson-1"]]);
});

test("Ctrl+Alt+D finishes (collapses) the lesson from any selection inside it", () => {
  const actions = fakeActions();
  const editing = fakeEditing({ kind: "block", lessonId: "lesson-1", blockId: "block-1" });
  const handled = KEYMAP.lesson["Ctrl+Alt+D"]!({
    selection: editing.selection,
    lessons: [lesson([sentenceBlock()])],
    actions,
    editing,
    event: fakeEvent({ code: "KeyD", ctrlKey: true, altKey: true }),
  });
  assert.equal(handled, true);
  assert.deepEqual(editing.lastSelection, { kind: "none" });
  assert.deepEqual(editing.calls.setOpenLesson, [[null]]);
  assert.ok(actions.calls.flushSave);
});

test("Ctrl+Z is unhandled (falls through to native undo) when the target is a text field", () => {
  const actions = fakeActions();
  const editing = fakeEditing({ kind: "none" });
  const target = { closest: () => ({}) as Element };
  const handled = KEYMAP.page["Ctrl+Z"]!({
    selection: editing.selection,
    lessons: [],
    actions,
    editing,
    event: fakeEvent({ code: "KeyZ", ctrlKey: true, target }),
  });
  assert.equal(handled, false);
  assert.equal(actions.calls.undo, undefined);
});

test("Ctrl+Z runs the page undo when the target is not a text field", () => {
  const actions = fakeActions();
  const editing = fakeEditing({ kind: "none" });
  const handled = KEYMAP.page["Ctrl+Z"]!({
    selection: editing.selection,
    lessons: [],
    actions,
    editing,
    event: fakeEvent({ code: "KeyZ", ctrlKey: true, target: null }),
  });
  assert.equal(handled, true);
  assert.ok(actions.calls.undo);
});

test("Ctrl+. toggles keyboard help", () => {
  const actions = fakeActions();
  const editing = fakeEditing({ kind: "none" }, { helpOpen: false });
  const handled = KEYMAP.page["Ctrl+."]!({
    selection: editing.selection,
    lessons: [],
    actions,
    editing,
    event: fakeEvent({ code: "Period", ctrlKey: true }),
  });
  assert.equal(handled, true);
  assert.deepEqual(editing.calls.setHelpOpen, [[true]]);
});

test("dispatchKeymap ignores composing events and [data-keymap-ignore] targets", () => {
  const actions = fakeActions();
  const editing = fakeEditing({ kind: "none" });
  const ignoredTarget = { closest: (sel: string) => (sel.includes("keymap-ignore") ? ({} as Element) : null) };
  // Should not throw and should not call setHelpOpen despite matching Ctrl+.
  dispatchKeymap(fakeEvent({ code: "Period", ctrlKey: true, target: ignoredTarget }), {
    selection: editing.selection,
    lessons: [],
    actions,
    editing,
  });
  assert.equal(editing.calls.setHelpOpen, undefined);
});

test("dispatchKeymap ignores a field-scoped chord when the event didn't actually land on that field (stale selection vs. a plain button)", () => {
  const actions = fakeActions();
  // Selection still says "spanish" (nothing wrote it to none — a plain
  // button inside the builder doesn't blur the whole builder root), but the
  // keydown's real target is some unrelated button.
  const editing = fakeEditing({
    kind: "field",
    lessonId: "lesson-1",
    blockId: "block-1",
    field: "spanish",
    pieceId: "piece-1",
  });
  const plainButton = { closest: () => null };
  dispatchKeymap(fakeEvent({ code: "Enter", key: "Enter", target: plainButton }), {
    selection: editing.selection,
    lessons: [lesson([sentenceBlock()])],
    actions,
    editing,
  });
  // The spanish scope's Enter (blockNewlineOnly) must not have fired.
  assert.equal(editing.lastSelection, null);
});

test("dispatchKeymap still runs a field-scoped chord when the target really is inside that field", () => {
  const actions = fakeActions();
  const editing = fakeEditing({
    kind: "field",
    lessonId: "lesson-1",
    blockId: "block-1",
    field: "spanish",
    pieceId: "piece-1",
  });
  const spanishField = { closest: (sel: string) => (sel === '[data-field="spanish"]' ? ({} as Element) : null) };
  dispatchKeymap(fakeEvent({ code: "Tab", key: "Tab", target: spanishField }), {
    selection: editing.selection,
    lessons: [lesson([sentenceBlock()])],
    actions,
    editing,
  });
  assert.deepEqual(editing.lastSelection, {
    kind: "field",
    lessonId: "lesson-1",
    blockId: "block-1",
    field: "english",
    pieceId: "piece-1",
  });
});

test("fieldSelectionForBlock: explanation -> explanation field; sentence -> spanish field of its first piece", () => {
  const explanationBlock = { id: "e1", type: "explanation" as const, contentMarkdown: "" };
  assert.deepEqual(fieldSelectionForBlock("lesson-1", explanationBlock), {
    kind: "field",
    lessonId: "lesson-1",
    blockId: "e1",
    field: "explanation",
  });
  assert.deepEqual(fieldSelectionForBlock("lesson-1", sentenceBlock()), {
    kind: "field",
    lessonId: "lesson-1",
    blockId: "block-1",
    field: "spanish",
    pieceId: "piece-1",
  });
});
