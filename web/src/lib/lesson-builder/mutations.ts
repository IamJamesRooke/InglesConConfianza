import type {
  ExplanationBlock,
  LanguageBlock,
  Lesson,
  LessonBlock,
  LessonConcept,
  SentenceBlock,
} from "@/lib/lesson-builder/types";
import { createId } from "@/lib/lesson-builder/utils";

// Pure `Lesson[] -> Lesson[]` transforms behind every editing action in the
// lesson builder. No React, no DOM, no id generation for the caller to observe
// (ids that the UI must focus afterwards are passed in). Unit-tested in
// mutations.test.ts; wrapped by the reducer in reducer.ts.

type Reorder = {
  draggedId: string;
  targetId: string;
  position: "before" | "after";
};

function reorder<T extends { id: string }>(items: T[], move: Reorder): T[] {
  const draggedIndex = items.findIndex((item) => item.id === move.draggedId);
  const targetIndex = items.findIndex((item) => item.id === move.targetId);
  if (draggedIndex === -1 || targetIndex === -1) {
    return items;
  }

  const next = [...items];
  const [dragged] = next.splice(draggedIndex, 1);
  const adjustedTarget =
    targetIndex > draggedIndex ? targetIndex - 1 : targetIndex;
  const insertionIndex =
    move.position === "after" ? adjustedTarget + 1 : adjustedTarget;
  next.splice(insertionIndex, 0, dragged);
  return next;
}

function mapLesson(
  lessons: Lesson[],
  lessonId: string,
  update: (lesson: Lesson) => Lesson,
): Lesson[] {
  return lessons.map((lesson) =>
    lesson.id === lessonId ? update(lesson) : lesson,
  );
}

function mapSentenceBlock(
  lessons: Lesson[],
  lessonId: string,
  sentenceBlockId: string,
  update: (block: SentenceBlock) => SentenceBlock,
): Lesson[] {
  return mapLesson(lessons, lessonId, (lesson) => ({
    ...lesson,
    blocks: lesson.blocks.map((block) =>
      block.id === sentenceBlockId && block.type === "sentence"
        ? update(block)
        : block,
    ),
  }));
}

function mapLanguageBlock(
  lessons: Lesson[],
  lessonId: string,
  sentenceBlockId: string,
  languageBlockId: string,
  update: (languageBlock: LanguageBlock) => LanguageBlock,
): Lesson[] {
  return mapSentenceBlock(lessons, lessonId, sentenceBlockId, (block) => ({
    ...block,
    languageBlocks: block.languageBlocks.map((languageBlock) =>
      languageBlock.id === languageBlockId
        ? update(languageBlock)
        : languageBlock,
    ),
  }));
}

function emptyLanguageBlock(id: string): LanguageBlock {
  return {
    id,
    spanish: "",
    callout: null,
    acceptedAnswers: [""],
  };
}

// --- Lessons ---------------------------------------------------------------

export function createLesson(lessons: Lesson[], lessonId: string): Lesson[] {
  return [...lessons, { id: lessonId, name: null, concepts: [], blocks: [] }];
}

export function duplicateLesson(
  lessons: Lesson[],
  lessonId: string,
  duplicateId: string,
): Lesson[] {
  const sourceIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (sourceIndex === -1) return lessons;

  const source = lessons[sourceIndex];
  const duplicate: Lesson = {
    ...source,
    id: duplicateId,
    name: `${source.name ?? "Untitled lesson"} (copy)`,
    concepts: source.concepts.map((concept) => ({
      ...concept,
      id: createId("lesson_concept"),
    })),
    blocks: source.blocks.map((block) =>
      block.type === "explanation"
        ? { ...block, id: createId("block") }
        : {
            ...block,
            id: createId("block"),
            languageBlocks: block.languageBlocks.map((languageBlock) => ({
              ...languageBlock,
              id: createId("lang"),
              acceptedAnswers: [...languageBlock.acceptedAnswers],
            })),
          },
    ),
  };

  return lessons.toSpliced(sourceIndex + 1, 0, duplicate);
}

export function addLessonConcept(
  lessons: Lesson[],
  lessonId: string,
  concept: LessonConcept,
): Lesson[] {
  return mapLesson(lessons, lessonId, (lesson) => ({
    ...lesson,
    concepts: [...lesson.concepts, concept],
  }));
}

export function removeLessonConcept(
  lessons: Lesson[],
  lessonId: string,
  lessonConceptId: string,
): Lesson[] {
  return mapLesson(lessons, lessonId, (lesson) => ({
    ...lesson,
    concepts: lesson.concepts.filter(
      (concept) => concept.id !== lessonConceptId,
    ),
  }));
}

