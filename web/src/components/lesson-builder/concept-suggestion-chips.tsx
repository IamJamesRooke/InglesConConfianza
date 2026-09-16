// Auto-Covers (pair-derived) and "Suggested review" concept chips for the Covers field (see lesson-concepts-field.tsx §5).
"use client";

import { Plus, Snowflake, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  conceptPriority,
  type LessonConceptSuggestion,
  type PairConceptMatch,
} from "@/lib/lesson-builder/concept-suggestions";
import type { ConceptDisplayLookup, LessonConcept } from "@/lib/lesson-builder/types";
import { createId } from "@/lib/lesson-builder/utils";

const PAIR_SUGGESTION_DEBOUNCE_MS = 800;
const MAX_PAIR_SUGGESTIONS = 8;

// Dismissed auto-Covers suggestions, per lesson, for this tab's session only
// — never written into the lesson data. Keyed by lesson id (`coversFor`).
function dismissedKey(lessonId: string) {
  return `lesson-builder:covers-dismissed:${lessonId}`;
}

function readDismissed(lessonId: string): Set<string> {
  try {
    const raw = window.sessionStorage.getItem(dismissedKey(lessonId));
    if (!raw) return new Set();
    const ids = JSON.parse(raw) as unknown;
    return Array.isArray(ids) ? new Set(ids.filter((id) => typeof id === "string")) : new Set();
  } catch {
    return new Set();
  }
}

function addDismissed(lessonId: string, conceptId: string) {
  try {
    const current = readDismissed(lessonId);
    current.add(conceptId);
    window.sessionStorage.setItem(dismissedKey(lessonId), JSON.stringify([...current]));
  } catch {
    /* storage unavailable (private mode, quota) — dismissal just won't stick */
  }
}

// Recomputes auto-Covers suggestions 800ms after the lesson's pairs change
// (and once on open), dedupes by concept, drops already-tagged or
// dismissed-this-session concepts, then orders by curriculum priority and,
// as a tiebreak, which term named it first. `recordDisplay` mirrors a
// matched concept's spanish/english/role into the field's local display
// cache the moment it's accepted, same as the typeahead does.
export function usePairSuggestions({
  coversFor,
  pairTerms,
  alreadyAdded,
  open,
  onAdd,
  recordDisplay,
}: {
  coversFor?: string;
  pairTerms?: string[];
  alreadyAdded: Set<string | null>;
  open: boolean;
  onAdd: (concept: LessonConcept) => void;
  recordDisplay: (conceptId: string, display: ConceptDisplayLookup[string]) => void;
}) {
  const [pairMatches, setPairMatches] = useState<PairConceptMatch[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() =>
    coversFor ? readDismissed(coversFor) : new Set(),
  );
  // Re-derive `dismissed` when the lesson changes, during render rather than
  // an effect (avoids a synchronous setState-in-effect while still resetting
  // before paint) — see https://react.dev/learn/you-might-not-need-an-effect.
  const [dismissedFor, setDismissedFor] = useState(coversFor);
  if (dismissedFor !== coversFor) {
    setDismissedFor(coversFor);
    setDismissed(coversFor ? readDismissed(coversFor) : new Set());
  }

  const pairTermsKey = pairTerms?.join("") ?? "";
  useEffect(() => {
    if (!coversFor || !pairTerms || pairTerms.length === 0) {
      const timer = window.setTimeout(() => setPairMatches([]), 0);
      return () => window.clearTimeout(timer);
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/admin/curriculum/concepts/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ terms: pairTerms }),
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as { suggestions: PairConceptMatch[] };
        setPairMatches(data.suggestions);
      } catch {
        // aborted or offline — leave the previous suggestions in place
      }
    }, PAIR_SUGGESTION_DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coversFor, pairTermsKey, open]);

  const pairSuggestions = (() => {
    const byId = new Map<string, PairConceptMatch>();
    pairMatches.forEach((match) => {
      if (!byId.has(match.concept.id)) byId.set(match.concept.id, match);
    });
    return [...byId.values()]
      .filter(
        (match) => !alreadyAdded.has(match.concept.id) && !dismissed.has(match.concept.id),
      )
      .sort((left, right) => {
        const priorityDiff =
          conceptPriority(left.concept.role).rank - conceptPriority(right.concept.role).rank;
        if (priorityDiff !== 0) return priorityDiff;
        return pairMatches.indexOf(left) - pairMatches.indexOf(right);
      })
      .slice(0, MAX_PAIR_SUGGESTIONS);
  })();

  function acceptPairMatch(match: PairConceptMatch) {
    const display = {
      spanish: match.concept.spanish,
      english: match.concept.english,
      role: match.concept.role,
    };
    recordDisplay(match.concept.id, display);
    onAdd({
      id: createId("lesson_concept"),
      conceptId: match.concept.id,
      label: match.concept.spanish,
    });
  }

  function dismissPairMatch(conceptId: string) {
    if (!coversFor) return;
    addDismissed(coversFor, conceptId);
    setDismissed((current) => new Set(current).add(conceptId));
  }

  function acceptAllPairSuggestions() {
    pairSuggestions.forEach(acceptPairMatch);
  }

  return { pairSuggestions, acceptPairMatch, dismissPairMatch, acceptAllPairSuggestions };
}

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

export function PairSuggestionChips({
  pairSuggestions,
  variant,
  onAccept,
  onDismiss,
}: {
  pairSuggestions: PairConceptMatch[];
  variant: "block" | "inline" | "compact";
  onAccept: (match: PairConceptMatch) => void;
  onDismiss: (conceptId: string) => void;
}) {
  return (
    <>
      {pairSuggestions.map((match) => (
        <span
          key={match.concept.id}
          role="button"
          tabIndex={0}
          className={
            variant === "compact"
              ? "lesson-concept-chip is-pair-suggestion"
              : "group inline-flex items-center gap-2 rounded-xl border border-dashed px-3 py-1.5 text-xs text-muted-foreground"
          }
          title={`Named by this lesson's pairs — ${match.term}`}
          onClick={() => onAccept(match)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAccept(match);
            } else if (event.key === "Backspace") {
              event.preventDefault();
              onDismiss(match.concept.id);
            }
          }}
        >
          <Plus className="size-3" aria-hidden="true" />
          <span className={variant === "compact" ? "lesson-concept-label" : "grid text-left leading-tight"}>
            {match.concept.english}
          </span>
          <button
            type="button"
            tabIndex={-1}
            onClick={(event) => {
              event.stopPropagation();
              onDismiss(match.concept.id);
            }}
            aria-label={`Dismiss suggestion ${match.concept.english}`}
            className={variant === "compact" ? "lesson-concept-remove" : "text-current/60 transition hover:text-[var(--destructive)]"}
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}
    </>
  );
}
