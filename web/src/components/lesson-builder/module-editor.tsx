"use client";

import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  SquarePen,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { LessonModule } from "@/lib/lesson-builder/types";
import type { LessonSummary } from "@/lib/lesson-builder/server/course-view";
import { createId } from "@/lib/lesson-builder/utils";

const inputClass =
  "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

export function ModuleEditor({
  initialModules,
  lessons,
}: {
  initialModules: LessonModule[];
  lessons: Record<string, LessonSummary>;
}) {
  const [modules, setModules] = useState(initialModules);
  const [selectedId, setSelectedId] = useState(initialModules[0]?.id ?? "");
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);
  const [railDropModuleId, setRailDropModuleId] = useState<string | null>(null);
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

  const selected = modules.find((module) => module.id === selectedId) ?? modules[0];

  function patchSelected(patch: Partial<LessonModule>) {
    setModules((current) =>
      current.map((module) =>
        module.id === selected.id ? { ...module, ...patch } : module,
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
    const created: LessonModule = {
      id: createId("module"),
      name: `Module ${modules.length + 1}`,
      promise: "",
      finalSentence: { spanish: "", english: "" },
      lessonIds: [],
    };
    setModules((current) => [...current, created]);
    setSelectedId(created.id);
  }

  function deleteModule(moduleId: string) {
    setModules((current) => {
      const next = current.filter((module) => module.id !== moduleId);
      if (moduleId === selectedId) setSelectedId(next[0]?.id ?? "");
      return next;
    });
  }

  function reorderLessonInSelected(fromIndex: number, toIndex: number) {
    setModules((current) =>
      current.map((module) => {
        if (module.id !== selected.id) return module;
        const lessonIds = [...module.lessonIds];
        const [moved] = lessonIds.splice(fromIndex, 1);
        lessonIds.splice(toIndex, 0, moved);
        return { ...module, lessonIds };
      }),
    );
  }

  function moveLessonToModule(lessonId: string, toModuleId: string) {
    setModules((current) =>
      current.map((module) => {
        if (module.id === toModuleId) {
          return { ...module, lessonIds: [...module.lessonIds, lessonId] };
        }
        if (module.lessonIds.includes(lessonId)) {
          return {
            ...module,
            lessonIds: module.lessonIds.filter((id) => id !== lessonId),
          };
        }
        return module;
      }),
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[16rem_1fr]">
      {/* module list */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Modules
          </span>
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
        <ul className="space-y-1">
          {modules.map((module, index) => {
            const canDropHere =
              draggedLessonId !== null &&
              !module.lessonIds.includes(draggedLessonId);
            return (
              <li key={module.id} className="flex items-center gap-1">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => moveModule(index, -1)}
                    disabled={index === 0}
                    aria-label="Move module up"
                    className="text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronUp className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveModule(index, 1)}
                    disabled={index === modules.length - 1}
                    aria-label="Move module down"
                    className="text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(module.id)}
                  onDragOver={(event) => {
                    if (canDropHere) {
                      event.preventDefault();
                      setRailDropModuleId(module.id);
                    }
                  }}
                  onDragLeave={() =>
                    setRailDropModuleId((current) =>
                      current === module.id ? null : current,
                    )
                  }
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggedLessonId && canDropHere) {
                      moveLessonToModule(draggedLessonId, module.id);
                    }
                    setDraggedLessonId(null);
                    setRailDropModuleId(null);
                  }}
                  className={`min-w-0 flex-1 truncate rounded-md px-2.5 py-1.5 text-left text-sm transition ${
                    railDropModuleId === module.id
                      ? "bg-primary/15 ring-2 ring-primary"
                      : module.id === selected?.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                  }`}
                >
                  {module.name || "Untitled module"}
                  <span
                    className={`ml-1.5 text-xs ${
                      module.id === selected?.id &&
                      railDropModuleId !== module.id
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
        <button
          type="button"
          onClick={addModule}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold transition hover:bg-muted"
        >
          <Plus className="size-4" aria-hidden="true" /> Add module
        </button>
      </div>

      {/* selected module editor */}
      {selected ? (
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start gap-2">
            <input
              value={selected.name ?? ""}
              onChange={(event) =>
                patchSelected({ name: event.target.value || null })
              }
              placeholder="Module name"
              aria-label="Module name"
              className={`${inputClass} flex-1 text-base font-semibold`}
            />
            <Link
              href={`/lesson-builder?module=${selected.id}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <SquarePen className="size-4" aria-hidden="true" />
              Open in Builder
            </Link>
            <button
              type="button"
              onClick={() => deleteModule(selected.id)}
              disabled={selected.lessonIds.length > 0}
              title={
                selected.lessonIds.length > 0
                  ? "Move its lessons out first"
                  : "Delete module"
              }
              aria-label="Delete module"
              className="flex size-9 items-center justify-center rounded-md text-stone-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>

          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Learner promise
            </span>
            <textarea
              value={selected.promise}
              onChange={(event) =>
                patchSelected({ promise: event.target.value })
              }
              rows={2}
              placeholder="By the end, the learner can…"
              className={`${inputClass} resize-none`}
            />
          </label>

          <div className="mt-3 grid gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Final confidence sentence
            </span>
            <input
              value={selected.finalSentence.spanish}
              onChange={(event) =>
                patchSelected({
                  finalSentence: {
                    ...selected.finalSentence,
                    spanish: event.target.value,
                  },
                })
              }
              placeholder="Spanish"
              className={inputClass}
            />
            <input
              value={selected.finalSentence.english}
              onChange={(event) =>
                patchSelected({
                  finalSentence: {
                    ...selected.finalSentence,
                    english: event.target.value,
                  },
                })
              }
              placeholder="English"
              className={inputClass}
            />
          </div>

          <div className="mt-4">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Lessons ({selected.lessonIds.length}) — drag to reorder
            </span>
            {selected.lessonIds.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                No lessons. Use “Move to…” on another module’s lessons, or add
                lessons in the Builder.
              </p>
            ) : (
              <ul className="space-y-1">
                {selected.lessonIds.map((lessonId, lessonIndex) => {
                  const summary = lessons[lessonId];
                  return (
                    <li
                      key={lessonId}
                      draggable
                      onDragStart={() => setDraggedLessonId(lessonId)}
                      onDragEnd={() => {
                        setDraggedLessonId(null);
                        setRailDropModuleId(null);
                      }}
                      onDragOver={(event) => {
                        if (draggedLessonId && draggedLessonId !== lessonId) {
                          event.preventDefault();
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (!draggedLessonId) return;
                        const from = selected.lessonIds.indexOf(draggedLessonId);
                        if (from !== -1) reorderLessonInSelected(from, lessonIndex);
                        setDraggedLessonId(null);
                      }}
                      className={`flex cursor-grab items-center gap-2 rounded-md border border-border bg-[var(--surface-sunken)] px-2.5 py-1.5 text-sm active:cursor-grabbing ${
                        draggedLessonId === lessonId ? "opacity-40" : ""
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
                      {modules.length > 1 && (
                        <select
                          value=""
                          onChange={(event) => {
                            if (event.target.value)
                              moveLessonToModule(lessonId, event.target.value);
                          }}
                          aria-label="Move lesson to another module"
                          className="shrink-0 rounded border border-input bg-background px-1.5 py-0.5 text-xs text-muted-foreground"
                        >
                          <option value="">Move to…</option>
                          {modules
                            .filter((module) => module.id !== selected.id)
                            .map((module) => (
                              <option key={module.id} value={module.id}>
                                {module.name || "Untitled"}
                              </option>
                            ))}
                        </select>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          No modules. Add one to get started.
        </p>
      )}
    </div>
  );
}
