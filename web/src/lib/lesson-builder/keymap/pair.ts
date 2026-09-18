// `instruction`/`spanish`/`english`/`hint` scope commands (pair navigation, hints, given) for the keymap split (see keymap/index.ts).

import { parseAnswerEntry } from "@/lib/lesson-builder/answer-entry";
import { commitAnswerDraft } from "@/lib/lesson-builder/editing";
import type { EditingSelection } from "@/lib/lesson-builder/editing";
import { asTextArea, type Command, type CommandContext, findBlock, findLesson } from "./shared";

export function deletePairCommand(ctx: CommandContext): boolean {
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

export function requestHint(field: "spanish" | "english"): Command {
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

export function leaveHint(ctx: CommandContext): boolean {
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

// E8 — Ctrl+Alt+G in a spanish/english field toggles the pair's "given"
// flag (shown to the student, not tested — see types.ts). Registered on
// both field scopes since either field can have focus when the teacher
// reaches for it.
export function toggleGivenCommand(ctx: CommandContext): boolean {
  if (
    ctx.selection.kind !== "field" ||
    (ctx.selection.field !== "spanish" && ctx.selection.field !== "english") ||
    !ctx.selection.pieceId
  ) {
    return false;
  }
  const { lessonId, blockId, pieceId } = ctx.selection;
  ctx.actions.toggleGiven(lessonId, blockId, pieceId);
  return true;
}

// Ctrl+Alt+K in a spanish/english field turns the pair into a capture piece
// (the learner types their own answer and the app stores it — see
// docs/design/onboarding.md "The capture piece") and back. Same shape and
// same two scopes as toggleGivenCommand; `K` for "keep".
export function toggleCaptureCommand(ctx: CommandContext): boolean {
  if (
    ctx.selection.kind !== "field" ||
    (ctx.selection.field !== "spanish" && ctx.selection.field !== "english") ||
    !ctx.selection.pieceId
  ) {
    return false;
  }
  const { lessonId, blockId, pieceId } = ctx.selection;
  ctx.actions.toggleCapture(lessonId, blockId, pieceId);
  return true;
}

export function spanishAdvance(direction: "tab" | "shiftTab"): Command {
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

export function englishAdvance(direction: "tab" | "shiftTab" | "enter"): Command {
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
