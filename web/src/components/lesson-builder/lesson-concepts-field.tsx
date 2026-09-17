"use client";

import { TriangleAlert, X } from "lucide-react";
import { useState, type Ref } from "react";

import { ConceptPillLabel } from "@/components/lesson-builder/concept-pill-label";
import { ConceptQuickEdit, type ConceptDraft } from "@/components/lesson-builder/concept-quick-edit";
import { curriculumRoles } from "@/components/curriculum/curriculum-row-editor";
import { ReviewSuggestions } from "@/components/lesson-builder/concept-suggestion-chips";
import { ConceptTypeahead } from "@/components/lesson-builder/concept-typeahead";
import { renderConceptLabel } from "@/lib/lesson-builder/concept-label";
import { conceptKey } from "@/lib/lesson-builder/lesson-file";
import type { SyllabusMarkers } from "@/lib/lesson-builder/builder-context";
import type { LessonConceptSuggestion } from "@/lib/lesson-builder/concept-suggestions";
import type { LessonReviewSplit } from "@/lib/lesson-builder/syllabus";
import type {
  ConceptDisplayLookup,
  LessonConcept,
} from "@/lib/lesson-builder/types";
import { createId } from "@/lib/lesson-builder/utils";

// Same "Level N / Unranked / Trash" wording the curriculum page and the
// quick-edit dialog use — never a raw "P1" role code in front of a teacher.
function roleLabel(role?: string): string {
  return curriculumRoles.find((candidate) => candidate.value === role)?.label ?? "Unranked";
}

export type { ConceptDisplayLookup } from "@/lib/lesson-builder/types";

