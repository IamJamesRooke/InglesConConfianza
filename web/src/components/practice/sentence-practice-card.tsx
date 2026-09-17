"use client";
import { Check, Info, Lightbulb } from "lucide-react";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PracticeMarkdown } from "@/components/practice/practice-markdown";
import { SpeakerChip } from "@/components/practice/speaker-chip";
import type { LanguageBlock, SentenceBlock } from "@/lib/lesson-builder/types";
import {
  diffChars,
  isAnswerAccepted,
  isMeaningfulLanguageBlock,
  pickClosestAnswer,
  sentenceEnglishText,
} from "@/lib/lesson-builder/utils";
import {
  availableSpeakers,
  pickSpeaker,
  speak,
  speakSentence,
  type Speaker,
} from "@/lib/learner/speech";

// The answer field grows to fit whatever the learner types (`field-sizing:
// content`, see practice-responsive-overrides.css), but that alone doesn't
// stop a first paint / non-supporting browser from clipping a long accepted
// answer — so this floor is sized to the longest accepted answer (or the
// Spanish prompt, if that's longer) plus 2ch of slack, and used both as the
// CSS fallback width and the `min-width` under `field-sizing: content`.
// Single-blank cards read wider (bigger type), so they get a slightly taller
// floor to match the previous fixed 12rem look.
function answerMinChars(
  languageBlock: LanguageBlock,
  isSingleLanguageBlock: boolean,
): number {
  const longest = Math.max(
    languageBlock.spanish.trim().length,
    ...languageBlock.acceptedAnswers.map((answer) => answer.trim().length),
  );
  const withSlack = longest + 2;
  return isSingleLanguageBlock ? Math.max(withSlack, 13) : withSlack;
}

