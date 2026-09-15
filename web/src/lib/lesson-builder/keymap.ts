// The Lesson Builder's one keymap: one chord table, one dispatcher. See
// docs/design/lesson-builder-editing-model.md §3 — this file's shape (types,
// exports) is the contract; commands are the implementation.

import type { DocumentBlockType } from "@/components/lesson-builder/slide-insert-control";
import { parseAnswerEntry } from "@/lib/lesson-builder/answer-entry";
import { commitAnswerDraft } from "@/lib/lesson-builder/editing";
import type { EditingActions, EditingSelection } from "@/lib/lesson-builder/editing";
import { focusModuleName, rememberFocus } from "@/lib/lesson-builder/focus";
import type { LessonBuilderActions } from "@/lib/lesson-builder/builder-context";
import type { Lesson, LessonBlock } from "@/lib/lesson-builder/types";

export type Chord = string;
export type Scope =
  | "title"
  | "explanation"
  | "instruction"
  | "spanish"
  | "english"
  | "hint"
  | "block"
  | "lesson"
  | "page";
export type Command = (ctx: CommandContext) => boolean;
export type CommandContext = {
  selection: EditingSelection;
  lessons: Lesson[];
  actions: LessonBuilderActions;
  editing: EditingActions;
  event: KeyboardEvent;
};

// -----------------------------------------------------------------------
// chordOf / scopeOf
// -----------------------------------------------------------------------

function keyName(code: string): string {
  if (code === "Enter" || code === "NumpadEnter") return "Enter";
  if (code.startsWith("Key") && code.length === 4) return code.slice(3);
  if (code === "Period") return ".";
  return code; // ArrowUp/ArrowDown/ArrowLeft/ArrowRight, Tab, Escape, Space, Backspace…
}

export function chordOf(event: KeyboardEvent): Chord {
  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) parts.push("Ctrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  parts.push(keyName(event.code));
  return parts.join("+");
}

export function scopeOf(selection: EditingSelection): Scope[] {
  switch (selection.kind) {
    case "none":
      return ["page"];
    case "title":
      return ["title", "lesson", "page"];
    case "block":
      return ["block", "lesson", "page"];
    case "field":
      return [selection.field, "block", "lesson", "page"];
    default:
      return ["page"];
  }
}

// -----------------------------------------------------------------------
// Shared lookups
// -----------------------------------------------------------------------

function findLesson(lessons: Lesson[], lessonId: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === lessonId);
}

function findBlock(lesson: Lesson | undefined, blockId: string): LessonBlock | undefined {
  return lesson?.blocks.find((block) => block.id === blockId);
}

function isBlockEmpty(block: LessonBlock): boolean {
  if (block.type === "explanation") return !block.contentMarkdown.trim();
  if (block.promptText.trim()) return false;
  return block.languageBlocks.every(
    (piece) =>
      !piece.spanish.trim() &&
      piece.acceptedAnswers.every((answer) => !answer.trim()) &&
      !piece.callout?.trim(),
  );
}

export function fieldSelectionForBlock(lessonId: string, block: LessonBlock): EditingSelection {
  if (block.type === "explanation") {
    return { kind: "field", lessonId, blockId: block.id, field: "explanation" };
  }
  const first = block.languageBlocks[0];
  return {
    kind: "field",
    lessonId,
    blockId: block.id,
    field: "spanish",
    pieceId: first?.id,
  };
}

function predictedType(prevBlock: LessonBlock | undefined): DocumentBlockType {
  if (!prevBlock) return "explanation";
  return prevBlock.type === "explanation" ? "sentence" : "explanation";
}

const CYCLE_ORDER: DocumentBlockType[] = ["explanation", "sentence", "vocabulary"];
const CYCLE_WINDOW_MS = 1500;

// Ephemeral, not part of EditingState: "the block a Ctrl+Alt+Enter just
// inserted, and when" — purely so a *second* Ctrl+Alt+Enter within the
// window can tell it's looking at the same still-empty insertion versus a
// teacher who has since moved elsewhere and pressed the chord again.
let pendingInsert: { lessonId: string; blockId: string; type: DocumentBlockType; at: number } | null =
  null;

export function selectionForNewBlock(lessonId: string, blockId: string, type: DocumentBlockType): EditingSelection {
  return type === "explanation"
    ? { kind: "field", lessonId, blockId, field: "explanation" }
    : { kind: "field", lessonId, blockId, field: "spanish" };
}

