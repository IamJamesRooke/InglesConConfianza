import type {
  Lesson,
  LessonConcept,
  SentenceBlock,
} from "@/lib/lesson-builder/types";

export function normalizeAnswer(answer: string) {
  return answer.trim().replace(/\s+/g, " ");
}

export type DiffPart = { value: string; type: "equal" | "insert" | "delete" };

/**
 * Character-level diff turning `from` into `to` (classic LCS backtrack).
 * "delete" = chars in `from` not in `to` (the learner should remove them);
 * "insert" = chars in `to` not in `from` (the learner should add them).
 */
export function diffChars(from: string, to: string): DiffPart[] {
  const n = from.length;
  const m = to.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        from[i] === to[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const parts: DiffPart[] = [];
  const push = (type: DiffPart["type"], value: string) => {
    const last = parts[parts.length - 1];
    if (last && last.type === type) last.value += value;
    else parts.push({ type, value });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (from[i] === to[j]) {
      push("equal", from[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push("delete", from[i]);
      i++;
    } else {
      push("insert", to[j]);
      j++;
    }
  }
  while (i < n) push("delete", from[i++]);
  while (j < m) push("insert", to[j++]);
  return parts;
}

/** Picks whichever accepted answer is the smallest edit away from what the learner typed. */
export function pickClosestAnswer(
  userAnswer: string,
  acceptedAnswers: string[],
): string {
  if (acceptedAnswers.length <= 1) return acceptedAnswers[0] ?? "";
  let best = acceptedAnswers[0];
  let bestCost = Infinity;
  for (const candidate of acceptedAnswers) {
    const cost = diffChars(userAnswer, candidate).reduce(
      (sum, part) => sum + (part.type === "equal" ? 0 : part.value.length),
      0,
    );
    if (cost < bestCost) {
      bestCost = cost;
      best = candidate;
    }
  }
  return best;
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
