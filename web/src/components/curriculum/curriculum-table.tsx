"use client";

import { Pencil, Search, Trash2, X } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

import type {
  CurriculumConcept,
  TeachingPriority,
} from "@/lib/curriculum/types";

type EditableField = "spanish" | "english" | "exampleSpanish" | "exampleEnglish";

type ActiveEditor = {
  conceptId: string;
  field: EditableField;
  value: string;
};

const teachingPriorities: Array<{
  value: TeachingPriority;
  label: string;
  description: string;
}> = [
  { value: "essential", label: "Essential", description: "Must be taught" },
  { value: "important", label: "Important", description: "Common, but later" },
  {
    value: "post_mastery",
    label: "Post-Mastery",
    description: "After earlier material is mastered",
  },
  { value: "enrichment", label: "Enrichment", description: "Nice to know" },
  { value: "supplemental", label: "Supplemental", description: "Optional" },
  { value: "reference", label: "Reference", description: "Do not teach" },
];
const priorityRank = new Map(
  teachingPriorities.map((priority, index) => [priority.value, index]),
);

function getPriorityLabel(priority: TeachingPriority) {
  return teachingPriorities.find((option) => option.value === priority)?.label;
}
const collectionHues = [25, 55, 90, 145, 190, 235, 275, 315, 350];

