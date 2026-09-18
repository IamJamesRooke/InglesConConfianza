import {
  LessonSelector,
  type PracticeLesson,
} from "@/components/practice/lesson-selector";
import { readCourseSummary } from "@/lib/lesson-builder/server/course-summary";
import { redirect } from "next/navigation";

// Reads no cookies itself (the onboarding-complete-but-cookie-lost
// reconcile is client-side, in LessonSelector — see onboarding.md §1), but
// the course it hosts changes with every builder edit, so it stays dynamic
// like `/` and `/practice`.
export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BienvenidaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parameters = await searchParams;
  const replay = first(parameters.repasar) === "1";
  const course = await readCourseSummary();
  const onboardingModule = course.modules.find((m) => m.kind === "onboarding");
  const lessons: PracticeLesson[] = (onboardingModule?.lessons ?? [])
    .filter((lesson) => lesson.blocks.length > 0)
    .map((lesson) => ({
      id: lesson.id,
      lessonNumber: lesson.lessonNumber,
      moduleId: lesson.moduleId,
      moduleName: lesson.moduleName,
      moduleLessonNumber: lesson.moduleLessonNumber,
      name: lesson.name,
      explanationCount: lesson.explanationCount,
      practiceCount: lesson.practiceCount,
      previewText: lesson.previewText,
      concepts: [],
      blocks: lesson.blocks,
    }));

  // No published onboarding — nowhere to send the learner (docs/design/
  // onboarding.md item 7).
  if (lessons.length === 0) redirect("/");

  return (
    <LessonSelector
      lessons={lessons}
      onboarding={{ replay }}
    />
  );
}
