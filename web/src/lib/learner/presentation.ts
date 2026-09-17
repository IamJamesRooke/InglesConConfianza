import type { LessonBlock } from "../lesson-builder/types";
import { isMeaningfulLanguageBlock } from "../lesson-builder/utils";

/**
 * Curriculum notation brackets an optional/implied word — `[the] day`,
 * `[el] día` — to document it for authors and curation. Learners should
 * never see the brackets: render the words plainly, `the day` / `el día`.
 */
export function learnerLabel(text: string): string {
  return text.replace(/\[([^\]]*)\]/g, "$1").replace(/\s+/g, " ").trim();
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
