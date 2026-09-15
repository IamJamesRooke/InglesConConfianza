"use client";

import { ChevronDown, ChevronRight, Play, Plus } from "lucide-react";
import { memo, useEffect, useRef, type DragEvent } from "react";

import {
  LessonDocument,
  LessonDragHandle,
} from "@/components/lesson-builder/lesson-document";
import { LessonHeaderActions } from "@/components/lesson-builder/lesson-header-actions";
import { useLessonEditing } from "@/lib/lesson-builder/editing";
import type { LessonBuilderActions } from "@/lib/lesson-builder/builder-context";
import type { Lesson } from "@/lib/lesson-builder/types";

type Props = {
  lesson: Lesson;
  lessonIndex: number;
  moduleId: string;
  isOpen: boolean;
  isDragged: boolean;
  dragInProgress: boolean;
  confirmingDelete: boolean;
  builder: LessonBuilderActions;
  onToggle: (lessonId: string) => void;
  onFlushSave: () => void;
  onStartDrag: (
    event: DragEvent<HTMLButtonElement>,
    moduleId: string,
    lessonId: string,
  ) => void;
  onDragEnd: () => void;
  onDrop: (
    event: DragEvent<HTMLElement>,
    moduleId: string,
    targetIndex: number,
    usePointer?: boolean,
  ) => void;
  onStartLessonAt: (moduleId: string, insertionIndex?: number) => void;
  onRequestDeleteConfirm: (key: string) => void;
  onCancelDeleteConfirm: () => void;
};

// One lesson row (compact head + its inline document when open). Memoized
// so that typing inside one lesson does not force every *other* row in the
// active module to re-render on each keystroke.
function LessonRowImpl({
  lesson,
  lessonIndex,
  moduleId,
  isOpen,
  isDragged,
  dragInProgress,
  confirmingDelete,
  builder,
  onToggle,
  onFlushSave,
  onStartDrag,
  onDragEnd,
  onDrop,
  onStartLessonAt,
  onRequestDeleteConfirm,
  onCancelDeleteConfirm,
}: Props) {
  const editing = useLessonEditing();
  const lessonDeleteKey = `lesson:${lesson.id}`;
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  // Whichever path opened the confirm (Ctrl+Alt+Backspace on the title, or
  // the mouse trigger icon), focus lands on Delete once it renders.
  useEffect(() => {
    if (confirmingDelete) confirmButtonRef.current?.focus();
  }, [confirmingDelete]);

  return (
    <>
      <div className="lesson-library-insert">
        <button
          type="button"
          aria-label="Add lesson here"
          onClick={() => onStartLessonAt(moduleId, lessonIndex)}
        >
          <Plus size={11} aria-hidden="true" />
          <span className="lesson-library-insert-label">Add lesson</span>
        </button>
      </div>
      <article
        data-lesson-row={lesson.id}
        className={`lesson-library-row ${isDragged ? "dragging" : ""}`}
        onDragOver={(event) => {
          if (dragInProgress) event.preventDefault();
        }}
        onDrop={(event) => onDrop(event, moduleId, lessonIndex, true)}
        onBlurCapture={(event) => {
          // Item 9: flush any pending idle-debounced save the moment focus
          // actually leaves this lesson's row.
          const next = event.relatedTarget;
          if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
            onFlushSave();
          }
        }}
      >
        <div className="lesson-library-row-head">
          <LessonDragHandle
            lessonNumber={lessonIndex + 1}
            onDragStart={(event) => onStartDrag(event, moduleId, lesson.id)}
            onDragEnd={onDragEnd}
          />
          <button
            type="button"
            className="lesson-library-collapse"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Collapse lesson" : "Expand lesson"}
            onClick={() => onToggle(lesson.id)}
          >
            {isOpen ? (
              <ChevronDown size={16} aria-hidden="true" />
            ) : (
              <ChevronRight size={16} aria-hidden="true" />
            )}
          </button>
          <input
            ref={titleRef}
            data-lesson-title={lesson.id}
            className="lesson-library-title-input"
            value={lesson.name ?? ""}
            onChange={(event) => builder.renameLesson(lesson.id, event.target.value)}
            onFocus={() => editing.setSelection({ kind: "title", lessonId: lesson.id })}
            onBlur={builder.endHistoryGroup}
            placeholder="Name this lesson…"
            aria-label={`Lesson ${lessonIndex + 1} title`}
          />
          {confirmingDelete ? (
            <span
              className="lesson-library-row-icons lesson-inline-confirm"
              onKeyDown={(event) => {
                // Escape here is a nested-tool close, not a builder chord —
                // stays local (it's not part of KEYMAP's scope model, which
                // has no notion of "confirm dialog").
                if (event.key !== "Escape" || event.nativeEvent.isComposing) return;
                event.preventDefault();
                onCancelDeleteConfirm();
                titleRef.current?.focus();
              }}
            >
              <span>Delete lesson?</span>
              <button
                type="button"
                className="danger"
                ref={confirmButtonRef}
                onClick={() => {
                  builder.deleteLesson(lesson.id);
                  onCancelDeleteConfirm();
                }}
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => {
                  onCancelDeleteConfirm();
                  titleRef.current?.focus();
                }}
              >
                Cancel
              </button>
            </span>
          ) : (
            <span className="lesson-library-row-icons">
              <button
                type="button"
                className="lesson-library-try"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => builder.previewLesson(lesson.id)}
                aria-label="Preview lesson"
                title="Preview lesson"
              >
                <Play size={14} aria-hidden="true" />
              </button>
              <LessonHeaderActions
                lessonId={lesson.id}
                lessonName={lesson.name?.trim() || "Untitled lesson"}
                onDuplicate={() => builder.duplicateLesson(lesson.id)}
                onRequestDelete={() => onRequestDeleteConfirm(lessonDeleteKey)}
              />
            </span>
          )}
        </div>
        {isOpen && <LessonDocument lesson={lesson} />}
      </article>
    </>
  );
}

export const LessonRow = memo(LessonRowImpl);
