"use client";

import { AlignLeft, Languages, Table2 } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent } from "react";

export type DocumentBlockType = "explanation" | "sentence" | "vocabulary";

const BLOCK_TYPES: {
  type: DocumentBlockType;
  label: string;
  icon: typeof Table2;
}[] = [
  { type: "vocabulary", label: "Table", icon: Table2 },
  { type: "sentence", label: "Sentence", icon: Languages },
  { type: "explanation", label: "Explanation", icon: AlignLeft },
];

type Props = {
  insertionLabel: string;
  labelled?: boolean;
  focusPalette?: boolean;
  onAdd: (type: DocumentBlockType) => void;
  onClose: () => void;
};

export function SlideInsertControl({
  insertionLabel,
  labelled = false,
  focusPalette = false,
  onAdd,
  onClose,
}: Props) {
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
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      buttons.current[(Math.max(0, current) - 1 + BLOCK_TYPES.length) % BLOCK_TYPES.length]?.focus();
    }
  }

  return (
    <div className={`lesson-document-insert${labelled ? " labelled" : ""}`}>
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
              title={`${choice.label} — ${insertionLabel}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onAdd(choice.type)}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{choice.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
