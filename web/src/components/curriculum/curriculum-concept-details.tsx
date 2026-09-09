"use client";

import { ChevronLeft, ChevronRight, Pencil, Trash2, X } from "lucide-react";
import type { RefObject } from "react";

import {
  CollectionEditor,
  curriculumRoles,
  EditableCell,
  type ActiveCollectionEditor,
  type ActiveEditor,
  type EditableField,
} from "@/components/curriculum/curriculum-row-editor";
import type { CurriculumConcept, CurriculumRole } from "@/lib/curriculum/types";

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

type Coverage = Record<
  string,
  { lessonId: string; lessonNumber: number; lessonName: string | null }
>;

type CurriculumConceptDetailsProps = {
  concept: CurriculumConcept;
  conceptIndex: number;
  conceptCount: number;
  coverage: Coverage;
  detailPanelRef: RefObject<HTMLElement | null>;
  pendingConceptId: string | null;
  saveFeedback: {
    conceptId: string;
    state: "saving" | "saved" | "error";
  } | null;
  activeEditor: ActiveEditor | null;
  activeCollectionEditor: ActiveCollectionEditor | null;
  selectedCollection: string | null;
  onClose: () => void;
  onStep: (delta: -1 | 1) => void;
  onActiveEditorChange: (editor: ActiveEditor | null) => void;
  onSaveActiveEditor: () => void;
  onErrorClear: () => void;
  onActiveCollectionEditorChange: (editor: ActiveCollectionEditor | null) => void;
  onSaveCollectionEditor: () => void;
  onOpenCollectionEditor: () => void;
  onNavigateCollection: (collection: string) => void;
  onUpdateRole: (concept: CurriculumConcept, role: CurriculumRole) => void;
  onDelete: (concept: CurriculumConcept) => void;
};

export function CurriculumConceptDetails({
  concept,
  conceptIndex,
  conceptCount,
  coverage,
  detailPanelRef,
  pendingConceptId,
  saveFeedback,
  activeEditor,
  activeCollectionEditor,
  selectedCollection,
  onClose,
  onStep,
  onActiveEditorChange,
  onSaveActiveEditor,
  onErrorClear,
  onActiveCollectionEditorChange,
  onSaveCollectionEditor,
  onOpenCollectionEditor,
  onNavigateCollection,
  onUpdateRole,
  onDelete,
}: CurriculumConceptDetailsProps) {
  function editableCell(field: EditableField) {
    return (
      <EditableCell
        concept={concept}
        field={field}
        activeEditor={activeEditor}
        pendingConceptId={pendingConceptId}
        detailConceptId={concept.id}
        onActiveEditorChange={onActiveEditorChange}
        onSave={onSaveActiveEditor}
        onErrorClear={onErrorClear}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button
        type="button"
        aria-label="Close concept details"
        onClick={onClose}
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
              {concept.spanish}
            </h2>
            <p className="mt-0.5 text-base text-muted-foreground">
              {concept.english}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              disabled={conceptIndex <= 0}
              onClick={() => onStep(-1)}
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30"
              aria-label="Previous concept"
              title="Previous concept"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <span className="min-w-12 text-center text-xs font-medium text-muted-foreground">
              {conceptIndex + 1} / {conceptCount}
            </span>
            <button
              type="button"
              disabled={conceptIndex >= conceptCount - 1}
              onClick={() => onStep(1)}
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30"
              aria-label="Next concept"
              title="Next concept"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onClose}
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
            saveFeedback?.conceptId === concept.id &&
            saveFeedback.state === "error"
              ? "bg-destructive/5 text-destructive"
              : "bg-muted/35 text-muted-foreground"
          }`}
        >
          {saveFeedback?.conceptId === concept.id
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
              <div className="font-medium">{editableCell("spanish")}</div>
              <div className="border-t border-border">{editableCell("english")}</div>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Bilingual example
            </h3>
            <div className="rounded-xl border border-border bg-card p-2 text-muted-foreground">
              {editableCell("exampleSpanish")}
              <div className="border-t border-border">
                {editableCell("exampleEnglish")}
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
                  {concept.collections.length} grouped by purpose
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenCollectionEditor}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold transition hover:bg-muted"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Edit
              </button>
            </div>
            {activeCollectionEditor?.conceptId === concept.id ? (
              <div className="rounded-xl border border-border bg-card p-3">
                <CollectionEditor
                  concept={concept}
                  activeCollectionEditor={activeCollectionEditor}
                  pendingConceptId={pendingConceptId}
                  onActiveCollectionEditorChange={onActiveCollectionEditorChange}
                  onSave={onSaveCollectionEditor}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Separate exact collection names with commas. Enter saves; Escape cancels.
                </p>
              </div>
            ) : (
              <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                {Object.entries(groupCollections(concept.collections)).map(
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
                            onClick={() => onNavigateCollection(collection)}
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
                {concept.collections.length === 0 && (
                  <p className="text-sm text-muted-foreground">No collections assigned.</p>
                )}
              </div>
            )}
          </section>

          <section className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
            <select
              value={concept.curriculumRole}
              disabled={pendingConceptId !== null}
              onChange={(event) =>
                onUpdateRole(concept, event.target.value as CurriculumRole)
              }
              aria-label={`Curriculum role for ${concept.spanish}`}
              className={`role-select role-${concept.curriculumRole} rounded-md border px-3 py-2 text-xs font-semibold outline-none`}
            >
              {curriculumRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            {coverage[concept.id] && (
              <a
                href={`/admin/lesson-builder?lesson=${encodeURIComponent(coverage[concept.id].lessonId)}`}
                className="rounded-md bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
              >
                Open Lesson {coverage[concept.id].lessonNumber}
              </a>
            )}
            {concept.curriculumRole === "Trash" ? (
              <button
                type="button"
                disabled={pendingConceptId !== null}
                onClick={() => onDelete(concept)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-40"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Delete permanently
              </button>
            ) : (
              <button
                type="button"
                disabled={pendingConceptId !== null}
                onClick={() => onUpdateRole(concept, "Trash")}
                className="ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-40"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Move to Trash
              </button>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
