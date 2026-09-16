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

import { useCallback, useEffect, useId, useRef, useState } from "react";

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
//
// `isSelected` is the shared `EditingSelection`'s answer to "is this exact
// {blockId, pieceId, field} the one the teacher is on right now" — not this
// component's own local state. The popover is *owned* by that selection: the
// moment it stops naming this field (Tab/Enter pair-navigation, a chord like
// Ctrl+Alt+Shift+Enter, a mouse click elsewhere, moving to a brand-new block
// entirely), an effect below force-closes the popover and bumps the fetch
// generation, regardless of whether a native `blur` ever reaches this
// textarea. Relying on `blur` alone was the bug: `Escape` (which must leave
// the field focused — only the popover closes) closed the popover locally
// but left its in-flight fetch generation unbumped, so a fetch that had
// already started before Escape could resolve afterward and call
// `setOpen(true)` again — resurrecting the popover, and with it
// `data-keymap-ignore`, on a field the teacher believes is a plain textarea
// again. Any further Tab/Enter typed there was then swallowed by *this*
// component's own accept handler instead of reaching the shared keymap
// dispatcher, silently overwriting whatever piece the stray accept landed on
// instead of navigating — the corruption the owner hit while chaining pairs.
// Case/whitespace-insensitive equality used only to compare a field's
// current text against the concept it last *accepted* — never against
// search results (see `usePairFieldAutocomplete`'s doc comment above for
// why comparing against results was the bug).
export function isAcceptedMatch(value: string, lastAccepted: string | null): boolean {
  if (lastAccepted === null) return false;
  return value.trim().toLowerCase() === lastAccepted.trim().toLowerCase();
}

function usePairFieldAutocomplete(lang: "es" | "en", value: string, isSelected: boolean) {
  const [results, setResults] = useState<PairAutocompleteResult[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  // The concept text this field last accepted via Tab/Enter (or null if
  // none yet, or if the teacher has since edited the text away from it).
  // Only this — never a search result's text — suppresses the popover for
  // an exact match; see the block comment above.
  //
  // Seeded from the field's own value at mount (lazy initializer, so it
  // only ever reads the value once): a field that mounts already holding
  // real committed text — re-entering edit mode on an existing pair, not a
  // teacher actively typing — must not have the popover pop up unbidden
  // just because that saved text happens to itself be a curriculum
  // headword (e.g. re-opening a table row whose Spanish is "comer").
  // Treating "whatever was already there" as already-accepted is exactly
  // right: there is nothing to complete, since it's already complete
  // data. The teacher editing it away from this baseline text re-enables
  // search normally, same as any other field.
  const lastAcceptedRef = useRef<string | null>(value.trim() ? value : null);
  const markAccepted = useCallback((text: string) => {
    lastAcceptedRef.current = text;
  }, []);
  // A fetch started while focused can resolve after the field has since
  // blurred — and, if the teacher comes right back to it, resolve *after*
  // it is refocused too, since a plain focused/unfocused flag can't tell a
  // stale fetch from a fresh one at that point. A generation counter can:
  // every blur (or loss of the shared selection — see `close` below) bumps
  // it, and a fetch only applies its results if the generation is still the
  // one it started under.
  const generationRef = useRef(0);

  // The one place allowed to close the popover. Always bumps the generation
  // first, so a fetch already in flight can never resurrect it afterward —
  // see the block comment above.
  const close = useCallback(() => {
    generationRef.current += 1;
    setOpen(false);
  }, []);

  // Selection-owned close: the instant this field stops being the shared
  // selection's target, for *any* reason (navigation chord, mouse click,
  // moving to a freshly inserted block), the popover must stop showing and
  // any in-flight fetch must stop being able to resurrect it — a property
  // of the selection, not of any one gesture that can change it. The
  // generation bump is a ref mutation, safe to run directly in an effect;
  // deriving `effectiveOpen` below (rather than also calling `setOpen` here)
  // avoids the cascading-render setState-in-effect the lint rule flags, and
  // closes synchronously in the same render `isSelected` flips in, with no
  // extra render lag.
  useEffect(() => {
    if (!isSelected) generationRef.current += 1;
  }, [isSelected]);
  const effectiveOpen = open && isSelected;

  useEffect(() => {
    const startGeneration = generationRef.current;
    const trimmed = value.trim();
    if (trimmed.length < MIN_QUERY_LENGTH || isAcceptedMatch(trimmed, lastAcceptedRef.current)) {
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
    open: effectiveOpen,
    close,
    results,
    highlight,
    setHighlight,
    markAccepted,
    moveHighlight(delta: number) {
      setHighlight((current) => Math.min(Math.max(current + delta, 0), results.length - 1));
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
  isSelected,
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
  // Whether the shared `EditingSelection` currently names this exact
  // {blockId, pieceId, field} — see the block comment on
  // `usePairFieldAutocomplete`. The popover is owned by this, not by local
  // focus/blur bookkeeping.
  isSelected: boolean;
  placeholder: string;
  ariaLabel: string;
  onFocus: () => void;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  // this field's resolved text, and (only when the other field was empty)
  // the other field's resolved text — otherwise null.
  onAcceptConcept: (ownText: string, otherTextIfEmpty: string | null) => void;
}) {
  const auto = usePairFieldAutocomplete(lang, value, isSelected);

  function accept(result: PairAutocompleteResult) {
    // Never write a completion for a field the shared selection has already
    // moved away from — the isSelected effect closes the popover on that
    // transition, but a key event already in flight (this same keydown) is
    // handled synchronously before that effect runs, so the guard is belt
    // and suspenders against acting on a piece that is no longer current.
    if (!isSelected) return;
    const own = stripConceptPlaceholder(ownText(lang, result));
    const otherLang = lang === "es" ? "en" : "es";
    const otherTextIfEmpty = otherValue.trim()
      ? null
      : stripConceptPlaceholder(ownText(otherLang, result));
    auto.markAccepted(own);
    auto.close();
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
          // instead). `close()` also bumps the fetch generation so an
          // in-flight fetch can't reopen the popover later, even if this
          // same field is refocused (without retyping) before it resolves.
          auto.close();
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
            auto.close();
          } else if (event.key === "Tab" || event.key === "Enter") {
            const picked = auto.results[auto.highlight];
            if (picked) {
              event.preventDefault();
              accept(picked);
            }
          } else if (event.key === "Escape") {
            event.preventDefault();
            // Escape closes the popover only — the field stays focused and
            // selected (see lesson-builder.md §3). `close()` bumps the fetch
            // generation, which is the fix: without it, a fetch already in
            // flight when Escape is pressed could resolve afterward and
            // call setOpen(true) again, resurrecting the popover (and its
            // data-keymap-ignore) on a field the teacher believes is closed.
            auto.close();
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

function PairAutocompletePopover({
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
  const popoverRef = useRef<HTMLUListElement | null>(null);

  // Same fix as the main concept-typeahead popover: keep the active option
  // visible as ↑/↓ walks it past the popover's own scroll viewport.
  useEffect(() => {
    const active = popoverRef.current?.querySelector('[aria-selected="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  return (
    <ul
      ref={popoverRef}
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
