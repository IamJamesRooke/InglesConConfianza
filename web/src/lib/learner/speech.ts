// Speech: hearing what you just built. See docs/design/speech.md — the spec.
//
// Two backends behind one `speak()` call: a generated clip at
// `/audio/<speaker>/<sha1(text)>.mp3` (see scripts/generate-audio.ts) when a
// manifest says it exists, else the browser's `window.speechSynthesis`. Both
// paths must resolve silently — speech is a nice-to-have, never a thrown
// error that breaks practice.

export type SpeakerId = "us-man" | "uk-woman";

export type Speaker = {
  id: SpeakerId;
  label: string;
  flag: string;
  lang: string;
  genderHint: "male" | "female";
  voiceNames: string[];
};

// Order matters only as the fallback iteration order when nothing else
// distinguishes two candidates; random selection happens in pickSpeaker.
export const SPEAKER_ROSTER: Speaker[] = [
  {
    id: "us-man",
    label: "USA",
    flag: "🇺🇸",
    lang: "en-US",
    genderHint: "male",
    voiceNames: [
      "Google US English",
      "Microsoft Guy",
      "Microsoft Christopher",
      "Alex",
      "Fred",
    ],
  },
  {
    id: "uk-woman",
    label: "UK",
    flag: "🇬🇧",
    lang: "en-GB",
    genderHint: "female",
    voiceNames: [
      "Google UK English Female",
      "Microsoft Sonia",
      "Microsoft Libby",
      "Kate",
      "Serena",
      "Daniel",
    ],
  },
];

export function speakerById(id: SpeakerId): Speaker | undefined {
  return SPEAKER_ROSTER.find((speaker) => speaker.id === id);
}

// --- Voice lookup -----------------------------------------------------

type SynthLike = Pick<
  typeof window.speechSynthesis,
  "getVoices" | "speak" | "cancel"
> & {
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function getSynth(): SynthLike | null {
  if (typeof window === "undefined") return null;
  if (!("speechSynthesis" in window)) return null;
  return window.speechSynthesis as unknown as SynthLike;
}

export function isSpeechAvailable(): boolean {
  return getSynth() !== null;
}

/**
 * `speechSynthesis.getVoices()` is populated asynchronously on Chrome (fires
 * `voiceschanged` once the OS/browser voice list loads). This resolves with
 * whatever's available now, or waits once for that event, whichever's first.
 */
function loadVoices(synth: SynthLike): Promise<SpeechSynthesisVoice[]> {
  const existing = synth.getVoices();
  if (existing.length > 0) return Promise.resolve(existing);
  if (!synth.addEventListener) return Promise.resolve(existing);
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      synth.removeEventListener?.("voiceschanged", finish);
      resolve(synth.getVoices());
    };
    synth.addEventListener?.("voiceschanged", finish);
    // Some browsers never fire the event when the list is genuinely empty —
    // don't hang forever.
    window.setTimeout(finish, 500);
  });
}

function matchesVoiceName(voice: SpeechSynthesisVoice, names: string[]) {
  return names.some((name) =>
    voice.name.toLowerCase().includes(name.toLowerCase()),
  );
}

/**
 * Speakers whose `lang` has at least one matching voice on this device.
 * Accent (lang) always wins over the gender hint — a speaker with no
 * gender-matching voice is still available if the accent matches.
 */
export async function availableSpeakers(): Promise<Speaker[]> {
  const synth = getSynth();
  if (!synth) return [];
  const voices = await loadVoices(synth);
  if (voices.length === 0) return [];
  return SPEAKER_ROSTER.filter((speaker) =>
    voices.some((voice) => voice.lang.toLowerCase().startsWith(
      speaker.lang.toLowerCase(),
    )),
  );
}

function pickVoiceFor(
  speaker: Speaker,
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  const accentVoices = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith(speaker.lang.toLowerCase()),
  );
  if (accentVoices.length === 0) return null;
  const named = accentVoices.find((voice) =>
    matchesVoiceName(voice, speaker.voiceNames),
  );
  return named ?? accentVoices[0] ?? null;
}

// Deterministic string hash (djb2) so the same seed always picks the same
// speaker within a session, without pulling in a hashing dependency.
function hashSeed(seed: string): number {
  let hash = 5381;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33) ^ seed.charCodeAt(index);
  }
  return hash >>> 0;
}

/**
 * Deterministically picks a speaker for a given seed (e.g. a slide/block
 * id) among the speakers passed in as available. If none are available,
 * returns null (no chip, browser fallback still speaks if it can). If
 * exactly one is available, always returns it.
 */
