"use client";

import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { LessonModule } from "@/lib/lesson-builder/types";
import type { LessonSummary } from "@/lib/lesson-builder/server/course-view";
import { createId } from "@/lib/lesson-builder/utils";

type DragState = { moduleId: string; lessonId: string } | null;
type DropState = { moduleId: string; index: number } | null;

const inputClass =
  "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

// Arrange the course: modules with their promise + final sentence, and the
// lessons in each (drag within and between modules). Autosaves the whole
// structure to PUT /api/lesson-builder/course.
export function CourseArranger({
  initialModules,
  lessons,
}: {
  initialModules: LessonModule[];
  lessons: Record<string, LessonSummary>;
}) {
  const [modules, setModules] = useState(initialModules);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [dragged, setDragged] = useState<DragState>(null);
  const [dropTarget, setDropTarget] = useState<DropState>(null);
  const savedJson = useRef(JSON.stringify(initialModules));
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const json = JSON.stringify(modules);
    if (json === savedJson.current) return;
    setSaveState("saving");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/lesson-builder/course", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modules }),
        });
        if (response.ok) {
          savedJson.current = json;
          setSaveState("saved");
        } else {
          setSaveState("error");
        }
      } catch {
        setSaveState("error");
      }
    }, 600);
    return () => window.clearTimeout(timer.current);
  }, [modules]);

  function patchModule(moduleId: string, patch: Partial<LessonModule>) {
    setModules((current) =>
      current.map((module) =>
        module.id === moduleId ? { ...module, ...patch } : module,
      ),
    );
  }

  function moveModule(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= modules.length) return;
    setModules((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addModule() {
    setModules((current) => [
      ...current,
      {
        id: createId("module"),
        name: `Module ${current.length + 1}`,
        promise: "",
        finalSentence: { spanish: "", english: "" },
        lessonIds: [],
      },
    ]);
  }

  function deleteModule(moduleId: string) {
    setModules((current) => current.filter((module) => module.id !== moduleId));
  }

  function commitMove(toModuleId: string, toIndex: number) {
    if (!dragged) return;
    setModules((current) => {
      const next = current.map((module) => ({
        ...module,
        lessonIds: [...module.lessonIds],
      }));
      const source = next.find((module) => module.id === dragged.moduleId);
      const destination = next.find((module) => module.id === toModuleId);
      if (!source || !destination) return current;
      const fromIndex = source.lessonIds.indexOf(dragged.lessonId);
      if (fromIndex === -1) return current;
      source.lessonIds.splice(fromIndex, 1);
      let insertAt = toIndex;
      if (source === destination && fromIndex < toIndex) insertAt -= 1;
      destination.lessonIds.splice(insertAt, 0, dragged.lessonId);
      return next;
    });
    setDragged(null);
    setDropTarget(null);
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={addModule}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold transition hover:bg-muted"
        >
          <Plus className="size-4" aria-hidden="true" /> Add module
        </button>
        <span className="text-xs text-muted-foreground">
          {saveState === "saving"
            ? "Saving…"
            : saveState === "saved"
              ? "Saved"
              : saveState === "error"
                ? "Save failed"
                : ""}
        </span>
      </div>

      <div className="space-y-4">
        {modules.map((module, moduleIndex) => (
          <section
            key={module.id}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start gap-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => moveModule(moduleIndex, -1)}
                  disabled={moduleIndex === 0}
                  aria-label="Move module up"
                  className="text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                >
                  <ChevronUp className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => moveModule(moduleIndex, 1)}
                  disabled={moduleIndex === modules.length - 1}
                  aria-label="Move module down"
                  className="text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                >
                  <ChevronDown className="size-4" aria-hidden="true" />
                </button>
              </div>
              <input
                value={module.name ?? ""}
                onChange={(event) =>
                  patchModule(module.id, { name: event.target.value || null })
                }
                placeholder={`Module ${moduleIndex + 1}`}
                aria-label="Module name"
                className={`${inputClass} flex-1 font-semibold`}
              />
              <button
                type="button"
                onClick={() => deleteModule(module.id)}
                disabled={module.lessonIds.length > 0}
                title={
                  module.lessonIds.length > 0
                    ? "Move its lessons out first"
                    : "Delete module"
                }
                aria-label="Delete module"
                className="flex size-8 items-center justify-center rounded-md text-stone-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr]">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  Learner promise
                </span>
                <textarea
                  value={module.promise}
                  onChange={(event) =>
                    patchModule(module.id, { promise: event.target.value })
                  }
                  rows={2}
                  placeholder="By the end, the learner can…"
                  className={`${inputClass} resize-none`}
                />
              </label>
              <div className="grid gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Final confidence sentence
                </span>
                <input
                  value={module.finalSentence.spanish}
                  onChange={(event) =>
                    patchModule(module.id, {
                      finalSentence: {
                        ...module.finalSentence,
                        spanish: event.target.value,
                      },
                    })
                  }
                  placeholder="Spanish"
                  className={inputClass}
                />
                <input
                  value={module.finalSentence.english}
                  onChange={(event) =>
                    patchModule(module.id, {
                      finalSentence: {
                        ...module.finalSentence,
                        english: event.target.value,
                      },
                    })
                  }
                  placeholder="English"
                  className={inputClass}
                />
              </div>
            </div>

            <ul
              className="mt-3 space-y-1"
              onDragOver={(event) => {
                if (dragged && module.lessonIds.length === 0) {
                  event.preventDefault();
                  setDropTarget({ moduleId: module.id, index: 0 });
                }
              }}
              onDrop={(event) => {
                if (dragged && module.lessonIds.length === 0) {
                  event.preventDefault();
                  commitMove(module.id, 0);
                }
              }}
            >
              {module.lessonIds.length === 0 && (
                <li
                  className={`rounded-md border border-dashed px-3 py-3 text-center text-xs ${
                    dropTarget?.moduleId === module.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  Drag a lesson here
                </li>
              )}
              {module.lessonIds.map((lessonId, lessonIndex) => {
                const summary = lessons[lessonId];
                const showLineBefore =
                  dropTarget?.moduleId === module.id &&
                  dropTarget.index === lessonIndex;
                return (
                  <li key={lessonId}>
                    {showLineBefore && (
                      <div className="my-0.5 h-0.5 rounded-full bg-primary" />
                    )}
                    <div
                      draggable
                      onDragStart={() =>
                        setDragged({ moduleId: module.id, lessonId })
                      }
                      onDragEnd={() => {
                        setDragged(null);
                        setDropTarget(null);
                      }}
                      onDragOver={(event) => {
                        if (!dragged) return;
                        event.preventDefault();
                        const bounds =
                          event.currentTarget.getBoundingClientRect();
                        const after =
                          event.clientY > bounds.top + bounds.height / 2;
                        setDropTarget({
                          moduleId: module.id,
                          index: lessonIndex + (after ? 1 : 0),
                        });
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (dropTarget) {
                          commitMove(dropTarget.moduleId, dropTarget.index);
                        }
                      }}
                      className={`flex cursor-grab items-center gap-2 rounded-md border border-border bg-[var(--surface-sunken)] px-2.5 py-1.5 text-sm active:cursor-grabbing ${
                        dragged?.lessonId === lessonId ? "opacity-40" : ""
                      }`}
                    >
                      <GripVertical
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {lessonIndex + 1}.
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium">
                          {summary?.name || "Untitled lesson"}
                        </span>
                        {summary?.preview && (
                          <span className="text-muted-foreground">
                            {" — "}
                            {summary.preview}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {summary?.blockCount ?? 0}b · {summary?.conceptCount ?? 0}c
                      </span>
                    </div>
                    {dropTarget?.moduleId === module.id &&
                      dropTarget.index === lessonIndex + 1 &&
                      lessonIndex === module.lessonIds.length - 1 && (
                        <div className="my-0.5 h-0.5 rounded-full bg-primary" />
                      )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