function insertAfterBlock(ctx: CommandContext, lessonId: string, block: LessonBlock | undefined): boolean {
  const lesson = findLesson(ctx.lessons, lessonId);
  if (!lesson) return false;
  const now = Date.now();
  if (
    block &&
    pendingInsert &&
    pendingInsert.blockId === block.id &&
    now - pendingInsert.at < CYCLE_WINDOW_MS &&
    isBlockEmpty(block)
  ) {
    const index = CYCLE_ORDER.indexOf(pendingInsert.type);
    const nextType = CYCLE_ORDER[(index + 1) % CYCLE_ORDER.length];
    const position = lesson.blocks.findIndex((candidate) => candidate.id === block.id);
    ctx.actions.deleteBlock(lessonId, block.id);
    const newBlockId = ctx.actions.addBlock(lessonId, nextType, position);
    pendingInsert = { lessonId, blockId: newBlockId, type: nextType, at: now };
    const sel = selectionForNewBlock(lessonId, newBlockId, nextType);
    ctx.editing.setSelection(sel, { reason: "insert" });
    ctx.editing.focusSelection(sel);
    return true;
  }
  const index = block ? lesson.blocks.findIndex((candidate) => candidate.id === block.id) + 1 : 0;
  const type = predictedType(block);
  const newBlockId = ctx.actions.addBlock(lessonId, type, index);
  pendingInsert = { lessonId, blockId: newBlockId, type, at: now };
  const sel = selectionForNewBlock(lessonId, newBlockId, type);
  ctx.editing.setOpenLesson(lessonId);
  ctx.editing.setSelection(sel, { reason: "insert" });
  ctx.editing.focusSelection(sel);
  return true;
}

// -----------------------------------------------------------------------
// Commands
// -----------------------------------------------------------------------

function enterFromTitle(ctx: CommandContext): boolean {
  if (ctx.selection.kind !== "title") return false;
  const { lessonId } = ctx.selection;
  const lesson = findLesson(ctx.lessons, lessonId);
  if (!lesson) return false;
  ctx.editing.setOpenLesson(lessonId);
  const first = lesson.blocks[0];
  if (first) {
    const sel = fieldSelectionForBlock(lessonId, first);
    ctx.editing.setSelection(sel);
    ctx.editing.focusSelection(sel);
    return true;
  }
  const blockId = ctx.actions.addBlock(lessonId, "explanation", 0);
  const sel: EditingSelection = { kind: "field", lessonId, blockId, field: "explanation" };
  ctx.editing.setSelection(sel, { reason: "insert" });
  ctx.editing.focusSelection(sel);
  return true;
}

function insertFromTitle(ctx: CommandContext): boolean {
  if (ctx.selection.kind !== "title") return false;
  return insertAfterBlock(ctx, ctx.selection.lessonId, undefined);
}

function insertFromBlockOrField(ctx: CommandContext): boolean {
  if (ctx.selection.kind !== "block" && ctx.selection.kind !== "field") return false;
  const { lessonId, blockId } = ctx.selection;
  const lesson = findLesson(ctx.lessons, lessonId);
  const block = findBlock(lesson, blockId);
  if (!block) return false;
  return insertAfterBlock(ctx, lessonId, block);
}

function enterBlock(ctx: CommandContext): boolean {
  if (ctx.selection.kind !== "block") return false;
  const lesson = findLesson(ctx.lessons, ctx.selection.lessonId);
  const block = findBlock(lesson, ctx.selection.blockId);
  if (!block) return false;
  const sel = fieldSelectionForBlock(ctx.selection.lessonId, block);
  ctx.editing.setSelection(sel);
  ctx.editing.focusSelection(sel);
  return true;
}

function escapeToBlock(ctx: CommandContext): boolean {
  if (ctx.selection.kind !== "field") return false;
  const sel: EditingSelection = {
    kind: "block",
    lessonId: ctx.selection.lessonId,
    blockId: ctx.selection.blockId,
  };
  ctx.editing.setSelection(sel, { reason: "escape" });
  ctx.editing.focusSelection(sel);
  return true;
}

// Escape on a block wrapper (the *second* Escape after a field, or a direct
// click-then-Escape on the wrapper itself) fully deselects: no rail, no
// chrome, focus parked on the builder root with no visible ring — the
// owner's requirement 2026-09-15. This is `none`, not "stay."
function escapeBlockToNone(ctx: CommandContext): boolean {
  if (ctx.selection.kind !== "block") return false;
  const sel: EditingSelection = { kind: "none" };
  ctx.editing.setSelection(sel, { reason: "escape" });
  ctx.editing.focusSelection(sel);
  return true;
}

