import assert from "node:assert/strict";
import test from "node:test";

import {
  availableSpeakers,
  clipUrlFor,
  isMuted,
  isSpeechAvailable,
  pickSpeaker,
  resetSpeechCaches,
  setMuted,
  SPEAKER_ROSTER,
  speak,
  speakSentence,
} from "../../src/lib/learner/speech";

type FakeVoice = { name: string; lang: string };

function makeSynth(voices: FakeVoice[]) {
  const spoken: unknown[] = [];
  let cancelCount = 0;
  const listeners = new Map<string, Set<() => void>>();
  const synth = {
    getVoices: () => voices as unknown as SpeechSynthesisVoice[],
    speak: (utterance: unknown) => {
      spoken.push(utterance);
      const u = utterance as { onstart?: () => void; onend?: () => void };
      u.onstart?.();
      u.onend?.();
    },
    cancel: () => {
      cancelCount += 1;
    },
    addEventListener: (type: string, listener: () => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener: (type: string, listener: () => void) => {
      listeners.get(type)?.delete(listener);
    },
  };
  return { synth, spoken, cancelCount: () => cancelCount };
}

class FakeUtterance {
  text: string;
  rate = 1;
  pitch = 1;
  lang = "";
  voice: unknown = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

function withStubbedGlobals<T>(
  {
    synth,
    localStorageData = new Map<string, string>(),
    blockStorage = false,
    fetchImpl,
  }: {
    synth: unknown;
    localStorageData?: Map<string, string>;
    blockStorage?: boolean;
    fetchImpl?: typeof fetch;
  },
  run: () => T | Promise<T>,
): Promise<T> {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalUtterance = (globalThis as Record<string, unknown>)
    .SpeechSynthesisUtterance;
  const originalFetch = globalThis.fetch;
  const originalAudio = (globalThis as Record<string, unknown>).Audio;

  const fakeWindow = {
    speechSynthesis: synth,
    localStorage: {
      getItem: (key: string) => {
        if (blockStorage) throw new Error("denied");
        return localStorageData.get(key) ?? null;
      },
      setItem: (key: string, value: string) => {
        if (blockStorage) throw new Error("denied");
        localStorageData.set(key, value);
      },
    },
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
  };
  Object.defineProperty(globalThis, "window", {
    value: fakeWindow,
    configurable: true,
  });
  (globalThis as Record<string, unknown>).SpeechSynthesisUtterance =
    FakeUtterance;
  (globalThis as Record<string, unknown>).Audio = class {
    onplay: (() => void) | null = null;
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    play() {
      return Promise.reject(new Error("no clip in tests"));
    }
    pause() {}
  };
  if (fetchImpl) globalThis.fetch = fetchImpl;

  return Promise.resolve()
    .then(run)
    .finally(() => {
      resetSpeechCaches();
      if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
      else Reflect.deleteProperty(globalThis, "window");
      if (originalUtterance !== undefined)
        (globalThis as Record<string, unknown>).SpeechSynthesisUtterance =
          originalUtterance;
      else Reflect.deleteProperty(globalThis, "SpeechSynthesisUtterance");
      if (originalFetch) globalThis.fetch = originalFetch;
      if (originalAudio !== undefined)
        (globalThis as Record<string, unknown>).Audio = originalAudio;
      else Reflect.deleteProperty(globalThis, "Audio");
    });
}

test("roster filtering: only speakers whose accent has a matching voice are available", async () => {
  const { synth } = makeSynth([{ name: "Google US English", lang: "en-US" }]);
  await withStubbedGlobals({ synth }, async () => {
    assert.equal(isSpeechAvailable(), true);
    const speakers = await availableSpeakers();
    assert.deepEqual(
      speakers.map((speaker) => speaker.id),
      ["us-man"],
    );
  });
  const none = makeSynth([]);
  await withStubbedGlobals({ synth: none.synth }, async () => {
    assert.deepEqual(await availableSpeakers(), []);
  });
});

test("pickSpeaker is deterministic per seed and respects a single available speaker", () => {
  const first = pickSpeaker("block-123", SPEAKER_ROSTER);
  const second = pickSpeaker("block-123", SPEAKER_ROSTER);
  assert.equal(first?.id, second?.id);
  const onlyUs = SPEAKER_ROSTER.filter((speaker) => speaker.id === "us-man");
  assert.equal(pickSpeaker("anything", onlyUs)?.id, "us-man");
  assert.equal(pickSpeaker("anything", []), null);
});

test("speakSentence cancels the queue before speaking so pieces never overlap it", async () => {
  const { synth, spoken, cancelCount } = makeSynth([
    { name: "Google US English", lang: "en-US" },
  ]);
  await withStubbedGlobals({ synth }, async () => {
    const speaker = SPEAKER_ROSTER.find((s) => s.id === "us-man")!;
    await speak("piece one", speaker);
    await speak("piece two", speaker);
    assert.equal(cancelCount(), 0);
    await speakSentence("full sentence", speaker);
    assert.equal(cancelCount(), 1);
    assert.equal(spoken.length, 3);
    assert.equal((spoken[2] as FakeUtterance).text, "full sentence");
  });
});

test("mute state persists and silences speak() without touching the synth", async () => {
  const { synth, spoken } = makeSynth([{ name: "Google US English", lang: "en-US" }]);
  const data = new Map<string, string>();
  await withStubbedGlobals({ synth, localStorageData: data }, async () => {
    assert.equal(isMuted(), false);
    setMuted(true);
    assert.equal(isMuted(), true);
    assert.equal(data.get("icc.speech.muted"), "1");
    const speaker = SPEAKER_ROSTER.find((s) => s.id === "us-man")!;
    await speak("should not be spoken", speaker);
    assert.equal(spoken.length, 0);
    setMuted(false);
    await speak("now this speaks", speaker);
    assert.equal(spoken.length, 1);
  });
});

test("mute state tolerates blocked storage without throwing", async () => {
  const { synth } = makeSynth([]);
  await withStubbedGlobals(
    { synth, blockStorage: true },
    async () => {
      assert.doesNotThrow(() => setMuted(true));
      assert.equal(isMuted(), false);
    },
  );
});

test("manifest lookup resolves a clip URL only for a speaker the manifest lists, and null when absent", async () => {
  const { synth } = makeSynth([{ name: "Google US English", lang: "en-US" }]);
  const usSpeaker = SPEAKER_ROSTER.find((s) => s.id === "us-man")!;
  const digest = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode("Hello"),
  );
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  await withStubbedGlobals(
    {
      synth,
      fetchImpl: (async () =>
        new Response(JSON.stringify({ [hash]: ["us-man"] }), {
          status: 200,
        })) as unknown as typeof fetch,
    },
    async () => {
      assert.equal(
        await clipUrlFor("Hello", "us-man"),
        `/audio/us-man/${hash}.mp3`,
      );
      assert.equal(await clipUrlFor("Hello", "uk-woman"), null);
      assert.equal(await clipUrlFor("Not in manifest", "us-man"), null);
    },
  );
  void usSpeaker;
});

test("an absent or broken manifest resolves to no clip rather than throwing", async () => {
  const { synth } = makeSynth([]);
  await withStubbedGlobals(
    {
      synth,
      fetchImpl: (async () =>
        new Response("not found", { status: 404 })) as unknown as typeof fetch,
    },
    async () => {
      assert.equal(await clipUrlFor("Hello", "us-man"), null);
    },
  );
});
