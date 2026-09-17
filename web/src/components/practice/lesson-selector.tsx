"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Home,
  Play,
  SkipForward,
  Volume2,
  VolumeX,
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
import { ExplanationStep } from "@/components/practice/explanation-step";
import { SentencePracticeCard } from "@/components/practice/sentence-practice-card";
import { SentenceStageCard } from "@/components/practice/sentence-stage-card";
import { learnerLabel, lessonOutcome } from "@/lib/learner/presentation";
import {
  readProgress,
  resumeStepIndex,
  saveLessonProgress,
  skipLesson,
} from "@/lib/learner/progress";
import {
  isMuted,
  setMuted,
  speakSentence,
  subscribeMuted,
  type Speaker,
} from "@/lib/learner/speech";
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
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string[]>>(
    {},
  );
  const [completionCursor, setCompletionCursor] = useState(() =>
    lessons.findIndex((item) => item.id === lesson.id),
  );
  const [lastSpeaker, setLastSpeaker] = useState<Speaker | null>(null);
  const muted = useSyncExternalStore(
    subscribeMuted,
    isMuted,
    () => false,
  );
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const totalSteps = lesson.blocks.length;
  const complete = stepIndex >= totalSteps;
  const block = lesson.blocks[stepIndex];
  const outcome = complete ? lessonOutcome(lesson.blocks) : null;
  const nextLesson = lessons
    .slice(completionCursor + 1)
    .find(
      (item) =>
        item.blocks.length > 0 && !readProgress()[item.id]?.completedAt,
    );
  const canAdvance =
    !complete && (block?.type === "explanation" || sentenceComplete);
  // Vocabulary tables stay tables (SentencePracticeCard) — every ordinary
  // sentence slide gets the L2b/direction assembling-sentence stage. The
  // `?layout=grid` fallback that used to make this a runtime choice is gone
  // (docs/design/learner-direction.md item 10).
  const useStage =
    block?.type === "sentence" && block.layout !== "vocabulary_table";

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
    // When a caller passes `onCloseLesson` (the Lesson Builder's preview),
    // that caller already owns capture/restore of the originating focus via
    // `useLessonPreview` (with a lesson-title fallback) — capturing it again
    // here raced that mechanism and could leave focus on `<body>` when the
    // loser of the race targeted an element that had already been removed.
    // Plain learner navigation (no `onCloseLesson`) has no such owner, so it
    // keeps doing this itself.
    const previousFocus = onCloseLesson ? null : document.activeElement;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = priorOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, [onCloseLesson]);

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
      if (event.isComposing) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
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
      // Arrow keys never drive slide navigation, in or out of a field — they
      // stay reserved for normal caret movement and for focus/scroll on
      // whatever control the user is on. Only PageUp/PageDown and the
      // visible prev/next buttons change slides from the keyboard.
      if (event.key === "PageUp") {
        event.preventDefault();
        previous();
        return;
      }
      if (event.key === "PageDown") {
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

  // The lesson's one forward action. Rendered in the footer at every width,
  // and a second time under the sentence composition at desktop once the
  // sentence is complete — CSS keeps exactly one of the two visible.
  const advanceButton = (extraClassName: string) => (
    <button
      type="button"
      className={`learner-button primary ${extraClassName}`}
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
  );

  // Full learner navigation (no onCloseLesson) IS the page — it needs its own
  // <main> landmark since this route renders nothing else. The Lesson
  // Builder's inline preview (onCloseLesson is set) lives inside an admin
  // page that already owns a <main>, so it stays a plain section there.
  const sessionContent = (
    <section
      ref={sectionRef}
      className="learner-theme lesson-session"
      role={onCloseLesson ? "dialog" : undefined}
      aria-modal={onCloseLesson ? "true" : undefined}
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
          <X size={20} aria-hidden="true" />
        </button>
        {/* The lesson name/number lives off-screen for the dialog's
            aria-labelledby — it's shown on-canvas only on the first slide
            and on completion (see the eyebrow below), not repeated here. */}
        <h1 id="practice-lesson-title" className="sr-only">
          {lesson.name || `Lección ${lesson.lessonNumber}`}
        </h1>
        <progress
          className="lesson-top-progress"
          aria-label="Progreso de la lección"
          value={complete ? totalSteps : stepIndex}
          max={totalSteps || 1}
        />
        <button
          type="button"
          className="learner-icon-button lesson-mute-toggle"
          onClick={() => setMuted(!muted)}
          aria-label={muted ? "Activar sonido" : "Silenciar sonido"}
          title={muted ? "Activar sonido" : "Silenciar sonido"}
          aria-pressed={muted}
        >
          {muted ? (
            <VolumeX size={20} aria-hidden="true" />
          ) : (
            <Volume2 size={20} aria-hidden="true" />
          )}
        </button>
      </header>

      <div ref={contentRef} className="lesson-scroll-area">
        <div className="lesson-stage" key={complete ? "complete" : block?.id}>
          {complete ? (
            <div
              className="lesson-celebration learner-enter"
              aria-live="polite"
            >
              <p className="practice-lesson-eyebrow">
                {lesson.name || `Lección ${lesson.lessonNumber}`}
              </p>
              <div className="completion-seal">
                <Check size={34} strokeWidth={2.5} aria-hidden="true" />
              </div>
              <p className="completion-status">Lección completada</p>
              <p className="completion-saved-note">
                Tu progreso está guardado.
              </p>
              {outcome && (
                <p className="completion-final-sentence">
                  <span lang="en">{outcome.english}</span>
                  <button
                    type="button"
                    className="learner-icon-button completion-replay"
                    onClick={() =>
                      void speakSentence(outcome.english, lastSpeaker)
                    }
                    aria-label="Escuchar la frase final"
                    title="Escuchar la frase final"
                  >
                    <Play size={18} aria-hidden="true" />
                  </button>
                </p>
              )}
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
            <ExplanationStep markdown={block.contentMarkdown} />
          ) : block?.type === "sentence" ? (
            <>
              {useStage ? (
                <SentenceStageCard
                  sentence={block}
                  onCompletionChange={setSentenceComplete}
                  initialAnswers={draftAnswers[block.id]}
                  onAnswersChange={(answers) =>
                    setDraftAnswers((current) => ({
                      ...current,
                      [block.id]: answers,
                    }))
                  }
                  onSpeakerChange={setLastSpeaker}
                />
              ) : (
                <SentencePracticeCard
                  sentence={block}
                  onCompletionChange={setSentenceComplete}
                  initialAnswers={draftAnswers[block.id]}
                  onAnswersChange={(answers) =>
                    setDraftAnswers((current) => ({
                      ...current,
                      [block.id]: answers,
                    }))
                  }
                  onSpeakerChange={setLastSpeaker}
                />
              )}
              {/* Desktop: the primary action appears centred under the
                  composition once the sentence is complete. The footer copy
                  is hidden at that width (see .stage-duplicated), so only
                  one instance is ever visible. */}
              {useStage && sentenceComplete && (
                <div className="stage-continue">{advanceButton("")}</div>
              )}
            </>
          ) : null}
        </div>
      </div>

      {!complete && (
        <footer className="lesson-controls">
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
            <div className="lesson-feedback" role="status" />
            {advanceButton(
              `${block?.type === "sentence" && !sentenceComplete ? "awaiting-answer" : ""} ${
                useStage && block?.type === "sentence" && sentenceComplete
                  ? "stage-duplicated"
                  : ""
              }`,
            )}
          </div>
        </footer>
      )}
    </section>
  );

  return onCloseLesson ? (
    sessionContent
  ) : (
    <main className="learner-theme">{sessionContent}</main>
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
          <strong lang="en">{learnerLabel(concept.english)}</strong>
          <span lang="es">{learnerLabel(concept.spanish)}</span>
        </div>
      ))}
    </div>
  );
}
