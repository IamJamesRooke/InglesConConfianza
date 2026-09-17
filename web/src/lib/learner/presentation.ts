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

/**
 * Which completion view a finished (or reopened) lesson gets — direction,
 * docs/design/learner-direction.md's COMPLETION section, item 2: the
 * module-end list ("LO QUE YA PUEDES DECIR") shows only when the lesson is
 * the LAST lesson of its module. Every other lesson gets that module's next
 * lesson as a "SIGUIENTE" card, regardless of whether later lessons in the
 * module already happen to be complete — completion status never decides
 * this, only position.
 *
 * `moduleLessons` is every lesson that shares the finished lesson's module
 * (course order), and `lessonIndex` is where the finished lesson sits in
 * that list. A lesson with no practice content (`blocks.length === 0`,
 * e.g. a placeholder) is skipped when looking for the next one to hand off
 * to, the same way the old lookup skipped empty lessons.
 */
export type CompletionView<T> =
  | { kind: "next"; lesson: T }
  | { kind: "module" };

export function completionView<T extends { blocks: unknown[] }>(
  lessonIndex: number,
  moduleLessons: T[],
): CompletionView<T> {
  const next = moduleLessons
    .slice(lessonIndex + 1)
    .find((item) => item.blocks.length > 0);
  return next ? { kind: "next", lesson: next } : { kind: "module" };
}

export type CompletionSentenceSize = "hero" | "sentence" | "body";

/**
 * The completion screen's final-sentence size (owner tweak,
 * docs/design/learner-direction.md's COMPLETION section): a short sentence
 * gets the loudest hero size; past 10 words it steps down to a body-ish
 * size so a long sentence never overflows a phone screen.
 */
export function completionSentenceSize(english: string): CompletionSentenceSize {
  const wordCount = english.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount <= 5) return "hero";
  if (wordCount <= 10) return "sentence";
  return "body";
}

/** Roughly how many characters of an explanation fit on one rendered line
 * at the practice card's measure. Past this, the text is certain to wrap. */
const EXPLANATION_SINGLE_LINE_CHARS = 60;

/** The visible text of an explanation: markdown markers removed, language
 * highlights unwrapped, whitespace collapsed. Used to decide alignment
 * (below) without measuring the DOM. */
export function explanationPlainText(markdown: string): string {
  return markdown
    .replace(/\[\[(?:es|en):([\s\S]*?)\]\]/g, "$1")
    .replace(/\\?<\/?kbd>/g, "")
    .replace(/[*_=#>`]/g, "")
    .replace(/^\s*[-+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Whether an explanation should render left-aligned rather than centred.
 * Centring only reads well while the text stays on one line; once it wraps,
 * the ragged edges are hard to follow (owner spec).
 *
 * This used to be measured in the browser with a ResizeObserver, which did
 * not fire for the case that matters — see docs/design/student-experience.md
 * — so it is now a plain rule on the authored text: more than one line's
 * worth of characters, or more than one block, means it wraps. Deterministic,
 * server-rendered, and correct before fonts finish loading.
 */
export function explanationWraps(markdown: string): boolean {
  const blocks = markdown
    .split(/\n{2,}/)
    .map((block) => explanationPlainText(block))
    .filter(Boolean);
  if (blocks.length > 1) return true;
  return (blocks[0]?.length ?? 0) > EXPLANATION_SINGLE_LINE_CHARS;
}
