"use client";

// The Lesson Builder's single source of truth for "what is the teacher
// editing right now." See docs/design/lesson-builder-editing-model.md — this
// file is the contract's implementation, not a proposal.
//
// Only real focus events write `selection` (via `setSelection`, called from
// a field/block/title's own onFocus). Blur never writes `none` directly — a
// `focusout` whose relatedTarget is outside the builder root does; otherwise
// the next focusin overwrites. Everything else in the builder *reads*
// `selection` — the keymap, the seam "+" placement, the resting/editing
// render of a sentence slide, and each block's `data-state`.

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import type { LessonBuilderActions } from "@/lib/lesson-builder/builder-context";
import { formatAnswerEntry, parseAnswerEntry } from "@/lib/lesson-builder/answer-entry";
import { planAcceptedAnswersCommit } from "@/lib/lesson-builder/answer-commit-plan";
import { focusSelection as focusSelectionDom } from "@/lib/lesson-builder/focus";
import type { LanguageBlock, Lesson } from "@/lib/lesson-builder/types";

export type Field =
  | "title"
  | "explanation"
  | "instruction"
  | "spanish"
  | "english"
  | "hint";

export type EditingSelection =
  | { kind: "none" }
  | { kind: "title"; lessonId: string }
  | { kind: "block"; lessonId: string; blockId: string; field?: undefined }
  | {
      kind: "field";
      lessonId: string;
      blockId: string;
      field: Field;
      pieceId?: string;
    };

export type EditingState = {
  selection: EditingSelection;
  openLessonId: string | null;
  insertAfter: { lessonId: string; index: number } | null;
};

// -----------------------------------------------------------------------
// Leaving a slide — one function. Dispatched by the store whenever the
// active block (selection.blockId) changes or becomes undefined. No key
// handler, click handler, or component calls this directly — see
// `useLessonEditing`'s `setSelection` below, the only caller.
// -----------------------------------------------------------------------
export type LeaveReason =
  | "escape"
  | "insert"
  | "finish"
  | "move"
  | "preview"
  | "collapse"
  | "blur";

type LeaveSlideDeps = { lessons: Lesson[]; actions: LessonBuilderActions };
let leaveSlideDeps: LeaveSlideDeps | null = null;

// Called once by the provider (below) on every render so `leaveSlide` always
// sees the current lessons/actions without needing them in its own fixed
// signature.
export function configureLeaveSlide(deps: LeaveSlideDeps): void {
  leaveSlideDeps = deps;
}

/** Turns one raw slash-delimited English-alternatives draft into the
 * minimal set of update/add/remove calls against the stored accepted-answer
 * array — shared by `leaveSlide`'s draft commit and the keymap's pair
 * navigation commands (Tab/Enter), both of which read the field's live DOM
 * value directly rather than through React state. */
export function commitAnswerDraft(
  actions: LessonBuilderActions,
  lessonId: string,
  blockId: string,
  piece: LanguageBlock,
  raw: string,
): void {
  const parsed = parseAnswerEntry(raw);
  const next = parsed.length > 0 ? parsed : [""];
  for (const op of planAcceptedAnswersCommit(piece.acceptedAnswers, next)) {
    if (op.kind === "update") {
      actions.updateAnswer(lessonId, blockId, piece.id, op.index, op.value);
    } else if (op.kind === "append") {
      actions.addAnswer(lessonId, blockId, piece.id);
      actions.updateAnswer(lessonId, blockId, piece.id, op.index, op.value);
    } else {
      actions.removeAnswer(lessonId, blockId, piece.id, op.index);
    }
  }
}

function liveEnglishValue(blockId: string, piece: LanguageBlock): string {
  if (typeof document === "undefined") return formatAnswerEntry(piece.acceptedAnswers);
  const field = document.querySelector<HTMLTextAreaElement>(
    `[data-document-block="${blockId}"] [data-piece="${piece.id}"] [data-field="english"]`,
  );
  return field ? field.value : formatAnswerEntry(piece.acceptedAnswers);
}

