"use client";

import { Trash2 } from "lucide-react";

import type { CurriculumRole } from "@/lib/curriculum/types";

/**
 * The "N concepts selected" banner with Clear selection / Move-to-Trash /
 * Delete actions. Only renders when something is selected — callers should
 * still gate on `selectedCount > 0` themselves per the original layout.
 */
export function CurriculumBulkActionBar({
  selectedCount,
  selectedRole,
  bulkDeleting,
  onClearSelection,
  onDeleteOrTrash,
}: {
  selectedCount: number;
  selectedRole: CurriculumRole | "all";
  bulkDeleting: boolean;
  onClearSelection: () => void;
  onDeleteOrTrash: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
      <p className="text-sm font-medium text-foreground">
        {selectedCount} concept{selectedCount === 1 ? "" : "s"} selected
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClearSelection}
          disabled={bulkDeleting}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-40"
        >
          Clear selection
        </button>
        <button
          type="button"
          onClick={onDeleteOrTrash}
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
              ? `Delete ${selectedCount} selected`
              : `Move ${selectedCount} to Trash`}
        </button>
      </div>
    </div>
  );
}
