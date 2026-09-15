"use client";

import { Copy, Trash2 } from "lucide-react";

type Props = {
  lessonId: string;
  lessonName: string;
  onDuplicate: () => void;
  onRequestDelete: () => void;
};

export function LessonHeaderActions({
  lessonId,
  lessonName,
  onDuplicate,
  onRequestDelete,
}: Props) {
  return (
    <>
      <button
        type="button"
        onClick={onDuplicate}
        aria-label={`Duplicate ${lessonName}`}
        title="Duplicate lesson"
      >
        <Copy size={14} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="danger"
        data-lesson-delete-trigger={lessonId}
        onClick={onRequestDelete}
        aria-label={`Delete ${lessonName}`}
        title="Delete lesson"
      >
        <Trash2 size={14} aria-hidden="true" />
      </button>
    </>
  );
}
