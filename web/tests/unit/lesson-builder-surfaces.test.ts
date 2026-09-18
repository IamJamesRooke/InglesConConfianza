import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SlideInsertControl } from "../../src/components/lesson-builder/slide-insert-control";
import { SentenceEditor } from "../../src/components/lesson-builder/sentence-editor";
import {
  LessonBuilderProvider,
  type LessonBuilderActions,
} from "../../src/lib/lesson-builder/builder-context";
import { EditingProvider } from "../../src/lib/lesson-builder/editing";
import type { SentenceBlock, Lesson } from "../../src/lib/lesson-builder/types";

// The lesson tail must behave exactly like a mid-document insertion seam
// (hover/focus-reveal, no persistent "Add slide" row) once the lesson has at
// least one slide — only an empty lesson keeps the always-visible, labelled
// form. Regression: the tail control used to hardcode `labelled`.
test("SlideInsertControl unlabelled render has no persistent 'Add slide' text or open class", () => {
  const html = renderToStaticMarkup(
    createElement(SlideInsertControl, {
      insertionLabel: "Insert at lesson end",
      labelled: false,
      onAdd: () => {},
      onClose: () => {},
    }),
  );
  assert.doesNotMatch(html, /Add slide/);
  assert.doesNotMatch(html, /class="lesson-document-insert labelled"/);
});

test("SlideInsertControl labelled render (empty-lesson tail) keeps the discoverable prefix", () => {
  const html = renderToStaticMarkup(
    createElement(SlideInsertControl, {
      insertionLabel: "Insert at lesson end",
      labelled: true,
      onAdd: () => {},
      onClose: () => {},
    }),
  );
  assert.match(html, /Add slide/);
});

// Owner-approved order everywhere: Explanation, Sentence, Table.
test("SlideInsertControl renders choices in Explanation/Sentence/Table order", () => {
  const html = renderToStaticMarkup(
    createElement(SlideInsertControl, {
      insertionLabel: "Insert before slide 1",
      onAdd: () => {},
      onClose: () => {},
    }),
  );
  const explanationIndex = html.indexOf("Explanation");
  const sentenceIndex = html.indexOf(">Sentence<");
  const tableIndex = html.indexOf(">Table<");
  assert.ok(explanationIndex >= 0 && sentenceIndex >= 0 && tableIndex >= 0, "all three choices render");
  assert.ok(explanationIndex < sentenceIndex && sentenceIndex < tableIndex, "order is E, S, T");
});

