"use client";
import { Check, Info, Lightbulb } from "lucide-react";
import type { CSSProperties } from "react";
import { PracticeMarkdown } from "@/components/practice/practice-markdown";
import { SpeakerChip } from "@/components/practice/speaker-chip";
import {
  answerMinChars,
  useSentencePractice,
} from "@/components/practice/use-sentence-practice";
import type { SentenceBlock } from "@/lib/lesson-builder/types";
import { diffChars, pickClosestAnswer } from "@/lib/lesson-builder/utils";
import type { Speaker } from "@/lib/learner/speech";

/**
 * The original grid-of-fields sentence card: one labelled blank per piece,
 * wrapping into rows. Superseded by SentenceStageCard (the assembling
 * sentence) and kept only behind `?layout=grid` so the owner can compare
 * the two side by side — and still used for vocabulary tables, which stay
 * tables. All answer/speech behaviour lives in useSentencePractice, shared
 * with the new card.
 */
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
  const {
    languageBlocks,
    testableBlocks,
    testableIndexById,
    answers,
    correctAnswers,
    isComplete,
    helpedBlockIndex,
    focusedBlockIndex,
    setFocusedBlockIndex,
    inputRefs,
    showHelp,
    updateAnswer,
    onAnswerKeyDown,
    speaker,
    speakingText,
  } = useSentencePractice({
    sentence,
    initialAnswers,
    onCompletionChange,
    onAnswersChange,
    onSpeakerChange,
  });
  const isSingleLanguageBlock = testableBlocks.length === 1;
  const isVocabulary = sentence.layout === "vocabulary_table";
  const hasAuthoredPrompt = Boolean(
    sentence.promptLabel.trim() || sentence.promptText?.trim(),
  );
  const hasSentencePromptText = Boolean(sentence.promptText?.trim());
  const renderSuccessCheck = (variantClassName: string) =>
    isComplete && (
      <span
        className={`sentence-success ${variantClassName}`}
        role="status"
        aria-live="polite"
        aria-label="¡Correcto!"
      >
        <Check size={16} strokeWidth={3} aria-hidden="true" />
      </span>
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
      {hasSentencePromptText && (
        <div className="sentence-prompt-row">
          <div className="sentence-prompt">
            <PracticeMarkdown markdown={sentence.promptText} variant="prompt" />
          </div>
          {renderSuccessCheck("sentence-success-inline")}
        </div>
      )}
      {languageBlocks.length > 0 ? (
        <>
          <div
            className={`answer-grid ${hasAuthoredPrompt ? "has-prompt" : ""}`}
          >
            {!hasSentencePromptText &&
              renderSuccessCheck("sentence-success-card")}
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
                        updateAnswer(
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
                      onKeyDown={(event) =>
                        onAnswerKeyDown(event, languageBlockIndex)
                      }
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
