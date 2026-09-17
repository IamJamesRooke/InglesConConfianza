import { expect, test } from "./fixtures";

// Speech feature (docs/design/speech.md): pieces speak as they turn correct,
// then the full sentence speaks once. `window.speechSynthesis` is stubbed via
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
    (window as unknown as { __speechCalls: string[] }).__speechCalls = [];
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
          (window as unknown as { __speechCalls: string[] }).__speechCalls.push(
            utterance.text,
          );
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

  const chip = page.locator(".speaker-chip-label");
  await expect(chip).toBeVisible();
  await expect(chip).toContainText(/USA|UK/);

  const inputs = page.locator("[data-practice-answer]");
  await inputs.nth(0).fill("I want");
  await expect(inputs.nth(1)).toBeFocused();
  await inputs.nth(1).fill("to know");
  await expect(inputs.nth(2)).toBeFocused();
  await inputs.nth(2).fill("something.");

  await expect(page.locator(".sentence-success")).toBeVisible();

  await page.waitForFunction(
    () => (window as unknown as { __speechCalls: string[] }).__speechCalls.length >= 4,
  );
  const calls = await page.evaluate(
    () => (window as unknown as { __speechCalls: string[] }).__speechCalls,
  );
  expect(calls).toEqual([
    "I want",
    "to know",
    "something.",
    "I want to know something.",
  ]);

  const cleanup = await request.delete(
    `/api/admin/lesson-builder/lessons/${speechLesson.id}`,
  );
  expect(cleanup.ok()).toBeTruthy();
});
