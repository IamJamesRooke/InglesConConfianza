"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  Home,
  SkipForward,
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
  skipLesson,
} from "@/lib/learner/progress";
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
  concepts: Array<{
    id: string;
    spanish: string;
    english: string;
  }>;
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
  const [completionCursor, setCompletionCursor] = useState(() =>
    lessons.findIndex((item) => item.id === lesson.id),
  );
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const totalSteps = lesson.blocks.length;
  const complete = stepIndex >= totalSteps;
  const block = lesson.blocks[stepIndex];
  const nextLesson = lessons
    .slice(completionCursor + 1)
    .find(
      (item) =>
        item.blocks.length > 0 && !readProgress()[item.id]?.completedAt,
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
              <p className="completion-status">Lección completada</p>
              {nextLesson && !onCloseLesson ? (
                <div className="completion-next">
                  <h2>Siguiente lección</h2>
                  <CompletionConcepts concepts={nextLesson.concepts} />
                </div>
              ) : null}
              <div className="completion-actions" aria-label="Opciones">
                {nextLesson && !onCloseLesson && (
                  <button
                    type="button"
                    className="completion-action primary"
                    onClick={() =>
                      router.push(
                        `/practice?lesson=${encodeURIComponent(nextLesson.id)}`,
                      )
                    }
                    aria-label="Continuar a la siguiente lección"
                    title="Siguiente lección"
                  >
                    <ArrowRight size={22} aria-hidden="true" />
                    <span>Continuar</span>
                  </button>
                )}
                {nextLesson && !onCloseLesson && (
                  <button
                    type="button"
                    className="completion-action"
                    onClick={() => {
                      skipLesson(nextLesson.id);
                      setCompletionCursor(
                        lessons.findIndex((item) => item.id === nextLesson.id),
                      );
                    }}
                    aria-label="Omitir la siguiente lección"
                    title="Omitir lección"
                  >
                    <SkipForward size={21} aria-hidden="true" />
                    <span>Omitir</span>
                  </button>
                )}
                <button
                  type="button"
                  className="completion-action quiet"
                  onClick={close}
                  aria-label="Volver a mis lecciones"
                  title="Inicio"
                >
                  <Home size={20} aria-hidden="true" />
                  <span>Inicio</span>
                </button>
              </div>
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
              {sentenceComplete && (
                <>
                  <Check size={20} aria-hidden="true" />
                  <span>¡Muy bien!</span>
                </>
              )}
            </div>
            <button
              type="button"
              className={`learner-button ${sentenceComplete ? "success" : "primary"} ${block?.type === "sentence" && !sentenceComplete ? "awaiting-answer" : ""}`}
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

function CompletionConcepts({
  concepts,
}: {
  concepts: PracticeLesson["concepts"];
}) {
  if (concepts.length === 0)
    return <span className="completion-review">Repaso</span>;

  return (
    <div className="completion-concepts" aria-label="Lo que aprenderás">
      {concepts.map((concept) => (
        <div className="completion-concept" key={concept.id}>
          <strong lang="en">{concept.english}</strong>
          <span lang="es">{concept.spanish}</span>
        </div>
      ))}
    </div>
  );
}
