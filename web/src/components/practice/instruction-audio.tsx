"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  hasActivatedAudio,
  markAudioActivated,
} from "@/lib/learner/audio-activation";
import { instructionClipUrl, isMuted, subscribeMuted } from "@/lib/learner/speech";

/**
 * The spoken instruction line (docs/design/speech.md "Spoken instruction
 * lines"): a sentence or vocabulary slide's `promptText` — "Veamos la
 * diferencia." — read by the same Latin American narrator that reads
 * explanations, the moment the slide opens.
 *
 * Same playback contract as the explanation slide's clip, deliberately: a
 * fresh `Audio` per play (so a replay is a real new request and the pulsing
 * ring can key off that instance), auto-play unless muted, a refused
 * auto-play surfaced as a small "Escuchar" pill rather than silently doing
 * nothing, and the moment the slide changes — this component unmounts, or
 * `text` changes under it — whatever is playing stops, so an instruction
 * never talks over the next slide. No clip for this line → no control at all.
 *
 * The pieces themselves are still spoken as they are answered, by the slide's
 * own speaker (use-sentence-practice.ts); this only adds the direction line
 * at the top.
 */
export function InstructionAudio({ text }: { text: string }) {
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [activated, setActivated] = useState(() => hasActivatedAudio());
  const currentClipRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Drop the previous line's clip the instant the text changes, so a slow
    // manifest fetch can never leave the wrong instruction playable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClipUrl(null);
    void instructionClipUrl(text).then((url) => {
      if (!cancelled) setClipUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [text]);

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
    audio.onplay = () => {
      setPlaying(true);
      setNeedsTap(false);
      if (!hasActivatedAudio()) {
        markAudioActivated();
        setActivated(true);
      }
    };
    audio.onended = () => setPlaying(false);
    audio.onpause = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    void audio.play().catch(() => setNeedsTap(true));
  }

  useEffect(() => {
    if (!clipUrl || isMuted()) return;
    playClip(clipUrl);
    return () => stopClip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipUrl]);

  // Muting mid-line silences it immediately, like every other speech path.
  useEffect(
    () =>
      subscribeMuted(() => {
        if (isMuted()) stopClip();
      }),
    [],
  );

  if (!clipUrl) return null;

  // The expanded cue is only for the case the browser actually refused the
  // auto-play; once anything has played in this session, autoplay works and
  // the plain icon is enough.
  const showCue = needsTap && !activated;

  return (
    <button
      type="button"
      className={`instruction-replay${playing ? " playing" : ""}${
        showCue ? " instruction-replay--cue" : ""
      }`}
      onClick={() => {
        if (isMuted()) return;
        playClip(clipUrl);
      }}
      aria-label="Escuchar"
      title="Escuchar"
    >
      <Volume2 size={20} aria-hidden="true" />
      {showCue && <span className="instruction-replay-label">Escuchar</span>}
    </button>
  );
}
