"use client";

import { ChevronDown, ChevronRight, Play, Plus } from "lucide-react";
import { memo, useState, type DragEvent, type KeyboardEvent } from "react";

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
  onOpenForWriting: (lessonId: string) => void;
  focusOnOpenLessonId: string | null;
  onFocusOnMountHandled: () => void;
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
  onMoveLesson: (lessonId: string, direction: -1 | 1) => void;
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
  onOpenForWriting,
  focusOnOpenLessonId,
  onFocusOnMountHandled,
  onFlushSave,
  onStartDrag,
  onDragEnd,
  onDrop,
  onStartLessonAt,
  onMoveLesson,
  onRequestDeleteConfirm,
  onCancelDeleteConfirm,
}: Props) {
  const lessonDeleteKey = `lesson:${lesson.id}`;
  // Tracks which control opened the inline "Delete lesson?" confirm, so Esc
  // (item 4) returns focus to the right place: the title for the
  // Ctrl Alt Backspace path, the trigger icon for the mouse path.
  const [deleteConfirmOrigin, setDeleteConfirmOrigin] = useState<"title" | "icon">("icon");

  function focusTitle() {
    document.querySelector<HTMLInputElement>(`[data-lesson-title="${lesson.id}"]`)?.focus();
  }

  function requestDeleteFromTitle() {
    setDeleteConfirmOrigin("title");
    onRequestDeleteConfirm(lessonDeleteKey);
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLButtonElement>(`[data-lesson-delete-confirm="${lesson.id}"]`)
        ?.focus(),
    );
  }

  function handleDeleteConfirmKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key !== "Escape" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    onCancelDeleteConfirm();
    requestAnimationFrame(() => {
      if (deleteConfirmOrigin === "title") {
        focusTitle();
      } else {
        document
          .querySelector<HTMLButtonElement>(`[data-lesson-delete-trigger="${lesson.id}"]`)
          ?.focus();
      }
    });
  }

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
          // actually leaves this lesson's row (not just its document body —
          // moving between the title and a slide field is still "in" it).
          const next = event.relatedTarget;
          if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
            onFlushSave();
          }
        }}
        onKeyDown={(event) => {
          // Ctrl Alt P (item 5): preview this lesson from anywhere inside
          // its row, same as clicking the Play button. event.code, not
          // event.key, matching the rest of the Ctrl+Alt scheme.
          if (
            event.code === "KeyP" &&
            event.ctrlKey &&
            event.altKey &&
            !event.metaKey &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            builder.previewLesson(lesson.id);
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
            data-lesson-title={lesson.id}
            className="lesson-library-title-input"
            value={lesson.name ?? ""}
            onChange={(event) => builder.renameLesson(lesson.id, event.target.value)}
            onBlur={builder.endHistoryGroup}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (
                event.ctrlKey &&
                event.altKey &&
                !event.metaKey &&
                !event.shiftKey &&
                (event.code === "ArrowUp" || event.code === "ArrowDown")
              ) {
                // Ctrl Alt ArrowUp/Down (item 2): move this lesson within
                // its module, or across a module boundary at the top/
                // bottom of the list — see moveLessonKeyboard in
                // lesson-library.tsx.
                event.preventDefault();
                onMoveLesson(lesson.id, event.code === "ArrowUp" ? -1 : 1);
                return;
              }
              if (
                event.code === "Backspace" &&
                event.ctrlKey &&
                event.altKey &&
                !event.metaKey &&
                !event.shiftKey
              ) {
                // Ctrl Alt Backspace (item 4): open this row's own inline
                // "Delete lesson?" confirm, focused on Delete.
                event.preventDefault();
                requestDeleteFromTitle();
                return;
              }
              if (event.key !== "Enter") return;
              event.preventDefault();
              // Enter from the title goes straight to writing — the first
              // explanation, creating one if needed — whether the lesson was
              // already open or still collapsed (item 8).
              if (!isOpen) {
                onOpenForWriting(lesson.id);
                return;
              }
              const first = lesson.blocks[0];
              focusSlideWritingField(
                first ? first.id : builder.addBlock(lesson.id, "explanation", 0),
              );
            }}
            placeholder="Name this lesson…"
            aria-label={`Lesson ${lessonIndex + 1} title`}
          />
          {confirmingDelete ? (
            <span
              className="lesson-library-row-icons lesson-inline-confirm"
              onKeyDown={handleDeleteConfirmKeyDown}
            >
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
                  requestAnimationFrame(() => {
                    if (deleteConfirmOrigin === "title") {
                      focusTitle();
                    } else {
                      document
                        .querySelector<HTMLButtonElement>(
                          `[data-lesson-delete-trigger="${lesson.id}"]`,
                        )
                        ?.focus();
                    }
                  });
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
                  setDeleteConfirmOrigin("icon");
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
            focusOnMount={focusOnOpenLessonId === lesson.id}
            onFocusOnMountHandled={onFocusOnMountHandled}
          />
        )}
      </article>
    </>
  );
}

export const LessonRow = memo(LessonRowImpl);
