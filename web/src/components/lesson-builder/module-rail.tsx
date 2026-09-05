"use client";

import { ChevronDown, ChevronUp, Plus, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";

import type { LessonModule } from "@/lib/lesson-builder/types";

// The module list: select which module the builder is editing, reorder / add /
// delete modules, and drop a dragged lesson onto a module to move it there.
export function ModuleRail({
  modules,
  activeId,
  saveLabel,
  canUndo,
  draggedLessonId,
  onSelect,
  onReorder,
  onAdd,
  onDelete,
  onMoveLesson,
  onUndo,
}: {
  modules: LessonModule[];
  activeId: string | null;
  saveLabel: string;
  canUndo: boolean;
  draggedLessonId: string | null;
  onSelect: (moduleId: string) => void;
  onReorder: (index: number, direction: -1 | 1) => void;
  onAdd: () => void;
  onDelete: (moduleId: string) => void;
  onMoveLesson: (lessonId: string, toModuleId: string) => void;
  onUndo: () => void;
}) {
  const [dropModuleId, setDropModuleId] = useState<string | null>(null);

  return (
    <section className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Modules
          </h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {modules.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canUndo && (
            <button
              type="button"
              onClick={onUndo}
              title="Undo last module change (⌘Z)"
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <Undo2 className="size-3.5" aria-hidden="true" /> Undo
            </button>
          )}
          <span className="text-xs text-muted-foreground">{saveLabel}</span>
        </div>
      </div>
      <ul className="space-y-1">
        {modules.map((module, index) => {
          const canDrop =
            draggedLessonId !== null &&
            !module.lessonIds.includes(draggedLessonId);
          return (
            <li key={module.id} className="flex items-center gap-1">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => onReorder(index, -1)}
                  disabled={index === 0}
                  aria-label="Move module up"
                  className="rounded text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  <ChevronUp className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onReorder(index, 1)}
                  disabled={index === modules.length - 1}
                  aria-label="Move module down"
                  className="rounded text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onSelect(module.id)}
                onDragOver={(event) => {
                  if (canDrop) {
                    event.preventDefault();
                    setDropModuleId(module.id);
                  }
                }}
                onDragLeave={() =>
                  setDropModuleId((current) =>
                    current === module.id ? null : current,
                  )
                }
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggedLessonId && canDrop) {
                    onMoveLesson(draggedLessonId, module.id);
                  }
                  setDropModuleId(null);
                }}
                className={`min-w-0 flex-1 rounded-lg px-2.5 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 ${
                  dropModuleId === module.id
                    ? "bg-primary/15 ring-2 ring-primary"
                    : module.id === activeId
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted"
                }`}
              >
                <span className="block truncate font-medium">
                  {module.name || "Untitled module"}
                </span>
                <span
                  className={`text-xs ${
                    module.id === activeId && dropModuleId !== module.id
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {module.lessonIds.length} lessons
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(module.id)}
                disabled={modules.length <= 1}
                aria-label={`Delete ${module.name || "untitled module"}`}
                title={
                  modules.length <= 1
                    ? "At least one module is required"
                    : module.lessonIds.length > 0
                      ? "Delete module and move its lessons"
                      : "Delete module"
                }
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-red-200"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      {draggedLessonId && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Drop on a module to move the lesson there.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <Plus className="size-4" aria-hidden="true" /> Add module
        </button>
      </div>
    </section>
  );
}
