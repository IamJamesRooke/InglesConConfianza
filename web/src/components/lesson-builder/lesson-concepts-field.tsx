"use client";

import { Plus, Snowflake, X } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type Ref } from "react";

import { ConceptQuickEdit, type ConceptDraft } from "@/components/lesson-builder/concept-quick-edit";
import { conceptKey } from "@/lib/lesson-builder/lesson-file";
import {
  conceptPriority,
  type LessonConceptSuggestion,
  type PairConceptMatch,
} from "@/lib/lesson-builder/concept-suggestions";
import type {
  ConceptDisplayLookup,
  LessonConcept,
} from "@/lib/lesson-builder/types";
import { createId } from "@/lib/lesson-builder/utils";

type ConceptResult = {
  id: string;
  spanish: string;
  english: string;
  curriculumRole: string;
};

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

const PAIR_SUGGESTION_DEBOUNCE_MS = 800;
const MAX_PAIR_SUGGESTIONS = 8;

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
}: {
  concepts: LessonConcept[];
  onAdd: (concept: LessonConcept) => void;
  onRemove: (lessonConceptId: string) => void;
  onRelabel: (lessonConceptId: string, label: string) => void;
  label?: string;
  // When given, a chip whose concept key is in this set renders green ("met" —
  // some lesson in the module covers it). Used by the module Key concepts field.
  coveredConceptKeys?: Set<string>;
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
  // Auto-Covers (E5): terms already named by this lesson's own pairs
  // (extractLessonPairTerms). When given (with `coversFor` as the lesson id),
  // the field looks up matching curriculum concepts and offers them as
  // one-keystroke "Covers" suggestions after the tagged chips.
  pairTerms?: string[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ConceptResult[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  const [localDisplays, setLocalDisplays] = useState<ConceptDisplayLookup>({});
  const [searchState, setSearchState] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const listboxId = useId();
  const blurTimer = useRef<number | undefined>(undefined);
  const fieldWrapRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLUListElement | null>(null);
  const [dropUp, setDropUp] = useState(false);
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

  // Recompute auto-Covers suggestions 800ms after the lesson's pairs change,
  // and once on open (a teacher who opens straight into an already-filled
  // lesson still gets suggestions without needing to edit a pair first).
  const pairTermsKey = pairTerms?.join("") ?? "";
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

  useEffect(() => {
    const trimmed = query.trim();
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (trimmed.length < 2) {
        setResults([]);
        setSearchState("idle");
        return;
      }
      setSearchState("loading");
      try {
        const response = await fetch(
          `/api/admin/curriculum/concepts/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          setSearchState("error");
          return;
        }
        const data = (await response.json()) as { concepts: ConceptResult[] };
        setResults(data.concepts);
        setHighlight(0);
        setSearchState("idle");
      } catch {
        // aborted or offline — leave the previous results in place
        if (!controller.signal.aborted) {
          setSearchState("error");
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(
    () => () => window.clearTimeout(blurTimer.current),
    [],
  );

  const alreadyAdded = new Set(
    concepts.map((concept) => concept.conceptId).filter(Boolean),
  );
  const visibleResults = results.filter(
    (result) => !alreadyAdded.has(result.id),
  );
  const showPopover = open && visibleResults.length > 0;
  const showEmptyState = open && query.trim().length >= 2 && visibleResults.length === 0;

  // Flip the popover above the input when there isn't room below in the
  // viewport (e.g. the Covers field sitting near the bottom of the window).
  useLayoutEffect(() => {
    if (!showPopover && !showEmptyState) return;
    const wrap = fieldWrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = popoverRef.current?.offsetHeight ?? 288;
    setDropUp(spaceBelow < estimatedHeight && rect.top > spaceBelow);
  }, [showPopover, showEmptyState, visibleResults.length]);

  function addFromResult(result: ConceptResult) {
    const display = {
      spanish: result.spanish,
      english: result.english,
      role: result.curriculumRole,
    };
    setLocalDisplays((current) => ({
      ...current,
      [result.id]: display,
    }));
    onDisplayChange?.(result.id, display);
    onAdd({
      id: createId("lesson_concept"),
      conceptId: result.id,
      label: result.spanish,
    });
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function addFreehand() {
    const label = query.trim();
    if (!label) return;
    onAdd({ id: createId("lesson_concept"), conceptId: null, label });
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function addSuggestion(suggestion: LessonConceptSuggestion) {
    onAdd({
      id: createId("lesson_concept"),
      conceptId: suggestion.conceptId,
      label: suggestion.spanish,
    });
  }

  function acceptPairMatch(match: PairConceptMatch) {
    const display = {
      spanish: match.concept.spanish,
      english: match.concept.english,
      role: match.concept.role,
    };
    setLocalDisplays((current) => ({ ...current, [match.concept.id]: display }));
    onDisplayChange?.(match.concept.id, display);
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

  // Dedupe by concept (several terms can name the same concept), drop
  // already-tagged or dismissed-this-session concepts, then order by
  // curriculum priority and, as a tiebreak, which term named it first.
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

  function acceptAllPairSuggestions() {
    pairSuggestions.forEach(acceptPairMatch);
  }

  return (
    <div
      className={
        variant === "inline" || variant === "compact"
          ? ""
          : "border-b border-border bg-card px-6 py-3"
      }
    >
      {suggestions.length > 0 && (
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
                onClick={() => addSuggestion(suggestion)}
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
      )}
      <div className={variant === "compact" ? "lesson-concepts-row" : "flex flex-wrap items-center gap-1.5"}>
        {label && (
          <span className={variant === "compact" ? "lesson-concepts-label" : "text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"}>
            {label}
          </span>
        )}
        {concepts.map((concept) => {
          const met = coveredConceptKeys?.has(conceptKey(concept)) ?? false;
          const display = concept.conceptId
            ? localDisplays[concept.conceptId] ?? conceptDisplays[concept.conceptId]
            : undefined;
          const applySaved = (draft: ConceptDraft) => {
            if (!concept.conceptId) return;
            const nextDisplay = { spanish: draft.spanish, english: draft.english, role: draft.role };
            setLocalDisplays((current) => ({ ...current, [concept.conceptId!]: nextDisplay }));
            onDisplayChange?.(concept.conceptId, nextDisplay);
            onRelabel(concept.id, draft.spanish);
          };
          const isCoverageField = Boolean(coveredConceptKeys);
          const roleToken = (display?.role ?? "").replace(/[^A-Za-z0-9]/g, "");
          const chipTone = isCoverageField
            ? (met ? "is-covered" : "is-uncovered")
            : concept.conceptId
              ? `role-${roleToken || "Unranked"}`
              : "is-freehand";
          return (
          <span
            key={concept.id}
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
                  ? (display?.spanish ? `${display.spanish} — Priority: ${display?.role ?? "Unranked"}` : `Priority: ${display?.role ?? "Unranked"}`)
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
            onClick={() => acceptPairMatch(match)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                acceptPairMatch(match);
              } else if (event.key === "Backspace") {
                event.preventDefault();
                dismissPairMatch(match.concept.id);
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
                dismissPairMatch(match.concept.id);
              }}
              aria-label={`Dismiss suggestion ${match.concept.english}`}
              className={variant === "compact" ? "lesson-concept-remove" : "text-current/60 transition hover:text-[var(--destructive)]"}
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <div
          ref={fieldWrapRef}
          className={`${variant === "compact" ? "relative min-w-28 max-w-56" : "relative min-w-40 flex-1"}`}
        >
          <input
            ref={inputRef}
            data-covers-for={coversFor}
            data-keymap-ignore
            type="text"
            value={query}
            role="combobox"
            aria-expanded={showPopover}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              showPopover ? `${listboxId}-option-${highlight}` : undefined
            }
            placeholder={
              concepts.length === 0
                ? variant === "compact" ? "Add concept…" : "Type a concept, e.g. querer, poder, hablar…"
                : variant === "compact" ? "+ concept" : "Add another…"
            }
            onFocus={() => setOpen(true)}
            onBlur={() => {
              blurTimer.current = window.setTimeout(() => setOpen(false), 120);
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && event.ctrlKey && pairSuggestions.length > 0) {
                event.preventDefault();
                acceptAllPairSuggestions();
                return;
              }
              if (
                event.key === "Backspace" &&
                query === "" &&
                concepts.length > 0
              ) {
                onRemove(concepts[concepts.length - 1].id);
                return;
              }
              if (event.key === "Escape") {
                setOpen(false);
                return;
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setOpen(true);
                setHighlight((current) =>
                  Math.min(current + 1, visibleResults.length - 1),
                );
                return;
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setHighlight((current) => Math.max(current - 1, 0));
                return;
              }
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault();
                const chosen = open ? visibleResults[highlight] : undefined;
                if (chosen) {
                  addFromResult(chosen);
                } else if (query.trim()) {
                  addFreehand();
                } else {
                  onAdvance?.();
                }
              }
            }}
            className={variant === "compact"
              ? "lesson-concept-add"
              : "w-full rounded-md border border-input bg-card px-2.5 py-1.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30"}
          />
          {showPopover && (
            <ul
              ref={popoverRef}
              id={listboxId}
              role="listbox"
              data-keymap-ignore
              className={`concept-typeahead-popover${dropUp ? " is-flipped" : ""}`}
            >
              {visibleResults.map((result, index) => {
                const roleToken = result.curriculumRole.replace(/[^A-Za-z0-9]/g, "");
                const matchIndex = result.english
                  .toLowerCase()
                  .indexOf(query.trim().toLowerCase());
                const hasMatch = query.trim().length > 0 && matchIndex !== -1;
                return (
                  // A plain div, not a button: keyboard selection is driven entirely
                  // by the input's arrow keys / Enter (see onKeyDown below), and
                  // onMouseDown already blocks these from taking focus on click — a
                  // focusable descendant here would violate role="option" semantics
                  // (axe: no-focusable-content) without adding any real capability.
                  <li
                    key={result.id}
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={index === highlight}
                  >
                    <div
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => addFromResult(result)}
                      className={`concept-typeahead-option${
                        index === highlight ? " is-active" : ""
                      }`}
                    >
                      <span className="concept-typeahead-option-label">
                        <span className="concept-typeahead-option-english">
                          {hasMatch ? (
                            <>
                              {result.english.slice(0, matchIndex)}
                              <strong>
                                {result.english.slice(
                                  matchIndex,
                                  matchIndex + query.trim().length,
                                )}
                              </strong>
                              {result.english.slice(matchIndex + query.trim().length)}
                            </>
                          ) : (
                            result.english
                          )}
                        </span>
                        <span className="concept-typeahead-option-spanish">
                          {result.spanish}
                        </span>
                      </span>
                      <span
                        className={`concept-typeahead-option-role role-${roleToken || "Unranked"}`}
                        title={result.curriculumRole}
                        aria-hidden="true"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {showEmptyState && (
            <div
              data-keymap-ignore
              className={`concept-typeahead-popover concept-typeahead-empty${dropUp ? " is-flipped" : ""}`}
            >
              <p className="text-muted-foreground">
                {searchState === "loading"
                  ? "Searching..."
                  : searchState === "error"
                    ? "Concept search unavailable."
                    : "No linked concept found. Press Enter to add an unlinked label."}
              </p>
              {searchState === "idle" && (
                <p className="mt-1 text-muted-foreground/70">
                  Tip: search the infinitive (e.g. &ldquo;creer&rdquo;, not &ldquo;creo&rdquo;).
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