function moveBlockCommand(direction: -1 | 1): Command {
  return (ctx) => {
    if (ctx.selection.kind !== "block" && ctx.selection.kind !== "field") return false;
    ctx.actions.moveBlock(ctx.selection.lessonId, ctx.selection.blockId, direction);
    return true;
  };
}

function moveLessonCommand(direction: -1 | 1): Command {
  return (ctx) => {
    if (ctx.selection.kind !== "title") return false;
    const destination = ctx.actions.moveLessonKeyboard(ctx.selection.lessonId, direction);
    if (destination) ctx.editing.setActiveModule(destination);
    ctx.editing.focusSelection(ctx.selection);
    return true;
  };
}

function finishLesson(ctx: CommandContext): boolean {
  if (ctx.selection.kind === "none") return false;
  const { lessonId } = ctx.selection;
  ctx.editing.setSelection({ kind: "none" }, { reason: "finish" });
  ctx.editing.setOpenLesson(null);
  ctx.actions.flushSave();
  ctx.editing.focusSelection({ kind: "title", lessonId });
  return true;
}

function newLesson(ctx: CommandContext): boolean {
  const afterLessonId = ctx.selection.kind !== "none" ? ctx.selection.lessonId : null;
  const newId = ctx.actions.newLessonAfter(afterLessonId, ctx.editing.activeModuleId);
  if (!newId) return false;
  ctx.editing.setOpenLesson(newId);
  ctx.editing.focusSelection({ kind: "title", lessonId: newId });
  return true;
}

function previewLesson(ctx: CommandContext): boolean {
  if (ctx.selection.kind === "none") return false;
  ctx.actions.previewLesson(ctx.selection.lessonId);
  return true;
}

function renameModule(ctx: CommandContext): boolean {
  if (!ctx.editing.activeModuleId) return false;
  focusModuleName(ctx.editing.activeModuleId);
  return true;
}

function deleteLessonConfirm(ctx: CommandContext): boolean {
  if (ctx.selection.kind !== "title") return false;
  ctx.editing.requestDeleteConfirm(`lesson:${ctx.selection.lessonId}`);
  return true;
}

function deletePairCommand(ctx: CommandContext): boolean {
  if (ctx.selection.kind !== "field" || !ctx.selection.pieceId) return false;
  const { lessonId, blockId, pieceId } = ctx.selection;
  ctx.actions.deletePiece(lessonId, blockId, pieceId);
  return true;
}

// Remembers which field (spanish/english) opened the hint for a given piece,
// so leaving it (Enter/Escape) returns focus there instead of always the
// pair's Spanish field — the lightbulb button has no field of its own to
// remember, so it defaults to spanish (see sentence-editor.tsx's onClick).
const hintOrigin = new Map<string, "spanish" | "english">();

function requestHint(field: "spanish" | "english"): Command {
  return (ctx) => {
    if (ctx.selection.kind !== "field" || ctx.selection.field !== field || !ctx.selection.pieceId) {
      return false;
    }
    hintOrigin.set(ctx.selection.pieceId, field);
    const sel: EditingSelection = {
      kind: "field",
      lessonId: ctx.selection.lessonId,
      blockId: ctx.selection.blockId,
      field: "hint",
      pieceId: ctx.selection.pieceId,
    };
    ctx.editing.setSelection(sel);
    ctx.editing.focusSelection(sel);
    return true;
  };
}

function leaveHint(ctx: CommandContext): boolean {
  if (ctx.selection.kind !== "field" || ctx.selection.field !== "hint" || !ctx.selection.pieceId) {
    return false;
  }
  const { lessonId, blockId, pieceId } = ctx.selection;
  const lesson = findLesson(ctx.lessons, lessonId);
  const block = findBlock(lesson, blockId);
  const piece = block?.type === "sentence" ? block.languageBlocks.find((p) => p.id === pieceId) : undefined;
  if (piece && !piece.callout?.trim()) {
    ctx.actions.updateCallout(lessonId, blockId, pieceId, null);
  }
  const origin = hintOrigin.get(pieceId) ?? "spanish";
  hintOrigin.delete(pieceId);
  const sel: EditingSelection = { kind: "field", lessonId, blockId, field: origin, pieceId };
  ctx.editing.setSelection(sel);
  ctx.editing.focusSelection(sel);
  return true;
}

function blockNewlineOnly(): Command {
  return () => true; // consume Enter, insert nothing — single-line fields
}

