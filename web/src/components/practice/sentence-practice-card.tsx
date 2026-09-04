"use client";

import { Check, Info, Lightbulb } from "lucide-react";
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

  const showHelp = useCallback(
    (languageBlockIndex: number) => {
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
    },
    [clearHelpTimer, helpedBlockIndex, sentence.languageBlocks],
  );

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
    const timer = window.setTimeout(() => inputRefs.current[0]?.focus(), 0);
    return () => window.clearTimeout(timer);
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
        (acceptedAnswer) =>
          normalizeAnswer(acceptedAnswer) === normalizedAnswer,
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
      className={`sentence-practice learner-enter ${isSingleLanguageBlock ? "single-answer" : ""} ${isVocabulary ? "vocabulary-practice" : ""}`}
    >
      {sentence.promptLabel.trim() && (
        <div className="sentence-prompt-label">
          <PracticeMarkdown markdown={sentence.promptLabel} variant="eyebrow" />
        </div>
      )}
      {sentence.promptText?.trim() && (
        <div className="sentence-prompt">
          <PracticeMarkdown markdown={sentence.promptText} variant="prompt" />
        </div>
      )}
      {sentence.languageBlocks.length > 0 ? (
        <>
          <div
            className={`answer-grid ${hasAuthoredPrompt ? "has-prompt" : ""}`}
          >
            {sentence.languageBlocks.map(
              (languageBlock, languageBlockIndex) => (
                <div
                  key={languageBlock.id}
                  className={`answer-piece ${correctAnswers[languageBlockIndex] && helpedBlockIndex !== languageBlockIndex ? "correct" : ""}`}
                >
                  <span className="answer-source">
                    {!isSingleLanguageBlock && (
                      <span className="answer-piece-number" aria-hidden="true">
                        {String(languageBlockIndex + 1).padStart(2, "0")}
                      </span>
                    )}
                    {languageBlock.spanish}
                  </span>
                  <div className="answer-field">
                    <input
                      ref={(element) => {
                        inputRefs.current[languageBlockIndex] = element;
                      }}
                      type="text"
                      data-practice-answer
                      autoFocus={languageBlockIndex === 0}
                      value={answers[languageBlockIndex] ?? ""}
                      onChange={(event) =>
                        updatePreviewAnswer(
                          event.target.value,
                          languageBlockIndex,
                        )
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
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      lang="en"
                      placeholder="En inglés…"
                      aria-describedby={
                        languageBlock.callout?.trim()
                          ? `callout-${languageBlock.id}`
                          : undefined
                      }
                      className={`answer-input ${helpedBlockIndex === languageBlockIndex ? "showing-hint" : ""}`}
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
                      className="answer-hint"
                    >
                      {correctAnswers[languageBlockIndex] &&
                      helpedBlockIndex !== languageBlockIndex ? (
                        <>
                          <Check size={15} aria-hidden="true" />
                          <span>Correcto</span>
                        </>
                      ) : (
                        <>
                          <Lightbulb size={15} aria-hidden="true" />
                          <span>Pista</span>
                        </>
                      )}
                    </button>
                    <span className="sr-only" role="status">
                      {helpedBlockIndex === languageBlockIndex
                        ? `Pista: ${languageBlock.acceptedAnswers[0]}`
                        : correctAnswers[languageBlockIndex]
                          ? `Correcto: ${answers[languageBlockIndex]}`
                          : ""}
                    </span>
                  </div>
                  {languageBlock.callout?.trim() && (
                    <p
                      className="answer-callout"
                      id={`callout-${languageBlock.id}`}
                    >
                      {languageBlock.callout}
                    </p>
                  )}
                </div>
              ),
            )}
          </div>
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm font-medium text-destructive">
          Esta práctica todavía no está disponible.
        </p>
      )}

      {sentence.helperText?.trim() && (
        <aside className="sentence-helper">
          <Info size={17} aria-hidden="true" />
          <PracticeMarkdown markdown={sentence.helperText} variant="helper" />
        </aside>
      )}

      <div className="sentence-authored-feedback" aria-live="polite">
        {hasFeedback && isFeedbackVisible && (
          <PracticeMarkdown
            markdown={sentence.answerFeedback ?? ""}
            variant="feedback"
          />
        )}
      </div>
    </div>
  );
}
