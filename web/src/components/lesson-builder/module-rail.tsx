"use client";

import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useState } from "react";

import type { LessonModule } from "@/lib/lesson-builder/types";

// The module list: select which module the builder is editing, reorder / add /
// delete modules, and drop a dragged lesson onto a module to move it there.
export function ModuleRail({
  modules,
  activeId,
  saveLabel,
  draggedLessonId,
  onSelect,
  onReorder,
  onAdd,
  onDelete,
  onMoveLesson,
}: {
  modules: LessonModule[];
  activeId: string | null;
  saveLabel: string;
  draggedLessonId: string | null;
  onSelect: (moduleId: string) => void;
  onReorder: (index: number, direction: -1 | 1) => void;
  onAdd: () => void;
  onDelete: (moduleId: string) => void;
  onMoveLesson: (lessonId: string, toModuleId: string) => void;
}) {
  const [dropModuleId, setDropModuleId] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Modules
        </span>
        <span className="text-xs text-muted-foreground">{saveLabel}</span>
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
                  className="text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                >
                  <ChevronUp className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onReorder(index, 1)}
                  disabled={index === modules.length - 1}
                  aria-label="Move module down"
                  className="text-muted-foreground transition hover:text-foreground disabled:opacity-30"
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
                className={`min-w-0 flex-1 truncate rounded-md px-2.5 py-1.5 text-left text-sm transition ${
                  dropModuleId === module.id
                    ? "bg-primary/15 ring-2 ring-primary"
                    : module.id === activeId
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                }`}
              >
                {module.name || "Untitled module"}
                <span
                  className={`ml-1.5 text-xs ${
                    module.id === activeId && dropModuleId !== module.id
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {module.lessonIds.length}
                </span>
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
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm font-semibold transition hover:bg-muted"
        >
          <Plus className="size-4" aria-hidden="true" /> Add module
        </button>
        {activeId &&
          modules.find((module) => module.id === activeId)?.lessonIds
            .length === 0 && (
            <button
              type="button"
              onClick={() => onDelete(activeId)}
              className="rounded-lg border border-red-200 px-2.5 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Delete module
            </button>
          )}
      </div>
    </div>
  );
}
