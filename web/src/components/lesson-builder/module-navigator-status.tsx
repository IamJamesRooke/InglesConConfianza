// Save status + undo/redo footer row for module-navigator.tsx (item E), replacing the retired full-width `.lesson-library-utility` header card.
"use client";

import { Redo2, Undo2 } from "lucide-react";

export function ModuleNavigatorStatus({
  saveLabel,
  saveFailed,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onRetrySave,
}: {
  saveLabel: string;
  saveFailed: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onRetrySave: () => void;
}) {
  return (
    <div className="module-navigator-status-row">
      <span className="module-navigator-save" role="status" aria-live="polite">
        {saveLabel}
      </span>
      <span className="module-navigator-history">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          suppressHydrationWarning
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={14} />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          suppressHydrationWarning
          aria-label="Redo"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={14} />
        </button>
      </span>
      {saveFailed && (
        <button type="button" className="module-navigator-retry" onClick={onRetrySave}>
          Retry save
        </button>
      )}
    </div>
  );
}
