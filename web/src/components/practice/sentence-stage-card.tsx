"use client";
import { Info } from "lucide-react";
import type { CSSProperties } from "react";
import { Fragment } from "react";
import { InstructionAudio } from "@/components/practice/instruction-audio";
import { PracticeMarkdown } from "@/components/practice/practice-markdown";
import { HintButton, SpeakerChip } from "@/components/practice/speaker-chip";
import {
  blankChars,
  useSentencePractice,
} from "@/components/practice/use-sentence-practice";
import type { SentenceBlock } from "@/lib/lesson-builder/types";
import type { Speaker } from "@/lib/learner/speech";
import { pieceEnglishSource } from "@/lib/lesson-builder/utils";
import { sentenceWraps } from "@/lib/learner/presentation";
import { useVariableText } from "@/lib/learner/use-learner-variables";

/**
 * L2b: the sentence slide as one sentence being assembled, not a grid of
 * fields (see docs/design/student-experience.md, "L2b sentence stage").
 *
 * Line 1 is the Spanish sentence as prose — the piece being typed is
 * highlighted, finished pieces settle back to ink, pieces still to come are
 * muted. Line 2 is the English sentence growing in place: pieces still to
 * come and the piece being typed are inline inputs (blank underlines sized
 * to their answer until answered), and a finished piece is a plain `<span>`
 * carrying the accepted answer it matched (canonical casing, not the
 * learner's raw typing) at normal inter-word spacing — no input, so no
 * caret-reserve gap. Clicking or tabbing into a finished word swaps it back
 * to an input so the learner can still fix it. Tab/Enter/click progression,
 * hints and answer matching are exactly the behaviour of the older grid
 * card — all of it shared through useSentencePractice.
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
  onHintsUsedChange,
}: {
  sentence: SentenceBlock;
  onCompletionChange?: (isComplete: boolean) => void;
  initialAnswers?: string[];
  onAnswersChange?: (answers: string[]) => void;
  onSpeakerChange?: (speaker: Speaker | null) => void;
  onHintsUsedChange?: (count: number) => void;
}) {
  const {
    languageBlocks,
    testableBlocks,
    testableIndexById,
    answers,
    correctAnswers,
    matchedAnswers,
    hintedBlockIndex,
    focusedBlockIndex,
    setFocusedBlockIndex,
    inputRefs,
    showHelp,
    updateAnswer,
    onAnswerKeyDown,
    confirmCaptureOnBlur,
    speaker,
    speakingText,
    hintDiff,
  } = useSentencePractice({
    sentence,
    initialAnswers,
    onCompletionChange,
    onAnswersChange,
    onSpeakerChange,
    onHintsUsedChange,
  });
  // The piece the learner is on: whatever is focused, else the first one
  // still unanswered. Drives line 1's highlight and which answer the
  // speaker's "Recuérdame" says out loud.
  // The instruction and eyebrow are authored text like any other, so they
  // take `{key}` tokens too; the spoken clip below keeps the AUTHORED text,
  // which instructionClipUrl strips tokens from itself.
  const substitute = useVariableText();
  const firstUnanswered = correctAnswers.findIndex((correct) => !correct);
  const activeIndex =
    focusedBlockIndex !== null ? focusedBlockIndex : firstUnanswered;
  const hintedBlock =
    hintedBlockIndex === null ? null : testableBlocks[hintedBlockIndex];
  // Alignment rule (docs/design/learner-direction.md, "Sentence slide"): the
  // fit-vs-wrap and hero-size decisions are made from the FULL sentence
  // (Spanish as authored, English as its accepted answers), never the
  // learner's in-progress typing — so nothing about the card's width or
  // font-size ever shifts as pieces are answered.
  const fullSpanish = languageBlocks.map((block) => block.spanish.trim()).join(" ");
  const fullEnglish = languageBlocks.map(pieceEnglishSource).join(" ");
  const wraps = sentenceWraps(fullSpanish, fullEnglish);
  // Direction, "Size and spacing": 1–2 pieces that fit one line get the
  // hero size; everything else (including a wrapping sentence) stays at
  // --t-sentence.
  const isHero = !wraps && languageBlocks.length <= 2;
  const hintButtonNode = (
    <HintButton onShowHint={() => showHelp(activeIndex)} disabled={activeIndex < 0} />
  );

  if (languageBlocks.length === 0)
    return (
      <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm font-medium text-destructive">
        Esta práctica todavía no está disponible.
      </p>
    );

  return (
    <div className="sentence-stage learner-enter">
      <div className="stage-composition" data-wraps={wraps ? "true" : "false"}>
        <div className="stage-speaker">
          <SpeakerChip
            key={sentence.id}
            speaker={speaker}
            speakingText={speakingText}
            diffSegments={hintDiff}
            variant="stage"
            action={hintButtonNode}
          />
          {!speaker && hintButtonNode}
        </div>
        <div className="stage-column" data-wraps={wraps ? "true" : "false"}>
          {sentence.promptLabel.trim() && (
            <div className="stage-eyebrow">
              <PracticeMarkdown
                markdown={substitute(sentence.promptLabel)}
                variant="eyebrow"
              />
            </div>
          )}
          {sentence.promptText?.trim() && (
            <div className="stage-instruction">
              <PracticeMarkdown
                markdown={substitute(sentence.promptText)}
                variant="prompt"
              />
              <InstructionAudio text={sentence.promptText} />
            </div>
          )}
          <div
            className="stage-card"
            data-wraps={wraps ? "true" : "false"}
            data-hero={isHero ? "true" : "false"}
          >
            <p
              className="stage-line stage-line-es"
              lang="es"
              data-single-piece={languageBlocks.length <= 1 ? "true" : "false"}
            >
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
                const isCorrect = correctAnswers[testableIndex];
                const isEditing = focusedBlockIndex === testableIndex;
                // A finished piece not currently being re-edited is plain
                // text — a normal word followed by a normal space, not an
                // input carrying its field-sizing caret reserve. Clicking or
                // tabbing into it swaps it back to an input (below) so the
                // learner can still fix it.
                if (isCorrect && !isEditing) {
                  const canonical =
                    matchedAnswers[testableIndex] ??
                    languageBlock.acceptedAnswers[0] ??
                    "";
                  return (
                    <Fragment key={languageBlock.id}>
                      {index > 0 ? " " : null}
                      <span
                        className="stage-en stage-en-done"
                        data-piece-index={testableIndex}
                        data-state="done"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setFocusedBlockIndex(testableIndex);
                          window.setTimeout(
                            () => inputRefs.current[testableIndex]?.focus(),
                            0,
                          );
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ")
                            return;
                          event.preventDefault();
                          setFocusedBlockIndex(testableIndex);
                          window.setTimeout(
                            () => inputRefs.current[testableIndex]?.focus(),
                            0,
                          );
                        }}
                        aria-label={`Editar traducción de ${languageBlock.spanish || `bloque ${testableIndex + 1}`}`}
                      >
                        {canonical}
                      </span>
                    </Fragment>
                  );
                }
                return (
                  <Fragment key={languageBlock.id}>
                    {index > 0 ? " " : null}
                    <input
                      ref={(element) => {
                        inputRefs.current[testableIndex] = element;
                      }}
                      type="text"
                      data-practice-answer
                      data-piece-index={testableIndex}
                      data-capture={languageBlock.capture ? "true" : undefined}
                      data-state={isCorrect ? "done" : "blank"}
                      autoFocus={testableIndex === 0}
                      value={answers[testableIndex] ?? ""}
                      onChange={(event) =>
                        updateAnswer(event.target.value, testableIndex)
                      }
                      onFocus={() => setFocusedBlockIndex(testableIndex)}
                      onBlur={() => {
                        // A capture piece completes on confirmation, and
                        // leaving the field counts as one (see
                        // use-sentence-practice.ts).
                        confirmCaptureOnBlur(testableIndex);
                        setFocusedBlockIndex((current) =>
                          current === testableIndex ? null : current,
                        );
                      }}
                      onKeyDown={(event) => onAnswerKeyDown(event, testableIndex)}
                      aria-label={`Traducción de ${languageBlock.spanish || `bloque ${testableIndex + 1}`}`}
                      autoComplete={languageBlock.capture ? "given-name" : "off"}
                      maxLength={languageBlock.capture ? 40 : undefined}
                      autoCapitalize={languageBlock.capture ? "words" : "off"}
                      autoCorrect="off"
                      spellCheck={false}
                      lang={languageBlock.capture ? undefined : "en"}
                      className="stage-en stage-en-input"
                      style={
                        {
                          "--blank-chars": blankChars(languageBlock),
                        } as CSSProperties
                      }
                    />
                  </Fragment>
                );
              })}
            </p>
            <span className="sr-only" role="status">
              {hintedBlock ? "" : activeIndex >= 0 ? "" : "Frase completa"}
            </span>
          </div>
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
