"use client";

import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ExplanationStep } from "@/components/practice/explanation-step";
import { SentencePracticeCard } from "@/components/practice/sentence-practice-card";
import {
  EMPTY_FEEDBACK_CONTEXT,
  FeedbackSheet,
  type FeedbackAnswerEntry,
} from "@/components/learner/feedback-sheet";
import { SentenceStageCard } from "@/components/practice/sentence-stage-card";
import {
  completionSentenceSize,
  completionView,
  lessonOutcome,
} from "@/lib/learner/presentation";
import {
  nextLessonToStudy,
  readProgress,
  resetLessonProgress,
  resumeStepIndex,
  saveLessonProgress,
} from "@/lib/learner/progress";
import {
  isMuted,
  setMuted,
  speakSentence,
  subscribeMuted,
  type Speaker,
} from "@/lib/learner/speech";
import {
  completeOnboarding,
  isOnboardingComplete,
  reconcileOnboardedCookie,
} from "@/lib/learner/onboarding";
import { useVariableText } from "@/lib/learner/use-learner-variables";
import type { LessonBlock } from "@/lib/lesson-builder/types";
import {
  isAnswerAccepted,
  isMeaningfulLanguageBlock,
} from "@/lib/lesson-builder/utils";

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

// Onboarding mode (docs/design/onboarding.md §1): the /bienvenida route
// passes this instead of `initialLessonId` — `lessons` is then the whole,
// ordered, published onboarding module (not the course). LessonSelector
// itself resolves which onboarding lesson to open (resume the first
// unfinished one, or the first one in replay), and LessonSession handles
// advancing lesson-to-lesson with no completion screen in between.
export type OnboardingModeConfig = {
  replay: boolean;
};

export function LessonSelector({
  lessons,
  initialLessonId = null,
  onCloseLesson,
  onboarding,
}: {
  lessons: PracticeLesson[];
  initialLessonId?: string | null;
  onCloseLesson?: () => void;
  onboarding?: OnboardingModeConfig;
}) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  // A lazy initializer, not an effect: this is one-time client-only setup
  // (localStorage is unavailable during the server render that also
  // produces the pre-hydration loading placeholder LessonSelector shows
  // below), not a synchronization that should re-run on every dependency
  // change. `window === undefined` during SSR yields `null`, matching that
  // placeholder; hydration then runs this for real, in the browser.
  const [onboardingLessonId, setOnboardingLessonId] = useState<string | null>(() => {
    if (!onboarding || typeof window === "undefined") return null;
    // Reconcile (localStorage says done, cookie was lost) is handled by the
    // effect below, which navigates away — stay on the loading placeholder
    // rather than briefly showing a finished onboarding lesson.
    if (!onboarding.replay && isOnboardingComplete()) return null;
    return onboarding.replay
      ? (lessons[0]?.id ?? null)
      : (nextLessonToStudy(
          lessons.map((item) => ({ id: item.id, stepCount: item.blocks.length })),
          readProgress(),
        )?.id ?? lessons[0]?.id ?? null);
  });

  useEffect(() => {
    if (!onboarding || onboarding.replay) return;
    if (!isOnboardingComplete()) return;
    // Reconcile: localStorage already says done but the cookie was lost
    // (docs/design/onboarding.md §1) — re-set it and send the learner home
    // instead of replaying onboarding.
    reconcileOnboardedCookie();
    router.replace("/");
  }, [onboarding, router]);

  const activeLessonId = onboarding ? onboardingLessonId : initialLessonId;
  const lesson = lessons.find((item) => item.id === activeLessonId);

  const onboardingHandlers = useMemo(
    () =>
      onboarding
        ? {
            replay: onboarding.replay,
            onAdvanceLesson: (nextId: string) => setOnboardingLessonId(nextId),
            onFinishAll: () => {
              if (!onboarding.replay) completeOnboarding();
              router.replace("/");
            },
          }
        : undefined,
    [onboarding, router],
  );

  if (!onboarding && !lesson) return null;
  if (!hydrated || !lesson)
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
      onboarding={onboardingHandlers}
    />
  );
}

type OnboardingSessionHandlers = {
  replay: boolean;
  onAdvanceLesson: (nextLessonId: string) => void;
  onFinishAll: () => void;
};

