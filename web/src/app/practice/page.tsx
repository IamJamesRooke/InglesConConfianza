import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  LessonSelector,
  type PracticeLesson,
} from "@/components/practice/lesson-selector";
import type { Lesson, LessonFile } from "@/lib/lesson-builder/types";
import { normalizeLessonMarkdown } from "@/lib/lesson-builder/markdown";

export const dynamic = "force-dynamic";

async function getLessons() {
  try {
    const file = await readFile(
      path.join(process.cwd(), "data", "lessons.json"),
      "utf8",
    );
    const lessonFile = JSON.parse(file) as LessonFile;
    return lessonFile.lessons;
  } catch {
    return [];
  }
}

function getLessonPreviewText(lesson: Lesson) {
  const firstPracticeBlock = lesson.blocks.find(
    (block) => block.type === "sentence",
  );

  if (firstPracticeBlock) {
    return firstPracticeBlock.languageBlocks
      .map((languageBlock) => languageBlock.spanish.trim())
      .filter(Boolean)
      .join(
        firstPracticeBlock.layout === "vocabulary_table" ? ", " : " ",
      );
  }

  const firstExplanationBlock = lesson.blocks.find(
    (block) => block.type === "explanation",
  );

  return normalizeLessonMarkdown(firstExplanationBlock?.contentMarkdown ?? "")
    .replace(/^#{1,6}\s*/gmu, "")
    .replace(/==([^=]+)==/gu, "$1")
    .trim();
}

function getPracticeLessonSummaries(lessons: Lesson[]) {
  return lessons.map<PracticeLesson>((lesson, lessonIndex) => ({
    id: lesson.id,
    lessonNumber: lessonIndex + 1,
    name: lesson.name,
    explanationCount: lesson.blocks.filter(
      (block) => block.type === "explanation",
    ).length,
    practiceCount: lesson.blocks.filter((block) => block.type === "sentence")
      .length,
    previewText: getLessonPreviewText(lesson),
    blocks: lesson.blocks,
  }));
}

export default async function PracticePage() {
  const lessons = await getLessons();
  const lessonSummaries = getPracticeLessonSummaries(lessons);

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Inglés Con Confianza
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Práctica
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Elige una lección guardada para practicar.
          </p>
        </div>

        <LessonSelector lessons={lessonSummaries} />
      </div>
    </main>
  );
}
