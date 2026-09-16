"use client";

import { Copy, GripVertical, Trash2, Undo2 } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type DragEvent } from "react";

import { LessonConceptsField } from "@/components/lesson-builder/lesson-concepts-field";
import { EditablePracticeMarkdown } from "@/components/lesson-builder/explanation-editor";
import { LessonScriptView } from "@/components/lesson-builder/lesson-script-view";
import { SentenceEditor } from "@/components/lesson-builder/sentence-editor";
import {
  SlideInsertControl,
  type DocumentBlockType,
} from "@/components/lesson-builder/slide-insert-control";
import { useLessonBuilder } from "@/lib/lesson-builder/builder-context";
import { extractLessonPairTerms } from "@/lib/lesson-builder/concept-suggestions";
import {
  activeBlockId,
  blockDataState,
  useLessonEditing,
  type EditingSelection,
} from "@/lib/lesson-builder/editing";
import { fieldSelectionForBlock, selectionForInsertion } from "@/lib/lesson-builder/keymap";
import { proposedPairsForBlock } from "@/lib/lesson-builder/pair-proposals";
import { useDragReorder } from "@/lib/lesson-builder/use-drag-reorder";
import type { Lesson, LessonBlock } from "@/lib/lesson-builder/types";

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
  const scriptOpen = editing.scriptViewLessonId === lessonId;

  useEffect(() => {
    function updateWidth() {
      setNarrowViewport(window.innerWidth < NEXT_SLIDE_CUE_MIN_WIDTH);
    }
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Ctrl+Alt+T reopen fix: script view replaces the whole block list with a
  // single textarea that isn't inside any `[data-document-block]` — only
  // the row's own `[data-lesson-row]`. So when it closes and DOM focus
  // falls back to <body>, lesson-library.tsx's `onFocusOut` (an
  // *unresolved* blur, since removing a focused node fires focusout with
  // no real `relatedTarget`) compares that row-level key against whatever
  // block/field was actually selected before script view opened — almost
  // always a mismatch — and collapses the shared selection to "none". With
  // no selection, the "lesson" scope (where Ctrl+Alt+T itself lives) is
  // unreachable, so the very same chord pressed again does nothing: a
  // silent, 100%-reproducible dead chord, not a rare race. Remembering the
  // pre-open selection and re-focusing it the instant the view closes
  // fires a real, resolved focus event that restores the correct
  // selection before the teacher's next keystroke.
  const preScriptSelectionRef = useRef<EditingSelection | null>(null);
  const wasScriptOpenRef = useRef(scriptOpen);
  useEffect(() => {
    const wasOpen = wasScriptOpenRef.current;
    if (scriptOpen && !wasOpen) {
      preScriptSelectionRef.current = editing.selection.kind === "none" ? null : editing.selection;
    } else if (!scriptOpen && wasOpen && preScriptSelectionRef.current) {
      const saved = preScriptSelectionRef.current;
      preScriptSelectionRef.current = null;
      // By now the shared selection may already have been stomped to
      // "none" (see the block comment above) — the affected block is
      // rendering in its non-editing "resting" presentation, which for a
      // field selection has no focusable element at all yet.
      // `setSelection` first (same two-step pattern `enterFromTitle` uses
      // for a just-created field) puts the block back into "editing" state
      // so the real field exists, then `focusSelection` can find and focus
      // it — a real, resolved focus event that fixes the selection for
      // good, before the teacher's next keystroke.
      editing.setSelection(saved);
      editing.focusSelection(saved);
    }
    wasScriptOpenRef.current = scriptOpen;
  }, [scriptOpen, editing]);

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
    // E3: the mouse chooser proposes pairs from the preceding explanation
    // the same way the keyboard path (Ctrl+Alt+Enter) does.
    const pairs = proposedPairsForBlock(props.lesson.blocks[index - 1], type);
    const { blockId, firstPieceId } = actions.addBlock(lessonId, type, index, pairs);
    closeInsert();
    const sel = selectionForInsertion(lessonId, blockId, type, pairs, firstPieceId);
    editing.setSelection(sel, { reason: "insert" });
    editing.focusSelection(sel);
    recordNextSlideUse();
  }

  // E3b mouse path — the seam's "Extend" choice, gated to seams whose
  // preceding block is a (non-table) sentence slide by `isExtendableSlide`
  // below; `afterBlockId` is null only when the seam is at index 0 (no
  // preceding block at all), which `isExtendableSlide` already excludes.
  function extend(afterBlockId: string | null) {
    const { blockId, languageBlockId } = actions.extendLastSentence(lessonId, afterBlockId);
    closeInsert();
    const sel = { kind: "field" as const, lessonId, blockId, field: "spanish" as const, pieceId: languageBlockId };
    editing.setSelection(sel, { reason: "insert" });
    editing.focusSelection(sel);
    recordNextSlideUse();
  }

  function isExtendableSlide(block: LessonBlock | undefined): boolean {
    return Boolean(block && block.type === "sentence" && block.layout !== "vocabulary_table");
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

  if (scriptOpen) {
    return (
      <div className="lesson-document">
        <LessonScriptView lesson={props.lesson} onClose={() => editing.setScriptView(null)} />
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
              canExtend={isExtendableSlide(props.lesson.blocks[index - 1])}
              onAdd={(type) => add(type, index)}
              onExtend={() => extend(props.lesson.blocks[index - 1]?.id ?? null)}
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
            canExtend={isExtendableSlide(props.lesson.blocks.at(-1))}
            onAdd={(type) => add(type, props.lesson.blocks.length)}
            onExtend={() => extend(props.lesson.blocks.at(-1)?.id ?? null)}
            onClose={closeInsert}
          />
          {props.lesson.blocks.length === 0 && (
            <button
              type="button"
              className="lesson-document-script-paste"
              onClick={() => editing.setScriptView(lessonId)}
            >
              Paste a script…
            </button>
          )}
        </div>

        <div className="lesson-document-tags">
          <LessonConceptsField
            variant="compact"
            label=""
            concepts={props.lesson.concepts}
            conceptDisplays={actions.conceptDisplays}
            onDisplayChange={actions.recordConceptDisplay}
            coversFor={lessonId}
            pairTerms={extractLessonPairTerms(props.lesson)}
            syllabusMarkers={actions.getSyllabusMarkers(lessonId)}
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
