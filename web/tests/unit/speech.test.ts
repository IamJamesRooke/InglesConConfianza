import assert from "node:assert/strict";
import { setImmediate as flushMicrotasks } from "node:timers/promises";
import test from "node:test";

import {
  __sha1Fallback,
  availableSpeakers,
  clipUrlFor,
  isMuted,
  isSpeechAvailable,
  pickSpeaker,
  resetSpeechCaches,
  setMuted,
  SPEAKER_ROSTER,
  speak,
  speakAwaitingEnd,
  speakSentence,
  speakSentenceAfterPiece,
  stopSpeaking,
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
      if (originalWindow)
        Object.defineProperty(globalThis, "window", originalWindow);
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

test("speakSentence still wins over anything else playing", async () => {
  const { synth, spoken } = makeSynth([
    { name: "Google US English", lang: "en-US" },
  ]);
  await withStubbedGlobals({ synth }, async () => {
    const speaker = SPEAKER_ROSTER.find((s) => s.id === "us-man")!;
    await speak("piece one", speaker);
    await speak("piece two", speaker);
    await speakSentence("full sentence", speaker);
    assert.equal(spoken.length, 3);
    assert.equal((spoken[2] as FakeUtterance).text, "full sentence");
  });
});

// Item 5(a): a newly correct piece interrupts whatever is still playing
// rather than queuing up behind it — a fast typer never hears pieces stack.
test("a newly correct piece interrupts whatever is still playing rather than queuing", async () => {
  const { synth, spoken, cancelCount } = makeSynth([
    { name: "Google US English", lang: "en-US" },
  ]);
  await withStubbedGlobals({ synth }, async () => {
    const speaker = SPEAKER_ROSTER.find((s) => s.id === "us-man")!;
    await speak("piece one", speaker);
    await speak("piece two", speaker);
    await speak("piece three", speaker);
    // Every speak() call stops whatever might still be mid-air first.
    assert.equal(cancelCount(), 3);
    assert.deepEqual(
      spoken.map((u) => (u as FakeUtterance).text),
      ["piece one", "piece two", "piece three"],
    );
  });
});

// Item 5(c): advancing the slide or unmounting the practice card cancels any
// speech in flight — stopSpeaking() is what that cleanup calls.
test("stopSpeaking silences in-flight synthesis so advancing/unmounting cancels playback", async () => {
  const { synth, cancelCount } = makeSynth([
    { name: "Google US English", lang: "en-US" },
  ]);
  await withStubbedGlobals({ synth }, async () => {
    const speaker = SPEAKER_ROSTER.find((s) => s.id === "us-man")!;
    await speak("piece one", speaker);
    const before = cancelCount();
    stopSpeaking();
    assert.equal(cancelCount(), before + 1);
  });
});

test("speakSentenceAfterPiece waits for the piece, pauses ~500ms, then speaks the sentence in order", async (t) => {
  const { synth, spoken } = makeSynth([
    { name: "Google US English", lang: "en-US" },
  ]);
  t.mock.timers.enable({ apis: ["setTimeout"] });
  try {
    await withStubbedGlobals(
      {
        synth,
        // A real fetch() to /audio/manifest.json relies on real timers
        // internally (undici connect/keep-alive timers) and would hang
        // forever once global timers are mocked — stub it out like the
        // other manifest tests do.
        fetchImpl: (async () =>
          new Response("not found", {
            status: 404,
          })) as unknown as typeof fetch,
      },
      async () => {
        const speaker = SPEAKER_ROSTER.find((s) => s.id === "us-man")!;
        await speak("I want", speaker);
        await speak("to do", speaker);
        const piece = speakAwaitingEnd("something", speaker);
        await piece;
        assert.deepEqual(
          spoken.map((u) => (u as FakeUtterance).text),
          ["I want", "to do", "something"],
        );
        const sequence = speakSentenceAfterPiece(
          piece,
          "I want to do something",
          speaker,
        );
        // Let the sequencing function run up to its pause (`await
        // piecePromise` then `delay()` registering its timer) before
        // ticking — otherwise the tick below fires before that timer even
        // exists. A real setImmediate (not the mocked setTimeout) flushes
        // the pending microtasks without advancing the virtual clock.
        await flushMicrotasks();
        // The pause hasn't elapsed yet — the sentence must not have spoken.
        t.mock.timers.tick(499);
        await flushMicrotasks();
        assert.equal(spoken.length, 3);
        t.mock.timers.tick(1);
        await sequence;
        assert.deepEqual(
          spoken.map((u) => (u as FakeUtterance).text),
          ["I want", "to do", "something", "I want to do something"],
        );
      },
    );
  } finally {
    t.mock.timers.reset();
  }
});

test("speakSentenceAfterPiece skips the sentence when cancelled during the pause", async (t) => {
  const { synth, spoken } = makeSynth([
    { name: "Google US English", lang: "en-US" },
  ]);
  t.mock.timers.enable({ apis: ["setTimeout"] });
  try {
    await withStubbedGlobals({ synth }, async () => {
      const speaker = SPEAKER_ROSTER.find((s) => s.id === "us-man")!;
      let cancelled = false;
      const sequence = speakSentenceAfterPiece(
        Promise.resolve(),
        "full sentence",
        speaker,
        undefined,
        { isCancelled: () => cancelled },
      );
      cancelled = true;
      // Let it reach the pause's timer registration before ticking past it
      // (see the previous test's comment on flushMicrotasks).
      await flushMicrotasks();
      t.mock.timers.tick(500);
      await sequence;
      assert.equal(spoken.length, 0);
    });
  } finally {
    t.mock.timers.reset();
  }
});

test("mute state persists and silences speak() without touching the synth", async () => {
  const { synth, spoken } = makeSynth([
    { name: "Google US English", lang: "en-US" },
  ]);
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
  await withStubbedGlobals({ synth, blockStorage: true }, async () => {
    assert.doesNotThrow(() => setMuted(true));
    assert.equal(isMuted(), false);
  });
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

// Bug fix: a "force-cache" manifest fetch made a freshly generated clip
// invisible until the browser's HTTP cache expired (or a hard refresh
// cleared it). "no-cache" still lets a validated response be reused but
// always revalidates with the server first, so a clip generated after page
// load (via the builder's generate actions) shows up without a hard
// refresh. The in-memory memo is unaffected — resetSpeechCaches() still
// clears it explicitly after a generate action.
test("the manifest fetch revalidates instead of forcing the HTTP cache", async () => {
  const { synth } = makeSynth([]);
  const requests: RequestInit[] = [];
  await withStubbedGlobals(
    {
      synth,
      fetchImpl: (async (_input: unknown, init?: RequestInit) => {
        requests.push(init ?? {});
        return new Response("not found", { status: 404 });
      }) as unknown as typeof fetch,
    },
    async () => {
      await clipUrlFor("Hello", "us-man");
    },
  );
  assert.equal(requests.length, 1);
  assert.equal(requests[0].cache, "no-cache");
});

test("pure-JS sha1 fallback matches the known digest of 'abc'", () => {
  assert.equal(
    __sha1Fallback("abc"),
    "a9993e364706816aba3e25717850c26c9cd0d89d",
  );
  assert.equal(__sha1Fallback(""), "da39a3ee5e6b4b0d3255bfef95601890afd80709");
});

test("a speaker with no matching voice is still available when the manifest lists a clip for it", async () => {
  // No voices at all (the owner's Linux desktop Chrome symptom), but the
  // manifest has a clip for uk-woman — that speaker must still show up.
  const { synth } = makeSynth([]);
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
        new Response(JSON.stringify({ [hash]: ["uk-woman"] }), {
          status: 200,
        })) as unknown as typeof fetch,
    },
    async () => {
      const speakers = await availableSpeakers();
      assert.deepEqual(
        speakers.map((speaker) => speaker.id),
        ["uk-woman"],
      );
    },
  );
});

test("no manifest and no voices means no available speakers, but speak() still resolves silently", async () => {
  const { synth, spoken } = makeSynth([]);
  await withStubbedGlobals(
    {
      synth,
      fetchImpl: (async () =>
        new Response("not found", { status: 404 })) as unknown as typeof fetch,
    },
    async () => {
      assert.deepEqual(await availableSpeakers(), []);
      await assert.doesNotReject(() => speak("hello", null));
      assert.equal(spoken.length, 0);
    },
  );
});
