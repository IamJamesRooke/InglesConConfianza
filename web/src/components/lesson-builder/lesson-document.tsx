"use client";

import { GripVertical, Undo2 } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";

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
  const [insertChoice, setInsertChoice] = useState(0);
  // The chooser only grabs focus when the teacher opened it (Ctrl/⌘+Enter or the
  // "+" button). The one shown on an empty lesson must not pull focus off the
  // title.
  const [insertFocus, setInsertFocus] = useState(false);
  const focusAfterAdd = useRef<string | null>(null);
  const caretOrigin = useRef<CaretOrigin | null>(null);
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

  function recommendedChoice(index: number) {
    const previous = props.lesson.blocks[index - 1];
    return previous?.type === "explanation" ? 1 : 0;
  }

  function openInsert(index: number) {
    captureCaretOrigin();
    setInsertChoice(recommendedChoice(index));
    setInsertAt(index);
    setInsertFocus(true);
  }

  function closeInsert() {
    setInsertAt(null);
    setInsertFocus(false);
    restoreCaretOrigin();
  }

  function add(type: DocumentBlockType, index: number) {
    caretOrigin.current = null;
    focusAfterAdd.current = props.onAddBlock(type, index);
    setInsertAt(null);
    setInsertFocus(false);
  }

  // Ctrl/⌘+Enter: open the slide chooser after the active slide.
  function openInsertAfterActive() {
    const index = props.lesson.blocks.findIndex((block) => block.id === activeBlock);
    openInsert(index >= 0 ? index + 1 : props.lesson.blocks.length);
  }


  return (
    <div className="lesson-document">
      <div
        className="lesson-document-body"
        onBlurCapture={props.onEndHistoryGroup}
        onKeyDown={(event) => {
          // Alt-based, so nothing collides with browser Ctrl/⌘ shortcuts (save,
          // history, address bar, paste…). event.code, not event.key, so Mac
          // Option+letter (which composes ´å∂…) still resolves.
          if (!event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing || event.defaultPrevented) return;
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
          }
        }}
      >
        {props.lesson.blocks.map((block, index) => (
          <div
            key={block.id}
            className={`lesson-document-block${drag.dragged?.id === block.id ? " dragging" : ""}${
              drag.dropTarget?.id === block.id ? ` drop-${drag.dropTarget.position}` : ""
            }`}
            data-document-block={block.id}
            tabIndex={-1}
            onFocusCapture={() => setActiveBlock(block.id)}
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
            onKeyDownCapture={(event) => {
              if (event.key !== "Escape" || event.target === event.currentTarget) return;
              // Let nested controls and the explanation editor handle Escape.
              if (insertAt === index || (event.target as HTMLElement).closest?.(".lesson-document-insert-choices")) return;
              if ((event.target as HTMLElement).closest?.(".authoring-wysiwyg")) return;
              event.preventDefault();
              event.stopPropagation();
              const actions = event.currentTarget.querySelector<HTMLElement>(".lesson-document-block-chrome summary");
              (actions ?? event.currentTarget).focus();
            }}
          >
            <SlideInsertControl
              open={insertAt === index}
              autoFocusOnOpen={insertFocus}
              selected={insertChoice}
              onSelected={setInsertChoice}
              onToggle={() => insertAt === index ? closeInsert() : openInsert(index)}
              onAdd={(type) => add(type, index)}
              onClose={closeInsert}
            />

            {block.type === "explanation" ? (
              <section className="lesson-document-explanation" aria-label={`Explanation ${index + 1}`}>
                <EditablePracticeMarkdown
                  markdown={block.contentMarkdown}
                  placeholder="Write your explanation…"
                  ariaLabel={`Explanation ${index + 1}`}
                  fieldName={`explanation-${block.id}`}
                  variant="document"
                  onChange={(markdown) => props.onUpdateExplanation(block.id, markdown)}
                />
              </section>
            ) : (
              <SentenceEditor
                block={block}
                active={activeBlock === block.id}
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


            <div className="lesson-document-block-chrome">
              <details className="lesson-actions">
                <summary aria-label={`Actions for slide ${index + 1}`}>Actions</summary>
                <div className="lesson-actions-menu">
                  <button type="button" disabled={index === 0} onClick={() => props.onMoveBlock(block.id, -1)}>Move slide earlier</button>
                  <button type="button" disabled={index === props.lesson.blocks.length - 1} onClick={() => props.onMoveBlock(block.id, 1)}>Move slide later</button>
                  <button type="button" onClick={() => props.onDuplicateBlock(block.id)}>Duplicate slide</button>
                  <button type="button" className="danger" onClick={() => props.onDeleteBlock(block.id)}>Delete slide</button>
                  <button type="button" className="lesson-document-block-handle" draggable aria-label={`Drag slide ${index + 1} to reorder`} onDragStart={(event) => drag.dragStart(event, dragScope, block.id)} onDragEnd={drag.reset}><GripVertical size={13} /> Drag to reorder</button>
                </div>
              </details>
            </div>
          </div>
        ))}

        <div className="lesson-document-tail">
          <SlideInsertControl
            open={insertAt === props.lesson.blocks.length}
            inline={props.lesson.blocks.length === 0}
            label="Add slide"
            autoFocusOnOpen={props.lesson.blocks.length === 0 ? false : insertFocus}
            selected={insertChoice}
            onSelected={setInsertChoice}
            onToggle={() => insertAt === props.lesson.blocks.length ? closeInsert() : openInsert(props.lesson.blocks.length)}
            onAdd={(type) => add(type, props.lesson.blocks.length)}
            onClose={closeInsert}
          />
        </div>

        <div className="lesson-document-tags">
          <LessonConceptsField
            variant="compact"
            label="Covers"
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