export function SentencePracticeCard({
  sentence,
  onCompletionChange,
  initialAnswers,
  onAnswersChange,
  onSpeakerChange,
}: {
  sentence: SentenceBlock;
  onCompletionChange?: (isComplete: boolean) => void;
  initialAnswers?: string[];
  onAnswersChange?: (answers: string[]) => void;
  onSpeakerChange?: (speaker: Speaker | null) => void;
}) {
  // Dangling fully-blank language blocks are authoring debris, not real
  // questions — drop them before anything derives indices, progression, or
  // rendering from this list. See isMeaningfulLanguageBlock.
  const languageBlocks = sentence.languageBlocks.filter(
    isMeaningfulLanguageBlock,
  );
  // E8 "given" pieces (shown, not tested) are rendered inline (below) but
  // never drive answer state, progression, or completion — every index
  // below (answers, correctAnswers, inputRefs, help/focus) is scoped to
  // this testable-only subset, not the full `languageBlocks` list.
  const testableBlocks = languageBlocks.filter(
    (languageBlock) => !languageBlock.given,
  );
  const testableIndexById = new Map(
    testableBlocks.map((languageBlock, index) => [languageBlock.id, index]),
  );
  const [answers, setAnswers] = useState<string[]>(() =>
    testableBlocks.map((_, index) => initialAnswers?.[index] ?? ""),
  );
  const [helpedBlockIndex, setHelpedBlockIndex] = useState<number | null>(null);
  const [focusedBlockIndex, setFocusedBlockIndex] = useState<number | null>(
    null,
  );
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const helpTimerRef = useRef<number | null>(null);
  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const spokeCompleteRef = useRef(false);
  const onSpeakerChangeRef = useRef(onSpeakerChange);
  useEffect(() => {
    onSpeakerChangeRef.current = onSpeakerChange;
  }, [onSpeakerChange]);
  const correctAnswers = testableBlocks.map(
    (languageBlock, languageBlockIndex) =>
      isAnswerAccepted(
        answers[languageBlockIndex] ?? "",
        languageBlock.acceptedAnswers,
      ),
  );
  const isComplete =
    helpedBlockIndex === null &&
    testableBlocks.length > 0 &&
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
    (languageBlockIndex: number) => {
      clearHelpTimer();
      setHelpedBlockIndex(languageBlockIndex);
      helpTimerRef.current = window.setTimeout(() => {
        setHelpedBlockIndex(null);
        helpTimerRef.current = null;
      }, 3500);
    },
    [clearHelpTimer],
  );
  useEffect(() => {
    onCompletionChange?.(isComplete);
    if (isComplete && !spokeCompleteRef.current && sentence.layout !== "vocabulary_table") {
      spokeCompleteRef.current = true;
      const full = sentenceEnglishText(languageBlocks);
      if (full) {
        // This effect reacts to `isComplete` turning true (an external
        // signal derived from user input via updatePreviewAnswer), not to
        // synchronize render state, so a direct setState here is intended.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSpeakingText(full);
        void speakSentence(full, speaker, {
          onEnd: () => setSpeakingText((current) => (current === full ? null : current)),
        });
      }
    }
    if (!isComplete) spokeCompleteRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // One speaker per slide, chosen deterministically from the block id so it
  // doesn't reshuffle on every re-render — see docs/design/speech.md.
  useEffect(() => {
    let cancelled = false;
    spokeCompleteRef.current = false;
    availableSpeakers()
      .then((speakers) => {
        if (cancelled) return;
        const picked = pickSpeaker(sentence.id, speakers);
        setSpeaker(picked);
        onSpeakerChangeRef.current?.(picked);
      })
      .catch(() => {
        if (!cancelled) setSpeaker(null);
      });
    return () => {
      cancelled = true;
    };
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
    const languageBlock = testableBlocks[languageBlockIndex];
    const isCorrect = isAnswerAccepted(answer, languageBlock.acceptedAnswers);
    const wasCorrect = correctAnswers[languageBlockIndex];
    if (isCorrect && !wasCorrect) {
      const pieceEnglish = languageBlock.acceptedAnswers[0]?.trim();
      if (pieceEnglish) {
        setSpeakingText(pieceEnglish);
        void speak(pieceEnglish, speaker, {
          onEnd: () =>
            setSpeakingText((current) =>
              current === pieceEnglish ? null : current,
            ),
        });
      }
    }
    if (isCorrect && languageBlockIndex < testableBlocks.length - 1)
      window.setTimeout(
        () => inputRefs.current[languageBlockIndex + 1]?.focus(),
        0,
      );
  }
  const isSingleLanguageBlock = testableBlocks.length === 1;
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
      {languageBlocks.length > 0 ? (
        <>
          <div
            className={`answer-grid ${hasAuthoredPrompt ? "has-prompt" : ""}`}
          >
            {languageBlocks.map((languageBlock) => {
              const testableIndex = testableIndexById.get(languageBlock.id);
              // E8 "given" piece: shown, never tested — static text, no
              // input, no answer-state indexing, so Tab/Enter progression
              // (which only ever targets `inputRefs`) skips it for free.
              if (testableIndex === undefined) {
                return (
                  <div key={languageBlock.id} className="answer-piece given">
                    <span className="answer-source">{languageBlock.spanish}</span>
                    <span
                      className="answer-given-text"
                      title="Se muestra al estudiante, no se evalúa"
                    >
                      {languageBlock.acceptedAnswers[0]}
                    </span>
                  </div>
                );
              }
              const languageBlockIndex = testableIndex;
              return (
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
                  <div
                    className="answer-field"
                    style={
                      isVocabulary
                        ? undefined
                        : ({
                            "--answer-chars": answerMinChars(
                              languageBlock,
                              isSingleLanguageBlock,
                            ),
                          } as CSSProperties)
                    }
                  >
                    {isVocabulary && (
                      <span className="answer-field-sizer" aria-hidden="true">
                        {(languageBlock.spanish.trim().length >=
                        (languageBlock.acceptedAnswers[0]?.trim().length ?? 0)
                          ? languageBlock.spanish
                          : languageBlock.acceptedAnswers[0]
                        )?.trim() || languageBlock.spanish}
                      </span>
                    )}
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
                          showHelp(languageBlockIndex);
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
                    />
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
              );
            })}
          </div>
          {isComplete && (
            <span
              className="sentence-success"
              role="status"
              aria-live="polite"
              aria-label="¡Correcto!"
            >
              <Check size={16} strokeWidth={3} aria-hidden="true" />
            </span>
          )}
          <SpeakerChip speaker={speaker} speakingText={speakingText} />
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm font-medium text-destructive">
          Esta práctica todavía no está disponible.
        </p>
      )}
    </div>
  );
}
