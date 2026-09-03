"use client";

import { GripVertical, Trash2, Sun } from "lucide-react";
import type { DragEvent } from "react";

import type { LanguageBlock } from "@/lib/lesson-builder/types";
import { getAnswerValidationMessage } from "@/lib/lesson-builder/utils";

import { AcceptedAnswersEditor } from "./accepted-answers-editor";
import { LanguageBlockCallout } from "./language-block-callout";

// One language block inside a sentence: a Spanish prompt, its accepted English
// answers, and an optional context hint. Collapsible, drag-to-reorder. All state
// transitions and focus targets are decided by the parent and passed as
// callbacks so this stays a pure view.
export function LanguageBlockEditor({
  languageBlock,
  index,
  isCollapsed,
  hasPreviousBlock,
  dropPosition,
  isDragging,
  onExpandFocusSpanish,
  onCollapse,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  registerSpanishRef,
  onSpanishChange,
  onSpanishTabBackward,
  onSpanishTabForward,
  registerAnswerRef,
  onAnswerChange,
  onAnswerAppend,
  onAnswerRemove,
  onAnswersTabForwardFromLast,
  registerCalloutRef,
  onCalloutAdd,
  onCalloutChange,
  onCalloutRemove,
}: {
  languageBlock: LanguageBlock;
  index: number;
  isCollapsed: boolean;
  hasPreviousBlock: boolean;
  dropPosition: "before" | "after" | null;
  isDragging: boolean;
  onExpandFocusSpanish: () => void;
  onCollapse: () => void;
  onDelete: () => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: () => void;
  registerSpanishRef: (element: HTMLInputElement | null) => void;
  onSpanishChange: (value: string) => void;
  onSpanishTabBackward: () => void;
  onSpanishTabForward: () => void;
  registerAnswerRef: (
    answerIndex: number,
    element: HTMLInputElement | null,
  ) => void;
  onAnswerChange: (answerIndex: number, value: string) => void;
  onAnswerAppend: () => void;
  onAnswerRemove: (answerIndex: number) => void;
  onAnswersTabForwardFromLast: () => void;
  registerCalloutRef: (element: HTMLInputElement | null) => void;
  onCalloutAdd: () => void;
  onCalloutChange: (value: string) => void;
  onCalloutRemove: () => void;
}) {
  const isSpanishMissing = !languageBlock.spanish.trim();
  const hasInvalidAnswer = languageBlock.acceptedAnswers.some((_, answerIndex) =>
    getAnswerValidationMessage(languageBlock.acceptedAnswers, answerIndex),
  );

  return (
    <div
      onClick={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest(
            "button, input, textarea, select, a, [contenteditable='true']",
          )
        ) {
          return;
        }
        if (isCollapsed) {
          onExpandFocusSpanish();
        } else {
          onCollapse();
        }
      }}
      onDragOver={onDragOver}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDrop();
      }}
      className={`relative overflow-hidden rounded-xl border bg-white transition ${
        isCollapsed
          ? "cursor-pointer shadow-sm"
          : "cursor-pointer shadow-md shadow-stone-200/60"
      } ${
        isSpanishMissing || hasInvalidAnswer
          ? "border-red-300"
          : "border-stone-300"
      } ${isDragging ? "opacity-45" : ""}`}
    >
      {dropPosition && (
        <span
          aria-hidden="true"
          className={`absolute inset-y-2 z-20 w-1 rounded-full bg-blue-500 ${
            dropPosition === "before" ? "left-0" : "right-0"
          }`}
        />
      )}
      <div className="flex items-center justify-between gap-2 border-b border-stone-200 bg-stone-100 px-2 py-1.5">
        <button
          type="button"
          draggable
          onDragStart={onDragStart}
          onDragEnd={(event) => {
            event.stopPropagation();
            onDragEnd();
          }}
          aria-label={`Drag language block ${index + 1} to reorder`}
          title="Drag to reorder"
          className="flex size-7 cursor-grab items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete language block ${index + 1}`}
            title="Delete language block"
            className="flex size-7 items-center justify-center rounded-md text-stone-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      {isCollapsed ? (
        <>
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onExpandFocusSpanish();
              }
            }}
            className="cursor-pointer px-3 py-3 text-sm text-stone-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-blue-200"
          >
            <p className="font-bold text-stone-900">
              {languageBlock.spanish || "Spanish prompt"}
            </p>
            <div className="mt-1 space-y-0.5">
              {languageBlock.acceptedAnswers.some((answer) => answer.trim()) ? (
                languageBlock.acceptedAnswers
                  .filter((answer) => answer.trim())
                  .map((answer, answerIndex) => (
                    <p
                      key={`${answer}-${answerIndex}`}
                      className="italic text-stone-500"
                    >
                      {answer}
                    </p>
                  ))
              ) : (
                <p className="italic text-stone-400">English answer</p>
              )}
            </div>
          </div>
          {languageBlock.callout != null && (
            <div className="flex items-center gap-2 border-t border-amber-300 bg-gradient-to-r from-amber-100 via-yellow-200 to-orange-100 px-3 py-2 text-sm font-semibold text-amber-950">
              <Sun
                className="size-4 shrink-0 text-orange-600"
                aria-hidden="true"
              />
              <p className="min-w-0 truncate italic">
                {languageBlock.callout || "Empty context hint"}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex min-h-28 flex-col items-center justify-center gap-2 px-4 py-5">
            <label className="w-full">
              <span className="sr-only">Spanish prompt</span>
              <input
                ref={registerSpanishRef}
                type="text"
                value={languageBlock.spanish}
                aria-invalid={isSpanishMissing}
                onChange={(event) => onSpanishChange(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Tab" &&
                    event.shiftKey &&
                    hasPreviousBlock
                  ) {
                    event.preventDefault();
                    onSpanishTabBackward();
                    return;
                  }
                  if (event.key === "Tab" && !event.shiftKey) {
                    event.preventDefault();
                    onSpanishTabForward();
                  }
                }}
                placeholder="Spanish prompt"
                className="w-full bg-transparent text-center text-xl font-semibold tracking-tight text-stone-900 outline-none placeholder:text-stone-300"
              />
            </label>
            {isSpanishMissing && (
              <p className="text-xs font-medium text-red-600">
                Spanish text is required.
              </p>
            )}
          </div>
          <AcceptedAnswersEditor
            answers={languageBlock.acceptedAnswers}
            registerInputRef={registerAnswerRef}
            onChange={onAnswerChange}
            onAppend={onAnswerAppend}
            onRemove={onAnswerRemove}
            onTabForwardFromLast={onAnswersTabForwardFromLast}
          />
          <LanguageBlockCallout
            callout={languageBlock.callout}
            registerInputRef={registerCalloutRef}
            onAdd={onCalloutAdd}
            onChange={onCalloutChange}
            onRemove={onCalloutRemove}
          />
        </>
      )}
    </div>
  );
}
