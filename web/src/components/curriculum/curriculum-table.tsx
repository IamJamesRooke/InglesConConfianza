"use client";

import { useEffect, useRef, useState } from "react";

import { CurriculumBulkActionBar } from "@/components/curriculum/curriculum-bulk-action-bar";
import { CurriculumConceptDetails } from "@/components/curriculum/curriculum-concept-details";
import { CurriculumPagination } from "@/components/curriculum/curriculum-pagination";
import {
  EditableCell,
  type EditableField,
} from "@/components/curriculum/curriculum-row-editor";
import { CurriculumTableRows } from "@/components/curriculum/curriculum-table-rows";
import { CurriculumTableSidebar } from "@/components/curriculum/curriculum-table-sidebar";
import { CurriculumTableToolbar } from "@/components/curriculum/curriculum-table-toolbar";
import { useCurriculumEditing } from "@/components/curriculum/use-curriculum-editing";
import { useCurriculumNavigation } from "@/components/curriculum/use-curriculum-navigation";
import type { CurriculumNavigationFamilyWithCounts } from "@/lib/curriculum/navigation";
import type { LevelChecklistSummary } from "@/lib/curriculum/level-checklist";
import {
  roleForLevel,
  type CurriculumConcept,
  type CurriculumLevel,
  type CurriculumRole,
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
  levelChecklist = null,
  moduleUsage = {},
  usageFilter = "all",
  usageSummary = null,
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
  levelChecklist?: LevelChecklistSummary | null;
  // "Required by" — see docs/design/module-syllabus.md §7. Levels are
  // retired; a module's syllabus is the new "must-teach" source of truth.
  moduleUsage?: Record<
    string,
    { moduleId: string; moduleName: string | null; list: "main" | "review" }[]
  >;
  usageFilter?: "all" | "used" | "never";
  usageSummary?: { used: number } | null;
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
    maxLevel?: CurriculumLevel;
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
  const {
    isNavigating,
    navigate,
    selectTopic,
    selectFamily,
    selectLeaf: navSelectLeaf,
    goToPage,
  } = useCurriculumNavigation();
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
    applyInlineLevel,
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
  // The single "Level ≤ N" control folds together the store's independent
  // `maxLevel` ceiling and `role` exact-match filters: a number sets maxLevel,
  // "Unranked"/"Trash" sets role, and "all" clears both explicitly (so the
  // page's own maxLevel=1 default doesn't reassert itself).
  const levelFilterValue: string =
    selectedRole === "Unranked" || selectedRole === "Trash"
      ? selectedRole
      : filters.maxLevel
        ? String(filters.maxLevel)
        : "all";
  const levelFilterLabel =
    levelFilterValue === "Unranked" || levelFilterValue === "Trash"
      ? levelFilterValue
      : levelFilterValue === "all"
        ? "All levels"
        : `Level ≤ ${levelFilterValue}`;

  function handleLevelFilterChange(value: string) {
    if (value === "Unranked" || value === "Trash") {
      navigate({ role: value, maxLevel: null });
    } else if (value === "all") {
      // `navigate` treats the string "all" as "clear this param" for every
      // key, so an explicit "every level" choice needs a sentinel ("0", not a
      // real level) that survives in the URL — otherwise the page's own
      // maxLevel=1 default would reassert itself once the param is gone.
      navigate({ role: null, maxLevel: "0" });
    } else {
      navigate({ role: null, maxLevel: value });
    }
  }
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

  // Set level in place: Alt+1..5 sets Level 1..5, Alt+0 sets Unranked, on
  // whichever row is focused (exactly one row checked) or open in the detail
  // panel. Alt+digit doesn't collide with any Lesson Builder shortcut (those
  // are all Ctrl+Alt+<key> or Alt+ArrowUp/Down) or a browser default.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }
      if (!/^[0-5]$/.test(event.key)) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const targetId =
        selectedIds.size === 1 ? [...selectedIds][0] : detailConceptId;
      if (!targetId) return;
      event.preventDefault();
      const role: CurriculumRole =
        event.key === "0" ? "Unranked" : roleForLevel(Number(event.key) as CurriculumLevel);
      void applyInlineLevel(targetId, role);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, detailConceptId, applyInlineLevel]);

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
      maxLevel: "0",
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
      <CurriculumTableSidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        openSidebar={openSidebar}
        mobileTopicsOpen={mobileTopicsOpen}
        onToggleMobileTopics={() => setMobileTopicsOpen((open) => !open)}
        closeMobileBrowser={closeMobileBrowser}
        mobileBrowseRef={mobileBrowseRef}
        mobileBrowseOpenerRef={mobileBrowseOpenerRef}
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
      />

      <section className="min-w-0" aria-busy={isNavigating}>
      {error && (
        <p role="alert" className="mb-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <CurriculumTableToolbar
        isNavigating={isNavigating}
        activeTopic={activeTopic}
        activeFamily={activeFamily}
        showFamilyLevel={showFamilyLevel}
        activeLeaf={activeLeaf}
        scopeLabel={scopeLabel}
        levelChecklist={levelChecklist}
        usageSummary={usageSummary}
        usageFilter={usageFilter}
        mappingSearch={mappingSearch}
        onMappingSearchChange={setMappingSearch}
        onSubmitSearch={() => navigate({ search: mappingSearch.trim() })}
        onClearSearch={() => {
          setMappingSearch("");
          navigate({ search: null });
        }}
        levelFilterValue={levelFilterValue}
        levelFilterLabel={levelFilterLabel}
        onLevelFilterChange={handleLevelFilterChange}
        coverageFilter={coverageFilter}
        onCoverageFilterChange={(value) =>
          navigate({ taught: value === "all" ? null : value })
        }
        onUsageFilterChange={(value) =>
          navigate({ usage: value === "all" ? null : value })
        }
        filtersSearch={filters.search}
        legacyFacetsCount={legacyFacets.length}
        selectedCollection={selectedCollection}
        onClearLegacyFacets={() => navigate({ facets: null })}
        onClearCollection={() => navigate({ collection: null })}
        onClearLevelFilter={() => handleLevelFilterChange("all")}
        onClearCoverageFilter={() => navigate({ taught: null })}
        onClearFilters={clearFilters}
        onSearchAllCurriculum={() =>
          navigate({
            topic: null,
            family: null,
            leaf: null,
            facets: null,
            collection: null,
          })
        }
        firstVisibleConcept={firstVisibleConcept}
        lastVisibleConcept={lastVisibleConcept}
        totalConcepts={totalConcepts}
        page={page}
        pageCount={pageCount}
        onPreviousPage={() => goToPage(page - 1)}
        onNextPage={() => goToPage(page + 1)}
        showExamples={showExamples}
        onToggleExamples={toggleExamples}
        onSelectTopic={selectTopic}
        onSelectFamily={selectFamily}
        onSelectLeaf={selectLeaf}
      />

      {selectedIds.size > 0 && (
        <CurriculumBulkActionBar
          selectedCount={selectedIds.size}
          selectedRole={selectedRole}
          bulkDeleting={bulkDeleting}
          onClearSelection={() => setSelectedIds(new Set())}
          onDeleteOrTrash={() =>
            selectedRole === "Trash" ? void deleteSelected() : void moveSelectedToTrash()
          }
        />
      )}

      <CurriculumTableRows
        concepts={concepts}
        selectedIds={selectedIds}
        toggleSelected={toggleSelected}
        toggleSelectAllVisible={toggleSelectAllVisible}
        pendingConceptId={pendingConceptId}
        detailConceptId={detailConceptId}
        sort={sort}
        onSort={(next) => navigate({ sort: next })}
        showExamples={showExamples}
        coverage={coverage}
        isNavigating={isNavigating}
        resultsScrollRef={resultsScrollRef}
        onUpdateRole={(concept, role) => void updateRole(concept, role)}
        onOpenDetails={openDetails}
        renderEditableCell={renderEditableCell}
        onClearFilters={clearFilters}
      />

      <CurriculumPagination
        page={page}
        pageCount={pageCount}
        onPreviousPage={() => goToPage(page - 1)}
        onNextPage={() => goToPage(page + 1)}
      />
      </section>

      {detailConcept && (
        <CurriculumConceptDetails
          concept={detailConcept}
          conceptIndex={detailConceptIndex}
          conceptCount={concepts.length}
          coverage={coverage}
          moduleUsage={moduleUsage}
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
