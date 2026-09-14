"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import type { DocumentBlockType } from "@/components/lesson-builder/lesson-document";
import { LessonLibrary } from "@/components/lesson-builder/lesson-library";
import { LessonSelector } from "@/components/practice/lesson-selector";
import type { LessonBuilderActions } from "@/lib/lesson-builder/builder-context";
import {
  initialUndoableLessons,
  undoableLessonsReducer,
} from "@/lib/lesson-builder/history";
import type {
  LanguageBlock,
  LessonBlock,
  LessonModule,
} from "@/lib/lesson-builder/types";
import { useLessonPersistence } from "@/lib/lesson-builder/use-lesson-persistence";
import { useLessonPreview } from "@/lib/lesson-builder/use-lesson-preview";
import { createId } from "@/lib/lesson-builder/utils";

type Deletion =
  | { kind: "slide"; lessonId: string; block: LessonBlock; index: number }
  | {
      kind: "piece";
      lessonId: string;
      blockId: string;
      piece: LanguageBlock;
      index: number;
    };
function isTextEditingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("input, textarea, [contenteditable='true']"))
  );
}

export default function LessonBuilderPage() {
  const [history, dispatch] = useReducer(
    undoableLessonsReducer,
    initialUndoableLessons,
  );
  const lessons = history.present;
  // Read by deleteBlock/deletePiece/moveBlock below so those callbacks can
  // stay referentially stable (no `[lessons]` dep) across a typing session —
  // they still see the current lessons at call time, just via a ref instead
  // of a closure captured at the callback's last re-creation. Updated in an
  // effect (never during render) and only ever read from event handlers
  // that run later.
  const lessonsRef = useRef(lessons);
  useEffect(() => {
    lessonsRef.current = lessons;
  }, [lessons]);
  const [modules, setModules] = useState<LessonModule[]>([]);
  const [deletionUndo, setDeletionUndo] = useState<{
    lessonId: string;
    label: string;
  } | null>(null);
  const deletionRef = useRef<Deletion | null>(null);

  const currentCourse = useMemo(
    () => ({ lessons, modules }),
    [lessons, modules],
  );
  const onInitialLoad = useCallback((course: typeof currentCourse) => {
    dispatch({ type: "SET_LESSONS", lessons: course.lessons });
    setModules(course.modules);
  }, []);
  const {
    saveState,
    isDirty,
    conceptDisplays,
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const cmd = event.ctrlKey || event.metaKey;
      if (cmd && !event.altKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        flushSave();
      } else if (
        cmd &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === "z" &&
        !isTextEditingTarget(event.target)
      ) {
        event.preventDefault();
        dispatch({ type: "UNDO" });
      } else if (
        cmd &&
        !event.altKey &&
        event.shiftKey &&
        event.key.toLowerCase() === "z" &&
        !isTextEditingTarget(event.target)
      ) {
        event.preventDefault();
        dispatch({ type: "REDO" });
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [flushSave]);

  const updateModules = useCallback((next: LessonModule[]) => {
    setModules(next);
  }, []);

  const createLesson = useCallback(
    (moduleId: string, insertionIndex?: number) => {
      const lessonId = createId("lesson");
      dispatch({ type: "CREATE_LESSON", lessonId });
      updateModules(
        modules.map((module) => {
          if (module.id !== moduleId) return module;
          const index =
            insertionIndex === undefined
              ? module.lessonIds.length
              : Math.max(0, Math.min(insertionIndex, module.lessonIds.length));
          return {
            ...module,
            lessonIds: module.lessonIds.toSpliced(index, 0, lessonId),
          };
        }),
      );
      return lessonId;
    },
    [modules, updateModules],
  );

  const duplicateLesson = useCallback(
    (lessonId: string) => {
      const duplicateId = createId("lesson");
      dispatch({ type: "DUPLICATE_LESSON", lessonId, duplicateId });
      updateModules(
        modules.map((module) => {
          const index = module.lessonIds.indexOf(lessonId);
          return index < 0
            ? module
            : {
                ...module,
                lessonIds: module.lessonIds.toSpliced(
                  index + 1,
                  0,
                  duplicateId,
                ),
              };
        }),
      );
    },
    [modules, updateModules],
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

  // `modules` (unlike `lessons`) only changes on structural moves, never on
  // typing — so wrapping these in useCallback keeps their identity stable
  // across a typing session, which the memoized LessonRow (lesson-library-row.tsx)
  // relies on to skip re-rendering collapsed rows on every keystroke.
  const addModule = useCallback(() => {
    updateModules([
      ...modules,
      {
        id: createId("module"),
        name: `Module ${modules.length + 1}`,
        lessonIds: [],
      },
    ]);
  }, [modules, updateModules]);

  const deleteModule = useCallback(
    (moduleId: string) => {
      if (modules.length === 1) return;
      const index = modules.findIndex((module) => module.id === moduleId);
      const removed = modules[index];
      const destination = modules[index > 0 ? index - 1 : 1];
      if (!removed || !destination) return;
      updateModules(
        modules
          .filter((module) => module.id !== moduleId)
          .map((module) =>
            module.id === destination.id
              ? {
                  ...module,
                  lessonIds: [...module.lessonIds, ...removed.lessonIds],
                }
              : module,
          ),
      );
    },
    [modules, updateModules],
  );

  const moveModule = useCallback(
    (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= modules.length) return;
      const next = [...modules];
      [next[index], next[target]] = [next[target], next[index]];
      updateModules(next);
    },
    [modules, updateModules],
  );

  const reorderModule = useCallback(
    (draggedId: string, targetId: string) => {
      if (draggedId === targetId) return;
      const without = modules.filter((module) => module.id !== draggedId);
      const targetIndex = without.findIndex((module) => module.id === targetId);
      if (targetIndex < 0) return;
      const dragged = modules.find((module) => module.id === draggedId);
      if (!dragged) return;
      updateModules(without.toSpliced(targetIndex, 0, dragged));
    },
    [modules, updateModules],
  );

  const moveLessonToPosition = useCallback(
    (lessonId: string, moduleId: string, insertionIndex: number) => {
      const source = modules.find((module) =>
        module.lessonIds.includes(lessonId),
      );
      const sourceIndex = source?.lessonIds.indexOf(lessonId) ?? -1;
      updateModules(
        modules.map((module) => {
          const without = module.lessonIds.filter((id) => id !== lessonId);
          if (module.id !== moduleId) return { ...module, lessonIds: without };
          const at =
            source?.id === moduleId && sourceIndex < insertionIndex
              ? insertionIndex - 1
              : insertionIndex;
          return {
            ...module,
            lessonIds: without.toSpliced(
              Math.max(0, Math.min(at, without.length)),
              0,
              lessonId,
            ),
          };
        }),
      );
    },
    [modules, updateModules],
  );

  const moveLessonToModule = useCallback(
    (lessonId: string, moduleId: string) => {
      const destination = modules.find((module) => module.id === moduleId);
      moveLessonToPosition(
        lessonId,
        moduleId,
        destination?.lessonIds.length ?? 0,
      );
    },
    [modules, moveLessonToPosition],
  );

  const patchModule = useCallback(
    (moduleId: string, patch: Partial<LessonModule>) => {
      updateModules(
        modules.map((module) =>
          module.id === moduleId ? { ...module, ...patch } : module,
        ),
      );
    },
    [modules, updateModules],
  );

  const addBlock = useCallback(
    (lessonId: string, type: DocumentBlockType, insertionIndex: number) => {
      const blockId = createId("block");
      if (type === "explanation") {
        dispatch({
          type: "ADD_EXPLANATION_BLOCK",
          lessonId,
          insertionIndex,
          blockId,
        });
        return blockId;
      }
      dispatch({
        type: "ADD_SENTENCE_BLOCK",
        lessonId,
        insertionIndex,
        blockId,
        languageBlockId: createId("lang"),
        ...(type === "vocabulary"
          ? { layout: "vocabulary_table" as const }
          : {}),
      });
      return blockId;
    },
    [],
  );

  const addPiece = useCallback((lessonId: string, blockId: string) => {
    const languageBlockId = createId("lang");
    dispatch({
      type: "ADD_LANGUAGE_BLOCK",
      lessonId,
      sentenceBlockId: blockId,
      languageBlockId,
    });
    return languageBlockId;
  }, []);

  const deleteBlock = useCallback((lessonId: string, blockId: string) => {
    const lesson = lessonsRef.current.find(
      (candidate) => candidate.id === lessonId,
    );
    const index =
      lesson?.blocks.findIndex((block) => block.id === blockId) ?? -1;
    const block = lesson?.blocks[index];
    if (!block) return;
    deletionRef.current = { kind: "slide", lessonId, block, index };
    setDeletionUndo({ lessonId, label: "Slide deleted" });
    dispatch({ type: "DELETE_CONTENT_BLOCK", lessonId, blockId });
  }, []);

  const deletePiece = useCallback(
    (lessonId: string, blockId: string, pieceId: string) => {
      const block = lessonsRef.current
        .find((lesson) => lesson.id === lessonId)
        ?.blocks.find((candidate) => candidate.id === blockId);
      if (!block || block.type !== "sentence") return;
      const index = block.languageBlocks.findIndex(
        (piece) => piece.id === pieceId,
      );
      const piece = block.languageBlocks[index];
      if (!piece) return;
      deletionRef.current = { kind: "piece", lessonId, blockId, piece, index };
      setDeletionUndo({ lessonId, label: "Sentence piece deleted" });
      dispatch({
        type: "DELETE_LANGUAGE_BLOCK",
        lessonId,
        sentenceBlockId: blockId,
        languageBlockId: pieceId,
      });
    },
    [],
  );

  const undoDeletion = useCallback(() => {
    const deleted = deletionRef.current;
    if (!deleted) return;
    if (deleted.kind === "slide")
      dispatch({
        type: "RESTORE_CONTENT_BLOCK",
        lessonId: deleted.lessonId,
        block: deleted.block,
        insertionIndex: deleted.index,
      });
    else
      dispatch({
        type: "RESTORE_LANGUAGE_BLOCK",
        lessonId: deleted.lessonId,
        sentenceBlockId: deleted.blockId,
        languageBlock: deleted.piece,
        insertionIndex: deleted.index,
      });
    deletionRef.current = null;
    setDeletionUndo(null);
  }, []);

  const moveBlock = useCallback(
    (lessonId: string, blockId: string, direction: -1 | 1) => {
      const lesson = lessonsRef.current.find(
        (candidate) => candidate.id === lessonId,
      );
      const index =
        lesson?.blocks.findIndex((block) => block.id === blockId) ?? -1;
      const target = lesson?.blocks[index + direction];
      if (!target) return;
      dispatch({
        type: "MOVE_CONTENT_BLOCK",
        lessonId,
        draggedId: blockId,
        targetId: target.id,
        position: direction < 0 ? "before" : "after",
      });
    },
    [],
  );

  const builderActions: LessonBuilderActions = useMemo(
    () => ({
      conceptDisplays,
      deletionUndo,
      newLesson: createLesson,
      previewLesson: previewLessonWithFlush,
      duplicateLesson,
      deleteLesson: (lessonId) => void deleteLesson(lessonId),
      renameLesson: (lessonId, name) =>
        dispatch({ type: "RENAME_LESSON", lessonId, name }),
      addLessonConcept: (lessonId, concept) =>
        dispatch({ type: "ADD_LESSON_CONCEPT", lessonId, concept }),
      removeLessonConcept: (lessonId, lessonConceptId) =>
        dispatch({ type: "REMOVE_LESSON_CONCEPT", lessonId, lessonConceptId }),
      relabelLessonConcept: (lessonId, lessonConceptId, label) =>
        dispatch({
          type: "RELABEL_LESSON_CONCEPT",
          lessonId,
          lessonConceptId,
          label,
        }),
      updateExplanation: (lessonId, blockId, contentMarkdown) =>
        dispatch({
          type: "UPDATE_EXPLANATION_BLOCK",
          lessonId,
          blockId,
          contentMarkdown,
        }),
      updateSentence: (lessonId, sentenceBlockId, field, value) =>
        dispatch({
          type: "UPDATE_SENTENCE_BLOCK",
          lessonId,
          sentenceBlockId,
          patch: { [field]: value },
        }),
      updateSpanish: (lessonId, sentenceBlockId, languageBlockId, spanish) =>
        dispatch({
          type: "UPDATE_LANGUAGE_BLOCK",
          lessonId,
          sentenceBlockId,
          languageBlockId,
          patch: { spanish },
        }),
      updateAnswer: (
        lessonId,
        sentenceBlockId,
        languageBlockId,
        answerIndex,
        value,
      ) =>
        dispatch({
          type: "UPDATE_ACCEPTED_ANSWER",
          lessonId,
          sentenceBlockId,
          languageBlockId,
          answerIndex,
          value,
        }),
      updateCallout: (lessonId, sentenceBlockId, languageBlockId, callout) =>
        dispatch({
          type: "UPDATE_LANGUAGE_BLOCK",
          lessonId,
          sentenceBlockId,
          languageBlockId,
          patch: { callout },
        }),
      addAnswer: (lessonId, sentenceBlockId, languageBlockId) =>
        dispatch({
          type: "ADD_ACCEPTED_ANSWER",
          lessonId,
          sentenceBlockId,
          languageBlockId,
        }),
      removeAnswer: (lessonId, sentenceBlockId, languageBlockId, answerIndex) =>
        dispatch({
          type: "REMOVE_ACCEPTED_ANSWER",
          lessonId,
          sentenceBlockId,
          languageBlockId,
          answerIndex,
        }),
      addPiece,
      deletePiece,
      addBlock,
      deleteBlock,
      duplicateBlock: (lessonId, blockId) =>
        dispatch({ type: "DUPLICATE_CONTENT_BLOCK", lessonId, blockId }),
      moveBlock,
      reorderBlock: (lessonId, draggedId, targetId, position) =>
        dispatch({
          type: "MOVE_CONTENT_BLOCK",
          lessonId,
          draggedId,
          targetId,
          position,
        }),
      undoDeletion,
      endHistoryGroup: () => dispatch({ type: "END_HISTORY_GROUP" }),
    }),
    [
      conceptDisplays,
      deletionUndo,
      createLesson,
      previewLessonWithFlush,
      duplicateLesson,
      deleteLesson,
      addPiece,
      deletePiece,
      addBlock,
      deleteBlock,
      moveBlock,
      undoDeletion,
    ],
  );

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
          onUndo={() => dispatch({ type: "UNDO" })}
          onRedo={() => dispatch({ type: "REDO" })}
          onRetrySave={() => void retrySave()}
          onFlushSave={flushSave}
          onAddModule={addModule}
          onDeleteModule={deleteModule}
          onMoveModule={moveModule}
          onReorderModule={reorderModule}
          onDropLesson={moveLessonToPosition}
          onMoveLessonToModule={moveLessonToModule}
          onChangeModule={patchModule}
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
