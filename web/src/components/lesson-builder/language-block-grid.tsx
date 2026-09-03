"use client";

import { Plus } from "lucide-react";
import type { RefObject } from "react";

import { LanguageBlockEditor } from "@/components/lesson-builder/language-block-editor";
import type { SentenceBlock } from "@/lib/lesson-builder/types";
import { createId } from "@/lib/lesson-builder/utils";
import type { DragReorder } from "@/lib/lesson-builder/use-drag-reorder";

// The grid of language blocks under a sentence's prompt fields, plus the
// "add language block" tile. Owns the per-row wiring of LanguageBlockEditor;
// the parent passes the raw id-taking handlers and this binds them per block.
export function LanguageBlockGrid({
  lessonId,
  block,
  drag,
  collapsedKeys,
  spanishRefs,
  answerRefs,
  calloutRefs,
  onCollapseKey,
  onExpandFocusSpanish,
  onExpandFocusAnswer,
  onMoveDragged,
  onDeleteLanguageBlock,
  onAddLanguageBlock,
  onSpanishChange,
  onAnswerChange,
  onAnswerAppend,
  onAnswerRemove,
  onCalloutAdd,
  onCalloutChange,
  onCalloutRemove,
}: {
  lessonId: string;
  block: SentenceBlock;
  drag: DragReorder;
  collapsedKeys: Set<string>;
  spanishRefs: RefObject<Map<string, HTMLInputElement>>;
  answerRefs: RefObject<Map<string, HTMLInputElement>>;
  calloutRefs: RefObject<Map<string, HTMLInputElement>>;
  onCollapseKey: (languageBlockKey: string) => void;
  onExpandFocusSpanish: (languageBlockId: string) => void;
  onExpandFocusAnswer: (languageBlockId: string, answerIndex: number) => void;
  onMoveDragged: () => void;
  onDeleteLanguageBlock: (languageBlockId: string) => void;
  onAddLanguageBlock: (languageBlockId: string) => void;
  onSpanishChange: (languageBlockId: string, value: string) => void;
  onAnswerChange: (
    languageBlockId: string,
    answerIndex: number,
    value: string,
  ) => void;
  onAnswerAppend: (languageBlockId: string) => void;
  onAnswerRemove: (languageBlockId: string, answerIndex: number) => void;
  onCalloutAdd: (languageBlockId: string) => void;
  onCalloutChange: (languageBlockId: string, value: string) => void;
  onCalloutRemove: (languageBlockId: string) => void;
}) {
  const langScope = `${lessonId}::${block.id}`;
  const keyFor = (languageBlockId: string) =>
    `${lessonId}-${block.id}-${languageBlockId}`;

  function registerRef(
    refs: RefObject<Map<string, HTMLInputElement>>,
    key: string,
    element: HTMLInputElement | null,
  ) {
    if (element) {
      refs.current.set(key, element);
    } else {
      refs.current.delete(key);
    }
  }

  return (
    <div
      className={`order-2 mt-4 grid items-start gap-3 ${
        block.layout === "vocabulary_table"
          ? "grid-cols-1"
          : "grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))]"
      }`}
    >
      {block.languageBlocks.map((languageBlock, languageBlockIndex) => {
        const languageBlockKey = keyFor(languageBlock.id);
        const isLastLanguageBlock =
          languageBlockIndex === block.languageBlocks.length - 1;
        const previousLanguageBlock =
          block.languageBlocks[languageBlockIndex - 1];
        const dropPosition =
          drag.dropTarget?.scope === langScope &&
          drag.dropTarget.id === languageBlock.id
            ? drag.dropTarget.position
            : null;
        const isDragging =
          drag.dragged?.scope === langScope &&
          drag.dragged.id === languageBlock.id;

        return (
          <LanguageBlockEditor
            key={languageBlock.id}
            languageBlock={languageBlock}
            index={languageBlockIndex}
            isCollapsed={collapsedKeys.has(languageBlockKey)}
            hasPreviousBlock={Boolean(previousLanguageBlock)}
            dropPosition={dropPosition}
            isDragging={isDragging}
            onExpandFocusSpanish={() => onExpandFocusSpanish(languageBlock.id)}
            onCollapse={() => onCollapseKey(languageBlockKey)}
            onDelete={() => onDeleteLanguageBlock(languageBlock.id)}
            onDragStart={(event) =>
              drag.dragStart(event, langScope, languageBlock.id)
            }
            onDragEnd={drag.reset}
            onDragOver={(event) =>
              drag.dragOver(event, langScope, languageBlock.id)
            }
            onDrop={() => {
              onMoveDragged();
              drag.reset();
            }}
            registerSpanishRef={(element) =>
              registerRef(spanishRefs, keyFor(languageBlock.id), element)
            }
            onSpanishChange={(value) =>
              onSpanishChange(languageBlock.id, value)
            }
            onSpanishTabBackward={() => {
              if (previousLanguageBlock) {
                onExpandFocusAnswer(
                  previousLanguageBlock.id,
                  Math.max(
                    previousLanguageBlock.acceptedAnswers.length - 1,
                    0,
                  ),
                );
              }
            }}
            onSpanishTabForward={() => {
              answerRefs.current.get(`${keyFor(languageBlock.id)}-0`)?.focus();
            }}
            registerAnswerRef={(answerIndex, element) =>
              registerRef(
                answerRefs,
                `${keyFor(languageBlock.id)}-${answerIndex}`,
                element,
              )
            }
            onAnswerChange={(answerIndex, value) =>
              onAnswerChange(languageBlock.id, answerIndex, value)
            }
            onAnswerAppend={() => onAnswerAppend(languageBlock.id)}
            onAnswerRemove={(answerIndex) =>
              onAnswerRemove(languageBlock.id, answerIndex)
            }
            onAnswersTabForwardFromLast={() => {
              if (isLastLanguageBlock) {
                onAddLanguageBlock(createId("lang"));
              } else {
                const nextLanguageBlock =
                  block.languageBlocks[languageBlockIndex + 1];
                if (nextLanguageBlock) {
                  onExpandFocusSpanish(nextLanguageBlock.id);
                }
              }
            }}
            registerCalloutRef={(element) =>
              registerRef(calloutRefs, keyFor(languageBlock.id), element)
            }
            onCalloutAdd={() => onCalloutAdd(languageBlock.id)}
            onCalloutChange={(value) =>
              onCalloutChange(languageBlock.id, value)
            }
            onCalloutRemove={() => onCalloutRemove(languageBlock.id)}
          />
        );
      })}
      <button
        type="button"
        onClick={() => onAddLanguageBlock(createId("lang"))}
        aria-label="Add language block"
        title="Add language block"
        className="group flex min-h-44 items-center justify-center rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 text-stone-400 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-white shadow-sm transition group-hover:bg-blue-100">
          <Plus className="size-5" aria-hidden="true" />
        </span>
      </button>
    </div>
  );
}
