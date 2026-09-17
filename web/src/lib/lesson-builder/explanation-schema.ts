// The explanation editor's ProseMirror schema — exactly the constructs the
// teacher's dialect uses, and nothing else: doc / paragraph / text /
// hardBreak, marks bold, italic and `lang` (es|en). Ported from the Phase 2
// Tiptap spike (verified round-trip against all real explanations).
//
// Deliberately NOT @tiptap/starter-kit: its default config also brings
// headings, lists, blockquote, code, horizontal rules and links, none of
// which appear in a single real explanation block and all of which would
// then be reachable by paste.

import { Extension, Mark, mergeAttributes } from "@tiptap/core";
import Bold from "@tiptap/extension-bold";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Italic from "@tiptap/extension-italic";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { history, redo, undo } from "@tiptap/pm/history";

export type Language = "es" | "en";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    lang: {
      setLang: (language: Language) => ReturnType;
      unsetLang: () => ReturnType;
    };
  }
}

// An `en` mark's optional pronunciation bridge (`different|DIFF-rent`) — see
// docs/design/speech.md "Explanation voice track" and
// explanation-markdown.ts. Stored as `data-bridge` so it survives the
// markdown ⇄ ProseMirror round-trip through this schema unchanged; the
// learner presentation strips it from what's displayed, a later session
// shows it small.

// Renders `<mark data-language="es|en">` so the existing
// `.lesson-document-explanation mark` styling keeps working unchanged, and
// so the learner-side renderer and this editor agree on the DOM shape.
//
// PM's default `excludes` is the mark's own name, so a `lang` mark excludes
// itself: marking an `es` run as `en` *replaces* the mark instead of nesting
// one inside the other. That single property is what fixes the owner's
// corruption bug — the old contentEditable code produced overlapping
// `<mark>` elements and the serializer then emitted unbalanced `[[es:…`.
// Bold/italic can still stack on top of a `lang` mark.
const Lang = Mark.create({
  name: "lang",
  // Not inclusive: typing immediately after a marked run starts *outside*
  // the mark. A language mark names a specific word or phrase, so continuing
  // the sentence must not silently extend it (bold/italic keep the usual
  // word-processor behaviour, where carrying on is what you want).
  inclusive: false,
  addAttributes() {
    return {
      language: {
        default: "es" as Language,
        parseHTML: (element) => element.getAttribute("data-language"),
        renderHTML: (attributes) => ({ "data-language": attributes.language }),
      },
      bridge: {
        default: null as string | null,
        parseHTML: (element) => element.getAttribute("data-bridge"),
        renderHTML: (attributes) =>
          attributes.bridge ? { "data-bridge": attributes.bridge } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: "mark[data-language]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["mark", mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setLang:
        (language: Language) =>
        ({ commands }) =>
          commands.setMark(this.name, { language }),
      unsetLang:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

// Text-level undo/redo *inside* one explanation. Structural undo (add/delete/
// move a slide, edit a sentence pair) stays in the document reducer; the
// keymap's page-scope Ctrl+Z already declines to handle a key pressed inside
// a contenteditable (`isNativeUndoTarget`), so the two never fight.
//
// Hand-rolled over `@tiptap/pm/history` rather than pulling in Tiptap's
// `@tiptap/extension-undo-redo` package: the history plugin ships inside
// `@tiptap/pm`, which is already a dependency, and the wrapper is five lines.
const ExplanationHistory = Extension.create({
  name: "explanationHistory",
  addProseMirrorPlugins() {
    return [history()];
  },
  addKeyboardShortcuts() {
    return {
      "Mod-z": () => undo(this.editor.state, this.editor.view.dispatch),
      "Mod-Z": () => undo(this.editor.state, this.editor.view.dispatch),
      "Shift-Mod-z": () => redo(this.editor.state, this.editor.view.dispatch),
      "Shift-Mod-Z": () => redo(this.editor.state, this.editor.view.dispatch),
    };
  },
});

export const baseExplanationExtensions = [
  Document,
  Paragraph,
  Text,
  HardBreak,
  Bold,
  Italic,
  Lang,
  ExplanationHistory,
];
