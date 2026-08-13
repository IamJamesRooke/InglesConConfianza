"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  demoLessonSections,
  type DemoLessonStep,
  type PatternParts,
  type RichTextPart,
} from "@/lib/demo-lesson";

type AnswerState = "idle" | "correct" | "incorrect";
type HelpPhase = "hidden" | "visible" | "fading";

function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function DemoLesson({ steps }: { steps: DemoLessonStep[] }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [blockAnswers, setBlockAnswers] = useState<string[]>([]);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [helpPhase, setHelpPhase] = useState<HelpPhase>("hidden");
  const inputRef = useRef<HTMLInputElement>(null);
  const blockInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const helpTimerRef = useRef<number | null>(null);
  const advanceTimerRef = useRef<number | null>(null);
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const currentSectionIndex = demoLessonSections.findIndex(
    (section) =>
      steps.findIndex((lessonStep) => lessonStep.id === section.startStepId) <=
        stepIndex &&
      steps.findIndex((lessonStep) => lessonStep.id === section.endStepId) >=
        stepIndex,
  );
  const currentSection = demoLessonSections[currentSectionIndex] ?? demoLessonSections[0];
  const sectionStartIndex = steps.findIndex(
    (lessonStep) => lessonStep.id === currentSection.startStepId,
  );
  const sectionEndIndex = steps.findIndex(
    (lessonStep) => lessonStep.id === currentSection.endStepId,
  );
  const sectionStepNumber = stepIndex - sectionStartIndex + 1;
  const sectionStepCount = sectionEndIndex - sectionStartIndex + 1;
  const sectionProgressPercent =
    sectionStepCount === 1
      ? 100
      : Math.round(
          ((stepIndex - sectionStartIndex) /
            (sectionEndIndex - sectionStartIndex)) *
            100,
        );

  const clearHelpTimer = useCallback(() => {
    if (helpTimerRef.current !== null) {
      window.clearTimeout(helpTimerRef.current);
      helpTimerRef.current = null;
    }
  }, []);

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  const goToNextStep = useCallback(() => {
    if (isLastStep) {
      return;
    }

    clearHelpTimer();
    clearAdvanceTimer();
    setAnswer("");
    setBlockAnswers([]);
    setAnswerState("idle");
    setHelpPhase("hidden");
    setStepIndex((currentIndex) => currentIndex + 1);
  }, [clearAdvanceTimer, clearHelpTimer, isLastStep]);

  const goToPreviousStep = useCallback(() => {
    if (stepIndex === 0) {
      return;
    }

    clearHelpTimer();
    clearAdvanceTimer();
    setAnswer("");
    setBlockAnswers([]);
    setAnswerState("idle");
    setHelpPhase("hidden");
    setStepIndex((currentIndex) => currentIndex - 1);
  }, [clearAdvanceTimer, clearHelpTimer, stepIndex]);

  const showHelp = useCallback(() => {
    if (step.type !== "question") {
      return;
    }

    clearHelpTimer();
    clearAdvanceTimer();
    if (step.answerBlocks) {
      setBlockAnswers(step.answerBlocks.map((block) => block.acceptedAnswers[0]));
    } else {
      setAnswer(step.acceptedAnswers[0]);
    }
    setAnswerState("idle");
    setHelpPhase("visible");

    helpTimerRef.current = window.setTimeout(() => {
      setHelpPhase("fading");
      helpTimerRef.current = window.setTimeout(() => {
        setAnswer("");
        setBlockAnswers([]);
        setHelpPhase("hidden");
        helpTimerRef.current = null;
      }, 700);
    }, 2300);
  }, [clearAdvanceTimer, clearHelpTimer, step]);

  useEffect(() => {
    if (step.type === "question") {
      if (step.answerBlocks) {
        blockInputRefs.current[0]?.focus();
      } else {
        inputRef.current?.focus();
      }
    }
  }, [step]);

  useEffect(() => {
    function handleKeyboardShortcut(event: KeyboardEvent) {
      if (event.altKey && event.key.toLowerCase() === "h") {
        event.preventDefault();
        showHelp();
        return;
      }

      if (event.altKey && event.shiftKey && event.key === "ArrowLeft") {
        event.preventDefault();
        goToPreviousStep();
        return;
      }

      if (
        event.altKey &&
        event.shiftKey &&
        event.key === "ArrowRight" &&
        step.type !== "question" &&
        !isLastStep
      ) {
        event.preventDefault();
        goToNextStep();
        return;
      }

      if (event.key === "Enter" && step.type !== "question" && !isLastStep) {
        event.preventDefault();
        goToNextStep();
      }
    }

    window.addEventListener("keydown", handleKeyboardShortcut);
    return () => window.removeEventListener("keydown", handleKeyboardShortcut);
  }, [goToNextStep, goToPreviousStep, isLastStep, showHelp, step]);

  useEffect(() => {
    return () => {
      clearHelpTimer();
      clearAdvanceTimer();
    };
  }, [clearAdvanceTimer, clearHelpTimer]);

  function handleAnswerChange(value: string, blockIndex = 0) {
    if (helpPhase !== "hidden") {
      clearHelpTimer();
      setHelpPhase("hidden");
    }

    if (step.type !== "question") {
      return;
    }

    if (step.answerBlocks) {
      const nextBlockAnswers = [...blockAnswers];
      nextBlockAnswers[blockIndex] = value;
      setBlockAnswers(nextBlockAnswers);

      const isBlockCorrect = step.answerBlocks[blockIndex].acceptedAnswers.some(
        (acceptedAnswer) =>
          normalizeAnswer(acceptedAnswer) === normalizeAnswer(value),
      );
      const allBlocksCorrect = step.answerBlocks.every((block, index) =>
        block.acceptedAnswers.some(
          (acceptedAnswer) =>
            normalizeAnswer(acceptedAnswer) ===
            normalizeAnswer(nextBlockAnswers[index] ?? ""),
        ),
      );

      clearAdvanceTimer();

      if (allBlocksCorrect) {
        setAnswerState("correct");
        advanceTimerRef.current = window.setTimeout(goToNextStep, 900);
      } else {
        setAnswerState("idle");
        if (isBlockCorrect && blockIndex < step.answerBlocks.length - 1) {
          window.setTimeout(
            () => blockInputRefs.current[blockIndex + 1]?.focus(),
            0,
          );
        }
      }

      return;
    }

    setAnswer(value);

    const isCorrect = step.acceptedAnswers.some(
      (acceptedAnswer) =>
        normalizeAnswer(acceptedAnswer) === normalizeAnswer(value),
    );

    clearAdvanceTimer();

    if (isCorrect) {
      setAnswerState("correct");
      advanceTimerRef.current = window.setTimeout(goToNextStep, 900);
    } else {
      setAnswerState("idle");
    }
  }

  function handleQuestionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step.type !== "question") {
      return;
    }

    const isCorrect = step.answerBlocks
      ? step.answerBlocks.every((block, index) =>
          block.acceptedAnswers.some(
            (acceptedAnswer) =>
              normalizeAnswer(acceptedAnswer) ===
              normalizeAnswer(blockAnswers[index] ?? ""),
          ),
        )
      : step.acceptedAnswers.some(
          (acceptedAnswer) =>
            normalizeAnswer(acceptedAnswer) === normalizeAnswer(answer),
        );

    if (!isCorrect) {
      setAnswerState("incorrect");
    }
  }

  function resetLesson() {
    clearHelpTimer();
    clearAdvanceTimer();
    setAnswer("");
    setBlockAnswers([]);
    setAnswerState("idle");
    setHelpPhase("hidden");
    setStepIndex(0);
  }

  function renderStep() {
    if (step.type === "explainer") {
      return (
        <Card className="border-violet-200 border-t-4 border-t-violet-500 bg-violet-50/90 shadow-lg shadow-slate-300/40">
          <CardHeader>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
              Explicación
            </p>
            <CardTitle className="text-3xl">
              {step.titleParts ? <RichText parts={step.titleParts} /> : step.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-lg leading-8 text-stone-700">
            <p>
              {step.textParts ? <RichText parts={step.textParts} /> : step.text}
            </p>
            {step.bullets && (
              <ul className="space-y-3 rounded-xl bg-white/70 p-5">
                {step.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3">
                    <span className="text-stone-400">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
            {step.patternExamples && (
              <div className="grid min-w-0 grid-cols-1 gap-3 overflow-hidden rounded-xl border border-violet-200 bg-gradient-to-br from-violet-100/80 to-fuchsia-100/80 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {step.patternExamples.map((example) => (
                  <div
                    key={`${example.source.prefix}-${example.source.bold}`}
                    className="flex min-w-0 flex-wrap items-center justify-center gap-2 rounded-lg bg-white/80 px-3 py-3 text-base sm:text-lg"
                  >
                    <span className="min-w-0 break-words text-center">
                      <PatternText parts={example.source} />
                    </span>
                    <span className="shrink-0 text-xl text-stone-400">⟶</span>
                    <span className="min-w-0 break-words text-center">
                      <PatternText parts={example.target} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    if (step.type === "diagram") {
      return (
        <Card className="border-fuchsia-200 border-t-4 border-t-fuchsia-500 bg-fuchsia-50/90 shadow-lg shadow-slate-300/40">
          <CardHeader>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
              Patrón
            </p>
            <CardTitle className="text-3xl">
              {step.titleParts ? <RichText parts={step.titleParts} /> : step.title}
            </CardTitle>
            <CardDescription className="text-base leading-7">
              {step.textParts ? (
                <RichText parts={step.textParts} />
              ) : (
                step.text
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step.imageSrc ? (
              <div className="flex justify-center rounded-xl bg-white/70 px-6 py-6">
                <Image
                  src={step.imageSrc}
                  alt={step.imageAlt ?? step.title}
                  width={step.imageWidth ?? 600}
                  height={step.imageHeight ?? 200}
                  className="h-auto max-w-full"
                />
              </div>
            ) : step.source && step.target ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-stone-950 px-6 py-10 text-center text-white sm:flex-row sm:gap-8">
                <span className="rounded-lg bg-white/10 px-6 py-4 text-2xl font-semibold">
                  <PatternText parts={step.source} dark />
                </span>
                <span className="text-3xl text-stone-400">⟶</span>
                <span className="rounded-lg bg-white/10 px-6 py-4 text-2xl font-semibold">
                  <PatternText parts={step.target} dark />
                </span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      );
    }

    if (step.type === "milestone") {
      return (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-700">
              ¡Lo lograste!
            </p>
            <CardTitle className="text-3xl text-emerald-950">
              {step.titleParts ? <RichText parts={step.titleParts} /> : step.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg leading-8 text-emerald-900">
            {step.textParts ? <RichText parts={step.textParts} /> : step.text}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-slate-300 border-t-4 border-t-slate-800 bg-slate-100/95 shadow-lg shadow-slate-300/40">
        <CardHeader>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
            Tu turno
          </p>
          <CardTitle className="text-3xl leading-tight">
            <QuestionPrompt prompt={step.prompt} highlight={step.highlight} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQuestionSubmit} className="space-y-4">
            {step.answerBlocks ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {step.answerBlocks.map((block, index) => {
                  const isBlockCorrect = block.acceptedAnswers.some(
                    (acceptedAnswer) =>
                      normalizeAnswer(acceptedAnswer) ===
                      normalizeAnswer(blockAnswers[index] ?? ""),
                  );

                  return (
                    <label key={block.spanish} className="block">
                      <span className="mb-2 block text-center text-lg font-bold text-stone-800">
                        {block.spanish}
                      </span>
                      <input
                        ref={(element) => {
                          blockInputRefs.current[index] = element;
                        }}
                        type="text"
                        value={blockAnswers[index] ?? ""}
                        onChange={(event) =>
                          handleAnswerChange(event.target.value, index)
                        }
                        aria-label={`Traducción de ${block.spanish}`}
                        autoComplete="off"
                        className={`w-full rounded-xl border px-5 py-4 text-center text-xl outline-none transition-colors duration-700 focus:ring-2 focus:ring-stone-400 ${
                          isBlockCorrect
                            ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                            : helpPhase === "visible"
                              ? "border-amber-300 bg-amber-50 text-stone-400 caret-transparent italic"
                              : helpPhase === "fading"
                                ? "border-amber-200 bg-amber-50/60 text-transparent caret-transparent"
                                : "border-stone-300 bg-white text-stone-950"
                        }`}
                      />
                    </label>
                  );
                })}
              </div>
            ) : (
              <input
                ref={inputRef}
                type="text"
                value={answer}
                onChange={(event) => handleAnswerChange(event.target.value)}
                aria-label={step.prompt}
                autoComplete="off"
                className={`w-full rounded-xl border px-5 py-4 text-xl outline-none transition-colors duration-700 focus:ring-2 focus:ring-stone-400 ${
                  answerState === "correct"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                    : helpPhase === "visible"
                      ? "border-amber-300 bg-amber-50 text-stone-400 caret-transparent italic"
                      : helpPhase === "fading"
                        ? "border-amber-200 bg-amber-50/60 text-transparent caret-transparent"
                        : "border-stone-300 bg-white text-stone-950"
                }`}
              />
            )}

            {helpPhase !== "hidden" && (
              <p
                aria-live="polite"
                className="text-sm font-medium text-stone-400"
              >
                Pista ✨ La respuesta aparece solo por un momento.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone-500">
                No hay penalización por equivocarse.
              </p>
              <Button
                type="button"
                variant="outline"
                className="border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                onClick={showHelp}
              >
                Ayuda <span className="ml-1 text-xs opacity-60">Alt + H</span>
              </Button>
            </div>

            {answerState === "incorrect" && (
              <p className="text-sm font-medium text-rose-700">
                Todavía no. No hay penalización: intenta de nuevo o usa Ayuda.
              </p>
            )}

            {answerState === "correct" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900">
                <p className="font-semibold">{step.feedback}</p>
                {step.acceptedAnswers.length > 1 && (
                  <p className="mt-2 text-sm text-emerald-800">
                    También se acepta: {step.acceptedAnswers.join(" · ")}
                  </p>
                )}
              </div>
            )}

          </form>
        </CardContent>
      </Card>
    );
  }

  if (isLastStep && step.type === "milestone") {
    return (
      <div className="space-y-6">
        <ProgressBar
          percent={sectionProgressPercent}
          label={`Parte ${currentSectionIndex + 1} de ${demoLessonSections.length} · ${currentSection.title}`}
          detail={`Paso ${sectionStepNumber} de ${sectionStepCount}`}
        />
        {renderStep()}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {stepIndex > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
            >
              ← Anterior
            </Button>
          )}
          <Button type="button" size="lg" onClick={resetLesson}>
            Empezar de nuevo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressBar
        percent={sectionProgressPercent}
        label={`Parte ${currentSectionIndex + 1} de ${demoLessonSections.length} · ${currentSection.title}`}
        detail={`Paso ${sectionStepNumber} de ${sectionStepCount}`}
      />
      {renderStep()}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {stepIndex > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={goToPreviousStep}
          >
              ← Anterior{" "}
            <span className="ml-1 text-xs opacity-60">Alt + Shift + ←</span>
          </Button>
        )}
        {step.type !== "question" && (
          <Button type="button" size="lg" onClick={goToNextStep}>
            Continuar{" "}
            <span className="ml-1 text-xs opacity-60">
              ↵ Enter · Alt + Shift + →
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}

function RichText({ parts }: { parts: RichTextPart[] }) {
  return (
    <>
      {parts.map((part, index) =>
        part.type === "pattern" ? (
          <PatternText key={index} parts={part.parts} />
        ) : (
          <span key={index}>{part.value}</span>
        ),
      )}
    </>
  );
}

function QuestionPrompt({ prompt, highlight }: { prompt: string; highlight: string }) {
  const [before, after] = prompt.split(highlight);

  if (after === undefined) {
    return prompt;
  }

  return (
    <>
      {before}
      <strong className="rounded-md bg-amber-100 px-1 font-extrabold text-stone-950">
        {highlight}
      </strong>
      {after}
    </>
  );
}

function ProgressBar({
  percent,
  label,
  detail,
}: {
  percent: number;
  label: string;
  detail: string;
}) {
  return (
    <div className="space-y-2" aria-label="Progreso de la lección">
      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>{label}</span>
        <span>{detail}</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 overflow-hidden rounded-full bg-stone-200"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-fuchsia-500 transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function PatternText({ parts, dark = false }: { parts: PatternParts; dark?: boolean }) {
  return (
    <span className={dark ? "text-white" : "text-stone-900"}>
      {parts.prefix}
      <strong className={dark ? "font-extrabold text-amber-300" : "font-extrabold text-amber-700"}>
        {parts.bold}
      </strong>
      {parts.suffix}
    </span>
  );
}
