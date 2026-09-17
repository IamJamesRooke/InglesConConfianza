"use client";

import type { Speaker } from "@/lib/learner/speech";

/**
 * Cartoon avatar + accent label/flag + a speech bubble. Persistent for the
 * whole slide — rendered as soon as a speaker is picked (before any answer),
 * never unmounted for state changes within the slide.
 *
 * No bubble at rest (owner, 2026-09-17): the bubble appears with the first
 * words spoken and then keeps showing the last thing said — there is no "…"
 * placeholder. Hidden entirely only when no speaker is available on this
 * device at all (see docs/design/speech.md).
 *
 * `variant="stage"` is the L2b two-actor composition: a bigger avatar with
 * the label under it and the bubble pointing right, at the sentence card.
 */
export function SpeakerChip({
  speaker,
  speakingText,
  variant = "inline",
}: {
  speaker: Speaker | null;
  speakingText: string | null;
  variant?: "inline" | "stage";
}) {
  if (!speaker) return null;
  const size = variant === "stage" ? 72 : 40;
  return (
    <div
      className={`speaker-chip ${variant === "stage" ? "stage" : ""}`}
      aria-label={`Voz: ${speaker.label}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a small
          local SVG avatar; next/image's optimizer adds no value here and
          isn't used elsewhere in this codebase. */}
      <img
        className="speaker-chip-avatar"
        src={`/speakers/${speaker.id}.svg`}
        alt=""
        width={size}
        height={size}
      />
      <div className="speaker-chip-body">
        <span className="speaker-chip-label">
          <span aria-hidden="true">{speaker.flag}</span> {speaker.label}
        </span>
        {speakingText ? (
          <div className="speaker-chip-bubble" role="status" aria-live="polite">
            {speakingText}
          </div>
        ) : null}
      </div>
    </div>
  );
}