function isPieceBlank(blockId: string, piece: LanguageBlock): boolean {
  const english = liveEnglishValue(blockId, piece);
  return (
    !piece.spanish.trim() &&
    parseAnswerEntry(english).length === 0 &&
    !piece.callout?.trim()
  );
}

// A sentence/vocabulary slide is "entirely empty" — worth deleting outright
// rather than just pruning — when every pair is blank (see `isPieceBlank`)
// and there's no instruction text either. Checked *before* pruning so the
// whole-slide delete below is the only dispatch, i.e. one undoable step,
// instead of a pile of per-piece deletes followed by a block delete.
function isSentenceBlockEmpty(blockId: string, block: LanguageBlock[], promptText: string): boolean {
  return !promptText.trim() && block.every((piece) => isPieceBlank(blockId, piece));
}

// An explanation slide is blank when its saved markdown has no real content
// once every paragraph (split on blank lines) that is itself blank is
// dropped — so a stray leading/trailing empty paragraph doesn't count as
// content. Read from `contentMarkdown` (not live DOM) so this works
// identically whether the slide was ever mounted with the old or the new
// explanation editor.
function isExplanationMarkdownBlank(markdown: string): boolean {
  return !markdown
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .some((paragraph) => paragraph.length > 0);
}

export function leaveSlide(
  lessonId: string,
  blockId: string,
  reason: LeaveReason,
): void {
  const deps = leaveSlideDeps;
  if (!deps) return;
  const lesson = deps.lessons.find((candidate) => candidate.id === lessonId);
  const block = lesson?.blocks.find((candidate) => candidate.id === blockId);
  if (block && block.type === "sentence") {
    // Commit any live English draft into the store before deciding what's
    // blank — a pair finished by typing (never blurred) must not be judged
    // blank just because the store hasn't heard about it yet. Skipped for
    // reason "blur": that transition is itself caused by a real native
    // focusout, which means the field's own onBlur (sentence-editor.tsx)
    // is *also* about to run in this same tick — with no render in
    // between, both would diff against the same stale
    // `piece.acceptedAnswers` and double-apply the same append. Blank
    // detection below still reads the live DOM value directly regardless,
    // so it stays accurate whichever of the two commits actually lands.
    if (reason !== "blur") {
      for (const piece of block.languageBlocks) {
        const raw = liveEnglishValue(blockId, piece);
        const stored = formatAnswerEntry(piece.acceptedAnswers);
        if (raw !== stored) commitAnswerDraft(deps.actions, lessonId, blockId, piece, raw);
      }
    }
    // Entirely empty (no instruction, every pair blank) — delete the whole
    // slide rather than pruning down to one leftover blank pair. Owner
    // requirement 2026-09-15: no empty slides, ever, on any LeaveReason
    // (including "insert" — inserting the next slide still removes this
    // one if it was never filled in).
    if (isSentenceBlockEmpty(blockId, block.languageBlocks, block.promptText)) {
      deps.actions.deleteBlock(lessonId, blockId);
      deps.actions.endHistoryGroup();
      return;
    }
    const blanks = block.languageBlocks.filter((piece) => isPieceBlank(blockId, piece));
    // Keep at least one pair in a sentence slide — if every pair is blank
    // (but there's instruction text keeping the slide non-empty overall),
    // prune all but the first rather than leaving zero pairs.
    const toDelete =
      blanks.length === block.languageBlocks.length ? blanks.slice(1) : blanks;
    for (const piece of toDelete) deps.actions.deletePiece(lessonId, blockId, piece.id);
  } else if (block && block.type === "explanation") {
    if (isExplanationMarkdownBlank(block.contentMarkdown)) {
      deps.actions.deleteBlock(lessonId, blockId);
      deps.actions.endHistoryGroup();
      return;
    }
  }
  deps.actions.endHistoryGroup();
}

