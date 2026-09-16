// The Lesson Builder's one keymap: one chord table, one dispatcher. See
// docs/design/lesson-builder-editing-model.md §3 — this module's shape
// (types, exports) is the contract; each scope's commands live in their own
// file (title.ts, explanation.ts, pair.ts, block.ts, lesson.ts, page.ts) and
// this file assembles KEYMAP and the dispatcher from them.

import { languageCommand, markCommand } from "./explanation";
import {
  escapeBlockToNone,
  escapeToBlock,
  enterBlock,
  extendFromBlockOrField,
  insertFromBlockOrField,
  moveBlockCommand,
} from "./block";
import { finishLesson, previewLesson, toggleScriptView } from "./lesson";
import { newLesson, redoCommand, renameModule, saveCommand, toggleHelp, undoCommand } from "./page";
import {
  deletePairCommand,
  englishAdvance,
  leaveHint,
  requestHint,
  spanishAdvance,
  toggleGivenCommand,
} from "./pair";
import {
  type Chord,
  type Command,
  type CommandContext,
  type Scope,
  asElement,
  blockNewlineOnly,
  chordOf,
  fieldSelectionForBlock,
  scopeMatchesTarget,
  scopeOf,
  selectionForInsertion,
  selectionForNewBlock,
} from "./shared";
import { deleteLessonConfirm, enterFromTitle, insertFromTitle, extendFromTitle, moveLessonCommand } from "./title";

export type { Chord, Command, CommandContext, Scope };
export { chordOf, fieldSelectionForBlock, scopeOf, selectionForInsertion, selectionForNewBlock };

// -----------------------------------------------------------------------
// The table
// -----------------------------------------------------------------------

const fieldScopes: Scope[] = ["explanation", "instruction", "spanish", "english"];

export const KEYMAP: Record<Scope, Partial<Record<Chord, Command>>> = {
  title: {
    Enter: enterFromTitle,
    "Ctrl+Alt+Enter": insertFromTitle,
    "Ctrl+Alt+Shift+Enter": extendFromTitle,
    "Ctrl+Alt+ArrowUp": moveLessonCommand(-1),
    "Ctrl+Alt+ArrowDown": moveLessonCommand(1),
    "Ctrl+Alt+Backspace": deleteLessonConfirm,
  },
  explanation: {
    // Language marking (Phase 2). The commands reach the mounted Tiptap
    // editor through the registry, keyed by the selection's blockId.
    "Ctrl+Alt+S": languageCommand("es"),
    "Ctrl+Alt+E": languageCommand("en"),
    "Ctrl+Alt+N": languageCommand(null),
    // Bold/italic go through this table too, rather than being left to
    // Tiptap's own `Mod-b`/`Mod-i`: the dispatcher sees the key first, and
    // only this path flushes the pending DOM selection before reading it
    // (ProseMirror learns about a Shift+Arrow selection asynchronously, so a
    // chord fired immediately after one would format a stale range).
    "Ctrl+B": markCommand("bold"),
    "Ctrl+I": markCommand("italic"),
    // Enter (paragraph), Shift+Enter (hard break), arrows and Backspace are
    // text-editing semantics and are not in this table at all, so they fall
    // through to Tiptap untouched.
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
    "Ctrl+Alt+G": toggleGivenCommand,
  },
  english: {
    Tab: englishAdvance("tab"),
    "Shift+Tab": englishAdvance("shiftTab"),
    Enter: englishAdvance("enter"),
    "Alt+ArrowDown": requestHint("english"),
    "Ctrl+Alt+Backspace": deletePairCommand,
    "Ctrl+Alt+G": toggleGivenCommand,
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
    "Ctrl+Alt+Shift+Enter": extendFromBlockOrField,
    "Ctrl+Alt+ArrowUp": moveBlockCommand(-1),
    "Ctrl+Alt+ArrowDown": moveBlockCommand(1),
  },
  lesson: {
    "Ctrl+Alt+D": finishLesson,
    "Ctrl+Alt+P": previewLesson,
    "Ctrl+Alt+T": toggleScriptView,
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
    if (handled) {
      event.preventDefault();
      // `preventDefault` alone does not stop the event travelling on to the
      // element it landed on — and inside an explanation that element is
      // ProseMirror's contenteditable, whose own keydown handler would then
      // *also* act on the chord (Phase 2 spike finding). A chord this table
      // has handled is finished.
      // Duck-typed like the target helpers above: the unit tests dispatch
      // plain object events with no DOM methods on them.
      if (typeof event.stopPropagation === "function") event.stopPropagation();
    }
    return;
  }
}
