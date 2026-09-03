"use client";

import { X } from "lucide-react";

import type {
  ConceptLink,
  ConceptRole,
  ConceptType,
  MappingDirection,
} from "@/lib/lesson-builder/types";
import {
  conceptRoleOptions,
  conceptTypeOptions,
  mappingDirectionOptions,
} from "@/lib/lesson-builder/utils";

const selectClass =
  "rounded-md border border-blue-100 bg-white px-2.5 py-2 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100";
const inputClass =
  "min-w-0 rounded-md border border-blue-100 px-2.5 py-2 text-sm outline-none transition placeholder:text-stone-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100";

// The "Concepts Taught" panel on a sentence block: the concept links that tie a
// prompt to curriculum entries. This is the surface the curriculum-coverage
// feature ("topics covered", first-taught tracking) grows from.
export function SentenceConceptLinks({
  conceptLinks,
  onAdd,
  onUpdate,
  onRemove,
}: {
  conceptLinks: ConceptLink[];
  onAdd: () => void;
  onUpdate: (
    conceptLinkId: string,
    updates: Partial<Omit<ConceptLink, "id">>,
  ) => void;
  onRemove: (conceptLinkId: string) => void;
}) {
  return (
    <div className="order-5 mt-5 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
          Concepts Taught
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-md px-2 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
        >
          Add concept
        </button>
      </div>
      {conceptLinks.length > 0 ? (
        <div className="space-y-2">
          {conceptLinks.map((conceptLink) => (
            <div key={conceptLink.id} className="rounded-lg bg-white p-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={conceptLink.type}
                  onChange={(event) =>
                    onUpdate(conceptLink.id, {
                      type: event.target.value as ConceptType,
                    })
                  }
                  className={selectClass}
                >
                  {conceptTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={conceptLink.direction}
                  onChange={(event) =>
                    onUpdate(conceptLink.id, {
                      direction: event.target.value as MappingDirection,
                    })
                  }
                  className={selectClass}
                >
                  {mappingDirectionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={conceptLink.role}
                  onChange={(event) =>
                    onUpdate(conceptLink.id, {
                      role: event.target.value as ConceptRole,
                    })
                  }
                  className={selectClass}
                >
                  {conceptRoleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onRemove(conceptLink.id)}
                  aria-label="Remove sentence concept"
                  title="Remove concept"
                  className="flex size-9 shrink-0 items-center justify-center rounded-md text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <input
                  type="text"
                  value={conceptLink.sourceText}
                  onChange={(event) =>
                    onUpdate(conceptLink.id, { sourceText: event.target.value })
                  }
                  placeholder="Source"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={conceptLink.targetText}
                  onChange={(event) =>
                    onUpdate(conceptLink.id, { targetText: event.target.value })
                  }
                  placeholder="Target"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={conceptLink.contextLabel}
                  onChange={(event) =>
                    onUpdate(conceptLink.id, {
                      contextLabel: event.target.value,
                    })
                  }
                  placeholder="Context"
                  className={inputClass}
                />
              </div>
              <input
                type="text"
                value={conceptLink.label}
                onChange={(event) =>
                  onUpdate(conceptLink.id, { label: event.target.value })
                }
                placeholder="Optional display label"
                className="mt-2 w-full rounded-md border border-blue-100 px-2.5 py-2 text-sm outline-none transition placeholder:text-stone-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-blue-700/70">
          Add phrase or sentence-level concepts here.
        </p>
      )}
    </div>
  );
}
