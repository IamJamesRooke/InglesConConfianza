"use client";

import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { ConfirmResetButton } from "@/components/learner/confirm-reset-button";
import {
  EMPTY_FEEDBACK_CONTEXT,
  FeedbackSheet,
  type FeedbackSheetHandle,
} from "@/components/learner/feedback-sheet";
import { LessonRow } from "@/components/learner/lesson-row";
import { SiteFooter } from "@/components/site-footer";
import type {
  LearnerLesson,
  LearnerModule,
} from "@/components/learner/types";
import {
  nextLessonToStudy,
  readProgress,
  resetLessonProgress,
  serverProgress,
  subscribeToProgress,
} from "@/lib/learner/progress";
import { resetOnboarding } from "@/lib/learner/onboarding";
import { useVariableText } from "@/lib/learner/use-learner-variables";
import { clearLearnerVariables } from "@/lib/learner/variables";

// The onboarding module is filtered out before it ever reaches this
// component (src/app/page.tsx) — every module here is an ordinary course
// module, numbered in course order.
function moduleLabel(modules: LearnerModule[], index: number) {
  return `Módulo ${index + 1}`;
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
  hasPublishedOnboarding = false,
}: {
  modules: LearnerModule[];
  initialModuleId?: string | null;
  /** Shows the footer's "Ver la introducción otra vez" replay link (docs/
   * design/onboarding.md §1). */
  hasPublishedOnboarding?: boolean;
}) {
  const feedbackSheetRef = useRef<FeedbackSheetHandle>(null);
  // The promise card reads a lesson's final sentence, which may carry a
  // `{key}` token from a capture piece — substituted for display only.
  const substitute = useVariableText();
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
              onReset={(lessonId) => resetLessonProgress([lessonId])}
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
              {courseComplete
                ? "Repasa"
                : hasActivity
                  ? "Tu próxima lección"
                  : "Empieza aquí"}
            </p>
            <h1 className="hero-line">
              {courseComplete ? (
                "Todo listo."
              ) : hasActivity ? (
                nextModule?.name || moduleLabel(modules, nextModuleIndex)
              ) : (
                <>
                  Habla inglés. Con confianza
                  <span aria-hidden="true">.</span>
                </>
              )}
            </h1>
            <p className="hero-subcopy">
              {courseComplete
                ? "Vuelve a cualquier lección cuando quieras."
                : hasActivity
                  ? nextModule?.description || "Sigamos donde lo dejaste."
                  : "Aprende paso a paso y construye frases que puedes usar desde hoy."}
            </p>
            <div className="hero-promise">
              <p className="learner-eyebrow hero-promise-eyebrow">
                Vas a poder decir
              </p>
              <p className="hero-promise-en" lang="en">
                {substitute(nextLesson.outcomeEnglish || "I can speak English.")}
              </p>
              <p className="hero-promise-es" lang="es">
                {substitute(nextLesson.previewText || "Puedo hablar inglés.")}
              </p>
            </div>
            <Link
              href={`/practice?lesson=${encodeURIComponent(nextLesson.id)}`}
              className="hero-cta"
            >
              {courseComplete
                ? "Repasar desde el inicio"
                : hasActivity
                  ? "Continuar"
                  : "Empezar"}
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
                    <div className="path-module-heading">
                      <h3 id={`module-${module.id}-title`} className="path-module-title">
                        {module.name || moduleLabel(modules, modules.indexOf(module))}
                      </h3>
                      {module.lessons.some(
                        (lesson) => progress[lesson.id]?.completedAt,
                      ) ? (
                        <ConfirmResetButton
                          className="path-module-reset"
                          label="Reiniciar módulo"
                          confirmLabel="¿Seguro? Reiniciar"
                          onConfirm={() =>
                            resetLessonProgress(
                              module.lessons.map((lesson) => lesson.id),
                            )
                          }
                        />
                      ) : null}
                    </div>
                    {pathRows(module.lessons)}
                  </section>
                ))
              : pathRows(modulesWithLessons[0]?.lessons ?? [])}
          </section>
        )}

      </div>
      <SiteFooter
        variant="learner"
        showOnboardingReplay={hasPublishedOnboarding}
        onResetAll={() => {
          resetLessonProgress(lessons.map((lesson) => lesson.id));
          resetOnboarding();
          // "Reiniciar todo" forgets the learner's name too — a tester
          // replaying onboarding is asked for it again.
          clearLearnerVariables();
        }}
      />
      <FeedbackSheet
        ref={feedbackSheetRef}
        context={{
          ...EMPTY_FEEDBACK_CONTEXT,
          slideKind: "home",
          slide: { nextLessonId: nextLesson?.id ?? null },
          progress: { lessonsCompleted: completed, lessonsTotal: available.length },
        }}
      />
    </main>
  );
}
