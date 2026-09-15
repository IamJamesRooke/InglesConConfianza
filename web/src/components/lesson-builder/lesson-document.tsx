"use client";

import { Copy, GripVertical, Trash2, Undo2 } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type DragEvent } from "react";

import { LessonConceptsField } from "@/components/lesson-builder/lesson-concepts-field";
import { EditablePracticeMarkdown } from "@/components/lesson-builder/explanation-editor";
import { SentenceEditor } from "@/components/lesson-builder/sentence-editor";
import {
  SlideInsertControl,
  type DocumentBlockType,
} from "@/components/lesson-builder/slide-insert-control";
import { useLessonBuilder } from "@/lib/lesson-builder/builder-context";
import { focusSlideWritingField } from "@/lib/lesson-builder/focus";
import { useDragReorder } from "@/lib/lesson-builder/use-drag-reorder";
import type { Lesson } from "@/lib/lesson-builder/types";

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
  onDone: () => void;
  // Set for exactly one render — the one where this lesson just opened via
  // Enter on its (previously collapsed) title (item 8) — so the very first
  // Enter always jumps into writing, whether the lesson was already open or
  // not. Resolved once the document has actually mounted (so its slides
  // exist in the DOM to focus), then reported back via
  // `onFocusOnMountHandled` so the caller can clear its one-shot ref.
  focusOnMount?: boolean;
  onFocusOnMountHandled?: () => void;
};

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
  const lessonId = props.lesson.id;
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [nextSlideUses, setNextSlideUses] = useState(readNextSlideUses);
  const [narrowViewport, setNarrowViewport] = useState(
    () => typeof window !== "undefined" && window.innerWidth < NEXT_SLIDE_CUE_MIN_WIDTH,
  );
  const focusAfterAdd = useRef<string | null>(null);
  const caretOrigin = useRef<CaretOrigin | null>(null);
  const exitingBlock = useRef<string | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const drag = useDragReorder({ axis: "y", mode: "nested" });
  const dragScope = lessonId;
  const undoDeletionLabel =
    actions.deletionUndo?.lessonId === lessonId ? actions.deletionUndo.label : null;
  // Drives which single seam shows its "+" signpost at rest (§5, item A) —
  // the one immediately after the active slide. That same seam also carries
  // the "next slide · Ctrl Alt Enter" cue text (round 2, item 2): rendered
  // by SlideInsertControl itself, not here, so it lives on the seam's own
  // hairline instead of overlapping the following slide's content.
  const activeBlockIndex = props.lesson.blocks.findIndex((block) => block.id === activeBlock);
  const showNextSlideCue =
    nextSlideUses < NEXT_SLIDE_CUE_MAX_USES && !narrowViewport;

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

  useEffect(() => {
    if (!focusAfterAdd.current) return;
    focusSlideWritingField(focusAfterAdd.current);
    focusAfterAdd.current = null;
  }, [props.lesson.blocks]);

  // Mount-only: a lesson that just opened via Enter-on-title (item 8) jumps
  // straight into writing, same as a brand-new lesson.
  useEffect(() => {
    if (!props.focusOnMount) return;
    const first = props.lesson.blocks[0];
    focusSlideWritingField(
      first ? first.id : actions.addBlock(lessonId, "explanation", 0),
    );
    props.onFocusOnMountHandled?.();
    // Runs once, on mount, deliberately — this is a one-shot reaction to how
    // the lesson was opened, not to any prop that changes afterward.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const blockId = actions.addBlock(lessonId, type, index);
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
  // `activeBlock` is only set while DOM focus sits *inside* a slide's field —
  // Escape (or a click on the block wrapper itself) moves focus onto the
  // wrapper and clears it, so falling back to `activeBlock` alone silently
  // targeted nothing. Resolve the slide from wherever focus actually is.
  function resolveTargetBlockId(target: EventTarget | null): string | null {
    if (activeBlock) return activeBlock;
    const el = target instanceof HTMLElement ? target : null;
    return el?.closest<HTMLElement>("[data-document-block]")?.dataset.documentBlock ?? null;
  }

  function openInsertAfterActive(target: EventTarget | null) {
    const targetBlockId = resolveTargetBlockId(target);
    const index = props.lesson.blocks.findIndex((block) => block.id === targetBlockId);
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
      <div
        ref={bodyRef}
        className="lesson-document-body"
        onBlurCapture={(event) => {
          actions.endHistoryGroup();
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
          const stop = () => { event.preventDefault(); event.stopPropagation(); };
          if (event.code === "Enter" || event.code === "NumpadEnter") {
            if (!event.shiftKey && insertAt === null) {
              stop();
              openInsertAfterActive(event.target);
              recordNextSlideUse();
            }
          } else if (event.shiftKey) {
            return;
          } else if (event.code === "KeyD") {
            stop(); props.onDone();
          } else if (event.code === "ArrowUp" && activeBlock) {
            stop(); actions.moveBlock(lessonId, activeBlock, -1);
          } else if (event.code === "ArrowDown" && activeBlock) {
            stop(); actions.moveBlock(lessonId, activeBlock, 1);
          }
        }}
      >
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
                  actions.reorderBlock(lessonId, drag.dragged.id, drag.dropTarget.id, drag.dropTarget.position);
                }
                drag.reset();
              }}
              onKeyDown={(event) => {
                // Plain Enter/Space enters editing — but Ctrl+Alt+Enter is a
                // different, more specific shortcut (open the insert
                // chooser, handled by the document-body handler below) and
                // must not be swallowed here. This exact collision was why
                // Ctrl+Alt+Enter silently failed right after Escape: DOM
                // focus lands on this wrapper, `event.key` is still "Enter"
                // regardless of modifiers, so this branch used to fire
                // first, call `preventDefault()`, and refocus the writing
                // field — leaving the body handler's `defaultPrevented`
                // guard nothing to do.
                if (
                  event.target === event.currentTarget &&
                  (event.key === "Enter" || event.key === " ") &&
                  !event.ctrlKey &&
                  !event.altKey &&
                  !event.metaKey
                ) {
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
                  onChange={(markdown, options) => actions.updateExplanation(lessonId, block.id, markdown, options)}
                  onUndo={() => actions.editorUndo(lessonId, block.id)}
                  onRedo={() => actions.editorRedo(lessonId, block.id)}
                />
              </section>
            ) : (
              <SentenceEditor
                lessonId={lessonId}
                block={block}
                active={activeBlock === block.id}
                onActivate={() => setActiveBlock(block.id)}
                onExit={() => exitBlock(block.id)}
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
