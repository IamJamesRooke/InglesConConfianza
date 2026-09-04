"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

export const lessonProgressStorageKey = "icc.lessonProgress.v1";

type LearnerLesson = {
  id: string;
  lessonNumber: number;
  moduleLessonNumber: number;
  name: string | null;
  previewText: string;
  stepCount: number;
};

type LearnerModule = {
  id: string;
  name: string | null;
  kind: "course" | "onboarding";
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

function moduleEyebrow(modules: LearnerModule[], moduleIndex: number) {
  if (modules[moduleIndex]?.kind === "onboarding") return "Empieza aquí";
  const courseNumber = modules
    .slice(0, moduleIndex + 1)
    .filter((module) => module.kind !== "onboarding").length;
  return `Módulo ${courseNumber}`;
}

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

export function LessonDashboard({ modules }: { modules: LearnerModule[] }) {
  const progress = useSyncExternalStore(
    subscribeToProgress,
    readProgress,
    () => emptyProgress,
  );
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const courseState = useMemo(() => {
    const availableLessons = modules.flatMap((module, moduleIndex) =>
      module.lessons
        .filter((lesson) => lesson.stepCount > 0)
        .map((lesson) => ({ lesson, module, moduleIndex })),
    );
    const completedCount = availableLessons.filter(
      ({ lesson }) => progress[lesson.id]?.completedAt,
    ).length;
    const nextLesson =
      availableLessons.find(({ lesson }) => !progress[lesson.id]?.completedAt) ??
      availableLessons[0] ??
      null;
    const completionPercent = availableLessons.length
      ? Math.round((completedCount / availableLessons.length) * 100)
      : 0;

    return {
      availableCount: availableLessons.length,
      completedCount,
      completionPercent,
      isCourseComplete:
        availableLessons.length > 0 && completedCount === availableLessons.length,
      nextLesson,
    };
  }, [modules, progress]);

  const selectedModule =
    modules.find((module) => module.id === selectedModuleId) ??
    courseState.nextLesson?.module ??
    modules[0];

  if (modules.length === 0) {
    return <EmptyCourse />;
  }

  return (
    <div className="learner-theme min-h-[calc(100vh-4rem)] bg-[#f3f8f7] text-[#173b3a]">
      <section className="overflow-hidden bg-[#173b3a] text-white">
        <div className="learner-enter mx-auto grid max-w-6xl gap-9 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center lg:gap-16">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-sm font-bold text-[#f6c453]">
              <Sparkles className="size-4" aria-hidden="true" />
              {courseState.isCourseComplete
                ? "Tu curso, listo para repasar"
                : "Tu próximo paso"}
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-black leading-[1.08] sm:text-5xl">
              Habla inglés con confianza.
            </h1>
            <p className="mt-4 max-w-xl text-base font-medium leading-7 text-[#c9ddda] sm:text-lg">
              Avanza con frases útiles, práctica clara y pequeñas victorias que
              sí se sienten.
            </p>

            {courseState.nextLesson && (
              <div className="mt-8 flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#9bc6c0]">
                    {moduleEyebrow(
                      modules,
                      courseState.nextLesson.moduleIndex,
                    )} · Lección{" "}
                    {courseState.nextLesson.lesson.moduleLessonNumber}
                  </p>
                  <p className="mt-1 truncate text-lg font-extrabold text-white sm:text-xl">
                    {courseState.nextLesson.lesson.name ??
                      `Lección ${courseState.nextLesson.lesson.lessonNumber}`}
                  </p>
                </div>
                <Link
                  href={`/practice?lesson=${courseState.nextLesson.lesson.id}`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#f6c453] px-5 py-3.5 text-sm font-extrabold text-[#173b3a] shadow-[0_8px_22px_rgba(0,0,0,0.18)] transition hover:bg-[#ffcf62] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
                >
                  {courseState.isCourseComplete
                    ? "Repasar el curso"
                    : progress[courseState.nextLesson.lesson.id]?.lastOpenedAt
                      ? "Continuar"
                      : "Empezar"}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>

          <CourseProgress
            completedCount={courseState.completedCount}
            lessonCount={courseState.availableCount}
            percent={courseState.completionPercent}
          />
        </div>
      </section>

      <main id="lecciones" className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col gap-3 border-b border-[#cfe3df] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-extrabold text-[#e05f47]">Tu ruta</p>
            <h2 className="mt-1 text-3xl font-black leading-tight">
              Elige un módulo
            </h2>
          </div>
          <p className="max-w-md text-sm font-medium leading-6 text-[#587873]">
            Cada lección suma una frase nueva a lo que ya puedes decir.
          </p>
        </div>

        <div
          className="mt-6 flex gap-2 overflow-x-auto pb-2"
          role="tablist"
          aria-label="Módulos del curso"
        >
          {modules.map((module, moduleIndex) => {
            const isSelected = module.id === selectedModule?.id;
            const moduleAvailableLessons = module.lessons.filter(
              (lesson) => lesson.stepCount > 0,
            );
            const completedLessons = moduleAvailableLessons.filter(
              (lesson) => progress[lesson.id]?.completedAt,
            ).length;

            return (
              <button
                key={module.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls="selected-module-lessons"
                onClick={() => setSelectedModuleId(module.id)}
                className={`flex min-w-48 shrink-0 items-center gap-3 rounded-lg border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0f766e]/20 ${
                  isSelected
                    ? "border-[#0f766e] bg-[#0f766e] text-white shadow-sm"
                    : "border-[#cfe3df] bg-white text-[#315d59] hover:border-[#74aaa4]"
                }`}
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-black ${
                    isSelected
                      ? "bg-white/15 text-white"
                      : "bg-[#e3f0ee] text-[#0f766e]"
                  }`}
                >
                  {module.kind === "onboarding" ? (
                    <Sparkles className="size-4" aria-hidden="true" />
                  ) : (
                    String(
                      modules
                        .slice(0, moduleIndex + 1)
                        .filter((candidate) => candidate.kind !== "onboarding")
                        .length,
                    ).padStart(2, "0")
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-extrabold">
                    {module.name ?? moduleEyebrow(modules, moduleIndex)}
                  </span>
                  <span
                    className={`mt-0.5 block text-xs font-semibold ${
                      isSelected ? "text-[#bfe1dd]" : "text-[#6d8a86]"
                    }`}
                  >
                    {completedLessons} de {moduleAvailableLessons.length} completas
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {selectedModule && (
          <ModuleLessons
            module={selectedModule}
            eyebrow={moduleEyebrow(
              modules,
              modules.indexOf(selectedModule),
            )}
            progress={progress}
          />
        )}
      </main>
    </div>
  );
}

function CourseProgress({ completedCount, lessonCount, percent }: {
  completedCount: number;
  lessonCount: number;
  percent: number;
}) {
  return (
    <div className="flex items-center gap-5 border-t border-white/15 pt-7 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
      <div
        className="relative flex size-28 shrink-0 items-center justify-center rounded-full p-2"
        style={{
          background: `conic-gradient(#f6c453 ${percent}%, rgba(255,255,255,0.14) ${percent}% 100%)`,
        }}
        role="progressbar"
        aria-label="Progreso del curso"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <span className="flex size-full items-center justify-center rounded-full bg-[#173b3a] text-2xl font-black">
          {percent}%
        </span>
      </div>
      <div>
        <p className="text-3xl font-black">
          {completedCount}
          <span className="text-lg text-[#9bc6c0]">/{lessonCount}</span>
        </p>
        <p className="mt-1 max-w-28 text-sm font-semibold leading-5 text-[#c9ddda]">
          lecciones completas
        </p>
      </div>
    </div>
  );
}

function ModuleLessons({ module, eyebrow, progress }: {
  module: LearnerModule;
  eyebrow: string;
  progress: LessonProgress;
}) {
  const availableLessons = module.lessons.filter((lesson) => lesson.stepCount > 0);
  const completedLessons = availableLessons.filter(
    (lesson) => progress[lesson.id]?.completedAt,
  ).length;
  const percent = availableLessons.length
    ? Math.round((completedLessons / availableLessons.length) * 100)
    : 0;

  return (
    <section
      id="selected-module-lessons"
      role="tabpanel"
      className="learner-enter mt-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#6d8a86]">
            {eyebrow}
          </p>
          <h3 className="mt-1 text-2xl font-black leading-tight">
            {module.name ?? eyebrow}
          </h3>
        </div>
        <div className="w-full max-w-xs">
          <div className="mb-2 flex justify-between text-xs font-bold text-[#587873]">
            <span>Progreso del módulo</span>
            <span>{percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#dbeae7]">
            <div
              className="h-full rounded-full bg-[#0f766e] transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      <ol className="mt-6 grid gap-3">
        {module.lessons.map((lesson) => (
          <LessonRow key={lesson.id} lesson={lesson} progress={progress[lesson.id]} />
        ))}
      </ol>
    </section>
  );
}

function LessonRow({ lesson, progress }: {
  lesson: LearnerLesson;
  progress?: LessonProgressEntry;
}) {
  const isAvailable = lesson.stepCount > 0;
  const isComplete = Boolean(progress?.completedAt);
  const wasOpened = Boolean(progress?.lastOpenedAt);
  const durationMinutes = Math.max(3, Math.ceil(lesson.stepCount / 2));
  const content = (
    <>
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
        isComplete
          ? "bg-[#d7f2df] text-[#18723f]"
          : isAvailable
            ? "bg-[#e3f0ee] text-[#0f766e]"
            : "bg-[#edf1f0] text-[#82928f]"
      }`}>
        {isComplete ? (
          <Check className="size-5" strokeWidth={3} aria-hidden="true" />
        ) : isAvailable ? (
          lesson.moduleLessonNumber
        ) : (
          <LockKeyhole className="size-4" aria-hidden="true" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-extrabold leading-5 text-[#173b3a]">
          {lesson.name ?? `Lección ${lesson.lessonNumber}`}
        </span>
        <span className="mt-1 line-clamp-2 block text-sm font-medium leading-5 text-[#67817d]">
          {isAvailable
            ? lesson.previewText || "Lista para practicar."
            : "Esta lección estará disponible muy pronto."}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-2 text-sm font-extrabold">
        {isComplete ? (
          <>
            <CheckCircle2 className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Completa</span>
          </>
        ) : !isAvailable ? (
          <span className="hidden text-[#82928f] sm:inline">Próximamente</span>
        ) : wasOpened ? (
          <>
            <RotateCcw className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Continuar</span>
          </>
        ) : (
          <>
            <Play className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Empezar</span>
          </>
        )}
      </span>
    </>
  );

  return (
    <li>
      {isAvailable ? (
        <Link
          href={`/practice?lesson=${lesson.id}`}
          className={`flex min-h-24 items-center gap-4 rounded-lg border bg-white p-4 shadow-[0_2px_10px_rgba(23,59,58,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(23,59,58,0.10)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0f766e]/20 sm:px-5 ${
            isComplete
              ? "border-[#abdcbc] text-[#18723f]"
              : "border-[#cfe3df] text-[#0f766e] hover:border-[#74aaa4]"
          }`}
        >
          {content}
          <span className="hidden items-center gap-1.5 text-xs font-bold text-[#78908c] md:flex">
            <Clock3 className="size-3.5" aria-hidden="true" />
            {durationMinutes} min
          </span>
        </Link>
      ) : (
        <div className="flex min-h-24 items-center gap-4 rounded-lg border border-[#dde7e5] bg-[#f9fbfa] p-4 opacity-80 sm:px-5">
          {content}
        </div>
      )}
    </li>
  );
}

function EmptyCourse() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f3f8f7] px-5 py-12 text-[#173b3a]">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-lg bg-[#e3f0ee] text-[#0f766e]">
          <Sparkles className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-3xl font-black">Las primeras lecciones vienen pronto.</h1>
        <p className="mt-3 font-medium leading-7 text-[#587873]">
          Estamos preparando una experiencia clara, práctica y hecha para que
          empieces con confianza.
        </p>
      </div>
    </main>
  );
}

export function markLessonOpened(lessonId: string) {
  const progress = readProgress();
  const nextProgress = {
    ...progress,
    [lessonId]: {
      ...progress[lessonId],
      lastOpenedAt: new Date().toISOString(),
    },
  };
  window.localStorage.setItem(
    lessonProgressStorageKey,
    JSON.stringify(nextProgress),
  );
  window.dispatchEvent(new Event(lessonProgressEventName));
}

export function markLessonCompleted(lessonId: string) {
  const progress = readProgress();
  const nextProgress = {
    ...progress,
    [lessonId]: {
      ...progress[lessonId],
      lastOpenedAt: new Date().toISOString(),
      completedAt: progress[lessonId]?.completedAt ?? new Date().toISOString(),
    },
  };
  window.localStorage.setItem(
    lessonProgressStorageKey,
    JSON.stringify(nextProgress),
  );
  window.dispatchEvent(new Event(lessonProgressEventName));
}
