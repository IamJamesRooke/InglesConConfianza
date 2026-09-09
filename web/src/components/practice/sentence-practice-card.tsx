"use client";
import { Check, Info, Lightbulb } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PracticeMarkdown } from "@/components/practice/practice-markdown";
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
  const [focusedBlockIndex, setFocusedBlockIndex] = useState<number | null>(null);
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
        )
          nextAnswers[helpedBlockIndex] = "";
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
      }, 3500);
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
    const isCorrect =
      Boolean(normalizeAnswer(answer)) &&
      languageBlock.acceptedAnswers.some(
        (acceptedAnswer) =>
          normalizeAnswer(acceptedAnswer) === normalizeAnswer(answer),
      );
    if (isCorrect && languageBlockIndex < sentence.languageBlocks.length - 1)
      window.setTimeout(
        () => inputRefs.current[languageBlockIndex + 1]?.focus(),
        0,
      );
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
    if (allAnswersCorrect && hasFeedback) setIsFeedbackVisible(true);
    else if (!allAnswersCorrect) setIsFeedbackVisible(false);
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
                    {languageBlock.spanish}
                    {correctAnswers[languageBlockIndex] &&
                      helpedBlockIndex !== languageBlockIndex && (
                        <Check
                          className="answer-source-check"
                          size={16}
                          strokeWidth={3.5}
                          aria-hidden="true"
                        />
                      )}
                  </span>
                  <div className="answer-field">
                    <span className="answer-field-sizer" aria-hidden="true">
                      {(languageBlock.spanish.trim().length >=
                      (languageBlock.acceptedAnswers[0]?.trim().length ?? 0)
                        ? languageBlock.spanish
                        : languageBlock.acceptedAnswers[0]
                      )?.trim() || languageBlock.spanish}
                    </span>
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
                      onFocus={() => setFocusedBlockIndex(languageBlockIndex)}
                      onBlur={() =>
                        setFocusedBlockIndex((current) =>
                          current === languageBlockIndex ? null : current,
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.altKey && event.key.toLowerCase() === "h") {
                          event.preventDefault();
                          if (
                            !correctAnswers[languageBlockIndex] ||
                            helpedBlockIndex === languageBlockIndex
                          )
                            showHelp(languageBlockIndex);
                        }
                      }}
                      aria-label={`Traducción de ${languageBlock.spanish || `bloque ${languageBlockIndex + 1}`}`}
                      autoComplete="off"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      lang="en"
                      className={`answer-input ${helpedBlockIndex === languageBlockIndex ? "showing-hint" : ""}`}
                    />
                    <span className="sr-only" role="status">
                      {helpedBlockIndex === languageBlockIndex
                        ? `Pista: ${languageBlock.acceptedAnswers[0]}`
                        : correctAnswers[languageBlockIndex]
                          ? `Respuesta aceptada: ${answers[languageBlockIndex]}`
                          : ""}
                    </span>
                  </div>
                  {languageBlock.callout?.trim() && (
                    <p className="answer-note">
                      <Info size={13} aria-hidden="true" />
                      <span>{languageBlock.callout}</span>
                    </p>
                  )}
                  {focusedBlockIndex === languageBlockIndex &&
                    !correctAnswers[languageBlockIndex] &&
                    helpedBlockIndex !== languageBlockIndex && (
                      <button
                        type="button"
                        className="answer-hint-toggle"
                        onClick={() => showHelp(languageBlockIndex)}
                        aria-label={`Mostrar la respuesta de ${languageBlock.spanish || `bloque ${languageBlockIndex + 1}`}`}
                        title="Mostrar la respuesta (Alt+H)"
                      >
                        <Lightbulb size={15} aria-hidden="true" />
                      </button>
                    )}
                </div>
              ),
            )}
          </div>
          {isComplete && !hasFeedback && (
            <p
              className="sentence-success"
              aria-live="polite"
              aria-label="¡Correcto!"
            >
              <span className="sentence-success-mark" aria-hidden="true">
                <Check size={24} strokeWidth={3.25} />
              </span>
            </p>
          )}
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
        {hasFeedback && isFeedbackVisible ? (
          <PracticeMarkdown
            markdown={sentence.answerFeedback ?? ""}
            variant="feedback"
          />
        ) : null}
      </div>
    </div>
  );
}