// The quick "concepts covered" field under a lesson title. Type to search the
// curriculum; pick a match (keeps its id for coverage tracking) or press Enter
// on unmatched text to add it freehand. Backspace on an empty field removes the
// last chip.
export function LessonConceptsField({
  concepts,
  onAdd,
  onRemove,
  onRelabel,
  label = "Concepts covered",
  coveredConceptKeys,
  variant = "block",
  inputRef,
  conceptDisplays = {},
  suggestions = [],
  onDisplayChange,
  coversFor,
  onAdvance,
  missingConceptKeys,
  syllabusMarkers,
  hideChips,
  reviewSplit,
}: {
  concepts: LessonConcept[];
  onAdd: (concept: LessonConcept) => void;
  onRemove: (lessonConceptId: string) => void;
  onRelabel: (lessonConceptId: string, label: string) => void;
  label?: string;
  // When given, a chip whose concept key is in this set renders green ("met" —
  // some lesson in the module covers it). Used by the module Key concepts field.
  coveredConceptKeys?: Set<string>;
  // When given (module Syllabus panel), a chip whose concept key is in this
  // set renders red — its concept is Trash or no longer in the curriculum.
  // Takes precedence over `coveredConceptKeys`.
  missingConceptKeys?: Set<string>;
  variant?: "block" | "inline" | "compact";
  inputRef?: Ref<HTMLInputElement>;
  conceptDisplays?: ConceptDisplayLookup;
  suggestions?: LessonConceptSuggestion[];
  onDisplayChange?: (
    conceptId: string,
    display: ConceptDisplayLookup[string],
  ) => void;
  // Marks this as a lesson's "Covers" setup field: tags the input for the
  // title → covers focus hop, and `onAdvance` fires when Enter is pressed on an
  // empty field to move on to the lesson body.
  coversFor?: string;
  onAdvance?: () => void;
  // Module-syllabus hints (E: module syllabus) for the search popover only —
  // a "in syllabus" marker on results this lesson's module still needs, and
  // a soft "not introduced yet" dot on results outside the known set. Never
  // affects already-tagged chips.
  syllabusMarkers?: SyllabusMarkers;
  // The syllabus panel's Main/Review lists render their own ordered rows
  // (numbered, draggable) for already-tagged concepts and only want this
  // field for its search-and-add input; when true, the plain inline chips
  // below are skipped (pair suggestions and the input still render).
  hideChips?: boolean;
  // Owner, 2026-09-17: a lesson's own Covers pills split into "Introduced"
  // (this lesson's first-ever teaching of the concept) and "Reviewed" (it
  // already appeared earlier) — fully derived (`syllabus.ts`'s
  // `introducedAndReviewedForLesson`), never a teacher choice. When given
  // (with `coversLayout` — see below), replaces the single "Covers" eyebrow
  // with these two; `concepts` itself is still the source of truth for
  // add/remove/search (`alreadyAdded`, chip identity), this only changes how
  // the same list is grouped for display.
  reviewSplit?: LessonReviewSplit;
}) {
  const [localDisplays, setLocalDisplays] = useState<ConceptDisplayLookup>({});

  function recordDisplay(conceptId: string, display: ConceptDisplayLookup[string]) {
    setLocalDisplays((current) => ({ ...current, [conceptId]: display }));
    onDisplayChange?.(conceptId, display);
  }

  function addSuggestion(suggestion: LessonConceptSuggestion) {
    onAdd({
      id: createId("lesson_concept"),
      conceptId: suggestion.conceptId,
      label: suggestion.spanish,
    });
  }

  // Priority dots (§5): only shown when a group's own concepts don't all
  // share one curriculum role — six identical dots say nothing. Computed
  // per rendered group (the flat list normally; each of Introduced/Reviewed
  // separately when `reviewSplit` splits the display — owner, 2026-09-17)
  // so one all-P1 "Introduced" row doesn't lose its dots just because a
  // mixed-role concept sits in "Reviewed".
  function rolesUniformOf(list: LessonConcept[]): boolean {
    const roles = list
      .map((concept) =>
        concept.conceptId
          ? localDisplays[concept.conceptId]?.role ?? conceptDisplays[concept.conceptId]?.role ?? "Unranked"
          : null,
      )
      .filter((role): role is string => role !== null);
    return new Set(roles).size <= 1;
  }

  function renderChip(concept: LessonConcept) {
          const met = coveredConceptKeys?.has(conceptKey(concept)) ?? false;
          const display = concept.conceptId
            ? localDisplays[concept.conceptId] ?? conceptDisplays[concept.conceptId]
            : undefined;
          const applySaved = (draft: ConceptDraft) => {
            if (!concept.conceptId) return;
            const nextDisplay = {
              spanish: draft.spanish,
              english: draft.english,
              role: draft.role,
              // The quick-edit dialog's "Tags" field edits collections too
              // (concept-quick-edit.tsx) — carry the saved list forward so a
              // tag added/removed there re-groups the pill immediately.
              collections: draft.collections,
            };
            recordDisplay(concept.conceptId, nextDisplay);
            onRelabel(concept.id, draft.spanish);
          };
          const isCoverageField = Boolean(coveredConceptKeys);
          const isMissing = missingConceptKeys?.has(conceptKey(concept)) ?? false;
          const roleToken = (display?.role ?? "").replace(/[^A-Za-z0-9]/g, "");
          const chipTone = isMissing
            ? "is-missing"
            : isCoverageField
              ? (met ? "is-covered" : "is-uncovered")
              : concept.conceptId
                ? `role-${roleToken || "Unranked"}`
                : "is-freehand";
          return (
          <span
            key={concept.id}
            tabIndex={0}
            data-chip-focusable
            onKeyDown={(event) => {
              // Reached by Backspace from an empty concept field (or Tab):
              // a second Backspace, or Delete, removes this chip.
              if (event.target !== event.currentTarget) return;
              if (event.key === "Backspace" || event.key === "Delete") {
                event.preventDefault();
                onRemove(concept.id);
              }
            }}
            className={variant === "compact"
              ? `lesson-concept-chip ${chipTone}`
              : `group inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs ${
                  met
                    ? "border-[color-mix(in_oklch,var(--success)_45%,var(--border))] bg-[color-mix(in_oklch,var(--success)_12%,var(--card))] text-[var(--success-foreground)]"
                    : concept.conceptId
                      ? "border-border bg-muted text-foreground"
                      : "border-dashed border-border bg-transparent text-muted-foreground"
                }`}
            title={
              isCoverageField
                ? (met ? "Referenced by a lesson in this module" : "Not yet referenced by a lesson in this module")
                : concept.conceptId
                  ? (display?.spanish ? `${display.spanish} — ${roleLabel(display?.role)}` : roleLabel(display?.role))
                  : "Not in the curriculum — coverage won't count it"
            }
          >
            {variant === "compact" ? (
              concept.conceptId ? (
                <ConceptQuickEdit
                  conceptId={concept.conceptId}
                  className="lesson-concept-label"
                  onSaved={applySaved}
                  onDeleted={() => onRemove(concept.id)}
                >
                  {display ? (
                    <ConceptPillLabel english={display.english} spanish={display.spanish} />
                  ) : (
                    renderConceptLabel(concept.label)
                  )}
                </ConceptQuickEdit>
              ) : (
                <span className="lesson-concept-label">{renderConceptLabel(concept.label)}</span>
              )
            ) : concept.conceptId ? (
              <ConceptQuickEdit
                conceptId={concept.conceptId}
                className="hover:underline"
                onSaved={applySaved}
                onDeleted={() => onRemove(concept.id)}
              >
                <span className="grid text-left leading-tight">
                  <strong className="text-[13px] font-semibold">
                    {display?.english ?? concept.label}
                  </strong>
                  <span className="mt-0.5 text-[11px] font-medium opacity-65">
                    {display?.spanish ?? concept.label}
                  </span>
                </span>
              </ConceptQuickEdit>
            ) : (
              <span className="grid text-left leading-tight">
                <strong className="text-[13px] font-semibold">{concept.label}</strong>
                <span className="mt-0.5 text-[10px] font-medium opacity-65">
                  Unlinked concept
                </span>
              </span>
            )}
            <button
              type="button"
              onClick={() => onRemove(concept.id)}
              aria-label={`Remove ${concept.label}`}
              className={variant === "compact" ? "lesson-concept-remove" : "text-current/60 transition hover:text-[var(--destructive)]"}
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
    );
  }

  // The lesson's own "Covers" block (compact, chips shown, tied to a lesson
  // via `coversFor`) gets the end-step treatment (owner, 2026-09-17): a
  // small-caps eyebrow above the pills (same class the syllabus card's
  // "Main teaching points" eyebrow uses) and the add-input on its own line
  // below them. The syllabus panel's own embed of this field (compact,
  // `hideChips`, no `coversFor`) is unaffected — different surface.
  const coversLayout = variant === "compact" && !hideChips;
  // When a review split is supplied, the single "Covers" eyebrow becomes
  // two derived ones, "Introduced"/"Reviewed" — see the `reviewSplit` prop
  // doc above. `concepts` itself stays the field's source of truth (search,
  // add, remove); this only changes how it's grouped for display.
  const showReviewSplit = coversLayout && Boolean(reviewSplit);
  // A lesson with Covers concepts, in a course that has taught something
  // before it, but reviewing none of it — the owner's ask (2026-09-17): "a
  // teacher should always be reviewing old material."
  const reviewWarning = Boolean(
    showReviewSplit &&
      reviewSplit &&
      reviewSplit.priorConceptsExist &&
      concepts.length > 0 &&
      reviewSplit.reviewed.length === 0,
  );
  const typeahead = (
    <ConceptTypeahead
      concepts={concepts}
      onAdd={onAdd}
      onAdvance={onAdvance}
      recordDisplay={recordDisplay}
      coversFor={coversFor}
      variant={variant}
      inputRef={inputRef}
      syllabusMarkers={syllabusMarkers}
    />
  );

  return (
    <div
      className={
        (variant === "inline" || variant === "compact"
          ? ""
          : "border-b border-border bg-card px-6 py-3") + (coversLayout ? " lesson-concepts-field" : "")
      }
    >
      <ReviewSuggestions suggestions={suggestions} onAdd={addSuggestion} />
      {showReviewSplit && reviewSplit ? (
        <>
          <span className="syllabus-group-eyebrow lesson-concepts-eyebrow">Introduced</span>
          <div
            className="lesson-concepts-row"
            data-roles-uniform={rolesUniformOf(reviewSplit.introduced) ? "true" : undefined}
          >
            {reviewSplit.introduced.map(renderChip)}
          </div>
          <span className="syllabus-group-eyebrow lesson-concepts-eyebrow">
            Reviewed
            {reviewWarning && (
              <span
                className="lesson-concepts-review-warning"
                title="This lesson doesn't review any earlier material — a lesson should always review something old."
              >
                <TriangleAlert size={11} aria-hidden="true" />
                no review
              </span>
            )}
          </span>
          <div
            className="lesson-concepts-row"
            data-roles-uniform={rolesUniformOf(reviewSplit.reviewed) ? "true" : undefined}
          >
            {reviewSplit.reviewed.map(renderChip)}
          </div>
        </>
      ) : (
        <>
          {coversLayout && <span className="syllabus-group-eyebrow lesson-concepts-eyebrow">Covers</span>}
          <div
            className={variant === "compact" ? "lesson-concepts-row" : "flex flex-wrap items-center gap-1.5"}
            data-roles-uniform={rolesUniformOf(concepts) ? "true" : undefined}
          >
            {label && (
              <span className={variant === "compact" ? "lesson-concepts-label" : "text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"}>
                {label}
              </span>
            )}
            {!hideChips && concepts.map(renderChip)}
            {!coversLayout && typeahead}
          </div>
        </>
      )}
      {coversLayout && <div className="lesson-concepts-add-row">{typeahead}</div>}
    </div>
  );
}
