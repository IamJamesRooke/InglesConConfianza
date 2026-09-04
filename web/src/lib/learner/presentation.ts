import type { LessonBlock } from "../lesson-builder/types";

export function lessonMinutes(stepCount: number) {
  return Math.max(1, Math.ceil(stepCount / 3));
}

export function lessonOutcome(blocks: LessonBlock[]) {
  const sentence = blocks.findLast(
    (block) =>
      block.type === "sentence" &&
      block.layout !== "vocabulary_table" &&
      block.languageBlocks.length > 0,
  );
  if (sentence?.type !== "sentence") return null;
  return {
    spanish: sentence.languageBlocks
      .map((block) => block.spanish.trim())
      .join(" "),
    english: sentence.languageBlocks
      .map((block) => block.acceptedAnswers[0]?.trim() ?? "")
      .join(" "),
  };
}