function spanishAdvance(direction: "tab" | "shiftTab"): Command {
  return (ctx) => {
    if (ctx.selection.kind !== "field" || ctx.selection.field !== "spanish" || !ctx.selection.pieceId) {
      return false;
    }
    const { lessonId, blockId, pieceId } = ctx.selection;
    const lesson = findLesson(ctx.lessons, lessonId);
    const block = findBlock(lesson, blockId);
    if (!block || block.type !== "sentence") return false;
    const index = block.languageBlocks.findIndex((piece) => piece.id === pieceId);
    if (direction === "shiftTab") {
      if (index <= 0) return false;
      const prev = block.languageBlocks[index - 1];
      const sel: EditingSelection = { kind: "field", lessonId, blockId, field: "english", pieceId: prev.id };
      ctx.editing.setSelection(sel);
      ctx.editing.focusSelection(sel);
      return true;
    }
    const sel: EditingSelection = { kind: "field", lessonId, blockId, field: "english", pieceId };
    ctx.editing.setSelection(sel);
    ctx.editing.focusSelection(sel);
    return true;
  };
}

function englishAdvance(direction: "tab" | "shiftTab" | "enter"): Command {
  return (ctx) => {
    if (ctx.selection.kind !== "field" || ctx.selection.field !== "english" || !ctx.selection.pieceId) {
      return false;
    }
    const { lessonId, blockId, pieceId } = ctx.selection;
    const lesson = findLesson(ctx.lessons, lessonId);
    const block = findBlock(lesson, blockId);
    if (!block || block.type !== "sentence") return false;
    const index = block.languageBlocks.findIndex((piece) => piece.id === pieceId);
    const piece = block.languageBlocks[index];
    if (!piece) return false;
    const raw = asTextArea(ctx.event.target)?.value;
    if (raw !== undefined) commitAnswerDraft(ctx.actions, lessonId, blockId, piece, raw);
    const englishFilled = raw !== undefined && parseAnswerEntry(raw).length > 0;

    if (direction === "shiftTab") {
      const sel: EditingSelection = { kind: "field", lessonId, blockId, field: "spanish", pieceId };
      ctx.editing.setSelection(sel);
      ctx.editing.focusSelection(sel);
      return true;
    }

    const isLast = index === block.languageBlocks.length - 1;
    const spanishFilled = Boolean(piece.spanish.trim());

    if (!isLast) {
      const nextPiece = block.languageBlocks[index + 1];
      const sel: EditingSelection = { kind: "field", lessonId, blockId, field: "spanish", pieceId: nextPiece.id };
      ctx.editing.setSelection(sel);
      ctx.editing.focusSelection(sel);
      return true;
    }

    if (spanishFilled && englishFilled) {
      const newPieceId = ctx.actions.addPiece(lessonId, blockId);
      const sel: EditingSelection = { kind: "field", lessonId, blockId, field: "spanish", pieceId: newPieceId };
      ctx.editing.setSelection(sel, { reason: "insert" });
      ctx.editing.focusSelection(sel);
      return true;
    }

    if (direction === "enter" && !spanishFilled && !englishFilled) {
      const sel: EditingSelection = { kind: "block", lessonId, blockId };
      ctx.editing.setSelection(sel, { reason: "finish" });
      ctx.editing.focusSelection(sel);
      return true;
    }

    // Partially filled trailing pair: let Tab continue to the next real
    // focusable element instead of creating another blank pair; Enter does
    // nothing further here either.
    return false;
  };
}

// Duck-typed rather than `instanceof HTMLElement`/`HTMLTextAreaElement` —
// unit tests run under plain Node (no jsdom), where those globals don't
// exist at all; a real DOM node satisfies these shapes identically.
function asElement(target: EventTarget | null): { closest: (selector: string) => Element | null } | null {
  const candidate = target as { closest?: unknown } | null;
  return candidate && typeof candidate.closest === "function"
    ? (candidate as { closest: (selector: string) => Element | null })
    : null;
}

function asTextArea(target: EventTarget | null): { value: string } | null {
  const candidate = target as { value?: unknown } | null;
  return candidate && typeof candidate.value === "string" ? (candidate as { value: string }) : null;
}

// `ctx.selection` can be stale relative to real DOM focus — a Tab stop on
// some other button in the builder (drag handle, undo, preview…) doesn't
// itself write `none` (only a focusout leaving the whole builder does, per
// the design doc). So a field/title-shaped scope only applies when the key
// actually landed on that field's own element; otherwise the walk skips
// straight to block/lesson/page rather than letting a stray Enter/Tab/
// Space/Escape on an unrelated button get swallowed by e.g. the spanish
// scope's `Enter` (which always consumes it to block a newline).
const NON_FIELD_SCOPES = new Set<Scope>(["block", "lesson", "page"]);
function scopeMatchesTarget(scope: Scope, selection: EditingSelection, event: KeyboardEvent): boolean {
  if (NON_FIELD_SCOPES.has(scope)) return true;
  const target = asElement(event.target);
  if (!target) return false;
  if (scope === "title") {
    return selection.kind === "title" && Boolean(target.closest(`[data-lesson-title="${selection.lessonId}"]`));
  }
  return Boolean(target.closest(`[data-field="${scope}"]`));
}

