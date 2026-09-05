import { LessonDashboard } from "@/components/learner/lesson-dashboard";
import {
  readConceptDisplays,
  type ConceptDisplay,
} from "@/lib/curriculum/server/concept-display";
import type { LessonConcept } from "@/lib/lesson-builder/types";
import { readCourseSummary } from "@/lib/lesson-builder/server/course-summary";
import { lessonOutcome } from "@/lib/learner/presentation";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parameters = await searchParams;
  const initialModuleId =
    typeof parameters.module === "string" ? parameters.module : null;
  const course = await readCourseSummary();
  const conceptIds = [
    ...course.modules.flatMap((module) => module.keyConcepts),
    ...course.lessons.flatMap((lesson) => lesson.concepts),
  ].flatMap((concept) => (concept.conceptId ? [concept.conceptId] : []));
  const conceptDisplays = await readConceptDisplays(conceptIds).catch(
    (): Record<string, ConceptDisplay> => ({}),
  );

  function displayConcept(concept: LessonConcept) {
    const display = concept.conceptId
      ? conceptDisplays[concept.conceptId]
      : undefined;
    if (!display || display.role === "trash") return null;
    return {
      id: concept.id,
      spanish: display.spanish,
      english: display.english,
    };
  }

  const modules =
    course?.modules.map((module) => ({
      id: module.id,
      name: module.name,
      kind: module.kind,
      lessonCount: module.lessonCount,
      concepts: module.keyConcepts
        .map(displayConcept)
        .filter((concept) => concept !== null),
      lessons: module.lessons.map((lesson) => ({
        id: lesson.id,
        lessonNumber: lesson.lessonNumber,
        moduleLessonNumber: lesson.moduleLessonNumber,
        name: lesson.name,
        previewText:
          lessonOutcome(lesson.blocks)?.spanish || lesson.previewText,
        stepCount: lesson.blocks.length,
        concepts: lesson.concepts
          .map(displayConcept)
          .filter((concept) => concept !== null),
      })),
    })) ?? [];

  return (
    <LessonDashboard modules={modules} initialModuleId={initialModuleId} />
  );
}
