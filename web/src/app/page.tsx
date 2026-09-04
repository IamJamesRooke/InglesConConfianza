import { LessonDashboard } from "@/components/learner/lesson-dashboard";
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
  const modules =
    course?.modules.map((module) => ({
      id: module.id,
      name: module.name,
      kind: module.kind,
      lessonCount: module.lessonCount,
      lessons: module.lessons.map((lesson) => ({
        id: lesson.id,
        lessonNumber: lesson.lessonNumber,
        moduleLessonNumber: lesson.moduleLessonNumber,
        name: lesson.name,
        previewText:
          lessonOutcome(lesson.blocks)?.spanish || lesson.previewText,
        stepCount: lesson.blocks.length,
      })),
    })) ?? [];

  return (
    <LessonDashboard modules={modules} initialModuleId={initialModuleId} />
  );
}
