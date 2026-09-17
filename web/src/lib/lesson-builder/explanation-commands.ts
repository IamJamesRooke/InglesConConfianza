// The seam between the builder's one keymap and the mounted Tiptap editors.
//
// A mounted explanation editor registers itself by blockId; the keymap's
// `explanation`-scope commands (and the floating toolbar, which calls the
// same functions) look one up by the selection's blockId. Nothing outside
// this file reaches for an Editor instance.

import type { Editor } from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";
import type { EditorState, Transaction } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

import type { Language } from "@/lib/lesson-builder/explanation-schema";

const editors = new Map<string, Editor>();

export function registerExplanationEditor(blockId: string, editor: Editor): void {
  editors.set(blockId, editor);
}

export function unregisterExplanationEditor(blockId: string, editor: Editor): void {
  if (editors.get(blockId) === editor) editors.delete(blockId);
}

export function getExplanationEditor(blockId: string): Editor | undefined {
  return editors.get(blockId);
}

// ------------------------------------------------------------------------

const WORD_CHARACTER = /[\p{L}\p{M}\p{N}'’-]/u;

/** The word around a collapsed caret, as a document range — the chord
 * shortcut "mark the word I'm standing in" for all three language chords.
 * Returns null when the caret isn't touching a word at all. */
function wordRangeAt(state: EditorState, pos: number): { from: number; to: number } | null {
  const $pos = state.doc.resolve(pos);
  const parent = $pos.parent;
  if (!parent.isTextblock) return null;
  const text = parent.textContent;
  const start = $pos.start();
  let from = pos - start;
  let to = from;
  while (from > 0 && WORD_CHARACTER.test(text[from - 1])) from -= 1;
  while (to < text.length && WORD_CHARACTER.test(text[to])) to += 1;
  if (from === to) return null;
  return { from: start + from, to: start + to };
}

function targetRange(state: EditorState): { from: number; to: number } | null {
  const { from, to } = state.selection;
  if (from !== to) return { from, to };
  return wordRangeAt(state, from);
}

/** True when *every* text node in the range carries `lang` at this language
 * — i.e. the chord is a toggle-off rather than a re-mark. */
function fullyMarked(state: EditorState, from: number, to: number, language: Language): boolean {
  let complete = true;
  let sawText = false;
  state.doc.nodesBetween(from, to, (node) => {
    if (!node.isText) return true;
    sawText = true;
    const mark = node.marks.find((candidate) => candidate.type.name === "lang");
    if (!mark || mark.attrs.language !== language) complete = false;
    return true;
  });
  return sawText && complete;
}

// ProseMirror learns about a caret move (an arrow key, a Shift+Arrow
// selection) from the browser's `selectionchange` event, which fires
// *asynchronously*. A chord pressed immediately after the last Shift+Arrow
// would otherwise be applied to a selection one keystroke stale — marking
// "quiere" where the teacher selected "quieres". Flushing the observer first
// pulls the live DOM selection into the state before we read it.
function flushDomSelection(view: EditorView): void {
  const observer = (view as unknown as { domObserver?: { flush?: () => void } }).domObserver;
  if (observer && typeof observer.flush === "function") observer.flush();
}

function apply(editor: Editor, build: (state: EditorState, tr: Transaction) => boolean): boolean {
  const { view } = editor;
  flushDomSelection(view);
  const state = editor.state;
  const transaction = state.tr;
  if (!build(state, transaction)) return false;
  // Formatting is never coalesced with the typing around it: one Ctrl+Z
  // takes the mark off, a second one goes back to the text before it.
  transaction.setMeta("addToHistory", true);
  view.dispatch(transaction);
  view.focus();
  return true;
}

/** `Ctrl+Alt+S` / `Ctrl+Alt+E` (language) and `Ctrl+Alt+N` (null = Normal).
 * Selection if there is one, otherwise the word around the caret. Marking
 * across an existing mark of the other language *replaces* it rather than
 * nesting, because the `lang` mark excludes itself — the whole point of the
 * schema. Re-applying the language already there removes it. */
export function setExplanationLanguage(editor: Editor, language: Language | null): boolean {
  return apply(editor, (state, transaction) => {
    const range = targetRange(state);
    if (!range) return false;
    const { from, to } = range;
    const type = state.schema.marks.lang;
    const remove = language === null || fullyMarked(state, from, to, language);
    transaction.removeMark(from, to, type);
    if (!remove && language) transaction.addMark(from, to, type.create({ language }));
    transaction.setSelection(
      TextSelection.create(transaction.doc, state.selection.from, state.selection.to),
    );
    transaction.setStoredMarks([]);
    return true;
  });
}

/**
 * Sets (or clears, with `bridge: null`) the pronunciation-bridge attribute
 * on the `en` mark the caret is inside, or on a selection — see
 * docs/design/speech.md "Explanation voice track" and the `Lang` mark's
 * `bridge` attribute in explanation-schema.ts. `extendMarkRange` grows a
 * collapsed caret to the mark's own boundaries first, so a bridge typed
 * while the caret merely sits inside a marked word (no selection) still
 * lands on the whole word, matching how the language chords already treat
 * a collapsed caret. No-ops (returns false) when the caret/selection isn't
 * inside an `en` mark at all.
 */
export function setExplanationBridge(editor: Editor, bridge: string | null): boolean {
  if (!editor.isActive("lang", { language: "en" })) return false;
  return editor
    .chain()
    .focus()
    .extendMarkRange("lang")
    .updateAttributes("lang", { bridge: bridge && bridge.trim() ? bridge.trim() : null })
    .run();
}

/** Bold/italic, from the toolbar and from `Ctrl/⌘+B` / `Ctrl/⌘+I`. Tiptap's
 * Bold/Italic extensions bind `Mod-b`/`Mod-i` themselves, but the chord goes
 * through the shared KEYMAP instead, for the same reason the language chords
 * do: the dispatcher sees the key first, and only this path flushes the
 * pending DOM selection before reading it. */
export function toggleExplanationMark(editor: Editor, mark: "bold" | "italic"): boolean {
  flushDomSelection(editor.view);
  return editor.chain().focus().toggleMark(mark).run();
}
