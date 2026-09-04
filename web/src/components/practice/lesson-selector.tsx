"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  Clock3,
  Home,
  RotateCcw,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { PracticeMarkdown } from "@/components/practice/practice-markdown";
import { SentencePracticeCard } from "@/components/practice/sentence-practice-card";
import {
  readProgress,
  resumeStepIndex,
  saveLessonProgress,
} from "@/lib/learner/progress";
import { lessonMinutes, lessonOutcome } from "@/lib/learner/presentation";
import type { LessonBlock } from "@/lib/lesson-builder/types";

export type PracticeLesson = {
  id: string;
  lessonNumber: number;
  moduleId?: string;
  moduleName?: string | null;
  moduleLessonNumber?: number;
  name: string | null;
  explanationCount: number;
  practiceCount: number;
  previewText: string;
  blocks: LessonBlock[];
};

const subscribeHydration = () => () => {};

export function LessonSelector({
  lessons,
  initialLessonId = null,
  onCloseLesson,
}: {
  lessons: PracticeLesson[];
  initialLessonId?: string | null;
  onCloseLesson?: () => void;
}) {
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  const lesson = lessons.find((item) => item.id === initialLessonId);
  if (!lesson) return null;
  if (!hydrated)
    return (
      <div className="learner-theme lesson-loading" role="status">
        Preparando tu lección…
      </div>
    );
  return (
    <LessonSession
      key={lesson.id}
      lesson={lesson}
      lessons={lessons}
      onCloseLesson={onCloseLesson}
    />
  );
}

