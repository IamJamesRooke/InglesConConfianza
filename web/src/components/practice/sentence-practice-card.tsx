"use client";

import { CheckCircle2, Info, Lightbulb, Sun } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { SentenceBlock } from "@/lib/lesson-builder/types";
import { normalizeAnswer } from "@/lib/lesson-builder/utils";

export function SentencePracticeCard({
  sentence,
  onCompletionChange,
}: {
  sentence: SentenceBlock;
  onCompletionChange?: (isComplete: boolean) => void;
}) {
  const [answers, setAnswers] = useState<string[]>(() =>
    sentence.languageBlocks.map(() => ""),
  );
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);
  const [helpedBlockIndex, setHelpedBlockIndex] = useState<number | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const helpTimerRef = useRef<number | null>(null);
  const hasFeedback = Boolean(sentence.answerFeedback?.trim());
  const correctAnswers = sentence.languageBlocks.map(
    (languageBlock, languageBlockIndex) => {
      const currentAnswer = normalizeAnswer(answers[languageBlockIndex] ?? "");
      return (
        Boolean(currentAnswer) &&
        languageBlock.acceptedAnswers.some(
          (acceptedAnswer) => normalizeAnswer(acceptedAnswer) === currentAnswer,
        )
      );
    },
  );
  const isComplete =
    helpedBlockIndex === null &&
    sentence.languageBlocks.length > 0 &&
    correctAnswers.every(Boolean);

  const clearHelpTimer = useCallback(() => {
    if (helpTimerRef.current !== null) {
      window.clearTimeout(helpTimerRef.current);
      helpTimerRef.current = null;
    }
  }, []);

  const showHelp = useCallback((languageBlockIndex: number) => {
    clearHelpTimer();
    setAnswers((currentAnswers) => {
      const nextAnswers = [...currentAnswers];
      if (
        helpedBlockIndex !== null &&
        helpedBlockIndex !== languageBlockIndex
      ) {
        nextAnswers[helpedBlockIndex] = "";
      }
      nextAnswers[languageBlockIndex] =
        sentence.languageBlocks[languageBlockIndex]?.acceptedAnswers[0] ?? "";
      return nextAnswers;
    });
    setHelpedBlockIndex(languageBlockIndex);
    setIsFeedbackVisible(false);

    helpTimerRef.current = window.setTimeout(() => {
      setAnswers((currentAnswers) => {
        const nextAnswers = [...currentAnswers];
        nextAnswers[languageBlockIndex] = "";
        return nextAnswers;
      });
      setHelpedBlockIndex(null);
      helpTimerRef.current = null;
      inputRefs.current[languageBlockIndex]?.focus();
    }, 2500);
  }, [clearHelpTimer, helpedBlockIndex, sentence.languageBlocks]);

  useEffect(() => {
    onCompletionChange?.(isComplete);
  }, [isComplete, onCompletionChange]);

  useEffect(
    () => () => {
      clearHelpTimer();
    },
    [clearHelpTimer],
  );

  useEffect(() => {
    window.setTimeout(() => inputRefs.current[0]?.focus(), 0);
  }, [sentence.id]);

  function updatePreviewAnswer(answer: string, languageBlockIndex: number) {
    if (helpedBlockIndex === languageBlockIndex) {
      clearHelpTimer();
      setHelpedBlockIndex(null);
    }

    const nextAnswers = [...answers];
    nextAnswers[languageBlockIndex] = answer;
    setAnswers(nextAnswers);

    const languageBlock = sentence.languageBlocks[languageBlockIndex];
    const normalizedAnswer = normalizeAnswer(answer);
    const isCorrect =
      Boolean(normalizedAnswer) &&
      languageBlock.acceptedAnswers.some(
        (acceptedAnswer) => normalizeAnswer(acceptedAnswer) === normalizedAnswer,
      );

    if (isCorrect && languageBlockIndex < sentence.languageBlocks.length - 1) {
      window.setTimeout(
        () => inputRefs.current[languageBlockIndex + 1]?.focus(),
        0,
      );
    }

    const allAnswersCorrect = sentence.languageBlocks.every(
      (currentBlock, currentBlockIndex) => {
        const currentAnswer = normalizeAnswer(
          nextAnswers[currentBlockIndex] ?? "",
        );
        return (
          Boolean(currentAnswer) &&
          currentBlock.acceptedAnswers.some(
            (acceptedAnswer) =>
              normalizeAnswer(acceptedAnswer) === currentAnswer,
          )
        );
      },
    );

    if (allAnswersCorrect && hasFeedback) {
      setIsFeedbackVisible(true);
    } else if (!allAnswersCorrect) {
      setIsFeedbackVisible(false);
    }
  }

  const isSingleLanguageBlock = sentence.languageBlocks.length === 1;
  const hasAuthoredPrompt = Boolean(
    sentence.promptLabel.trim() || sentence.promptText?.trim(),
  );

  return (
    <div
      className={`mx-auto rounded-3xl border border-border bg-[var(--surface)] shadow-sm ${
        isSingleLanguageBlock
          ? "max-w-2xl p-6 sm:p-7"
          : "max-w-4xl p-8 sm:p-10"
      }`}
    >
      {sentence.promptLabel.trim() && (
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {sentence.promptLabel}
        </p>
      )}
      {sentence.promptText?.trim() && (
        <h3 className="mt-2 max-w-2xl whitespace-pre-wrap text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
          {sentence.promptText}
        </h3>
      )}
      {!hasAuthoredPrompt && (
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Escribe en inglés
        </p>
      )}

      {sentence.languageBlocks.length > 0 ? (
        <>
          <div
            className={`${hasAuthoredPrompt ? "mt-7" : "mt-5"} grid gap-x-8 gap-y-7 ${
              isSingleLanguageBlock
                ? "mx-auto max-w-xl"
                : "grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))]"
            }`}
          >
          {sentence.languageBlocks.map((languageBlock, languageBlockIndex) => (
            <div
              key={languageBlock.id}
              className="space-y-3"
            >
              <span className="block text-center text-2xl font-bold leading-tight text-foreground">
                {languageBlock.spanish || "Texto en español"}
              </span>
              <div className="relative">
                <input
                  ref={(element) => {
                    inputRefs.current[languageBlockIndex] = element;
                  }}
                  type="text"
                  data-practice-answer
                  autoFocus={languageBlockIndex === 0}
                  value={answers[languageBlockIndex] ?? ""}
                  onChange={(event) =>
                    updatePreviewAnswer(event.target.value, languageBlockIndex)
                  }
                  onKeyDown={(event) => {
                    if (event.altKey && event.key.toLowerCase() === "h") {
                      event.preventDefault();
                      showHelp(languageBlockIndex);
                    }
                  }}
                  aria-label={`Traducción de ${languageBlock.spanish || `bloque ${languageBlockIndex + 1}`}`}
                  autoComplete="off"
                  className={`w-full rounded-2xl border px-5 py-5 text-center text-2xl font-semibold outline-none transition-colors focus:ring-4 focus:ring-ring/25 ${
                    correctAnswers[languageBlockIndex] &&
                    helpedBlockIndex !== languageBlockIndex
                      ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-4 ring-emerald-500/15 dark:border-emerald-500 dark:bg-emerald-950/35 dark:text-emerald-100"
                      : helpedBlockIndex === languageBlockIndex
                        ? "border-ring bg-muted text-muted-foreground italic"
                        : "border-input bg-background text-foreground"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => showHelp(languageBlockIndex)}
                  aria-label={`Mostrar pista para ${languageBlock.spanish || `bloque ${languageBlockIndex + 1}`}`}
                  title="Mostrar pista (Alt+H)"
                  className={`absolute -right-2 -top-2 flex size-9 items-center justify-center rounded-full border shadow-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-amber-400/50 ${
                    helpedBlockIndex === languageBlockIndex
                      ? "border-amber-500 bg-amber-300 text-amber-950"
                      : "border-amber-300 bg-amber-100 text-amber-700 hover:border-amber-400 hover:bg-amber-200 hover:text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
                  }`}
                >
                  <Lightbulb
                    className={`size-5 ${
                      helpedBlockIndex === languageBlockIndex
                        ? "fill-amber-500"
                        : "fill-amber-300 dark:fill-amber-700"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>
              {languageBlock.callout?.trim() && (
                <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-100 via-yellow-200 to-orange-100 px-4 py-3 text-center text-amber-950 shadow-sm dark:border-amber-700 dark:from-amber-950/80 dark:via-yellow-950/70 dark:to-orange-950/80 dark:text-amber-100">
                  <p className="flex items-center justify-center gap-2 text-base font-bold italic leading-6">
                    <Sun
                      className="size-5 shrink-0 text-orange-600 dark:text-amber-400"
                      aria-hidden="true"
                    />
                    {languageBlock.callout}
                  </p>
                </div>
              )}
            </div>
          ))}
          </div>
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm font-medium text-destructive">
          Agrega un bloque de idioma para previsualizar esta frase.
        </p>
      )}

      {sentence.helperText?.trim() && (
        <aside className="mx-auto mt-4 max-w-xl rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-3 text-left text-violet-950 dark:border-violet-800 dark:bg-violet-950/35 dark:text-violet-100">
          <div className="flex items-start gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-100/80 text-violet-700 dark:bg-violet-900/80 dark:text-violet-300">
              <Info className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">
                Ten en cuenta
              </p>
              <p className="mt-0.5 text-sm font-medium leading-5.5 text-violet-950 dark:text-violet-100">
                {sentence.helperText}
              </p>
            </div>
          </div>
        </aside>
      )}

      {hasFeedback && isFeedbackVisible && (
        <div className="mx-auto mt-5 max-w-xl border-t border-emerald-200 px-2 pt-4 text-center text-foreground dark:border-emerald-800">
          <p className="flex items-start justify-center gap-2.5 whitespace-pre-wrap text-lg font-semibold leading-7 sm:text-xl sm:leading-8">
            <CheckCircle2
              className="mt-1 size-5 shrink-0 text-emerald-600 dark:text-emerald-300"
              aria-hidden="true"
            />
            <span>{sentence.answerFeedback}</span>
          </p>
        </div>
      )}
    </div>
  );
}
