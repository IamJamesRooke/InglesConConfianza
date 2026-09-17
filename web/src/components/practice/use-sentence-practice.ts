"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LanguageBlock, SentenceBlock } from "@/lib/lesson-builder/types";
import {
  isAnswerAccepted,
  isMeaningfulLanguageBlock,
  matchedAcceptedAnswer,
  sentenceEnglishText,
} from "@/lib/lesson-builder/utils";
import {
  availableSpeakers,
  pickSpeaker,
  speakAwaitingEnd,
  speakSentenceAfterPiece,
  stopSpeaking,
  type Speaker,
} from "@/lib/learner/speech";

/**
 * Everything a sentence slide needs that isn't layout: which pieces are
 * testable, the learner's answers, per-piece correctness, hint state, focus
 * bookkeeping, and the speech sequencing (piece on correct, whole sentence
 * once at the end). Shared by both renderings of a sentence slide — the
 * L2b assembling-sentence stage (default) and the older grid card kept
 * behind `?layout=grid` — so answer matching and speech behave identically
 * in both. Answer matching itself is not reimplemented here: it is
 * `isAnswerAccepted` from lesson-builder/utils, as before.
 */

// The answer field grows to fit whatever the learner types (`field-sizing:
// content`), but that alone doesn't stop a first paint / non-supporting
// browser from clipping a long accepted answer — so this floor is sized to
// the longest accepted answer (or the Spanish prompt, if that's longer)
// plus 2ch of slack. Single-blank cards read wider (bigger type), so they
// get a slightly taller floor to match the previous fixed 12rem look.
export function answerMinChars(
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

/** Width of an unanswered blank: one character cell per character of the
 * expected answer, never narrower than 3ch (so a one-letter answer still
 * reads as a blank to fill, not a speck). */
export function blankChars(languageBlock: LanguageBlock): number {
  const expected = languageBlock.acceptedAnswers[0]?.trim() ?? "";
  return Math.max(3, expected.length);
}

export function useSentencePractice({
  sentence,
  initialAnswers,
  onCompletionChange,
  onAnswersChange,
  onSpeakerChange,
}: {
  sentence: SentenceBlock;
  initialAnswers?: string[];
  onCompletionChange?: (isComplete: boolean) => void;
  onAnswersChange?: (answers: string[]) => void;
  onSpeakerChange?: (speaker: Speaker | null) => void;
}) {
  // Dangling fully-blank language blocks are authoring debris, not real
  // questions — drop them before anything derives indices, progression, or
  // rendering from this list. See isMeaningfulLanguageBlock.
  const languageBlocks = sentence.languageBlocks.filter(
    isMeaningfulLanguageBlock,
  );
  // E8 "given" pieces (shown, not tested) are rendered inline by the cards
  // but never drive answer state, progression, or completion — every index
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
  // Tracks the in-flight speech promise for whichever piece most recently
  // turned correct, so the full-sentence sequencing below can wait for the
  // *last* piece to actually finish (or be interrupted) before pausing and
  // speaking the sentence. See docs/design/speech.md item 1.
  const pieceSpeechRef = useRef<Promise<void>>(Promise.resolve());
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
  // The accepted answer each correct piece actually matched — its canonical
  // spelling/casing, not the learner's raw typing. A finished piece displays
  // this, never `answers[i]` directly (see docs/design/student-experience.md,
  // "L2b — the sentence stage").
  const matchedAnswers = testableBlocks.map((languageBlock, languageBlockIndex) =>
    matchedAcceptedAnswer(
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
  // after a few seconds, or as soon as they type again (see updateAnswer),
  // whichever comes first.
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
    if (
      isComplete &&
      !spokeCompleteRef.current &&
      sentence.layout !== "vocabulary_table"
    ) {
      spokeCompleteRef.current = true;
      const full = sentenceEnglishText(languageBlocks);
      if (full) {
        let cancelled = false;
        // Wait for the last piece to finish (or be interrupted), pause
        // briefly, then speak the whole sentence — never cut the last piece
        // off mid-word. `isCancelled` lets the learner moving on during the
        // wait (advancing, unmounting) skip the sentence outright rather
        // than have it start late. See docs/design/speech.md item 1.
        void speakSentenceAfterPiece(
          pieceSpeechRef.current,
          full,
          speaker,
          {
            onStart: () => {
              if (!cancelled) setSpeakingText(full);
            },
          },
          { isCancelled: () => cancelled },
        );
        return () => {
          cancelled = true;
        };
      }
    }
    if (!isComplete) spokeCompleteRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, onCompletionChange]);
  // Advancing the slide or unmounting the card cancels any speech in flight
  // — audio never blocks progression and never lingers into the next slide.
  useEffect(() => () => stopSpeaking(), []);
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

  function updateAnswer(answer: string, languageBlockIndex: number) {
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
        // The bubble keeps showing this text after it finishes speaking
        // (see SpeakerChip) — no onEnd reset here. speakAwaitingEnd()
        // interrupts whatever piece was still playing (see speak()) and its
        // promise is what the full-sentence effect above waits on.
        setSpeakingText(pieceEnglish);
        pieceSpeechRef.current = speakAwaitingEnd(pieceEnglish, speaker);
      }
    }
    if (isCorrect && languageBlockIndex < testableBlocks.length - 1)
      window.setTimeout(
        () => inputRefs.current[languageBlockIndex + 1]?.focus(),
        0,
      );
  }

  // Alt+H and Enter reveal the hint; forward Tab past a wrong/incomplete
  // answer is blocked and reveals the hint instead — without that, the
  // reveal itself unmounts the very hint-toggle button focus was about to
  // land on, and the learner could Tab straight past an unanswered blank.
  // Shift+Tab stays unrestricted. Shared by both card layouts.
  function onAnswerKeyDown(
    event: ReactKeyboardEvent<HTMLInputElement>,
    languageBlockIndex: number,
  ) {
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
    const isBareKey =
      !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;
    if (
      event.key === "Enter" &&
      isBareKey &&
      !correctAnswers[languageBlockIndex]
    ) {
      event.preventDefault();
      showHelp(languageBlockIndex);
      return;
    }
    if (
      event.key === "Tab" &&
      isBareKey &&
      !correctAnswers[languageBlockIndex]
    ) {
      event.preventDefault();
      showHelp(languageBlockIndex);
    }
  }

  return {
    onAnswerKeyDown,
    languageBlocks,
    testableBlocks,
    testableIndexById,
    answers,
    correctAnswers,
    matchedAnswers,
    isComplete,
    helpedBlockIndex,
    focusedBlockIndex,
    setFocusedBlockIndex,
    inputRefs,
    showHelp,
    updateAnswer,
    speaker,
    speakingText,
  };
}
