"use client";

import { useState } from "react";

/**
 * A quiet text button that asks once before it acts: the first press swaps
 * the label for "¿Seguro? …", the second press runs the action. Blurring
 * (or pressing Escape) puts it back. No browser dialog — testers reset
 * progress often enough that a modal would be in the way, and a stray click
 * still costs nothing (owner, 2026-09-17).
 *
 * Used for every reset on the home: one path row, one module, the whole
 * course (LessonDashboard, LessonRow) — and it deliberately swallows the
 * click so a row's own link never fires underneath it.
 */
export function ConfirmResetButton({
  label,
  confirmLabel,
  onConfirm,
  className,
  ariaLabel,
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  className: string;
  ariaLabel?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onBlur={() => setConfirming(false)}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !confirming) return;
        event.stopPropagation();
        setConfirming(false);
      }}
      onClick={(event) => {
        // The row-level button lives inside a linked row: the row must not
        // navigate because someone reached for the reset.
        event.preventDefault();
        event.stopPropagation();
        if (!confirming) {
          setConfirming(true);
          return;
        }
        setConfirming(false);
        onConfirm();
      }}
    >
      {confirming ? confirmLabel : label}
    </button>
  );
}
