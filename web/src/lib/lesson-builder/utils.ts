import type {
  Lesson,
  LessonConcept,
  SentenceBlock,
} from "@/lib/lesson-builder/types";

export function normalizeAnswer(answer: string) {
  return answer.trim().replace(/\s+/g, " ").toLowerCase();
}

// Some legacy lesson content stores multiple accepted alternates joined as a
// single "answer one; answer two" string instead of separate array entries
// (see scripts/archive/audit-lessons-answers.ts). This does not change stored data —
// it only widens matching at read time so a learner who types just the first
// alternate is not marked wrong forever.
function expandLegacyAlternates(acceptedAnswers: string[]): string[] {
  return acceptedAnswers.flatMap((answer) =>
    answer.includes("; ") ? answer.split("; ") : [answer],
  );
}

/** Whether `answer` matches one of `acceptedAnswers`, case-insensitively and
 * including legacy semicolon-joined alternates. Empty input never matches. */
export function isAnswerAccepted(
  answer: string,
  acceptedAnswers: string[],
): boolean {
  const normalizedAnswer = normalizeAnswer(answer);
  if (!normalizedAnswer) return false;
  return expandLegacyAlternates(acceptedAnswers).some(
    (acceptedAnswer) => normalizeAnswer(acceptedAnswer) === normalizedAnswer,
  );
}

/** A language block is "real" only if it has a Spanish prompt or at least one
 * non-blank accepted answer — a dangling fully-blank block is authoring debris,
 * not a question, and should not render or count toward completion. */
export function isMeaningfulLanguageBlock(languageBlock: {
  spanish: string;
  acceptedAnswers: string[];
}): boolean {
  return (
    languageBlock.spanish.trim().length > 0 ||
    languageBlock.acceptedAnswers.some((answer) => answer.trim().length > 0)
  );
}

/** The full English sentence a set of language blocks spell out together —
 * each meaningful block's first accepted answer, joined with spaces. Shared
 * by the learner speech feature (speaks the full sentence on completion)
 * and scripts/generate-audio.ts (collects text to synthesize). */
export function sentenceEnglishText(
  languageBlocks: Array<{ spanish: string; acceptedAnswers: string[] }>,
): string {
  return languageBlocks
    .filter(isMeaningfulLanguageBlock)
    .map((block) => block.acceptedAnswers[0]?.trim() ?? "")
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
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

// A pair with no Spanish, no non-blank accepted answer, and no hint is
// junk — the same "blank pair" leaveSlide (editing.ts) prunes when a
// teacher leaves a sentence slide. Load-time normalization applies the same
// rule so a lesson file that already carries one (written before this
// pruning existed, or from any future exit path that somehow misses it)
// self-heals on the very next load rather than only on the next edit.
// Keeps at least one pair per slide, exactly like leaveSlide: if every pair
// is blank, only the first is kept rather than leaving zero.
function isBlankLanguageBlock(block: {
  spanish: string;
  acceptedAnswers: string[];
  callout: string | null;
}): boolean {
  return (
    !block.spanish.trim() &&
    block.acceptedAnswers.every((answer) => !answer.trim()) &&
    !block.callout?.trim()
  );
}

function pruneBlankLanguageBlocks<T extends { spanish: string; acceptedAnswers: string[]; callout: string | null }>(
  blocks: T[],
): T[] {
  const blanks = blocks.filter(isBlankLanguageBlock);
  if (blanks.length === 0) return blocks;
  if (blanks.length === blocks.length) return blocks.slice(0, 1);
  return blocks.filter((block) => !isBlankLanguageBlock(block));
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
        languageBlocks: pruneBlankLanguageBlocks(
          block.languageBlocks.map((languageBlock) => ({
            id: languageBlock.id,
            spanish: languageBlock.spanish,
            callout: languageBlock.callout,
            acceptedAnswers: [...languageBlock.acceptedAnswers],
            ...(languageBlock.given ? { given: true as const } : {}),
          })),
        ),
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
