import {
  lessonsReducer,
  type LessonsAction,
} from "@/lib/lesson-builder/reducer";
import type { Lesson } from "@/lib/lesson-builder/types";

// Consecutive edits to the same text field coalesce into one history step,
// but only within a short time window — a formatting op, a paragraph break,
// a focus change, or any structural action ends the current group so the
// next edit (even to the same field) starts a fresh step. Loading a lesson
// file clears history outright.
export type UndoableLessons = {
  past: Lesson[][];
  present: Lesson[];
  future: Lesson[][];
  lastKey: string | null;
  lastEditAt: number;
};

// `boundary: true` marks an action that must never coalesce with its
// neighbors — a formatting/mark op or a paragraph break — even when it
// shares a coalescing key (same field) with the edit before or after it.
// Both LessonLibrary and reducer.ts stay unaware of this: it's an optional
// extra property recognized only by the history layer below.
export type UndoableAction =
  | (LessonsAction & { boundary?: boolean })
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "END_HISTORY_GROUP" };

const HISTORY_LIMIT = 100;
// Consecutive edits to the same field only coalesce into one undo step while
// they land within this window of each other — long enough to absorb a
// normal typing cadence, short enough that "type a sentence, pause, type
// another" still yields separate steps.
const COALESCE_WINDOW_MS = 1000;

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
  lastEditAt: 0,
};

export type RestoredFocusTarget =
  | { kind: "block"; blockId: string }
  | { kind: "piece"; blockId: string; pieceId: string };

// Diffs the lessons before/after an undo to find a slide or sentence pair
// that came back from a deletion, so the caller can refocus it — undoing a
// slide/pair delete otherwise leaves DOM focus stranded on `<body>`. Pure
// and synchronous: call it with `undoableLessonsReducer(state, {type:
// "UNDO"}).present` as `after` *before* actually dispatching the undo, so
// the caller can still schedule a focus call once the real dispatch lands.
export function findRestoredFocusTarget(
  before: Lesson[],
  after: Lesson[],
): RestoredFocusTarget | null {
  const beforeById = new Map(before.map((lesson) => [lesson.id, lesson]));
  for (const lesson of after) {
    const previousLesson = beforeById.get(lesson.id);
    if (!previousLesson) continue;

    const previousBlockIds = new Set(
      previousLesson.blocks.map((block) => block.id),
    );
    const restoredBlock = lesson.blocks.find(
      (block) => !previousBlockIds.has(block.id),
    );
    if (restoredBlock) return { kind: "block", blockId: restoredBlock.id };

    const previousBlockById = new Map(
      previousLesson.blocks.map((block) => [block.id, block]),
    );
    for (const block of lesson.blocks) {
      if (block.type !== "sentence") continue;
      const previousBlock = previousBlockById.get(block.id);
      if (!previousBlock || previousBlock.type !== "sentence") continue;
      const previousPieceIds = new Set(
        previousBlock.languageBlocks.map((piece) => piece.id),
      );
      const restoredPiece = block.languageBlocks.find(
        (piece) => !previousPieceIds.has(piece.id),
      );
      if (restoredPiece) {
        return { kind: "piece", blockId: block.id, pieceId: restoredPiece.id };
      }
    }
  }
  return null;
}

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
      lastEditAt: 0,
    };
  }

  if (action.type === "REDO") {
    if (state.future.length === 0) return state;
    return {
      past: [...state.past, state.present],
      present: state.future[0],
      future: state.future.slice(1),
      lastKey: null,
      lastEditAt: 0,
    };
  }

  const present = lessonsReducer(state.present, action);
  if (present === state.present) return state;

  if (action.type === "SET_LESSONS") {
    return { past: [], present, future: [], lastKey: null, lastEditAt: 0 };
  }

  const now = Date.now();
  const isBoundary = action.boundary === true;
  const key = isBoundary ? null : coalesceKey(action);
  const withinWindow = now - state.lastEditAt < COALESCE_WINDOW_MS;
  if (
    key !== null &&
    key === state.lastKey &&
    withinWindow &&
    state.past.length > 0
  ) {
    return { ...state, present, future: [], lastKey: key, lastEditAt: now };
  }

  return {
    past: [...state.past, state.present].slice(-HISTORY_LIMIT),
    present,
    future: [],
    // null both for a boundary action itself and for any non-coalescing
    // action — either way, the *next* edit must not merge backward into it.
    lastKey: key,
    lastEditAt: now,
  };
}
