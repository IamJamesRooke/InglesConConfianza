"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import { LessonConceptsField } from "@/components/lesson-builder/lesson-concepts-field";
import type { LessonConcept, LessonModule } from "@/lib/lesson-builder/types";

const inputClass =
  "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20";

// The current module's name and its Key concepts — the curriculum concepts the
// module intends to teach. A key concept pill turns green once some lesson in
// the module covers it (`coveredConceptKeys`). Collapsed by default once at
// least one key concept is set, so it stays out of the way while authoring.
export function ModuleMeta({
  module,
  coveredConceptKeys,
  onChange,
}: {
  module: LessonModule;
  coveredConceptKeys: Set<string>;
  onChange: (patch: Partial<LessonModule>) => void;
}) {
  const [open, setOpen] = useState(module.keyConcepts.length === 0);

  function setKeyConcepts(next: LessonConcept[]) {
    onChange({ keyConcepts: next });
  }

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
        <div className="mt-3 space-y-4 pl-8">
          <label className="block max-w-xs">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Learner placement
            </span>
            <select
              value={module.kind ?? "course"}
              onChange={(event) =>
                onChange({
                  kind: event.target.value as "course" | "onboarding",
                })
              }
              className={inputClass}
            >
              <option value="course">Numbered course module</option>
              <option value="onboarding">Start-here onboarding</option>
            </select>
          </label>
          <LessonConceptsField
            variant="inline"
            label="Key concepts"
            concepts={module.keyConcepts}
            coveredConceptKeys={coveredConceptKeys}
            onAdd={(concept) => setKeyConcepts([...module.keyConcepts, concept])}
            onRemove={(id) =>
              setKeyConcepts(module.keyConcepts.filter((c) => c.id !== id))
            }
            onRelabel={(id, label) =>
              setKeyConcepts(
                module.keyConcepts.map((c) =>
                  c.id === id ? { ...c, label } : c,
                ),
              )
            }
          />
        </div>
      ) : (
        module.keyConcepts.length > 0 && (
          <p className="mt-1.5 truncate pl-8 text-xs text-muted-foreground">
            {module.keyConcepts.map((c) => c.label).join(" · ")}
          </p>
        )
      )}
    </section>
  );
}
