"use client";

import { CheckCircle2, Info, Lightbulb, Sun } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { SentenceBlock } from "@/lib/lesson-builder/types";
import { normalizeAnswer } from "@/lib/lesson-builder/utils";
import { PracticeMarkdown } from "./practice-markdown";

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
  const isVocabulary = sentence.layout === "vocabulary_table";
  const hasAuthoredPrompt = Boolean(
    sentence.promptLabel.trim() || sentence.promptText?.trim(),
  );

  return (
    <div
      className={`mx-auto rounded-lg border border-[#cfe3df] bg-white shadow-[0_10px_30px_rgba(23,59,58,0.08)] ${
        isSingleLanguageBlock || isVocabulary
          ? "max-w-2xl p-6 sm:p-7"
          : "max-w-4xl p-8 sm:p-10"
      }`}
    >
      {sentence.promptLabel.trim() && (
        <div className="text-muted-foreground">
          <PracticeMarkdown
            markdown={sentence.promptLabel}
            variant="eyebrow"
          />
        </div>
      )}
      {sentence.promptText?.trim() && (
        <div className="mt-2 max-w-2xl text-foreground">
          <PracticeMarkdown markdown={sentence.promptText} variant="prompt" />
        </div>
      )}
      {sentence.languageBlocks.length > 0 ? (
        <>
          <div
            className={`${hasAuthoredPrompt ? "mt-7" : ""} grid gap-x-8 gap-y-7 ${
              isVocabulary
                ? "mx-auto max-w-xl grid-cols-1"
                : isSingleLanguageBlock
                ? "mx-auto max-w-xl"
                : "grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))]"
            }`}
          >
          {sentence.languageBlocks.map((languageBlock, languageBlockIndex) => (
            <div
              key={languageBlock.id}
              className={
                isVocabulary
                  ? "grid items-center gap-3 sm:grid-cols-[minmax(8rem,0.8fr)_minmax(12rem,1.2fr)_minmax(10rem,1fr)]"
                  : "space-y-3"
              }
            >
              <span className="block text-center text-2xl font-bold leading-tight text-foreground">
                {languageBlock.spanish || "Texto en español"}
              </span>
              <div className={`relative ${isVocabulary ? "min-w-0" : ""}`}>
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
                      if (
                        !correctAnswers[languageBlockIndex] ||
                        helpedBlockIndex === languageBlockIndex
                      ) {
                        showHelp(languageBlockIndex);
                      }
                    }
                  }}
                  aria-label={`Traducción de ${languageBlock.spanish || `bloque ${languageBlockIndex + 1}`}`}
                  autoComplete="off"
                  className={`w-full rounded-lg border px-5 py-5 text-center text-2xl font-semibold outline-none transition-colors focus:ring-4 focus:ring-[#0f766e]/20 ${
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
                  disabled={
                    correctAnswers[languageBlockIndex] &&
                    helpedBlockIndex !== languageBlockIndex
                  }
                  aria-label={
                    correctAnswers[languageBlockIndex] &&
                    helpedBlockIndex !== languageBlockIndex
                      ? `Respuesta correcta para ${languageBlock.spanish || `bloque ${languageBlockIndex + 1}`}`
                      : `Mostrar pista para ${languageBlock.spanish || `bloque ${languageBlockIndex + 1}`}`
                  }
                  title={
                    correctAnswers[languageBlockIndex] &&
                    helpedBlockIndex !== languageBlockIndex
                      ? "Respuesta correcta"
                      : "Mostrar pista (Alt+H)"
                  }
                  className={`absolute -right-2 -top-2 flex size-9 items-center justify-center rounded-full border shadow-sm transition focus-visible:outline-none focus-visible:ring-3 ${
                    correctAnswers[languageBlockIndex] &&
                    helpedBlockIndex !== languageBlockIndex
                      ? "cursor-default border-emerald-400 bg-emerald-100 text-emerald-700 focus-visible:ring-emerald-400/50 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : helpedBlockIndex === languageBlockIndex
                      ? "border-amber-500 bg-amber-300 text-amber-950"
                      : "border-amber-300 bg-amber-100 text-amber-700 hover:scale-105 hover:border-amber-400 hover:bg-amber-200 hover:text-amber-900 focus-visible:ring-amber-400/50 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
                  }`}
                >
                  {correctAnswers[languageBlockIndex] &&
                  helpedBlockIndex !== languageBlockIndex ? (
                    <CheckCircle2 className="size-5" aria-hidden="true" />
                  ) : (
                    <Lightbulb
                      className={`size-5 ${
                        helpedBlockIndex === languageBlockIndex
                          ? "fill-amber-500"
                          : "fill-amber-300 dark:fill-amber-700"
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </button>
              </div>
              {languageBlock.callout?.trim() && (
                <div className={`rounded-lg border border-amber-300 bg-amber-100 px-4 py-3 text-center text-amber-950 shadow-sm dark:border-amber-700 dark:bg-amber-950/80 dark:text-amber-100 ${
                  isVocabulary ? "sm:col-start-3 sm:row-start-1" : ""
                }`}>
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
        <aside className="mx-auto mt-4 max-w-xl rounded-lg border border-[#b7d8d4] bg-[#eef8f6] px-4 py-3 text-left text-[#173b3a] dark:border-violet-800 dark:bg-violet-950/35 dark:text-violet-100">
          <div className="flex items-start gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-100/80 text-violet-700 dark:bg-violet-900/80 dark:text-violet-300">
              <Info className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">
                Ten en cuenta
              </p>
              <div className="mt-0.5 text-violet-950 dark:text-violet-100">
                <PracticeMarkdown
                  markdown={sentence.helperText}
                  variant="helper"
                />
              </div>
            </div>
          </div>
        </aside>
      )}

      {hasFeedback && isFeedbackVisible && (
        <div className="mx-auto mt-5 max-w-xl px-2 text-center text-foreground">
          <PracticeMarkdown
            markdown={sentence.answerFeedback ?? ""}
            variant="feedback"
          />
        </div>
      )}
    </div>
  );
}
