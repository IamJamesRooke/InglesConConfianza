// `page` scope commands (new lesson, rename module, undo/redo, save, help) for the keymap split (see keymap/index.ts).

import { focusModuleName, rememberFocus } from "@/lib/lesson-builder/focus";
import { isNativeUndoTarget, type CommandContext } from "./shared";

export function newLesson(ctx: CommandContext): boolean {
  const afterLessonId = ctx.selection.kind !== "none" ? ctx.selection.lessonId : null;
  const newId = ctx.actions.newLessonAfter(afterLessonId, ctx.editing.activeModuleId);
  if (!newId) return false;
  ctx.editing.setOpenLesson(newId);
  ctx.editing.focusSelection({ kind: "title", lessonId: newId });
  return true;
}

export function renameModule(ctx: CommandContext): boolean {
  if (!ctx.editing.activeModuleId) return false;
  focusModuleName(ctx.editing.activeModuleId);
  return true;
}

export function undoCommand(ctx: CommandContext): boolean {
  if (isNativeUndoTarget(ctx.event)) return false;
  ctx.actions.undo();
  return true;
}

export function redoCommand(ctx: CommandContext): boolean {
  if (isNativeUndoTarget(ctx.event)) return false;
  ctx.actions.redo();
  return true;
}

export function saveCommand(ctx: CommandContext): boolean {
  ctx.actions.flushSave();
  return true;
}

export function toggleHelp(ctx: CommandContext): boolean {
  if (!ctx.editing.helpOpen) rememberFocus();
  ctx.editing.setHelpOpen(!ctx.editing.helpOpen);
  return true;
}
