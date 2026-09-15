"use client";

// The explanation slide's editor: Tiptap/ProseMirror over the trimmed
// schema in lib/lesson-builder/explanation-schema.ts. It replaces the
// hand-rolled contentEditable editor (execCommand + Range surgery), whose
// marks corrupted whenever a new mark crossed an existing one.
//
// Contract with lesson-document.tsx is unchanged: `contentMarkdown` in,
// `onChange(markdown)` out. Everything in between — parsing, marks,
// history, paste — is the editor's own business.

import { Slice } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";

import {
  registerExplanationEditor,
  setExplanationLanguage,
  toggleExplanationMark,
  unregisterExplanationEditor,
} from "@/lib/lesson-builder/explanation-commands";
import { ExplanationAutoMark } from "@/lib/lesson-builder/explanation-e1";
import {
  parseExplanation,
  serializeExplanationDoc,
  type PMDoc,
} from "@/lib/lesson-builder/explanation-markdown";
import { baseExplanationExtensions } from "@/lib/lesson-builder/explanation-schema";

const extensions = [...baseExplanationExtensions, ExplanationAutoMark];

// Paste, in three cases:
//
//  1. **Our own content** (another explanation, or anything carrying
//     `mark[data-language]`): let ProseMirror do its normal thing. Its
//     clipboard HTML round-trips through this schema, so the Spanish/English
//     marks, bold and italic survive the trip — the owner copies marked runs
//     between slides and expects them to arrive marked.
//  2. **Our dialect as plain text** (`[[es:sí]] es [[en:yes]]`, pasted from a
//     note or a chat): parse it, so the teacher sees marks and not brackets.
//  3. **Foreign HTML** (a web page, a doc): flatten to plain paragraphs.
//     Styles, links, lists and headings are dropped on purpose — this is the
//     teacher's bilingual dialect, not a web page.
function handleExplanationPaste(view: EditorView, event: ClipboardEvent): boolean {
  const clipboard = event.clipboardData;
  if (!clipboard) return false;
  const html = clipboard.getData("text/html");
  const text = clipboard.getData("text/plain");

  if (html && (html.includes("data-pm-slice") || html.includes("data-language="))) return false;

  if (text && /\[\[(?:es|en):/u.test(text)) {
    return insertParagraphs(view, parseExplanation(text));
  }

  if (html) return insertParagraphs(view, parseExplanation(htmlToPlainText(html)));

  return false;
}

// Only genuine block-level boundaries become a paragraph break, so a
// one-sentence inline-formatted snippet stays one paragraph instead of
// exploding into five.
function htmlToPlainText(html: string): string {
  const template = document.createElement("template");
  template.innerHTML = html;
  for (const element of Array.from(
    template.content.querySelectorAll("p, div, li, h1, h2, h3, h4, h5, h6, br, tr"),
  )) {
    element.after(document.createTextNode("\n\n"));
  }
  return (template.content.textContent ?? "").replace(/\n{3,}/gu, "\n\n").trim();
}

function insertParagraphs(view: EditorView, doc: PMDoc): boolean {
  const node = view.state.schema.nodeFromJSON(doc);
  if (node.content.size === 0) return true;
  // openStart/openEnd 1: a single pasted paragraph merges into the paragraph
  // the caret is in rather than splitting it.
  view.dispatch(view.state.tr.replaceSelection(new Slice(node.content, 1, 1)).scrollIntoView());
  return true;
}

export function EditablePracticeMarkdown({
  blockId,
  markdown,
  onChange,
  placeholder,
  ariaLabel,
  fieldName,
  variant = "explanation",
  showSelectionMenu = true,
  onFocus,
}: {
  // Identifies this editor in the registry the keymap's explanation-scope
  // commands look up (lib/lesson-builder/explanation-commands.ts).
  blockId: string;
  markdown: string;
  onChange: (markdown: string) => void;
  placeholder: string;
  ariaLabel: string;
  fieldName?: string;
  variant?: "explanation" | "document";
  showSelectionMenu?: boolean;
  // Reports real focus into the shared selection (editing.ts) — the keymap
  // dispatcher's only source of truth for "which field is current."
  onFocus?: () => void;
}) {
  const [isActive, setIsActive] = useState(false);
  // Tiptap 3 does not re-render its React host on every transaction (a
  // deliberate performance default), so the two things the chrome around the
  // editor needs — "is the document empty" (placeholder) and "is there a
  // selection to format" (toolbar) — are mirrored into state from
  // `onTransaction`, which fires for typing, selection moves and programmatic
  // content changes alike.
  const [isEmpty, setIsEmpty] = useState(!markdown.trim());
  const [hasSelection, setHasSelection] = useState(false);
  // The markdown this editor last produced. An incoming `markdown` prop equal
  // to it is our own change coming back through the store — re-setting the
  // content then would throw the caret to the start on every keystroke.
  const lastSerialized = useRef(markdown);
  // The editor is created once; its callbacks read the latest props through
  // these refs instead of tearing the editor down on every render.
  const onChangeRef = useRef(onChange);
  const onFocusRef = useRef(onFocus);
  useEffect(() => {
    onChangeRef.current = onChange;
    onFocusRef.current = onFocus;
  });

  const editor = useEditor({
    // Next renders this page on the server first; the editor mounts after
    // hydration (Tiptap forces this flag anyway, setting it explicitly keeps
    // the dev-mode warning quiet).
    immediatelyRender: false,
    extensions,
    content: parseExplanation(markdown) as unknown as Record<string, unknown>,
    editorProps: {
      attributes: {
        // `data-field` is what the keymap's scope matcher and focus.ts look
        // for — this element *is* the explanation field.
        "data-field": "explanation",
        "data-authoring-field": fieldName ?? "",
        role: "textbox",
        "aria-label": ariaLabel,
        "aria-multiline": "true",
        class: `authoring-wysiwyg authoring-wysiwyg-${variant} practice-markdown-content text-left`,
      },
      handlePaste: handleExplanationPaste,
    },
    onUpdate({ editor: current }) {
      const next = serializeExplanationDoc(current.getJSON() as unknown as PMDoc);
      lastSerialized.current = next;
      onChangeRef.current(next);
    },
    onTransaction({ editor: current }) {
      setIsEmpty(current.isEmpty);
      setHasSelection(!current.state.selection.empty);
    },
    onFocus() {
      setIsActive(true);
      onFocusRef.current?.();
    },
    onBlur({ event }) {
      // Clicking a toolbar button blurs the editor for a moment; the button's
      // own onMouseDown preventDefault keeps the selection, so don't tear the
      // toolbar down underneath the click. The shared selection is never
      // written to `none` here — a focusout leaving the builder root does
      // that, per the editing model.
      const next = event.relatedTarget;
      if (next instanceof HTMLElement && next.closest(".authoring-format-menu")) return;
      setIsActive(false);
    },
  });

  useEffect(() => {
    if (!editor) return;
    registerExplanationEditor(blockId, editor);
    return () => unregisterExplanationEditor(blockId, editor);
  }, [blockId, editor]);

  useEffect(() => {
    if (!editor) return;
    if (markdown === lastSerialized.current) return;
    // While the teacher is typing here, this editor's document is the truth:
    // the prop can lag a keystroke behind (the store round-trip is a render
    // away), and re-setting the content on a stale value throws the caret to
    // the start and drops characters. Text history inside an explanation is
    // the editor's own (Ctrl+Z goes to ProseMirror), so there is nothing the
    // reducer can legitimately push into a focused editor.
    if (editor.isFocused) return;
    // An external change: a reload, or another surface writing this block.
    lastSerialized.current = markdown;
    editor.commands.setContent(parseExplanation(markdown) as unknown as Record<string, unknown>, {
      emitUpdate: false,
    });
  }, [editor, markdown]);


  return (
    <div
      className="authoring-wysiwyg-shell"
      data-placeholder={placeholder}
      data-empty={isEmpty ? "true" : "false"}
    >
      <EditorContent editor={editor} />
      {showSelectionMenu && isActive && hasSelection && editor && (
        <FormatMenu editor={editor} />
      )}
    </div>
  );
}

// The floating toolbar, shown only while the editor holds focus *and* has a
// real (non-empty) selection — the same rule the chords follow, so the two
// never disagree about what "this" means.
function FormatMenu({ editor }: { editor: Editor }) {
  return (
    <div className="authoring-format-menu" role="toolbar" aria-label="Format explanation text">
      <FormatButton
        label="Spanish"
        shortcut="Ctrl Alt S"
        className="spanish"
        onFormat={() => setExplanationLanguage(editor, "es")}
      />
      <FormatButton
        label="English"
        shortcut="Ctrl Alt E"
        className="english"
        onFormat={() => setExplanationLanguage(editor, "en")}
      />
      <FormatButton
        label="Normal"
        shortcut="Ctrl Alt N"
        onFormat={() => setExplanationLanguage(editor, null)}
      />
      <FormatButton
        label="B"
        ariaLabel="Bold"
        shortcut="Ctrl/⌘ B"
        onFormat={() => toggleExplanationMark(editor, "bold")}
      />
      <FormatButton
        label="I"
        ariaLabel="Italic"
        shortcut="Ctrl/⌘ I"
        onFormat={() => toggleExplanationMark(editor, "italic")}
      />
    </div>
  );
}

function FormatButton({
  label,
  ariaLabel,
  shortcut,
  className = "",
  pressed,
  onFormat,
}: {
  label: string;
  ariaLabel?: string;
  shortcut: string;
  className?: string;
  pressed?: boolean;
  onFormat: () => void;
}) {
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      aria-pressed={pressed}
      title={`${ariaLabel ?? label} (${shortcut})`}
      // Keeps the editor's selection alive across the click: without this the
      // mousedown collapses it and the button formats nothing.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onFormat}
    >
      {label}
    </button>
  );
}
