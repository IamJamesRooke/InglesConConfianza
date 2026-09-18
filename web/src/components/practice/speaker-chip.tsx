"use client";

import type { ReactNode } from "react";
import { useState } from "react";

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
 *
 * `action`, when given, renders immediately after the flag/label on their
 * shared line — the "Recuérdame" button (owner, 2026-09-18: "closer to the
 * person's head", not at the far right of the row). Below 1024 that line
 * reads left to right; at 1024+ (`speaker-chip.stage`) it stacks into a
 * column instead, matching the direction's "button stays under the
 * flag/label" — see practice-stage.css's `.speaker-chip-label-row`.
 */
export function SpeakerChip({
  speaker,
  speakingText,
  variant = "inline",
  action,
}: {
  speaker: Speaker | null;
  speakingText: string | null;
  variant?: "inline" | "stage";
  action?: ReactNode;
}) {
  // No speaker on this device (no clips, no voices): a hint still has to be
  // readable, so its text shows in a plain bubble with no avatar and no audio
  // (owner, 2026-09-17). Nothing else ever sets bubble text without a
  // speaker, so the bubble only appears for hints in that case. There is no
  // flag/label line here to carry `action` — callers render it themselves
  // as a fallback sibling when there is no speaker (see SentenceStageCard).
  if (!speaker)
    return speakingText ? (
      <div className={`speaker-chip ${variant === "stage" ? "stage" : ""} speakerless`}>
        <div className="speaker-chip-body">
          <div className="speaker-chip-bubble" role="status" aria-live="polite">
            {speakingText}
          </div>
        </div>
      </div>
    ) : null;
  return (
    <SpeakerAvatarChip
      key={speaker.id}
      speaker={speaker}
      speakingText={speakingText}
      variant={variant}
      action={action}
    />
  );
}

/**
 * Split out so the `useState` tracking which candidate avatar file to try
 * next can key off `speaker.id` via React's own remount-on-key-change
 * (the parent renders this with `key={speaker.id}`) — a new speaker always
 * starts back at candidate 0.
 */
function SpeakerAvatarChip({
  speaker,
  speakingText,
  variant,
  action,
}: {
  speaker: Speaker;
  speakingText: string | null;
  variant: "inline" | "stage";
  action?: ReactNode;
}) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const size = variant === "stage" ? 72 : 40;
  const src =
    speaker.avatarSrcs[candidateIndex] ??
    speaker.avatarSrcs[speaker.avatarSrcs.length - 1];
  return (
    <div
      className={`speaker-chip ${variant === "stage" ? "stage" : ""}`}
      aria-label={`Voz: ${speaker.label}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a small
          local avatar (portrait PNG or SVG fallback); next/image's optimizer
          adds no value here and isn't used elsewhere in this codebase. */}
      <img
        className="speaker-chip-avatar"
        src={src}
        alt=""
        width={size}
        height={size}
        onError={() =>
          setCandidateIndex((index) =>
            index + 1 < speaker.avatarSrcs.length ? index + 1 : index,
          )
        }
      />
      <div className="speaker-chip-body">
        <div className="speaker-chip-label-row">
          <span className="speaker-chip-label">
            <span aria-hidden="true">{speaker.flag}</span> {speaker.label}
          </span>
          {action}
        </div>
        {speakingText ? (
          <div className="speaker-chip-bubble" role="status" aria-live="polite">
            {speakingText}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * "Recuérdame" — the one help control on a lesson slide, a quiet text button
 * next to the speaker's flag/label (it replaced the amber lightbulb
 * everywhere on 2026-09-17, then was renamed from "Pista" on 2026-09-18 —
 * owner: put it "closer to the person's head"). `Alt+H` in a field does the
 * same thing. Using it puts the answer for the piece the learner is on in
 * the speaker's bubble and has the speaker say it; the field is never filled
 * in, there is no penalty and there is no limit.
 */
export function HintButton({
  onShowHint,
  disabled,
}: {
  onShowHint: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="stage-hint-button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onShowHint}
      disabled={disabled}
      title="Escuchar la respuesta (Alt+H)"
    >
      Recuérdame
    </button>
  );
}
