// Audits a lessons.json file for accepted-answer authoring bugs that break
// first-attempt answerability for the learner:
//
//   - a legacy joined alternate, e.g. "I want to buy; I wanna buy" stored as
//     one literal string instead of two acceptedAnswers entries. The learner
//     app now also matches each "; "-separated half at read time (see
//     isAnswerAccepted / expandLegacyAlternates in
//     src/lib/lesson-builder/utils.ts), but the underlying row is still worth
//     splitting by hand in the builder for clarity and future edits.
//   - a fully blank language block (blank Spanish prompt AND every accepted
//     answer blank) — dangling authoring debris. The practice UI now skips
//     these at render time, but they should be deleted from the source data.
//
// This script is read-only: it never writes to the lessons file. Run it
// against a COPY of data/lessons.json, never the live file directly, e.g.:
//
//   npx tsx scripts/audit-lessons-answers.ts /tmp/lessons-copy.json
//
// With no argument it defaults to ./data/lessons.json relative to the repo
// (still opened read-only).

import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Lesson, LessonFile, SentenceBlock } from "../src/lib/lesson-builder/types";

async function main() {
  const filePath = path.resolve(
    process.argv[2] ?? path.join(__dirname, "..", "data", "lessons.json"),
  );
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as LessonFile;
  const lessons: Lesson[] = parsed.lessons ?? [];

  type Finding = {
    lessonId: string;
    lessonName: string | null;
    blockId: string;
    languageBlockId: string;
    spanish: string;
    acceptedAnswers: string[];
    issue: "joined" | "blank";
  };

  const findings: Finding[] = [];

  for (const lesson of lessons) {
    for (const block of lesson.blocks) {
      if (block.type !== "sentence") continue;
      const sentence = block as SentenceBlock;
      for (const languageBlock of sentence.languageBlocks) {
        const hasJoined = languageBlock.acceptedAnswers.some((answer) =>
          answer.includes(";"),
        );
        const isBlank =
          languageBlock.spanish.trim().length === 0 &&
          languageBlock.acceptedAnswers.every(
            (answer) => answer.trim().length === 0,
          );
        if (hasJoined) {
          findings.push({
            lessonId: lesson.id,
            lessonName: lesson.name,
            blockId: sentence.id,
            languageBlockId: languageBlock.id,
            spanish: languageBlock.spanish,
            acceptedAnswers: languageBlock.acceptedAnswers,
            issue: "joined",
          });
        }
        if (isBlank) {
          findings.push({
            lessonId: lesson.id,
            lessonName: lesson.name,
            blockId: sentence.id,
            languageBlockId: languageBlock.id,
            spanish: languageBlock.spanish,
            acceptedAnswers: languageBlock.acceptedAnswers,
            issue: "blank",
          });
        }
      }
    }
  }

  if (findings.length === 0) {
    console.log("No joined (\";\") or fully blank accepted-answer pairs found.");
    return;
  }

  console.log(`Found ${findings.length} pair(s) to fix by hand:\n`);
  for (const finding of findings) {
    const label =
      finding.issue === "joined"
        ? "SEMICOLON-JOINED"
        : "FULLY BLANK PAIR";
    console.log(
      `- [${label}] lesson "${finding.lessonName ?? finding.lessonId}" (${finding.lessonId})\n` +
        `    sentence block: ${finding.blockId}\n` +
        `    language block: ${finding.languageBlockId}\n` +
        `    spanish: ${JSON.stringify(finding.spanish)}\n` +
        `    acceptedAnswers: ${JSON.stringify(finding.acceptedAnswers)}\n`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
