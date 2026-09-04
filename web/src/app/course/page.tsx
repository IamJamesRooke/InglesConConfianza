import { ArrowRight, BookOpen, CheckCircle2, Layers3 } from "lucide-react";
import Link from "next/link";

import { readCourseSummary } from "@/lib/lesson-builder/server/course-summary";

export const dynamic = "force-dynamic";

export default async function CoursePage() {
  const course = await readCourseSummary().catch(() => null);
  const modules = course?.modules ?? [];

  return (
    <main className="flex-1 bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Curso
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Aprende por módulos
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Lecciones cortas, ordenadas para producir inglés útil desde el
              primer módulo.
            </p>
          </div>
          <div className="grid w-full max-w-md grid-cols-3 gap-2 text-center">
            <CourseMetric label="Módulos" value={modules.length} />
            <CourseMetric label="Lecciones" value={course?.lessonCount ?? 0} />
            <CourseMetric label="Prácticas" value={course?.practiceCount ?? 0} />
          </div>
        </div>

        {modules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-[var(--surface)] p-8 text-center">
            <p className="font-semibold">El curso todavía está vacío.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Las lecciones aparecerán aquí cuando existan en Lesson Builder.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {modules.map((module, moduleIndex) => (
              <section
                key={module.id}
                className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-sm"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Módulo {moduleIndex + 1}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                      {module.name ?? `Módulo ${moduleIndex + 1}`}
                    </h2>
                    {module.keyConcepts.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {module.keyConcepts.map((concept) => (
                          <span
                            key={concept.id}
                            className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground"
                          >
                            {concept.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <span className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                      <Layers3 className="size-4" aria-hidden="true" />
                      {module.lessonCount}{" "}
                      {module.lessonCount === 1 ? "lección" : "lecciones"}
                    </span>
                    {module.firstLessonId && (
                      <Link
                        href={`/practice?lesson=${module.firstLessonId}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
                      >
                        Empezar módulo
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>

                {module.lessons.length > 0 ? (
                  <ol className="mt-5 grid gap-3">
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        <Link
                          href={`/practice?lesson=${lesson.id}`}
                          className="grid gap-4 rounded-xl border border-border bg-background p-4 transition hover:border-primary/50 hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                        >
                          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                            {lesson.moduleLessonNumber}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold text-foreground">
                              {lesson.name ?? `Lección ${lesson.lessonNumber}`}
                            </span>
                            <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                              {lesson.previewText || "Sin vista previa todavía."}
                            </span>
                          </span>
                          <span className="flex items-center gap-3 text-xs font-semibold text-muted-foreground sm:justify-end">
                            <span className="inline-flex items-center gap-1.5">
                              <BookOpen className="size-4" aria-hidden="true" />
                              {lesson.explanationCount}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <CheckCircle2 className="size-4" aria-hidden="true" />
                              {lesson.practiceCount}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed border-border bg-background p-5 text-sm text-muted-foreground">
                    Este módulo todavía no tiene lecciones.
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function CourseMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-[var(--surface)] px-3 py-3">
      <p className="text-xl font-semibold">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
