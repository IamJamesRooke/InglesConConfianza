"use client";

import { Plus, X } from "lucide-react";

import { getAnswerValidationMessage } from "@/lib/lesson-builder/utils";

// The dark panel of accepted English answers under a language block's Spanish
// prompt. Answer 0 is the primary (required); the rest are "also accepted".
// Keyboard: Alt+Enter or Enter (on an alternative) appends; Tab off the last
// answer hands focus onward (parent decides where).
export function AcceptedAnswersEditor({
  answers,
  registerInputRef,
  onChange,
  onAppend,
  onRemove,
  onTabForwardFromLast,
}: {
  answers: string[];
  registerInputRef: (
    answerIndex: number,
    element: HTMLInputElement | null,
  ) => void;
  onChange: (answerIndex: number, value: string) => void;
  onAppend: () => void;
  onRemove: (answerIndex: number) => void;
  onTabForwardFromLast: () => void;
}) {
  return (
    <div className="border-t border-stone-800 bg-stone-900 px-3 py-3">
      <div className="space-y-2">
        {answers.map((answer, answerIndex) => {
          const isPrimaryAnswer = answerIndex === 0;
          const isLastAnswer = answerIndex === answers.length - 1;
          const answerValidationMessage = getAnswerValidationMessage(
            answers,
            answerIndex,
          );

          return (
            <label key={answerIndex} className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                {isPrimaryAnswer ? "English answer" : "Also accepted"}
              </span>
              <span className="flex items-center gap-1.5">
                <input
                  ref={(element) => registerInputRef(answerIndex, element)}
                  type="text"
                  value={answer}
                  aria-invalid={Boolean(answerValidationMessage)}
                  onChange={(event) => onChange(answerIndex, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.altKey && event.key === "Enter") {
                      event.preventDefault();
                      onAppend();
                      return;
                    }

                    if (event.key === "Enter" && !isPrimaryAnswer) {
                      event.preventDefault();
                      onAppend();
                      return;
                    }

                    if (
                      event.key === "Tab" &&
                      !event.shiftKey &&
                      isLastAnswer
                    ) {
                      event.preventDefault();
                      onTabForwardFromLast();
                    }
                  }}
                  placeholder={
                    isPrimaryAnswer ? "English answer" : "Alternative answer"
                  }
                  className="min-w-0 flex-1 rounded-md bg-stone-800 px-2.5 py-2 text-sm font-semibold text-white outline-none transition placeholder:text-stone-500 focus:bg-stone-700 focus:ring-2 focus:ring-blue-400/50"
                />
                {!isPrimaryAnswer && (
                  <button
                    type="button"
                    onClick={() => onRemove(answerIndex)}
                    aria-label="Remove alternative answer"
                    title="Remove alternative answer"
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-stone-500 transition hover:bg-red-950/50 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )}
              </span>
              {answerValidationMessage && (
                <span className="mt-1 block text-xs font-medium text-red-300">
                  {answerValidationMessage}
                </span>
              )}
            </label>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onAppend}
        title="Add alternative answer (Alt+Enter)"
        className="mt-2 flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-stone-400 transition hover:bg-stone-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
      >
        <Plus className="size-3.5" aria-hidden="true" />
        Add alternative
      </button>
    </div>
  );
}