function LessonSession({
  lesson,
  lessons,
  onCloseLesson,
  onboarding,
}: {
  lesson: PracticeLesson;
  lessons: PracticeLesson[];
  onCloseLesson?: () => void;
  onboarding?: OnboardingSessionHandlers;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(() =>
    onCloseLesson
      ? 0
      : resumeStepIndex(lesson.blocks, readProgress()[lesson.id]),
  );
  // Onboarding mode only (docs/design/onboarding.md §1): `lessons` here is
  // the whole published onboarding module, in order, so the whole-course
  // progress bar and lesson-to-lesson chaining are derived straight from it
  // — no extra numbers need to travel down from the route.
  const onboardingIndex = onboarding
    ? lessons.findIndex((item) => item.id === lesson.id)
    : -1;
  const onboardingIsLast = onboarding ? onboardingIndex === lessons.length - 1 : false;
  const onboardingNextLessonId =
    onboarding && !onboardingIsLast ? (lessons[onboardingIndex + 1]?.id ?? null) : null;
  const onboardingTotalSlides = onboarding
    ? lessons.reduce((sum, item) => sum + item.blocks.length, 0)
    : 0;
  const onboardingSlidesBefore = onboarding
    ? lessons.slice(0, Math.max(onboardingIndex, 0)).reduce((sum, item) => sum + item.blocks.length, 0)
    : 0;
  const [sentenceComplete, setSentenceComplete] = useState(false);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string[]>>(
    {},
  );
  const [lastSpeaker, setLastSpeaker] = useState<Speaker | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  // Feedback metadata only (docs/engineering/feedback.md): a running count
  // of hint reveals on the current slide, and when the slide became active
  // (secondsOnSlide is derived from this at submit time by FeedbackSheet
  // itself). Both reset whenever the slide changes.
  const [hintsUsedOnSlide, setHintsUsedOnSlide] = useState(0);
  const [slideStartedAt, setSlideStartedAt] = useState(() => Date.now());
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
  // The final sentence can carry a `{key}` token from a capture piece —
  // substituted for reading only; `speakSentence` is handed the authored
  // text, which the speech layer strips tokens from itself.
  const substitute = useVariableText();
  // Feedback context (docs/engineering/feedback.md): everything the sheet
  // needs to triage a note without asking — where the learner is, what the
  // slide shows, and what they'd typed on it. Assembled fresh on every
  // render (cheap: no fetch, just derived from state already in scope);
  // FeedbackSheet fills in device/timing details itself at submit time.
  const feedbackSlideKind = complete
    ? "completion"
    : (block?.type ?? "unknown");
  const feedbackTestableBlocks =
    block?.type === "sentence"
      ? block.languageBlocks.filter(
          (languageBlock) =>
            isMeaningfulLanguageBlock(languageBlock) && !languageBlock.given,
        )
      : [];
  const feedbackAnswers: FeedbackAnswerEntry[] = complete
    ? []
    : feedbackTestableBlocks.map((languageBlock, index) => {
        const typed = draftAnswers[block!.id]?.[index] ?? "";
        return {
          index,
          typed,
          correct: isAnswerAccepted(typed, languageBlock.acceptedAnswers),
        };
      });
  const feedbackSlide: Record<string, unknown> | null = complete
    ? outcome
      ? {
          finalSentenceEnglish: outcome.english,
          finalSentenceSpanish: outcome.spanish,
        }
      : null
    : block?.type === "explanation"
      ? { markdown: block.contentMarkdown }
      : block?.type === "sentence"
        ? {
            instruction: block.promptText || block.promptLabel || null,
            pieces: block.languageBlocks.map((languageBlock) => ({
              spanish: languageBlock.spanish,
              acceptedAnswers: languageBlock.acceptedAnswers,
              given: languageBlock.given === true,
            })),
          }
        : null;
  const availableLessonsForProgress = lessons.filter(
    (item) => item.blocks.length > 0,
  );
  const lessonProgressSnapshot = readProgress();
  const lessonsCompleted = availableLessonsForProgress.filter(
    (item) => lessonProgressSnapshot[item.id]?.completedAt,
  ).length;
  const feedbackContext = {
    ...EMPTY_FEEDBACK_CONTEXT,
    moduleId: lesson.moduleId ?? null,
    moduleName: lesson.moduleName ?? null,
    lessonId: lesson.id,
    lessonName: lesson.name,
    slideIndex: complete ? totalSteps : stepIndex,
    slideCount: totalSteps,
    slideKind: feedbackSlideKind,
    slideId: complete ? "completion" : (block?.id ?? null),
    slide: feedbackSlide,
    answers: feedbackAnswers,
    hintsUsed: complete ? null : hintsUsedOnSlide,
    slideStartedAt,
    speakerId: lastSpeaker?.id ?? null,
    progress: {
      lessonsCompleted,
      lessonsTotal: availableLessonsForProgress.length,
    },
  };
  // Module completion (direction, COMPLETION item 2): every lesson sharing
  // this one's moduleId, in course order. The completed/reopened lesson's
  // position within that list — not completion status — decides which view
  // this is: the module-end list only when it's the module's last lesson.
  const moduleLessons = lessons.filter((item) =>
    lesson.moduleId ? item.moduleId === lesson.moduleId : true,
  );
  const lessonIndexInModule = moduleLessons.findIndex(
    (item) => item.id === lesson.id,
  );
  const view = completionView(lessonIndexInModule, moduleLessons);
  // The completion screen's "next lesson" card only makes sense outside the
  // Lesson Builder's own preview (onCloseLesson), which is only ever handed
  // a single lesson and has no real course to advance into.
  const showNextLesson = view.kind === "next" && !onCloseLesson;
  const nextLesson = view.kind === "next" ? view.lesson : undefined;
  const nextLessonOutcome = nextLesson ? lessonOutcome(nextLesson.blocks) : null;
  const moduleOutcomes =
    view.kind === "module"
      ? moduleLessons
          .filter((item) => item.blocks.length > 0)
          .flatMap((item) => {
            const moduleOutcome = lessonOutcome(item.blocks);
            return moduleOutcome ? [{ id: item.id, ...moduleOutcome }] : [];
          })
      : [];
  const resetThisLesson = useCallback(() => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    resetLessonProgress([lesson.id]);
    setConfirmingReset(false);
    setDraftAnswers({});
    setSentenceComplete(false);
    setStepIndex(0);
  }, [confirmingReset, lesson.id]);
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
    // Replay mode's close button always returns to plain "/" (docs/design/
    // onboarding.md §1) — the onboarding module never has a home section
    // to scroll to (it's filtered off the path).
    else if (onboarding) router.push("/");
    else
      router.push(
        lesson.moduleId
          ? `/?module=${encodeURIComponent(lesson.moduleId)}`
          : "/",
      );
  }, [lesson.moduleId, onCloseLesson, onboarding, router]);

  const previous = useCallback(() => {
    setSentenceComplete(false);
    setHintsUsedOnSlide(0);
    setSlideStartedAt(Date.now());
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
      // Onboarding mode never shows a completion screen between lessons
      // (docs/design/onboarding.md §1): finishing lesson N opens lesson
      // N+1 directly, and finishing the last one records completion and
      // sends the learner home — this returns before `complete` can ever
      // become true.
      if (onboarding) {
        if (onboardingIsLast) onboarding.onFinishAll();
        else if (onboardingNextLessonId) onboarding.onAdvanceLesson(onboardingNextLessonId);
        return;
      }
    }
    setSentenceComplete(false);
    setHintsUsedOnSlide(0);
    setSlideStartedAt(Date.now());
    setStepIndex(next);
  }, [
    canAdvance,
    lesson.id,
    onCloseLesson,
    onboarding,
    onboardingIsLast,
    onboardingNextLessonId,
    stepIndex,
    totalSteps,
  ]);

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
        // Onboarding mode: the one way out is forward — Escape does not
        // exit (docs/design/onboarding.md §1). Replay mode keeps the
        // normal close-button escape hatch.
        if (onboarding && !onboarding.replay) return;
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
  }, [advance, close, complete, nextLesson, onCloseLesson, onboarding, previous, router]);

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
        ? onboarding
          ? onboardingIsLast
            ? onboarding.replay
              ? "Volver al inicio"
              : "Empezar el curso"
            : "Continuar"
          : "Terminar lección"
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
        {/* No close button in onboarding mode (docs/design/onboarding.md
            §1) — the one way out is forward. Replay mode keeps it. */}
        {(!onboarding || onboarding.replay) && (
          <button
            type="button"
            className="learner-icon-button"
            onClick={close}
            aria-label="Volver a mis lecciones"
            title="Volver a mis lecciones"
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}
        {/* The lesson name/number lives off-screen for the dialog's
            aria-labelledby — it's shown on-canvas only on the first slide
            and on completion (see the eyebrow below), not repeated here. */}
        <h1 id="practice-lesson-title" className="sr-only">
          {lesson.name || `Lección ${lesson.lessonNumber}`}
        </h1>
        <progress
          className="lesson-top-progress"
          aria-label="Progreso de la lección"
          // Onboarding: the bar spans the WHOLE onboarding, not just this
          // lesson, so the end is always visible (docs/design/onboarding.md
          // §1).
          value={
            onboarding
              ? onboardingSlidesBefore + (complete ? totalSteps : stepIndex)
              : complete
                ? totalSteps
                : stepIndex
          }
          max={onboarding ? onboardingTotalSlides || 1 : totalSteps || 1}
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
        <div
          className={`lesson-stage${complete ? " lesson-stage-complete" : ""}`}
          key={complete ? "complete" : block?.id}
        >
          {complete ? (
            <div className="lesson-celebration learner-enter" aria-live="polite">
              {outcome && (
                <div className="completion-sentence-group">
                  <div className="completion-final-row">
                    <p
                      className="completion-sentence-en"
                      data-size={completionSentenceSize(
                        substitute(outcome.english),
                      )}
                      lang="en"
                    >
                      {substitute(outcome.english)}
                    </p>
                    <button
                      type="button"
                      className="learner-icon-button completion-replay"
                      onClick={() =>
                        void speakSentence(outcome.english, lastSpeaker)
                      }
                      aria-label="Escuchar la frase final"
                      title="Escuchar la frase final"
                    >
                      <RotateCcw size={20} aria-hidden="true" />
                    </button>
                  </div>
                  <p className="completion-sentence-es" lang="es">
                    {substitute(outcome.spanish)}
                  </p>
                  <p className="completion-tagline">
                    Esto ya lo puedes decir.
                  </p>
                </div>
              )}

              <div className="completion-below">
                {showNextLesson && nextLesson ? (
                  <div className="completion-next-card">
                    <p className="learner-eyebrow completion-eyebrow">Siguiente</p>
                    <p className="completion-next-en" lang="en">
                      {substitute(nextLessonOutcome?.english ?? "") ||
                        nextLesson.name ||
                        `Lección ${nextLesson.lessonNumber}`}
                    </p>
                    {(nextLessonOutcome?.spanish || nextLesson.previewText) && (
                      <p className="completion-next-es" lang="es">
                        {substitute(nextLessonOutcome?.spanish ?? "") ||
                          nextLesson.previewText}
                      </p>
                    )}
                  </div>
                ) : moduleOutcomes.length > 0 ? (
                  <div className="completion-module-list">
                    <p className="learner-eyebrow completion-eyebrow">Lo que ya puedes decir</p>
                    {moduleOutcomes.map((item) => (
                      <div className="completion-module-item" key={item.id}>
                        <p className="completion-module-en" lang="en">
                          {substitute(item.english)}
                        </p>
                        <p className="completion-module-es" lang="es">
                          {substitute(item.spanish)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
                <button
                  type="button"
                  className="learner-button primary completion-cta"
                  onClick={() => {
                    if (showNextLesson && nextLesson)
                      router.push(
                        `/practice?lesson=${encodeURIComponent(nextLesson.id)}`,
                      );
                    else close();
                  }}
                >
                  {showNextLesson ? "Siguiente lección" : "Volver al inicio"}
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="completion-footer-links">
                <button
                  type="button"
                  className="muted-link completion-reset"
                  onClick={resetThisLesson}
                  onBlur={() => setConfirmingReset(false)}
                >
                  {confirmingReset
                    ? "¿Seguro? Reiniciar"
                    : "Reiniciar esta lección"}
                </button>
              </div>
            </div>
          ) : block?.type === "explanation" ? (
            <ExplanationStep
              markdown={block.contentMarkdown}
              image={block.image}
              isFirstSlide={stepIndex === 0}
            />
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
                  onHintsUsedChange={setHintsUsedOnSlide}
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
                  onHintsUsedChange={setHintsUsedOnSlide}
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

      {/* One floating pill for the whole session — sits above the footer
          zone on an in-progress slide, plain bottom-right on completion
          (which has no footer). See docs/engineering/feedback.md. */}
      <FeedbackSheet
        context={feedbackContext}
        pillVariant={complete ? "default" : "practice"}
      />
    </section>
  );

  return onCloseLesson ? (
    sessionContent
  ) : (
    <main className="learner-theme">{sessionContent}</main>
  );
}
