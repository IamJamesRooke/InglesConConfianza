"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { ConceptQuickEdit } from "@/components/lesson-builder/concept-quick-edit";
import type { LessonConcept } from "@/lib/lesson-builder/types";
import { createId } from "@/lib/lesson-builder/utils";

type ConceptResult = {
  id: string;
  spanish: string;
  english: string;
  curriculumRole: string;
};

// The quick "concepts covered" field under a lesson title. Type to search the
// curriculum; pick a match (keeps its id for coverage tracking) or press Enter
// on unmatched text to add it freehand. Backspace on an empty field removes the
// last chip.
export function LessonConceptsField({
  concepts,
  onAdd,
  onRemove,
  onRelabel,
}: {
  concepts: LessonConcept[];
  onAdd: (concept: LessonConcept) => void;
  onRemove: (lessonConceptId: string) => void;
  onRelabel: (lessonConceptId: string, label: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ConceptResult[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  const listboxId = useId();
  const blurTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const trimmed = query.trim();
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (trimmed.length < 2) {
        setResults([]);
        return;
      }
      try {
        const response = await fetch(
          `/api/curriculum/concepts/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!response.ok) return;
        const data = (await response.json()) as { concepts: ConceptResult[] };
        setResults(data.concepts);
        setHighlight(0);
      } catch {
        // aborted or offline — leave the previous results in place
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(
    () => () => window.clearTimeout(blurTimer.current),
    [],
  );

  const alreadyAdded = new Set(
    concepts.map((concept) => concept.conceptId).filter(Boolean),
  );
  const visibleResults = results.filter(
    (result) => !alreadyAdded.has(result.id),
  );

  function addFromResult(result: ConceptResult) {
    onAdd({
      id: createId("lesson_concept"),
      conceptId: result.id,
      label: result.spanish,
    });
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function addFreehand() {
    const label = query.trim();
    if (!label) return;
    onAdd({ id: createId("lesson_concept"), conceptId: null, label });
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="border-b border-border bg-[var(--surface-sunken)] px-6 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">
          Concepts covered
        </span>
        {concepts.map((concept) => (
          <span
            key={concept.id}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
              concept.conceptId
                ? "border-violet-200 bg-violet-50 text-violet-800"
                : "border-stone-300 bg-white text-stone-600"
            }`}
            title={concept.conceptId ? undefined : "Not linked to the curriculum"}
          >
            {concept.conceptId ? (
              <ConceptQuickEdit
                conceptId={concept.conceptId}
                className="hover:underline"
                onSaved={(draft) => onRelabel(concept.id, draft.spanish)}
                onDeleted={() => onRemove(concept.id)}
              >
                {concept.label}
              </ConceptQuickEdit>
            ) : (
              concept.label
            )}
            <button
              type="button"
              onClick={() => onRemove(concept.id)}
              aria-label={`Remove ${concept.label}`}
              className="text-current/60 transition hover:text-red-600"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <div className="relative min-w-40 flex-1">
          <input
            type="text"
            value={query}
            role="combobox"
            aria-expanded={open && visibleResults.length > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            placeholder={
              concepts.length === 0
                ? "Type a concept, e.g. querer, poder, hablar…"
                : "Add another…"
            }
            onFocus={() => setOpen(true)}
            onBlur={() => {
              blurTimer.current = window.setTimeout(() => setOpen(false), 120);
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Backspace" &&
                query === "" &&
                concepts.length > 0
              ) {
                onRemove(concepts[concepts.length - 1].id);
                return;
              }
              if (event.key === "Escape") {
                setOpen(false);
                return;
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setOpen(true);
                setHighlight((current) =>
                  Math.min(current + 1, visibleResults.length - 1),
                );
                return;
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setHighlight((current) => Math.max(current - 1, 0));
                return;
              }
              if (event.key === "Enter") {
                event.preventDefault();
                const chosen = open ? visibleResults[highlight] : undefined;
                if (chosen) {
                  addFromResult(chosen);
                } else {
                  addFreehand();
                }
              }
            }}
            className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-violet-400 focus:ring-3 focus:ring-violet-100"
          />
          {open && visibleResults.length > 0 && (
            <ul
              id={listboxId}
              role="listbox"
              className="absolute left-0 top-full z-30 mt-1 max-h-64 w-[min(28rem,80vw)] overflow-auto rounded-lg border border-border bg-popover py-1 text-sm shadow-xl"
            >
              {visibleResults.map((result, index) => (
                <li key={result.id} role="option" aria-selected={index === highlight}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => addFromResult(result)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left transition ${
                      index === highlight ? "bg-violet-50" : "hover:bg-muted"
                    }`}
                  >
                    <span className="min-w-0 truncate">
                      <span className="font-semibold text-stone-900">
                        {result.spanish}
                      </span>
                      <span className="text-stone-400"> → </span>
                      <span className="text-stone-600">{result.english}</span>
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                      {result.curriculumRole}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
