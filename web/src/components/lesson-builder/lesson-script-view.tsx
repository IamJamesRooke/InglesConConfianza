"use client";

// E4 — script mode: a plain-text drafting surface over the block model, per
// docs/design/lesson-script-grammar.md. Toggled per lesson by Ctrl+Alt+T
// (lib/lesson-builder/keymap/lesson.ts, "lesson" scope) or the quiet "Script ⌥"
// button in lesson-document.tsx. Leaving the view (the same chord again,
// Escape, or blur to outside) parses the textarea; a successful parse
// dispatches REPLACE_LESSON_BLOCKS as one undoable step and closes the
// view, an unsuccessful one shows the errors inline and keeps the view
// open. `data-keymap-ignore` keeps the builder's chord dispatcher out of
// this textarea entirely, so Ctrl+Alt+T and Escape are handled here.

import { useRef, useState, type KeyboardEvent } from "react";

import { useLessonBuilder } from "@/lib/lesson-builder/builder-context";
import { parseScript, printScript, type ScriptError } from "@/lib/lesson-builder/script";
import type { Lesson } from "@/lib/lesson-builder/types";

type Props = {
  lesson: Lesson;
  onClose: () => void;
};

function isCtrlAltT(event: KeyboardEvent<HTMLTextAreaElement>): boolean {
  return (event.ctrlKey || event.metaKey) && event.altKey && !event.shiftKey && event.code === "KeyT";
}

export function LessonScriptView({ lesson, onClose }: Props) {
  const actions = useLessonBuilder();
  const [text, setText] = useState(() => printScript(lesson));
  const [errors, setErrors] = useState<ScriptError[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  function attemptLeave(): boolean {
    const result = parseScript(text);
    if (result.errors.length > 0) {
      setErrors(result.errors);
      return false;
    }
    actions.replaceLessonBlocks(lesson.id, {
      blocks: result.blocks,
      title: result.title,
      concepts: result.concepts,
    });
    setErrors([]);
    onClose();
    return true;
  }

  return (
    <div className="lesson-script-view" ref={containerRef}>
      <textarea
        autoFocus
        data-keymap-ignore
        className="lesson-script-view-textarea"
        aria-label="Lesson script"
        value={text}
        spellCheck={false}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (isCtrlAltT(event) || event.key === "Escape") {
            event.preventDefault();
            attemptLeave();
          }
        }}
        onBlur={(event) => {
          const related = event.relatedTarget as Node | null;
          if (related && containerRef.current?.contains(related)) return;
          attemptLeave();
        }}
      />
      {errors.length > 0 && (
        <ul className="lesson-script-view-errors" role="alert">
          {errors.map((error) => (
            <li key={`${error.line}:${error.message}`}>
              Line {error.line}: {error.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
