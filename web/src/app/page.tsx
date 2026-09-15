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
    course?.modules.map((module) => {
      const lessons = module.lessons.map((lesson) => {
        const outcome = lessonOutcome(lesson.blocks);
        return {
          id: lesson.id,
          lessonNumber: lesson.lessonNumber,
          moduleLessonNumber: lesson.moduleLessonNumber,
          name: lesson.name,
          previewText: outcome?.spanish || lesson.previewText,
          answerText: outcome?.english || lesson.name || "",
          stepCount: lesson.blocks.length,
        };
      });
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