function isNativeUndoTarget(event: KeyboardEvent): boolean {
  const target = asElement(event.target);
  return target ? Boolean(target.closest("input, textarea, [contenteditable='true']")) : false;
}

function undoCommand(ctx: CommandContext): boolean {
  if (isNativeUndoTarget(ctx.event)) return false;
  ctx.actions.undo();
  return true;
}

function redoCommand(ctx: CommandContext): boolean {
  if (isNativeUndoTarget(ctx.event)) return false;
  ctx.actions.redo();
  return true;
}

function saveCommand(ctx: CommandContext): boolean {
  ctx.actions.flushSave();
  return true;
}

function toggleHelp(ctx: CommandContext): boolean {
  if (!ctx.editing.helpOpen) rememberFocus();
  ctx.editing.setHelpOpen(!ctx.editing.helpOpen);
  return true;
}

// -----------------------------------------------------------------------
// The table
// -----------------------------------------------------------------------

const fieldScopes: Scope[] = ["explanation", "instruction", "spanish", "english"];

export const KEYMAP: Record<Scope, Partial<Record<Chord, Command>>> = {
  title: {
    Enter: enterFromTitle,
    "Ctrl+Alt+Enter": insertFromTitle,
    "Ctrl+Alt+ArrowUp": moveLessonCommand(-1),
    "Ctrl+Alt+ArrowDown": moveLessonCommand(1),
    "Ctrl+Alt+Backspace": deleteLessonConfirm,
  },
  explanation: {
    // Enter/marks/Ctrl+B/I stay inside explanation-editor.tsx (Phase 2).
  },
  instruction: {
    Enter: blockNewlineOnly(),
  },
  spanish: {
    Tab: spanishAdvance("tab"),
    "Shift+Tab": spanishAdvance("shiftTab"),
    Enter: blockNewlineOnly(),
    "Alt+ArrowDown": requestHint("spanish"),
    "Ctrl+Alt+Backspace": deletePairCommand,
  },
  english: {
    Tab: englishAdvance("tab"),
    "Shift+Tab": englishAdvance("shiftTab"),
    Enter: englishAdvance("enter"),
    "Alt+ArrowDown": requestHint("english"),
    "Ctrl+Alt+Backspace": deletePairCommand,
  },
  hint: {
    Enter: leaveHint,
    Escape: leaveHint,
  },
  block: {
    Enter: enterBlock,
    Space: enterBlock,
    Escape: escapeBlockToNone,
    "Ctrl+Alt+Enter": insertFromBlockOrField,
    "Ctrl+Alt+ArrowUp": moveBlockCommand(-1),
    "Ctrl+Alt+ArrowDown": moveBlockCommand(1),
  },
  lesson: {
    "Ctrl+Alt+D": finishLesson,
    "Ctrl+Alt+P": previewLesson,
  },
  page: {
    "Ctrl+Alt+L": newLesson,
    "Ctrl+Alt+M": renameModule,
    "Ctrl+Z": undoCommand,
    "Ctrl+Shift+Z": redoCommand,
    "Ctrl+S": saveCommand,
    "Ctrl+.": toggleHelp,
  },
};

// Escape in *any* field scope goes to "block" (§3) — registered once here
// rather than duplicated across the five field-scope entries above.
for (const scope of fieldScopes) {
  KEYMAP[scope] = { ...KEYMAP[scope], Escape: escapeToBlock };
}

// -----------------------------------------------------------------------
// The dispatcher: one capture-phase keydown listener, mounted once by
// LessonLibrary. Ignores composition and anything inside
// [data-keymap-ignore] (concept typeahead, quick-edit, the help dialog).
// -----------------------------------------------------------------------

export function dispatchKeymap(
  event: KeyboardEvent,
  ctx: Omit<CommandContext, "event">,
): void {
  if (event.isComposing) return;
  const target = asElement(event.target);
  if (target?.closest("[data-keymap-ignore]")) return;

  const chord = chordOf(event);
  for (const scope of scopeOf(ctx.selection)) {
    if (!scopeMatchesTarget(scope, ctx.selection, event)) continue;
    const command = KEYMAP[scope]?.[chord];
    if (!command) continue;
    const handled = command({ ...ctx, event });
    if (handled) event.preventDefault();
    return;
  }
}
