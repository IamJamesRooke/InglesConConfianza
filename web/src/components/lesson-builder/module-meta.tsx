"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import type { LessonModule } from "@/lib/lesson-builder/types";

const inputClass =
  "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

// The current module's name, learner promise, and final confidence sentence.
// Collapsed by default so it stays out of the way while authoring lessons.
export function ModuleMeta({
  module,
  onChange,
}: {
  module: LessonModule;
  onChange: (patch: Partial<LessonModule>) => void;
}) {
  const hasPromise = Boolean(
    module.promise.trim() ||
      module.finalSentence.spanish.trim() ||
      module.finalSentence.english.trim(),
  );
  const [open, setOpen] = useState(!hasPromise);

  return (
    <section className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label={open ? "Collapse module details" : "Expand module details"}
        >
          {open ? (
            <ChevronDown className="size-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-4" aria-hidden="true" />
          )}
        </button>
        <input
          value={module.name ?? ""}
          onChange={(event) => onChange({ name: event.target.value || null })}
          placeholder="Module name"
          aria-label="Module name"
          className={`${inputClass} flex-1 text-base font-semibold`}
        />
      </div>

      {open ? (
        <div className="mt-3 space-y-3 pl-8">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Learner promise
            </span>
            <textarea
              value={module.promise}
              onChange={(event) => onChange({ promise: event.target.value })}
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
                onChange({
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
                onChange({
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
      ) : (
        module.promise.trim() && (
          <p className="mt-1.5 truncate pl-8 text-xs text-muted-foreground">
            {module.promise}
          </p>
        )
      )}
    </section>
  );
}
