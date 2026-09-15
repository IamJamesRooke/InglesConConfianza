"use client";

import { Copy, GripVertical, Trash2, Undo2 } from "lucide-react";
import { Fragment, useEffect, useState, type DragEvent } from "react";

import { LessonConceptsField } from "@/components/lesson-builder/lesson-concepts-field";
import { EditablePracticeMarkdown } from "@/components/lesson-builder/explanation-editor";
import { SentenceEditor } from "@/components/lesson-builder/sentence-editor";
import {
  SlideInsertControl,
  type DocumentBlockType,
} from "@/components/lesson-builder/slide-insert-control";
import { useLessonBuilder } from "@/lib/lesson-builder/builder-context";
import { activeBlockId, blockDataState, useLessonEditing } from "@/lib/lesson-builder/editing";
import { fieldSelectionForBlock, selectionForNewBlock } from "@/lib/lesson-builder/keymap";
import { useDragReorder } from "@/lib/lesson-builder/use-drag-reorder";
import type { Lesson } from "@/lib/lesson-builder/types";

export type { DocumentBlockType } from "@/components/lesson-builder/slide-insert-control";

type Props = { lesson: Lesson };

// Learnability: the inline "next slide" cue (§1c) fades away once a teacher
// has clearly learned the chord, and never shows on narrow viewports where
// there's no room for it.
const NEXT_SLIDE_USES_KEY = "lesson-builder:next-slide-uses";
const NEXT_SLIDE_CUE_MAX_USES = 5;
const NEXT_SLIDE_CUE_MIN_WIDTH = 700;

