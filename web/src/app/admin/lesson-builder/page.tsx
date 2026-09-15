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
import { focusSelection } from "@/lib/lesson-builder/focus";
import {
  findRestoredFocusTarget,
  initialUndoableLessons,
  undoableLessonsReducer,
} from "@/lib/lesson-builder/history";
import type {
  LanguageBlock,
  LessonBlock,
  LessonModule,
} from "@/lib/lesson-builder/types";
import { duplicateLessonStructure as duplicateLessonStructureMutation } from "@/lib/lesson-builder/mutations";
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

  // Item 7: undoing a slide/pair deletion used to leave DOM focus stranded
  // on <body>. `findRestoredFocusTarget` is pure, so it can preview what
  // undo *would* restore before we actually dispatch it, then schedule a
  // focus call for whatever came back — a slide's own writing field, or one
  // specific pair's Spanish field. Reads `history` via a ref (same pattern
  // as `lessonsRef` below) so the callback identity stays stable rather
  // than changing on every keystroke.
  const historyRef = useRef(history);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);
  const performUndo = useCallback(() => {
    const current = historyRef.current;
    const next = undoableLessonsReducer(current, { type: "UNDO" });
    if (next === current) return;
    const target = findRestoredFocusTarget(current.present, next.present);
    const owner = target
      ? next.present.find((lesson) =>
          lesson.blocks.some((block) => block.id === target.blockId),
        )
      : undefined;
    const restoredBlock = owner?.blocks.find((block) => block.id === target?.blockId);
    dispatch({ type: "UNDO" });
    if (target && owner) {
      if (target.kind === "block") {
        focusSelection({
          kind: "field",
          lessonId: owner.id,
          blockId: target.blockId,
          field: restoredBlock?.type === "explanation" ? "explanation" : "spanish",
        });
      } else {
        focusSelection({
          kind: "field",
          lessonId: owner.id,
          blockId: target.blockId,
          field: "spanish",
          pieceId: target.pieceId,
        });
      }
    }
  }, []);
  // Undo/redo scoped to one explanation block (item 5: native
  // contentEditable undo inside the field is suppressed in favor of this).
  // Shares `historyRef` with `performUndo` above so identity stays stable.
  const editorUndo = useCallback((lessonId: string, blockId: string) => {
    const current = historyRef.current;
    const next = undoableLessonsReducer(current, { type: "UNDO" });
    if (next === current) return null;
    dispatch({ type: "UNDO" });
    const block = next.present
      .find((lesson) => lesson.id === lessonId)
      ?.blocks.find((candidate) => candidate.id === blockId);
    return block?.type === "explanation" ? block.contentMarkdown : null;
  }, []);
  const editorRedo = useCallback((lessonId: string, blockId: string) => {
    const current = historyRef.current;
    const next = undoableLessonsReducer(current, { type: "REDO" });
    if (next === current) return null;
    dispatch({ type: "REDO" });
    const block = next.present
      .find((lesson) => lesson.id === lessonId)
      ?.blocks.find((candidate) => candidate.id === blockId);
    return block?.type === "explanation" ? block.contentMarkdown : null;
  }, []);
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

  // E7 "New lesson like this one": bypasses the lessons reducer's own
  // action union (owned elsewhere mid-refactor) by computing the whole
  // result — lessons *and* modules — from the pure mutation up front, then
  // applying each half the way it's normally applied (`SET_LESSONS`,
  // `updateModules`). One undoable history step, same as `DUPLICATE_LESSON`.
  const duplicateLessonStructure = useCallback(
    (lessonId: string) => {
      const result = duplicateLessonStructureMutation(
        lessonsRef.current,
        modules,
        lessonId,
      );
      dispatch({ type: "SET_LESSONS", lessons: result.lessons });
      updateModules(result.modules);
      return result.newLessonId;
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
    (
      lessonId: string,
      type: DocumentBlockType,
      insertionIndex: number,
      proposedPairs?: { spanish: string; english: string }[],
    ) => {
      const blockId = createId("block");
      if (type === "explanation") {
        dispatch({
          type: "ADD_EXPLANATION_BLOCK",
          lessonId,
          insertionIndex,
          blockId,
        });
        return { blockId };
      }
      // E3: ids for pre-filled pairs are generated here, not in the
      // reducer/mutation, so the caller can focus the first pair's English
      // field the moment this returns.
      const pairs = proposedPairs?.length
        ? proposedPairs.map((pair) => ({ id: createId("lang"), ...pair }))
        : undefined;
      dispatch({
        type: "ADD_SENTENCE_BLOCK",
        lessonId,
        insertionIndex,
        blockId,
        languageBlockId: createId("lang"),
        ...(type === "vocabulary"
          ? { layout: "vocabulary_table" as const }
          : {}),
        ...(pairs ? { proposedPairs: pairs } : {}),
      });
      return { blockId, firstPieceId: pairs?.[0]?.id };
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

  const toggleGiven = useCallback(
    (lessonId: string, sentenceBlockId: string, languageBlockId: string) => {
      dispatch({ type: "TOGGLE_GIVEN", lessonId, sentenceBlockId, languageBlockId });
    },
    [],
  );

  const extendLastSentence = useCallback(
    (lessonId: string, afterBlockId: string | null) => {
      const blockId = createId("block");
      const languageBlockId = createId("lang");
      dispatch({
        type: "EXTEND_LAST_SENTENCE",
        lessonId,
        afterBlockId,
        blockId,
        languageBlockId,
      });
      return { blockId, languageBlockId };
    },
    [],
  );

  const replaceLessonBlocks = useCallback(
    (
      lessonId: string,
      result: { blocks: LessonBlock[]; title?: string; concepts?: string[] },
    ) => {
      dispatch({
        type: "REPLACE_LESSON_BLOCKS",
        lessonId,
        blocks: result.blocks,
        title: result.title,
        concepts: result.concepts,
      });
    },
    [],
  );

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

  const moveLessonKeyboard = useCallback(
    (lessonId: string, direction: -1 | 1): string | null => {
      const homeIndex = modules.findIndex((module) => module.lessonIds.includes(lessonId));
      if (homeIndex < 0) return null;
      const home = modules[homeIndex];
      const position = home.lessonIds.indexOf(lessonId);
      const withinModule = position + direction;
      let destinationModuleId = home.id;
      let insertionIndex: number;
      if (withinModule < 0 || withinModule >= home.lessonIds.length) {
        const adjacentIndex = homeIndex + direction;
        if (adjacentIndex < 0 || adjacentIndex >= modules.length) return null;
        const adjacent = modules[adjacentIndex];
        destinationModuleId = adjacent.id;
        insertionIndex = direction === -1 ? adjacent.lessonIds.length : 0;
      } else {
        insertionIndex = direction > 0 ? withinModule + 1 : withinModule;
      }
      moveLessonToPosition(lessonId, destinationModuleId, insertionIndex);
      return destinationModuleId;
    },
    [modules, moveLessonToPosition],
  );

  const newLessonAfter = useCallback(
    (afterLessonId: string | null, fallbackModuleId: string | null): string | null => {
      if (afterLessonId) {
        const home = modules.find((module) => module.lessonIds.includes(afterLessonId));
        if (home) return createLesson(home.id, home.lessonIds.indexOf(afterLessonId) + 1);
      }
      if (fallbackModuleId) return createLesson(fallbackModuleId);
      return null;
    },
    [modules, createLesson],
  );

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
      duplicateLessonStructure,
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
      updateExplanation: (lessonId, blockId, contentMarkdown, options) =>
        dispatch({
          type: "UPDATE_EXPLANATION_BLOCK",
          lessonId,
          blockId,
          contentMarkdown,
          boundary: options?.boundary,
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
      toggleGiven,
      addBlock,
      extendLastSentence,
      deleteBlock,
      replaceLessonBlocks,
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
      moveLessonKeyboard,
      newLessonAfter,
      undoDeletion,
      endHistoryGroup: () => dispatch({ type: "END_HISTORY_GROUP" }),
      editorUndo,
      editorRedo,
      undo: performUndo,
      redo: () => dispatch({ type: "REDO" }),
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      flushSave,
    }),
    [
      conceptDisplays,
      deletionUndo,
      createLesson,
      previewLessonWithFlush,
      duplicateLesson,
      duplicateLessonStructure,
      deleteLesson,
      addPiece,
      deletePiece,
      toggleGiven,
      addBlock,
      extendLastSentence,
      deleteBlock,
      replaceLessonBlocks,
      moveBlock,
      moveLessonKeyboard,
      newLessonAfter,
      undoDeletion,
      editorUndo,
      editorRedo,
      performUndo,
      history.past.length,
      history.future.length,
      flushSave,
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
          onUndo={performUndo}
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