// -----------------------------------------------------------------------
// The store: selection + the small amount of view state that keyboard
// commands need to reach (which lesson is open, which module is showing,
// the mouse-chooser's insertion target, the delete-confirm prompt, and the
// keyboard-help dialog). Colocated with EditingState/leaveSlide rather than
// in builder-context.tsx, since none of this is a lesson-content mutation.
// -----------------------------------------------------------------------

type StoreState = EditingState & {
  activeModuleId: string | null;
  confirmDeleteKey: string | null;
  helpOpen: boolean;
};

const initialState: StoreState = {
  selection: { kind: "none" },
  openLessonId: null,
  insertAfter: null,
  activeModuleId: null,
  confirmDeleteKey: null,
  helpOpen: false,
};

type StoreAction =
  | { type: "SET_SELECTION"; selection: EditingSelection }
  | { type: "SET_OPEN_LESSON"; lessonId: string | null }
  | { type: "SET_INSERT_AFTER"; target: { lessonId: string; index: number } | null }
  | { type: "SET_ACTIVE_MODULE"; moduleId: string | null }
  | { type: "REQUEST_DELETE_CONFIRM"; key: string | null }
  | { type: "SET_HELP_OPEN"; open: boolean };

function reducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case "SET_SELECTION":
      return { ...state, selection: action.selection };
    case "SET_OPEN_LESSON":
      return { ...state, openLessonId: action.lessonId };
    case "SET_INSERT_AFTER":
      return { ...state, insertAfter: action.target };
    case "SET_ACTIVE_MODULE":
      return { ...state, activeModuleId: action.moduleId };
    case "REQUEST_DELETE_CONFIRM":
      return { ...state, confirmDeleteKey: action.key };
    case "SET_HELP_OPEN":
      return { ...state, helpOpen: action.open };
    default:
      return state;
  }
}

type SelectionContext = { lessonId: string; blockId: string; hasField: boolean };

function contextOf(selection: EditingSelection): SelectionContext | null {
  if (selection.kind === "block") {
    return { lessonId: selection.lessonId, blockId: selection.blockId, hasField: false };
  }
  if (selection.kind === "field") {
    return { lessonId: selection.lessonId, blockId: selection.blockId, hasField: true };
  }
  return null;
}

// A slide is "left" — and leaveSlide runs — either when the active blockId
// actually changes (moving to a different block, or to none/title), or when
// a field selection on the same block drops its field (Escape: field →
// block on the same blockId). Piece-to-piece navigation within one block
// (field → field, same blockId) is not leaving — Tab must not prune the
// pair a teacher just tabbed away from mid-authoring.
function isLeavingSlide(prev: SelectionContext | null, next: SelectionContext | null): boolean {
  if (!prev) return false;
  if (!next || next.blockId !== prev.blockId) return true;
  return prev.hasField && !next.hasField;
}

// Backstop for the builder root's native `focusout` listener (see
// `lesson-library.tsx`): decides whether a blur that couldn't be resolved
// to a same-root `relatedTarget` is a *real* departure from the currently
// selected slide, worth collapsing the selection to `{kind:"none"}` (and
// therefore running `leaveSlide`), or just DOM churn from one of the
// slide's own controls (Add instruction, hint lightbulb, Add pair/row,
// pair ×, the block's drag/duplicate/delete chrome) that unmounts the
// clicked element as a direct result of its own click — which some engines
// report as a `focusout` with no resolvable `relatedTarget` at all. A blur
// whose target still belongs (via its nearest `[data-document-block]`) to
// the slide the selection already points at is never a real leave, known
// `relatedTarget` or not — every one of that slide's own controls is
// expected to move focus somewhere *inside* the same slide, never out of
// the builder. `targetBlockId` is null when the target isn't inside any
// slide at all (e.g. the module rail, or nothing left to resolve because
// the node is already detached) — that's always a real departure.
export function isRealBlurAway(
  targetBlockId: string | null,
  selectionBlockId: string | null,
): boolean {
  if (targetBlockId === null) return true;
  return targetBlockId !== selectionBlockId;
}

