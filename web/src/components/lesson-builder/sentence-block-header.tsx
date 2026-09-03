"use client";

import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  GripVertical,
  Languages,
  Table2,
  Trash2,
} from "lucide-react";
import type { DragEvent } from "react";

import type { SentenceBlock } from "@/lib/lesson-builder/types";

// The title bar of a sentence / vocabulary-table content block: a summary of
// its language blocks, an issue count, and drag / preview / duplicate /
// collapse / delete controls. The collapse and preview actions are blocked
// while the sentence has validation issues.
export function SentenceBlockHeader({
  block,
  isCollapsed,
  issueCount,
  onToggleCollapse,
  onDragStart,
  onDragEnd,
  onPreview,
  onDuplicate,
  onDelete,
}: {
  block: SentenceBlock;
  isCollapsed: boolean;
  issueCount: number;
  onToggleCollapse: () => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const isVocabulary = block.layout === "vocabulary_table";
  const separator = isVocabulary ? ", " : " ";
  const spanishSummary =
    block.languageBlocks
      .map((languageBlock) => languageBlock.spanish.trim())
      .filter(Boolean)
      .join(separator) || "No Spanish text yet";
  const englishSummary =
    block.languageBlocks
      .map((languageBlock) => languageBlock.acceptedAnswers[0]?.trim())
      .filter(Boolean)
      .join(separator) || "No English answer yet";
  const blockedByIssues = !isCollapsed && issueCount > 0;
  const issueLabel = `${issueCount} ${issueCount === 1 ? "issue" : "issues"}`;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border bg-[var(--surface-sunken)] px-5 py-3">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={blockedByIssues}
        aria-label={`${isCollapsed ? "Expand" : "Collapse"} sentence`}
        title={
          blockedByIssues
            ? `Resolve ${issueLabel} before closing this sentence.`
            : undefined
        }
        onClick={onToggleCollapse}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggleCollapse();
          }
        }}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-200"
      >
        <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          {isVocabulary ? (
            <Table2 className="size-4" aria-hidden="true" />
          ) : (
            <Languages className="size-4" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <span className="sr-only">
            {isVocabulary ? "Vocabulary table block" : "Sentence block"}
          </span>
          <div className="space-y-0.5 text-sm">
            <p className="truncate font-medium text-stone-700">
              {spanishSummary}
            </p>
            <p className="truncate text-stone-500">{englishSummary}</p>
          </div>
        </div>
        {issueCount > 0 && (
          <span
            role="status"
            className="hidden shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 sm:inline-flex"
          >
            {issueLabel}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          draggable
          onDragStart={onDragStart}
          onDragEnd={(event) => {
            event.stopPropagation();
            onDragEnd();
          }}
          aria-label="Drag sentence to reorder"
          title="Drag to reorder"
          className="flex size-8 cursor-grab items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 active:cursor-grabbing"
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onPreview}
          disabled={issueCount > 0}
          aria-label="Preview sentence as learner"
          title={
            issueCount > 0
              ? `Resolve ${issueLabel} before previewing`
              : "Preview as learner"
          }
          className="flex size-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-stone-500"
        >
          <Eye className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          aria-label="Duplicate sentence"
          title="Duplicate sentence"
          className="flex size-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200"
        >
          <Copy className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          disabled={blockedByIssues}
          aria-label={`${isCollapsed ? "Expand" : "Collapse"} sentence`}
          title={
            blockedByIssues
              ? `Resolve ${issueLabel} before closing`
              : isCollapsed
                ? "Expand"
                : "Collapse"
          }
          className="flex size-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
        >
          {isCollapsed ? (
            <ChevronDown className="size-4" aria-hidden="true" />
          ) : (
            <ChevronUp className="size-4" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete sentence"
          title="Delete sentence"
          className="flex size-8 items-center justify-center rounded-md text-stone-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
