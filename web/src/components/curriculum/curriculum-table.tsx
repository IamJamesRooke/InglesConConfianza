"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CurriculumBrowsePanel } from "@/components/curriculum/curriculum-browse-panel";
import { CurriculumConceptDetails } from "@/components/curriculum/curriculum-concept-details";
import {
  curriculumRoles,
  EditableCell,
  getRoleLabel,
  renderConceptPattern,
  type EditableField,
} from "@/components/curriculum/curriculum-row-editor";
import { useCurriculumEditing } from "@/components/curriculum/use-curriculum-editing";
import { useCurriculumNavigation } from "@/components/curriculum/use-curriculum-navigation";
import type { CurriculumNavigationFamilyWithCounts } from "@/lib/curriculum/navigation";
import type {
  CurriculumConcept,
  CurriculumRole,
} from "@/lib/curriculum/types";

type Macrotag = { slug: string; title: string };

const curriculumUiStorage = {
  examples: "icc-curriculum-show-examples",
  sidebar: "icc-curriculum-sidebar-open",
} as const;

export function CurriculumTable({
  initialConcepts,
  totalConcepts,
  page,
  pageCount,
  pageSize = 100,
  coverage = {},
  coverageFilter = "all",
  filters,
  macrotags = [],
  activeTopic = null,
  families = [],
  activeFamilyId = "",
  activeLeafCollection = "",
  legacyFacets = [],
  scopeLabel = "All curriculum",
  topicCount = 0,
  resultKey = "",
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
  macrotags?: Macrotag[];
  activeTopic?: { slug: string; title: string; baseCollection: string } | null;
  families?: CurriculumNavigationFamilyWithCounts[];
  activeFamilyId?: string;
  activeLeafCollection?: string;
  legacyFacets?: string[];
  scopeLabel?: string;
  topicCount?: number;
  resultKey?: string;
}) {
  const { isNavigating, navigate, selectTopic, selectFamily, selectLeaf: navSelectLeaf } =
    useCurriculumNavigation();
  const {
    concepts,
    activeEditor,
    setActiveEditor,
    activeCollectionEditor,
    setActiveCollectionEditor,
    pendingConceptId,
    selectedIds,
    setSelectedIds,
    bulkDeleting,
    error,
    setError,
    saveFeedback,
    saveActiveEditor,
    saveCollectionEditor,
    deleteConcept,
    updateRole,
    toggleSelected,
    toggleSelectAllVisible,
    deleteSelected,
    moveSelectedToTrash,
  } = useCurriculumEditing({ initialConcepts, resultKey });

  const [mappingSearch, setMappingSearch] = useState(filters.search);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileTopicsOpen, setMobileTopicsOpen] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [detailConceptId, setDetailConceptId] = useState<string | null>(null);
  const detailPanelRef = useRef<HTMLElement>(null);
  const mobileBrowseRef = useRef<HTMLElement>(null);
  const mobileBrowseOpenerRef = useRef<HTMLButtonElement>(null);
  const resultsScrollRef = useRef<HTMLDivElement>(null);
  const detailOpenerRef = useRef<HTMLElement | null>(null);
  const selectedCollection = filters.collection || null;
  const selectedRole = filters.role;
  const sort = filters.sort;
  const detailConcept = concepts.find((concept) => concept.id === detailConceptId);
  const detailConceptIndex = concepts.findIndex(
    (concept) => concept.id === detailConceptId,
  );
  const activeFamily = families.find((family) => family.id === activeFamilyId);
  const configuredFamilies = families.filter(
    (family) => family.id !== "outside-families",
  );
  const showFamilyLevel = configuredFamilies.length > 1;
  const browseFamily =
    activeFamily ?? (!showFamilyLevel ? configuredFamilies[0] : undefined);
  const activeLeaf = browseFamily?.leaves.find(
    (leaf) => leaf.collection === activeLeafCollection,
  );

  useEffect(() => {
    const savedSidebar = window.localStorage.getItem(curriculumUiStorage.sidebar);
    const savedExamples = window.localStorage.getItem(curriculumUiStorage.examples);
    if (savedSidebar !== null) {
      // Preferences load after hydration so the server and first client render match.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSidebarOpen(savedSidebar === "true");
    }
    if (savedExamples !== null) {
      setShowExamples(savedExamples === "true");
    }
  }, []);

  function toggleSidebar() {
    setSidebarOpen((open) => {
      const next = !open;
      window.localStorage.setItem(curriculumUiStorage.sidebar, String(next));
      return next;
    });
  }

  function openSidebar() {
    setSidebarOpen(true);
    window.localStorage.setItem(curriculumUiStorage.sidebar, "true");
  }

  function toggleExamples() {
    setShowExamples((shown) => {
      const next = !shown;
      window.localStorage.setItem(curriculumUiStorage.examples, String(next));
      return next;
    });
  }

  useEffect(() => {
    // A new scope closes the open detail and returns the results to the top;
    // the editing hook clears its own row selection on the same key.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetailConceptId(null);
    if (resultsScrollRef.current) resultsScrollRef.current.scrollTop = 0;
  }, [resultKey]);

  useEffect(() => {
    // Back/Forward navigation must restore the submitted search value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMappingSearch(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (!detailConceptId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    detailPanelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [detailConceptId]);

  useEffect(() => {
    if (!mobileTopicsOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mobileBrowseRef.current?.focus();

    function handleMobileBrowseKeys(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMobileBrowser();
        return;
      }
      if (event.key !== "Tab" || !mobileBrowseRef.current) return;
      const focusable = mobileBrowseRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), select:not([disabled])",
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleMobileBrowseKeys);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleMobileBrowseKeys);
    };
  }, [mobileTopicsOpen]);

  useEffect(() => {
    if (!detailConceptId) return;

    function handleDetailKeys(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (activeCollectionEditor) {
          setActiveCollectionEditor(null);
        } else if (activeEditor) {
          setActiveEditor(null);
        } else {
          setDetailConceptId(null);
          window.setTimeout(() => detailOpenerRef.current?.focus(), 0);
        }
        return;
      }

      if (event.key !== "Tab" || !detailPanelRef.current) return;
      const focusable = detailPanelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleDetailKeys);
    return () => window.removeEventListener("keydown", handleDetailKeys);
  }, [
    activeCollectionEditor,
    activeEditor,
    detailConceptId,
    setActiveCollectionEditor,
    setActiveEditor,
  ]);

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

  function closeMobileBrowser() {
    setMobileTopicsOpen(false);
    window.setTimeout(() => mobileBrowseOpenerRef.current?.focus(), 0);
  }

  function selectLeaf(familyId: string, collection: string | null) {
    navSelectLeaf(familyId, collection);
    closeMobileBrowser();
  }

  function openDetails(conceptId: string, opener?: HTMLElement) {
    detailOpenerRef.current = opener ?? null;
    setDetailConceptId(conceptId);
  }

  function closeDetails() {
    setDetailConceptId(null);
    window.setTimeout(() => detailOpenerRef.current?.focus(), 0);
  }

  function clearFilters() {
    setMappingSearch("");
    navigate({
      search: null,
      collection: null,
      role: null,
      taught: null,
      ...(legacyFacets.length > 0 ? { facets: null } : {}),
    });
  }

  function renderEditableCell(concept: CurriculumConcept, field: EditableField) {
    return (
      <EditableCell
        concept={concept}
        field={field}
        activeEditor={activeEditor}
        pendingConceptId={pendingConceptId}
        detailConceptId={detailConceptId}
        onActiveEditorChange={setActiveEditor}
        onSave={() => void saveActiveEditor()}
        onErrorClear={() => setError(null)}
      />
    );
  }

  return (
    <div className="relative lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-4">
      <aside
        className={`${
          sidebarOpen ? "lg:w-72 xl:w-80" : "lg:w-14"
        } hidden h-[calc(100vh-5rem)] min-h-[560px] self-start overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-[width] lg:sticky lg:top-16 lg:flex lg:flex-col`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-3">
          {sidebarOpen && (
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Browse curriculum
            </span>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label={sidebarOpen ? "Collapse topics" : "Expand topics"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="size-4" aria-hidden="true" />
            ) : (
              <PanelLeftOpen className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {sidebarOpen ? (
          <CurriculumBrowsePanel
            macrotags={macrotags}
            activeTopic={activeTopic}
            families={families}
            activeFamilyId={activeFamilyId}
            activeLeafCollection={activeLeafCollection}
            topicCount={topicCount}
            scopeLabel={scopeLabel}
            onSelectTopic={selectTopic}
            onSelectFamily={selectFamily}
            onSelectLeaf={selectLeaf}
            onCloseMobileBrowser={closeMobileBrowser}
          />
        ) : (
          <button
            type="button"
            onClick={openSidebar}
            className="m-2 inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
            title={activeTopic?.title ?? "All curriculum"}
          >
            <Menu className="size-4" aria-hidden="true" />
            <span className="sr-only">Open topics</span>
          </button>
        )}
      </aside>

      <section className="min-w-0" aria-busy={isNavigating}>
      {error && (
        <p role="alert" className="mb-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="mb-3 lg:hidden">
        <button
          ref={mobileBrowseOpenerRef}
          type="button"
          onClick={() => setMobileTopicsOpen((open) => !open)}
          aria-expanded={mobileTopicsOpen}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold shadow-sm"
        >
          <span className="flex items-center gap-2">
            <Menu className="size-4 text-primary" aria-hidden="true" />
            <span className="min-w-0 truncate">{scopeLabel}</span>
          </span>
          <ChevronRight
            className={`size-4 text-muted-foreground transition ${mobileTopicsOpen ? "rotate-90" : ""}`}
            aria-hidden="true"
          />
        </button>
        {mobileTopicsOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
            <button
              type="button"
              aria-label="Close curriculum browser"
              onClick={closeMobileBrowser}
              className="absolute inset-0 bg-foreground/20 backdrop-blur-[1px]"
            />
            <aside
              ref={mobileBrowseRef}
              role="dialog"
              aria-modal="true"
              aria-label="Browse curriculum"
              tabIndex={-1}
              className="absolute inset-y-0 left-0 flex w-[min(92vw,24rem)] flex-col overflow-hidden border-r border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-3">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Browse curriculum
                </span>
                <button
                  type="button"
                  onClick={closeMobileBrowser}
                  aria-label="Close curriculum browser"
                  className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <CurriculumBrowsePanel
                mobile
                macrotags={macrotags}
                activeTopic={activeTopic}
                families={families}
                activeFamilyId={activeFamilyId}
                activeLeafCollection={activeLeafCollection}
                topicCount={topicCount}
                scopeLabel={scopeLabel}
                onSelectTopic={selectTopic}
                onSelectFamily={selectFamily}
                onSelectLeaf={selectLeaf}
                onCloseMobileBrowser={closeMobileBrowser}
              />
            </aside>
          </div>
        )}
      </div>

      <div className="mb-2 flex min-h-9 flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => selectTopic(null)}
              className="hover:text-foreground hover:underline"
            >
              Curriculum
            </button>
            {activeTopic && (
              <>
                <ChevronRight className="size-3" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => selectFamily(null)}
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
                  onClick={() => selectLeaf(activeFamily.id, null)}
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

      <form
        aria-busy={isNavigating}
        className="lg:sticky lg:top-[57px] z-30 mb-3 grid gap-2 rounded-xl border border-border bg-card/95 p-3 shadow-sm backdrop-blur sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ search: mappingSearch.trim() });
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
              onChange={(event) => setMappingSearch(event.target.value)}
              placeholder={`Search in ${scopeLabel}`}
              className="h-10 w-full rounded-lg border border-input bg-background py-2 pl-9 pr-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
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
          Role
          <select
            value={selectedRole}
            onChange={(event) => navigate({ role: event.target.value })}
            className="h-10 min-w-32 rounded-lg border border-input bg-background px-3 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
          >
            <option value="all">All roles (includes Trash)</option>
            {curriculumRoles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Taught
          <select
            value={coverageFilter}
            onChange={(event) =>
              navigate({
                taught:
                  event.target.value === "all" ? null : event.target.value,
              })
            }
            className="h-10 min-w-32 rounded-lg border border-input bg-background px-3 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
          >
            <option value="all">Show all</option>
            <option value="taught">Taught</option>
            <option value="untaught">Not yet taught</option>
          </select>
        </label>
      </form>

      {(filters.search ||
        legacyFacets.length > 0 ||
        selectedCollection ||
        selectedRole !== "all" ||
        coverageFilter !== "all") && (
        <div className="mb-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <Filter className="size-3.5" aria-hidden="true" />
            Active
          </span>
          {filters.search && (
            <>
              <button
                type="button"
                onClick={() => {
                  setMappingSearch("");
                  navigate({ search: null });
                }}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium"
              >
                Search: {filters.search}
                <X className="size-3" aria-hidden="true" />
              </button>
              {activeTopic && (
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      topic: null,
                      family: null,
                      leaf: null,
                      facets: null,
                      collection: null,
                    })
                  }
                  className="px-1 py-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
                >
                  Search all curriculum
                </button>
              )}
            </>
          )}
          {legacyFacets.length > 0 && (
            <button
              type="button"
              onClick={() => navigate({ facets: null })}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium"
            >
              Legacy filters: {legacyFacets.length}
              <X className="size-3" aria-hidden="true" />
            </button>
          )}
          {selectedCollection && (
            <button
              type="button"
              onClick={() => navigate({ collection: null })}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium"
            >
              Collection: {selectedCollection}
              <X className="size-3" aria-hidden="true" />
            </button>
          )}
          {selectedRole !== "all" && (
            <button
              type="button"
              onClick={() => navigate({ role: null })}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium"
            >
              Role: {getRoleLabel(selectedRole)}
              <X className="size-3" aria-hidden="true" />
            </button>
          )}
          {coverageFilter !== "all" && (
            <button
              type="button"
              onClick={() => navigate({ taught: null })}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium"
            >
              {coverageFilter === "taught" ? "Taught" : "Not yet taught"}
              <X className="size-3" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={clearFilters}
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
                onClick={() => navigate({ page: page - 1 }, false)}
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
                onClick={() => navigate({ page: page + 1 }, false)}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-35"
                aria-label="Next page"
              >
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={toggleExamples}
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

      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
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
              onClick={() =>
                selectedRole === "Trash"
                  ? void deleteSelected()
                  : void moveSelectedToTrash()
              }
              disabled={bulkDeleting}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-40 ${
                selectedRole === "Trash"
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              {bulkDeleting
                ? selectedRole === "Trash"
                  ? "Deleting…"
                  : "Moving…"
                : selectedRole === "Trash"
                  ? `Delete ${selectedIds.size} selected`
                  : `Move ${selectedIds.size} to Trash`}
            </button>
          </div>
        </div>
      )}

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
                    onClick={(event) => openDetails(concept.id, event.currentTarget)}
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
                    onClick={clearFilters}
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
                onClick={(event) => openDetails(concept.id, event.currentTarget)}
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
                  void updateRole(concept, event.target.value as CurriculumRole)
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
              onClick={clearFilters}
              className="mt-3 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              Clear filters
            </button>
          </div>
        )}
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
      </section>

      {detailConcept && (
        <CurriculumConceptDetails
          concept={detailConcept}
          conceptIndex={detailConceptIndex}
          conceptCount={concepts.length}
          coverage={coverage}
          detailPanelRef={detailPanelRef}
          pendingConceptId={pendingConceptId}
          saveFeedback={saveFeedback}
          activeEditor={activeEditor}
          activeCollectionEditor={activeCollectionEditor}
          selectedCollection={selectedCollection}
          onClose={closeDetails}
          onStep={(delta) =>
            setDetailConceptId(concepts[detailConceptIndex + delta]?.id ?? null)
          }
          onActiveEditorChange={setActiveEditor}
          onSaveActiveEditor={() => void saveActiveEditor()}
          onErrorClear={() => setError(null)}
          onActiveCollectionEditorChange={setActiveCollectionEditor}
          onSaveCollectionEditor={() => void saveCollectionEditor()}
          onOpenCollectionEditor={() =>
            setActiveCollectionEditor({
              conceptId: detailConcept.id,
              value: detailConcept.collections.join(", "),
            })
          }
          onNavigateCollection={(collection) => {
            setDetailConceptId(null);
            navigate({ collection });
          }}
          onUpdateRole={(concept, role) => void updateRole(concept, role)}
          onDelete={(concept) => void deleteConcept(concept)}
        />
      )}
    </div>
  );
}
