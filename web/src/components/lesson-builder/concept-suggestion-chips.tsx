// "Suggested review" concept chips for the Covers field (see
// lesson-concepts-field.tsx §5). Auto-Covers (pair-derived) suggestions were
// removed 2026-09-17 — the owner decided that while writing slides, nothing
// guesses: "Covers" is a deliberate step the teacher does by hand at the end
// of the lesson (see docs/design/lesson-builder.md §6). "Suggested review"
// is unaffected — it's module planning (which cold concepts to revisit),
// never derived from this lesson's own pairs.
"use client";

import { Plus, Snowflake } from "lucide-react";

import type { LessonConceptSuggestion } from "@/lib/lesson-builder/concept-suggestions";

export function ReviewSuggestions({
  suggestions,
  onAdd,
}: {
  suggestions: LessonConceptSuggestion[];
  onAdd: (suggestion: LessonConceptSuggestion) => void;
}) {
  if (suggestions.length === 0) return null;
  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Snowflake className="size-3.5" aria-hidden="true" />
        Suggested review
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.conceptId}
            type="button"
            className="concept-suggestion"
            data-priority={suggestion.priorityBand}
            onClick={() => onAdd(suggestion)}
            title={`Last covered ${suggestion.lessonGap} ${suggestion.lessonGap === 1 ? "lesson" : "lessons"} ago`}
          >
            <span className="grid min-w-0 text-left leading-tight">
              <strong>{suggestion.english}</strong>
              <span>{suggestion.spanish}</span>
            </span>
            <span className="concept-suggestion-meta">
              <span>{suggestion.role ?? "unranked"}</span>
              <span aria-hidden="true">·</span>
              <span>{suggestion.lessonGap} back</span>
            </span>
            <Plus className="size-3.5" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}
