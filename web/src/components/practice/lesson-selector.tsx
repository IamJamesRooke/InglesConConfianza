"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Keyboard,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { PracticeMarkdown } from "@/components/practice/practice-markdown";
import { SentencePracticeCard } from "@/components/practice/sentence-practice-card";
import type { LessonBlock } from "@/lib/lesson-builder/types";

export type PracticeLesson = {
  id: string;
  lessonNumber: number;
  moduleName?: string | null;
  moduleLessonNumber?: number;
  name: string | null;
  explanationCount: number;
  practiceCount: number;
  previewText: string;
  blocks: LessonBlock[];
};

export function LessonSelector({
  lessons,
  initialLessonId = null,
  onCloseLesson,
}: {
  lessons: PracticeLesson[];
  initialLessonId?: string | null;
  onCloseLesson?: () => void;
}) {
  const [openLessonId, setOpenLessonId] = useState<string | null>(
    initialLessonId,
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCurrentSentenceComplete, setIsCurrentSentenceComplete] =
    useState(false);
  const [isShortcutReminderOpen, setIsShortcutReminderOpen] = useState(false);
  const lessonModeRef = useRef<HTMLElement | null>(null);
  const openLesson = lessons.find((lesson) => lesson.id === openLessonId);
  const totalSteps = openLesson?.blocks.length ?? 0;
  const isComplete = Boolean(openLesson && currentStepIndex >= totalSteps);
  const currentBlock =
    openLesson && !isComplete ? openLesson.blocks[currentStepIndex] : null;

  const openLessonPractice = useCallback((lessonId: string) => {
    setOpenLessonId(lessonId);
    setCurrentStepIndex(0);
    setIsCurrentSentenceComplete(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const closeLessonPractice = useCallback(() => {
    setOpenLessonId(null);
    setCurrentStepIndex(0);
    setIsCurrentSentenceComplete(false);
    onCloseLesson?.();
  }, [onCloseLesson]);

  const canManuallyAdvance =
    isComplete ||
    currentBlock?.type === "explanation" ||
    (currentBlock?.type === "sentence" && isCurrentSentenceComplete) ||
    totalSteps === 0;

  const goToPreviousStep = useCallback(() => {
    setIsCurrentSentenceComplete(false);
    setCurrentStepIndex((currentIndex) => Math.max(currentIndex - 1, 0));
  }, []);

  const goToNextStep = useCallback(() => {
    if (!canManuallyAdvance || !openLesson) {
      return;
    }

    setIsCurrentSentenceComplete(false);
    setCurrentStepIndex((currentIndex) =>
      Math.min(currentIndex + 1, openLesson.blocks.length),
    );
  }, [canManuallyAdvance, openLesson]);

  useEffect(() => {
    if (!openLesson) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      const lessonMode = lessonModeRef.current;
      const firstAnswerInput =
        lessonMode?.querySelector<HTMLInputElement>("[data-practice-answer]");

      if (firstAnswerInput) {
        firstAnswerInput.focus();
      } else {
        lessonMode?.focus();
      }
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [openLesson]);

  useEffect(() => {
    if (!openLesson) {
      return;
    }

    function isInteractiveTarget(target: EventTarget | null) {
      return (
        target instanceof HTMLElement &&
        Boolean(
          target.closest(
            "button, input, textarea, select, a, [contenteditable='true']",
          ),
        )
      );
    }

    function isTextEntryTarget(target: EventTarget | null) {
      return (
        target instanceof HTMLElement &&
        Boolean(target.closest("input, textarea, [contenteditable='true']"))
      );
    }

    function isEmptyTextEntryTarget(target: EventTarget | null) {
      return (
        (target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement) &&
        target.value.length === 0
      );
    }

    function handlePracticeNavigation(event: KeyboardEvent) {
      if (event.altKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsShortcutReminderOpen((isOpen) => !isOpen);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        if (isShortcutReminderOpen) {
          setIsShortcutReminderOpen(false);
        } else {
          closeLessonPractice();
        }
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = Array.from(
          lessonModeRef.current?.querySelectorAll<HTMLElement>(
            "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])",
          ) ?? [],
        );
        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement =
          focusableElements[focusableElements.length - 1];

        if (!firstFocusableElement || !lastFocusableElement) {
          event.preventDefault();
          return;
        }

        if (
          event.shiftKey &&
          document.activeElement === firstFocusableElement
        ) {
          event.preventDefault();
          lastFocusableElement.focus();
          return;
        }

        if (
          !event.shiftKey &&
          document.activeElement === lastFocusableElement
        ) {
          event.preventDefault();
          firstFocusableElement.focus();
          return;
        }
      }

      if (isShortcutReminderOpen) {
        return;
      }

      if (event.key === "PageDown") {
        event.preventDefault();
        goToNextStep();
        return;
      }

      if (event.key === "PageUp") {
        event.preventDefault();
        goToPreviousStep();
        return;
      }

      if (!isTextEntryTarget(event.target) && event.key === "ArrowRight") {
        event.preventDefault();
        goToNextStep();
        return;
      }

      if (
        event.key === "ArrowLeft" &&
        (!isTextEntryTarget(event.target) ||
          isEmptyTextEntryTarget(event.target))
      ) {
        event.preventDefault();
        goToPreviousStep();
        return;
      }

      if (event.key === "Enter" && isComplete) {
        event.preventDefault();
        closeLessonPractice();
        return;
      }

      if (
        event.key === "Enter" &&
        currentBlock?.type === "sentence" &&
        isCurrentSentenceComplete
      ) {
        event.preventDefault();
        goToNextStep();
        return;
      }

      if (isInteractiveTarget(event.target)) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        goToNextStep();
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        goToPreviousStep();
        return;
      }

      if (event.key === "Enter" && currentBlock?.type === "explanation") {
        event.preventDefault();
        goToNextStep();
      }
    }

    document.addEventListener("keydown", handlePracticeNavigation);

    return () => {
      document.removeEventListener("keydown", handlePracticeNavigation);
    };
  }, [
    closeLessonPractice,
    currentBlock?.type,
    goToNextStep,
    goToPreviousStep,
    isShortcutReminderOpen,
    isComplete,
    isCurrentSentenceComplete,
    openLesson,
  ]);

  if (lessons.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <p className="font-semibold text-foreground">
          Todavía no hay lecciones.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea una lección en Lesson Builder y vuelve aquí para practicarla.
        </p>
      </div>
    );
  }

  if (openLesson) {
    const progressPercent =
      totalSteps === 0
        ? 100
        : isComplete
          ? 100
          : Math.min(((currentStepIndex + 1) / totalSteps) * 100, 100);
    const progressStep = isComplete
      ? totalSteps
      : Math.min(currentStepIndex + 1, totalSteps);

    return (
      <section
        ref={lessonModeRef}
        className="fixed inset-0 z-50 overflow-y-auto bg-background text-foreground"
        role="dialog"
        aria-modal="true"
        aria-labelledby="practice-lesson-title"
        tabIndex={-1}
      >
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 pt-5 sm:px-8 sm:pt-6">
          <header className="shrink-0">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={closeLessonPractice}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Salir
              </button>
              <button
                type="button"
                onClick={() => setIsShortcutReminderOpen(true)}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
                aria-label="Ver atajos de teclado"
                title="Atajos de teclado (Alt+K)"
              >
                <Keyboard className="size-4" aria-hidden="true" />
                Atajos
              </button>
            </div>
            <div className="mt-5 flex items-end justify-between gap-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {openLesson.moduleName
                    ? `${openLesson.moduleName} · Lección ${
                        openLesson.moduleLessonNumber ?? openLesson.lessonNumber
                      }`
                    : `Lección ${openLesson.lessonNumber}`}
                </p>
                <h2
                  id="practice-lesson-title"
                  className="mt-1 truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
                >
                  {openLesson.name || `Lección ${openLesson.lessonNumber}`}
                </h2>
              </div>
              <p className="shrink-0 pb-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {isComplete
                  ? "Completa"
                  : `Paso ${currentStepIndex + 1} de ${Math.max(totalSteps, 1)}`}
              </p>
            </div>
            <div
              className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="Progreso de la lección"
              aria-valuemin={0}
              aria-valuemax={Math.max(totalSteps, 1)}
              aria-valuenow={progressStep}
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </header>

          <div className="flex flex-1 items-center py-8 sm:pb-16 sm:pt-10">
            <div className="w-full">
              {isComplete ? (
                <div
                  className="mx-auto max-w-3xl rounded-3xl border border-border bg-[var(--surface)] p-8 text-center shadow-sm sm:p-10"
                  aria-live="polite"
                >
                  <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="size-7" aria-hidden="true" />
                  </span>
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight">
                    Lección completa
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                    ¡Muy bien! Más adelante aquí veremos tus resultados, los
                    conceptos practicados y el siguiente paso.
                  </p>
                  <button
                    type="button"
                    onClick={closeLessonPractice}
                    className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
                  >
                    Volver a lecciones
                  </button>
                </div>
              ) : currentBlock?.type === "explanation" ? (
                <PracticeExplanationStep
                  markdown={currentBlock.contentMarkdown}
                />
              ) : currentBlock?.type === "sentence" ? (
                <SentencePracticeCard
                  key={currentBlock.id}
                  sentence={currentBlock}
                  onCompletionChange={setIsCurrentSentenceComplete}
                />
              ) : null}
            </div>
          </div>

          <footer className="-mx-5 flex shrink-0 items-start justify-between gap-3 border-t border-border bg-background/95 px-5 py-3.5 backdrop-blur sm:-mx-8 sm:px-8">
            <button
              type="button"
              onClick={goToPreviousStep}
              disabled={currentStepIndex === 0}
              className="inline-flex min-w-32 items-center justify-center gap-2 rounded-full border border-border bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Anterior
            </button>
            <div className="flex min-w-32 flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={goToNextStep}
                disabled={!canManuallyAdvance || isComplete}
                className="inline-flex min-w-32 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
              >
                {currentStepIndex >= totalSteps - 1 ? "Terminar" : "Siguiente"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
              {canManuallyAdvance && !isComplete && (
                <PracticeKey>Enter</PracticeKey>
              )}
            </div>
          </footer>
        </div>

        {isShortcutReminderOpen && (
          <PracticeShortcutReminder
            onClose={() => setIsShortcutReminderOpen(false)}
          />
        )}
      </section>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {lessons.map((lesson) => (
        <button
          key={lesson.id}
          type="button"
          onClick={() => openLessonPractice(lesson.id)}
          className="rounded-2xl border border-border bg-[var(--surface)] p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {lesson.moduleName
                  ? `${lesson.moduleName} · Lección ${
                      lesson.moduleLessonNumber ?? lesson.lessonNumber
                    }`
                  : `Lección ${lesson.lessonNumber}`}
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                {lesson.name || `Lección ${lesson.lessonNumber}`}
              </h2>
            </div>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BookOpen className="size-5" aria-hidden="true" />
            </span>
          </div>

          <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
            {lesson.previewText || "Sin vista previa todavía."}
          </p>

          <div className="mt-5 flex gap-2 text-xs font-semibold text-muted-foreground">
            <span className="rounded-full bg-muted px-2.5 py-1">
              {lesson.practiceCount}{" "}
              {lesson.practiceCount === 1 ? "práctica" : "prácticas"}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1">
              {lesson.explanationCount}{" "}
              {lesson.explanationCount === 1
                ? "explicación"
                : "explicaciones"}
            </span>
          </div>
        </button>
      ))}
    </section>
  );
}

function PracticeShortcutReminder({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-20 flex items-start justify-center bg-black/30 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="practice-shortcut-reminder-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="mt-16 w-full max-w-md rounded-2xl border border-border bg-popover p-5 text-popover-foreground shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              id="practice-shortcut-reminder-title"
              className="text-xl font-semibold tracking-tight"
            >
              Atajos de teclado
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mantén el ritmo sin tocar el mouse.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar atajos de teclado"
            title="Cerrar"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-2">
          <PracticeShortcutReminderRow
            keys={["Alt", "K"]}
            description="Mostrar u ocultar atajos"
          />
          <PracticeShortcutReminderRow
            keys={["→"]}
            description="Avanzar cuando sea posible"
          />
          <PracticeShortcutReminderRow
            keys={["PageUp"]}
            description="Volver siempre al paso anterior"
          />
          <PracticeShortcutReminderRow
            keys={["←"]}
            description="Volver desde una respuesta vacía"
          />
          <PracticeShortcutReminderRow
            keys={["Enter"]}
            description="Continuar cuando el paso esté listo"
          />
          <PracticeShortcutReminderRow
            keys={["Alt", "H"]}
            description="Mostrar pista en una respuesta"
          />
          <PracticeShortcutReminderRow
            keys={["Esc"]}
            description="Salir de la lección"
          />
        </div>
      </div>
    </div>
  );
}

function PracticeShortcutReminderRow({
  keys,
  description,
}: {
  keys: string[];
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/50 px-4 py-3">
      <span className="text-sm font-medium text-foreground">{description}</span>
      <span className="flex shrink-0 items-center gap-1">
        {keys.map((key) => (
          <kbd
            key={key}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold text-muted-foreground shadow-sm"
          >
            {key}
          </kbd>
        ))}
      </span>
    </div>
  );
}

function PracticeKey({ children }: { children: string }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded-md border border-border bg-[var(--surface)] px-1.5 py-1 font-mono text-[10px] font-semibold leading-none text-foreground shadow-sm">
      {children}
    </kbd>
  );
}

function PracticeExplanationStep({
  markdown,
}: {
  markdown: string;
}) {
  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-border bg-[var(--surface)] px-6 py-8 text-center shadow-sm sm:px-10 sm:py-9">
      {markdown.trim() ? (
        <PracticeMarkdown markdown={markdown} />
      ) : (
        <p className="text-muted-foreground">Explicación vacía</p>
      )}
    </div>
  );
}