function getCollectionStyle(collection: string) {
  const hash = [...collection].reduce(
    (currentHash, character) =>
      (currentHash * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );

  return {
    "--collection-hue": collectionHues[hash % collectionHues.length],
  } as CSSProperties;
}

function renderConceptPattern(value: string) {
  return value.split(/(\[[^\]]+\])/u).map((part, index) =>
    part.startsWith("[") && part.endsWith("]") ? (
      <span
        key={`${part}-${index}`}
        className="mx-0.5 inline-flex rounded border border-dashed border-border bg-muted/70 px-1.5 py-0.5 font-normal italic text-muted-foreground"
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function getSearchableMapping(value: string) {
  return value.replace(/\[[^\]]+\]/gu, " ").toLocaleLowerCase();
}

function getEditableValue(concept: CurriculumConcept, field: EditableField) {
  if (field === "exampleSpanish") return concept.example.spanish;
  if (field === "exampleEnglish") return concept.example.english;
  return concept[field];
}

function updateEditableValue(
  concept: CurriculumConcept,
  field: EditableField,
  value: string,
) {
  if (field === "exampleSpanish") {
    return { ...concept, example: { ...concept.example, spanish: value } };
  }
  if (field === "exampleEnglish") {
    return { ...concept, example: { ...concept.example, english: value } };
  }
  return { ...concept, [field]: value };
}

export function CurriculumTable({
  initialConcepts,
}: {
  initialConcepts: CurriculumConcept[];
}) {
  const [concepts, setConcepts] = useState(initialConcepts);
  const [activeEditor, setActiveEditor] = useState<ActiveEditor | null>(null);
  const [activeCollectionEditor, setActiveCollectionEditor] = useState<{
    conceptId: string;
    value: string;
  } | null>(null);
  const [pendingConceptId, setPendingConceptId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mappingSearch, setMappingSearch] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null,
  );
  const [maximumPriority, setMaximumPriority] = useState<
    TeachingPriority | "all"
  >("all");
  const normalizedMappingSearch = mappingSearch.trim().toLocaleLowerCase();
  const availableCollections = useMemo(
    () =>
      [...new Set(concepts.flatMap((concept) => concept.collections))].sort(
        (firstCollection, secondCollection) =>
          firstCollection.localeCompare(secondCollection),
      ),
    [concepts],
  );
  const filteredConcepts = concepts.filter(
    (concept) =>
      (!normalizedMappingSearch ||
        getSearchableMapping(concept.spanish).includes(normalizedMappingSearch) ||
        getSearchableMapping(concept.english).includes(normalizedMappingSearch)) &&
      (!selectedCollection ||
        concept.collections.includes(selectedCollection)) &&
      (maximumPriority === "all" ||
        priorityRank.get(concept.teachingPriority)! <=
          priorityRank.get(maximumPriority)!),
  ).sort(
    (firstConcept, secondConcept) =>
      priorityRank.get(firstConcept.teachingPriority)! -
      priorityRank.get(secondConcept.teachingPriority)!,
  );

  async function saveActiveEditor() {
    if (!activeEditor || pendingConceptId) {
      return;
    }

    const editor = activeEditor;
    const concept = concepts.find(
      (candidate) => candidate.id === editor.conceptId,
    );
    const value = editor.value.trim();

    if (!concept || !value) {
      setError("Concept fields cannot be empty.");
      return;
    }

    if (getEditableValue(concept, editor.field) === value) {
      setActiveEditor(null);
      return;
    }

    const updatedConcept = updateEditableValue(concept, editor.field, value);

    setPendingConceptId(concept.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/curriculum/concepts/${encodeURIComponent(concept.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedConcept),
        },
      );

      if (!response.ok) {
        throw new Error("Unable to save the concept.");
      }

      setConcepts((currentConcepts) =>
        currentConcepts.map((candidate) =>
          candidate.id === concept.id ? updatedConcept : candidate,
        ),
      );
      setActiveEditor((currentEditor) =>
        currentEditor?.conceptId === editor.conceptId &&
        currentEditor.field === editor.field
          ? null
          : currentEditor,
      );
    } catch {
      setError("Unable to save the concept.");
    } finally {
      setPendingConceptId(null);
    }
  }

  async function saveCollectionEditor() {
    if (!activeCollectionEditor || pendingConceptId) return;

    const editor = activeCollectionEditor;
    const concept = concepts.find(
      (candidate) => candidate.id === editor.conceptId,
    );
    if (!concept) return;

    const collections = [
      ...new Set(
        editor.value
          .split(",")
          .map((collection) => collection.trim())
          .filter(Boolean),
      ),
    ];
    const updatedConcept = { ...concept, collections };

    setPendingConceptId(concept.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/curriculum/concepts/${encodeURIComponent(concept.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedConcept),
        },
      );
      if (!response.ok) throw new Error("Unable to save collections.");

      setConcepts((currentConcepts) =>
        currentConcepts.map((candidate) =>
          candidate.id === concept.id ? updatedConcept : candidate,
        ),
      );
      setActiveCollectionEditor((currentEditor) =>
        currentEditor?.conceptId === editor.conceptId ? null : currentEditor,
      );
    } catch {
      setError("Unable to save collections.");
    } finally {
      setPendingConceptId(null);
    }
  }

  async function deleteConcept(concept: CurriculumConcept) {
    if (
      pendingConceptId ||
      !window.confirm(
        `Delete “${concept.spanish} → ${concept.english}”? This cannot be undone.`,
      )
    ) {
      return;
    }

    setPendingConceptId(concept.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/curriculum/concepts/${encodeURIComponent(concept.id)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error("Unable to delete the concept.");
      }

      setConcepts((currentConcepts) =>
        currentConcepts.filter((candidate) => candidate.id !== concept.id),
      );
      setActiveEditor((currentEditor) =>
        currentEditor?.conceptId === concept.id ? null : currentEditor,
      );
      setActiveCollectionEditor((currentEditor) =>
        currentEditor?.conceptId === concept.id ? null : currentEditor,
      );
    } catch {
      setError("Unable to delete the concept.");
    } finally {
      setPendingConceptId(null);
    }
  }

  async function updatePriority(
    concept: CurriculumConcept,
    teachingPriority: TeachingPriority,
  ) {
    if (
      pendingConceptId ||
      concept.teachingPriority === teachingPriority
    ) {
      return;
    }

    const updatedConcept = { ...concept, teachingPriority };
    setPendingConceptId(concept.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/curriculum/concepts/${encodeURIComponent(concept.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedConcept),
        },
      );

      if (!response.ok) {
        throw new Error("Unable to save priority.");
      }

      setConcepts((currentConcepts) =>
        currentConcepts.map((candidate) =>
          candidate.id === concept.id ? updatedConcept : candidate,
        ),
      );
    } catch {
      setError("Unable to save priority.");
    } finally {
      setPendingConceptId(null);
    }
  }

  function renderCollections(concept: CurriculumConcept) {
    if (activeCollectionEditor?.conceptId === concept.id) {
      return (
        <input
          autoFocus
          value={activeCollectionEditor.value}
          disabled={pendingConceptId === concept.id}
          aria-label="Edit collections"
          placeholder="lesson plan, verb family"
          onChange={(event) =>
            setActiveCollectionEditor({
              ...activeCollectionEditor,
              value: event.target.value,
            })
          }
          onBlur={() => void saveCollectionEditor()}
          onKeyDown={(event) => {
            if (event.key === "Enter") void saveCollectionEditor();
            if (event.key === "Escape") setActiveCollectionEditor(null);
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 disabled:opacity-60"
        />
      );
    }

    return (
      <div className="flex min-w-48 flex-wrap items-center gap-1.5 px-3 py-2">
        {concept.collections.map((collection) => (
          <button
            key={collection}
            type="button"
            onClick={() => setSelectedCollection(collection)}
            style={getCollectionStyle(collection)}
            className={`collection-pill rounded-full border px-2 py-1 text-xs font-semibold transition ${selectedCollection === collection ? "collection-pill-selected" : ""}`}
          >
            {collection}
          </button>
        ))}
        <button
          type="button"
          onClick={() =>
            setActiveCollectionEditor({
              conceptId: concept.id,
              value: concept.collections.join(", "),
            })
          }
          aria-label={`Edit collections for ${concept.spanish}`}
          title="Edit collections"
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    );
  }

  function renderEditableCell(
    concept: CurriculumConcept,
    field: EditableField,
  ) {
    const isEditing =
      activeEditor?.conceptId === concept.id && activeEditor.field === field;

    if (isEditing) {
      return (
        <input
          autoFocus
          value={activeEditor.value}
          disabled={pendingConceptId === concept.id}
          aria-label={`Edit ${field} concept`}
          onChange={(event) =>
            setActiveEditor({ ...activeEditor, value: event.target.value })
          }
          onBlur={() => void saveActiveEditor()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void saveActiveEditor();
            }

            if (event.key === "Escape") {
              event.preventDefault();
              setActiveEditor(null);
              setError(null);
            }
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 disabled:opacity-60"
        />
      );
    }

    return (
      <button
        type="button"
        disabled={pendingConceptId !== null}
        onClick={() =>
          setActiveEditor({
            conceptId: concept.id,
            field,
            value: getEditableValue(concept, field),
          })
        }
        className="w-full rounded-md px-3 py-2 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/20 disabled:opacity-60"
      >
        {renderConceptPattern(getEditableValue(concept, field))}
      </button>
    );
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-64 flex-1 sm:max-w-sm">
          <span className="sr-only">Search Spanish or English mappings</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={mappingSearch}
            onChange={(event) => setMappingSearch(event.target.value)}
            placeholder="Search Spanish or English"
            className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
          />
          {mappingSearch && (
            <button
              type="button"
              onClick={() => setMappingSearch("")}
              aria-label="Clear mapping search"
              className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          Maximum teaching priority
          <select
            value={maximumPriority}
            onChange={(event) =>
              setMaximumPriority(
                event.target.value === "all"
                  ? "all"
                  : (event.target.value as TeachingPriority),
              )
            }
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
          >
            <option value="all">Show all</option>
            {teachingPriorities.map((priority) => (
              <option key={priority.value} value={priority.value}>
                Through {priority.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Collections
        </span>
        {availableCollections.map((collection) => (
          <button
            key={collection}
            type="button"
            onClick={() =>
              setSelectedCollection(
                selectedCollection === collection ? null : collection,
              )
            }
            style={getCollectionStyle(collection)}
            className={`collection-pill rounded-full border px-2.5 py-1 text-xs font-semibold transition ${selectedCollection === collection ? "collection-pill-selected" : ""}`}
          >
            {collection}
          </button>
        ))}
        {selectedCollection && (
          <button
            type="button"
            onClick={() => setSelectedCollection(null)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            <X className="size-3.5" aria-hidden="true" /> Clear
          </button>
        )}
      </div>

      {(normalizedMappingSearch ||
        selectedCollection ||
        maximumPriority !== "all") && (
        <p className="mb-3 text-sm text-muted-foreground">
          Showing {filteredConcepts.length} of {concepts.length} concepts
          {normalizedMappingSearch && (
            <>
              {" "}whose Spanish or English mapping contains{" "}
              <span className="font-semibold text-foreground">
                {mappingSearch.trim()}
              </span>
            </>
          )}
          {selectedCollection && (
            <>
              {normalizedMappingSearch ? " and" : " in"} collection{" "}
              <span className="font-semibold text-foreground">
                {selectedCollection}
              </span>
            </>
          )}
          {maximumPriority !== "all" && (
            <>
              {normalizedMappingSearch || selectedCollection ? " and" : " with"}{" "}
              teaching priority through{" "}
              <span className="font-semibold text-foreground">
                {getPriorityLabel(maximumPriority)}
              </span>
            </>
          )}
          .
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead className="bg-muted/60 text-sm text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-semibold">Spanish concept</th>
              <th className="px-5 py-3 font-semibold">English concept</th>
              <th className="px-5 py-3 font-semibold">Example</th>
              <th className="px-5 py-3 font-semibold">Collections</th>
              <th className="w-32 px-5 py-3 font-semibold">
                Teaching priority
              </th>
              <th className="w-16 px-3 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredConcepts.map((concept) => (
              <tr key={concept.id} className="border-t border-border">
                <td className="p-2 pl-2 font-medium">
                  {renderEditableCell(concept, "spanish")}
                </td>
                <td className="p-2">{renderEditableCell(concept, "english")}</td>
                <td className="p-2">
                  <div className="min-w-56">
                    {renderEditableCell(concept, "exampleSpanish")}
                    <div className="border-t border-border/60">
                      {renderEditableCell(concept, "exampleEnglish")}
                    </div>
                  </div>
                </td>
                <td className="p-2">{renderCollections(concept)}</td>
                <td className="p-2">
                  <select
                    value={concept.teachingPriority}
                    disabled={pendingConceptId !== null}
                    onChange={(event) =>
                      void updatePriority(
                        concept,
                        event.target.value as TeachingPriority,
                      )
                    }
                    aria-label={`Teaching priority for ${concept.spanish}`}
                    title={
                      teachingPriorities.find(
                        (priority) =>
                          priority.value === concept.teachingPriority,
                      )?.description
                    }
                    className={`priority-select priority-${concept.teachingPriority} w-full rounded-md border px-3 py-2 text-sm font-semibold outline-none transition focus:ring-3 focus:ring-ring/20 disabled:opacity-60`}
                  >
                    {teachingPriorities.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 pr-3 text-right">
                  <button
                    type="button"
                    disabled={pendingConceptId !== null}
                    onClick={() => void deleteConcept(concept)}
                    aria-label={`Delete ${concept.spanish}`}
                    title="Delete concept"
                    className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/20 disabled:opacity-40"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
