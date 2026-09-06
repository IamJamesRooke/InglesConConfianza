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
  LayoutList,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { facetGroup, presentFacet, topicTitles } from "./topic-presentation";

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

const topicGroups = [
  {
    label: "Words & grammar",
    slugs: [
      "pronouns",
      "determiners",
      "interrogatives",
      "verbs",
      "nouns",
      "adjectives",
      "adverbs",
      "numbers",
      "expressions",
      "connectors",
      "prepositions",
    ],
  },
  {
    label: "Patterns & construction",
    slugs: [
      "phrasal-verbs-by-root",
      "phrasal-verbs-by-particle",
      "verb-forms",
      "verb-patterns",
      "questions-negation",
      "imperatives",
      "collocations",
    ],
  },
  {
    label: "Mappings & word formation",
    slugs: ["mappings", "en-mappings", "cognates", "transformations"],
  },
] as const;

const collectionGroupLabels: Record<string, string> = {
  es: "Spanish headword",
  en: "English headword",
  pos: "Part of speech",
  grammar: "Grammar",
  construction: "Construction",
  form: "English form",
  conjugation: "Conjugation",
  sense: "Verb sense",
  morphology: "Morphology",
  cognate: "Cognate pattern",
  sound: "Pronunciation",
  rhyme: "Rhyme",
  homophone: "Homophone",
  particle: "Particle",
  topic: "Topic",
  register: "Register",
  dialect: "Dialect",
  contrast: "Contrast",
  gender: "Gender",
  degree: "Degree",
  expr: "Expression",
  qn: "Question & negation",
  imp: "Imperative",
  coll: "Collocation",
  adv: "Adverb",
  audit: "Audit",
};

function groupCollections(collections: string[]) {
  return collections.reduce<Record<string, string[]>>((groups, collection) => {
    const separator = collection.indexOf(":");
    const key = separator > 0 ? collection.slice(0, separator) : "other";
    const group = groups[key] ?? [];
    group.push(collection);
    groups[key] = group;
    return groups;
  }, {});
}

function getFacetLabel(quickFacets: QuickFacet[]) {
  if (quickFacets.length === 0) return "Topic filter";
  const prefixes = new Set(
    quickFacets.map((facet) => facet.collection.split(":", 1)[0]),
  );
  if (prefixes.size !== 1) return "Topic filter";
  const prefix = [...prefixes][0];
  return collectionGroupLabels[prefix] ?? "Topic filter";
}

const curriculumUiStorage = {
  examples: "icc-curriculum-show-examples",
  sidebar: "icc-curriculum-sidebar-open",
  sidebarScroll: "icc-curriculum-sidebar-scroll",
  topicSearch: "icc-curriculum-topic-search",
} as const;

function readStoredBoolean(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) === null
    ? fallback
    : window.localStorage.getItem(key) === "true";
}

