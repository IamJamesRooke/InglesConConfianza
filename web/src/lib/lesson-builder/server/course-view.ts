import "server-only";

import type { Lesson, LessonModule } from "@/lib/lesson-builder/types";
import { readLessonFile } from "@/lib/lesson-builder/server/lesson-store";

export type LessonSummary = {
  id: string;
  name: string | null;
  preview: string;
  blockCount: number;
  conceptCount: number;
};

export type CourseView = {
  modules: LessonModule[];
  lessons: Record<string, LessonSummary>;
};

function previewOf(lesson: Lesson): string {
  const sentence = lesson.blocks.find((block) => block.type === "sentence");
  if (sentence) {
    return sentence.languageBlocks
      .map((languageBlock) => languageBlock.spanish.trim())
      .filter(Boolean)
      .join(sentence.layout === "vocabulary_table" ? ", " : " ");
  }
  const explanation = lesson.blocks.find(
    (block) => block.type === "explanation",
  );
  return (explanation?.contentMarkdown ?? "")
    .replace(/[=#*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export async function readCourseView(): Promise<CourseView> {
  const file = await readLessonFile();
  return {
    modules: file.modules,
    lessons: Object.fromEntries(
      file.lessons.map((lesson) => [
        lesson.id,
        {
          id: lesson.id,
          name: lesson.name,
          preview: previewOf(lesson),
          blockCount: lesson.blocks.length,
          conceptCount: (lesson.concepts ?? []).length,
        } satisfies LessonSummary,
      ]),
    ),
  };
}