export function relabelLessonConcept(
  lessons: Lesson[],
  lessonId: string,
  lessonConceptId: string,
  label: string,
): Lesson[] {
  return mapLesson(lessons, lessonId, (lesson) => ({
    ...lesson,
    concepts: lesson.concepts.map((concept) =>
      concept.id === lessonConceptId ? { ...concept, label } : concept,
    ),
  }));
}

export function renameLesson(
  lessons: Lesson[],
  lessonId: string,
  name: string,
): Lesson[] {
  return mapLesson(lessons, lessonId, (lesson) => ({
    ...lesson,
    name: name.trimStart() || null,
  }));
}

export function setLessonStatus(
  lessons: Lesson[],
  lessonId: string,
  status: "draft" | "published",
): Lesson[] {
  return mapLesson(lessons, lessonId, (lesson) => ({
    ...lesson,
    ...(status === "draft" ? { status } : { status: undefined }),
  }));
}

export function setLessonNotes(
  lessons: Lesson[],
  lessonId: string,
  notes: string,
): Lesson[] {
  return mapLesson(lessons, lessonId, (lesson) => ({
    ...lesson,
    notes,
  }));
}

export function deleteLesson(lessons: Lesson[], lessonId: string): Lesson[] {
  return lessons.filter((lesson) => lesson.id !== lessonId);
}

export function moveLesson(
  lessons: Lesson[],
  move: Reorder,
): Lesson[] {
  return reorder(lessons, move);
}

// Restore a specific lesson order by id (used to roll back a failed reorder
// save). Ids not present are dropped; lessons missing from the list are dropped.
export function setLessonOrder(
  lessons: Lesson[],
  lessonIds: string[],
): Lesson[] {
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  return lessonIds
    .map((lessonId) => byId.get(lessonId))
    .filter((lesson): lesson is Lesson => Boolean(lesson));
}

// --- Content blocks -------------------------------------------------------

export function addExplanationBlock(
  lessons: Lesson[],
  lessonId: string,
  insertionIndex: number,
  blockId: string,
): Lesson[] {
  const block: ExplanationBlock = {
    id: blockId,
    type: "explanation",
    contentMarkdown: "",
  };
  return mapLesson(lessons, lessonId, (lesson) => ({
    ...lesson,
    blocks: lesson.blocks.toSpliced(insertionIndex, 0, block),
  }));
}

export function addSentenceBlock(
  lessons: Lesson[],
  lessonId: string,
  insertionIndex: number,
  blockId: string,
  languageBlockId: string,
  layout: "sentence" | "vocabulary_table" = "sentence",
): Lesson[] {
  const languageBlocks: LanguageBlock[] = [emptyLanguageBlock(languageBlockId)];
  const block: SentenceBlock = {
    id: blockId,
    type: "sentence",
    ...(layout === "vocabulary_table" ? { layout } : {}),
    promptLabel: "",
    promptText: "",
    helperText: "",
    answerFeedback: null,
    languageBlocks,
  };
  return mapLesson(lessons, lessonId, (lesson) => ({
    ...lesson,
    blocks: lesson.blocks.toSpliced(insertionIndex, 0, block),
  }));
}

export function deleteContentBlock(
  lessons: Lesson[],
  lessonId: string,
  blockId: string,
): Lesson[] {
  return mapLesson(lessons, lessonId, (lesson) => ({
    ...lesson,
    blocks: lesson.blocks.filter((block) => block.id !== blockId),
  }));
}

export function restoreContentBlock(
  lessons: Lesson[],
  lessonId: string,
  block: Lesson["blocks"][number],
  insertionIndex: number,
): Lesson[] {
  return mapLesson(lessons, lessonId, (lesson) => ({
    ...lesson,
    blocks: lesson.blocks.some((candidate) => candidate.id === block.id)
      ? lesson.blocks
      : lesson.blocks.toSpliced(insertionIndex, 0, block),
  }));
}

