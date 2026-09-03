"use client";

// Shown when the editor tries to leave a lesson (open another, collapse, create,
// reorder) that has unsaved changes: save, discard, or stay.
export function PendingLessonExitDialog({
  lessonNumber,
  isSaving,
  onCancel,
  onDiscard,
  onSave,
}: {
  lessonNumber: number;
  isSaving: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-lesson-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl">
        <h2
          id="unsaved-lesson-title"
          className="text-xl font-semibold tracking-tight"
        >
          Save changes to Lesson {lessonNumber}?
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This lesson has unsaved changes. Save them before leaving, discard
          them, or return to editing.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-lg border border-red-200 bg-background px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-red-200"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            {isSaving ? "Saving..." : "Save and leave"}
          </button>
        </div>
      </div>
    </div>
  );
}
