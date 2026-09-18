// "Has any generated clip actually played in this document yet?" — shared by
// the explanation slide and the spoken instruction line, which both auto-play
// on slide open and both need the same answer to the same question: whether
// to show the expanded "Escuchar" cue, or trust that autoplay works.
//
// sessionStorage, not state: the two components never meet in the React tree,
// and the answer has to survive a slide change (each slide mounts fresh
// components). Every access is guarded — private mode and disabled storage
// both throw on read as well as write, and the only cost of the fallback is
// that the cue keeps showing, which is harmless.

const AUDIO_ACTIVATED_KEY = "icc.audio.activated";

export function hasActivatedAudio(): boolean {
  try {
    return sessionStorage.getItem(AUDIO_ACTIVATED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markAudioActivated(): void {
  try {
    sessionStorage.setItem(AUDIO_ACTIVATED_KEY, "1");
  } catch {
    // Ignore (private mode, storage disabled, etc.).
  }
}
