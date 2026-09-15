// Ergonomics E1: typing "<Spanish> es <English>." marks the two halves for
// the teacher — `Quiero es I want.` becomes `[[es:Quiero]] es [[en:I want]].`
// the moment the terminator (or Enter) lands. Ported from the Phase 2 spike,
// which verified the one property that makes this safe to ship on: the marks
// are their own history step, so a single Ctrl+Z removes them and leaves the
// typed text alone.

import { Extension } from "@tiptap/core";
import { closeHistory, isHistoryTransaction } from "@tiptap/pm/history";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorState } from "@tiptap/pm/state";
import type { Node as PMNode } from "@tiptap/pm/model";

import { planEsEnMarks } from "@/lib/lesson-builder/explanation-classifier";

type Candidate = { node: PMNode; start: number };

function hasLangMark(node: PMNode): boolean {
  let found = false;
  node.descendants((child) => {
    if (child.marks.some((mark) => mark.type.name === "lang")) found = true;
    return !found;
  });
  return found;
}

export const explanationAutoMarkKey = new PluginKey("explanationAutoMark");

// The paragraph the rule looks at: the one holding the caret when it ends in
// a terminator (". ! ?" just typed), or the one just left behind when Enter
// opened a fresh empty paragraph.
function candidateParagraph(state: EditorState): Candidate | null {
  const { selection } = state;
  if (!selection.empty) return null;
  const $from = selection.$from;
  const parent = $from.parent;
  if (!parent.isTextblock) return null;
  if (parent.content.size > 0 && $from.parentOffset === parent.content.size) {
    return /[.!?]$/u.test(parent.textContent) ? { node: parent, start: $from.start() } : null;
  }
  if (parent.content.size === 0 && $from.depth > 0) {
    const index = $from.index(-1);
    if (index <= 0) return null;
    const previous = $from.node(-1).child(index - 1);
    if (!previous.isTextblock || previous.content.size === 0) return null;
    return { node: previous, start: $from.before() - previous.nodeSize + 1 };
  }
  return null;
}

export const ExplanationAutoMark = Extension.create({
  name: "explanationAutoMark",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: explanationAutoMarkKey,
        appendTransaction(transactions, _oldState, newState) {
          if (!transactions.some((transaction) => transaction.docChanged)) return null;
          // Undo/redo re-runs the document through here; without this the
          // rule would instantly re-apply the marks the teacher just undid.
          if (transactions.some((transaction) => isHistoryTransaction(transaction))) return null;

          const candidate = candidateParagraph(newState);
          if (!candidate) return null;
          // Already marked (by hand, or by this rule a keystroke ago).
          if (hasLangMark(candidate.node)) return null;

          const plan = planEsEnMarks(candidate.node.textContent);
          if (!plan) return null;

          const lang = newState.schema.marks.lang;
          const base = candidate.start;
          const transaction = newState.tr;
          transaction.addMark(
            base + plan.spanish.from,
            base + plan.spanish.to,
            lang.create({ language: "es" }),
          );
          transaction.addMark(
            base + plan.english.from,
            base + plan.english.to,
            lang.create({ language: "en" }),
          );
          // Its own undo step: one Ctrl+Z takes the marks off and leaves the
          // sentence exactly as typed.
          return closeHistory(transaction);
        },
      }),
    ];
  },
});