export function duplicateContentBlock(
  lessons: Lesson[],
  lessonId: string,
  blockId: string,
): Lesson[] {
  return mapLesson(lessons, lessonId, (lesson) => {
    const sourceIndex = lesson.blocks.findIndex(
      (block) => block.id === blockId,
    );
    if (sourceIndex === -1) {
      return lesson;
    }

    const sourceBlock = lesson.blocks[sourceIndex];
    const duplicatedBlock =
      sourceBlock.type === "explanation"
        ? { ...sourceBlock, id: createId("block") }
        : {
            ...sourceBlock,
            id: createId("block"),
            languageBlocks: sourceBlock.languageBlocks.map((languageBlock) => ({
              ...languageBlock,
              id: createId("lang"),
              acceptedAnswers: [...languageBlock.acceptedAnswers],
            })),
          };

    const blocks = [...lesson.blocks];
    blocks.splice(sourceIndex + 1, 0, duplicatedBlock);
    return { ...lesson, blocks };
  });
}

export function moveContentBlock(
  lessons: Lesson[],
  lessonId: string,
  move: Reorder,
): Lesson[] {
  return mapLesson(lessons, lessonId, (lesson) => ({
    ...lesson,
    blocks: reorder(lesson.blocks, move),
  }));
}

// --- Explanation block ---------------------------------------------------

export function updateExplanationBlock(
  lessons: Lesson[],
  lessonId: string,
  blockId: string,
  contentMarkdown: string,
): Lesson[] {
  return mapLesson(lessons, lessonId, (lesson) => ({
    ...lesson,
    blocks: lesson.blocks.map((block) =>
      block.id === blockId && block.type === "explanation"
        ? { ...block, contentMarkdown }
        : block,
    ),
  }));
}

// --- Sentence block fields ----------------------------------------------

export function updateSentenceBlock(
  lessons: Lesson[],
  lessonId: string,
  sentenceBlockId: string,
  patch: Partial<
    Pick<
      SentenceBlock,
      "promptLabel" | "promptText" | "helperText" | "answerFeedback"
    >
  >,
): Lesson[] {
  return mapSentenceBlock(lessons, lessonId, sentenceBlockId, (block) => ({
    ...block,
    ...patch,
  }));
}

// --- Language blocks ---------------------------------------------------

export function addLanguageBlock(
  lessons: Lesson[],
  lessonId: string,
  sentenceBlockId: string,
  languageBlockId: string,
): Lesson[] {
  return mapSentenceBlock(lessons, lessonId, sentenceBlockId, (block) => ({
    ...block,
    languageBlocks: [
      ...block.languageBlocks,
      emptyLanguageBlock(languageBlockId),
    ],
  }));
}

export function deleteLanguageBlock(
  lessons: Lesson[],
  lessonId: string,
  sentenceBlockId: string,
  languageBlockId: string,
): Lesson[] {
  return mapSentenceBlock(lessons, lessonId, sentenceBlockId, (block) => ({
    ...block,
    languageBlocks: block.languageBlocks.filter(
      (languageBlock) => languageBlock.id !== languageBlockId,
    ),
  }));
}

export function restoreLanguageBlock(
  lessons: Lesson[],
  lessonId: string,
  sentenceBlockId: string,
  languageBlock: LanguageBlock,
  insertionIndex: number,
): Lesson[] {
  return mapSentenceBlock(lessons, lessonId, sentenceBlockId, (block) => ({
    ...block,
    languageBlocks: block.languageBlocks.some((candidate) => candidate.id === languageBlock.id)
      ? block.languageBlocks
      : block.languageBlocks.toSpliced(insertionIndex, 0, languageBlock),
  }));
}

export function updateLanguageBlock(
  lessons: Lesson[],
  lessonId: string,
  sentenceBlockId: string,
  languageBlockId: string,
  patch: Partial<Pick<LanguageBlock, "spanish" | "callout">>,
): Lesson[] {
  return mapLanguageBlock(
    lessons,
    lessonId,
    sentenceBlockId,
    languageBlockId,
    (languageBlock) => ({ ...languageBlock, ...patch }),
  );
}

export function moveLanguageBlock(
  lessons: Lesson[],
  lessonId: string,
  sentenceBlockId: string,
  move: Reorder,
): Lesson[] {
  return mapSentenceBlock(lessons, lessonId, sentenceBlockId, (block) => ({
    ...block,
    languageBlocks: reorder(block.languageBlocks, move),
  }));
}

// Strips trailing terminal punctuation (.?!… and runs of them, e.g. "?!")
// from one piece of text — used when a sentence slide is extended, per
// docs/design/lesson-script-grammar.md's `> +` semantics: the copied last
// piece loses its terminal punctuation (both languages) so the teacher
// retypes it on the new trailing pair rather than inheriting a stray
// mid-sentence period.
function stripTerminalPunctuation(text: string): string {
  return text.replace(/[.?!…]+\s*$/u, "").trimEnd();
}

