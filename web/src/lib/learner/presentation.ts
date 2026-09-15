import type { LessonBlock } from "../lesson-builder/types";
import { isMeaningfulLanguageBlock } from "../lesson-builder/utils";

export function lessonMinutes(stepCount: number) {
  return Math.max(1, Math.ceil(stepCount / 3));
}

export function lessonOutcome(blocks: LessonBlock[]) {
  const sentence = blocks.findLast(
    (block) =>
      block.type === "sentence" &&
      block.layout !== "vocabulary_table" &&
      block.languageBlocks.some(isMeaningfulLanguageBlock),
  );
  if (sentence?.type !== "sentence") return null;
  const languageBlocks = sentence.languageBlocks.filter(
    isMeaningfulLanguageBlock,
  );
  return {
    spanish: languageBlocks.map((block) => block.spanish.trim()).join(" "),
    english: languageBlocks
      .map((block) => block.acceptedAnswers[0]?.trim() ?? "")
      .join(" "),
  };
}
