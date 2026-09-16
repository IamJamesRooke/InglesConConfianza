// Builds the LessonBuilderActions value (content mutations, undo/redo, block/piece delete+undo) for the Lesson Builder page.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch } from "react";

import type { DocumentBlockType } from "@/components/lesson-builder/lesson-document";
import type { LessonBuilderActions, SyllabusMarkers } from "@/lib/lesson-builder/builder-context";
import { focusSelection } from "@/lib/lesson-builder/focus";
import {
  findRestoredFocusTarget,
  undoableLessonsReducer,
  type UndoableAction,
  type UndoableLessons,
} from "@/lib/lesson-builder/history";
import type { LanguageBlock, Lesson, LessonBlock } from "@/lib/lesson-builder/types";
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

export function useBuilderActions(params: {
  dispatch: Dispatch<UndoableAction>;
  history: UndoableLessons;
  lessonsRef: React.RefObject<Lesson[]>;
  conceptDisplays: LessonBuilderActions["conceptDisplays"];
  recordConceptDisplay: LessonBuilderActions["recordConceptDisplay"];
  getSyllabusMarkers: (lessonId: string) => SyllabusMarkers;
  flushSave: () => void;
  createLesson: (moduleId: string, insertionIndex?: number) => string;
  previewLessonWithFlush: (lessonId: string) => void;
  duplicateLesson: (lessonId: string) => void;
  deleteLesson: (lessonId: string) => void | Promise<void>;
  moveLessonKeyboard: (lessonId: string, direction: -1 | 1) => string | null;
  newLessonAfter: (afterLessonId: string | null, fallbackModuleId: string | null) => string | null;
}) {
  const {
    dispatch,
    history,
    lessonsRef,
    conceptDisplays,
    recordConceptDisplay,
    getSyllabusMarkers,
    flushSave,
    createLesson,
    previewLessonWithFlush,
    duplicateLesson,
    deleteLesson,
    moveLessonKeyboard,
    newLessonAfter,
  } = params;

  const [deletionUndo, setDeletionUndo] = useState<{
    lessonId: string;
    label: string;
  } | null>(null);
  const deletionRef = useRef<Deletion | null>(null);

  // Item 7: undoing a slide/pair deletion used to leave DOM focus stranded
  // on <body>. `findRestoredFocusTarget` is pure, so it can preview what
  // undo *would* restore before we actually dispatch it, then schedule a
  // focus call for whatever came back — a slide's own writing field, or one
  // specific pair's Spanish field. Reads `history` via a ref (same pattern
  // as `lessonsRef`) so the callback identity stays stable rather than
  // changing on every keystroke.
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
  }, [dispatch]);

  // Undo/redo scoped to one explanation block (item 5: native
  // contentEditable undo inside the field is suppressed in favor of this).
  // Shares `historyRef` with `performUndo` above so identity stays stable.
  const editorUndo = useCallback(
    (lessonId: string, blockId: string) => {
      const current = historyRef.current;
      const next = undoableLessonsReducer(current, { type: "UNDO" });
      if (next === current) return null;
      dispatch({ type: "UNDO" });
      const block = next.present
        .find((lesson) => lesson.id === lessonId)
        ?.blocks.find((candidate) => candidate.id === blockId);
      return block?.type === "explanation" ? block.contentMarkdown : null;
    },
    [dispatch],
  );
  const editorRedo = useCallback(
    (lessonId: string, blockId: string) => {
      const current = historyRef.current;
      const next = undoableLessonsReducer(current, { type: "REDO" });
      if (next === current) return null;
      dispatch({ type: "REDO" });
      const block = next.present
        .find((lesson) => lesson.id === lessonId)
        ?.blocks.find((candidate) => candidate.id === blockId);
      return block?.type === "explanation" ? block.contentMarkdown : null;
    },
    [dispatch],
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
    [dispatch],
  );

  const addPiece = useCallback(
    (lessonId: string, blockId: string) => {
      const languageBlockId = createId("lang");
      dispatch({
        type: "ADD_LANGUAGE_BLOCK",
        lessonId,
        sentenceBlockId: blockId,
        languageBlockId,
      });
      return languageBlockId;
    },
    [dispatch],
  );

  const toggleGiven = useCallback(
    (lessonId: string, sentenceBlockId: string, languageBlockId: string) => {
      dispatch({ type: "TOGGLE_GIVEN", lessonId, sentenceBlockId, languageBlockId });
    },
    [dispatch],
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
    [dispatch],
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
    [dispatch],
  );

  const deleteBlock = useCallback(
    (lessonId: string, blockId: string) => {
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
    },
    [dispatch, lessonsRef],
  );

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
    [dispatch, lessonsRef],
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
  }, [dispatch]);

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
    [dispatch, lessonsRef],
  );

  const toggleLessonDraft = useCallback(
    (lessonId: string) => {
      const lesson = lessonsRef.current.find((candidate) => candidate.id === lessonId);
      const nextStatus = lesson?.status === "draft" ? "published" : "draft";
      dispatch({ type: "SET_LESSON_STATUS", lessonId, status: nextStatus });
    },
    [dispatch, lessonsRef],
  );

  const setLessonNotes = useCallback(
    (lessonId: string, notes: string) =>
      dispatch({ type: "SET_LESSON_NOTES", lessonId, notes }),
    [dispatch],
  );

  const builderActions: LessonBuilderActions = useMemo(
    () => ({
      conceptDisplays,
      recordConceptDisplay,
      getSyllabusMarkers,
      deletionUndo,
      newLesson: createLesson,
      previewLesson: previewLessonWithFlush,
      duplicateLesson,
      deleteLesson: (lessonId) => void deleteLesson(lessonId),
      renameLesson: (lessonId, name) =>
        dispatch({ type: "RENAME_LESSON", lessonId, name }),
      toggleLessonDraft,
      setLessonNotes,
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
      recordConceptDisplay,
      getSyllabusMarkers,
      deletionUndo,
      createLesson,
      previewLessonWithFlush,
      duplicateLesson,
      deleteLesson,
      toggleLessonDraft,
      setLessonNotes,
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
      dispatch,
    ],
  );

  return { builderActions, performUndo };
}
