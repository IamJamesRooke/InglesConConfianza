"use client";

import { PracticeMarkdown } from "@/components/practice/practice-markdown";
import type { LessonBlock } from "@/lib/lesson-builder/types";

// The read-only block summary shown when a lesson is collapsed to its
// partial-preview state.
export function LessonBlockPreviewList({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="space-y-3 border-t border-border bg-[var(--surface)] px-6 py-3">
      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No content blocks yet.</p>
      ) : (
        blocks.map((block) => (
          <div
            key={block.id}
            className={
              block.type === "explanation"
                ? "rounded-lg bg-[var(--surface-sunken)] px-3 py-2 text-foreground"
                : "px-1"
            }
          >
            {block.type === "explanation" ? (
              <div className="space-y-0 text-sm leading-5 text-foreground">
                {block.contentMarkdown.trim() ? (
                  <PracticeMarkdown markdown={block.contentMarkdown} />
                ) : (
                  <p>Empty explanation</p>
                )}
              </div>
            ) : (
              <div className="space-y-1 text-sm text-foreground">
                {block.languageBlocks.map((piece) => <div key={piece.id} className="grid grid-cols-[1fr_auto_1fr] gap-3"><strong>{piece.spanish || "Empty Spanish"}</strong><span aria-hidden="true">→</span><span>{piece.acceptedAnswers[0] || "No answer"}</span>{piece.callout && <small className="col-span-3 text-muted-foreground">Hint: {piece.callout}</small>}{piece.acceptedAnswers.length > 1 && <small className="col-span-3 text-muted-foreground">Also accepts: {piece.acceptedAnswers.slice(1).join(", ")}</small>}</div>)}
                {block.helperText && <p className="text-muted-foreground">Helper: {block.helperText}</p>}
                {block.answerFeedback && <p className="text-muted-foreground">Success: {block.answerFeedback}</p>}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
