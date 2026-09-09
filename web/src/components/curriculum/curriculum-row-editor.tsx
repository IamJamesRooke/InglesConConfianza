"use client";

import type { CurriculumConcept, CurriculumRole } from "@/lib/curriculum/types";

export type EditableField =
  | "spanish"
  | "english"
  | "exampleSpanish"
  | "exampleEnglish";

export type ActiveEditor = {
  conceptId: string;
  field: EditableField;
  value: string;
};

export type ActiveCollectionEditor = {
  conceptId: string;
  value: string;
};

export const curriculumRoles: Array<{
  value: CurriculumRole;
  label: string;
  description: string;
}> = [
  {
    value: "P1",
    label: "P1",
    description: "Highest leverage — teach first",
  },
  {
    value: "P2",
    label: "P2",
    description: "High priority",
  },
  {
    value: "P3",
    label: "P3",
    description: "Mid priority",
  },
  {
    value: "P4",
    label: "P4",
    description: "Lower priority — later in the course",
  },
  {
    value: "P5",
    label: "P5",
    description: "Lowest — niche / completeness only",
  },
  {
    value: "Unranked",
    label: "Unranked",
    description: "Not yet triaged — the default for every row",
  },
  {
    value: "Trash",
    label: "Trash",
    description: "Flagged for deletion — filter by this role and bulk delete",
  },
];

export function getRoleLabel(role: CurriculumRole) {
  return curriculumRoles.find((option) => option.value === role)?.label;
}

export function renderConceptPattern(value: string) {
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

export function getEditableValue(
  concept: CurriculumConcept,
  field: EditableField,
) {
  if (field === "exampleSpanish") return concept.example.spanish;
  if (field === "exampleEnglish") return concept.example.english;
  return concept[field];
}

export function updateEditableValue(
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

type EditableCellProps = {
  concept: CurriculumConcept;
  field: EditableField;
  activeEditor: ActiveEditor | null;
  pendingConceptId: string | null;
  detailConceptId: string | null;
  onActiveEditorChange: (editor: ActiveEditor | null) => void;
  onSave: () => void;
  onErrorClear: () => void;
};

export function EditableCell({
  concept,
  field,
  activeEditor,
  pendingConceptId,
  detailConceptId,
  onActiveEditorChange,
  onSave,
  onErrorClear,
}: EditableCellProps) {
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
              onActiveEditorChange({
                ...activeEditor,
                value: event.target.value,
              })
            }
            onKeyDown={(event) => {
              if (event.key === "Escape" && !detailConceptId) {
                event.preventDefault();
                onActiveEditorChange(null);
              }
            }}
            className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-sm leading-relaxed text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 disabled:opacity-60"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onActiveEditorChange(null)}
              disabled={pendingConceptId === concept.id}
              className="rounded-md px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
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
          onActiveEditorChange({ ...activeEditor, value: event.target.value })
        }
        onBlur={onSave}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSave();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            onActiveEditorChange(null);
            onErrorClear();
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
        onActiveEditorChange({
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

type CollectionEditorProps = {
  concept: CurriculumConcept;
  activeCollectionEditor: ActiveCollectionEditor;
  pendingConceptId: string | null;
  onActiveCollectionEditorChange: (editor: ActiveCollectionEditor | null) => void;
  onSave: () => void;
};

export function CollectionEditor({
  concept,
  activeCollectionEditor,
  pendingConceptId,
  onActiveCollectionEditorChange,
  onSave,
}: CollectionEditorProps) {
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
          onActiveCollectionEditorChange({
            ...activeCollectionEditor,
            value: event.target.value,
          })
        }
        className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 disabled:opacity-60"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onActiveCollectionEditorChange(null)}
          disabled={pendingConceptId === concept.id}
          className="rounded-md px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={pendingConceptId === concept.id}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          {pendingConceptId === concept.id ? "Saving…" : "Save collections"}
        </button>
      </div>
    </div>
  );
}
