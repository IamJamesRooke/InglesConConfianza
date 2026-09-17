// Shared types, chord/scope resolution, and cross-scope helpers for the keymap split (see keymap/index.ts).

import type { DocumentBlockType } from "@/components/lesson-builder/slide-insert-control";
import type { EditingActions, EditingSelection } from "@/lib/lesson-builder/editing";
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

export function findLesson(lessons: Lesson[], lessonId: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === lessonId);
}

export function findBlock(lesson: Lesson | undefined, blockId: string): LessonBlock | undefined {
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

export function insertAfterBlock(ctx: CommandContext, lessonId: string, block: LessonBlock | undefined): boolean {
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
    const { blockId: newBlockId } = ctx.actions.addBlock(lessonId, nextType, position);
    pendingInsert = { lessonId, blockId: newBlockId, type: nextType, at: now };
    const sel = selectionForNewBlock(lessonId, newBlockId, nextType);
    ctx.editing.setSelection(sel, { reason: "insert" });
    ctx.editing.focusSelection(sel);
    return true;
  }
  const index = block ? lesson.blocks.findIndex((candidate) => candidate.id === block.id) + 1 : 0;
  const type = predictedType(block);
  const { blockId: newBlockId } = ctx.actions.addBlock(lessonId, type, index);
  pendingInsert = { lessonId, blockId: newBlockId, type, at: now };
  const sel = selectionForNewBlock(lessonId, newBlockId, type);
  ctx.editing.setOpenLesson(lessonId);
  ctx.editing.setSelection(sel, { reason: "insert" });
  ctx.editing.focusSelection(sel);
  return true;
}

// -----------------------------------------------------------------------
// Field-only commands shared by more than one scope (blockNewlineOnly is
// used by both `instruction` and `spanish`).
// -----------------------------------------------------------------------

export function blockNewlineOnly(): Command {
  return () => true; // consume Enter, insert nothing — single-line fields
}

// Duck-typed rather than `instanceof HTMLElement`/`HTMLTextAreaElement` —
// unit tests run under plain Node (no jsdom), where those globals don't
// exist at all; a real DOM node satisfies these shapes identically.
export function asElement(target: EventTarget | null): { closest: (selector: string) => Element | null } | null {
  const candidate = target as { closest?: unknown } | null;
  return candidate && typeof candidate.closest === "function"
    ? (candidate as { closest: (selector: string) => Element | null })
    : null;
}

export function asTextArea(target: EventTarget | null): { value: string } | null {
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
export function scopeMatchesTarget(scope: Scope, selection: EditingSelection, event: KeyboardEvent): boolean {
  if (NON_FIELD_SCOPES.has(scope)) return true;
  const target = asElement(event.target);
  if (!target) return false;
  if (scope === "title") {
    return selection.kind === "title" && Boolean(target.closest(`[data-lesson-title="${selection.lessonId}"]`));
  }
  return Boolean(target.closest(`[data-field="${scope}"]`));
}

export function isNativeUndoTarget(event: KeyboardEvent): boolean {
  const target = asElement(event.target);
  return target ? Boolean(target.closest("input, textarea, [contenteditable='true']")) : false;
}