function LessonSession({
  lesson,
  lessons,
  onCloseLesson,
}: {
  lesson: PracticeLesson;
  lessons: PracticeLesson[];
  onCloseLesson?: () => void;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(() =>
    onCloseLesson
      ? 0
      : resumeStepIndex(lesson.blocks, readProgress()[lesson.id]),
  );
  const [sentenceComplete, setSentenceComplete] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const totalSteps = lesson.blocks.length;
  const complete = stepIndex >= totalSteps;
  const block = lesson.blocks[stepIndex];
  const nextLesson = lessons
    .slice(lessons.findIndex((item) => item.id === lesson.id) + 1)
    .find((item) => item.blocks.length > 0);
  const outcome = lessonOutcome(lesson.blocks);
  const moduleLessons = lessons.filter((item) =>
    lesson.moduleId
      ? item.moduleId === lesson.moduleId
      : item.moduleName === lesson.moduleName,
  );
  const moduleDone =
    !nextLesson ||
    (lesson.moduleId
      ? nextLesson.moduleId !== lesson.moduleId
      : nextLesson.moduleName !== lesson.moduleName);
  const moduleComplete =
    complete &&
    !onCloseLesson &&
    moduleLessons.every(
      (item) =>
        item.blocks.length === 0 ||
        item.id === lesson.id ||
        Boolean(readProgress()[item.id]?.completedAt),
    );
  const canAdvance =
    !complete && (block?.type === "explanation" || sentenceComplete);

  const close = useCallback(() => {
    if (onCloseLesson) onCloseLesson();
    else
      router.push(
        lesson.moduleId
          ? `/?module=${encodeURIComponent(lesson.moduleId)}`
          : "/",
      );
  }, [lesson.moduleId, onCloseLesson, router]);

  const previous = useCallback(() => {
    setSentenceComplete(false);
    setStepIndex((index) => Math.max(0, index - 1));
  }, []);

  const advance = useCallback(() => {
    if (!canAdvance) return;
    const next = Math.min(stepIndex + 1, totalSteps);
    if (next === totalSteps && !onCloseLesson) {
      saveLessonProgress(lesson.id, {
        completedAt:
          readProgress()[lesson.id]?.completedAt ?? new Date().toISOString(),
        stepId: undefined,
      });
    }
    setSentenceComplete(false);
    setStepIndex(next);
  }, [canAdvance, lesson.id, onCloseLesson, stepIndex, totalSteps]);

  useEffect(() => {
    if (!onCloseLesson && !complete) {
      saveLessonProgress(lesson.id, {
        lastOpenedAt: new Date().toISOString(),
        stepId: block?.id,
      });
    }
  }, [block?.id, complete, lesson.id, onCloseLesson]);

  useEffect(() => {
    const priorOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = priorOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, []);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
    const input = contentRef.current?.querySelector<HTMLInputElement>(
      "[data-practice-answer]",
    );
    (input ?? sectionRef.current)?.focus({ preventScroll: true });
  }, [stepIndex]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      const textEntry = target?.closest(
        "input, textarea, [contenteditable='true']",
      );
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "Tab") {
        const focusable = Array.from(
          sectionRef.current?.querySelectorAll<HTMLElement>(
            "a[href],button:not([disabled]),input:not([disabled]),[tabindex='0']",
          ) ?? [],
        );
        const first = focusable[0];
        const last = focusable.at(-1);
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === sectionRef.current)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
        return;
      }
      if (
        event.key === "PageUp" ||
        (event.key === "ArrowLeft" &&
          (!textEntry || (target instanceof HTMLInputElement && !target.value)))
      ) {
        event.preventDefault();
        previous();
        return;
      }
      if (
        event.key === "PageDown" ||
        (event.key === "ArrowRight" && !textEntry)
      ) {
        event.preventDefault();
        advance();
        return;
      }
      // Native button and link activation takes precedence over lesson shortcuts.
      if (event.key === "Enter" && !target?.closest("button,a,textarea")) {
        event.preventDefault();
        if (complete) {
          if (nextLesson && !onCloseLesson)
            router.push(
              `/practice?lesson=${encodeURIComponent(nextLesson.id)}`,
            );
          else close();
        } else advance();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [advance, close, complete, nextLesson, onCloseLesson, previous, router]);

  return (
    <section
      ref={sectionRef}
      className="learner-theme lesson-session"
      role="dialog"
      aria-modal="true"
      aria-labelledby="practice-lesson-title"
      tabIndex={-1}
    >
      <header className="lesson-topbar">
        <button
          type="button"
          className="learner-icon-button"
          onClick={close}
          aria-label="Volver a mis lecciones"
          title="Volver a mis lecciones"
        >
          <X size={21} aria-hidden="true" />
        </button>
        <div className="lesson-topbar-title">
          <p>
            {lesson.moduleName || "Tu curso de inglés"}
            <span>
              {" "}
              · Lección {lesson.moduleLessonNumber ?? lesson.lessonNumber}
            </span>
          </p>
          <h1 id="practice-lesson-title">
            {lesson.name || `Lección ${lesson.lessonNumber}`}
          </h1>
        </div>
        <span className="lesson-step-count">
          {complete ? (
            <CheckCheck size={22} aria-label="Lección completa" />
          ) : (
            <>
              <strong>{stepIndex + 1}</strong>
              <span> / {totalSteps}</span>
            </>
          )}
        </span>
        <progress
          className="lesson-top-progress"
          aria-label="Progreso de la lección"
          value={complete ? totalSteps : stepIndex}
          max={totalSteps || 1}
        />
      </header>

      <div ref={contentRef} className="lesson-scroll-area">
        <div className="lesson-stage" key={complete ? "complete" : block?.id}>
          {complete ? (
            <div
              className="lesson-celebration learner-enter"
              aria-live="polite"
            >
              <div className="completion-seal">
                <Check size={34} strokeWidth={2.5} aria-hidden="true" />
              </div>
              <p className="learner-eyebrow">
                {moduleComplete ? "Módulo completo" : "Lección completa"}
              </p>
              <h2>
                {outcome?.english
                  ? "Esto ya lo puedes decir."
                  : "Un paso más. Bien hecho."}
              </h2>
              {outcome?.english && (
                <div className="earned-phrase">
                  <p lang="en">{outcome.english}</p>
                  <span>{outcome.spanish}</span>
                </div>
              )}
              <p className="completion-note">
                {moduleComplete
                  ? "Terminaste este módulo. Mira todo lo que has construido."
                  : "Lo construiste paso a paso. Y ya es tuyo."}
              </p>
              <div className="completion-actions">
                {nextLesson && !onCloseLesson && (
                  <button
                    type="button"
                    className="learner-button primary"
                    onClick={() =>
                      router.push(
                        `/practice?lesson=${encodeURIComponent(nextLesson.id)}`,
                      )
                    }
                  >
                    Una lección más
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  className={`learner-button ${nextLesson && !onCloseLesson ? "text-button" : "primary"}`}
                  onClick={close}
                >
                  <Home size={17} aria-hidden="true" />
                  Mis lecciones
                </button>
              </div>
              {nextLesson && !onCloseLesson && (
                <div className="completion-next">
                  <p>{moduleDone ? nextLesson.moduleName : "A continuación"}</p>
                  <strong>
                    {nextLesson.name || `Lección ${nextLesson.lessonNumber}`}
                  </strong>
                  <span>
                    <Clock3 size={13} aria-hidden="true" /> Aprox.{" "}
                    {lessonMinutes(nextLesson.blocks.length)} min
                  </span>
                </div>
              )}
              <button
                className="learner-button text-button replay-lesson"
                type="button"
                onClick={() => {
                  setSentenceComplete(false);
                  setStepIndex(0);
                }}
              >
                <RotateCcw size={15} aria-hidden="true" />
                Practicar de nuevo
              </button>
            </div>
          ) : block?.type === "explanation" ? (
            <div className="lesson-explanation learner-enter">
              <span className="step-overline">
                <span aria-hidden="true" />
                Una idea nueva
              </span>
              <PracticeMarkdown
                markdown={
                  block.contentMarkdown || "Continúa al siguiente paso."
                }
              />
            </div>
          ) : block?.type === "sentence" ? (
            <SentencePracticeCard
              sentence={block}
              onCompletionChange={setSentenceComplete}
            />
          ) : null}
        </div>
      </div>

      {!complete && (
        <footer
          className={`lesson-controls ${sentenceComplete ? "ready" : ""}`}
        >
          <div className="lesson-controls-inner">
            <button
              type="button"
              className="learner-icon-button previous-step"
              disabled={stepIndex === 0}
              onClick={previous}
              aria-label="Paso anterior"
              title="Paso anterior"
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
            <div className="lesson-feedback" role="status">
              {sentenceComplete ? (
                <>
                  <Check size={20} aria-hidden="true" />
                  <span>¡Muy bien!</span>
                </>
              ) : (
                <span className="lesson-position">
                  Lección {lesson.moduleLessonNumber ?? lesson.lessonNumber}
                  {lesson.moduleLessonNumber && moduleLessons.length > 0
                    ? ` de ${moduleLessons.length}`
                    : ""}
                </span>
              )}
            </div>
            <button
              type="button"
              className={`learner-button ${sentenceComplete ? "success" : "primary"}`}
              disabled={!canAdvance}
              onClick={advance}
            >
              {stepIndex === totalSteps - 1
                ? "Terminar lección"
                : block?.type === "explanation" &&
                    lesson.blocks[stepIndex + 1]?.type === "sentence"
                  ? "Vamos a practicar"
                  : "Continuar"}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </footer>
      )}
    </section>
  );
}
