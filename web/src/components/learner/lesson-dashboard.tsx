"use client";

import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";

import { LessonRow } from "@/components/learner/lesson-row";
import type {
  LearnerLesson,
  LearnerModule,
} from "@/components/learner/types";
import {
  nextLessonToStudy,
  readProgress,
  serverProgress,
  subscribeToProgress,
} from "@/lib/learner/progress";

function moduleLabel(modules: LearnerModule[], index: number) {
  return modules[index]?.kind === "onboarding"
    ? "Primeros pasos"
    : `Módulo ${modules.slice(0, index + 1).filter((module) => module.kind !== "onboarding").length}`;
}

/**
 * Home — "your next sentence" (docs/design/learner-direction.md). One
 * promise (the hero) and a path (the lesson list). No module rail, no
 * tabs, no per-row skip/reset: a single module renders its lessons flat
 * under "Tu recorrido"; several modules get their name as a sub-heading
 * above their own rows, in course order. `?module=` still lands you on
 * that module by scrolling/focusing its section.
 */
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
  const lessons = modules.flatMap((module) => module.lessons);
  const available = lessons.filter((lesson) => lesson.stepCount > 0);
  const completed = available.filter(
    (lesson) => progress[lesson.id]?.completedAt,
  ).length;
  const nextLesson = nextLessonToStudy(lessons, progress);
  const nextModuleIndex = modules.findIndex((module) =>
    module.lessons.some((lesson) => lesson.id === nextLesson?.id),
  );
  const nextModule = nextModuleIndex >= 0 ? modules[nextModuleIndex] : undefined;
  const hasActivity = available.some(
    (lesson) =>
      progress[lesson.id]?.lastOpenedAt || progress[lesson.id]?.completedAt,
  );
  const courseComplete = available.length > 0 && completed === available.length;
  const modulesWithLessons = modules.filter(
    (module) => module.lessons.length > 0,
  );
  const showModuleSections = modulesWithLessons.length > 1;

  useEffect(() => {
    if (!initialModuleId) return;
    const section = document.getElementById(`module-${initialModuleId}`);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
    section?.focus({ preventScroll: true });
  }, [initialModuleId]);

  function pathRows(rowLessons: LearnerLesson[]) {
    return (
      <div className="path-track-wrap">
        <div className="path-track" aria-hidden="true" />
        <ol className="path-list">
          {rowLessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              progress={progress[lesson.id]}
              isNext={lesson.id === nextLesson?.id && !courseComplete}
            />
          ))}
        </ol>
      </div>
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="learner-theme course-home">
      <div className="course-container">
        {nextLesson ? (
          <section className="hero-card learner-enter" aria-label="Tu próxima lección">
            <p className="learner-eyebrow hero-eyebrow">
              {hasActivity ? "Tu próxima lección" : "Empieza aquí"}
            </p>
            <h1 className="hero-line">
              {hasActivity
                ? nextModule?.name || moduleLabel(modules, nextModuleIndex)
                : (
                  <>
                    Habla inglés. Con confianza
                    <span aria-hidden="true">.</span>
                  </>
                )}
            </h1>
            <p className="hero-subcopy">
              {hasActivity
                ? nextModule?.description || "Sigamos donde lo dejaste."
                : "Aprende paso a paso y construye frases que puedes usar desde hoy."}
            </p>
            <div className="hero-promise">
              <p className="learner-eyebrow hero-promise-eyebrow">
                Vas a poder decir
              </p>
              <p className="hero-promise-en" lang="en">
                {nextLesson.outcomeEnglish || "I can speak English."}
              </p>
              <p className="hero-promise-es" lang="es">
                {nextLesson.previewText || "Puedo hablar inglés."}
              </p>
            </div>
            <Link
              href={`/practice?lesson=${encodeURIComponent(nextLesson.id)}`}
              className="hero-cta"
            >
              {hasActivity ? "Continuar" : "Empezar"}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </section>
        ) : (
          <section className="course-empty">
            <BookOpen size={32} aria-hidden="true" />
            <h2>Nos vemos pronto</h2>
            <p>Las próximas conversaciones ya están en camino.</p>
          </section>
        )}

        {modulesWithLessons.length > 0 && (
          <section className="course-path" aria-labelledby="course-path-title">
            <h2 id="course-path-title" className="path-title">
              Tu recorrido
            </h2>
            {showModuleSections
              ? modulesWithLessons.map((module) => (
                  <section
                    key={module.id}
                    id={`module-${module.id}`}
                    tabIndex={-1}
                    className="path-module"
                    aria-labelledby={`module-${module.id}-title`}
                  >
                    <h3 id={`module-${module.id}-title`} className="path-module-title">
                      {module.name || moduleLabel(modules, modules.indexOf(module))}
                    </h3>
                    {pathRows(module.lessons)}
                  </section>
                ))
              : pathRows(modulesWithLessons[0]?.lessons ?? [])}
          </section>
        )}

        <footer className="course-footer">
          <span>Inglés con Confianza.</span>
          <a href="#feedback">¿Qué te pareció?</a>
        </footer>
      </div>
    </main>
  );
}
