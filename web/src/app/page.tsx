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
  const conceptIds = course.lessons
    .flatMap((lesson) => lesson.concepts)
    .flatMap((concept) => (concept.conceptId ? [concept.conceptId] : []));
  const conceptDisplays = await readConceptDisplays(conceptIds).catch(
    (): Record<string, ConceptDisplay> => ({}),
  );

  // Universal learner rule: a concept is only shown where it is introduced for
  // the first time (in curriculum order). Review appearances are hidden — the
  // full "everything covered" view lives in the lesson builder.
  const introduced = new Set<string>();

  function firstSightingConcepts(concepts: LessonConcept[]) {
    const result: { id: string; spanish: string; english: string }[] = [];
    for (const concept of concepts) {
      const display = concept.conceptId
        ? conceptDisplays[concept.conceptId]
        : undefined;
      if (!display || display.role === "Trash") continue;
      if (!concept.conceptId || introduced.has(concept.conceptId)) continue;
      introduced.add(concept.conceptId);
      result.push({
        id: concept.id,
        spanish: display.spanish,
        english: display.english,
      });
    }
    return result;
  }

  const modules =
    course?.modules.map((module) => {
      const lessons = module.lessons.map((lesson) => ({
        id: lesson.id,
        lessonNumber: lesson.lessonNumber,
        moduleLessonNumber: lesson.moduleLessonNumber,
        name: lesson.name,
        previewText: lessonOutcome(lesson.blocks)?.spanish || lesson.previewText,
        stepCount: lesson.blocks.length,
        concepts: firstSightingConcepts(lesson.concepts),
      }));
      return {
        id: module.id,
        name: module.name,
        kind: module.kind,
        lessonCount: module.lessonCount,
        lessons,
      };
    }) ?? [];

  return (
    <LessonDashboard modules={modules} initialModuleId={initialModuleId} />
  );
}