export function pickSpeaker(
  seed: string,
  available: Speaker[] = SPEAKER_ROSTER,
): Speaker | null {
  if (available.length === 0) return null;
  if (available.length === 1) return available[0];
  const index = hashSeed(seed) % available.length;
  return available[index];
}

// --- Mute state ---------------------------------------------------------

const MUTE_KEY = "icc.speech.muted";
const muteListeners = new Set<() => void>();

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // Storage blocked (private mode, quota) — mute state just won't persist.
  }
  if (muted) getSynth()?.cancel();
  muteListeners.forEach((listener) => listener());
}

export function subscribeMuted(listener: () => void): () => void {
  muteListeners.add(listener);
  return () => muteListeners.delete(listener);
}

// --- Generated-clip manifest ---------------------------------------------
// `public/audio/manifest.json`: { "<sha1>": ["us-man", "uk-woman"] } — which
// speakers have a generated clip for that text's hash. Probed once per page
// load; an absent manifest (404 or malformed) means no clips, browser
// synthesis only.

type Manifest = Record<string, SpeakerId[]>;
let manifestPromise: Promise<Manifest | null> | null = null;

async function loadManifest(): Promise<Manifest | null> {
  if (typeof window === "undefined") return null;
  if (manifestPromise) return manifestPromise;
  manifestPromise = fetch("/audio/manifest.json", { cache: "force-cache" })
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null);
  return manifestPromise;
}

/** Exposed for tests: resets the memoized manifest fetch between cases. */
export function resetSpeechCaches(): void {
  manifestPromise = null;
}

async function sha1(text: string): Promise<string | null> {
  if (typeof crypto === "undefined" || !crypto.subtle) return null;
  try {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-1", bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

/**
 * Resolves the URL of a generated clip for this text/speaker, if the
 * manifest lists one. Never throws.
 */
export async function clipUrlFor(
  text: string,
  speaker: SpeakerId,
): Promise<string | null> {
  const manifest = await loadManifest();
  if (!manifest) return null;
  const hash = await sha1(text.trim());
  if (!hash) return null;
  const speakers = manifest[hash];
  if (!speakers?.includes(speaker)) return null;
  return `/audio/${speaker}/${hash}.mp3`;
}

// --- Speaking -------------------------------------------------------------

let currentAudio: HTMLAudioElement | null = null;

function stopClipPlayback() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

export type SpeakCallbacks = {
  onStart?: () => void;
  onEnd?: () => void;
};

function speakWithSynthesis(
  text: string,
  speaker: Speaker | null,
  callbacks?: SpeakCallbacks,
) {
  const synth = getSynth();
  if (!synth) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  if (speaker) {
    utterance.lang = speaker.lang;
    const voice = pickVoiceFor(speaker, synth.getVoices());
    if (voice) utterance.voice = voice;
  }
  utterance.onstart = () => callbacks?.onStart?.();
  utterance.onend = () => callbacks?.onEnd?.();
  utterance.onerror = () => callbacks?.onEnd?.();
  try {
    synth.speak(utterance as unknown as SpeechSynthesisUtterance);
  } catch {
    // Never let a speech failure break practice.
    callbacks?.onEnd?.();
  }
}

/**
 * Speaks one piece of text with the given speaker. Prefers a generated clip
 * for that exact speaker; if the clip is missing for that speaker (even if
 * another speaker has one), falls back to the browser voice — never plays
 * a clip in the wrong accent for the shown avatar. Resolves silently on any
 * failure; never throws.
 */
export async function speak(
  text: string,
  speaker: Speaker | null,
  callbacks?: SpeakCallbacks,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed || isMuted()) return;
  try {
    if (speaker) {
      const clipUrl = await clipUrlFor(trimmed, speaker.id);
      if (clipUrl) {
        stopClipPlayback();
        const audio = new Audio(clipUrl);
        currentAudio = audio;
        audio.onplay = () => callbacks?.onStart?.();
        audio.onended = () => callbacks?.onEnd?.();
        audio.onerror = () => callbacks?.onEnd?.();
        await audio.play().catch(() => {
          speakWithSynthesis(trimmed, speaker, callbacks);
        });
        return;
      }
    }
    speakWithSynthesis(trimmed, speaker, callbacks);
  } catch {
    // Speech is best-effort — swallow anything unexpected.
    callbacks?.onEnd?.();
  }
}

/**
 * Speaks a full sentence, first cancelling any queued/playing speech (piece
 * utterances or a previous clip) so the sentence never overlaps them.
 */
export async function speakSentence(
  text: string,
  speaker: Speaker | null,
  callbacks?: SpeakCallbacks,
): Promise<void> {
  stopClipPlayback();
  getSynth()?.cancel();
  return speak(text, speaker, callbacks);
}
