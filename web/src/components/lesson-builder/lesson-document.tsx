"use client";

import { Copy, GripVertical, Trash2, Undo2 } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type DragEvent } from "react";

import { LessonConceptsField, type ConceptDisplayLookup } from "@/components/lesson-builder/lesson-concepts-field";
import { EditablePracticeMarkdown } from "@/components/lesson-builder/explanation-editor";
import { SentenceEditor } from "@/components/lesson-builder/sentence-editor";
import {
  SlideInsertControl,
  type DocumentBlockType,
} from "@/components/lesson-builder/slide-insert-control";
import { focusSlideWritingField } from "@/lib/lesson-builder/focus";
import { useDragReorder } from "@/lib/lesson-builder/use-drag-reorder";
import type { Lesson, LessonConcept } from "@/lib/lesson-builder/types";

export type { DocumentBlockType } from "@/components/lesson-builder/slide-insert-control";

type CaretOrigin =
  | { kind: "field"; el: HTMLInputElement | HTMLTextAreaElement; start: number; end: number }
  | { kind: "editable"; el: HTMLElement; textOffset: number }
  | { kind: "other"; el: HTMLElement };

// Caret position inside a contentEditable expressed as a character offset from
// its start, so it survives the field being re-rendered while the chooser is open.
function caretTextOffset(root: HTMLElement): number {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer)) return 0;
  const measure = range.cloneRange();
  measure.selectNodeContents(root);
  measure.setEnd(range.startContainer, range.startOffset);
  return measure.toString().length;
}

function setCaretAtOffset(root: HTMLElement, target: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let seen = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const length = node.textContent?.length ?? 0;
    if (seen + length >= target) {
      const range = document.createRange();
      range.setStart(node, Math.max(0, Math.min(length, target - seen)));
      range.collapse(true);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }
    seen += length;
  }
  const end = document.createRange();
  end.selectNodeContents(root);
  end.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(end);
}

type Props = {
  lesson: Lesson;
  conceptDisplays: ConceptDisplayLookup;
  undoDeletionLabel: string | null;
  onAddConcept: (concept: LessonConcept) => void;
  onRemoveConcept: (conceptId: string) => void;
  onRelabelConcept: (conceptId: string, label: string) => void;
  onUpdateExplanation: (blockId: string, markdown: string) => void;
  onUpdateSentence: (blockId: string, field: "promptText" | "helperText" | "answerFeedback", value: string | null) => void;
  onUpdateSpanish: (blockId: string, pieceId: string, value: string) => void;
  onUpdateAnswer: (blockId: string, pieceId: string, answerIndex: number, value: string) => void;
  onUpdateCallout: (blockId: string, pieceId: string, value: string | null) => void;
  onAddAnswer: (blockId: string, pieceId: string) => void;
  onRemoveAnswer: (blockId: string, pieceId: string, answerIndex: number) => void;
  onAddPiece: (blockId: string) => string;
  onDeletePiece: (blockId: string, pieceId: string) => void;
  onAddBlock: (type: DocumentBlockType, insertionIndex: number) => string;
  onDeleteBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: -1 | 1) => void;
  onReorderBlock: (draggedId: string, targetId: string, position: "before" | "after") => void;
  onDone: () => void;
  onAddLesson: () => void;
  onUndoDeletion: () => void;
  onEndHistoryGroup: () => void;
};

