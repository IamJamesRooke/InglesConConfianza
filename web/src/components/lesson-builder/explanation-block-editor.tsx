"use client";

import {
  ChevronDown,
  Copy,
  Eye,
  FileText,
  GripVertical,
  Trash2,
} from "lucide-react";
import type { DragEvent } from "react";

import { MarkdownEditor } from "@/components/lesson-builder/markdown-editor";
import { OverviewMarkdown } from "@/components/lesson-builder/overview-markdown";
import type { ExplanationBlock } from "@/lib/lesson-builder/types";

// One explanation content block: a collapsed markdown preview, or the header
// toolbar + MarkdownEditor when expanded.
export function ExplanationBlockEditor({
  block,
  isCollapsed,
  onToggleCollapse,
  onDragStart,
  onDragEnd,
  onPreview,
  onDuplicate,
  onDelete,
  onChange,
}: {
  block: ExplanationBlock;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onChange: (markdown: string) => void;
}) {
  return (
    <>
      <div
        className={`flex items-center justify-between gap-3 ${
          isCollapsed
            ? "bg-[var(--surface)] px-4 py-3"
            : "border-b border-border bg-[var(--surface-sunken)] px-5 py-3"
        }`}
      >
        {isCollapsed ? (
          <div
            role="button"
            tabIndex={0}
            aria-label="Edit explanation"
            onClick={onToggleCollapse}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onToggleCollapse();
              }
            }}
            className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-md text-sm leading-5 text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-200"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              {block.contentMarkdown.trim() ? (
                <OverviewMarkdown markdown={block.contentMarkdown} />
              ) : (
                <p className="italic text-muted-foreground">
                  Empty explanation — click to edit
                </p>
              )}
            </div>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            aria-label="Collapse explanation"
            onClick={onToggleCollapse}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onToggleCollapse();
              }
            }}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-200"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            <p className="font-semibold text-stone-900">Explanation</p>
          </div>
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            draggable
            onDragStart={onDragStart}
            onDragEnd={(event) => {
              event.stopPropagation();
              onDragEnd();
            }}
            aria-label="Drag explanation to reorder"
            title="Drag to reorder"
            className="flex size-8 cursor-grab items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 active:cursor-grabbing"
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onPreview}
            aria-label="Preview explanation as learner"
            title="Preview as learner"
            className="flex size-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 hover:text-violet-700"
          >
            <Eye className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            aria-label="Duplicate explanation"
            title="Duplicate explanation"
            className="flex size-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200"
          >
            <Copy className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={`${isCollapsed ? "Expand" : "Collapse"} explanation`}
            title={isCollapsed ? "Expand" : "Collapse"}
            className={`flex h-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 ${
              isCollapsed ? "w-8" : "gap-2 px-2.5 text-xs font-semibold"
            }`}
          >
            {isCollapsed ? (
              <ChevronDown className="size-4" aria-hidden="true" />
            ) : (
              <>
                Done
                <kbd className="rounded border border-stone-300 bg-white px-1.5 py-0.5 font-mono text-[10px] leading-none text-stone-500 shadow-sm">
                  Esc
                </kbd>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete explanation"
            title="Delete explanation"
            className="flex size-8 items-center justify-center rounded-md text-stone-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      {!isCollapsed && (
        <MarkdownEditor
          markdown={block.contentMarkdown}
          onChange={onChange}
        />
      )}
    </>
  );
}
