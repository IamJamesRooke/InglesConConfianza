"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { DocumentBlockType } from "@/components/lesson-builder/slide-insert-control";
import type { ConceptDisplayLookup, LessonConcept } from "@/lib/lesson-builder/types";

// The single set of lesson-content actions shared by LessonLibrary,
// LessonDocument, and SentenceEditor. Signatures match what page.tsx already
// exposes (lessonId-first); each consumer binds lesson.id/block.id itself
// rather than having them pre-bound and drilled down through props.
export type LessonBuilderActions = {
  conceptDisplays: ConceptDisplayLookup;
  deletionUndo: { lessonId: string; label: string } | null;
  newLesson: (moduleId: string, insertionIndex?: number) => string;
  previewLesson: (lessonId: string) => void;
  duplicateLesson: (lessonId: string) => void;
  deleteLesson: (lessonId: string) => void;
  renameLesson: (lessonId: string, name: string) => void;
  addLessonConcept: (lessonId: string, concept: LessonConcept) => void;
  removeLessonConcept: (lessonId: string, conceptId: string) => void;
  relabelLessonConcept: (
    lessonId: string,
    conceptId: string,
    label: string,
  ) => void;
  updateExplanation: (
    lessonId: string,
    blockId: string,
    markdown: string,
    options?: { boundary?: boolean },
  ) => void;
  updateSentence: (
    lessonId: string,
    blockId: string,
    field: "promptText" | "helperText" | "answerFeedback",
    value: string | null,
  ) => void;
  updateSpanish: (
    lessonId: string,
    blockId: string,
    pieceId: string,
    value: string,
  ) => void;
  updateAnswer: (
    lessonId: string,
    blockId: string,
    pieceId: string,
    answerIndex: number,
    value: string,
  ) => void;
  updateCallout: (
    lessonId: string,
    blockId: string,
    pieceId: string,
    value: string | null,
  ) => void;
  addAnswer: (lessonId: string, blockId: string, pieceId: string) => void;
  removeAnswer: (
    lessonId: string,
    blockId: string,
    pieceId: string,
    answerIndex: number,
  ) => void;
  addPiece: (lessonId: string, blockId: string) => string;
  deletePiece: (lessonId: string, blockId: string, pieceId: string) => void;
  addBlock: (
    lessonId: string,
    type: DocumentBlockType,
    insertionIndex: number,
  ) => string;
  deleteBlock: (lessonId: string, blockId: string) => void;
  duplicateBlock: (lessonId: string, blockId: string) => void;
  moveBlock: (lessonId: string, blockId: string, direction: -1 | 1) => void;
  reorderBlock: (
    lessonId: string,
    draggedId: string,
    targetId: string,
    position: "before" | "after",
  ) => void;
  // Moves a lesson within its module, or across a module boundary when the
  // move runs off the top/bottom of its own module. Returns the lesson's
  // resulting module id (unchanged if the move stayed within one module, or
  // null if there was nowhere to move) so the keymap command can keep the
  // module rail showing wherever the lesson landed.
  moveLessonKeyboard: (lessonId: string, direction: -1 | 1) => string | null;
  // Ctrl+Alt+L: a new lesson right after `afterLessonId` (its own module),
  // or at the end of `fallbackModuleId` when there's no open lesson to
  // anchor to (an empty module, or the page with nothing selected).
  // Returns the new lesson id, or null if neither anchor resolved.
  newLessonAfter: (
    afterLessonId: string | null,
    fallbackModuleId: string | null,
  ) => string | null;
  undoDeletion: () => void;
  endHistoryGroup: () => void;
  // Page-level history/save, folded in here so the keymap's "page" scope
  // commands (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl/Cmd+S) can reach them
  // through the one CommandContext.actions value.
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  flushSave: () => void;
  // Undo/redo scoped to one explanation block, routed through the page's
  // reducer history instead of native contentEditable undo (see
  // explanation-editor.tsx). Returns the block's restored contentMarkdown,
  // or null if there was nothing to undo/redo (or the block is gone).
  editorUndo: (lessonId: string, blockId: string) => string | null;
  editorRedo: (lessonId: string, blockId: string) => string | null;
};

const LessonBuilderContext = createContext<LessonBuilderActions | null>(null);

export function LessonBuilderProvider({
  value,
  children,
}: {
  value: LessonBuilderActions;
  children: ReactNode;
}) {
  return (
    <LessonBuilderContext.Provider value={value}>
      {children}
    </LessonBuilderContext.Provider>
  );
}

export function useLessonBuilder(): LessonBuilderActions {
  const value = useContext(LessonBuilderContext);
  if (!value) {
    throw new Error("useLessonBuilder must be used within a LessonBuilderProvider");
  }
  return value;
}
