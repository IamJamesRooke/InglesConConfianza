import {
  LessonSelector,
  type PracticeLesson,
} from "@/components/practice/lesson-selector";
import {
  readConceptDisplays,
  type ConceptDisplay,
} from "@/lib/curriculum/server/concept-display";
import { readNewConceptIds } from "@/lib/curriculum/server/coverage";
import { readCourseSummary } from "@/lib/lesson-builder/server/course-summary";
import { redirect } from "next/navigation";
import type { Viewport } from "next";

export const dynamic = "force-dynamic";
export const viewport: Viewport = { interactiveWidget: "resizes-content" };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PracticePage({ searchParams }: PageProps) {
  const parameters = await searchParams;
  const selectedLessonId = first(parameters.lesson) ?? null;
  const course = await readCourseSummary();
  const newConceptIdsByLesson = new Map(
    await Promise.all(
      course.lessons.map(async (lesson) => [
        lesson.id,
        await readNewConceptIds(lesson.id),
      ] as const),
    ),
  );
  const conceptIds = course.lessons.flatMap((lesson) =>
    lesson.concepts.flatMap((concept) =>
      concept.conceptId &&
      newConceptIdsByLesson.get(lesson.id)?.has(concept.conceptId)
        ? [concept.conceptId]
        : [],
    ),
  );
  const conceptDisplays = await readConceptDisplays(conceptIds).catch(
    (): Record<string, ConceptDisplay> => ({}),
  );
  const lessonSummaries = (course?.lessons ?? []).map<PracticeLesson>(
    (lesson) => ({
      id: lesson.id,
      lessonNumber: lesson.lessonNumber,
      moduleId: lesson.moduleId,
      moduleName: lesson.moduleName,
      moduleLessonNumber: lesson.moduleLessonNumber,
      name: lesson.name,
      explanationCount: lesson.explanationCount,
      practiceCount: lesson.practiceCount,
      previewText: lesson.previewText,
      concepts: lesson.concepts.flatMap((concept) => {
        if (
          !concept.conceptId ||
          !newConceptIdsByLesson.get(lesson.id)?.has(concept.conceptId)
        )
          return [];
        const display = conceptDisplays[concept.conceptId];
        return display && display.role !== "trash"
          ? [
              {
                id: concept.id,
                spanish: display.spanish,
                english: display.english,
              },
            ]
          : [];
      }),
      blocks: lesson.blocks,
    }),
  );

  if (
    !selectedLessonId ||
    !lessonSummaries.some(
      (lesson) => lesson.id === selectedLessonId && lesson.blocks.length > 0,
    )
  ) {
    redirect("/");
  }

  return (
    <LessonSelector
      lessons={lessonSummaries}
      initialLessonId={selectedLessonId}
    />
  );
}