function readNextSlideUses(): number {
  try {
    return Number(window.localStorage.getItem(NEXT_SLIDE_USES_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function LessonDocument(props: Props) {
  const actions = useLessonBuilder();
  const editing = useLessonEditing();
  const lessonId = props.lesson.id;
  const [nextSlideUses, setNextSlideUses] = useState(readNextSlideUses);
  const [narrowViewport, setNarrowViewport] = useState(
    () => typeof window !== "undefined" && window.innerWidth < NEXT_SLIDE_CUE_MIN_WIDTH,
  );
  const drag = useDragReorder({ axis: "y", mode: "nested" });
  const dragScope = lessonId;
  const undoDeletionLabel =
    actions.deletionUndo?.lessonId === lessonId ? actions.deletionUndo.label : null;
  const activeId = activeBlockId(editing.selection);
  const activeBlockIndex = props.lesson.blocks.findIndex((block) => block.id === activeId);
  const showNextSlideCue = nextSlideUses < NEXT_SLIDE_CUE_MAX_USES && !narrowViewport;
  // Mouse-chooser seam state — `insertAfter` (§1) is the store's own field
  // for it; the keyboard path (Ctrl+Alt+Enter) never touches this at all.
  const insertAt =
    editing.insertAfter?.lessonId === lessonId ? editing.insertAfter.index : null;

  useEffect(() => {
    function updateWidth() {
      setNarrowViewport(window.innerWidth < NEXT_SLIDE_CUE_MIN_WIDTH);
    }
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  function recordNextSlideUse() {
    setNextSlideUses((count) => {
      const next = count + 1;
      try {
        window.localStorage.setItem(NEXT_SLIDE_USES_KEY, String(next));
      } catch {
        /* storage unavailable (private mode, quota) — cue just won't fade */
      }
      return next;
    });
  }

  function closeInsert() {
    editing.setInsertAfter(null);
  }

  // A click anywhere outside the open chooser (its trigger or its choices
  // popover) closes it — otherwise it stays open until Escape or a choice.
  useEffect(() => {
    if (insertAt === null) return;
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".lesson-document-insert")) return;
      closeInsert();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insertAt]);

  function add(type: DocumentBlockType, index: number) {
    const blockId = actions.addBlock(lessonId, type, index);
    closeInsert();
    const sel = selectionForNewBlock(lessonId, blockId, type);
    editing.setSelection(sel, { reason: "insert" });
    editing.focusSelection(sel);
    recordNextSlideUse();
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
        <button type="button" aria-label={`Duplicate slide ${index + 1}`} title="Duplicate slide" onClick={() => actions.duplicateBlock(lessonId, block.id)}>
          <Copy size={13} aria-hidden="true" />
        </button>
        <button type="button" className="danger" aria-label={`Delete slide ${index + 1}`} title="Delete slide" onClick={() => actions.deleteBlock(lessonId, block.id)}>
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="lesson-document">
      <div className="lesson-document-body">
        {props.lesson.blocks.map((block, index) => (
          <Fragment key={block.id}>
            <SlideInsertControl
              insertionLabel={`Insert before slide ${index + 1}`}
              focusPalette={insertAt === index}
              afterActive={activeBlockIndex >= 0 && index === activeBlockIndex + 1}
              showNextSlideCue={showNextSlideCue && insertAt === null}
              onAdd={(type) => add(type, index)}
              onClose={closeInsert}
            />
            <div
              className={`lesson-document-block${drag.dragged?.id === block.id ? " dragging" : ""}${
                drag.dropTarget?.id === block.id ? ` drop-${drag.dropTarget.position}` : ""
              }`}
              data-document-block={block.id}
              data-state={blockDataState(editing.selection, block.id)}
              tabIndex={activeId === block.id ? -1 : 0}
              onFocus={(event) => {
                if (event.target !== event.currentTarget) return;
                editing.setSelection({ kind: "block", lessonId, blockId: block.id });
              }}
              onClick={(event) => {
                // Guards against re-triggering when a field *within* this
                // block already has focus (e.g. the mousedown that preceded
                // this click landed straight on a textarea) — but a plain
                // click on a resting slide's own wrapper can itself have
                // already become `{kind:"block"}` a moment earlier (the
                // browser natively focuses the nearest focusable ancestor
                // on mousedown when the click target isn't itself
                // focusable, which fires this wrapper's own onFocus first).
                // Only a genuine field selection for this block should
                // suppress the jump-into-editing below.
                if (
                  editing.selection.kind === "field" &&
                  editing.selection.blockId === block.id
                ) {
                  return;
                }
                if ((event.target as HTMLElement).closest("button, input, textarea, [contenteditable='true']")) return;
                const sel = fieldSelectionForBlock(lessonId, block);
                editing.setSelection(sel);
                editing.focusSelection(sel);
              }}
              onDragOver={(event) => drag.dragOver(event, dragScope, block.id)}
              onDrop={(event) => {
                if (!drag.dragged) return;
                event.preventDefault();
                event.stopPropagation();
                if (drag.dragged && drag.dropTarget && drag.dragged.id !== drag.dropTarget.id) {
                  actions.reorderBlock(lessonId, drag.dragged.id, drag.dropTarget.id, drag.dropTarget.position);
                }
                drag.reset();
              }}
            >
            {renderSlideActions(block, index)}
            {block.type === "explanation" ? (
              <section className="lesson-document-explanation" aria-label={`Explanation ${index + 1}`}>
                <EditablePracticeMarkdown
                  blockId={block.id}
                  markdown={block.contentMarkdown}
                  placeholder="Write your explanation…"
                  ariaLabel={`Explanation ${index + 1}`}
                  fieldName={`explanation-${block.id}`}
                  variant="document"
                  onFocus={() =>
                    editing.setSelection({ kind: "field", lessonId, blockId: block.id, field: "explanation" })
                  }
                  onChange={(markdown) => actions.updateExplanation(lessonId, block.id, markdown)}
                />
              </section>
            ) : (
              <SentenceEditor lessonId={lessonId} block={block} />
            )}
            </div>
          </Fragment>
        ))}

        <div className="lesson-document-tail">
          <SlideInsertControl
            insertionLabel="Insert at lesson end"
            labelled={props.lesson.blocks.length === 0}
            focusPalette={insertAt === props.lesson.blocks.length}
            afterActive={activeBlockIndex === props.lesson.blocks.length - 1 && activeBlockIndex >= 0}
            showNextSlideCue={showNextSlideCue && insertAt === null}
            onAdd={(type) => add(type, props.lesson.blocks.length)}
            onClose={closeInsert}
          />
        </div>

        <div className="lesson-document-tags">
          <LessonConceptsField
            variant="compact"
            label=""
            concepts={props.lesson.concepts}
            conceptDisplays={actions.conceptDisplays}
            coversFor={lessonId}
            onAdd={(concept) => actions.addLessonConcept(lessonId, concept)}
            onRemove={(id) => actions.removeLessonConcept(lessonId, id)}
            onRelabel={(id, label) => actions.relabelLessonConcept(lessonId, id, label)}
          />
        </div>

        {undoDeletionLabel && (
          <button type="button" className="lesson-document-undo" onClick={actions.undoDeletion}>
            <Undo2 size={14} /> {undoDeletionLabel} — Undo
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
