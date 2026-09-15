"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, Eye } from "lucide-react";
import type { ReactNode, RefObject } from "react";

import {
  curriculumRoles,
  renderConceptPattern,
  type EditableField,
} from "@/components/curriculum/curriculum-row-editor";
import type { CurriculumConcept, CurriculumRole } from "@/lib/curriculum/types";

type SortValue =
  | "default"
  | "spanish"
  | "spanish-desc"
  | "english"
  | "english-desc"
  | "role";

/**
 * The results list: the desktop `<table>` and the small-screen card list it
 * swaps for below `sm`. Both read from the same `concepts` array and the same
 * selection/editing state, which the table composition still owns — this
 * component is pure rendering plus the row-level callbacks it's handed.
 */
export function CurriculumTableRows({
  concepts,
  selectedIds,
  toggleSelected,
  toggleSelectAllVisible,
  pendingConceptId,
  detailConceptId,
  sort,
  onSort,
  showExamples,
  coverage,
  isNavigating,
  resultsScrollRef,
  onUpdateRole,
  onOpenDetails,
  renderEditableCell,
  onClearFilters,
}: {
  concepts: CurriculumConcept[];
  selectedIds: Set<string>;
  toggleSelected: (id: string) => void;
  toggleSelectAllVisible: () => void;
  pendingConceptId: string | null;
  detailConceptId: string | null;
  sort: SortValue;
  onSort: (next: SortValue | null) => void;
  showExamples: boolean;
  coverage: Record<
    string,
    { lessonId: string; lessonNumber: number; lessonName: string | null }
  >;
  isNavigating: boolean;
  resultsScrollRef: RefObject<HTMLDivElement | null>;
  onUpdateRole: (concept: CurriculumConcept, role: CurriculumRole) => void;
  onOpenDetails: (conceptId: string, opener?: HTMLElement) => void;
  renderEditableCell: (concept: CurriculumConcept, field: EditableField) => ReactNode;
  onClearFilters: () => void;
}) {
  function sortButton(
    label: string,
    cycle: Array<SortValue>,
    icons: Partial<Record<SortValue, typeof ArrowUp>>,
  ) {
    const index = cycle.indexOf(sort);
    const next = cycle[(index + 1) % cycle.length];
    const Icon = icons[sort] ?? ArrowUpDown;
    return (
      <button
        type="button"
        onClick={() => onSort(next === "default" ? null : next)}
        className={`inline-flex items-center gap-1 transition hover:text-foreground ${
          index > 0 ? "text-foreground" : ""
        }`}
      >
        {label}
        <Icon className="size-3.5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <>
      <div
        ref={resultsScrollRef}
        inert={isNavigating ? true : undefined}
        className={`hidden max-h-[calc(100vh-15.5rem)] min-h-72 overflow-auto rounded-xl border border-border bg-card shadow-sm transition-opacity sm:block ${
          isNavigating ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
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
              <th className="min-w-44 px-3 py-2 font-semibold">
                {sortButton(
                  "Spanish",
                  ["default", "spanish", "spanish-desc"],
                  { spanish: ArrowUp, "spanish-desc": ArrowDown },
                )}
              </th>
              <th className="min-w-44 px-3 py-2 font-semibold">
                {sortButton(
                  "English",
                  ["default", "english", "english-desc"],
                  { english: ArrowUp, "english-desc": ArrowDown },
                )}
              </th>
              <th className="w-28 px-3 py-2 font-semibold">
                {sortButton(
                  "Role",
                  ["default", "role"],
                  { role: ArrowUp },
                )}
              </th>
              <th className="w-24 px-3 py-2 font-semibold">Taught</th>
              {showExamples && (
                <th className="min-w-64 px-3 py-2 font-semibold">Examples</th>
              )}
              <th className="w-12 px-2 py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {concepts.map((concept) => (
              <tr
                key={concept.id}
                className={`border-t border-border transition-colors hover:bg-muted/25 ${
                  detailConceptId === concept.id ? "bg-primary/5" : ""
                }`}
              >
                <td className="px-2 py-1 align-top">
                  <input
                    type="checkbox"
                    aria-label={`Select ${concept.spanish}`}
                    checked={selectedIds.has(concept.id)}
                    onChange={() => toggleSelected(concept.id)}
                    className="mt-1.5 size-4 cursor-pointer"
                  />
                </td>
                <td className="p-1 align-top font-medium">
                  {renderEditableCell(concept, "spanish")}
                </td>
                <td className="p-1 align-top">
                  {renderEditableCell(concept, "english")}
                </td>
                <td className="p-1 align-top">
                  <select
                    value={concept.curriculumRole}
                    disabled={pendingConceptId !== null}
                    onChange={(event) =>
                      onUpdateRole(concept, event.target.value as CurriculumRole)
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
                {showExamples && (
                  <td className="p-1 align-top">
                    <div className="min-w-48 text-muted-foreground">
                      {renderEditableCell(concept, "exampleSpanish")}
                      <div className="border-t border-border/60">
                        {renderEditableCell(concept, "exampleEnglish")}
                      </div>
                    </div>
                  </td>
                )}
                <td className="p-1 pr-2 text-right align-top">
                  <button
                    type="button"
                    onClick={(event) => onOpenDetails(concept.id, event.currentTarget)}
                    aria-label={`View details for ${concept.spanish}`}
                    title="View details"
                    className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <Eye className="size-4" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
            {concepts.length === 0 && (
              <tr className="border-t border-border">
                <td
                  colSpan={showExamples ? 7 : 6}
                  className="px-5 py-12 text-center text-sm text-muted-foreground"
                >
                  <p>No concepts match these filters.</p>
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="mt-3 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    Clear filters
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        inert={isNavigating ? true : undefined}
        className={`space-y-2 transition-opacity sm:hidden ${
          isNavigating ? "pointer-events-none opacity-60" : ""
        }`}
      >
        {concepts.map((concept) => (
          <article
            key={concept.id}
            className={`rounded-xl border bg-card p-3 shadow-sm ${
              detailConceptId === concept.id ? "border-primary/40" : "border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                aria-label={`Select ${concept.spanish}`}
                checked={selectedIds.has(concept.id)}
                onChange={() => toggleSelected(concept.id)}
                className="mt-1 size-4 cursor-pointer"
              />
              <button
                type="button"
                onClick={(event) => onOpenDetails(concept.id, event.currentTarget)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block font-semibold leading-snug text-foreground">
                  {renderConceptPattern(concept.spanish)}
                </span>
                <span className="mt-1 block leading-snug text-muted-foreground">
                  {renderConceptPattern(concept.english)}
                </span>
              </button>
              <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <select
                value={concept.curriculumRole}
                disabled={pendingConceptId !== null}
                onChange={(event) =>
                  onUpdateRole(concept, event.target.value as CurriculumRole)
                }
                aria-label={`Curriculum role for ${concept.spanish}`}
                className={`role-select role-${concept.curriculumRole} rounded-md border px-2 py-1 text-xs font-semibold outline-none`}
              >
                {curriculumRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground">
                {concept.collections.length} collection{concept.collections.length === 1 ? "" : "s"}
              </span>
            </div>
          </article>
        ))}
        {concepts.length === 0 && (
          <div className="rounded-xl border border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">
            <p>No concepts match these filters.</p>
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-3 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}
