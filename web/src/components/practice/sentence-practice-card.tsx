"use client";
import { Check, Info, Lightbulb } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PracticeMarkdown } from "@/components/practice/practice-markdown";
import type { SentenceBlock } from "@/lib/lesson-builder/types";
import {
  diffChars,
  isAnswerAccepted,
  isMeaningfulLanguageBlock,
  pickClosestAnswer,
} from "@/lib/lesson-builder/utils";
export function SentencePracticeCard({
  sentence,
  onCompletionChange,
  initialAnswers,
  onAnswersChange,
}: {
  sentence: SentenceBlock;
  onCompletionChange?: (isComplete: boolean) => void;
  initialAnswers?: string[];
  onAnswersChange?: (answers: string[]) => void;
}) {
  // Dangling fully-blank language blocks are authoring debris, not real
  // questions — drop them before anything derives indices, progression, or
  // rendering from this list. See isMeaningfulLanguageBlock.
  const languageBlocks = sentence.languageBlocks.filter(
    isMeaningfulLanguageBlock,
  );
  const [answers, setAnswers] = useState<string[]>(() =>
    languageBlocks.map((_, index) => initialAnswers?.[index] ?? ""),
  );
  const [helpedBlockIndex, setHelpedBlockIndex] = useState<number | null>(null);
  const [focusedBlockIndex, setFocusedBlockIndex] = useState<number | null>(
    null,
  );
  // A brief shake on the specific blank that was just checked and found
  // wrong — never on a plain "show me the answer" request.
  const [shakeBlockIndex, setShakeBlockIndex] = useState<number | null>(null);
  const inputRefs = useRef<Array<HTMLTextAreaElement | null>>([]);
  const helpTimerRef = useRef<number | null>(null);
  const shakeTimerRef = useRef<number | null>(null);
  const correctAnswers = languageBlocks.map(
    (languageBlock, languageBlockIndex) =>
      isAnswerAccepted(
        answers[languageBlockIndex] ?? "",
        languageBlock.acceptedAnswers,
      ),
  );
  const isComplete =
    helpedBlockIndex === null &&
    languageBlocks.length > 0 &&
    correctAnswers.every(Boolean);
  const clearHelpTimer = useCallback(() => {
    if (helpTimerRef.current !== null) {
      window.clearTimeout(helpTimerRef.current);
      helpTimerRef.current = null;
    }
  }, []);
  // Reveals a hint as a diff of the learner's own attempt against the
  // closest accepted answer — never rewrites what they typed. Auto-hides
  // after a few seconds, or as soon as they type again (see
  // updatePreviewAnswer), whichever comes first.
  const showHelp = useCallback(
    (languageBlockIndex: number, wasWrongAttempt = false) => {
      clearHelpTimer();
      setHelpedBlockIndex(languageBlockIndex);
      if (wasWrongAttempt) {
        if (shakeTimerRef.current !== null)
          window.clearTimeout(shakeTimerRef.current);
        setShakeBlockIndex(languageBlockIndex);
        shakeTimerRef.current = window.setTimeout(() => {
          setShakeBlockIndex(null);
          shakeTimerRef.current = null;
        }, 150);
      }
      helpTimerRef.current = window.setTimeout(() => {
        setHelpedBlockIndex(null);
        helpTimerRef.current = null;
      }, 3500);
    },
    [clearHelpTimer],
  );
  useEffect(() => {
    onCompletionChange?.(isComplete);
  }, [isComplete, onCompletionChange]);
  useEffect(
    () => () => {
      clearHelpTimer();
      if (shakeTimerRef.current !== null)
        window.clearTimeout(shakeTimerRef.current);
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
    onAnswersChange?.(nextAnswers);
    const languageBlock = languageBlocks[languageBlockIndex];
    const isCorrect = isAnswerAccepted(answer, languageBlock.acceptedAnswers);
    if (isCorrect && languageBlockIndex < languageBlocks.length - 1)
      window.setTimeout(
        () => inputRefs.current[languageBlockIndex + 1]?.focus(),
        150,
      );
  }
  const isSingleLanguageBlock = languageBlocks.length === 1;
  const isVocabulary = sentence.layout === "vocabulary_table";
  const hasAuthoredPrompt = Boolean(
    sentence.promptLabel.trim() || sentence.promptText?.trim(),
  );
  // A quiet one-time nudge under the answer field, shown only on the very
  // first retrieval slide of a session (sessionStorage, not per-lesson) so
  // a returning learner isn't told how to answer on every slide. Read (and
  // claimed) once, in the lazy initializer, so this card's first render
  // already knows whether to show it — no effect, no extra render.
  const [showFirstRetrievalHint] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      if (window.sessionStorage.getItem("iccf-retrieval-hint-seen"))
        return false;
      window.sessionStorage.setItem("iccf-retrieval-hint-seen", "1");
      return true;
    } catch {
      // Storage may be unavailable (private mode, disabled) — skip the hint
      // rather than throw.
      return false;
    }
  });
  return (
    <div
      className={`sentence-practice stage-enter ${isSingleLanguageBlock ? "single-answer" : ""} ${isVocabulary ? "vocabulary-practice" : ""}`}
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
      {languageBlocks.length > 0 ? (
        <>
          <div
            className={`answer-grid ${hasAuthoredPrompt ? "has-prompt" : ""}`}
          >
            {languageBlocks.map(
              (languageBlock, languageBlockIndex) => (
                <div
                  key={languageBlock.id}
                  className={`answer-piece ${correctAnswers[languageBlockIndex] && helpedBlockIndex !== languageBlockIndex ? "correct" : ""} ${shakeBlockIndex === languageBlockIndex ? "shake" : ""}`}
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
                    <textarea
                      ref={(element) => {
                        inputRefs.current[languageBlockIndex] = element;
                      }}
                      rows={1}
                      data-practice-answer
                      autoFocus={languageBlockIndex === 0}
                      value={answers[languageBlockIndex] ?? ""}
                      onChange={(event) =>
                        updatePreviewAnswer(
                          // A long pasted answer could carry a real newline —
                          // Enter itself never inserts one (preventDefault
                          // below), but sanitize paste too so the value
                          // stays a single logical line that wraps visually.
                          event.target.value.replace(/\r?\n/g, " "),
                          languageBlockIndex,
                        )
                      }
                      onFocus={() => setFocusedBlockIndex(languageBlockIndex)}
                      onBlur={(event) => {
                        if (
                          isVocabulary &&
                          event.relatedTarget instanceof HTMLElement &&
                          event.relatedTarget.classList.contains(
                            "answer-hint-toggle",
                          )
                        )
                          return;
                        setFocusedBlockIndex((current) =>
                          current === languageBlockIndex ? null : current,
                        );
                      }}
                      onKeyDown={(event) => {
                        if (event.nativeEvent.isComposing) return;
                        if (event.altKey && event.key.toLowerCase() === "h") {
                          event.preventDefault();
                          if (
                            !correctAnswers[languageBlockIndex] ||
                            helpedBlockIndex === languageBlockIndex
                          )
                            showHelp(languageBlockIndex);
                          return;
                        }
                        if (
                          event.key === "Enter" &&
                          !event.ctrlKey &&
                          !event.metaKey &&
                          !event.altKey &&
                          !event.shiftKey &&
                          !correctAnswers[languageBlockIndex]
                        ) {
                          event.preventDefault();
                          showHelp(
                            languageBlockIndex,
                            Boolean((answers[languageBlockIndex] ?? "").trim()),
                          );
                          return;
                        }
                        if (
                          event.key === "Tab" &&
                          !event.shiftKey &&
                          !event.ctrlKey &&
                          !event.metaKey &&
                          !event.altKey &&
                          !correctAnswers[languageBlockIndex]
                        ) {
                          // Block forward Tab past a wrong/incomplete answer
                          // rather than just revealing the hint and letting
                          // focus move on anyway — without this the hint
                          // reveal itself unmounts the very hint-toggle
                          // button focus was about to land on, and the
                          // learner could Tab straight past an unanswered
                          // blank. Shift+Tab (above) stays unrestricted.
                          event.preventDefault();
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
                    ></textarea>
                    {isVocabulary &&
                      correctAnswers[languageBlockIndex] &&
                      helpedBlockIndex !== languageBlockIndex && (
                        <span
                          className="answer-completed-text"
                          aria-hidden="true"
                        >
                          {answers[languageBlockIndex]}
                        </span>
                      )}
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
                  {helpedBlockIndex === languageBlockIndex && (
                    <p className="answer-diff" aria-live="polite">
                      <span className="answer-diff-label">Pista:</span>{" "}
                      {diffChars(
                        answers[languageBlockIndex] ?? "",
                        pickClosestAnswer(
                          answers[languageBlockIndex] ?? "",
                          languageBlock.acceptedAnswers,
                        ),
                      ).map((part, partIndex) =>
                        part.type === "equal" ? (
                          <span key={partIndex}>{part.value}</span>
                        ) : part.type === "insert" ? (
                          <ins key={partIndex} className="answer-diff-insert">
                            {part.value}
                          </ins>
                        ) : (
                          <del key={partIndex} className="answer-diff-delete">
                            {part.value}
                          </del>
                        ),
                      )}
                    </p>
                  )}
                  {focusedBlockIndex === languageBlockIndex &&
                    !correctAnswers[languageBlockIndex] &&
                    helpedBlockIndex !== languageBlockIndex && (
                      <button
                        type="button"
                        className="answer-hint-toggle"
                        onMouseDown={(event) => event.preventDefault()}
                        onFocus={() => setFocusedBlockIndex(languageBlockIndex)}
                        onBlur={() =>
                          setFocusedBlockIndex((current) =>
                            current === languageBlockIndex ? null : current,
                          )
                        }
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
          {showFirstRetrievalHint && !isComplete && (
            <p className="retrieval-first-hint">
              Escribe en inglés y pulsa Enter
            </p>
          )}
          {isComplete && (
            <p
              className="sentence-success"
              role="status"
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
    </div>
  );
}
