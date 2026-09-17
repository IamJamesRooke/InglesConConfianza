"use client";
import { Info, Lightbulb } from "lucide-react";
import type { CSSProperties } from "react";
import { Fragment } from "react";
import { PracticeMarkdown } from "@/components/practice/practice-markdown";
import { SpeakerChip } from "@/components/practice/speaker-chip";
import {
  answerMinChars,
  blankChars,
  useSentencePractice,
} from "@/components/practice/use-sentence-practice";
import type { SentenceBlock } from "@/lib/lesson-builder/types";
import { diffChars, pickClosestAnswer } from "@/lib/lesson-builder/utils";
import type { Speaker } from "@/lib/learner/speech";

/**
 * L2b: the sentence slide as one sentence being assembled, not a grid of
 * fields (see docs/design/student-experience.md, "L2b sentence stage").
 *
 * Line 1 is the Spanish sentence as prose — the piece being typed is
 * highlighted, finished pieces settle back to ink, pieces still to come are
 * muted. Line 2 is the English sentence growing in place: finished pieces
 * are plain words, the piece being typed is an inline input sitting exactly
 * where its word will land, and pieces still to come are blank underlines
 * sized to their answer. Every blank is a real input all along (styled as a
 * blank until it's focused, as a word once it's right), so Tab/Enter/click
 * progression, hints and answer matching are exactly the behaviour of the
 * older grid card — all of it shared through useSentencePractice.
 *
 * There is no whole-sentence success check and no per-piece check: a word
 * standing finished in `--primary` is the signal, plus the speaker's bubble
 * and the Continue button.
 */
export function SentenceStageCard({
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
  // The piece the learner is on: whatever is focused, else the first one
  // still unanswered. Drives line 1's highlight and where the hint's
  // lightbulb sits.
  const firstUnanswered = correctAnswers.findIndex((correct) => !correct);
  const activeIndex =
    focusedBlockIndex !== null ? focusedBlockIndex : firstUnanswered;
  const helpedBlock =
    helpedBlockIndex === null ? null : testableBlocks[helpedBlockIndex];

  if (languageBlocks.length === 0)
    return (
      <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm font-medium text-destructive">
        Esta práctica todavía no está disponible.
      </p>
    );

  return (
    <div className="sentence-stage learner-enter">
      <div className="stage-composition">
        <div className="stage-speaker">
          <SpeakerChip
            speaker={speaker}
            speakingText={speakingText}
            variant="stage"
          />
        </div>
        <div className="stage-column">
          {sentence.promptLabel.trim() && (
            <div className="stage-eyebrow">
              <PracticeMarkdown
                markdown={sentence.promptLabel}
                variant="eyebrow"
              />
            </div>
          )}
          {sentence.promptText?.trim() && (
            <div className="stage-instruction">
              <PracticeMarkdown markdown={sentence.promptText} variant="prompt" />
            </div>
          )}
          <div className="stage-card">
            <p className="stage-line stage-line-es" lang="es">
              {languageBlocks.map((languageBlock, index) => {
                const testableIndex = testableIndexById.get(languageBlock.id);
                const state =
                  testableIndex === undefined
                    ? "given"
                    : correctAnswers[testableIndex]
                      ? "done"
                      : testableIndex === activeIndex
                        ? "active"
                        : "pending";
                return (
                  <Fragment key={languageBlock.id}>
                    {index > 0 ? " " : null}
                    <span className="stage-es" data-state={state}>
                      {languageBlock.spanish}
                      {state === "active" &&
                        focusedBlockIndex === testableIndex &&
                        helpedBlockIndex !== testableIndex && (
                          <button
                            type="button"
                            className="stage-hint-toggle"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => showHelp(testableIndex)}
                            aria-label={`Mostrar la respuesta de ${languageBlock.spanish || "esta parte"}`}
                            title="Mostrar la respuesta (Alt+H)"
                          >
                            <Lightbulb size={20} aria-hidden="true" />
                          </button>
                        )}
                    </span>
                  </Fragment>
                );
              })}
            </p>
            <p className="stage-line stage-line-en" lang="en">
              {languageBlocks.map((languageBlock, index) => {
                const testableIndex = testableIndexById.get(languageBlock.id);
                // E8 "given" piece: shown from the start, never tested, no
                // input — so Tab/Enter progression skips it for free.
                if (testableIndex === undefined)
                  return (
                    <Fragment key={languageBlock.id}>
                      {index > 0 ? " " : null}
                      <span
                        className="stage-en given"
                        title="Se muestra al estudiante, no se evalúa"
                      >
                        {languageBlock.acceptedAnswers[0]}
                      </span>
                    </Fragment>
                  );
                const isCorrect =
                  correctAnswers[testableIndex] &&
                  helpedBlockIndex !== testableIndex;
                return (
                  <Fragment key={languageBlock.id}>
                    {index > 0 ? " " : null}
                    <input
                      ref={(element) => {
                        inputRefs.current[testableIndex] = element;
                      }}
                      type="text"
                      data-practice-answer
                      data-state={
                        isCorrect
                          ? "done"
                          : helpedBlockIndex === testableIndex
                            ? "hint"
                            : "blank"
                      }
                      autoFocus={testableIndex === 0}
                      value={answers[testableIndex] ?? ""}
                      onChange={(event) =>
                        updateAnswer(event.target.value, testableIndex)
                      }
                      onFocus={() => setFocusedBlockIndex(testableIndex)}
                      onBlur={() =>
                        setFocusedBlockIndex((current) =>
                          current === testableIndex ? null : current,
                        )
                      }
                      onKeyDown={(event) => onAnswerKeyDown(event, testableIndex)}
                      aria-label={`Traducción de ${languageBlock.spanish || `bloque ${testableIndex + 1}`}`}
                      autoComplete="off"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      lang="en"
                      className="stage-en stage-en-input"
                      style={
                        {
                          "--blank-chars": blankChars(languageBlock),
                          "--answer-chars": answerMinChars(
                            languageBlock,
                            isSingleLanguageBlock,
                          ),
                        } as CSSProperties
                      }
                    />
                  </Fragment>
                );
              })}
            </p>
            <span className="sr-only" role="status">
              {helpedBlock
                ? `Pista: ${helpedBlock.acceptedAnswers[0]}`
                : activeIndex >= 0
                  ? ""
                  : "Frase completa"}
            </span>
          </div>
          {helpedBlock && helpedBlockIndex !== null && (
            <p className="stage-hint" aria-live="polite">
              <span className="stage-hint-label">Pista:</span>{" "}
              {diffChars(
                answers[helpedBlockIndex] ?? "",
                pickClosestAnswer(
                  answers[helpedBlockIndex] ?? "",
                  helpedBlock.acceptedAnswers,
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
          {languageBlocks.some((languageBlock) =>
            languageBlock.callout?.trim(),
          ) && (
            <div className="stage-notes">
              {languageBlocks.map((languageBlock) =>
                languageBlock.callout?.trim() ? (
                  <p className="answer-note" key={languageBlock.id}>
                    <Info size={13} aria-hidden="true" />
                    <span>
                      <strong lang="es">{languageBlock.spanish}</strong>{" "}
                      {languageBlock.callout}
                    </span>
                  </p>
                ) : null,
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
