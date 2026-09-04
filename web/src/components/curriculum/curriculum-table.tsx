"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { useState } from "react";

import type {
  CurriculumConcept,
  CurriculumRole,
} from "@/lib/curriculum/types";

type EditableField = "spanish" | "english" | "exampleSpanish" | "exampleEnglish";

type ActiveEditor = {
  conceptId: string;
  field: EditableField;
  value: string;
};

const curriculumRoles: Array<{
  value: CurriculumRole;
  label: string;
  description: string;
}> = [
  { value: "core", label: "Core", description: "Must be explicitly taught" },
  {
    value: "supporting",
    label: "Supporting",
    description: "Broadly reusable language taught around Core",
  },
  {
    value: "reference",
    label: "Reference",
    description: "Retained, but not a current teaching target",
  },
  {
    value: "trash",
    label: "Trash",
    description: "Flagged for deletion — filter by this role and bulk delete",
  },
];
function getRoleLabel(role: CurriculumRole) {
  return curriculumRoles.find((option) => option.value === role)?.label;
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

type QuickFacet = { collection: string; label: string };
type Macrotag = { slug: string; title: string };

export function CurriculumTable({
  initialConcepts,
  totalConcepts,
  page,
  pageCount,
  pageSize = 100,
  coverage = {},
  coverageFilter = "all",
  filters,
  quickFacets = [],
  activeFacets = [],
  macrotags = [],
  activeTopic = null,
}: {
  initialConcepts: CurriculumConcept[];
  totalConcepts: number;
  page: number;
  pageCount: number;
  pageSize?: number;
  coverage?: Record<
    string,
    { lessonId: string; lessonNumber: number; lessonName: string | null }
  >;
  coverageFilter?: "all" | "taught" | "untaught";
  filters: {
    search: string;
    collection: string;
    role: CurriculumRole | "all";
    sort:
      | "default"
      | "spanish"
      | "spanish-desc"
      | "english"
      | "english-desc"
      | "role";
  };
  quickFacets?: QuickFacet[];
  activeFacets?: string[];
  macrotags?: Macrotag[];
  activeTopic?: { slug: string; title: string } | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggleFacet(collection: string) {
    const next = activeFacets.includes(collection)
      ? activeFacets.filter((item) => item !== collection)
      : [...activeFacets, collection];
    navigate({ facets: next.length > 0 ? next.join(",") : null });
  }
  const [concepts, setConcepts] = useState(initialConcepts);
  const [activeEditor, setActiveEditor] = useState<ActiveEditor | null>(null);
  const [activeCollectionEditor, setActiveCollectionEditor] = useState<{
    conceptId: string;
    value: string;
  } | null>(null);
  const [pendingConceptId, setPendingConceptId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mappingSearch, setMappingSearch] = useState(filters.search);
  const selectedCollection = filters.collection || null;
  const selectedRole = filters.role;
  const sort = filters.sort;

  function sortButton(
    label: string,
    cycle: Array<typeof sort>,
    icons: Partial<Record<typeof sort, typeof ArrowUp>>,
  ) {
    const index = cycle.indexOf(sort);
    const next = cycle[(index + 1) % cycle.length];
    const Icon = icons[sort] ?? ArrowUpDown;
    return (
      <button
        type="button"
        onClick={() => navigate({ sort: next === "default" ? null : next })}
        className={`inline-flex items-center gap-1 transition hover:text-foreground ${
          index > 0 ? "text-foreground" : ""
        }`}
      >
        {label}
        <Icon className="size-3.5" aria-hidden="true" />
      </button>
    );
  }
  const firstVisibleConcept =
    totalConcepts === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisibleConcept =
    totalConcepts === 0
      ? 0
      : Math.min(firstVisibleConcept + concepts.length - 1, totalConcepts);

  function navigate(
    updates: Record<string, string | number | null>,
    resetPage = true,
  ) {
    const parameters = new URLSearchParams(searchParams.toString());
    for (const [name, value] of Object.entries(updates)) {
      if (value === null || value === "" || value === "all") {
        parameters.delete(name);
      } else {
        parameters.set(name, String(value));
      }
    }
    if (resetPage) parameters.delete("page");
    const query = parameters.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

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
        `/api/admin/curriculum/concepts/${encodeURIComponent(concept.id)}`,
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
        `/api/admin/curriculum/concepts/${encodeURIComponent(concept.id)}`,
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
        `/api/admin/curriculum/concepts/${encodeURIComponent(concept.id)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error("Unable to delete the concept.");
      }

      setConcepts((currentConcepts) =>
        currentConcepts.filter((candidate) => candidate.id !== concept.id),
      );
      router.refresh();
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

  function toggleSelected(conceptId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(conceptId)) {
        next.delete(conceptId);
      } else {
        next.add(conceptId);
      }
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelectedIds((current) => {
      const visibleIds = concepts.map((concept) => concept.id);
      const allSelected = visibleIds.every((id) => current.has(id));
      if (allSelected) {
        const next = new Set(current);
        for (const id of visibleIds) next.delete(id);
        return next;
      }
      return new Set([...current, ...visibleIds]);
    });
  }

  async function deleteSelected() {
    if (bulkDeleting || selectedIds.size === 0) return;
    const targets = concepts.filter((concept) => selectedIds.has(concept.id));
    if (
      !window.confirm(
        `Delete ${targets.length} selected concept${targets.length === 1 ? "" : "s"}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setBulkDeleting(true);
    setError(null);

    const results = await Promise.allSettled(
      targets.map((concept) =>
        fetch(`/api/admin/curriculum/concepts/${encodeURIComponent(concept.id)}`, {
          method: "DELETE",
        }).then((response) => {
          if (!response.ok) throw new Error("delete failed");
          return concept.id;
        }),
      ),
    );

    const deletedIds = new Set(
      results
        .filter(
          (result): result is PromiseFulfilledResult<string> =>
            result.status === "fulfilled",
        )
        .map((result) => result.value),
    );
    const failedCount = results.length - deletedIds.size;

    setConcepts((currentConcepts) =>
      currentConcepts.filter((concept) => !deletedIds.has(concept.id)),
    );
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const id of deletedIds) next.delete(id);
      return next;
    });
    if (failedCount > 0) {
      setError(
        `Deleted ${deletedIds.size} concept${deletedIds.size === 1 ? "" : "s"}; ${failedCount} failed.`,
      );
    }
    setBulkDeleting(false);
    router.refresh();
  }

  async function updateRole(
    concept: CurriculumConcept,
    curriculumRole: CurriculumRole,
  ) {
    if (
      pendingConceptId ||
      concept.curriculumRole === curriculumRole
    ) {
      return;
    }

    const updatedConcept = { ...concept, curriculumRole };
    setPendingConceptId(concept.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/curriculum/concepts/${encodeURIComponent(concept.id)}`,
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
          className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 disabled:opacity-60"
        />
      );
    }

    return (
      <div className="flex max-h-12 flex-wrap items-start gap-1 overflow-hidden px-2 py-1 transition-[max-height] duration-200 hover:max-h-112 focus-within:max-h-112">
        {concept.collections.map((collection) => (
          <button
            key={collection}
            type="button"
            onClick={() => navigate({ collection })}
            style={getCollectionStyle(collection)}
            className={`collection-pill rounded-full border px-1.5 py-0.5 text-[11px] font-medium leading-tight transition ${selectedCollection === collection ? "collection-pill-selected" : ""}`}
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
          className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Pencil className="size-3" aria-hidden="true" />
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
          className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 disabled:opacity-60"
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
        className="w-full rounded-md px-2 py-1 text-left leading-snug transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/20 disabled:opacity-60"
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

      <form
        className="mb-4 flex flex-wrap items-center gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ search: mappingSearch.trim() });
        }}
      >
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
              onClick={() => {
                setMappingSearch("");
                navigate({ search: null });
              }}
              aria-label="Clear mapping search"
              className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          Curriculum roles
          <select
            value={selectedRole}
            onChange={(event) => navigate({ role: event.target.value })}
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
          >
            <option value="all">Show all</option>
            {curriculumRoles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          Taught
          <select
            value={coverageFilter}
            onChange={(event) =>
              navigate({
                taught:
                  event.target.value === "all" ? null : event.target.value,
              })
            }
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
          >
            <option value="all">Show all</option>
            <option value="taught">Taught</option>
            <option value="untaught">Not yet taught</option>
          </select>
        </label>
      </form>

      {macrotags.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Topic</span>
          {macrotags.map((tag) => {
            const on = activeTopic?.slug === tag.slug;
            return (
              <button
                key={tag.slug}
                type="button"
                onClick={() =>
                  navigate({ topic: on ? null : tag.slug, facets: null })
                }
                aria-pressed={on}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {tag.title}
              </button>
            );
          })}
        </div>
      )}

      {quickFacets.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {activeTopic && (
            <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              {activeTopic.title}
            </span>
          )}
          {quickFacets.map((facet) => {
            const on = activeFacets.includes(facet.collection);
            return (
              <button
                key={facet.collection}
                type="button"
                onClick={() => toggleFacet(facet.collection)}
                aria-pressed={on}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {facet.label}
              </button>
            );
          })}
          {activeFacets.length > 0 && (
            <button
              type="button"
              onClick={() => navigate({ facets: null })}
              className="px-2 py-1 text-sm text-muted-foreground underline-offset-2 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {selectedCollection && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          Filtered to
          <button
            type="button"
            onClick={() => navigate({ collection: null })}
            className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
          >
            {selectedCollection}
            <X className="size-3" aria-hidden="true" />
          </button>
        </div>
      )}

      <p className="mb-3 text-sm text-muted-foreground">
        Showing {firstVisibleConcept}-{lastVisibleConcept} of {totalConcepts}{" "}
        concepts
        {filters.search && (
          <>
            {" "}whose Spanish or English mapping contains{" "}
            <span className="font-semibold text-foreground">
              {filters.search}
            </span>
          </>
        )}
        {selectedCollection && (
          <>
            {filters.search ? " and" : " in"} collection{" "}
            <span className="font-semibold text-foreground">
              {selectedCollection}
            </span>
          </>
        )}
        {selectedRole !== "all" && (
          <>
            {filters.search || selectedCollection ? " and" : " with"}{" "}
            curriculum role{" "}
            <span className="font-semibold text-foreground">
              {getRoleLabel(selectedRole)}
            </span>
          </>
        )}
        .
      </p>

      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
          <p className="text-sm font-medium text-foreground">
            {selectedIds.size} concept{selectedIds.size === 1 ? "" : "s"} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              disabled={bulkDeleting}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-40"
            >
              Clear selection
            </button>
            <button
              type="button"
              onClick={() => void deleteSelected()}
              disabled={bulkDeleting}
              className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-sm font-semibold text-destructive-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              {bulkDeleting ? "Deleting…" : `Delete ${selectedIds.size} selected`}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead className="sticky top-0 z-10 bg-muted text-xs text-muted-foreground shadow-[0_1px_0_var(--color-border)]">
            <tr>
              <th className="w-8 px-2 py-2">
                <input
                  type="checkbox"
                  aria-label="Select all visible concepts"
                  checked={
                    concepts.length > 0 &&
                    concepts.every((concept) => selectedIds.has(concept.id))
                  }
                  onChange={toggleSelectAllVisible}
                  className="size-4 cursor-pointer"
                />
              </th>
              <th className="w-28 px-3 py-2 font-semibold">
                {sortButton(
                  "Curriculum role",
                  ["default", "role"],
                  { role: ArrowUp },
                )}
              </th>
              <th className="px-3 py-2 font-semibold">
                {sortButton(
                  "Spanish concept",
                  ["default", "spanish", "spanish-desc"],
                  { spanish: ArrowUp, "spanish-desc": ArrowDown },
                )}
              </th>
              <th className="px-3 py-2 font-semibold">
                {sortButton(
                  "English concept",
                  ["default", "english", "english-desc"],
                  { english: ArrowUp, "english-desc": ArrowDown },
                )}
              </th>
              <th className="w-24 px-3 py-2 font-semibold">Taught</th>
              <th className="px-3 py-2 font-semibold">Example</th>
              <th className="px-3 py-2 font-semibold">Collections</th>
              <th className="w-12 px-2 py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {concepts.map((concept) => (
              <tr key={concept.id} className="border-t border-border">
                <td className="px-2 py-1 align-top">
                  <input
                    type="checkbox"
                    aria-label={`Select ${concept.spanish}`}
                    checked={selectedIds.has(concept.id)}
                    onChange={() => toggleSelected(concept.id)}
                    className="mt-1.5 size-4 cursor-pointer"
                  />
                </td>
                <td className="p-1 align-top">
                  <select
                    value={concept.curriculumRole}
                    disabled={pendingConceptId !== null}
                    onChange={(event) =>
                      void updateRole(
                        concept,
                        event.target.value as CurriculumRole,
                      )
                    }
                    aria-label={`Curriculum role for ${concept.spanish}`}
                    title={
                      curriculumRoles.find(
                        (role) => role.value === concept.curriculumRole,
                      )?.description
                    }
                    className={`role-select role-${concept.curriculumRole} w-full rounded-md border px-2 py-1 text-xs font-semibold outline-none transition focus:ring-3 focus:ring-ring/20 disabled:opacity-60`}
                  >
                    {curriculumRoles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-1 align-top font-medium">
                  {renderEditableCell(concept, "spanish")}
                </td>
                <td className="p-1 align-top">
                  {renderEditableCell(concept, "english")}
                </td>
                <td className="px-2 py-1 align-top">
                  {coverage[concept.id] ? (
                    <a
                      href={`/admin/lesson-builder?lesson=${encodeURIComponent(coverage[concept.id].lessonId)}`}
                      className="mt-0.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                      title={
                        coverage[concept.id].lessonName
                          ? `Lesson ${coverage[concept.id].lessonNumber} · ${coverage[concept.id].lessonName} — open in Lesson Builder`
                          : `Lesson ${coverage[concept.id].lessonNumber} — open in Lesson Builder`
                      }
                    >
                      Lesson {coverage[concept.id].lessonNumber}
                    </a>
                  ) : (
                    <span className="mt-0.5 inline-block px-1 text-xs text-muted-foreground/50">
                      —
                    </span>
                  )}
                </td>
                <td className="p-1 align-top">
                  <div className="min-w-48 text-muted-foreground">
                    {renderEditableCell(concept, "exampleSpanish")}
                    <div className="border-t border-border/60">
                      {renderEditableCell(concept, "exampleEnglish")}
                    </div>
                  </div>
                </td>
                <td className="p-1 align-top">{renderCollections(concept)}</td>
                <td className="p-1 pr-2 text-right align-top">
                  <button
                    type="button"
                    disabled={pendingConceptId !== null}
                    onClick={() => void deleteConcept(concept)}
                    aria-label={`Delete ${concept.spanish}`}
                    title="Delete concept"
                    className="mt-0.5 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/20 disabled:opacity-40"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
            {concepts.length === 0 && (
              <tr className="border-t border-border">
                <td
                  colSpan={8}
                  className="px-5 py-12 text-center text-sm text-muted-foreground"
                >
                  No concepts match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <nav
        aria-label="Curriculum pages"
        className="mt-4 flex items-center justify-between gap-4"
      >
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => navigate({ page: page - 1 }, false)}
          title="Previous page"
          className="inline-flex size-9 items-center justify-center rounded-md border border-input bg-card text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="sr-only">Previous page</span>
        </button>
        <span className="text-sm font-medium text-muted-foreground">
          Page <span className="text-foreground">{page}</span> of {pageCount}
        </span>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => navigate({ page: page + 1 }, false)}
          title="Next page"
          className="inline-flex size-9 items-center justify-center rounded-md border border-input bg-card text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
          <span className="sr-only">Next page</span>
        </button>
      </nav>
    </div>
  );
}
