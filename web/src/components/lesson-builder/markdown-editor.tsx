"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";

const InitializedMarkdownEditor = dynamic(
  () =>
    import("./initialized-markdown-editor").then(
      (module) => module.InitializedMarkdownEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-48 animate-pulse rounded-lg bg-stone-100" />
    ),
  },
);

type MarkdownEditorProps = {
  markdown: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
};

export function MarkdownEditor(props: MarkdownEditorProps) {
  const onChangeRef = useRef(props.onChange);
  const pendingMarkdownRef = useRef(props.markdown);
  const committedMarkdownRef = useRef(props.markdown);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onChangeRef.current = props.onChange;
  }, [props.onChange]);

  useEffect(() => {
    committedMarkdownRef.current = props.markdown;
  }, [props.markdown]);

  const syncMarkdown = useCallback(() => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }

    const markdown = pendingMarkdownRef.current;

    if (markdown !== committedMarkdownRef.current) {
      committedMarkdownRef.current = markdown;
      onChangeRef.current(markdown);
    }
  }, []);

  const handleChange = useCallback(
    (markdown: string) => {
      pendingMarkdownRef.current = markdown;

      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }

      syncTimerRef.current = setTimeout(syncMarkdown, 400);
    },
    [syncMarkdown],
  );

  useEffect(() => {
    return () => {
      syncMarkdown();
    };
  }, [syncMarkdown]);

  return (
    <InitializedMarkdownEditor
      markdown={props.markdown}
      onChange={handleChange}
      onBlur={syncMarkdown}
      placeholder={props.placeholder}
    />
  );
}
