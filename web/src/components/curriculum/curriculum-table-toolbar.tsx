"use client";

import { Check, ChevronLeft, ChevronRight, Eye, Filter, Search, X } from "lucide-react";

import type { LevelChecklistSummary } from "@/lib/curriculum/level-checklist";

/**
 * Everything above the results list: the scope breadcrumb/title, the Level-1
 * progress bar and "used in a module" summary, the search + filters form, the
 * active-filter chip row, and the results count with its compact pager and
 * the Examples toggle. Pure presentation over props/callbacks the table
 * already computed — no state of its own.
 */
export function CurriculumTableToolbar({
  isNavigating,
  activeTopic,
  activeFamily,
  showFamilyLevel,
  activeLeaf,
  scopeLabel,
  levelChecklist,
  usageSummary,
  usageFilter,
  mappingSearch,
  onMappingSearchChange,
  onSubmitSearch,
  onClearSearch,
  levelFilterValue,
  levelFilterLabel,
  onLevelFilterChange,
  coverageFilter,
  onCoverageFilterChange,
  onUsageFilterChange,
  filtersSearch,
  legacyFacetsCount,
  selectedCollection,
  onClearLegacyFacets,
  onClearCollection,
  onClearLevelFilter,
  onClearCoverageFilter,
  onClearFilters,
  onSearchAllCurriculum,
  firstVisibleConcept,
  lastVisibleConcept,
  totalConcepts,
  page,
  pageCount,
  onPreviousPage,
  onNextPage,
  showExamples,
  onToggleExamples,
  onSelectTopic,
  onSelectFamily,
  onSelectLeaf,
}: {
  isNavigating: boolean;
  activeTopic: { slug: string; title: string; baseCollection: string } | null;
  activeFamily: { id: string; label: string } | undefined;
  showFamilyLevel: boolean;
  activeLeaf: { collection: string; label: string } | undefined;
  scopeLabel: string;
  levelChecklist: LevelChecklistSummary | null;
  usageSummary: { used: number } | null;
  usageFilter: "all" | "used" | "never";
  mappingSearch: string;
  onMappingSearchChange: (value: string) => void;
  onSubmitSearch: () => void;
  onClearSearch: () => void;
  levelFilterValue: string;
  levelFilterLabel: string;
  onLevelFilterChange: (value: string) => void;
  coverageFilter: "all" | "taught" | "untaught";
  onCoverageFilterChange: (value: string) => void;
  onUsageFilterChange: (value: string) => void;
  filtersSearch: string;
  legacyFacetsCount: number;
  selectedCollection: string | null;
  onClearLegacyFacets: () => void;
  onClearCollection: () => void;
  onClearLevelFilter: () => void;
  onClearCoverageFilter: () => void;
  onClearFilters: () => void;
  onSearchAllCurriculum: () => void;
  firstVisibleConcept: number;
  lastVisibleConcept: number;
  totalConcepts: number;
  page: number;
  pageCount: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  showExamples: boolean;
  onToggleExamples: () => void;
  onSelectTopic: (slug: string | null) => void;
  onSelectFamily: (familyId: string | null) => void;
  onSelectLeaf: (familyId: string, collection: string | null) => void;
}) {
  return (
    <>
      <div className="mb-2 flex min-h-9 flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => onSelectTopic(null)}
              className="hover:text-foreground hover:underline"
            >
              Curriculum
            </button>
            {activeTopic && (
              <>
                <ChevronRight className="size-3" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => onSelectFamily(null)}
                  className="hover:text-foreground hover:underline"
                >
                  {activeTopic.title}
                </button>
              </>
            )}
            {activeFamily &&
              (showFamilyLevel || activeFamily.id === "outside-families") && (
              <>
                <ChevronRight className="size-3" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => onSelectLeaf(activeFamily.id, null)}
                  className="hover:text-foreground hover:underline"
                >
                  {activeFamily.label}
                </button>
              </>
            )}
            {activeLeaf && (
              <>
                <ChevronRight className="size-3" aria-hidden="true" />
                <span className="text-foreground">{activeLeaf.label}</span>
              </>
            )}
          </div>
          <h1 className="mt-0.5 truncate text-xl font-semibold tracking-tight">
            {scopeLabel}
          </h1>
        </div>
      </div>

      {levelChecklist && levelChecklist.total > 0 && (
        <div className="mb-3 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Level ≤ {levelChecklist.maxLevel} · taught {levelChecklist.taught} /{" "}
            {levelChecklist.total} concepts
          </p>
          <div
            role="progressbar"
            aria-valuenow={levelChecklist.taught}
            aria-valuemin={0}
            aria-valuemax={levelChecklist.total}
            aria-label={`Level ${levelChecklist.maxLevel} taught progress`}
            className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{
                width: `${Math.round(
                  (levelChecklist.taught / levelChecklist.total) * 100,
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {usageSummary && (
        <div className="mb-3 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            {usageFilter === "used" ? "Used in a module" : "Never used"} — {usageSummary.used}{" "}
            {usageSummary.used === 1 ? "concept is" : "concepts are"} required by some module&rsquo;s
            syllabus
          </p>
        </div>
      )}

      <form
        aria-busy={isNavigating}
        className="lg:sticky lg:top-[57px] z-30 mb-3 grid gap-2 rounded-xl border border-border bg-card/95 p-3 shadow-sm backdrop-blur sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitSearch();
        }}
      >
        <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-1">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">
              Search Spanish or English in {scopeLabel}
            </span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={mappingSearch}
              onChange={(event) => onMappingSearchChange(event.target.value)}
              placeholder={`Search in ${scopeLabel}`}
              className="h-10 w-full rounded-lg border border-input bg-background py-2 pl-9 pr-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
            />
            {mappingSearch && (
              <button
                type="button"
                onClick={onClearSearch}
                aria-label="Clear mapping search"
                className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </label>
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            title="Search (Enter)"
          >
            <Search className="size-4" aria-hidden="true" />
            <span className="hidden 2xl:inline">Search</span>
          </button>
        </div>
        <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Level ≤
          <select
            value={levelFilterValue}
            onChange={(event) => onLevelFilterChange(event.target.value)}
            className="h-10 min-w-32 rounded-lg border border-input bg-background px-3 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="all">All levels (includes Trash)</option>
            <option value="Unranked">Unranked only</option>
            <option value="Trash">Trash only</option>
          </select>
        </label>
        <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Taught
          <select
            value={coverageFilter}
            onChange={(event) => onCoverageFilterChange(event.target.value)}
            className="h-10 min-w-32 rounded-lg border border-input bg-background px-3 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
          >
            <option value="all">Show all</option>
            <option value="taught">Taught</option>
            <option value="untaught">Not yet taught</option>
          </select>
        </label>
        <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Module usage
          <select
            value={usageFilter}
            onChange={(event) => onUsageFilterChange(event.target.value)}
            className="h-10 min-w-32 rounded-lg border border-input bg-background px-3 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
          >
            <option value="all">Show all</option>
            <option value="used">Used in a module</option>
            <option value="never">Never used</option>
          </select>
        </label>
      </form>

      {(filtersSearch ||
        legacyFacetsCount > 0 ||
        selectedCollection ||
        levelFilterValue !== "all" ||
        coverageFilter !== "all") && (
        <div className="mb-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <Filter className="size-3.5" aria-hidden="true" />
            Active
          </span>
          {filtersSearch && (
            <>
              <button
                type="button"
                onClick={onClearSearch}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium"
              >
                Search: {filtersSearch}
                <X className="size-3" aria-hidden="true" />
              </button>
              {activeTopic && (
                <button
                  type="button"
                  onClick={onSearchAllCurriculum}
                  className="px-1 py-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
                >
                  Search all curriculum
                </button>
              )}
            </>
          )}
          {legacyFacetsCount > 0 && (
            <button
              type="button"
              onClick={onClearLegacyFacets}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium"
            >
              Legacy filters: {legacyFacetsCount}
              <X className="size-3" aria-hidden="true" />
            </button>
          )}
          {selectedCollection && (
            <button
              type="button"
              onClick={onClearCollection}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium"
            >
              Collection: {selectedCollection}
              <X className="size-3" aria-hidden="true" />
            </button>
          )}
          {levelFilterValue !== "all" && (
            <button
              type="button"
              onClick={onClearLevelFilter}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium"
            >
              {levelFilterLabel}
              <X className="size-3" aria-hidden="true" />
            </button>
          )}
          {coverageFilter !== "all" && (
            <button
              type="button"
              onClick={onClearCoverageFilter}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium"
            >
              {coverageFilter === "taught" ? "Taught" : "Not yet taught"}
              <X className="size-3" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={onClearFilters}
            className="px-1 py-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isNavigating ? (
            <span role="status" className="inline-flex items-center gap-2 font-medium">
              <span className="size-2 animate-pulse rounded-full bg-primary" />
              Updating results…
            </span>
          ) : (
            <>
              <span className="font-semibold text-foreground">
                {firstVisibleConcept}-{lastVisibleConcept}
              </span>{" "}
              of {totalConcepts} concepts
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          {pageCount > 1 && (
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5 shadow-sm">
              <button
                type="button"
                disabled={page <= 1}
                onClick={onPreviousPage}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-35"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-3.5" aria-hidden="true" />
              </button>
              <span className="min-w-16 text-center text-xs font-medium text-muted-foreground">
                {page} / {pageCount}
              </span>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={onNextPage}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-35"
                aria-label="Next page"
              >
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={onToggleExamples}
            aria-pressed={showExamples}
            className={`hidden items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition sm:inline-flex ${
              showExamples
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {showExamples ? (
              <Check className="size-3.5" aria-hidden="true" />
            ) : (
              <Eye className="size-3.5" aria-hidden="true" />
            )}
            Examples
          </button>
        </div>
      </div>
    </>
  );
}