// Key badges and the Esc cue are a keyboard-invocation-only affordance —
// an ordinary hover reveal (focusPalette unset) must never print them.
test("SlideInsertControl only shows key badges and the Esc cue when keyboard-invoked", () => {
  const hover = renderToStaticMarkup(
    createElement(SlideInsertControl, { insertionLabel: "Insert before slide 1", onAdd: () => {}, onClose: () => {} }),
  );
  assert.doesNotMatch(hover, /lesson-document-insert-key/);
  assert.doesNotMatch(hover, /lesson-document-insert-escape/);

  const keyboard = renderToStaticMarkup(
    createElement(SlideInsertControl, { insertionLabel: "Insert before slide 1", focusPalette: true, onAdd: () => {}, onClose: () => {} }),
  );
  assert.match(keyboard, /lesson-document-insert-key" aria-hidden="true">E</);
  assert.match(keyboard, /lesson-document-insert-key" aria-hidden="true">S</);
  assert.match(keyboard, /lesson-document-insert-key" aria-hidden="true">T</);
  assert.match(keyboard, /lesson-document-insert-escape" aria-hidden="true">Esc</);
});

function tablePiece(over: Partial<SentenceBlock["languageBlocks"][number]>): SentenceBlock["languageBlocks"][number] {
  return { id: "row", spanish: "hola", callout: null, acceptedAnswers: ["hello"], ...over };
}

function tableBlock(pieces: SentenceBlock["languageBlocks"], layout: SentenceBlock["layout"] = "vocabulary_table"): SentenceBlock {
  return {
    id: "block-1",
    type: "sentence",
    layout,
    promptLabel: "",
    promptText: "",
    helperText: "",
    answerFeedback: null,
    languageBlocks: pieces,
  };
}

const noop = () => {};
const noopPiece = () => "";

const stubBuilderActions: LessonBuilderActions = {
  conceptDisplays: {},
  recordConceptDisplay: () => {},
  getSyllabusMarkers: () => ({ known: new Set(), mainOfModule: new Set(), inSyllabusUncovered: new Set() }),
  getLessonReviewSplit: () => ({ introduced: [], reviewed: [], priorConceptsExist: false }),
  deletionUndo: null,
  newLesson: () => "",
  previewLesson: noop,
  duplicateLesson: noop,
  deleteLesson: noop,
  renameLesson: noop,
  toggleLessonDraft: noop,
  setLessonNotes: noop,
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
  addPiece: noopPiece,
  deletePiece: noop,
  toggleGiven: noop,
  toggleCapture: noop,
  updateCapture: noop,
  addBlock: () => ({ blockId: "" }),
  extendLastSentence: () => ({ blockId: "", languageBlockId: "" }),
  deleteBlock: noop,
  replaceLessonBlocks: noop,
  duplicateBlock: noop,
  moveBlock: noop,
  reorderBlock: noop,
  moveLessonKeyboard: () => null,
  newLessonAfter: () => null,
  undoDeletion: noop,
  endHistoryGroup: noop,
  editorUndo: () => null,
  editorRedo: () => null,
  undo: noop,
  redo: noop,
  canUndo: false,
  canRedo: false,
  flushSave: noop,
};

function renderTable(block: SentenceBlock, active: boolean) {
  const lesson: Lesson = { id: "lesson-1", name: null, concepts: [], blocks: [block] };
  return renderToStaticMarkup(
    createElement(
      EditingProvider,
      {
        lessons: [lesson],
        actions: stubBuilderActions,
        initialSelection: active
          ? { kind: "block", lessonId: "lesson-1", blockId: block.id }
          : { kind: "none" },
      },
      LessonBuilderProvider({
        value: stubBuilderActions,
        children: createElement(SentenceEditor, { lessonId: "lesson-1", block }),
      }),
    ),
  );
}

// English alternatives render as one slash-joined field (no separate
// alternatives button/count/panel), and no lightbulb "Add hint" affordance
// remains anywhere in the active toolbar.
test("sentence editing shows all accepted answers joined in one field, no alternatives/lightbulb chrome", () => {
  const block = tableBlock(
    [tablePiece({ id: "p1", spanish: "hola", acceptedAnswers: ["hello", "hi"] })],
    "sentence",
  );
  const html = renderTable(block, true);
  assert.match(html, />hello \/ hi<\/textarea>/);
  assert.doesNotMatch(html, /Alternatives/);
  assert.doesNotMatch(html, /Add hint/);
  assert.doesNotMatch(html, /Edit hint/);
});

// Sentence rest never shows a hint (only table rest is an approved
// exception) — SentencePresentation composes Spanish/English only.
test("sentence rest presentation never renders a hint pill even when a piece has an authored hint", () => {
  const block = tableBlock(
    [tablePiece({ id: "p1", spanish: "hola", acceptedAnswers: ["hello"], callout: "a greeting" })],
    "sentence",
  );
  const html = renderTable(block, false);
  assert.doesNotMatch(html, /lesson-document-hint-pill/);
  assert.doesNotMatch(html, /a greeting/);
});

// Extending the table pill pattern to sentences: an unselected pair with an
// authored hint shows the static pill while editing; a pair without one
// shows nothing (no reserved/blank slot).
test("sentence editing shows a hint pill only for an unselected pair with an authored hint", () => {
  const block = tableBlock(
    [
      tablePiece({ id: "with-hint", spanish: "hola", acceptedAnswers: ["hello"], callout: "a greeting" }),
      tablePiece({ id: "without-hint", spanish: "adios", acceptedAnswers: ["bye"], callout: null }),
    ],
    "sentence",
  );
  const html = renderTable(block, true);
  assert.match(html, /lesson-document-hint-pill" aria-label="Hint for hola">a greeting</);
  const pillCount = (html.match(/lesson-document-hint-pill"/g) ?? []).length;
  assert.equal(pillCount, 1, "only the pair with an authored hint should render a pill");
});

// No visible "Spanish"/"English" column headings, at rest or in edit —
// the vocabulary table always renders through the same structural branch
// (gated on layout, not on `active`), so one check with active=false covers
// true document rest.
test("vocabulary table never renders a visible Spanish/English column heading", () => {
  const block = tableBlock([tablePiece({ id: "a", spanish: "a", acceptedAnswers: ["to"] })]);
  const restHtml = renderTable(block, false);
  const editHtml = renderTable(block, true);
  assert.doesNotMatch(restHtml, />Spanish</);
  assert.doesNotMatch(restHtml, />English</);
  assert.doesNotMatch(editHtml, />Spanish</);
  assert.doesNotMatch(editHtml, />English</);
});

// Table rest presentation shows an authored hint as a plain text pill
// tied to its row, and shows nothing (no blank/reserved slot) for rows
// without one — never an always-present third column.
test("vocabulary table rest shows a hint pill only for rows with an authored hint", () => {
  const block = tableBlock([
    tablePiece({ id: "with-hint", spanish: "tienda", acceptedAnswers: ["store"], callout: "a shop" }),
    tablePiece({ id: "without-hint", spanish: "casa", acceptedAnswers: ["house"], callout: null }),
  ]);
  const html = renderTable(block, false);
  assert.match(html, /lesson-document-hint-pill" aria-label="Hint for tienda">a shop</);
  const pillCount = (html.match(/lesson-document-hint-pill"/g) ?? []).length;
  assert.equal(pillCount, 1, "only the row with an authored hint should render a pill");
});
