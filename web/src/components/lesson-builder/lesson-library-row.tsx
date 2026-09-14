"use client";

import { ChevronDown, ChevronRight, Play, Plus } from "lucide-react";
import { memo, type DragEvent } from "react";

import {
  LessonDocument,
  LessonDragHandle,
} from "@/components/lesson-builder/lesson-document";
import { LessonHeaderActions } from "@/components/lesson-builder/lesson-header-actions";
import { focusSlideWritingField } from "@/lib/lesson-builder/focus";
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
  onCollapse: (lessonId: string) => void;
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
// so that typing inside one lesson — which replaces only that lesson's
// object in the `lessons` array (see `mapLesson` in mutations.ts) — does
// not force every *other* row in the active module to re-render on each
// keystroke. All callback props above are expected to be stable identities
// across a typing session (see LessonLibrary's useCallback wrapping); only
// `lesson`, `isOpen`, `isDragged`, `dragInProgress`, and `confirmingDelete`
// are expected to actually change during authoring.
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
  onCollapse,
  onStartDrag,
  onDragEnd,
  onDrop,
  onStartLessonAt,
  onRequestDeleteConfirm,
  onCancelDeleteConfirm,
}: Props) {
  const lessonDeleteKey = `lesson:${lesson.id}`;

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
            data-lesson-title={lesson.id}
            className="lesson-library-title-input"
            value={lesson.name ?? ""}
            onChange={(event) => builder.renameLesson(lesson.id, event.target.value)}
            onBlur={builder.endHistoryGroup}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
              event.preventDefault();
              // Enter from the title goes straight to writing — the first
              // explanation, creating one if needed.
              const first = lesson.blocks[0];
              focusSlideWritingField(
                first ? first.id : builder.addBlock(lesson.id, "explanation", 0),
              );
            }}
            placeholder="Name this lesson…"
            aria-label={`Lesson ${lessonIndex + 1} title`}
          />
          {confirmingDelete ? (
            <span className="lesson-library-row-icons lesson-inline-confirm">
              <span>Delete lesson?</span>
              <button
                type="button"
                className="danger"
                data-lesson-delete-confirm={lesson.id}
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
                  requestAnimationFrame(() =>
                    document
                      .querySelector<HTMLButtonElement>(
                        `[data-lesson-delete-trigger="${lesson.id}"]`,
                      )
                      ?.focus(),
                  );
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
                onRequestDelete={() => {
                  onRequestDeleteConfirm(lessonDeleteKey);
                  requestAnimationFrame(() =>
                    document
                      .querySelector<HTMLButtonElement>(
                        `[data-lesson-delete-confirm="${lesson.id}"]`,
                      )
                      ?.focus(),
                  );
                }}
              />
            </span>
          )}
        </div>
        {isOpen && (
          <LessonDocument
            lesson={lesson}
            onDone={() => onCollapse(lesson.id)}
            onAddLesson={() => onStartLessonAt(moduleId, lessonIndex + 1)}
          />
        )}
      </article>
    </>
  );
}

export const LessonRow = memo(LessonRowImpl);
