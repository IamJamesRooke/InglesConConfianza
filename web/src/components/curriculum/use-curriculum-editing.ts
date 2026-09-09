"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  getEditableValue,
  updateEditableValue,
  type ActiveCollectionEditor,
  type ActiveEditor,
} from "@/components/curriculum/curriculum-row-editor";
import type { CurriculumConcept, CurriculumRole } from "@/lib/curriculum/types";

type SaveFeedback = {
  conceptId: string;
  state: "saving" | "saved" | "error";
};

const CONCEPT_ENDPOINT = "/api/admin/curriculum/concepts";

function conceptUrl(conceptId: string) {
  return `${CONCEPT_ENDPOINT}/${encodeURIComponent(conceptId)}`;
}

type UseCurriculumEditingArgs = {
  initialConcepts: CurriculumConcept[];
  resultKey: string;
};

/**
 * Owns the editable copy of the current page of concepts plus every mutation the
 * table performs against `/api/admin/curriculum/concepts/:id`: inline field and
 * collection edits, single and bulk role changes, single and bulk deletion, the
 * transient save-feedback banner, and the row selection set. Server acknowledgement
 * always ends with `router.refresh()` so the server component re-queries. The hook
 * does not touch the URL and does not own the detail drawer or view preferences.
 */
export function useCurriculumEditing({
  initialConcepts,
  resultKey,
}: UseCurriculumEditingArgs) {
  const router = useRouter();

  const [concepts, setConcepts] = useState(initialConcepts);
  const [activeEditor, setActiveEditor] = useState<ActiveEditor | null>(null);
  const [activeCollectionEditor, setActiveCollectionEditor] =
    useState<ActiveCollectionEditor | null>(null);
  const [pendingConceptId, setPendingConceptId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback | null>(null);
  const saveFeedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Server navigation replaces this page of editable rows.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConcepts(initialConcepts);
  }, [initialConcepts]);

  useEffect(() => {
    // A new scope starts with a clean page selection.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIds(new Set());
  }, [resultKey]);

  useEffect(
    () => () => {
      if (saveFeedbackTimerRef.current) {
        window.clearTimeout(saveFeedbackTimerRef.current);
      }
    },
    [],
  );

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
      const response = await fetch(conceptUrl(concept.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConcept),
      });

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
      router.refresh();
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
      const response = await fetch(conceptUrl(concept.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConcept),
      });
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
      router.refresh();
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
      const response = await fetch(conceptUrl(concept.id), { method: "DELETE" });

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

  async function updateRole(
    concept: CurriculumConcept,
    curriculumRole: CurriculumRole,
  ) {
    if (pendingConceptId || concept.curriculumRole === curriculumRole) {
      return;
    }

    const updatedConcept = { ...concept, curriculumRole };
    setPendingConceptId(concept.id);
    markSaving(concept.id);
    setError(null);

    try {
      const response = await fetch(conceptUrl(concept.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConcept),
      });

      if (!response.ok) {
        throw new Error("Unable to save priority.");
      }

      setConcepts((currentConcepts) =>
        currentConcepts.map((candidate) =>
          candidate.id === concept.id ? updatedConcept : candidate,
        ),
      );
      markSaved(concept.id);
      router.refresh();
    } catch {
      setError("Unable to save priority.");
      markSaveError(concept.id);
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
        fetch(conceptUrl(concept.id), { method: "DELETE" }).then((response) => {
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

  async function moveSelectedToTrash() {
    if (bulkDeleting || selectedIds.size === 0) return;
    const targets = concepts.filter((concept) => selectedIds.has(concept.id));
    setBulkDeleting(true);
    setError(null);

    const results = await Promise.allSettled(
      targets.map((concept) => {
        const updatedConcept = {
          ...concept,
          curriculumRole: "Trash" as const,
        };
        return fetch(conceptUrl(concept.id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedConcept),
        }).then((response) => {
          if (!response.ok) throw new Error("update failed");
          return concept.id;
        });
      }),
    );
    const updatedIds = new Set(
      results
        .filter(
          (result): result is PromiseFulfilledResult<string> =>
            result.status === "fulfilled",
        )
        .map((result) => result.value),
    );
    const failedCount = results.length - updatedIds.size;

    setConcepts((currentConcepts) =>
      currentConcepts.map((concept) =>
        updatedIds.has(concept.id)
          ? { ...concept, curriculumRole: "Trash" }
          : concept,
      ),
    );
    setSelectedIds(new Set());
    if (failedCount > 0) {
      setError(
        `Moved ${updatedIds.size} concept${updatedIds.size === 1 ? "" : "s"} to Trash; ${failedCount} failed.`,
      );
    }
    setBulkDeleting(false);
    router.refresh();
  }

  return {
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
  };
}
