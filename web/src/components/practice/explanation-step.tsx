"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PracticeMarkdown } from "@/components/practice/practice-markdown";
import { hasActivatedAudio, markAudioActivated } from "@/lib/learner/audio-activation";
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
 * with the app to get here, so autoplay is usually allowed. Opening or
 * reloading the lesson page directly gives the document no user activation
 * yet, though, and the browser refuses the auto `play()` — that refusal is
 * tracked (`needsTap`), and the replay control expands into a small
 * "Escuchar" pill with a gentle pulse so the feature doesn't look dead. The
 * first explanation slide of a lesson always shows that expanded cue once,
 * even when the auto-play does succeed, so a learner always sees it; after
 * any clip has played successfully in this document that one-time cue is
 * skipped for the rest of the session. No clip → no control at all; this
 * never falls back to browser synthesis, since a mixed-language explanation
 * read by the wrong voice would be actively wrong, not just lower quality.
 */
export function ExplanationStep({
  markdown,
  isFirstSlide = false,
}: {
  markdown: string;
  isFirstSlide?: boolean;
}) {
  const wraps = explanationWraps(markdown);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [activated, setActivated] = useState(() => hasActivatedAudio());
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

  function handlePlaybackStarted() {
    setNeedsTap(false);
    if (!hasActivatedAudio()) {
      markAudioActivated();
      setActivated(true);
    }
  }

  function playClip(url: string) {
    stopClip();
    const audio = new Audio(url);
    currentClipRef.current = audio;
    audio.onplay = () => {
      setPlaying(true);
      handlePlaybackStarted();
    };
    audio.onended = () => setPlaying(false);
    audio.onpause = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    // Autoplay rejection (a stricter browser policy, most often no user
    // activation on this document yet) is otherwise silent — track it so
    // the replay control can surface itself instead of looking dead.
    void audio.play().catch(() => setNeedsTap(true));
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

  const showCue = !activated && (needsTap || isFirstSlide);

  return (
    <div
      className="lesson-explanation learner-enter"
      data-wraps={wraps ? "true" : "false"}
    >
      {clipUrl && (
        <button
          type="button"
          className={`lesson-explanation-replay${playing ? " playing" : ""}${
            showCue ? " lesson-explanation-replay--cue" : ""
          }`}
          onClick={replay}
          aria-label="Escuchar"
          title="Escuchar"
        >
          <Volume2
            size={showCue ? 18 : 24}
            aria-hidden="true"
            className={showCue ? "lesson-explanation-replay-icon" : undefined}
          />
          {showCue && (
            <span className="lesson-explanation-replay-label">Escuchar</span>
          )}
        </button>
      )}
      <PracticeMarkdown markdown={markdown} />
    </div>
  );
}