export type EditingActions = StoreState & {
  setSelection: (selection: EditingSelection, opts?: { reason?: LeaveReason }) => void;
  setOpenLesson: (lessonId: string | null) => void;
  setInsertAfter: (target: { lessonId: string; index: number } | null) => void;
  setActiveModule: (moduleId: string | null) => void;
  requestDeleteConfirm: (key: string | null) => void;
  setHelpOpen: (open: boolean) => void;
  focusSelection: (selection: EditingSelection) => void;
};

const EditingContext = createContext<EditingActions | null>(null);

export function useLessonEditing(): EditingActions {
  const value = useContext(EditingContext);
  if (!value) {
    throw new Error("useLessonEditing must be used within an EditingProvider");
  }
  return value;
}

export function EditingProvider({
  lessons,
  actions,
  initialSelection,
  children,
}: {
  lessons: Lesson[];
  actions: LessonBuilderActions;
  // Test-only injection point — production callers never pass this; the
  // store always starts at `{kind:"none"}` and only a real focus event
  // moves it from there.
  initialSelection?: EditingSelection;
  children?: ReactNode;
}) {
  const [state, dispatch] = useReducer(
    reducer,
    initialSelection ? { ...initialState, selection: initialSelection } : initialState,
  );
  // Keeps `leaveSlide` current without threading lessons/actions through its
  // fixed (lessonId, blockId, reason) signature.
  useEffect(() => {
    configureLeaveSlide({ lessons, actions });
  });

  const currentSelection = state.selection;
  const setSelection = useCallback(
    (selection: EditingSelection, opts?: { reason?: LeaveReason }) => {
      const prev = contextOf(currentSelection);
      const next = contextOf(selection);
      if (isLeavingSlide(prev, next) && prev) {
        leaveSlide(prev.lessonId, prev.blockId, opts?.reason ?? "blur");
      }
      dispatch({ type: "SET_SELECTION", selection });
    },
    [currentSelection],
  );
  const setOpenLesson = useCallback(
    (lessonId: string | null) => dispatch({ type: "SET_OPEN_LESSON", lessonId }),
    [],
  );
  const setInsertAfter = useCallback(
    (target: { lessonId: string; index: number } | null) =>
      dispatch({ type: "SET_INSERT_AFTER", target }),
    [],
  );
  const setActiveModule = useCallback(
    (moduleId: string | null) => dispatch({ type: "SET_ACTIVE_MODULE", moduleId }),
    [],
  );
  const requestDeleteConfirm = useCallback(
    (key: string | null) => dispatch({ type: "REQUEST_DELETE_CONFIRM", key }),
    [],
  );
  const setHelpOpen = useCallback(
    (open: boolean) => dispatch({ type: "SET_HELP_OPEN", open }),
    [],
  );

  const value = useMemo<EditingActions>(
    () => ({
      ...state,
      setSelection,
      setOpenLesson,
      setInsertAfter,
      setActiveModule,
      requestDeleteConfirm,
      setHelpOpen,
      focusSelection: focusSelectionDom,
    }),
    [state, setSelection, setOpenLesson, setInsertAfter, setActiveModule, requestDeleteConfirm, setHelpOpen],
  );

  return createElement(EditingContext.Provider, { value }, children);
}

// The "active block" invariant from the design doc: everything that used to
// read a local `activeBlock`/`activePiece` reads this instead.
export function activeBlockId(selection: EditingSelection): string | null {
  return selection.kind === "block" || selection.kind === "field" ? selection.blockId : null;
}

export function blockDataState(
  selection: EditingSelection,
  blockId: string,
): "resting" | "editing" {
  return activeBlockId(selection) === blockId ? "editing" : "resting";
}
