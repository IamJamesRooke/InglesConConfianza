// `title` scope commands (open, insert, extend, move, delete) for the keymap split (see keymap/index.ts).

import { lockTitleDuringFocusTransfer } from "@/lib/lesson-builder/focus";
import type { EditingSelection } from "@/lib/lesson-builder/editing";
import {
  type Command,
  type CommandContext,
  fieldSelectionForBlock,
  findLesson,
  insertAfterBlock,
} from "./shared";

export function enterFromTitle(ctx: CommandContext): boolean {
  if (ctx.selection.kind !== "title") return false;
  const { lessonId } = ctx.selection;
  const lesson = findLesson(ctx.lessons, lessonId);
  if (!lesson) return false;
  // The target field's real DOM node — especially a fresh explanation's
  // ProseMirror editor — can still be a beat away from existing. Lock the
  // title read-only for that gap so a fast typist's next keystrokes are
  // dropped rather than landing back in the title. See focus.ts.
  lockTitleDuringFocusTransfer(lessonId);
  ctx.editing.setOpenLesson(lessonId);
  const first = lesson.blocks[0];
  if (first) {
    const sel = fieldSelectionForBlock(lessonId, first);
    ctx.editing.setSelection(sel);
    ctx.editing.focusSelection(sel);
    return true;
  }
  const { blockId } = ctx.actions.addBlock(lessonId, "explanation", 0);
  const sel: EditingSelection = { kind: "field", lessonId, blockId, field: "explanation" };
  ctx.editing.setSelection(sel, { reason: "insert" });
  ctx.editing.focusSelection(sel);
  return true;
}

export function insertFromTitle(ctx: CommandContext): boolean {
  if (ctx.selection.kind !== "title") return false;
  return insertAfterBlock(ctx, ctx.selection.lessonId, undefined);
}

// E3b — "extend the last sentence" (Ctrl+Alt+Shift+Enter): a new sentence
// slide copying the nearest preceding sentence slide's pieces plus one new
// empty pair, focused. Registered only on `title`/`block` (never per-field)
// exactly like `Ctrl+Alt+Enter` above — every field scope still reaches it
// because `scopeOf` always appends `block` after the field.
export function extendAfterBlock(ctx: CommandContext, lessonId: string, afterBlockId: string | null): boolean {
  const { blockId, languageBlockId } = ctx.actions.extendLastSentence(lessonId, afterBlockId);
  const sel: EditingSelection = {
    kind: "field",
    lessonId,
    blockId,
    field: "spanish",
    pieceId: languageBlockId,
  };
  ctx.editing.setOpenLesson(lessonId);
  ctx.editing.setSelection(sel, { reason: "insert" });
  ctx.editing.focusSelection(sel);
  return true;
}

export function extendFromTitle(ctx: CommandContext): boolean {
  if (ctx.selection.kind !== "title") return false;
  return extendAfterBlock(ctx, ctx.selection.lessonId, null);
}

export function moveLessonCommand(direction: -1 | 1): Command {
  return (ctx) => {
    if (ctx.selection.kind !== "title") return false;
    const destination = ctx.actions.moveLessonKeyboard(ctx.selection.lessonId, direction);
    if (destination) ctx.editing.setActiveModule(destination);
    ctx.editing.focusSelection(ctx.selection);
    return true;
  };
}

export function deleteLessonConfirm(ctx: CommandContext): boolean {
  if (ctx.selection.kind !== "title") return false;
  ctx.editing.requestDeleteConfirm(`lesson:${ctx.selection.lessonId}`);
  return true;
}
