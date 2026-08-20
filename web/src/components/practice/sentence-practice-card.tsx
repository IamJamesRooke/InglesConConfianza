"use client";

import { Lightbulb } from "lucide-react";
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

  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-[var(--surface)] p-8 shadow-sm sm:p-10">
      {sentence.promptLabel.trim() && (
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {sentence.promptLabel}
        </p>
      )}
      {sentence.promptText?.trim() && (
        <h3 className="mt-2 whitespace-pre-wrap text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          {sentence.promptText}
        </h3>
      )}

      {sentence.languageBlocks.length > 0 ? (
        <div
          className={`mt-8 grid gap-x-8 gap-y-9 ${
            isSingleLanguageBlock
              ? "mx-auto max-w-xl"
              : "sm:grid-cols-2"
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
              {languageBlock.callout?.trim() && (
                <span className="block text-center text-sm font-medium italic text-muted-foreground">
                  {languageBlock.callout}
                </span>
              )}
              <div className="relative">
                <input
                  ref={(element) => {
                    inputRefs.current[languageBlockIndex] = element;
                  }}
                  type="text"
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
                  className={`w-full rounded-2xl border px-5 py-5 pr-14 text-center text-2xl font-semibold outline-none transition-colors focus:ring-4 focus:ring-ring/25 ${
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
                  title="Mostrar pista"
                  className={`absolute right-3 top-1/2 flex size-8 -translate-y-1/2 shrink-0 items-center justify-center rounded-full transition ${
                    helpedBlockIndex === languageBlockIndex
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground/70 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Lightbulb className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm font-medium text-destructive">
          Agrega un bloque de idioma para previsualizar esta frase.
        </p>
      )}

      {sentence.helperText?.trim() && (
        <p className="mt-5 text-sm text-muted-foreground">
          {sentence.helperText}
        </p>
      )}

      {hasFeedback && isFeedbackVisible && (
        <div className="mt-6 whitespace-pre-wrap rounded-2xl border border-border bg-muted/60 p-5 text-center text-xl font-semibold leading-8 text-foreground shadow-sm">
          {sentence.answerFeedback}
        </div>
      )}
    </div>
  );
}
