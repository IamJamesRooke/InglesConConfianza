// Spelled tokens as keycaps, builder side (owner, 2026-09-17; docs/design/
// speech.md "Audio-only marks" — `T-H-I-N-G`, the notation for a word the
// narrator spells letter by letter). The learner renderer
// (practice-markdown.tsx) splits a spelled token into one `<kbd>` per
// letter; a ProseMirror inline decoration can't do that — it wraps an
// existing text range without splitting it into per-character nodes — so
// the builder instead decorates the WHOLE token (hyphens included) as one
// rounded keycap strip: `letter-spacing` fans the letters out and the
// hyphens stay in the source untouched (this only ever decorates rendered
// output, never the document itself). Faithful in spirit, not pixel-for-
// pixel with the learner's split caps — see explanation-editor.css for the
// strip's own styling.
//
// A plain decoration plugin, not a mark: the pattern is derived from the
// text alone (unlike `lang`/`audio`, which the teacher toggles), so there is
// nothing for a mark to store — recomputing decorations from the doc on
// every transaction is cheap and always in sync, with no risk of a stale
// mark surviving an edit that changed the token.

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";

import { SPELLED_TOKEN } from "@/lib/learner/explanation-ssml";

const spelledTokenDecorationKey = new PluginKey("explanationSpelledToken");

function buildDecorations(doc: PMNode): DecorationSet {
  const decorations: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    for (const match of node.text.matchAll(SPELLED_TOKEN)) {
      const from = pos + (match.index ?? 0);
      const to = from + match[0].length;
      decorations.push(Decoration.inline(from, to, { class: "spelled-token" }));
    }
  });
  return DecorationSet.create(doc, decorations);
}

export const ExplanationSpelledToken = Extension.create({
  name: "explanationSpelledToken",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: spelledTokenDecorationKey,
        state: {
          init(_, state) {
            return buildDecorations(state.doc);
          },
          apply(transaction, decorationSet, _oldState, newState) {
            if (!transaction.docChanged) return decorationSet;
            return buildDecorations(newState.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
