"use client";

import { Check, Info, Lightbulb, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { SentenceBlock } from "@/lib/lesson-builder/types";
import { normalizeAnswer } from "@/lib/lesson-builder/utils";
import {
  EditablePracticeMarkdown,
  PracticeMarkdown,
} from "./practice-markdown";

export type SentenceAuthoringProps = {
  onFieldChange: (
    field: "promptLabel" | "promptText" | "helperText" | "answerFeedback",
    value: string,
  ) => void;
  onSpanishChange: (languageBlockId: string, value: string) => void;
  onAnswerChange: (
    languageBlockId: string,
    answerIndex: number,
    value: string,
  ) => void;
  onCalloutChange: (languageBlockId: string, value: string | null) => void;
  onAddAnswer: (languageBlockId: string) => void;
  onRemoveAnswer: (languageBlockId: string, answerIndex: number) => void;
  onAddLanguageBlock: () => void;
  onRemoveLanguageBlock: (languageBlockId: string) => void;
};

export function SentencePracticeCard({
  sentence,
  onCompletionChange,
  authoring,
}: {
  sentence: SentenceBlock;
  onCompletionChange?: (isComplete: boolean) => void;
  authoring?: SentenceAuthoringProps;
}) {
  const [answers, setAnswers] = useState<string[]>(() =>
    sentence.languageBlocks.map(() => ""),
  );
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);
  const [helpedBlockIndex, setHelpedBlockIndex] = useState<number | null>(null);
  const [activeBlockIndex, setActiveBlockIndex] = useState(0);
  const [openDetailsId, setOpenDetailsId] = useState<string | null>(null);
  const [authoringView, setAuthoringView] = useState<"question" | "hint" | "success">("question");
  const [showOptionalMenu, setShowOptionalMenu] = useState(false);
  const [visibleOptionalFields, setVisibleOptionalFields] = useState(() =>
    new Set<"promptLabel" | "helperText" | "answerFeedback">(),
  );
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const spanishInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const pendingNewPieceFocus = useRef(false);
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

  // A single hint control serves the whole sentence: help the blank the learner
  // is in, or the first one still unanswered.
  const hintTargetIndex = !correctAnswers[activeBlockIndex]
    ? activeBlockIndex
    : correctAnswers.findIndex((isCorrect) => !isCorrect);
  const canShowHint = !isComplete && hintTargetIndex >= 0;
  const hintCallout =
    hintTargetIndex >= 0
      ? sentence.languageBlocks[hintTargetIndex]?.callout?.trim() ?? ""
      : "";

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
    if (!authoring) onCompletionChange?.(isComplete);
  }, [authoring, isComplete, onCompletionChange]);

  useEffect(
    () => () => {
      clearHelpTimer();
    },
    [clearHelpTimer],
  );

  useEffect(() => {
    if (authoring) return;
    const timer = window.setTimeout(() => inputRefs.current[0]?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [authoring, sentence.id]);

  useEffect(() => {
    if (!authoring || !pendingNewPieceFocus.current) return;
    pendingNewPieceFocus.current = false;
    spanishInputRefs.current.at(-1)?.focus();
  }, [authoring, sentence.languageBlocks.length]);

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
      tabIndex={authoring ? -1 : undefined}
    >
      {authoring && (
        <div className="authoring-practice-view" aria-label="Learner state shown on the canvas">
          <span>Learner sees</span>
          {(["question", "hint", "success"] as const).map((view) => (
            <button
              key={view}
              type="button"
              className={authoringView === view ? "active" : ""}
              onClick={() => setAuthoringView(view)}
            >
              {view === "question" ? "Question" : view === "hint" ? "Hint" : "Success"}
            </button>
          ))}
        </div>
      )}
      {(sentence.promptLabel.trim() || (authoring && visibleOptionalFields.has("promptLabel"))) && (
        <div className="sentence-prompt-label">
          {authoring ? (
            <InlineMarkdownField
              value={sentence.promptLabel}
              placeholder="Add a short label…"
              variant="eyebrow"
              fieldName="promptLabel"
              onChange={(value) => authoring.onFieldChange("promptLabel", value)}
            />
          ) : (
            <PracticeMarkdown markdown={sentence.promptLabel} variant="eyebrow" />
          )}
        </div>
      )}
      {(sentence.promptText?.trim() || authoring) && (
        <div className="sentence-prompt">
          {authoring ? (
            <InlineMarkdownField
              value={sentence.promptText ?? ""}
              placeholder="Add the learner prompt…"
              variant="prompt"
              fieldName="promptText"
              onChange={(value) => authoring.onFieldChange("promptText", value)}
            />
          ) : (
            <PracticeMarkdown markdown={sentence.promptText} variant="prompt" />
          )}
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
                  className={`answer-piece ${!authoring && correctAnswers[languageBlockIndex] && helpedBlockIndex !== languageBlockIndex ? "correct" : ""}`}
                >
                  {authoring ? (
                    <input
                      ref={(element) => { spanishInputRefs.current[languageBlockIndex] = element; }}
                      autoFocus={languageBlockIndex === 0}
                      value={languageBlock.spanish}
                      onChange={(event) =>
                        authoring.onSpanishChange(languageBlock.id, event.target.value)
                      }
                      className="answer-source authoring-source-input"
                      data-authoring-field="spanish"
                      placeholder="Spanish prompt…"
                      aria-label="Spanish prompt"
                      onKeyDown={(event) => {
                        if (!authoring || event.key !== "Tab") return;
                        if (event.shiftKey && languageBlockIndex > 0) {
                          event.preventDefault();
                          inputRefs.current[languageBlockIndex - 1]?.focus();
                        } else if (!event.shiftKey) {
                          event.preventDefault();
                          inputRefs.current[languageBlockIndex]?.focus();
                        }
                      }}
                    />
                  ) : (
                    <span className="answer-source">{languageBlock.spanish}</span>
                  )}
                  <div className="answer-field">
                    <input
                      ref={(element) => {
                        inputRefs.current[languageBlockIndex] = element;
                      }}
                      type="text"
                      data-practice-answer
                      data-authoring-field={authoring ? "answer" : undefined}
                      autoFocus={!authoring && languageBlockIndex === 0}
                      value={
                        authoring
                          ? languageBlock.acceptedAnswers[0] ?? ""
                          : answers[languageBlockIndex] ?? ""
                      }
                      onChange={(event) =>
                        authoring
                          ? authoring.onAnswerChange(
                              languageBlock.id,
                              0,
                              event.target.value,
                            )
                          : updatePreviewAnswer(
                              event.target.value,
                              languageBlockIndex,
                            )
                      }
                      onKeyDown={(event) => {
                        if (authoring && event.key === "Tab") {
                          event.preventDefault();
                          if (event.shiftKey) spanishInputRefs.current[languageBlockIndex]?.focus();
                          else if (languageBlockIndex < sentence.languageBlocks.length - 1) spanishInputRefs.current[languageBlockIndex + 1]?.focus();
                          else if (languageBlock.spanish.trim() && (languageBlock.acceptedAnswers[0] ?? "").trim()) {
                            pendingNewPieceFocus.current = true;
                            authoring.onAddLanguageBlock();
                          } else event.currentTarget.closest<HTMLElement>(".sentence-practice")?.focus();
                          return;
                        }
                        if (
                          !authoring &&
                          event.altKey &&
                          event.key.toLowerCase() === "h"
                        ) {
                          event.preventDefault();
                          if (
                            !correctAnswers[languageBlockIndex] ||
                            helpedBlockIndex === languageBlockIndex
                          ) {
                            showHelp(languageBlockIndex);
                          }
                        }
                      }}
                      onFocus={() =>
                        !authoring && setActiveBlockIndex(languageBlockIndex)
                      }
                      aria-label={`Traducción de ${languageBlock.spanish || `bloque ${languageBlockIndex + 1}`}`}
                      autoComplete="off"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      lang="en"
                      placeholder={authoring ? "Accepted English answer…" : ""}
                      aria-describedby={
                        authoring && languageBlock.callout?.trim()
                          ? `callout-${languageBlock.id}`
                          : undefined
                      }
                      className={`answer-input ${helpedBlockIndex === languageBlockIndex ? "showing-hint" : ""}`}
                    />
                    {!authoring &&
                    correctAnswers[languageBlockIndex] &&
                    helpedBlockIndex !== languageBlockIndex ? (
                      <span className="answer-correct-mark" aria-hidden="true">
                        <Check size={18} strokeWidth={2.75} />
                      </span>
                    ) : authoring ? (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenDetailsId((current) =>
                            current === languageBlock.id
                              ? null
                              : languageBlock.id,
                          )
                        }
                        aria-label="Edit accepted answers and context hint"
                        title="Answers and hint"
                        className="answer-hint"
                      >
                        <Lightbulb size={17} aria-hidden="true" />
                        <span>Answers &amp; hint</span>
                      </button>
                    ) : null}
                    <span className="sr-only" role="status">
                      {helpedBlockIndex === languageBlockIndex
                        ? `Pista: ${languageBlock.acceptedAnswers[0]}`
                        : correctAnswers[languageBlockIndex]
                          ? `Respuesta aceptada: ${answers[languageBlockIndex]}`
                          : ""}
                    </span>
                  </div>
                  {authoring && openDetailsId === languageBlock.id && (
                    <div className="authoring-answer-details">
                      <label>
                        <span>Context hint</span>
                        <input
                          value={languageBlock.callout ?? ""}
                          onChange={(event) =>
                            authoring.onCalloutChange(
                              languageBlock.id,
                              event.target.value || null,
                            )
                          }
                          placeholder="Optional context the learner sees…"
                        />
                      </label>
                      {languageBlock.acceptedAnswers.slice(1).map((answer, alternativeIndex) => {
                        const answerIndex = alternativeIndex + 1;
                        return (
                          <label key={answerIndex}>
                            <span>Alternative {answerIndex}</span>
                            <span className="authoring-answer-row">
                              <input
                                value={answer}
                                onChange={(event) =>
                                  authoring.onAnswerChange(
                                    languageBlock.id,
                                    answerIndex,
                                    event.target.value,
                                  )
                                }
                                placeholder="Another accepted answer…"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  authoring.onRemoveAnswer(
                                    languageBlock.id,
                                    answerIndex,
                                  )
                                }
                                aria-label={`Remove alternative ${answerIndex}`}
                              >
                                <Trash2 size={15} aria-hidden="true" />
                              </button>
                            </span>
                          </label>
                        );
                      })}
                      <div className="authoring-details-actions">
                        <button
                          type="button"
                          onClick={() => authoring.onAddAnswer(languageBlock.id)}
                        >
                          <Plus size={15} aria-hidden="true" /> Alternative
                        </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => authoring.onRemoveLanguageBlock(languageBlock.id)}
                          >
                            <Trash2 size={15} aria-hidden="true" /> Delete sentence piece
                          </button>
                      </div>
                    </div>
                  )}
                  {authoring && languageBlock.callout?.trim() && (
                    <button
                      type="button"
                      className="answer-callout authoring-callout"
                      id={`callout-${languageBlock.id}`}
                      onClick={() => setOpenDetailsId(languageBlock.id)}
                    >
                      {languageBlock.callout}
                    </button>
                  )}
                </div>
              ),
            )}
            {authoring && (
              <button
                type="button"
                className="authoring-add-piece"
                onClick={authoring.onAddLanguageBlock}
              >
                <Plus size={18} aria-hidden="true" /> Add answer piece
              </button>
            )}
          </div>
          {!authoring && canShowHint && (
            <div className="sentence-hint">
              <button
                type="button"
                className="answer-hint"
                onClick={() => showHelp(hintTargetIndex)}
                title="Mostrar pista (Alt+H)"
              >
                <Lightbulb size={19} aria-hidden="true" />
                <span>Ver una pista</span>
              </button>
              {hintCallout && <p className="sentence-hint-note">{hintCallout}</p>}
            </div>
          )}
          {!authoring && isComplete && !hasFeedback && (
            <p className="sentence-success" aria-live="polite">
              <span className="sentence-success-mark" aria-hidden="true">
                <Check size={20} strokeWidth={3} />
              </span>
              <span>¡Perfecto!</span>
            </p>
          )}
        </>
      ) : (
        authoring ? (
          <button type="button" className="authoring-add-piece" autoFocus onClick={() => { pendingNewPieceFocus.current = true; authoring.onAddLanguageBlock(); }}>
            <Plus size={18} aria-hidden="true" /> Add the first sentence piece
          </button>
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm font-medium text-destructive">
            Esta práctica todavía no está disponible.
          </p>
        )
      )}

      {(sentence.helperText?.trim() || (authoring && (authoringView === "hint" || visibleOptionalFields.has("helperText")))) && (
        <aside className="sentence-helper">
          <Info size={17} aria-hidden="true" />
          {authoring ? (
            <InlineMarkdownField
              value={sentence.helperText ?? ""}
              placeholder="Add helper text…"
              variant="helper"
              fieldName="helperText"
              onChange={(value) => authoring.onFieldChange("helperText", value)}
            />
          ) : (
            <PracticeMarkdown markdown={sentence.helperText} variant="helper" />
          )}
        </aside>
      )}

      <div className="sentence-authored-feedback" aria-live="polite">
        {authoring && (authoringView === "success" || sentence.answerFeedback?.trim() || visibleOptionalFields.has("answerFeedback")) ? (
          <InlineMarkdownField
            value={sentence.answerFeedback ?? ""}
            placeholder="Add feedback shown after a correct answer…"
            variant="feedback"
            fieldName="answerFeedback"
            onChange={(value) => authoring.onFieldChange("answerFeedback", value)}
          />
        ) : hasFeedback && isFeedbackVisible ? (
          <PracticeMarkdown
            markdown={sentence.answerFeedback ?? ""}
            variant="feedback"
          />
        ) : null}
      </div>
      {authoring && (
        <div className="authoring-add-to-slide">
          <button type="button" onClick={() => setShowOptionalMenu((open) => !open)}>
            <Plus size={15} aria-hidden="true" /> Add to slide
          </button>
          {showOptionalMenu && (
            <div className="authoring-optional-menu">
              <button type="button" onClick={() => { setVisibleOptionalFields((current) => new Set(current).add("promptLabel")); setShowOptionalMenu(false); window.setTimeout(() => document.querySelector<HTMLElement>('[data-authoring-field="promptLabel"]')?.focus(), 0); }}>Short label</button>
              <button type="button" onClick={() => { setVisibleOptionalFields((current) => new Set(current).add("helperText")); setAuthoringView("hint"); setShowOptionalMenu(false); window.setTimeout(() => document.querySelector<HTMLElement>('[data-authoring-field="helperText"]')?.focus(), 0); }}>Helper text</button>
              <button type="button" onClick={() => { setVisibleOptionalFields((current) => new Set(current).add("answerFeedback")); setAuthoringView("success"); setShowOptionalMenu(false); window.setTimeout(() => document.querySelector<HTMLElement>('[data-authoring-field="answerFeedback"]')?.focus(), 0); }}>Success feedback</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InlineMarkdownField({
  value,
  placeholder,
  variant,
  fieldName,
  onChange,
}: {
  value: string;
  placeholder: string;
  variant: "eyebrow" | "prompt" | "helper" | "feedback";
  fieldName: "promptLabel" | "promptText" | "helperText" | "answerFeedback";
  onChange: (value: string) => void;
}) {
  return (
    <EditablePracticeMarkdown
      markdown={value}
      onChange={onChange}
      placeholder={placeholder}
      ariaLabel={placeholder}
      fieldName={fieldName}
      variant={variant}
    />
  );
}
