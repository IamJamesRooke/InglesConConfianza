import "server-only";

import type { Lesson, LessonBlock, LessonConcept } from "@/lib/lesson-builder/types";
import { normalizeLessonMarkdown } from "@/lib/lesson-builder/markdown";
import { readLessonFile } from "@/lib/lesson-builder/server/lesson-store";

export type CourseLessonSummary = {
  id: string;
  lessonNumber: number;
  moduleId: string;
  moduleName: string | null;
  moduleLessonNumber: number;
  name: string | null;
  explanationCount: number;
  practiceCount: number;
  previewText: string;
  blocks: LessonBlock[];
};

export type CourseModuleSummary = {
  id: string;
  name: string | null;
  keyConcepts: LessonConcept[];
  lessonCount: number;
  explanationCount: number;
  practiceCount: number;
  firstLessonId: string | null;
  lessons: CourseLessonSummary[];
};

export type CourseSummary = {
  modules: CourseModuleSummary[];
  lessons: CourseLessonSummary[];
  lessonCount: number;
  practiceCount: number;
  explanationCount: number;
};

function getLessonPreviewText(lesson: Lesson) {
  const firstPracticeBlock = lesson.blocks.find(
    (block) => block.type === "sentence",
  );

  if (firstPracticeBlock) {
    return firstPracticeBlock.languageBlocks
      .map((languageBlock) => languageBlock.spanish.trim())
      .filter(Boolean)
      .join(firstPracticeBlock.layout === "vocabulary_table" ? ", " : " ");
  }

  const firstExplanationBlock = lesson.blocks.find(
    (block) => block.type === "explanation",
  );

  return normalizeLessonMarkdown(firstExplanationBlock?.contentMarkdown ?? "")
    .replace(/^#{1,6}\s*/gmu, "")
    .replace(/==([^=]+)==/gu, "$1")
    .trim();
}

export async function readCourseSummary(): Promise<CourseSummary> {
  const lessonFile = await readLessonFile();
  const lessonById = new Map(lessonFile.lessons.map((lesson) => [lesson.id, lesson]));
  const lessonNumberById = new Map(
    lessonFile.lessons.map((lesson, index) => [lesson.id, index + 1]),
  );

  const modules = lessonFile.modules.map<CourseModuleSummary>((module) => {
    const lessons = module.lessonIds
      .map((lessonId, index) => {
        const lesson = lessonById.get(lessonId);
        if (!lesson) return null;

        return {
          id: lesson.id,
          lessonNumber: lessonNumberById.get(lesson.id) ?? index + 1,
          moduleId: module.id,
          moduleName: module.name,
          moduleLessonNumber: index + 1,
          name: lesson.name,
          explanationCount: lesson.blocks.filter(
            (block) => block.type === "explanation",
          ).length,
          practiceCount: lesson.blocks.filter((block) => block.type === "sentence")
            .length,
          previewText: getLessonPreviewText(lesson),
          blocks: lesson.blocks,
        } satisfies CourseLessonSummary;
      })
      .filter((lesson): lesson is CourseLessonSummary => lesson !== null);

    return {
      id: module.id,
      name: module.name,
      keyConcepts: module.keyConcepts,
      lessonCount: lessons.length,
      explanationCount: lessons.reduce(
        (total, lesson) => total + lesson.explanationCount,
        0,
      ),
      practiceCount: lessons.reduce(
        (total, lesson) => total + lesson.practiceCount,
        0,
      ),
      firstLessonId: lessons[0]?.id ?? null,
      lessons,
    };
  });

  const lessons = modules.flatMap((module) => module.lessons);

  return {
    modules,
    lessons,
    lessonCount: lessons.length,
    practiceCount: lessons.reduce((total, lesson) => total + lesson.practiceCount, 0),
    explanationCount: lessons.reduce(
      (total, lesson) => total + lesson.explanationCount,
      0,
    ),
  };
}
