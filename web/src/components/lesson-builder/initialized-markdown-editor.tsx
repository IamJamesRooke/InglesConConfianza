"use client";

import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ButtonWithTooltip,
  CreateLink,
  HighlightToggle,
  ListsToggle,
  MDXEditor,
  type MDXEditorMethods,
  Separator,
  UndoRedo,
  addComposerChild$,
  headingsPlugin,
  insertMarkdown$,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  realmPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import { usePublisher } from "@mdxeditor/gurx";
import { HIGHLIGHT } from "@lexical/markdown";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import "@mdxeditor/editor/style.css";
import { useEffect, useMemo, useRef } from "react";

type InitializedMarkdownEditorProps = {
  markdown: string;
  onChange: (markdown: string) => void;
  onBlur: () => void;
};

function HighlightMarkdownShortcut() {
  return <MarkdownShortcutPlugin transformers={[HIGHLIGHT]} />;
}

const highlightMarkdownShortcutPlugin = realmPlugin({
  init(realm) {
    realm.pub(addComposerChild$, HighlightMarkdownShortcut);
  },
});

function InsertKeyboardShortcut() {
  const insertMarkdown = usePublisher(insertMarkdown$);

  function insertKeyboardShortcut() {
    const shortcut = window.prompt("Keyboard shortcut", "Alt + H")?.trim();

    if (shortcut) {
      insertMarkdown(`\\<kbd>${shortcut}\\</kbd>`);
    }
  }

  return (
    <ButtonWithTooltip
      title="Insert keyboard shortcut"
      aria-label="Insert keyboard shortcut"
      onClick={insertKeyboardShortcut}
    >
      <span className="font-mono text-[11px] font-semibold">Kbd</span>
    </ButtonWithTooltip>
  );
}

export function InitializedMarkdownEditor({
  markdown,
  onChange,
  onBlur,
}: InitializedMarkdownEditorProps) {
  const editorRef = useRef<MDXEditorMethods>(null);

  useEffect(() => {
    const focusTimer = window.setTimeout(() => {
      editorRef.current?.focus(undefined, {
        defaultSelection: "rootEnd",
        preventScroll: true,
      });
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, []);

  const plugins = useMemo(
    () => [
      headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
      quotePlugin(),
      listsPlugin(),
      linkPlugin(),
      linkDialogPlugin(),
      markdownShortcutPlugin(),
      highlightMarkdownShortcutPlugin(),
      toolbarPlugin({
        toolbarContents: () => (
          <>
            <UndoRedo />
            <Separator />
            <BlockTypeSelect />
            <Separator />
            <BoldItalicUnderlineToggles options={["Bold", "Italic"]} />
            <HighlightToggle />
            <Separator />
            <ListsToggle options={["bullet", "number"]} />
            <CreateLink />
            <InsertKeyboardShortcut />
          </>
        ),
      }),
    ],
    [],
  );

  return (
    <MDXEditor
      ref={editorRef}
      markdown={markdown}
      onChange={onChange}
      onBlur={onBlur}
      placeholder="Start explaining the idea…"
      className="lesson-markdown-editor"
      contentEditableClassName="lesson-markdown-content min-h-36 px-4 py-4 text-base leading-7 text-stone-800 outline-none"
      plugins={plugins}
    />
  );
}
