"use client";

import { Copy, LayoutTemplate, Trash2 } from "lucide-react";

type Props = {
  lessonId: string;
  lessonName: string;
  onDuplicate: () => void;
  onDuplicateStructure: () => void;
  onRequestDelete: () => void;
};

export function LessonHeaderActions({
  lessonId,
  lessonName,
  onDuplicate,
  onDuplicateStructure,
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
        onClick={onDuplicateStructure}
        aria-label="Duplicate structure"
        title="New lesson with the same slides, emptied"
      >
        <LayoutTemplate size={14} aria-hidden="true" />
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
