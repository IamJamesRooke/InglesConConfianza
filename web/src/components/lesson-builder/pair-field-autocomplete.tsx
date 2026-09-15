"use client";

// E5b — curriculum autocomplete in a sentence/table pair field. Typing in a
// Spanish (or English) field suggests up to 5 matching curriculum concepts;
// Tab/Enter accepts one, filling this field with the concept's own-language
// text and, when the other field is still empty, the other field too. See
// docs/design/lesson-builder-rebuild.md E5's "pair-field autocomplete" half.
//
// Reuses the existing concept-typeahead popover's CSS classes
// (lesson-concepts-field.css) rather than a new stylesheet — same look,
// same escape-the-card positioning, one fewer file for lint to track.

import { useEffect, useId, useRef, useState } from "react";

import { stripConceptPlaceholder } from "@/lib/lesson-builder/concept-suggestions";

export type PairAutocompleteResult = {
  id: string;
  spanish: string;
  english: string;
  curriculumRole: string;
};

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 5;

function ownText(lang: "es" | "en", result: PairAutocompleteResult): string {
  return lang === "es" ? result.spanish : result.english;
}

// Debounced curriculum search for one field's current value. Never shows a
// popover when the field's text is already an exact match for a concept's
// own-language text (bracket placeholders stripped, case-insensitive) — an
// accepted pair shouldn't immediately re-offer itself.
export function usePairFieldAutocomplete(lang: "es" | "en", value: string) {
  const [results, setResults] = useState<PairAutocompleteResult[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  // A fetch started while focused can resolve after the field has since
  // blurred — and, if the teacher comes right back to it, resolve *after*
  // it is refocused too, since a plain focused/unfocused flag can't tell a
  // stale fetch from a fresh one at that point. A generation counter can:
  // every blur bumps it, and a fetch only applies its results if the
  // generation is still the one it started under. Bumped directly from the
  // field's onBlur (event-handler context, not render), so it's exact — no
  // render-cycle lag. Without this, a stale fetch reopening the popover (and
  // its `data-keymap-ignore`) on a field the teacher has since left and
  // returned to would silently swallow the next chord pressed there.
  const generationRef = useRef(0);

  useEffect(() => {
    const startGeneration = generationRef.current;
    const trimmed = value.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      const timer = window.setTimeout(() => {
        setResults([]);
        setOpen(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/admin/curriculum/concepts/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!response.ok) return;
        if (generationRef.current !== startGeneration) return;
        const data = (await response.json()) as { concepts: PairAutocompleteResult[] };
        if (generationRef.current !== startGeneration) return;
        const exactMatch = data.concepts.some(
          (concept) =>
            stripConceptPlaceholder(ownText(lang, concept)).toLowerCase() === trimmed.toLowerCase(),
        );
        if (exactMatch) {
          setResults([]);
          setOpen(false);
          return;
        }
        const top = data.concepts.slice(0, MAX_RESULTS);
        setResults(top);
        setHighlight(0);
        setOpen(top.length > 0);
      } catch {
        // aborted or offline — leave the previous popover state in place
      }
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [lang, value]);

  return {
    open,
    setOpen,
    results,
    highlight,
    setHighlight,
    moveHighlight(delta: number) {
      setHighlight((current) => Math.min(Math.max(current + delta, 0), results.length - 1));
    },
    notifyBlur() {
      generationRef.current += 1;
    },
  };
}

// One Spanish or English pair field, wired for autocomplete. A thin wrapper
// around the existing `.lesson-document-language-field` textarea markup —
// callers keep their own onFocus/onChange/onBlur wiring to the shared
// selection and lesson state; this only adds the popover and the keys that
// drive it. `data-keymap-ignore` is set on the textarea *only* while the
// popover is open, so the shared keymap dispatcher (keymap.ts) skips this
// field and the local `onKeyDown` below handles ↑/↓/Tab/Enter/Escape
// instead; closed, the field behaves exactly as before and every normal
// chord (Tab/Enter pair navigation, Escape, etc.) reaches the dispatcher.
export function PairLanguageField({
  lang,
  dataField,
  value,
  otherValue,
  placeholder,
  ariaLabel,
  onFocus,
  onChange,
  onBlur,
  onAcceptConcept,
}: {
  lang: "es" | "en";
  dataField: "spanish" | "english";
  value: string;
  otherValue: string;
  placeholder: string;
  ariaLabel: string;
  onFocus: () => void;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  // this field's resolved text, and (only when the other field was empty)
  // the other field's resolved text — otherwise null.
  onAcceptConcept: (ownText: string, otherTextIfEmpty: string | null) => void;
}) {
  const auto = usePairFieldAutocomplete(lang, value);

  function accept(result: PairAutocompleteResult) {
    const own = stripConceptPlaceholder(ownText(lang, result));
    const otherLang = lang === "es" ? "en" : "es";
    const otherTextIfEmpty = otherValue.trim()
      ? null
      : stripConceptPlaceholder(ownText(otherLang, result));
    auto.setOpen(false);
    onAcceptConcept(own, otherTextIfEmpty);
  }

  return (
    <div className="lesson-document-language-field" data-language={lang}>
      <textarea
        rows={1}
        data-field={dataField}
        data-keymap-ignore={auto.open ? "" : undefined}
        value={value}
        onFocus={onFocus}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => {
          // A real popover click never reaches here — its option's own
          // onMouseDown calls preventDefault so the field never blurs.
          // Any other blur (Tab away, clicking elsewhere, a sibling field
          // taking focus) must close the popover: left open, it would keep
          // `data-keymap-ignore` on this now-unfocused field, silently
          // swallowing the *next* Escape/Tab/Alt+ArrowDown/etc. pressed
          // here later instead of the normal chord (owner-reproducible:
          // type a Spanish word with a real curriculum match, move on,
          // come back and press a chord — it hits the stale popover
          // instead). `notifyBlur()` also invalidates any fetch already in
          // flight so it can't reopen the popover later, even if this same
          // field is refocused (without retyping) before that fetch lands.
          auto.setOpen(false);
          auto.notifyBlur();
          onBlur?.(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (!auto.open) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            auto.moveHighlight(1);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            auto.moveHighlight(-1);
          } else if (event.key === "Tab" && event.shiftKey) {
            // Shift+Tab isn't an accept gesture — close the popover and let
            // the normal (unhandled, since the global dispatcher already
            // skipped this field for `data-keymap-ignore`) Tab-back happen.
            auto.setOpen(false);
          } else if (event.key === "Tab" || event.key === "Enter") {
            const picked = auto.results[auto.highlight];
            if (picked) {
              event.preventDefault();
              accept(picked);
            }
          } else if (event.key === "Escape") {
            event.preventDefault();
            auto.setOpen(false);
          }
        }}
        placeholder={placeholder}
        lang={lang}
        aria-label={ariaLabel}
      />
      {auto.open && (
        <PairAutocompletePopover
          lang={lang}
          results={auto.results}
          highlight={auto.highlight}
          onHighlight={auto.setHighlight}
          onPick={accept}
        />
      )}
    </div>
  );
}

export function PairAutocompletePopover({
  lang,
  results,
  highlight,
  onHighlight,
  onPick,
}: {
  lang: "es" | "en";
  results: PairAutocompleteResult[];
  highlight: number;
  onHighlight: (index: number) => void;
  onPick: (result: PairAutocompleteResult) => void;
}) {
  const listboxId = useId();
  return (
    <ul
      id={listboxId}
      role="listbox"
      data-keymap-ignore
      className="concept-typeahead-popover"
      aria-label={lang === "es" ? "Spanish concept completions" : "English concept completions"}
    >
      {results.map((result, index) => {
        const primary = stripConceptPlaceholder(ownText(lang, result));
        const secondary = stripConceptPlaceholder(ownText(lang === "es" ? "en" : "es", result));
        return (
          <li key={result.id} role="option" aria-selected={index === highlight}>
            <div
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => onHighlight(index)}
              onClick={() => onPick(result)}
              className={`concept-typeahead-option${index === highlight ? " is-active" : ""}`}
            >
              <span className="concept-typeahead-option-label">
                <span className="concept-typeahead-option-english">{primary}</span>
                <span className="concept-typeahead-option-spanish">{secondary}</span>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
