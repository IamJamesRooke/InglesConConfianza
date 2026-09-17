"use client";

import type { Speaker } from "@/lib/learner/speech";

/**
 * Small cartoon avatar + accent label/flag + a speech bubble. Persistent for
 * the whole slide — rendered as soon as a speaker is picked (before any
 * answer), never unmounted for state changes within the slide. The bubble
 * itself is always visible on a sentence/table slide: a quiet "…" before
 * anything's spoken, the text while speaking, and it keeps showing that text
 * afterward rather than clearing. Hidden entirely only when no speaker is
 * available on this device at all (see docs/design/speech.md).
 */
export function SpeakerChip({
  speaker,
  speakingText,
}: {
  speaker: Speaker | null;
  speakingText: string | null;
}) {
  if (!speaker) return null;
  return (
    <div className="speaker-chip" aria-label={`Voz: ${speaker.label}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a small
          local SVG avatar; next/image's optimizer adds no value here and
          isn't used elsewhere in this codebase. */}
      <img
        className="speaker-chip-avatar"
        src={`/speakers/${speaker.id}.svg`}
        alt=""
        width={40}
        height={40}
      />
      <div className="speaker-chip-body">
        <span className="speaker-chip-label">
          <span aria-hidden="true">{speaker.flag}</span> {speaker.label}
        </span>
        <div className="speaker-chip-bubble" role="status" aria-live="polite">
          {speakingText || (
            <span className="speaker-chip-bubble-placeholder" aria-hidden="true">
              …
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
