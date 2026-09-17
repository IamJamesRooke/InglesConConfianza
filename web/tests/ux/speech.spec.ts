import { expect, test } from "./fixtures";

// Speech feature (docs/design/speech.md): pieces speak as they turn correct,
// on the default L2b assembling-sentence stage — each piece in the English
// line carries a stable data-piece-index whether it's still an input
// (pending/active) or has become a finished span, and either way it carries
// data-state="done" once correct. Then the full sentence speaks once.
// `window.speechSynthesis` is stubbed via
// addInitScript so no real audio ever plays; the generated-clip manifest is
// blocked so the stub always wins over any real /public/audio clips.
const speechLesson = {
  id: "lesson_ux_speech",
  name: "UX speech",
  concepts: [],
  blocks: [
    {
      id: "block_ux_speech_sentence",
      type: "sentence" as const,
      promptLabel: "",
      promptText: "",
      helperText: "",
      answerFeedback: null,
      languageBlocks: [
        {
          id: "lang_ux_speech_1",
          spanish: "Quiero",
          callout: null,
          acceptedAnswers: ["I want"],
        },
        {
          id: "lang_ux_speech_2",
          spanish: "saber",
          callout: null,
          acceptedAnswers: ["to know"],
        },
        {
          id: "lang_ux_speech_3",
          spanish: "algo.",
          callout: null,
          acceptedAnswers: ["something."],
        },
      ],
    },
  ],
};

test("pieces speak on correct, then the full sentence once, with a speaker chip shown", async ({
  page,
  request,
}) => {
  const courseResponse = await request.get("/api/admin/lesson-builder/lessons");
  const course = (await courseResponse.json()) as {
    modules: Array<{ id: string }>;
  };
  const response = await request.put(
    `/api/admin/lesson-builder/lessons/${speechLesson.id}`,
    { data: { lesson: speechLesson, moduleId: course.modules[0].id } },
  );
  expect(response.ok()).toBeTruthy();

  // No real generated clip ever wins in this test — speak() must fall back
  // to the stubbed browser synthesis below.
  await page.route("**/audio/manifest.json", (route) =>
    route.fulfill({ status: 404, body: "not found" }),
  );

  await page.addInitScript(() => {
    (
      window as unknown as { __speechCalls: Array<{ text: string; t: number }> }
    ).__speechCalls = [];
    class FakeUtterance {
      text: string;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: FakeUtterance,
      configurable: true,
    });
    const voices = [
      { name: "Google US English", lang: "en-US" },
      { name: "Google UK English Female", lang: "en-GB" },
    ];
    // Chromium's real `speechSynthesis` is a getter-only accessor on
    // Window.prototype — a plain assignment silently no-ops, so this must
    // override the property descriptor itself.
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => voices,
        speak: (utterance: FakeUtterance) => {
          (
            window as unknown as {
              __speechCalls: Array<{ text: string; t: number }>;
            }
          ).__speechCalls.push({ text: utterance.text, t: Date.now() });
          utterance.onstart?.();
          utterance.onend?.();
        },
        cancel: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  });

  await page.goto(`/practice?lesson=${speechLesson.id}`);

  // The chip is visible from the moment the slide appears — before any
  // answer is typed (item 2, docs/design/speech.md).
  const chip = page.locator(".speaker-chip-label");
  await expect(chip).toBeVisible();
  await expect(chip).toContainText(/USA|UK/);

  // Each piece keeps a stable data-piece-index regardless of whether it's
  // currently rendered as an input (pending/active) or a span (finished) —
  // see docs/design/student-experience.md, "L2b — the sentence stage".
  await page.locator('[data-piece-index="0"]').fill("I want");
  await expect(page.locator('[data-piece-index="1"]')).toBeFocused();
  await page.locator('[data-piece-index="1"]').fill("to know");
  await expect(page.locator('[data-piece-index="2"]')).toBeFocused();
  await page.locator('[data-piece-index="2"]').fill("something.");

  // L2b: no success check any more — the three finished words standing in
  // the English line are the signal (docs/design/student-experience.md).
  await expect(
    page.locator('.stage-line-en [data-state="done"]'),
  ).toHaveCount(3);

  await page.waitForFunction(
    () =>
      (window as unknown as { __speechCalls: Array<{ text: string }> })
        .__speechCalls.length >= 4,
  );
  const calls = await page.evaluate(
    () =>
      (
        window as unknown as {
          __speechCalls: Array<{ text: string; t: number }>;
        }
      ).__speechCalls,
  );
  expect(calls.map((call) => call.text)).toEqual([
    "I want",
    "to know",
    "something.",
    "I want to know something.",
  ]);
  // The full sentence is spoken strictly after the last piece, and only
  // after the ~500ms pause (item 1, docs/design/speech.md) — not
  // immediately, which would cut the last piece off mid-word.
  const lastPieceTime = calls[2].t;
  const sentenceTime = calls[3].t;
  expect(sentenceTime).toBeGreaterThan(lastPieceTime);
  expect(sentenceTime - lastPieceTime).toBeGreaterThanOrEqual(400);

  const cleanup = await request.delete(
    `/api/admin/lesson-builder/lessons/${speechLesson.id}`,
  );
  expect(cleanup.ok()).toBeTruthy();
});

// Owner's Linux desktop Chrome symptom: `speechSynthesis.getVoices()` reports
// no voices at all, so the old voice-only availability check found no
// speakers and hid the chip entirely — even though generated clips exist.
// This lesson's three pieces and full sentence are real entries in the
// committed `public/audio/manifest.json` (see docs/design/speech.md), so the
// manifest here is the real one, unblocked, and clip requests are counted.
test("with no synthesis voices but a real clip manifest, clips play and the chip still shows", async ({
  page,
  request,
}) => {
  const courseResponse = await request.get("/api/admin/lesson-builder/lessons");
  const course = (await courseResponse.json()) as {
    modules: Array<{ id: string }>;
  };
  const response = await request.put(
    `/api/admin/lesson-builder/lessons/${speechLesson.id}`,
    { data: { lesson: speechLesson, moduleId: course.modules[0].id } },
  );
  expect(response.ok()).toBeTruthy();

  const requestedClips: string[] = [];
  await page.route("**/audio/**/*.mp3", (route) => {
    requestedClips.push(route.request().url());
    route.continue();
  });

  await page.addInitScript(() => {
    // No voices at all — the manifest alone must make a speaker available.
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => [],
        speak: () => {},
        cancel: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  });

  await page.goto(`/practice?lesson=${speechLesson.id}`);

  const chip = page.locator(".speaker-chip-label");
  await expect(chip).toBeVisible();
  await expect(chip).toContainText(/USA|UK/);

  await page.locator('[data-piece-index="0"]').fill("I want");
  await expect(page.locator('[data-piece-index="1"]')).toBeFocused();
  await page.locator('[data-piece-index="1"]').fill("to know");
  await expect(page.locator('[data-piece-index="2"]')).toBeFocused();
  await page.locator('[data-piece-index="2"]').fill("something.");

  await expect(
    page.locator('.stage-line-en [data-state="done"]'),
  ).toHaveCount(3);

  // Three piece clips plus one full-sentence clip.
  await expect
    .poll(() => requestedClips.length, { timeout: 5000 })
    .toBeGreaterThanOrEqual(4);

  const cleanup = await request.delete(
    `/api/admin/lesson-builder/lessons/${speechLesson.id}`,
  );
  expect(cleanup.ok()).toBeTruthy();
});