function readStoredText(key: string) {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(key) ?? "";
}

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
  activeTopic?: { slug: string; title: string; baseCollection: string } | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, startNavigation] = useTransition();

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
  const [topicSearch, setTopicSearch] = useState(() =>
    readStoredText(curriculumUiStorage.topicSearch),
  );
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    readStoredBoolean(curriculumUiStorage.sidebar, true),
  );
  const [mobileTopicsOpen, setMobileTopicsOpen] = useState(false);
  const [showExamples, setShowExamples] = useState(() =>
    readStoredBoolean(curriculumUiStorage.examples, false),
  );
  const [detailConceptId, setDetailConceptId] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<{
    conceptId: string;
    state: "saving" | "saved" | "error";
  } | null>(null);
  const sidebarScrollRef = useRef<HTMLElement>(null);
  const detailPanelRef = useRef<HTMLElement>(null);
  const detailOpenerRef = useRef<HTMLElement | null>(null);
  const saveFeedbackTimerRef = useRef<number | null>(null);
  const selectedCollection = filters.collection || null;
  const selectedRole = filters.role;
  const sort = filters.sort;
  const detailConcept = concepts.find((concept) => concept.id === detailConceptId);
  const detailConceptIndex = concepts.findIndex(
    (concept) => concept.id === detailConceptId,
  );
  const activeFacet = quickFacets.find((facet) =>
    activeFacets.includes(facet.collection),
  );
  const facetLabel = getFacetLabel(quickFacets);
  const facetGroups = new Map<string, QuickFacet[]>();
  for (const facet of quickFacets) {
    const group = facetGroup(activeTopic?.slug, facet.collection);
    facetGroups.set(group, [...(facetGroups.get(group) ?? []), facet]);
  }
  const groupedTopics = useMemo(() => {
    const query = topicSearch.trim().toLocaleLowerCase();
    const bySlug = new Map(macrotags.map((tag) => [tag.slug, tag]));
    return topicGroups
      .map((group) => ({
        label: group.label,
        topics: group.slugs
          .map((slug) => bySlug.get(slug))
          .filter((topic): topic is Macrotag => Boolean(topic))
          .map((topic) => ({ ...topic, title: topicTitles[topic.slug] ?? topic.title }))
          .filter((topic) => topic.title.toLocaleLowerCase().includes(query)),
      }))
      .filter((group) => group.topics.length > 0);
  }, [macrotags, topicSearch]);

  useEffect(() => {
    window.localStorage.setItem(
      curriculumUiStorage.sidebar,
      String(sidebarOpen),
    );
    window.localStorage.setItem(
      curriculumUiStorage.examples,
      String(showExamples),
    );
    window.sessionStorage.setItem(
      curriculumUiStorage.topicSearch,
      topicSearch,
    );
  }, [showExamples, sidebarOpen, topicSearch]);

  useEffect(() => {
    const storedPosition = Number.parseInt(
      window.sessionStorage.getItem(curriculumUiStorage.sidebarScroll) ?? "0",
      10,
    );
    if (sidebarScrollRef.current && Number.isFinite(storedPosition)) {
      sidebarScrollRef.current.scrollTop = storedPosition;
    }
  }, [sidebarOpen]);

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
  }, [activeCollectionEditor, activeEditor, detailConceptId]);

  useEffect(
    () => () => {
      if (saveFeedbackTimerRef.current) {
        window.clearTimeout(saveFeedbackTimerRef.current);
      }
    },
    [],
  );

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
    startNavigation(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  function selectTopic(slug: string | null) {
    navigate({ topic: slug, facets: null });
    setMobileTopicsOpen(false);
  }

  function openDetails(conceptId: string, opener?: HTMLElement) {
    detailOpenerRef.current = opener ?? null;
    setDetailConceptId(conceptId);
  }

  function closeDetails() {
    setDetailConceptId(null);
    window.setTimeout(() => detailOpenerRef.current?.focus(), 0);
  }

  function markSaving(conceptId: string) {
    if (saveFeedbackTimerRef.current) {
      window.clearTimeout(saveFeedbackTimerRef.current);
    }
    setSaveFeedback({ conceptId, state: "saving" });
  }

  function markSaved(conceptId: string) {
    setSaveFeedback({ conceptId, state: "saved" });
    saveFeedbackTimerRef.current = window.setTimeout(() => {
      setSaveFeedback((current) =>
        current?.conceptId === conceptId ? null : current,
      );
    }, 1800);
  }

  function markSaveError(conceptId: string) {
    setSaveFeedback({ conceptId, state: "error" });
  }

  function clearFilters() {
    setMappingSearch("");
    navigate({
      search: null,
      facets: null,
      collection: null,
      role: null,
      taught: null,
    });
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
    markSaving(concept.id);
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
      markSaved(concept.id);
    } catch {
      setError("Unable to save the concept.");
      markSaveError(concept.id);
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
    markSaving(concept.id);
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
      markSaved(concept.id);
    } catch {
      setError("Unable to save collections.");
      markSaveError(concept.id);
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
    markSaving(concept.id);
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
      markSaved(concept.id);
    } catch {
      setError("Unable to save priority.");
      markSaveError(concept.id);
    } finally {
      setPendingConceptId(null);
    }
  }

  function renderCollections(concept: CurriculumConcept) {
    if (activeCollectionEditor?.conceptId === concept.id) {
      return (
        <div className="space-y-2">
          <textarea
            autoFocus
            rows={4}
            value={activeCollectionEditor.value}
            disabled={pendingConceptId === concept.id}
            aria-label="Edit collections"
            placeholder="grammar:pronoun, topic:conversation"
            onChange={(event) =>
              setActiveCollectionEditor({
                ...activeCollectionEditor,
                value: event.target.value,
              })
            }
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 disabled:opacity-60"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveCollectionEditor(null)}
              disabled={pendingConceptId === concept.id}
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void saveCollectionEditor()}
              disabled={pendingConceptId === concept.id}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              {pendingConceptId === concept.id ? "Saving…" : "Save collections"}
            </button>
          </div>
        </div>
      );
    }

    const relevantCollections = new Set([
      selectedCollection,
      activeTopic?.baseCollection,
      activeFacet?.collection,
    ]);
    const orderedCollections = concept.collections
      .map((collection, index) => ({ collection, index }))
      .sort((left, right) => {
        const leftRelevant = relevantCollections.has(left.collection) ? 0 : 1;
        const rightRelevant = relevantCollections.has(right.collection) ? 0 : 1;
        return leftRelevant - rightRelevant || left.index - right.index;
      })
      .map(({ collection }) => collection);
    const visibleCollections = orderedCollections.slice(0, 2);
    const remainingCount = concept.collections.length - visibleCollections.length;

    return (
      <div className="flex min-w-48 items-center gap-1.5 px-2 py-1">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          {visibleCollections.map((collection) => (
            <button
              key={collection}
              type="button"
              onClick={() => navigate({ collection })}
              title={`Filter by ${collection}`}
              className={`max-w-36 truncate rounded-md border px-2 py-1 text-[11px] font-medium leading-none transition ${
                selectedCollection === collection
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/45 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {collection}
            </button>
          ))}
        </div>
        {remainingCount > 0 && (
          <button
            type="button"
            onClick={(event) => openDetails(concept.id, event.currentTarget)}
            className="shrink-0 rounded-md bg-muted px-2 py-1 text-[11px] font-semibold leading-none text-muted-foreground transition hover:text-foreground"
            aria-label={`View ${remainingCount} more collections for ${concept.spanish}`}
          >
            +{remainingCount}
          </button>
        )}
        <button
          type="button"
          onClick={(event) => openDetails(concept.id, event.currentTarget)}
          aria-label={`View details for ${concept.spanish}`}
          title="View details"
          className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="size-3.5" aria-hidden="true" />
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
      const isExample =
        field === "exampleSpanish" || field === "exampleEnglish";

      if (isExample) {
        return (
          <div className="space-y-2 p-1">
            <textarea
              autoFocus
              rows={3}
              value={activeEditor.value}
              disabled={pendingConceptId === concept.id}
              aria-label={`Edit ${field}`}
              onChange={(event) =>
                setActiveEditor({ ...activeEditor, value: event.target.value })
              }
              onKeyDown={(event) => {
                if (event.key === "Escape" && !detailConceptId) {
                  event.preventDefault();
                  setActiveEditor(null);
                }
              }}
              className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-sm leading-relaxed text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 disabled:opacity-60"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveEditor(null)}
                disabled={pendingConceptId === concept.id}
                className="rounded-md px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveActiveEditor()}
                disabled={pendingConceptId === concept.id}
                className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                {pendingConceptId === concept.id ? "Saving…" : "Save example"}
              </button>
            </div>
          </div>
        );
      }

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
    <div className="relative lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-6">
      <aside
        className={`${
          sidebarOpen ? "lg:w-60" : "lg:w-14"
        } hidden max-h-[calc(100vh-5rem)] self-start overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-[width] lg:sticky lg:top-20 lg:flex lg:flex-col`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-3">
          {sidebarOpen && (
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Browse topics
            </span>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
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
          <div className="flex min-h-0 flex-1 flex-col p-2">
            <label className="relative mb-2 block">
              <span className="sr-only">Search topics</span>
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                value={topicSearch}
                onChange={(event) => setTopicSearch(event.target.value)}
                placeholder="Find a topic"
                className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-2 text-xs outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
              />
            </label>
            <button
              type="button"
              onClick={() => selectTopic(null)}
              aria-current={!activeTopic ? "page" : undefined}
              className={`mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                !activeTopic
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <LayoutList className="size-4" aria-hidden="true" />
              All curriculum
            </button>
            <nav
              ref={sidebarScrollRef}
              aria-label="Curriculum topics"
              onScroll={(event) =>
                window.sessionStorage.setItem(
                  curriculumUiStorage.sidebarScroll,
                  String(event.currentTarget.scrollTop),
                )
              }
              className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1"
            >
              {groupedTopics.map((group) => (
                <div key={group.label}>
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground/70">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.topics.map((topic) => {
                      const selected = activeTopic?.slug === topic.slug;
                      return (
                        <button
                          key={topic.slug}
                          type="button"
                          onClick={() => selectTopic(topic.slug)}
                          aria-current={selected ? "page" : undefined}
                          className={`relative w-full rounded-lg py-1.5 pl-3 pr-2 text-left text-[13px] transition ${
                            selected
                              ? "bg-primary/10 font-semibold text-primary before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {topic.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="m-2 inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
            title={activeTopic?.title ?? "All curriculum"}
          >
            <Menu className="size-4" aria-hidden="true" />
            <span className="sr-only">Open topics</span>
          </button>
        )}
      </aside>

      <section className="min-w-0">
      {error && (
        <p role="alert" className="mb-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="mb-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTopicsOpen((open) => !open)}
          aria-expanded={mobileTopicsOpen}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold shadow-sm"
        >
          <span className="flex items-center gap-2">
            <LayoutList className="size-4 text-primary" aria-hidden="true" />
            {activeTopic ? topicTitles[activeTopic.slug] ?? activeTopic.title : "All curriculum"}
          </span>
          <ChevronRight
            className={`size-4 text-muted-foreground transition ${mobileTopicsOpen ? "rotate-90" : ""}`}
            aria-hidden="true"
          />
        </button>
        {mobileTopicsOpen && (
          <div className="mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-lg">
            <button
              type="button"
              onClick={() => selectTopic(null)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                !activeTopic ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
            >
              All curriculum
            </button>
            {groupedTopics.map((group) => (
              <div key={group.label} className="mt-3">
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground/70">
                  {group.label}
                </p>
                {group.topics.map((topic) => (
                  <button
                    key={topic.slug}
                    type="button"
                    onClick={() => selectTopic(topic.slug)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                      activeTopic?.slug === topic.slug
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {topic.title}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
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
            <option value="all">Show all</option>
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

      {quickFacets.length > 0 && (
        <section aria-label="Subtopics" className="mb-4 rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Explore {activeTopic ? topicTitles[activeTopic.slug] ?? activeTopic.title : "subtopics"}</h2>
            <button
              type="button"
              aria-pressed={activeFacets.length === 0}
              onClick={() => navigate({ facets: null })}
              className={`inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeFacets.length === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              {activeFacets.length === 0 && <Check className="size-3.5" aria-hidden="true" />}
              All subtopics
            </button>
          </div>
          <div className="space-y-4">
            {[...facetGroups].map(([group, facets]) => (
              <div key={group}>
                {facetGroups.size > 1 && <h3 className="mb-2 text-xs font-medium text-muted-foreground">{group}</h3>}
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {facets.map((facet) => {
                    const display = presentFacet(facet);
                    const selected = activeFacets.includes(facet.collection);
                    return (
                      <button
                        key={facet.collection}
                        type="button"
                        aria-pressed={selected}
                        aria-label={display.emphasis ? `${display.label}: ${display.description}` : display.label}
                        title={display.description}
                        onClick={() => navigate({ facets: selected ? null : facet.collection })}
                        className={`flex min-h-10 items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left text-[13px] leading-snug transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary/50 bg-primary/10 text-primary" : "border-transparent bg-muted/30 text-foreground/80 hover:border-border hover:bg-muted"}`}
                      >
                        <span className="min-w-0 break-words">{display.before}{display.emphasis && <strong className="font-bold text-foreground">{display.emphasis}</strong>}{display.after}</span>
                        {selected && <Check className="size-3.5 shrink-0" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(filters.search ||
        activeFacet ||
        selectedCollection ||
        selectedRole !== "all" ||
        coverageFilter !== "all") && (
        <div className="mb-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <Filter className="size-3.5" aria-hidden="true" />
            Active
          </span>
          {filters.search && (
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
          )}
          {activeFacet && (
            <button
              type="button"
              onClick={() => navigate({ facets: null })}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium"
            >
              {facetLabel}: {presentFacet(activeFacet).label}
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
            onClick={() => setShowExamples((shown) => !shown)}
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

      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-sm sm:block">
        <table className="w-full min-w-[900px] border-collapse text-left text-[13px]">
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
              <th className="min-w-60 px-3 py-2 font-semibold">Collections</th>
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
                <td className="p-1 align-top">{renderCollections(concept)}</td>
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
                  colSpan={showExamples ? 8 : 7}
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

      <div className="space-y-2 sm:hidden">
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
        <div className="fixed inset-0 z-50" role="presentation">
          <button
            type="button"
            aria-label="Close concept details"
            onClick={closeDetails}
            className="absolute inset-0 bg-foreground/20 backdrop-blur-[1px]"
          />
          <aside
            ref={detailPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="concept-detail-title"
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Concept details
                </p>
                <h2 id="concept-detail-title" className="mt-1 text-xl font-semibold tracking-tight">
                  {detailConcept.spanish}
                </h2>
                <p className="mt-0.5 text-base text-muted-foreground">
                  {detailConcept.english}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={detailConceptIndex <= 0}
                  onClick={() =>
                    setDetailConceptId(concepts[detailConceptIndex - 1]?.id ?? null)
                  }
                  className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30"
                  aria-label="Previous concept"
                  title="Previous concept"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
                <span className="min-w-12 text-center text-xs font-medium text-muted-foreground">
                  {detailConceptIndex + 1} / {concepts.length}
                </span>
                <button
                  type="button"
                  disabled={detailConceptIndex >= concepts.length - 1}
                  onClick={() =>
                    setDetailConceptId(concepts[detailConceptIndex + 1]?.id ?? null)
                  }
                  className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30"
                  aria-label="Next concept"
                  title="Next concept"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={closeDetails}
                  className="ml-1 inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Close concept details"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
            </header>

            <div
              aria-live="polite"
              className={`min-h-7 border-b border-border px-6 py-1.5 text-xs font-medium ${
                saveFeedback?.conceptId === detailConcept.id &&
                saveFeedback.state === "error"
                  ? "bg-destructive/5 text-destructive"
                  : "bg-muted/35 text-muted-foreground"
              }`}
            >
              {saveFeedback?.conceptId === detailConcept.id
                ? saveFeedback.state === "saving"
                  ? "Saving changes…"
                  : saveFeedback.state === "saved"
                    ? "Changes saved"
                    : "Changes could not be saved. Your edit is still available."
                : "Click a mapping or example to edit it."}
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Mapping
                </h3>
                <div className="rounded-xl border border-border bg-card p-2">
                  <div className="font-medium">{renderEditableCell(detailConcept, "spanish")}</div>
                  <div className="border-t border-border">{renderEditableCell(detailConcept, "english")}</div>
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Bilingual example
                </h3>
                <div className="rounded-xl border border-border bg-card p-2 text-muted-foreground">
                  {renderEditableCell(detailConcept, "exampleSpanish")}
                  <div className="border-t border-border">
                    {renderEditableCell(detailConcept, "exampleEnglish")}
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Collections
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {detailConcept.collections.length} grouped by purpose
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveCollectionEditor({
                        conceptId: detailConcept.id,
                        value: detailConcept.collections.join(", "),
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold transition hover:bg-muted"
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Edit
                  </button>
                </div>
                {activeCollectionEditor?.conceptId === detailConcept.id ? (
                  <div className="rounded-xl border border-border bg-card p-3">
                    {renderCollections(detailConcept)}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Separate exact collection names with commas. Enter saves; Escape cancels.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                    {Object.entries(groupCollections(detailConcept.collections)).map(
                      ([group, collections]) => (
                        <div key={group}>
                          <p className="mb-1.5 text-xs font-semibold text-foreground">
                            {collectionGroupLabels[group] ?? "Other"}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {collections.map((collection) => (
                              <button
                                key={collection}
                                type="button"
                                onClick={() => {
                                  setDetailConceptId(null);
                                  navigate({ collection });
                                }}
                                title={`Filter by ${collection}`}
                                className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
                                  selectedCollection === collection
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                }`}
                              >
                                {collection}
                              </button>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                    {detailConcept.collections.length === 0 && (
                      <p className="text-sm text-muted-foreground">No collections assigned.</p>
                    )}
                  </div>
                )}
              </section>

              <section className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
                <select
                  value={detailConcept.curriculumRole}
                  disabled={pendingConceptId !== null}
                  onChange={(event) =>
                    void updateRole(
                      detailConcept,
                      event.target.value as CurriculumRole,
                    )
                  }
                  aria-label={`Curriculum role for ${detailConcept.spanish}`}
                  className={`role-select role-${detailConcept.curriculumRole} rounded-md border px-3 py-2 text-xs font-semibold outline-none`}
                >
                  {curriculumRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {coverage[detailConcept.id] && (
                  <a
                    href={`/admin/lesson-builder?lesson=${encodeURIComponent(coverage[detailConcept.id].lessonId)}`}
                    className="rounded-md bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
                  >
                    Open Lesson {coverage[detailConcept.id].lessonNumber}
                  </a>
                )}
                <button
                  type="button"
                  disabled={pendingConceptId !== null}
                  onClick={() => void deleteConcept(detailConcept)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-40"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Delete concept
                </button>
              </section>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
