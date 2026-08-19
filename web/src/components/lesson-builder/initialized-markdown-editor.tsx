"use client";

import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  HighlightToggle,
  ListsToggle,
  MDXEditor,
  Separator,
  UndoRedo,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useMemo } from "react";

type InitializedMarkdownEditorProps = {
  markdown: string;
  onChange: (markdown: string) => void;
  onBlur: () => void;
};

export function InitializedMarkdownEditor({
  markdown,
  onChange,
  onBlur,
}: InitializedMarkdownEditorProps) {
  const plugins = useMemo(
    () => [
      headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
      quotePlugin(),
      listsPlugin(),
      linkPlugin(),
      linkDialogPlugin(),
      markdownShortcutPlugin(),
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
          </>
        ),
      }),
    ],
    [],
  );

  return (
    <MDXEditor
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
