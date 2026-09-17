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
 * Speakers usable on this device: either the generated-clip manifest lists
 * at least one clip for that speaker id, or the device reports a
 * `speechSynthesis` voice matching that speaker's `lang`. Accent (lang)
 * always wins over the gender hint for the voice path — a speaker with no
 * gender-matching voice is still available if the accent matches.
 *
 * Both probes (manifest fetch, voice list) must settle before this
 * resolves — callers (the sentence card) await it before picking a speaker
 * and rendering the chip, so a slow manifest fetch never causes a false
 * "no speakers" result. See docs/design/speech.md rule 1.
 */
export async function availableSpeakers(): Promise<Speaker[]> {
  const synth = getSynth();
  const [voices, manifestSpeakerIds] = await Promise.all([
    synth ? loadVoices(synth) : Promise.resolve<SpeechSynthesisVoice[]>([]),
    manifestSpeakerIdSet(),
  ]);
  return SPEAKER_ROSTER.filter(
    (speaker) =>
      manifestSpeakerIds.has(speaker.id) ||
      voices.some((voice) =>
        voice.lang.toLowerCase().startsWith(speaker.lang.toLowerCase()),
      ),
  );
}

/**
 * Resolves once both the manifest probe and the voice list have settled —
 * the point at which `availableSpeakers()`/`pickSpeaker()` can be trusted.
 * Exposed for callers that want to wait without discarding the result of
 * `availableSpeakers()` itself (which already awaits the same thing).
 */
