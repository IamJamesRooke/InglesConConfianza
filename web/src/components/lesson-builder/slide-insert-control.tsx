"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent } from "react";

export type DocumentBlockType = "explanation" | "sentence" | "vocabulary";

const BLOCK_TYPES: { type: DocumentBlockType; label: string; key: string }[] = [
  { type: "explanation", label: "Explanation", key: "E" },
  { type: "sentence", label: "Sentence", key: "S" },
  { type: "vocabulary", label: "Vocabulary table", key: "V" },
];

type Props = {
  open: boolean;
  label?: string;
  insertLabel?: string;
  inline?: boolean;
  autoFocusOnOpen?: boolean;
  selected: number;
  onSelected: (index: number) => void;
  onToggle: () => void;
  onAdd: (type: DocumentBlockType) => void;
  onClose: () => void;
};

export function SlideInsertControl({
  open,
  // No default label: between-slide inserts are icon-only (a repeated
  // "+ Add slide" phrase at every seam reads as distracting noise once
  // there are more than one or two slides) — the exact position lives in
  // insertLabel's aria-label/title instead. Only the tail control passes
  // an explicit label, since it's the one genuinely standalone case.
  label,
  insertLabel,
  inline = false,
  autoFocusOnOpen = true,
  selected,
  onSelected,
  onToggle,
  onAdd,
  onClose,
}: Props) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const showChoices = open || inline;

  useEffect(() => {
    if (showChoices && autoFocusOnOpen)
      requestAnimationFrame(() => buttons.current[selected]?.focus());
  }, [showChoices, autoFocusOnOpen, selected]);

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      onSelected((selected + 1) % BLOCK_TYPES.length);
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      onSelected((selected - 1 + BLOCK_TYPES.length) % BLOCK_TYPES.length);
      return;
    }
    const directChoice = BLOCK_TYPES.find(
      (choice) => choice.key.toLowerCase() === event.key.toLowerCase(),
    );
    if (directChoice) {
      event.preventDefault();
      onAdd(directChoice.type);
    }
  }

  return (
    <div
      className={`lesson-document-insert${inline ? " inline" : ""}${open ? " open" : ""}`}
    >
      {!inline && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={insertLabel}
          title={insertLabel}
        >
          <Plus size={13} aria-hidden="true" />
          {label && <span>{label}</span>}
        </button>
      )}
      {showChoices && (
        <div
          className="lesson-document-insert-choices"
          role="toolbar"
          aria-label="Choose a slide type"
          onKeyDown={handleKey}
        >
          {BLOCK_TYPES.map((choice, index) => (
            <button
              key={choice.type}
              ref={(element) => {
                buttons.current[index] = element;
              }}
              type="button"
              className={selected === index ? "selected" : ""}
              onFocus={() => onSelected(index)}
              onClick={() => onAdd(choice.type)}
            >
              {choice.label} <kbd>{choice.key}</kbd>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
