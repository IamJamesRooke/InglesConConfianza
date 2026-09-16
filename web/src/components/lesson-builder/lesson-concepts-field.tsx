"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type Ref,
} from "react";

import { ConceptQuickEdit, type ConceptDraft } from "@/components/lesson-builder/concept-quick-edit";
import { curriculumRoles } from "@/components/curriculum/curriculum-row-editor";
import {
  PairSuggestionChips,
  ReviewSuggestions,
  usePairSuggestions,
} from "@/components/lesson-builder/concept-suggestion-chips";
import { ConceptTypeahead } from "@/components/lesson-builder/concept-typeahead";
import { CoversSummary } from "@/components/lesson-builder/covers-summary";
import { conceptKey } from "@/lib/lesson-builder/lesson-file";
import type { SyllabusMarkers } from "@/lib/lesson-builder/builder-context";
import type { LessonConceptSuggestion } from "@/lib/lesson-builder/concept-suggestions";
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
  pairTerms,
  missingConceptKeys,
  syllabusMarkers,
  hideChips,
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
  // Auto-Covers (E5): terms already named by this lesson's own pairs
  // (extractLessonPairTerms). When given (with `coversFor` as the lesson id),
  // the field looks up matching curriculum concepts and offers them as
  // one-keystroke "Covers" suggestions after the tagged chips.
  pairTerms?: string[];
  // The syllabus panel's Main/Review lists render their own ordered rows
  // (numbered, draggable) for already-tagged concepts and only want this
  // field for its search-and-add input; when true, the plain inline chips
  // below are skipped (pair suggestions and the input still render).
  hideChips?: boolean;
}) {
  const [localDisplays, setLocalDisplays] = useState<ConceptDisplayLookup>({});
  // Mirrors the typeahead's popover open state so the auto-Covers pair
  // suggestions can refetch "once on open" (see usePairSuggestions below).
  const [typeaheadOpen, setTypeaheadOpen] = useState(false);

  // Covers as one quiet line (§5): the lesson's own "Covers" field (compact
  // variant + coversFor) collapses to a summary line at rest — the full
  // chips/typeahead/suggestions only mount once that line is focused or
  // clicked. Never applies to the module Key Concepts field (no coversFor)
  // or the block/inline variants, which stay expanded as before.
  const collapsible = variant === "compact" && Boolean(coversFor);
  const [expanded, setExpanded] = useState(false);
  const coversWrapRef = useRef<HTMLDivElement | null>(null);

  function openCovers() {
    setExpanded(true);
  }

  function collapseIfFocusLeft(event: FocusEvent<HTMLDivElement>) {
    if (!collapsible) return;
    const next = event.relatedTarget as Node | null;
    if (next && event.currentTarget.contains(next)) return;
    setExpanded(false);
  }

  useEffect(() => {
    if (!collapsible || !expanded) return;
    coversWrapRef.current?.querySelector<HTMLInputElement>("input[data-covers-for]")?.focus();
  }, [collapsible, expanded]);

  function recordDisplay(conceptId: string, display: ConceptDisplayLookup[string]) {
    setLocalDisplays((current) => ({ ...current, [conceptId]: display }));
    onDisplayChange?.(conceptId, display);
  }

  const alreadyAdded = new Set(
    concepts.map((concept) => concept.conceptId).filter(Boolean),
  );

  const { pairSuggestions, acceptPairMatch, dismissPairMatch, acceptAllPairSuggestions } =
    usePairSuggestions({
      coversFor,
      pairTerms,
      alreadyAdded,
      open: typeaheadOpen,
      onAdd,
      recordDisplay,
    });

  function addSuggestion(suggestion: LessonConceptSuggestion) {
    onAdd({
      id: createId("lesson_concept"),
      conceptId: suggestion.conceptId,
      label: suggestion.spanish,
    });
  }

  // Priority dots (§5): only shown when the lesson's own concepts don't all
  // share one curriculum role — six identical dots say nothing.
  const conceptRoles = concepts
    .map((concept) =>
      concept.conceptId
        ? localDisplays[concept.conceptId]?.role ?? conceptDisplays[concept.conceptId]?.role ?? "Unranked"
        : null,
    )
    .filter((role): role is string => role !== null);
  const rolesUniform = new Set(conceptRoles).size <= 1;

  if (collapsible && !expanded) {
    const terms = concepts.map((concept) => {
      const display = concept.conceptId
        ? localDisplays[concept.conceptId] ?? conceptDisplays[concept.conceptId]
        : undefined;
      return display?.english ?? concept.label;
    });
    return (
      <div ref={coversWrapRef} onBlur={collapseIfFocusLeft}>
        <CoversSummary terms={terms} onOpen={openCovers} />
      </div>
    );
  }

  return (
    <div
      ref={collapsible ? coversWrapRef : undefined}
      onBlur={collapsible ? collapseIfFocusLeft : undefined}
      className={
        variant === "inline" || variant === "compact"
          ? ""
          : "border-b border-border bg-card px-6 py-3"
      }
    >
      <ReviewSuggestions suggestions={suggestions} onAdd={addSuggestion} />
      <div
        className={variant === "compact" ? "lesson-concepts-row" : "flex flex-wrap items-center gap-1.5"}
        data-roles-uniform={rolesUniform ? "true" : undefined}
      >
        {label && (
          <span className={variant === "compact" ? "lesson-concepts-label" : "text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"}>
            {label}
          </span>
        )}
        {!hideChips && concepts.map((concept) => {
          const met = coveredConceptKeys?.has(conceptKey(concept)) ?? false;
          const display = concept.conceptId
            ? localDisplays[concept.conceptId] ?? conceptDisplays[concept.conceptId]
            : undefined;
          const applySaved = (draft: ConceptDraft) => {
            if (!concept.conceptId) return;
            const nextDisplay = { spanish: draft.spanish, english: draft.english, role: draft.role };
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
                  {display?.english ?? concept.label}
                </ConceptQuickEdit>
              ) : (
                <span className="lesson-concept-label">{concept.label}</span>
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
        })}
        <PairSuggestionChips
          pairSuggestions={pairSuggestions}
          variant={variant}
          onAccept={acceptPairMatch}
          onDismiss={dismissPairMatch}
        />
        <ConceptTypeahead
          concepts={concepts}
          onAdd={onAdd}
          onAdvance={onAdvance}
          recordDisplay={recordDisplay}
          coversFor={coversFor}
          variant={variant}
          inputRef={inputRef}
          syllabusMarkers={syllabusMarkers}
          pairSuggestionsCount={pairSuggestions.length}
          onAcceptAllPairSuggestions={acceptAllPairSuggestions}
          onOpenChange={setTypeaheadOpen}
        />
      </div>
    </div>
  );
}
