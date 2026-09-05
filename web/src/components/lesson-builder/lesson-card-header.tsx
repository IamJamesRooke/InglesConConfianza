"use client";

import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  GripVertical,
  Save,
  Trash2,
} from "lucide-react";
import type { DragEvent, MouseEvent, Ref } from "react";

// The title bar of a lesson card: number, unsaved badge, name field, and the
// preview / save / collapse-cycle / delete / drag-reorder controls.
export function LessonCardHeader({
  lessonNumber,
  name,
  isDirty,
  isCollapsed,
  isFullyCollapsed,
  isSaving,
  validationIssueCount,
  stepCount,
  saveDisabled,
  dragDisabled,
  dragDisabledReason,
  onHeaderClick,
  nameInputRef,
  onNameChange,
  onPreview,
  onDuplicate,
  onSave,
  onCycleDisplayMode,
  onDelete,
  onDragStart,
  onDragEnd,
}: {
  lessonNumber: number;
  name: string;
  isDirty: boolean;
  isCollapsed: boolean;
  isFullyCollapsed: boolean;
  isSaving: boolean;
  validationIssueCount: number;
  stepCount: number;
  saveDisabled: boolean;
  dragDisabled: boolean;
  dragDisabledReason: string;
  onHeaderClick: (event: MouseEvent<HTMLElement>) => void;
  nameInputRef?: Ref<HTMLInputElement>;
  onNameChange: (value: string) => void;
  onPreview: () => void;
  onDuplicate: () => void;
  onSave: () => void;
  onCycleDisplayMode: () => void;
  onDelete: () => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
}) {
  return (
    <header
      onClick={onHeaderClick}
      className={`flex items-center gap-4 border-b border-border bg-[var(--surface-sunken)] px-6 py-4 ${
        !isCollapsed ? "cursor-pointer" : ""
      }`}
    >
      <h2 className="shrink-0 text-xl font-semibold tracking-tight text-stone-900">
        Lesson {lessonNumber}
      </h2>
      {isDirty && (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
          <span className="size-1.5 rounded-full bg-amber-500" />
          Unsaved
        </span>
      )}
      <span className="hidden shrink-0 text-xs font-semibold text-stone-500 xl:inline">
        {stepCount} {stepCount === 1 ? "step" : "steps"}
      </span>
      <input
        ref={nameInputRef}
        type="text"
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="Add lesson name (optional)"
        aria-label={`Name for lesson ${lessonNumber}`}
        className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-violet-400 focus:ring-3 focus:ring-violet-100"
      />
      <button
        type="button"
        onClick={onPreview}
        disabled={validationIssueCount > 0}
        aria-label={`Preview lesson ${lessonNumber}`}
        title={
          validationIssueCount > 0
            ? `Resolve ${validationIssueCount} ${validationIssueCount === 1 ? "issue" : "issues"} before previewing this lesson`
            : "Preview lesson"
        }
        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-stone-500 transition hover:bg-stone-200 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-stone-500 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-200"
      >
        <Eye className="size-4" aria-hidden="true" />
        <span className="hidden lg:inline">Preview</span>
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saveDisabled}
        aria-label={`Save lesson ${lessonNumber}`}
        title="Save lesson (Alt+S)"
        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <Save className="size-4" aria-hidden="true" />
        <span className="hidden lg:inline">
          {isSaving ? "Saving..." : "Save"}
        </span>
      </button>
      <button
        type="button"
        onClick={onDuplicate}
        aria-label={`Duplicate lesson ${lessonNumber}`}
        title="Duplicate lesson"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-200 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-200"
      >
        <Copy className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onCycleDisplayMode}
        aria-label={`Cycle lesson ${lessonNumber} display mode`}
        title="Cycle display mode (Alt+M)"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-200 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-200"
      >
        {!isCollapsed ? (
          <ChevronUp className="size-4" aria-hidden="true" />
        ) : isFullyCollapsed ? (
          <ChevronDown className="size-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="size-4 rotate-90" aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete lesson ${lessonNumber}`}
        title="Delete lesson"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-red-200"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        draggable={!dragDisabled}
        disabled={dragDisabled}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        aria-label={`Drag lesson ${lessonNumber} to reorder`}
        title={dragDisabled ? dragDisabledReason : "Drag to reorder"}
        className="flex shrink-0 cursor-grab items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-stone-500 transition hover:bg-stone-200 hover:text-stone-700 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="hidden sm:inline">Drag to reorder</span>
        <GripVertical className="size-5" aria-hidden="true" />
      </button>
    </header>
  );
}
