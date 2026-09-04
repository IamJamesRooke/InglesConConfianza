import type {
  Lesson,
  LessonConcept,
  SentenceBlock,
} from "@/lib/lesson-builder/types";

export function normalizeAnswer(answer: string) {
  return answer.trim().replace(/\s+/g, " ");
}

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function normalizeLessonConcept(
  concept: Partial<LessonConcept>,
): LessonConcept {
  return {
    id: concept.id ?? createId("lesson_concept"),
    conceptId: concept.conceptId ?? null,
    label: concept.label ?? "",
  };
}

export function normalizeLessons(lessons: Lesson[]) {
  return lessons.map((lesson) => ({
    id: lesson.id,
    name: lesson.name,
    concepts: (lesson.concepts ?? []).map(normalizeLessonConcept),
    blocks: lesson.blocks.map((block) => {
      if (block.type === "explanation") {
        return {
          id: block.id,
          type: block.type,
          contentMarkdown: block.contentMarkdown,
        };
      }

      return {
        id: block.id,
        type: block.type,
        ...(block.layout === "vocabulary_table" ? { layout: block.layout } : {}),
        promptLabel: block.promptLabel,
        promptText: block.promptText,
        helperText: block.helperText,
        answerFeedback: block.answerFeedback,
        languageBlocks: block.languageBlocks.map((languageBlock) => ({
          id: languageBlock.id,
          spanish: languageBlock.spanish,
          callout: languageBlock.callout,
          acceptedAnswers: [...languageBlock.acceptedAnswers],
        })),
      };
    }),
  }));
}

export function getAnswerValidationMessage(
  answers: string[],
  answerIndex: number,
) {
  const normalizedAnswer = normalizeAnswer(answers[answerIndex] ?? "");

  if (!normalizedAnswer) {
    return answerIndex === 0
      ? "Primary English answer is required."
      : "Complete or remove this alternative.";
  }

  const duplicateCount = answers.filter(
    (answer) => normalizeAnswer(answer) === normalizedAnswer,
  ).length;

  return duplicateCount > 1 ? "This answer is duplicated." : null;
}

export function getSentenceValidationIssueCount(sentence: SentenceBlock) {
  if (sentence.languageBlocks.length === 0) {
    return 1;
  }

  return sentence.languageBlocks.reduce((issueCount, languageBlock) => {
    const spanishIssueCount = languageBlock.spanish.trim() ? 0 : 1;
    const answerIssueCount = languageBlock.acceptedAnswers.reduce(
      (answerIssues, _, answerIndex) =>
        answerIssues +
        (getAnswerValidationMessage(
          languageBlock.acceptedAnswers,
          answerIndex,
        )
          ? 1
          : 0),
      0,
    );

    return issueCount + spanishIssueCount + answerIssueCount;
  }, 0);
}
