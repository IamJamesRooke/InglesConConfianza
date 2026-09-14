"use client";

import { AlignLeft, Languages, Table2 } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent } from "react";

export type DocumentBlockType = "explanation" | "sentence" | "vocabulary";

// Order and initial focus are an owner-approved contract: Explanation,
// Sentence, Table — Sentence (index 1) is the one that gets focus when the
// palette opens via keyboard, since it's the most common insert.
const BLOCK_TYPES: {
  type: DocumentBlockType;
  label: string;
  icon: typeof Table2;
  key: string;
}[] = [
  { type: "explanation", label: "Explanation", icon: AlignLeft, key: "e" },
  { type: "sentence", label: "Sentence", icon: Languages, key: "s" },
  { type: "vocabulary", label: "Table", icon: Table2, key: "t" },
];

type Props = {
  insertionLabel: string;
  labelled?: boolean;
  focusPalette?: boolean;
  /** This is the seam immediately after the active slide — the one seam
   * that shows its "+" signpost at rest (see insert.css). */
  afterActive?: boolean;
  /** Whether the learnability fade (5 uses)/narrow-viewport gate currently
   * allows the "next slide" cue to show at all. Only rendered when this
   * seam is also `afterActive` — round 2, item 2: moved off the block
   * itself (where it overlapped the following slide) onto this seam's own
   * hairline. */
  showNextSlideCue?: boolean;
  onAdd: (type: DocumentBlockType) => void;
  onClose: () => void;
};

export function SlideInsertControl({
  insertionLabel,
  labelled = false,
  focusPalette = false,
  afterActive = false,
  showNextSlideCue = false,
  onAdd,
  onClose,
}: Props) {
  const showCue = afterActive && showNextSlideCue;
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (focusPalette) requestAnimationFrame(() => buttons.current[1]?.focus());
  }, [focusPalette]);

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    const current = buttons.current.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      buttons.current[(Math.max(0, current) + 1) % BLOCK_TYPES.length]?.focus();
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      buttons.current[(Math.max(0, current) - 1 + BLOCK_TYPES.length) % BLOCK_TYPES.length]?.focus();
      return;
    }
    // E/S/T insert immediately, but only here — this handler only runs
    // while focus is inside the open palette itself, never while typing
    // content elsewhere on the slide.
    if (event.ctrlKey || event.metaKey || event.altKey || event.nativeEvent.isComposing) return;
    const choice = BLOCK_TYPES.find((entry) => entry.key === event.key.toLowerCase());
    if (choice) { event.preventDefault(); onAdd(choice.type); }
  }

  return (
    <div
      className={`lesson-document-insert${labelled ? " labelled" : ""}${focusPalette ? " open" : ""}`}
      data-after-active={afterActive ? "true" : undefined}
      data-cue={showCue ? "true" : undefined}
    >
      <div
        className="lesson-document-insert-actions"
        role="group"
        aria-label={insertionLabel}
        onKeyDown={handleKey}
      >
        {labelled && <span>Add slide</span>}
        {BLOCK_TYPES.map((choice, index) => {
          const Icon = choice.icon;
          return (
            <button
              key={choice.type}
              ref={(element) => { buttons.current[index] = element; }}
              type="button"
              aria-label={`${choice.label} — ${insertionLabel}`}
              title={`${choice.label} — ${insertionLabel} (${choice.key.toUpperCase()})`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onAdd(choice.type)}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{choice.label}</span>
              {focusPalette && <kbd className="lesson-document-insert-key" aria-hidden="true">{choice.key.toUpperCase()}</kbd>}
            </button>
          );
        })}
        {focusPalette && <span className="lesson-document-insert-escape" aria-hidden="true">Esc</span>}
      </div>
      {showCue && (
        <span className="lesson-document-insert-cue" aria-hidden="true">
          <span className="lesson-document-insert-cue-label">next slide</span>
          <kbd>Ctrl</kbd>
          <kbd>Alt</kbd>
          <kbd>Enter</kbd>
        </span>
      )}
    </div>
  );
}
