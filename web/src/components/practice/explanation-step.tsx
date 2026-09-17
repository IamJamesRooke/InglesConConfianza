"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PracticeMarkdown } from "@/components/practice/practice-markdown";
import { explanationWraps } from "@/lib/learner/presentation";
import { explanationClipUrl, isMuted, subscribeMuted } from "@/lib/learner/speech";

/**
 * An explanation slide. A single short line reads well centred and gets the
 * larger of the two fluid type sizes; anything that wraps switches to
 * left-aligned at the ordinary size (owner spec: "left-aligned when it wraps
 * beyond one line").
 *
 * The wrap decision is a rule on the authored text (explanationWraps), not a
 * DOM measurement: the previous ResizeObserver version measured only `p`/`li`
 * heights, so an explanation whose wrapping text was a heading stayed centred
 * forever, and its first measurement ran before webfonts had loaded with no
 * later re-measure guaranteed. The rule needs no effect, no ref, and is
 * already right in the server-rendered HTML.
 *
 * Playback (docs/design/speech.md "Explanation voice track"): when a
 * generated clip exists for this exact markdown and speech isn't muted, it
 * plays once automatically on mount — the learner has already interacted
 * with the app to get here, so autoplay is allowed; a rejected `play()`
 * (an autoplay-policy edge case) is swallowed, same as every other speech
 * path in this app. A small replay control lets the learner hear it again.
 * No clip → no control at all; this never falls back to browser synthesis,
 * since a mixed-language explanation read by the wrong voice would be
 * actively wrong, not just lower quality.
 */
export function ExplanationStep({ markdown }: { markdown: string }) {
  const wraps = explanationWraps(markdown);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  // The clip currently playing (auto-play or a replay press) — always a
  // fresh `Audio` instance per play so a replay is a real new request, and
  // so leaving the slide has exactly one thing to stop.
  const currentClipRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Clears a stale clip URL the instant the markdown changes, so a slow
    // fetch never leaves the previous slide's clip playable a moment too
    // long.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClipUrl(null);
    void explanationClipUrl(markdown).then((url) => {
      if (!cancelled) setClipUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [markdown]);

  function stopClip() {
    const audio = currentClipRef.current;
    if (!audio) return;
    audio.pause();
    currentClipRef.current = null;
    setPlaying(false);
  }

  function playClip(url: string) {
    stopClip();
    const audio = new Audio(url);
    currentClipRef.current = audio;
    audio.onplay = () => setPlaying(true);
    audio.onended = () => setPlaying(false);
    audio.onpause = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    // Autoplay rejection (e.g. a stricter browser policy) is silent — the
    // replay control is still there for the learner to press.
    void audio.play().catch(() => {});
  }

  // Auto-play once the clip URL resolves, unless muted. Leaving the slide
  // (markdown changes, or the component unmounts) stops it outright —
  // speech never plays over the next slide.
  useEffect(() => {
    if (!clipUrl || isMuted()) return;
    playClip(clipUrl);
    return () => stopClip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipUrl]);

  // Muting mid-playback (the strip's toggle) silences it immediately.
  useEffect(
    () =>
      subscribeMuted(() => {
        if (isMuted()) stopClip();
      }),
    [],
  );

  function replay() {
    if (!clipUrl || isMuted()) return;
    playClip(clipUrl);
  }

  return (
    <div
      className="lesson-explanation learner-enter"
      data-wraps={wraps ? "true" : "false"}
    >
      {clipUrl && (
        <button
          type="button"
          className={`lesson-explanation-replay${playing ? " playing" : ""}`}
          onClick={replay}
          aria-label="Escuchar"
          title="Escuchar"
        >
          <Volume2 size={24} aria-hidden="true" />
        </button>
      )}
      <PracticeMarkdown markdown={markdown} />
    </div>
  );
}
