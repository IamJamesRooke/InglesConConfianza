import { LessonDashboard } from "@/components/learner/lesson-dashboard";
import { readCourseSummary } from "@/lib/lesson-builder/server/course-summary";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const course = await readCourseSummary().catch(() => null);
  const modules =
    course?.modules.map((module) => ({
      id: module.id,
      name: module.name,
      lessonCount: module.lessonCount,
      lessons: module.lessons.map((lesson) => ({
        id: lesson.id,
        lessonNumber: lesson.lessonNumber,
        moduleLessonNumber: lesson.moduleLessonNumber,
        name: lesson.name,
        previewText: lesson.previewText,
        stepCount: lesson.blocks.length,
      })),
    })) ?? [];

  return (
    <LessonDashboard modules={modules} />
  );
}
