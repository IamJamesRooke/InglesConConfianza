"use client";

import { CheckCircle2, Play, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

export const lessonProgressStorageKey = "icc.lessonProgress.v1";

type LearnerLesson = {
  id: string;
  lessonNumber: number;
  moduleLessonNumber: number;
  name: string | null;
  previewText: string;
};

type LearnerModule = {
  id: string;
  name: string | null;
  lessonCount: number;
  lessons: LearnerLesson[];
};

type LessonProgressEntry = {
  completedAt?: string;
  lastOpenedAt?: string;
};

type LessonProgress = Record<string, LessonProgressEntry>;

const emptyProgress: LessonProgress = {};
const lessonProgressEventName = "icc:lesson-progress";
let cachedProgressRaw: string | null = null;
let cachedProgress: LessonProgress = emptyProgress;

function readProgress(): LessonProgress {
  if (typeof window === "undefined") return emptyProgress;

  try {
    const raw = window.localStorage.getItem(lessonProgressStorageKey);
    if (raw === cachedProgressRaw) return cachedProgress;
    cachedProgressRaw = raw;

    if (!raw) {
      cachedProgress = emptyProgress;
      return cachedProgress;
    }

    const parsed = JSON.parse(raw);
    cachedProgress = parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
    return cachedProgress;
  } catch {
    cachedProgress = emptyProgress;
    return cachedProgress;
  }
}

function subscribeToProgress(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === lessonProgressStorageKey) {
      onStoreChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(lessonProgressEventName, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(lessonProgressEventName, onStoreChange);
  };
}

export function LessonDashboard({
  modules,
}: {
  modules: LearnerModule[];
}) {
  const progress = useSyncExternalStore(
    subscribeToProgress,
    readProgress,
    () => emptyProgress,
  );

  const totals = useMemo(() => {
    const lessonIds = modules.flatMap((module) =>
      module.lessons.map((lesson) => lesson.id),
    );
    const completedCount = lessonIds.filter(
      (lessonId) => progress[lessonId]?.completedAt,
    ).length;
    return { lessonCount: lessonIds.length, completedCount };
  }, [modules, progress]);

  if (modules.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-[var(--surface)] p-8 text-center">
        <p className="font-semibold">Todavía no hay lecciones.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Vuelve pronto para empezar el primer módulo.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-7">
      <header className="border-b border-border pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
          Inglés Con Confianza
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">
              Tus lecciones
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Elige un módulo y completa cada lección a tu ritmo.
            </p>
          </div>
          <p className="rounded-full border border-border bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-muted-foreground">
            {totals.completedCount} de {totals.lessonCount} completas
          </p>
        </div>
      </header>

      {modules.map((module, moduleIndex) => {
        const completedLessons = module.lessons.filter(
          (lesson) => progress[lesson.id]?.completedAt,
        ).length;

        return (
          <section
            key={module.id}
            className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Módulo {moduleIndex + 1}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  {module.name ?? `Módulo ${moduleIndex + 1}`}
                </h2>
              </div>
              <span className="rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                {completedLessons} de {module.lessonCount} completas
              </span>
            </div>

            <ol className="mt-5 grid gap-3">
              {module.lessons.map((lesson) => {
                const isComplete = Boolean(progress[lesson.id]?.completedAt);
                const wasOpened = Boolean(progress[lesson.id]?.lastOpenedAt);

                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/practice?lesson=${lesson.id}`}
                      className={`grid gap-4 rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 sm:grid-cols-[auto_minmax(0,1fr)_auto] ${
                        isComplete
                          ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-100"
                          : "border-border bg-background hover:border-primary/50"
                      }`}
                    >
                      <span
                        className={`flex size-10 items-center justify-center rounded-lg text-sm font-semibold ${
                          isComplete
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="size-5" aria-hidden="true" />
                        ) : (
                          lesson.moduleLessonNumber
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold">
                          {lesson.name ?? `Lección ${lesson.lessonNumber}`}
                        </span>
                        <span
                          className={`mt-1 line-clamp-2 block text-sm ${
                            isComplete
                              ? "text-emerald-800 dark:text-emerald-200"
                              : "text-muted-foreground"
                          }`}
                        >
                          {lesson.previewText || "Lista para practicar."}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 text-sm font-semibold sm:justify-end">
                        {isComplete ? (
                          <>
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                            Completa
                          </>
                        ) : wasOpened ? (
                          <>
                            <RotateCcw className="size-4" aria-hidden="true" />
                            Continuar
                          </>
                        ) : (
                          <>
                            <Play className="size-4" aria-hidden="true" />
                            Empezar
                          </>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

export function markLessonOpened(lessonId: string) {
  const progress = readProgress();
  progress[lessonId] = {
    ...progress[lessonId],
    lastOpenedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(lessonProgressStorageKey, JSON.stringify(progress));
  window.dispatchEvent(new Event(lessonProgressEventName));
}

export function markLessonCompleted(lessonId: string) {
  const progress = readProgress();
  progress[lessonId] = {
    ...progress[lessonId],
    lastOpenedAt: new Date().toISOString(),
    completedAt: progress[lessonId]?.completedAt ?? new Date().toISOString(),
  };
  window.localStorage.setItem(lessonProgressStorageKey, JSON.stringify(progress));
  window.dispatchEvent(new Event(lessonProgressEventName));
}
