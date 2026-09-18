import type {
  Lesson,
  LessonConcept,
  SentenceBlock,
} from "@/lib/lesson-builder/types";
import { spokenTextWithoutVariables } from "@/lib/learner/variables";

// Phone keyboards (iOS/Android) insert "smart" typographic punctuation —
// curly apostrophes/quotes, primes, acute/grave accents used as apostrophe
// substitutes — where a teacher authoring on a desktop keyboard typed a
// straight one (or vice versa). Both the learner's typed answer and the
// stored accepted answer go through normalizeAnswer, so folding both sides
// to the same straight characters here makes matching direction-agnostic.
// Exported so lib/learner/answer-diff.ts can fold a single character the
// same way when building a diff that must stay index-aligned with the
// answer's original spelling (normalizeAnswer's trim/collapse would not).
export const APOSTROPHE_LOOKALIKES = /[’‘ʼ´`′]/g;
export const DOUBLE_QUOTE_LOOKALIKES = /[“”]/g;

export function normalizeAnswer(answer: string) {
  return answer
    .trim()
    .replace(/\s+/g, " ")
    .replace(APOSTROPHE_LOOKALIKES, "'")
    .replace(DOUBLE_QUOTE_LOOKALIKES, '"')
    .toLowerCase();
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

/** The accepted answer (canonical spelling/casing) that `answer` matches,
 * case-insensitively and including legacy semicolon-joined alternates, or
 * `null` if none match. This is the display text for a finished piece — the
 * learner's own casing/spacing is only used for matching, never shown. */
export function matchedAcceptedAnswer(
  answer: string,
  acceptedAnswers: string[],
): string | null {
  const normalizedAnswer = normalizeAnswer(answer);
  if (!normalizedAnswer) return null;
  return (
    expandLegacyAlternates(acceptedAnswers).find(
      (acceptedAnswer) => normalizeAnswer(acceptedAnswer) === normalizedAnswer,
    ) ?? null
  );
}

/** Whether `answer` matches one of `acceptedAnswers`, case-insensitively and
 * including legacy semicolon-joined alternates. Empty input never matches. */
export function isAnswerAccepted(
  answer: string,
  acceptedAnswers: string[],
): boolean {
  return matchedAcceptedAnswer(answer, acceptedAnswers) !== null;
}

/** A capture piece (types.ts): asks the learner for something about
 * themselves and stores it, instead of testing a fixed English answer. It is
 * never matched, never validated for a missing answer, and never generates a
 * clip. */
function isCapturePiece(languageBlock: {
  capture?: { key: string; suffix?: string };
}): boolean {
  return Boolean(languageBlock.capture?.key);
}

/** What a capture piece displays once the learner has answered: their stored
 * value plus the piece's literal suffix ("James" + "." → "James."). */
export function captureDisplayText(
  languageBlock: { capture?: { key: string; suffix?: string } },
  value: string,
): string {
  if (!value) return "";
  return `${value}${languageBlock.capture?.suffix ?? ""}`;
}

/** The English a piece contributes to a composed sentence, as authored: its
 * first accepted answer, or — for a capture piece, which has none — the
 * `{key}` token plus its literal suffix, so the sentence still reads as a
 * sentence and the learner-side substitution can fill in their own value. */
export function pieceEnglishSource(languageBlock: {
  acceptedAnswers: string[];
  capture?: { key: string; suffix?: string };
}): string {
  if (languageBlock.capture)
    return `{${languageBlock.capture.key}}${languageBlock.capture.suffix ?? ""}`;
  return languageBlock.acceptedAnswers[0]?.trim() ?? "";
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
 * and scripts/generate-audio.ts (collects text to synthesize).
 *
 * This is the SPOKEN form, so it is also the clip key: a capture piece
 * contributes nothing (a pre-generated clip cannot say the learner's name)
 * and any `{key}` token inside an ordinary answer is removed and tidied
 * (spokenTextWithoutVariables). "My name is <capture>" therefore both
 * generates and plays the clip for "My name is". When that leaves nothing at
 * all the caller's own `if (full)` guard skips the clip; when it leaves a
 * single word the clip is identical to that piece's own clip and dedupes
 * away in the generator's Set, so there is nothing extra to special-case. */
export function sentenceEnglishText(
  languageBlocks: Array<{
    spanish: string;
    acceptedAnswers: string[];
    capture?: { key: string; suffix?: string };
  }>,
): string {
  return languageBlocks
    .filter(isMeaningfulLanguageBlock)
    .filter((block) => !isCapturePiece(block))
    .map((block) =>
      spokenTextWithoutVariables(block.acceptedAnswers[0]?.trim() ?? ""),
    )
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
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
            ...(languageBlock.capture
              ? { capture: { ...languageBlock.capture } }
              : {}),
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
    // A capture piece has no fixed English answer by design — the learner
    // supplies it — so "Primary English answer is required" never applies.
    if (isCapturePiece(languageBlock)) return issueCount + spanishIssueCount;
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
