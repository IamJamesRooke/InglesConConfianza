"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import { LessonLibrary } from "@/components/lesson-builder/lesson-library";
import { LessonSelector } from "@/components/practice/lesson-selector";
import {
  initialUndoableLessons,
  undoableLessonsReducer,
} from "@/lib/lesson-builder/history";
import { useBuilderActions } from "@/lib/lesson-builder/use-builder-actions";
import { useCourseModules } from "@/lib/lesson-builder/use-course-modules";
import { useLessonPersistence } from "@/lib/lesson-builder/use-lesson-persistence";
import { useLessonPreview } from "@/lib/lesson-builder/use-lesson-preview";

export default function LessonBuilderPage() {
  const [history, dispatch] = useReducer(
    undoableLessonsReducer,
    initialUndoableLessons,
  );
  const lessons = history.present;
  // Read by deleteBlock/deletePiece/moveBlock (use-builder-actions.ts) and
  // getSyllabusMarkers (use-course-modules.ts) so those callbacks can stay
  // referentially stable (no `[lessons]` dep) across a typing session —
  // they still see the current lessons at call time, just via a ref instead
  // of a closure captured at the callback's last re-creation. Updated in an
  // effect (never during render) and only ever read from event handlers
  // that run later.
  const lessonsRef = useRef(lessons);
  useEffect(() => {
    lessonsRef.current = lessons;
  }, [lessons]);

  const courseModules = useCourseModules(dispatch, lessonsRef);
  const { modules, getSyllabusMarkers, updateModules } = courseModules;

  const currentCourse = useMemo(
    () => ({ lessons, modules }),
    [lessons, modules],
  );

  const onInitialLoad = useCallback(
    (course: typeof currentCourse) => {
      dispatch({ type: "SET_LESSONS", lessons: course.lessons });
      updateModules(course.modules);
    },
    [updateModules],
  );
  const {
    saveState,
    isDirty,
    conceptDisplays,
    recordConceptDisplay,
    retrySave,
    flush: flushSave,
    deleteLesson: deletePersistedLesson,
  } = useLessonPersistence({ currentCourse, onInitialLoad });
  const { preview, openPreview, closePreview } = useLessonPreview(lessons);
  // Preview reads a snapshot of `lessons` at open time — flush any pending
  // idle-debounced save first so the file on disk isn't left behind while
  // the teacher previews (item 9's "navigation to preview" flush point).
  const previewLessonWithFlush = useCallback(
    (lessonId: string) => {
      flushSave();
      openPreview(lessonId);
    },
    [flushSave, openPreview],
  );

  const deleteLesson = useCallback(
    async (lessonId: string) => {
      const result = await deletePersistedLesson(lessonId);
      if (!result) return;
      dispatch({ type: "DELETE_LESSON", lessonId });
      updateModules(result.modules);
    },
    [deletePersistedLesson, updateModules],
  );

  const { builderActions, performUndo } = useBuilderActions({
    dispatch,
    history,
    lessonsRef,
    conceptDisplays,
    recordConceptDisplay,
    getSyllabusMarkers,
    flushSave,
    createLesson: courseModules.createLesson,
    previewLessonWithFlush,
    duplicateLesson: courseModules.duplicateLesson,
    deleteLesson,
    moveLessonKeyboard: courseModules.moveLessonKeyboard,
    newLessonAfter: courseModules.newLessonAfter,
  });

  const saveLabel =
    saveState === "loading"
      ? "Loading…"
      : saveState === "saving"
        ? "Saving…"
        : saveState === "error"
          ? "Save failed"
          : isDirty
            ? "Unsaved changes"
            : "All changes saved";

  return (
    <main className="lesson-builder-page flex-1 bg-background px-4 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto w-full max-w-[1180px]">
        <LessonLibrary
          modules={modules}
          lessons={lessons}
          builder={builderActions}
          saveLabel={saveLabel}
          saveFailed={saveState === "error"}
          canUndo={history.past.length > 0}
          canRedo={history.future.length > 0}
          onUndo={performUndo}
          onRedo={() => dispatch({ type: "REDO" })}
          onRetrySave={() => void retrySave()}
          onFlushSave={flushSave}
          onAddModule={courseModules.addModule}
          onDeleteModule={courseModules.deleteModule}
          onMoveModule={courseModules.moveModule}
          onReorderModule={courseModules.reorderModule}
          onDropLesson={courseModules.moveLessonToPosition}
          onMoveLessonToModule={courseModules.moveLessonToModule}
          onChangeModule={courseModules.patchModule}
          onImported={courseModules.handleImported}
        />
      </div>
      {preview && (
        <LessonSelector
          lessons={[preview]}
          initialLessonId={preview.id}
          onCloseLesson={closePreview}
        />
      )}
    </main>
  );
}
