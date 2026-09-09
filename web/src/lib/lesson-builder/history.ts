import {
  lessonsReducer,
  type LessonsAction,
} from "@/lib/lesson-builder/reducer";
import type { Lesson } from "@/lib/lesson-builder/types";

// Consecutive edits to the same text field coalesce into one history step.
// Structural edits each create a step, and loading a lesson file clears history.
export type UndoableLessons = {
  past: Lesson[][];
  present: Lesson[];
  future: Lesson[][];
  lastKey: string | null;
};

export type UndoableAction =
  | LessonsAction
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "END_HISTORY_GROUP" };

const HISTORY_LIMIT = 100;

const COALESCING_ACTIONS = new Set<LessonsAction["type"]>([
  "UPDATE_EXPLANATION_BLOCK",
  "UPDATE_SENTENCE_BLOCK",
  "UPDATE_LANGUAGE_BLOCK",
  "UPDATE_ACCEPTED_ANSWER",
  "RENAME_LESSON",
  "RELABEL_LESSON_CONCEPT",
]);

function coalesceKey(action: LessonsAction): string | null {
  if (!COALESCING_ACTIONS.has(action.type)) return null;

  const fields = action as Record<string, unknown>;
  return [
    action.type,
    fields.lessonId,
    fields.blockId,
    fields.sentenceBlockId,
    fields.languageBlockId,
    fields.lessonConceptId,
    fields.answerIndex,
    fields.patch &&
      Object.keys(fields.patch as object)
        .sort()
        .join(","),
  ].join(":");
}

export const initialUndoableLessons: UndoableLessons = {
  past: [],
  present: [],
  future: [],
  lastKey: null,
};

export function undoableLessonsReducer(
  state: UndoableLessons,
  action: UndoableAction,
): UndoableLessons {
  if (action.type === "END_HISTORY_GROUP") {
    return state.lastKey === null ? state : { ...state, lastKey: null };
  }

  if (action.type === "UNDO") {
    if (state.past.length === 0) return state;
    return {
      past: state.past.slice(0, -1),
      present: state.past[state.past.length - 1],
      future: [state.present, ...state.future],
      lastKey: null,
    };
  }

  if (action.type === "REDO") {
    if (state.future.length === 0) return state;
    return {
      past: [...state.past, state.present],
      present: state.future[0],
      future: state.future.slice(1),
      lastKey: null,
    };
  }

  const present = lessonsReducer(state.present, action);
  if (present === state.present) return state;

  if (action.type === "SET_LESSONS") {
    return { past: [], present, future: [], lastKey: null };
  }

  const key = coalesceKey(action);
  if (key !== null && key === state.lastKey && state.past.length > 0) {
    return { ...state, present, future: [], lastKey: key };
  }

  return {
    past: [...state.past, state.present].slice(-HISTORY_LIMIT),
    present,
    future: [],
    lastKey: key,
  };
}
