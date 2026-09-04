import {
  LessonSelector,
  type PracticeLesson,
} from "@/components/practice/lesson-selector";
import { readCourseSummary } from "@/lib/lesson-builder/server/course-summary";

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

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Inglés Con Confianza
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Práctica
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Retoma una lección y convierte cada idea en inglés paso a paso.
          </p>
        </div>

        <LessonSelector
          lessons={lessonSummaries}
          initialLessonId={selectedLessonId}
        />
      </div>
    </main>
  );
}