function isSentenceSlide(block: LessonBlock | undefined): block is SentenceBlock {
  return Boolean(block && block.type === "sentence" && block.layout !== "vocabulary_table");
}

// E3b — "extend the last sentence": inserts a new sentence slide right after
// `afterBlockId` (or at index 0 when `afterBlockId` is null, e.g. from the
// lesson title) whose pieces are deep copies (new ids) of the nearest
// *preceding* sentence slide's pieces — never a table — plus one new empty
// pair. The copied last piece has its terminal punctuation stripped in both
// languages; the teacher retypes it on the new pair. With no preceding
// sentence slide to copy, this degrades to inserting a plain empty sentence
// slide (identical to `addSentenceBlock`).
export function extendLastSentence(
  lessons: Lesson[],
  lessonId: string,
  afterBlockId: string | null,
  blockId: string,
  languageBlockId: string,
): Lesson[] {
  return mapLesson(lessons, lessonId, (lesson) => {
    let insertionIndex: number;
    if (afterBlockId === null) {
      insertionIndex = 0;
    } else {
      const anchorIndex = lesson.blocks.findIndex((block) => block.id === afterBlockId);
      if (anchorIndex === -1) return lesson;
      insertionIndex = anchorIndex + 1;
    }

    let sourceIndex = insertionIndex - 1;
    while (sourceIndex >= 0 && !isSentenceSlide(lesson.blocks[sourceIndex])) {
      sourceIndex -= 1;
    }
    const source = sourceIndex >= 0 ? (lesson.blocks[sourceIndex] as SentenceBlock) : undefined;

    const copiedPieces: LanguageBlock[] = source
      ? source.languageBlocks.map((piece, index) => {
          const isLastPiece = index === source.languageBlocks.length - 1;
          return {
            id: createId("lang"),
            spanish: isLastPiece ? stripTerminalPunctuation(piece.spanish) : piece.spanish,
            callout: piece.callout,
            acceptedAnswers: isLastPiece
              ? piece.acceptedAnswers.map(stripTerminalPunctuation)
              : [...piece.acceptedAnswers],
            ...(piece.given ? { given: true as const } : {}),
          };
        })
      : [];

    const block: SentenceBlock = {
      id: blockId,
      type: "sentence",
      promptLabel: "",
      promptText: "",
      helperText: "",
      answerFeedback: null,
      languageBlocks: [...copiedPieces, emptyLanguageBlock(languageBlockId)],
    };

    return { ...lesson, blocks: lesson.blocks.toSpliced(insertionIndex, 0, block) };
  });
}

// --- Accepted answers ------------------------------------------------

export function updateAcceptedAnswer(
  lessons: Lesson[],
  lessonId: string,
  sentenceBlockId: string,
  languageBlockId: string,
  answerIndex: number,
  value: string,
): Lesson[] {
  return mapLanguageBlock(
    lessons,
    lessonId,
    sentenceBlockId,
    languageBlockId,
    (languageBlock) => ({
      ...languageBlock,
      acceptedAnswers: languageBlock.acceptedAnswers.map((answer, index) =>
        index === answerIndex ? value : answer,
      ),
    }),
  );
}

export function addAcceptedAnswer(
  lessons: Lesson[],
  lessonId: string,
  sentenceBlockId: string,
  languageBlockId: string,
): Lesson[] {
  return mapLanguageBlock(
    lessons,
    lessonId,
    sentenceBlockId,
    languageBlockId,
    (languageBlock) => ({
      ...languageBlock,
      acceptedAnswers: [...languageBlock.acceptedAnswers, ""],
    }),
  );
}

export function toggleGiven(
  lessons: Lesson[],
  lessonId: string,
  sentenceBlockId: string,
  languageBlockId: string,
): Lesson[] {
  return mapLanguageBlock(
    lessons,
    lessonId,
    sentenceBlockId,
    languageBlockId,
    (languageBlock) => {
      if (!languageBlock.given) return { ...languageBlock, given: true };
      const rest: LanguageBlock = { ...languageBlock };
      delete rest.given;
      return rest;
    },
  );
}

export function removeAcceptedAnswer(
  lessons: Lesson[],
  lessonId: string,
  sentenceBlockId: string,
  languageBlockId: string,
  answerIndex: number,
): Lesson[] {
  return mapLanguageBlock(
    lessons,
    lessonId,
    sentenceBlockId,
    languageBlockId,
    (languageBlock) => ({
      ...languageBlock,
      acceptedAnswers: languageBlock.acceptedAnswers.filter(
        (_, index) => index !== answerIndex,
      ),
    }),
  );
}
