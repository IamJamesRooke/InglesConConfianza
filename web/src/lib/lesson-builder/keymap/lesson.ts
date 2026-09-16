// `lesson` scope commands (finish, preview, script view) for the keymap split (see keymap/index.ts).

import type { CommandContext } from "./shared";

export function finishLesson(ctx: CommandContext): boolean {
  if (ctx.selection.kind === "none") return false;
  const { lessonId } = ctx.selection;
  ctx.editing.setSelection({ kind: "none" }, { reason: "finish" });
  ctx.editing.setOpenLesson(null);
  ctx.actions.flushSave();
  ctx.editing.focusSelection({ kind: "title", lessonId });
  return true;
}

// E4 — Ctrl+Alt+T toggles the script view for the selected lesson. Reached
// from title/block/field scopes via the usual `lesson` scope fallthrough;
// the textarea itself (data-keymap-ignore) handles the same chord to close
// again, since the global dispatcher never sees keys typed inside it.
export function toggleScriptView(ctx: CommandContext): boolean {
  if (ctx.selection.kind === "none") return false;
  const { lessonId } = ctx.selection;
  const isOpen = ctx.editing.scriptViewLessonId === lessonId;
  ctx.editing.setOpenLesson(lessonId);
  ctx.editing.setScriptView(isOpen ? null : lessonId);
  return true;
}

export function previewLesson(ctx: CommandContext): boolean {
  if (ctx.selection.kind === "none") return false;
  ctx.actions.previewLesson(ctx.selection.lessonId);
  return true;
}