export function LessonDocument(props: Props) {
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const focusAfterAdd = useRef<string | null>(null);
  const caretOrigin = useRef<CaretOrigin | null>(null);
  const exitingBlock = useRef<string | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const drag = useDragReorder({ axis: "y", mode: "nested" });
  const dragScope = props.lesson.id;

  useEffect(() => {
    if (!focusAfterAdd.current) return;
    focusSlideWritingField(focusAfterAdd.current);
    focusAfterAdd.current = null;
  }, [props.lesson.blocks]);

  function captureCaretOrigin() {
    const el = document.activeElement;
    if (!(el instanceof HTMLElement)) { caretOrigin.current = null; return; }
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      caretOrigin.current = { kind: "field", el, start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
      return;
    }
    if (el.isContentEditable) {
      caretOrigin.current = { kind: "editable", el, textOffset: caretTextOffset(el) };
      return;
    }
    caretOrigin.current = { kind: "other", el };
  }

  function restoreCaretOrigin() {
    const origin = caretOrigin.current;
    caretOrigin.current = null;
    if (!origin || !document.contains(origin.el)) return;
    origin.el.focus();
    if (origin.kind === "field") {
      try { origin.el.setSelectionRange(origin.start, origin.end); } catch { /* unsupported input type */ }
      return;
    }
    if (origin.kind === "editable") {
      setCaretAtOffset(origin.el, origin.textOffset);
    }
  }

  function openInsert(index: number) {
    captureCaretOrigin();
    setInsertAt(index);
  }

  function closeInsert() {
    setInsertAt(null);
    restoreCaretOrigin();
  }

  // A click anywhere outside the open chooser (its trigger or its choices
  // popover) closes it — otherwise it stays open until Escape or a choice,
  // which reads as broken once a teacher clicks past it into another slide.
  useEffect(() => {
    if (insertAt === null) return;
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".lesson-document-insert")) return;
      setInsertAt(null);
      caretOrigin.current = null;
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [insertAt]);

  function add(type: DocumentBlockType, index: number) {
    caretOrigin.current = null;
    const blockId = props.onAddBlock(type, index);
    focusAfterAdd.current = blockId;
    setActiveBlock(blockId);
    setInsertAt(null);
  }

  function exitBlock(blockId: string) {
    exitingBlock.current = blockId;
    setActiveBlock(null);
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-document-block="${blockId}"]`)
        ?.focus({ preventScroll: true });
    });
  }

  // Ctrl/⌘+Enter moves to the direct insertion actions after the active slide.
  function openInsertAfterActive() {
    const index = props.lesson.blocks.findIndex((block) => block.id === activeBlock);
    openInsert(index >= 0 ? index + 1 : props.lesson.blocks.length);
  }

  // Upper-right icon cluster: drag handle, duplicate, delete — reveals on
  // slide hover or focus-within, not tied to entering editing. No text
  // labels in the flow; accessible names carry the slide number instead.
  function renderSlideActions(block: Lesson["blocks"][number], index: number) {
    return (
      <div className="lesson-document-block-actions">
        <button type="button" draggable aria-label={`Drag slide ${index + 1} to reorder`} title="Drag to reorder" onDragStart={(event) => drag.dragStart(event, dragScope, block.id)} onDragEnd={drag.reset}>
          <GripVertical size={13} aria-hidden="true" />
        </button>
        <button type="button" aria-label={`Duplicate slide ${index + 1}`} title="Duplicate slide" onClick={() => props.onDuplicateBlock(block.id)}>
          <Copy size={13} aria-hidden="true" />
        </button>
        <button type="button" className="danger" aria-label={`Delete slide ${index + 1}`} title="Delete slide" onClick={() => props.onDeleteBlock(block.id)}>
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
    );
  }


  return (
    <div className="lesson-document">
      <div
        ref={bodyRef}
        className="lesson-document-body"
        onBlurCapture={(event) => {
          props.onEndHistoryGroup();
          const next = event.relatedTarget;
          if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
            requestAnimationFrame(() => {
              const focused = document.activeElement;
              if (!focused || !bodyRef.current?.contains(focused)) setActiveBlock(null);
            });
          }
        }}
        onKeyDown={(event) => {
          // Ctrl+Alt, not Alt alone: plain Alt+letter is commonly grabbed by
          // Linux window managers (app-launch/switch binds) before the page
          // ever sees the keydown, and Ctrl+letter alone collides with the
          // browser (save, history, address bar, paste…) — Ctrl+Alt is free
          // of both in practice. event.code, not event.key, so Mac
          // Ctrl+Option+letter (which composes ´å∂…) still resolves.
          if (!event.altKey || !event.ctrlKey || event.metaKey || event.nativeEvent.isComposing || event.defaultPrevented) return;
          const at = () => {
            const i = props.lesson.blocks.findIndex((block) => block.id === activeBlock);
            return i >= 0 ? i + 1 : props.lesson.blocks.length;
          };
          const stop = () => { event.preventDefault(); event.stopPropagation(); };
          if (event.code === "Enter" || event.code === "NumpadEnter") {
            if (event.shiftKey) { stop(); props.onDone(); }
            else if (insertAt === null) { stop(); openInsertAfterActive(); }
          } else if (event.shiftKey) {
            return;
          } else if (event.code === "Digit1") {
            stop(); add("explanation", at());
          } else if (event.code === "Digit2") {
            stop(); add("sentence", at());
          } else if (event.code === "Digit3") {
            stop(); add("vocabulary", at());
          } else if (event.code === "KeyD") {
            stop(); props.onDone();
          } else if (event.code === "KeyL") {
            stop(); props.onAddLesson();
          } else if (event.code === "ArrowUp" && activeBlock) {
            stop(); props.onMoveBlock(activeBlock, -1);
          } else if (event.code === "ArrowDown" && activeBlock) {
            stop(); props.onMoveBlock(activeBlock, 1);
          }
        }}
      >
        {props.lesson.blocks.map((block, index) => (
          <Fragment key={block.id}>
            <SlideInsertControl
              insertionLabel={`Insert before slide ${index + 1}`}
              focusPalette={insertAt === index}
              onAdd={(type) => add(type, index)}
              onClose={closeInsert}
            />
            <div
              className={`lesson-document-block${drag.dragged?.id === block.id ? " dragging" : ""}${
                drag.dropTarget?.id === block.id ? ` drop-${drag.dropTarget.position}` : ""
              }`}
              data-document-block={block.id}
              data-active={activeBlock === block.id ? "true" : "false"}
              tabIndex={activeBlock === block.id ? -1 : 0}
              onFocusCapture={(event) => {
                if (event.target === event.currentTarget && exitingBlock.current === block.id) {
                  exitingBlock.current = null;
                  return;
                }
                setActiveBlock(block.id);
              }}
              onClick={(event) => {
                if (activeBlock === block.id) return;
                if ((event.target as HTMLElement).closest("button, input, textarea, [contenteditable='true']")) return;
                setActiveBlock(block.id);
                requestAnimationFrame(() => focusSlideWritingField(block.id));
              }}
              onDragOver={(event) => drag.dragOver(event, dragScope, block.id)}
              onDrop={(event) => {
                if (!drag.dragged) return;
                event.preventDefault();
                event.stopPropagation();
                if (drag.dragged && drag.dropTarget && drag.dragged.id !== drag.dropTarget.id) {
                  props.onReorderBlock(drag.dragged.id, drag.dropTarget.id, drag.dropTarget.position);
                }
                drag.reset();
              }}
              onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  setActiveBlock(block.id);
                  requestAnimationFrame(() => focusSlideWritingField(block.id));
                  return;
                }
                if (event.key === "Escape" && event.target !== event.currentTarget) {
                  event.preventDefault();
                  event.stopPropagation();
                  exitBlock(block.id);
                }
              }}
            >
            {renderSlideActions(block, index)}
            {block.type === "explanation" ? (
              <section className="lesson-document-explanation" aria-label={`Explanation ${index + 1}`}>
                <EditablePracticeMarkdown
                  markdown={block.contentMarkdown}
                  placeholder="Write your explanation…"
                  ariaLabel={`Explanation ${index + 1}`}
                  fieldName={`explanation-${block.id}`}
                  variant="document"
                  onExit={() => exitBlock(block.id)}
                  onChange={(markdown) => props.onUpdateExplanation(block.id, markdown)}
                />
              </section>
            ) : (
              <SentenceEditor
                block={block}
                active={activeBlock === block.id}
                onActivate={() => setActiveBlock(block.id)}
                onExit={() => exitBlock(block.id)}
                onUpdateSentence={(field, value) => props.onUpdateSentence(block.id, field, value)}
                onUpdateSpanish={(pieceId, value) => props.onUpdateSpanish(block.id, pieceId, value)}
                onUpdateAnswer={(pieceId, answerIndex, value) => props.onUpdateAnswer(block.id, pieceId, answerIndex, value)}
                onUpdateCallout={(pieceId, value) => props.onUpdateCallout(block.id, pieceId, value)}
                onAddAnswer={(pieceId) => props.onAddAnswer(block.id, pieceId)}
                onRemoveAnswer={(pieceId, answerIndex) => props.onRemoveAnswer(block.id, pieceId, answerIndex)}
                onAddPiece={() => props.onAddPiece(block.id)}
                onDeletePiece={(pieceId) => props.onDeletePiece(block.id, pieceId)}
              />
            )}
            </div>
          </Fragment>
        ))}

        <div className="lesson-document-tail">
          <SlideInsertControl
            insertionLabel="Insert at lesson end"
            labelled={props.lesson.blocks.length === 0}
            focusPalette={insertAt === props.lesson.blocks.length}
            onAdd={(type) => add(type, props.lesson.blocks.length)}
            onClose={closeInsert}
          />
        </div>

        <div className="lesson-document-tags">
          <LessonConceptsField
            variant="compact"
            label=""
            concepts={props.lesson.concepts}
            conceptDisplays={props.conceptDisplays}
            coversFor={props.lesson.id}
            onAdd={props.onAddConcept}
            onRemove={props.onRemoveConcept}
            onRelabel={props.onRelabelConcept}
          />
        </div>

        {props.undoDeletionLabel && (
          <button type="button" className="lesson-document-undo" onClick={props.onUndoDeletion}>
            <Undo2 size={14} /> {props.undoDeletionLabel} — Undo
          </button>
        )}
      </div>
    </div>
  );
}

export function LessonDragHandle({ lessonNumber, onDragStart, onDragEnd }: { lessonNumber: number; onDragStart: (event: DragEvent<HTMLButtonElement>) => void; onDragEnd: () => void }) {
  return (
    <button type="button" draggable onDragStart={onDragStart} onDragEnd={onDragEnd} className="lesson-document-drag lesson-library-number" aria-label={`Drag lesson ${lessonNumber} to reorder`} title="Drag to reorder lesson">
      <GripVertical size={16} aria-hidden="true" />
    </button>
  );
}
