// `explanation` scope commands (language marking, bold/italic) for the keymap split (see keymap/index.ts).

import {
  getExplanationEditor,
  setExplanationLanguage,
  toggleExplanationMark,
} from "@/lib/lesson-builder/explanation-commands";
import type { Command } from "./shared";

// Ctrl+Alt+S / Ctrl+Alt+E / Ctrl+Alt+N inside an explanation. The editor is
// found by blockId rather than by reaching into the DOM or the event target,
// so the chord means the same thing however focus got there.
export function languageCommand(language: "es" | "en" | null): Command {
  return (ctx) => {
    if (ctx.selection.kind !== "field" || ctx.selection.field !== "explanation") return false;
    const editor = getExplanationEditor(ctx.selection.blockId);
    if (!editor) return false;
    return setExplanationLanguage(editor, language);
  };
}

export function markCommand(mark: "bold" | "italic"): Command {
  return (ctx) => {
    if (ctx.selection.kind !== "field" || ctx.selection.field !== "explanation") return false;
    const editor = getExplanationEditor(ctx.selection.blockId);
    if (!editor) return false;
    return toggleExplanationMark(editor, mark);
  };
}
