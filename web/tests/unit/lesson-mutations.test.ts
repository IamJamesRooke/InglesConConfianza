import assert from "node:assert/strict";
import test from "node:test";

import * as m from "../../src/lib/lesson-builder/mutations";
import { lessonsReducer } from "../../src/lib/lesson-builder/reducer";
import type {
  Lesson,
  LessonModule,
  SentenceBlock,
} from "../../src/lib/lesson-builder/types";

function sentenceBlock(overrides: Partial<SentenceBlock> = {}): SentenceBlock {
  return {
    id: "b1",
    type: "sentence",
    promptLabel: "",
    promptText: "",
    helperText: "",
    answerFeedback: null,
    languageBlocks: [
      { id: "l1", spanish: "", callout: null, acceptedAnswers: [""] },
    ],
    ...overrides,
  };
}

function baseLessons(): Lesson[] {
  return [
    { id: "lesson_a", name: "A", concepts: [], blocks: [sentenceBlock()] },
    { id: "lesson_b", name: null, concepts: [], blocks: [] },
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

test("duplicateLesson inserts a deep copy after its source", () => {
  const lessons: Lesson[] = [
    {
      id: "lesson_a",
      name: "A useful lesson",
      concepts: [{ id: "lc1", conceptId: "concept_a", label: "concept" }],
      blocks: [sentenceBlock()],
    },
    { id: "lesson_b", name: "B", concepts: [], blocks: [] },
  ];

  const next = m.duplicateLesson(lessons, "lesson_a", "lesson_copy");
  assert.deepEqual(
    next.map((lesson) => lesson.id),
    ["lesson_a", "lesson_copy", "lesson_b"],
  );
  assert.equal(next[1].name, "A useful lesson (copy)");
  assert.notEqual(next[1].concepts[0].id, lessons[0].concepts[0].id);
  const originalBlock = lessons[0].blocks[0] as SentenceBlock;
  const copiedBlock = next[1].blocks[0] as SentenceBlock;
  assert.notEqual(copiedBlock.id, originalBlock.id);
  assert.notEqual(
    copiedBlock.languageBlocks[0].id,
    originalBlock.languageBlocks[0].id,
  );
});

test("duplicateLessonStructure preserves slide-type sequence but empties every slide", () => {
  const lessons: Lesson[] = [
    {
      id: "lesson_a",
      name: "A useful lesson",
      concepts: [{ id: "lc1", conceptId: "concept_a", label: "concept" }],
      blocks: [
        { id: "e1", type: "explanation", contentMarkdown: "Some **notes**." },
        sentenceBlock({
          id: "s1",
          promptText: "Fill in the blank",
          languageBlocks: [
            {
              id: "l1",
              spanish: "hola",
              callout: "a hint",
              acceptedAnswers: ["hello", "hi"],
              given: true,
            },
            {
              id: "l2",
              spanish: "adios",
              callout: null,
              acceptedAnswers: ["bye"],
            },
          ],
        }),
        sentenceBlock({
          id: "t1",
          layout: "vocabulary_table",
          languageBlocks: [
            { id: "l3", spanish: "gato", callout: null, acceptedAnswers: ["cat"] },
          ],
        }),
      ],
    },
    { id: "lesson_b", name: "B", concepts: [], blocks: [] },
  ];
  const modules: LessonModule[] = [
    { id: "mod_1", name: "Module 1", lessonIds: ["lesson_a", "lesson_b"] },
  ];

  const result = m.duplicateLessonStructure(lessons, modules, "lesson_a");

  // New lesson lands right after its source, both in lessons and modules.
  assert.deepEqual(
    result.lessons.map((lesson) => lesson.id),
    ["lesson_a", result.newLessonId, "lesson_b"],
  );
  assert.deepEqual(result.modules[0].lessonIds, [
    "lesson_a",
    result.newLessonId,
    "lesson_b",
  ]);

  const skeleton = result.lessons[1];
  assert.equal(skeleton.name, null);
  assert.deepEqual(skeleton.concepts, []);

  // Same sequence of slide types, same vocabulary-table layout, fresh ids.
  assert.deepEqual(
    skeleton.blocks.map((block) =>
      block.type === "sentence" ? block.layout ?? "sentence" : "explanation",
    ),
    ["explanation", "sentence", "vocabulary_table"],
  );
  const originalIds = lessons[0].blocks.map((block) => block.id);
  skeleton.blocks.forEach((block, index) => {
    assert.notEqual(block.id, originalIds[index]);
  });

  const explanation = skeleton.blocks[0];
  assert.equal(explanation.type, "explanation");
  if (explanation.type === "explanation") {
    assert.equal(explanation.contentMarkdown, "");
  }

  const sentence = skeleton.blocks[1] as SentenceBlock;
  assert.equal(sentence.promptText, "");
  assert.equal(sentence.languageBlocks.length, 1);
  assert.equal(sentence.languageBlocks[0].spanish, "");
  assert.equal(sentence.languageBlocks[0].callout, null);
  assert.deepEqual(sentence.languageBlocks[0].acceptedAnswers, [""]);
  assert.equal(sentence.languageBlocks[0].given, undefined);
  assert.notEqual(
    sentence.languageBlocks[0].id,
    (lessons[0].blocks[1] as SentenceBlock).languageBlocks[0].id,
  );

  const table = skeleton.blocks[2] as SentenceBlock;
  assert.equal(table.layout, "vocabulary_table");
  assert.equal(table.languageBlocks.length, 1);
  assert.equal(table.languageBlocks[0].spanish, "");

  // Pure: never mutates the inputs.
  assert.equal(lessons[0].blocks.length, 3);
  assert.equal(modules[0].lessonIds.length, 2);
});

test("duplicateLessonStructure is a no-op when the source lesson doesn't exist", () => {
  const lessons = baseLessons();
  const modules: LessonModule[] = [
    { id: "mod_1", name: null, lessonIds: ["lesson_a", "lesson_b"] },
  ];
  const result = m.duplicateLessonStructure(lessons, modules, "missing");
  assert.equal(result.lessons, lessons);
  assert.equal(result.modules, modules);
  assert.ok(result.newLessonId);
});

test("moveLesson reorders with before/after and adjusts for removal", () => {
  const lessons: Lesson[] = ["a", "b", "c"].map((id) => ({
    id,
    name: null,
    concepts: [],
    blocks: [],
  }));
  assert.deepEqual(
    m
      .moveLesson(lessons, { draggedId: "a", targetId: "c", position: "after" })
      .map((l) => l.id),
    ["b", "c", "a"],
  );
  assert.deepEqual(
    m
      .moveLesson(lessons, {
        draggedId: "c",
        targetId: "a",
        position: "before",
      })
      .map((l) => l.id),
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
      concepts: [],
      blocks: [sentenceBlock()],
    },
  ];
  const next = m.duplicateContentBlock(lessons, "lesson_a", "b1");
  assert.equal(next[0].blocks.length, 2);
  const [original, copy] = next[0].blocks as SentenceBlock[];
  assert.notEqual(original.id, copy.id);
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
      concepts: [],
      blocks: [
        sentenceBlock({
          languageBlocks: ["l1", "l2", "l3"].map((id) => ({
            id,
            spanish: "",
            callout: null,
            acceptedAnswers: [""],
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

test("targeted deletion restore preserves edits made after deletion", () => {
  const removedBlock = baseLessons()[0].blocks[0];
  let lessons = m.deleteContentBlock(baseLessons(), "lesson_a", "b1");
  lessons = m.renameLesson(lessons, "lesson_b", "Written afterwards");
  lessons = m.restoreContentBlock(lessons, "lesson_a", removedBlock, 0);
  assert.equal(lessons[1].name, "Written afterwards");
  assert.equal(lessons[0].blocks[0].id, "b1");

  const removedPiece = (lessons[0].blocks[0] as SentenceBlock)
    .languageBlocks[0];
  lessons = m.deleteLanguageBlock(lessons, "lesson_a", "b1", "l1");
  lessons = m.renameLesson(lessons, "lesson_b", "Still here");
  lessons = m.restoreLanguageBlock(lessons, "lesson_a", "b1", removedPiece, 0);
  assert.equal(lessons[1].name, "Still here");
  assert.equal(
    (lessons[0].blocks[0] as SentenceBlock).languageBlocks[0].id,
    "l1",
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

test("lesson concepts add / remove", () => {
  let lessons = m.addLessonConcept(baseLessons(), "lesson_a", {
    id: "lc1",
    conceptId: "concept_x",
    label: "querer",
  });
  lessons = m.addLessonConcept(lessons, "lesson_a", {
    id: "lc2",
    conceptId: null,
    label: "freehand",
  });
  assert.deepEqual(
    lessons[0].concepts.map((c) => c.label),
    ["querer", "freehand"],
  );
  lessons = m.relabelLessonConcept(lessons, "lesson_a", "lc2", "renamed");
  assert.equal(lessons[0].concepts[1].label, "renamed");
  lessons = m.removeLessonConcept(lessons, "lesson_a", "lc1");
  assert.deepEqual(
    lessons[0].concepts.map((c) => c.id),
    ["lc2"],
  );
});

test("createLesson seeds an empty concepts array", () => {
  const lessons = m.createLesson(baseLessons(), "lesson_c");
  assert.deepEqual(lessons[2].concepts, []);
});

test("toggleGiven sets and clears the given flag", () => {
  let lessons = m.toggleGiven(baseLessons(), "lesson_a", "b1", "l1");
  assert.equal(
    (lessons[0].blocks[0] as SentenceBlock).languageBlocks[0].given,
    true,
  );
  lessons = m.toggleGiven(lessons, "lesson_a", "b1", "l1");
  assert.equal(
    (lessons[0].blocks[0] as SentenceBlock).languageBlocks[0].given,
    undefined,
  );
});

function chainLessons(): Lesson[] {
  return [
    {
      id: "lesson_a",
      name: "A",
      concepts: [],
      blocks: [
        sentenceBlock({
          id: "b1",
          languageBlocks: [
            { id: "l1", spanish: "Quiero", callout: null, acceptedAnswers: ["I want"] },
            { id: "l2", spanish: "saber", callout: null, acceptedAnswers: ["to know"] },
            { id: "l3", spanish: "algo.", callout: null, acceptedAnswers: ["something."] },
          ],
        }),
      ],
    },
  ];
}

test("extendLastSentence copies the preceding sentence slide's pieces, strips terminal punctuation, and appends one empty pair", () => {
  const next = m.extendLastSentence(chainLessons(), "lesson_a", "b1", "b2", "l_new");
  const lesson = next[0];
  assert.equal(lesson.blocks.length, 2);
  const extended = lesson.blocks[1] as SentenceBlock;
  assert.equal(extended.id, "b2");
  assert.equal(extended.languageBlocks.length, 4);
  assert.deepEqual(
    extended.languageBlocks.map((p) => p.spanish),
    ["Quiero", "saber", "algo", ""],
  );
  assert.deepEqual(
    extended.languageBlocks.map((p) => p.acceptedAnswers[0]),
    ["I want", "to know", "something", ""],
  );
  assert.equal(extended.languageBlocks[3].id, "l_new");
  // Deep copies, not references — fresh ids for every copied piece.
  const originalIds = (lesson.blocks[0] as SentenceBlock).languageBlocks.map((p) => p.id);
  for (const piece of extended.languageBlocks.slice(0, 3)) {
    assert.ok(!originalIds.includes(piece.id));
  }
  // The source slide itself is untouched.
  assert.deepEqual(
    (lesson.blocks[0] as SentenceBlock).languageBlocks.map((p) => p.spanish),
    ["Quiero", "saber", "algo."],
  );
});

test("extendLastSentence preserves a copied piece's given flag except on the (punctuation-stripped) last piece", () => {
  const lessons = chainLessons();
  const sentence = lessons[0].blocks[0] as SentenceBlock;
  sentence.languageBlocks[1] = { ...sentence.languageBlocks[1], given: true };
  const next = m.extendLastSentence(lessons, "lesson_a", "b1", "b2", "l_new");
  const extended = next[0].blocks[1] as SentenceBlock;
  assert.equal(extended.languageBlocks[1].given, true);
  assert.equal(extended.languageBlocks[0].given, undefined);
});

test("extendLastSentence with no preceding sentence slide behaves like inserting a plain sentence", () => {
  const lessons: Lesson[] = [
    {
      id: "lesson_a",
      name: null,
      concepts: [],
      blocks: [{ id: "e1", type: "explanation", contentMarkdown: "hola" }],
    },
  ];
  const next = m.extendLastSentence(lessons, "lesson_a", "e1", "b1", "l1");
  const block = next[0].blocks[1] as SentenceBlock;
  assert.equal(block.languageBlocks.length, 1);
  assert.equal(block.languageBlocks[0].id, "l1");
  assert.equal(block.languageBlocks[0].spanish, "");
});

test("extendLastSentence with afterBlockId null inserts at index 0", () => {
  const next = m.extendLastSentence(baseLessons(), "lesson_a", null, "b_new", "l_new");
  assert.equal(next[0].blocks[0].id, "b_new");
  assert.equal(next[0].blocks.length, 2);
});

test("extendLastSentence skips a vocabulary table when searching for a preceding sentence to copy", () => {
  const lessons: Lesson[] = [
    {
      id: "lesson_a",
      name: null,
      concepts: [],
      blocks: [
        sentenceBlock({
          id: "b1",
          languageBlocks: [
            { id: "l1", spanish: "Quiero", callout: null, acceptedAnswers: ["I want"] },
          ],
        }),
        sentenceBlock({
          id: "vt1",
          layout: "vocabulary_table",
          languageBlocks: [
            { id: "v1", spanish: "con", callout: null, acceptedAnswers: ["with"] },
          ],
        }),
      ],
    },
  ];
  const next = m.extendLastSentence(lessons, "lesson_a", "vt1", "b2", "l_new");
  const extended = next[0].blocks[2] as SentenceBlock;
  assert.deepEqual(
    extended.languageBlocks.map((p) => p.spanish),
    ["Quiero", ""],
  );
});
