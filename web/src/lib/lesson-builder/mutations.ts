import type {
  ConceptLink,
  ExplanationBlock,
  LanguageBlock,
  Lesson,
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
    conceptLinks: [],
  };
}

// --- Lessons ---------------------------------------------------------------

export function createLesson(lessons: Lesson[], lessonId: string): Lesson[] {
  return [...lessons, { id: lessonId, name: null, concepts: [], blocks: [] }];
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
  const block: SentenceBlock = {
    id: blockId,
    type: "sentence",
    ...(layout === "vocabulary_table" ? { layout } : {}),
    promptLabel: "",
    promptText: "",
    helperText: "",
    answerFeedback: null,
    conceptLinks: [],
    languageBlocks: [emptyLanguageBlock(languageBlockId)],
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
            conceptLinks: sourceBlock.conceptLinks.map((conceptLink) => ({
              ...conceptLink,
              id: createId("concept_link"),
            })),
            languageBlocks: sourceBlock.languageBlocks.map((languageBlock) => ({
              ...languageBlock,
              id: createId("lang"),
              acceptedAnswers: [...languageBlock.acceptedAnswers],
              conceptLinks: languageBlock.conceptLinks.map((conceptLink) => ({
                ...conceptLink,
                id: createId("concept_link"),
              })),
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

// --- Sentence-level concept links --------------------------------------

export function addSentenceConceptLink(
  lessons: Lesson[],
  lessonId: string,
  sentenceBlockId: string,
  conceptLink: ConceptLink,
): Lesson[] {
  return mapSentenceBlock(lessons, lessonId, sentenceBlockId, (block) => ({
    ...block,
    conceptLinks: [...block.conceptLinks, conceptLink],
  }));
}

export function updateSentenceConceptLink(
  lessons: Lesson[],
  lessonId: string,
  sentenceBlockId: string,
  conceptLinkId: string,
  updates: Partial<Omit<ConceptLink, "id">>,
): Lesson[] {
  return mapSentenceBlock(lessons, lessonId, sentenceBlockId, (block) => ({
    ...block,
    conceptLinks: block.conceptLinks.map((conceptLink) =>
      conceptLink.id === conceptLinkId
        ? { ...conceptLink, ...updates }
        : conceptLink,
    ),
  }));
}

export function removeSentenceConceptLink(
  lessons: Lesson[],
  lessonId: string,
  sentenceBlockId: string,
  conceptLinkId: string,
): Lesson[] {
  return mapSentenceBlock(lessons, lessonId, sentenceBlockId, (block) => ({
    ...block,
    conceptLinks: block.conceptLinks.filter(
      (conceptLink) => conceptLink.id !== conceptLinkId,
    ),
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
