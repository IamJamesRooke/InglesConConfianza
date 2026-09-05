"use client";

import { Plus, Snowflake, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type Ref } from "react";

import { ConceptQuickEdit } from "@/components/lesson-builder/concept-quick-edit";
import { conceptKey } from "@/lib/lesson-builder/lesson-file";
import type { LessonConceptSuggestion } from "@/lib/lesson-builder/concept-suggestions";
import type { LessonConcept } from "@/lib/lesson-builder/types";
import { createId } from "@/lib/lesson-builder/utils";

type ConceptResult = {
  id: string;
  spanish: string;
  english: string;
  curriculumRole: string;
};

export type ConceptDisplayLookup = Record<
  string,
  { spanish: string; english: string; role?: string }
>;

// The quick "concepts covered" field under a lesson title. Type to search the
// curriculum; pick a match (keeps its id for coverage tracking) or press Enter
// on unmatched text to add it freehand. Backspace on an empty field removes the
// last chip.
export function LessonConceptsField({
  concepts,
  onAdd,
  onRemove,
  onRelabel,
  label = "Concepts covered",
  coveredConceptKeys,
  variant = "block",
  inputRef,
  conceptDisplays = {},
  suggestions = [],
  onDisplayChange,
}: {
  concepts: LessonConcept[];
  onAdd: (concept: LessonConcept) => void;
  onRemove: (lessonConceptId: string) => void;
  onRelabel: (lessonConceptId: string, label: string) => void;
  label?: string;
  // When given, a chip whose concept key is in this set renders green ("met" —
  // some lesson in the module covers it). Used by the module Key concepts field.
  coveredConceptKeys?: Set<string>;
  variant?: "block" | "inline";
  inputRef?: Ref<HTMLInputElement>;
  conceptDisplays?: ConceptDisplayLookup;
  suggestions?: LessonConceptSuggestion[];
  onDisplayChange?: (
    conceptId: string,
    display: ConceptDisplayLookup[string],
  ) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ConceptResult[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  const [localDisplays, setLocalDisplays] = useState<ConceptDisplayLookup>({});
  const [searchState, setSearchState] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const listboxId = useId();
  const blurTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const trimmed = query.trim();
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (trimmed.length < 2) {
        setResults([]);
        setSearchState("idle");
        return;
      }
      setSearchState("loading");
      try {
        const response = await fetch(
          `/api/admin/curriculum/concepts/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          setSearchState("error");
          return;
        }
        const data = (await response.json()) as { concepts: ConceptResult[] };
        setResults(data.concepts);
        setHighlight(0);
        setSearchState("idle");
      } catch {
        // aborted or offline — leave the previous results in place
        if (!controller.signal.aborted) {
          setSearchState("error");
        }
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
    const display = {
      spanish: result.spanish,
      english: result.english,
      role: result.curriculumRole,
    };
    setLocalDisplays((current) => ({
      ...current,
      [result.id]: display,
    }));
    onDisplayChange?.(result.id, display);
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

  function addSuggestion(suggestion: LessonConceptSuggestion) {
    onAdd({
      id: createId("lesson_concept"),
      conceptId: suggestion.conceptId,
      label: suggestion.spanish,
    });
  }

  return (
    <div
      className={
        variant === "inline"
          ? ""
          : "border-b border-border bg-[var(--surface-sunken)] px-6 py-3"
      }
    >
      {suggestions.length > 0 && (
        <div className="mb-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Snowflake className="size-3.5" aria-hidden="true" />
            Suggested review
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.conceptId}
                type="button"
                className="concept-suggestion"
                data-priority={suggestion.priorityBand}
                onClick={() => addSuggestion(suggestion)}
                title={`Last covered ${suggestion.lessonGap} ${suggestion.lessonGap === 1 ? "lesson" : "lessons"} ago`}
              >
                <span className="grid min-w-0 text-left leading-tight">
                  <strong>{suggestion.english}</strong>
                  <span>{suggestion.spanish}</span>
                </span>
                <span className="concept-suggestion-meta">
                  <span>{suggestion.role ?? "unranked"}</span>
                  <span aria-hidden="true">·</span>
                  <span>{suggestion.lessonGap} back</span>
                </span>
                <Plus className="size-3.5" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">
          {label}
        </span>
        {concepts.map((concept) => {
          const met = coveredConceptKeys?.has(conceptKey(concept)) ?? false;
          const display = concept.conceptId
            ? localDisplays[concept.conceptId] ?? conceptDisplays[concept.conceptId]
            : undefined;
          return (
          <span
            key={concept.id}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs ${
              met
                ? "border-green-300 bg-green-50 text-green-800"
                : concept.conceptId
                  ? "border-violet-200 bg-violet-50 text-violet-800"
                  : "border-stone-300 bg-white text-stone-600"
            }`}
            title={
              met
                ? "Covered by a lesson in this module"
                : concept.conceptId
                  ? undefined
                  : "Not linked to the curriculum"
            }
          >
            {concept.conceptId ? (
              <ConceptQuickEdit
                conceptId={concept.conceptId}
                className="hover:underline"
                onSaved={(draft) => {
                  const nextDisplay = {
                    spanish: draft.spanish,
                    english: draft.english,
                    role: draft.role,
                  };
                  setLocalDisplays((current) => ({
                    ...current,
                    [concept.conceptId!]: nextDisplay,
                  }));
                  onDisplayChange?.(concept.conceptId!, nextDisplay);
                  onRelabel(concept.id, draft.spanish);
                }}
                onDeleted={() => onRemove(concept.id)}
              >
                <span className="grid text-left leading-tight">
                  <strong className="text-[13px] font-semibold">
                    {display?.english ?? concept.label}
                  </strong>
                  <span className="mt-0.5 text-[11px] font-medium opacity-65">
                    {display?.spanish ?? concept.label}
                  </span>
                </span>
              </ConceptQuickEdit>
            ) : (
              <span className="grid text-left leading-tight">
                <strong className="text-[13px] font-semibold">{concept.label}</strong>
                <span className="mt-0.5 text-[10px] font-medium opacity-65">
                  Unlinked concept
                </span>
              </span>
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
          );
        })}
        <div className="relative min-w-40 flex-1">
          <input
            ref={inputRef}
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
                    <span className="grid min-w-0 text-left leading-tight">
                      <span className="truncate font-semibold text-stone-900">
                        {result.english}
                      </span>
                      <span className="mt-0.5 truncate text-xs text-stone-500">
                        {result.spanish}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                      {result.curriculumRole}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {open && query.trim().length >= 2 && visibleResults.length === 0 && (
            <div className="absolute left-0 top-full z-30 mt-1 w-[min(28rem,80vw)] rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-xl">
              <p className="text-muted-foreground">
                {searchState === "loading"
                  ? "Searching..."
                  : searchState === "error"
                    ? "Concept search unavailable."
                    : "No linked concept found. Press Enter to add an unlinked label."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
