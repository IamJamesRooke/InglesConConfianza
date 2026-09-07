"use client";

import { useEffect, useRef, useState } from "react";

import { PracticeMarkdown } from "@/components/practice/practice-markdown";

export function ExplanationStep({
  markdown,
  onChange,
}: {
  markdown: string;
  onChange?: (markdown: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 180)}px`;
  }, [editing, markdown]);

  return (
    <div className="lesson-explanation learner-enter">
      <span className="step-overline">
        <span aria-hidden="true" />
        Una idea nueva
      </span>
      {onChange ? (
        editing ? (
          <textarea
            ref={textareaRef}
            autoFocus
            value={markdown}
            onChange={(event) => onChange(event.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
            placeholder="Type the explanation exactly as the learner should see it…"
            aria-label="Explanation"
            className="authoring-explanation-input"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="authoring-explanation-preview"
          >
            {markdown.trim() ? (
              <PracticeMarkdown markdown={markdown} />
            ) : (
              <span>Type the explanation…</span>
            )}
          </button>
        )
      ) : (
        <PracticeMarkdown markdown={markdown || "Continúa al siguiente paso."} />
      )}
    </div>
  );
}