export async function whenReady(): Promise<void> {
  const synth = getSynth();
  await Promise.all([
    synth ? loadVoices(synth) : Promise.resolve<SpeechSynthesisVoice[]>([]),
    loadManifest(),
  ]);
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

/** Every speaker id that has at least one generated clip, across all texts. */
async function manifestSpeakerIdSet(): Promise<Set<SpeakerId>> {
  const manifest = await loadManifest();
  const ids = new Set<SpeakerId>();
  if (!manifest) return ids;
  for (const speakers of Object.values(manifest)) {
    for (const id of speakers) ids.add(id);
  }
  return ids;
}

// --- sha1 -----------------------------------------------------------------
// `crypto.subtle` is only available in "secure contexts" (https, or plain
// http on localhost) — a LAN-address preview over plain http does not get
// it, so this falls back to a small pure-JS SHA-1 rather than silently
// returning no clip on those devices.

function rotl(value: number, shift: number): number {
  return (value << shift) | (value >>> (32 - shift));
}

/** Pure-JS SHA-1 (hex digest), used only where `crypto.subtle` is absent. */
function sha1Fallback(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const bitLength = bytes.length * 8;
  // Pad: 0x80, then zeros, then the 64-bit bit-length, to a multiple of 64
  // bytes (16 32-bit words), matching the SHA-1 spec.
  const withOne = bytes.length + 1;
  const paddedLength = Math.ceil((withOne + 8) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 2 ** 32), false);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const w = new Array<number>(80);
  for (let chunkStart = 0; chunkStart < padded.length; chunkStart += 64) {
    for (let i = 0; i < 16; i += 1) {
      w[i] = view.getUint32(chunkStart + i * 4, false);
    }
    for (let i = 16; i < 80; i += 1) {
      w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    }
    let [a, b, c, d, e] = [h0, h1, h2, h3, h4];
    for (let i = 0; i < 80; i += 1) {
      let f: number;
      let k: number;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const temp = (rotl(a, 5) + f + e + k + w[i]) | 0;
      e = d;
      d = c;
      c = rotl(b, 30);
      b = a;
      a = temp;
    }
    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
  }
  return [h0, h1, h2, h3, h4]
    .map((part) => (part >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

async function sha1(text: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    try {
      const bytes = new TextEncoder().encode(text);
      const digest = await crypto.subtle.digest("SHA-1", bytes);
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    } catch {
      // Fall through to the pure-JS implementation below.
    }
  }
  return sha1Fallback(text);
}

/** Exposed for tests: the pure-JS fallback, checked against a known digest. */
export const __sha1Fallback = sha1Fallback;

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
  // No voices at all (e.g. the owner's Linux desktop Chrome) — there is
  // nothing for `speechSynthesis` to say, and calling `speak()` anyway would
  // just queue an utterance that never fires `onstart`/`onend` on some
  // browsers, leaving the speech bubble stuck. Resolve silently instead,
  // still firing `onEnd` so callers never hang. See docs/design/speech.md
  // rule 2.
  if (synth.getVoices().length === 0) {
    callbacks?.onEnd?.();
    return;
  }
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
 * Stops whatever's currently playing or queued — an in-flight clip and any
 * synthesis utterance. Exported for callers that need to silence speech
 * outright rather than start something new (a fast typer moving past a
 * piece before it's spoken, advancing the slide, or unmounting the practice
 * card). See docs/design/speech.md.
 */
export function stopSpeaking(): void {
  stopClipPlayback();
  getSynth()?.cancel();
}

/**
 * Speaks one piece of text with the given speaker. Prefers a generated clip
 * for that exact speaker; if the clip is missing for that speaker (even if
 * another speaker has one), falls back to the browser voice — never plays
 * a clip in the wrong accent for the shown avatar. Resolves silently on any
 * failure; never throws.
 *
 * Always interrupts whatever's still playing first (clip or synthesis) — a
 * newly correct piece never queues up behind one still being spoken; a fast
 * typer just hears the latest piece. See docs/design/speech.md.
 */
export async function speak(
  text: string,
  speaker: Speaker | null,
  callbacks?: SpeakCallbacks,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed || isMuted()) return;
  stopSpeaking();
  try {
    if (speaker) {
      const clipUrl = await clipUrlFor(trimmed, speaker.id);
      if (clipUrl) {
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
 * Speaks a full sentence. `speak()` itself already interrupts anything still
 * playing, so this is the same call under a name that reads better at call
 * sites — kept as its own export since callers rely on it as "the sentence
 * always wins" regardless of how `speak()`'s internals evolve.
 */
export async function speakSentence(
  text: string,
  speaker: Speaker | null,
  callbacks?: SpeakCallbacks,
): Promise<void> {
  return speak(text, speaker, callbacks);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const setter =
      typeof window !== "undefined"
        ? window.setTimeout.bind(window)
        : setTimeout;
    setter(resolve, ms);
  });
}

// A safety net only — real speech (clip or synthesis) ends well under this,
// so it only fires when something was interrupted before it could report
// its own end (see speak()'s interrupt-on-new-piece behaviour above).
const PIECE_END_SAFETY_MS = 2500;

/**
 * Speaks text and resolves once it's done: either its own end/error fires,
 * or — if that never happens (e.g. this speech is itself interrupted by a
 * later piece before it can report its end) — a safety timeout elapses, so
 * a caller awaiting this never hangs.
 */
export function speakAwaitingEnd(
  text: string,
  speaker: Speaker | null,
  callbacks?: SpeakCallbacks,
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const setter =
      typeof window !== "undefined"
        ? window.setTimeout.bind(window)
        : setTimeout;
    const clearer =
      typeof window !== "undefined"
        ? window.clearTimeout.bind(window)
        : clearTimeout;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const timer = setter(finish, PIECE_END_SAFETY_MS);
    void speak(text, speaker, {
      onStart: () => callbacks?.onStart?.(),
      onEnd: () => {
        clearer(timer);
        callbacks?.onEnd?.();
        finish();
      },
    });
  });
}

/**
 * Sequences "last piece already speaking -> pause -> full sentence" (see
 * docs/design/speech.md item 1): waits for `piecePromise` to settle (the
 * caller's `speakAwaitingEnd()` result for the last piece — pass
 * `Promise.resolve()` if it already finished by the time this runs), pauses
 * ~500ms so the two never blur together, then speaks the full sentence.
 * `speakSentence` still wins over anything else playing regardless.
 *
 * `isCancelled` is checked right before the sentence would start (after the
 * piece and the pause) so a caller that's moved on — advanced the slide,
 * unmounted — can skip it outright rather than have it start late.
 */
export async function speakSentenceAfterPiece(
  piecePromise: Promise<void>,
  fullText: string,
  speaker: Speaker | null,
  callbacks?: SpeakCallbacks,
  options?: { pauseMs?: number; isCancelled?: () => boolean },
): Promise<void> {
  await piecePromise;
  await delay(options?.pauseMs ?? 500);
  if (options?.isCancelled?.()) return;
  return speakSentence(fullText, speaker, callbacks);
}
