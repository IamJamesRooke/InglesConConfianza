"use client";
import { Info } from "lucide-react";
import type { CSSProperties } from "react";
import { InstructionAudio } from "@/components/practice/instruction-audio";
import { PracticeMarkdown } from "@/components/practice/practice-markdown";
import { HintButton, SpeakerChip } from "@/components/practice/speaker-chip";
import {
  answerMinChars,
  useSentencePractice,
} from "@/components/practice/use-sentence-practice";
import type { SentenceBlock } from "@/lib/lesson-builder/types";
import type { Speaker } from "@/lib/learner/speech";

/**
 * The original grid-of-fields sentence card: one labelled blank per piece,
 * wrapping into rows. Superseded by SentenceStageCard (the assembling
 * sentence) for ordinary sentences; still used for vocabulary tables, which
 * stay tables (docs/design/learner-direction.md item 10). All answer/speech
 * behaviour lives in useSentencePractice, shared with the new card.
 */
export function SentencePracticeCard({
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
    focusedBlockIndex,
    setFocusedBlockIndex,
    inputRefs,
    showHelp,
    updateAnswer,
    onAnswerKeyDown,
    confirmCaptureOnBlur,
    speaker,
    speakingText,
  } = useSentencePractice({
    sentence,
    initialAnswers,
    onCompletionChange,
    onAnswersChange,
    onSpeakerChange,
    onHintsUsedChange,
  });
  const isSingleLanguageBlock = testableBlocks.length === 1;
  // Which row "Recuérdame" speaks: the focused one, else the first row still
  // unanswered.
  const hintIndex =
    focusedBlockIndex !== null
      ? focusedBlockIndex
      : correctAnswers.findIndex((correct) => !correct);
  const isVocabulary = sentence.layout === "vocabulary_table";
  const hasAuthoredPrompt = Boolean(
    sentence.promptLabel.trim() || sentence.promptText?.trim(),
  );
  const hasSentencePromptText = Boolean(sentence.promptText?.trim());
  const cardBody = (
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
          <InstructionAudio text={sentence.promptText ?? ""} />
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
                  className={`answer-piece ${correctAnswers[languageBlockIndex] ? "correct" : ""}`}
                >
                  <span className="answer-source">
                    {languageBlock.spanish}
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
                        // Keep the row "focused" while the learner reaches
                        // for the speaker's Recuérdame button — that button is
                        // what decides which row's answer gets spoken.
                        if (
                          event.relatedTarget instanceof HTMLElement &&
                          event.relatedTarget.classList.contains(
                            "stage-hint-button",
                          )
                        )
                          return;
                        // A capture piece completes on confirmation, and
                        // leaving the field counts as one.
                        confirmCaptureOnBlur(languageBlockIndex);
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
                      className="answer-input"
                    />
                    {isVocabulary && correctAnswers[languageBlockIndex] && (
                      <span className="answer-completed-text" aria-hidden="true">
                        {answers[languageBlockIndex]}
                      </span>
                    )}
                    <span className="sr-only" role="status">
                      {correctAnswers[languageBlockIndex]
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
                </div>
              );
            })}
          </div>
          {!isVocabulary && (
            <SpeakerChip
              key={sentence.id}
              speaker={speaker}
              speakingText={speakingText}
            />
          )}
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm font-medium text-destructive">
          Esta práctica todavía no está disponible.
        </p>
      )}
    </div>
  );

  // Vocabulary tables keep the table shape but sit in the same two-actor
  // composition as ordinary sentence slides (speaker column left of the
  // card at desktop, the group centred; card then speaker row on phone) —
  // see docs/design/student-experience.md, "L2b — the sentence stage",
  // item 3. Every other rendering (the older grid card behind
  // `?layout=grid`) keeps its own flat layout, speaker chip included above.
  if (isVocabulary) {
    const hintButtonNode = (
      <HintButton
        onShowHint={() => showHelp(hintIndex)}
        disabled={hintIndex < 0}
      />
    );
    return (
      <div className="sentence-stage learner-enter">
        <div className="stage-composition" data-wraps="true">
          <div className="stage-speaker">
            <SpeakerChip
              key={sentence.id}
              speaker={speaker}
              speakingText={speakingText}
              variant="stage"
              action={hintButtonNode}
            />
            {!speaker && hintButtonNode}
          </div>
          <div className="stage-column" data-wraps="true">{cardBody}</div>
        </div>
      </div>
    );
  }

  return cardBody;
}
