"use client";

import { OverviewMarkdown } from "@/components/lesson-builder/overview-markdown";
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
                  <OverviewMarkdown markdown={block.contentMarkdown} />
                ) : (
                  <p>Empty explanation</p>
                )}
              </div>
            ) : (
              <div className="text-sm text-foreground">
                <p className="font-semibold">
                  {block.languageBlocks
                    .map((languageBlock) => languageBlock.spanish.trim())
                    .filter(Boolean)
                    .join(
                      block.layout === "vocabulary_table" ? ", " : " ",
                    ) || "Empty Spanish prompt"}
                </p>
                <p className="text-muted-foreground italic">
                  {block.languageBlocks
                    .map(
                      (languageBlock) =>
                        languageBlock.acceptedAnswers
                          .find((answer) => answer.trim())
                          ?.trim() ?? "",
                    )
                    .filter(Boolean)
                    .join(
                      block.layout === "vocabulary_table" ? ", " : " ",
                    ) || "No answer"}
                </p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
