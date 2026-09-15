"use client";

import {
  ArrowRight,
  BookOpen,
  CheckCheck,
  Lock,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { LessonRow } from "@/components/learner/lesson-row";
import type {
  LearnerLesson,
  LearnerModule,
} from "@/components/learner/types";
import {
  nextLessonToStudy,
  readProgress,
  resetLessonProgress,
  serverProgress,
  skipLesson,
  skipLessons,
  subscribeToProgress,
} from "@/lib/learner/progress";
import { lessonMinutes } from "@/lib/learner/presentation";

function moduleLabel(modules: LearnerModule[], index: number) {
  return modules[index]?.kind === "onboarding"
    ? "Primeros pasos"
    : `Módulo ${modules.slice(0, index + 1).filter((module) => module.kind !== "onboarding").length}`;
}

export function LessonDashboard({
  modules,
  initialModuleId = null,
}: {
  modules: LearnerModule[];
  initialModuleId?: string | null;
}) {
  const progress = useSyncExternalStore(
    subscribeToProgress,
    readProgress,
    serverProgress,
  );
  const [resetTarget, setResetTarget] = useState<{
    label: string;
    lessonIds: string[];
    scope: "lesson" | "module";
  } | null>(null);
  const lessons = modules.flatMap((module) => module.lessons);
  const lessonIndex = new Map(lessons.map((lesson, index) => [lesson.id, index]));
  const available = lessons.filter((lesson) => lesson.stepCount > 0);
  const completed = available.filter(
    (lesson) => progress[lesson.id]?.completedAt,
  ).length;
  const nextLesson = nextLessonToStudy(lessons, progress);
  const nextModule = modules.find((module) =>
    module.lessons.some((lesson) => lesson.id === nextLesson?.id),
  );
  const nextModuleIndex = nextModule ? modules.indexOf(nextModule) : -1;
  const courseComplete = available.length > 0 && completed === available.length;
  const hasActivity = available.some(
    (lesson) =>
      progress[lesson.id]?.lastOpenedAt || progress[lesson.id]?.completedAt,
  );

  // A `?module=` link (from an "Omitir módulo" toast or a bookmark) jumps the
  // page to that module's section instead of hiding the rest of the course —
  // the whole path is always visible, editorial-style.
  useEffect(() => {
    if (!initialModuleId) return;
    document
      .getElementById(`module-${initialModuleId}`)
      ?.scrollIntoView({ block: "start" });
  }, [initialModuleId]);

  function resetLesson(lesson: LearnerLesson) {
    setResetTarget({
      label: lesson.name || `Lección ${lesson.lessonNumber}`,
      lessonIds: [lesson.id],
      scope: "lesson",
    });
  }

  function resetModule(module: LearnerModule) {
    setResetTarget({
      label: module.name || "este módulo",
      lessonIds: module.lessons.map((lesson) => lesson.id),
      scope: "module",
    });
  }

  const eyebrow = courseComplete
    ? null
    : hasActivity
      ? `Tu próxima lección · ${moduleLabel(modules, nextModuleIndex).toUpperCase()} · Lección ${nextLesson?.moduleLessonNumber}`
      : "Empieza aquí";

  const primaryLabel = courseComplete
    ? "Repasar el curso"
    : nextLesson && progress[nextLesson.id]?.lastOpenedAt
      ? "Continuar"
      : "Empezar";

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="learner-theme home-page route-fade-in"
    >
      <div className="course-container">
        {nextLesson ? (
          <section className="home-hero learner-enter" aria-label="Tu próxima lección">
            <p className="home-eyebrow">{eyebrow}</p>
            {courseComplete ? (
              <h1 className="home-hero-es">Lo lograste.</h1>
            ) : (
              <h1 className="home-hero-es" lang="es">
                {nextLesson.previewText}
              </h1>
            )}
            {courseComplete ? (
              <p className="home-hero-sub">
                Puedes repasar cualquier lección cuando quieras.
              </p>
            ) : (
              nextLesson.answerText && (
                <p className="home-hero-en" lang="en">
                  {nextLesson.answerText}
                </p>
              )
            )}
            <div className="home-hero-actions">
              <Link
                href={`/practice?lesson=${encodeURIComponent(nextLesson.id)}`}
                className="home-pill"
              >
                {primaryLabel}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              {!courseComplete && (
                <span className="home-hero-duration">
                  · {lessonMinutes(nextLesson.stepCount)} min
                </span>
              )}
            </div>
          </section>
        ) : (
          <section className="course-empty">
            <BookOpen size={32} aria-hidden="true" />
            <h1>Nos vemos pronto</h1>
            <p>Las próximas conversaciones ya están en camino.</p>
          </section>
        )}

        {modules.length > 0 && (
          <section className="course-journey" aria-labelledby="course-journey-title">
            <div className="course-journey-heading">
              <div>
                <p className="learner-eyebrow">Tu curso</p>
                <h2 id="course-journey-title">Tu recorrido</h2>
              </div>
              {hasActivity && (
                <p className="course-progress-summary">
                  <strong>{completed}</strong> de {available.length} lecciones
                  completas
                </p>
              )}
            </div>
            <div className="journey-columns">
              <nav className="journey-toc" aria-label="Módulos del curso">
                {modules.map((module, index) => {
                  const ready = module.lessons.filter(
                    (lesson) => lesson.stepCount > 0,
                  );
                  const done = ready.filter(
                    (lesson) => progress[lesson.id]?.completedAt,
                  ).length;
                  const pct = ready.length
                    ? Math.round((done / ready.length) * 100)
                    : 0;
                  const locked = ready.length === 0;
                  return (
                    <a
                      key={module.id}
                      href={`#module-${module.id}`}
                      className={`journey-toc-item home-fade-up ${nextModule?.id === module.id ? "current" : ""} ${locked ? "locked" : ""}`}
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <span className="journey-toc-label">
                        {moduleLabel(modules, index)}
                      </span>
                      <strong>{module.name || moduleLabel(modules, index)}</strong>
                      {locked ? (
                        <span className="journey-toc-locked">
                          <Lock size={11} aria-hidden="true" />
                          Pronto
                        </span>
                      ) : (
                        <>
                          <span
                            className="journey-toc-rule"
                            style={{ "--target": `${pct}%` } as CSSProperties}
                          >
                            <span />
                          </span>
                          <span className="journey-toc-count">
                            {done} de {ready.length}
                          </span>
                        </>
                      )}
                    </a>
                  );
                })}
              </nav>

              <div className="journey-lessons">
                {modules.map((module, index) => {
                  const moduleAvailable = module.lessons.filter(
                    (lesson) => lesson.stepCount > 0,
                  );
                  const moduleCompleted = moduleAvailable.filter(
                    (lesson) => progress[lesson.id]?.completedAt,
                  ).length;
                  const locked = moduleAvailable.length === 0;
                  return (
                    <section
                      key={module.id}
                      id={`module-${module.id}`}
                      className="journey-module"
                      aria-labelledby={`module-heading-${module.id}`}
                    >
                      <div className="journey-module-heading">
                        <div>
                          <p className="learner-eyebrow">
                            {moduleLabel(modules, index)}
                          </p>
                          <h3
                            id={`module-heading-${module.id}`}
                            className={locked ? "locked" : ""}
                          >
                            {module.name || moduleLabel(modules, index)}
                            {locked && (
                              <span className="journey-module-locked">
                                <Lock size={13} aria-hidden="true" />
                                Pronto
                              </span>
                            )}
                          </h3>
                        </div>
                        {!locked && (
                          <div className="journey-module-actions">
                            {moduleCompleted < moduleAvailable.length && (
                              <button
                                type="button"
                                className="journey-text-link"
                                onClick={() =>
                                  skipLessons(
                                    moduleAvailable.map((lesson) => lesson.id),
                                  )
                                }
                              >
                                <SkipForward size={12} aria-hidden="true" />
                                Omitir módulo
                              </button>
                            )}
                            {moduleAvailable.some(
                              (lesson) =>
                                progress[lesson.id]?.completedAt ||
                                progress[lesson.id]?.lastOpenedAt,
                            ) && (
                              <button
                                type="button"
                                className="journey-text-link"
                                onClick={() => resetModule(module)}
                              >
                                <RotateCcw size={12} aria-hidden="true" />
                                Reiniciar módulo
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {module.lessons.length > 0 ? (
                        <ol className="lesson-path">
                          {module.lessons.map((lesson) => (
                            <LessonRow
                              key={lesson.id}
                              lesson={lesson}
                              progress={progress[lesson.id]}
                              isNext={lesson.id === nextLesson?.id && !courseComplete}
                              onSkip={() => skipLesson(lesson.id)}
                              onReset={() => resetLesson(lesson)}
                              delayMs={(lessonIndex.get(lesson.id) ?? 0) * 40}
                            />
                          ))}
                        </ol>
                      ) : (
                        <p className="module-empty">
                          Las lecciones de este módulo estarán disponibles
                          pronto.
                        </p>
                      )}
                      {!locked && moduleCompleted === moduleAvailable.length && (
                        <p className="module-finish">
                          <CheckCheck size={19} aria-hidden="true" /> Módulo
                          completo. Cada frase cuenta.
                        </p>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>
          </section>
        )}
        <footer className="course-footer">
          Inglés con Confianza · Bogotá
        </footer>
      </div>
      {resetTarget && (
        <div
          className="progress-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setResetTarget(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setResetTarget(null);
          }}
        >
          <section
            className="progress-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="progress-dialog-title"
          >
            <p className="learner-eyebrow">Volver a empezar</p>
            <h2 id="progress-dialog-title">¿Reiniciar {resetTarget.label}?</h2>
            <p>
              {resetTarget.scope === "module"
                ? "Se borrará el progreso de todas las lecciones de este módulo."
                : "Volverás al primer paso de esta lección."}
            </p>
            <div className="progress-dialog-actions">
              <button
                type="button"
                className="learner-button text-button"
                onClick={() => setResetTarget(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="learner-button primary"
                autoFocus
                onClick={() => {
                  resetLessonProgress(resetTarget.lessonIds);
                  setResetTarget(null);
                }}
              >
                Sí, reiniciar
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
