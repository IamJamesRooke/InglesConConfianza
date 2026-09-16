// The Covers field's search input + results popover (see lesson-concepts-field.tsx).
"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type Ref,
} from "react";

import type { SyllabusMarkers } from "@/lib/lesson-builder/builder-context";
import { curriculumRoles } from "@/components/curriculum/curriculum-row-editor";
import type { ConceptDisplayLookup, LessonConcept } from "@/lib/lesson-builder/types";
import { createId } from "@/lib/lesson-builder/utils";

type ConceptResult = {
  id: string;
  spanish: string;
  english: string;
  curriculumRole: string;
  // "example" when the query only matched this concept's example sentence
  // (e.g. typing the conjugated "estoy" against the infinitive concept
  // "estar [en un lugar]") — the popover then shows that example as a
  // second, quieter line so the teacher can see why it matched. See
  // src/lib/lesson-builder/concept-search-rank.ts.
  matchedVia: "label" | "example";
  matchedExample?: string;
  // The concept's `pos:*`/`grammar:*`/`construction:*` collection names,
  // null when it has none. Recorded into the display lookup below so a
  // pill added here can be grouped by the syllabus card straight away.
  collections?: string[] | null;
};

// Same "Level N / Unranked / Trash" wording the curriculum page and the
// quick-edit dialog use — never a raw "P1" role code in front of a teacher.
function roleLabel(role?: string): string {
  return curriculumRoles.find((candidate) => candidate.value === role)?.label ?? "Unranked";
}

export function ConceptTypeahead({
  concepts,
  onAdd,
  onAdvance,
  recordDisplay,
  coversFor,
  variant,
  inputRef,
  syllabusMarkers,
  pairSuggestionsCount,
  onAcceptAllPairSuggestions,
  onOpenChange,
}: {
  concepts: LessonConcept[];
  onAdd: (concept: LessonConcept) => void;
  // Marks this as a lesson's "Covers" setup field: tags the input for the
  // title → covers focus hop, and `onAdvance` fires when Enter is pressed on
  // an empty field to move on to the lesson body.
  coversFor?: string;
  onAdvance?: () => void;
  recordDisplay: (conceptId: string, display: ConceptDisplayLookup[string]) => void;
  variant: "block" | "inline" | "compact";
  inputRef?: Ref<HTMLInputElement>;
  syllabusMarkers?: SyllabusMarkers;
  pairSuggestionsCount: number;
  onAcceptAllPairSuggestions: () => void;
  // Mirrors this popover's open/closed state upward — the auto-Covers pair
  // suggestions refetch "once on open" (see concept-suggestion-chips.tsx).
  onOpenChange?: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ConceptResult[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [open, setOpenState] = useState(false);
  function setOpen(next: boolean) {
    setOpenState(next);
    onOpenChange?.(next);
  }
  const [searchState, setSearchState] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const listboxId = useId();
  const blurTimer = useRef<number | undefined>(undefined);
  const fieldWrapRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLUListElement | null>(null);
  const [dropUp, setDropUp] = useState(false);

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

  // Keep the active option visible as ArrowUp/ArrowDown moves it past the
  // popover's own scroll viewport (max-height + overflow-y: auto) — without
  // this, repeated ArrowDown walks the highlight below the visible list.
  useEffect(() => {
    if (!showPopover) return;
    const active = popoverRef.current?.querySelector('[aria-selected="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [showPopover, highlight]);

  function addFromResult(result: ConceptResult) {
    const display = {
      spanish: result.spanish,
      english: result.english,
      role: result.curriculumRole,
      collections: result.collections ?? undefined,
    };
    recordDisplay(result.id, display);
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

  return (
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
          variant === "compact"
            ? "Add concept…"
            : concepts.length === 0
              ? "Type a concept, e.g. querer, poder, hablar…"
              : "Add another…"
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
          if (event.key === "Enter" && event.ctrlKey && pairSuggestionsCount > 0) {
            event.preventDefault();
            onAcceptAllPairSuggestions();
            return;
          }
          if (event.key === "Backspace" && query === "" && concepts.length > 0) {
            // Never delete on the first press: move focus onto the last
            // chip, where a second Backspace (or Delete) removes it — so a
            // reflexive Backspace can't silently eat a concept. The chip
            // row is the nearest wrapper around both the chips and this input.
            const row = event.currentTarget.closest(".lesson-concepts-row, .syllabus-chip-row");
            const chips = row?.querySelectorAll<HTMLElement>("[data-chip-focusable]");
            const last = chips?.[chips.length - 1];
            if (last) {
              event.preventDefault();
              setOpen(false);
              last.focus();
            }
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
            const inSyllabus = syllabusMarkers?.inSyllabusUncovered.has(result.id) ?? false;
            const notIntroducedYet = syllabusMarkers
              ? !syllabusMarkers.known.has(result.id) && !syllabusMarkers.mainOfModule.has(result.id)
              : false;
            return (
              // A plain div, not a button: keyboard selection is driven entirely
              // by the input's arrow keys / Enter (see onKeyDown above), and
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
                      {result.matchedVia === "example" && result.matchedExample && (
                        <span className="concept-typeahead-option-example">
                          {" "}
                          · {result.matchedExample}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="concept-typeahead-option-meta">
                    {inSyllabus && (
                      <span
                        className="concept-typeahead-option-syllabus"
                        title="In this module's syllabus — not yet covered"
                      >
                        in syllabus
                      </span>
                    )}
                    {!inSyllabus && notIntroducedYet && (
                      <span
                        className="concept-typeahead-option-not-introduced"
                        title="Not introduced yet in the course"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={`concept-typeahead-option-role role-${roleToken || "Unranked"}`}
                      title={roleLabel(result.curriculumRole)}
                      aria-hidden="true"
                    />
                  </span>
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
  );
}
