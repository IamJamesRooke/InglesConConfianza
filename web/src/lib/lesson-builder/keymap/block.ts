// `block` scope commands (enter/escape/move/insert/extend on a selected slide) for the keymap split (see keymap/index.ts).

import type { EditingSelection } from "@/lib/lesson-builder/editing";
import { extendAfterBlock } from "./title";
import {
  type Command,
  type CommandContext,
  fieldSelectionForBlock,
  findBlock,
  findLesson,
  insertAfterBlock,
} from "./shared";

export function enterBlock(ctx: CommandContext): boolean {
  if (ctx.selection.kind !== "block") return false;
  const lesson = findLesson(ctx.lessons, ctx.selection.lessonId);
  const block = findBlock(lesson, ctx.selection.blockId);
  if (!block) return false;
  const sel = fieldSelectionForBlock(ctx.selection.lessonId, block);
  ctx.editing.setSelection(sel);
  ctx.editing.focusSelection(sel);
  return true;
}

export function escapeToBlock(ctx: CommandContext): boolean {
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
export function escapeBlockToNone(ctx: CommandContext): boolean {
  if (ctx.selection.kind !== "block") return false;
  const sel: EditingSelection = { kind: "none" };
  ctx.editing.setSelection(sel, { reason: "escape" });
  ctx.editing.focusSelection(sel);
  return true;
}

export function moveBlockCommand(direction: -1 | 1): Command {
  return (ctx) => {
    if (ctx.selection.kind !== "block" && ctx.selection.kind !== "field") return false;
    ctx.actions.moveBlock(ctx.selection.lessonId, ctx.selection.blockId, direction);
    return true;
  };
}

export function insertFromBlockOrField(ctx: CommandContext): boolean {
  if (ctx.selection.kind !== "block" && ctx.selection.kind !== "field") return false;
  const { lessonId, blockId } = ctx.selection;
  const lesson = findLesson(ctx.lessons, lessonId);
  const block = findBlock(lesson, blockId);
  if (!block) return false;
  return insertAfterBlock(ctx, lessonId, block);
}

export function extendFromBlockOrField(ctx: CommandContext): boolean {
  if (ctx.selection.kind !== "block" && ctx.selection.kind !== "field") return false;
  return extendAfterBlock(ctx, ctx.selection.lessonId, ctx.selection.blockId);
}
