import {
  LessonSelector,
  type PracticeLesson,
} from "@/components/practice/lesson-selector";
import { readCourseSummary } from "@/lib/lesson-builder/server/course-summary";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PracticePage({ searchParams }: PageProps) {
  const parameters = await searchParams;
  const selectedLessonId = first(parameters.lesson) ?? null;
  const course = await readCourseSummary().catch(() => null);
  const lessonSummaries = (course?.lessons ?? []).map<PracticeLesson>((lesson) => ({
    id: lesson.id,
    lessonNumber: lesson.lessonNumber,
    moduleName: lesson.moduleName,
    moduleLessonNumber: lesson.moduleLessonNumber,
    name: lesson.name,
    explanationCount: lesson.explanationCount,
    practiceCount: lesson.practiceCount,
    previewText: lesson.previewText,
    blocks: lesson.blocks,
  }));

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
