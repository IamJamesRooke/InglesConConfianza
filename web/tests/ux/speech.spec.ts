import { createHash } from "node:crypto";

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

  // Help (owner, 2026-09-17): Alt+H puts the answer for the piece the
  // learner is on into the speaker's bubble and has the speaker say it — the
  // field itself is never filled in, and there is no lightbulb.
  await page.locator('[data-piece-index="0"]').press("Alt+h");
  const bubble = page.locator(".speaker-chip-bubble");
  await expect(bubble).toHaveText("I want");
  await expect(page.locator('[data-piece-index="0"]')).toHaveValue("");
  await expect(page.locator(".stage-hint-toggle")).toHaveCount(0);
  await page.waitForFunction(
    () =>
      (
        window as unknown as { __speechCalls: Array<{ text: string }> }
      ).__speechCalls.some((call) => call.text === "I want"),
  );
  await page.evaluate(() => {
    (
      window as unknown as { __speechCalls: Array<{ text: string }> }
    ).__speechCalls.length = 0;
  });

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

// Explanation voice track playback (docs/design/speech.md "Explanation
// voice track"): auto-plays once on slide open, replays on the "Escuchar"
// control, and shows a bridged [[en:word|BRIDGE]] mark's respelling small
// beside the word. The manifest and clip bytes are both faked here rather
// than relying on a real committed clip, so the same markdown can carry a
// pronunciation bridge for the screenshot below — the manifest is keyed by
// sha1(markdown), exactly like scripts/generate-audio.ts and
// explanationClipUrl().
const explanationMarkdown = "Se dice [[en:different|DIFF-rent]].";
const explanationHash = createHash("sha1")
  .update(explanationMarkdown, "utf8")
  .digest("hex");
const explanationLesson = {
  id: "lesson_ux_explanation_audio",
  name: "UX explanation audio",
  concepts: [],
  blocks: [
    {
      id: "block_ux_explanation_audio",
      type: "explanation" as const,
      contentMarkdown: explanationMarkdown,
    },
  ],
};

test("an explanation's clip auto-plays on open and replays on Escuchar, with the bridge shown small", async ({
  page,
  request,
}) => {
  const courseResponse = await request.get("/api/admin/lesson-builder/lessons");
  const course = (await courseResponse.json()) as {
    modules: Array<{ id: string }>;
  };
  const response = await request.put(
    `/api/admin/lesson-builder/lessons/${explanationLesson.id}`,
    { data: { lesson: explanationLesson, moduleId: course.modules[0].id } },
  );
  expect(response.ok()).toBeTruthy();

  await page.setViewportSize({ width: 1280, height: 900 });

  await page.route("**/audio/manifest.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ explanations: { [explanationHash]: true } }),
    }),
  );

  const clipRequests: string[] = [];
  await page.route("**/audio/explanations/*.mp3", (route) => {
    clipRequests.push(route.request().url());
    // A tiny valid-enough response is not required — the assertion is on
    // the request itself, and a failed decode still resolves the audio
    // element's error handling silently, exactly like a real network hiccup.
    route.fulfill({ status: 200, contentType: "audio/mpeg", body: Buffer.alloc(4) });
  });

  await page.goto(`/practice?lesson=${explanationLesson.id}`);

  // One request the moment the slide opens (auto-play).
  await expect.poll(() => clipRequests.length).toBeGreaterThanOrEqual(1);

  const replay = page.getByRole("button", { name: "Escuchar" });
  await expect(replay).toBeVisible();

  const bridge = page.locator(".practice-language-bridge");
  await expect(bridge).toBeVisible();
  await expect(bridge).toContainText("DIFF-rent");

  await page.screenshot({ path: "/tmp/claude-1000/explanation-audio-1280.png" });

  const afterOpen = clipRequests.length;
  await replay.click();
  // A second, fresh request when the learner presses replay.
  await expect
    .poll(() => clipRequests.length)
    .toBeGreaterThanOrEqual(afterOpen + 1);

  const cleanup = await request.delete(
    `/api/admin/lesson-builder/lessons/${explanationLesson.id}`,
  );
  expect(cleanup.ok()).toBeTruthy();
});

// Audio-only marks (docs/design/speech.md "Audio-only marks"): `[[audio:…]]`
// is text the narrator SAYS and the learner never SEES — including any
// language mark nested inside it.
const audioOnlyLesson = {
  id: "lesson_ux_audio_only",
  name: "UX audio only",
  concepts: [],
  blocks: [
    {
      id: "block_ux_audio_only",
      type: "explanation" as const,
      contentMarkdown:
        "[[es:cosa]] es [[en:thing]][[audio:, T-H-I-N-G, [[en:thing]]]]",
    },
  ],
};

test("an explanation's audio-only span is spoken-only: never rendered to the learner", async ({
  page,
  request,
}) => {
  const courseResponse = await request.get("/api/admin/lesson-builder/lessons");
  const course = (await courseResponse.json()) as {
    modules: Array<{ id: string }>;
  };
  const response = await request.put(
    `/api/admin/lesson-builder/lessons/${audioOnlyLesson.id}`,
    { data: { lesson: audioOnlyLesson, moduleId: course.modules[0].id } },
  );
  expect(response.ok()).toBeTruthy();

  await page.route("**/audio/manifest.json", (route) =>
    route.fulfill({ status: 404, body: "not found" }),
  );

  await page.goto(`/practice?lesson=${audioOnlyLesson.id}`);

  const explanation = page.locator(".lesson-explanation");
  await expect(explanation).toBeVisible();
  await expect(explanation).toContainText("cosa");
  // The spelled aside, the audio run's own markers, and the `en` mark nested
  // inside it are all absent from what the learner sees — only the two
  // authored, visible marks remain.
  await expect(explanation).not.toContainText("T-H-I-N-G");
  await expect(explanation).not.toContainText("[[audio:");
  await expect(explanation.locator("mark")).toHaveCount(2);
  await expect(page.locator("[data-audio]")).toHaveCount(0);

  const cleanup = await request.delete(
    `/api/admin/lesson-builder/lessons/${audioOnlyLesson.id}`,
  );
  expect(cleanup.ok()).toBeTruthy();
});

// Spoken instruction lines (docs/design/speech.md "Spoken instruction
// lines"): a slide's promptText is read by the narrator the moment the slide
// opens, from /audio/instructions/<sha1(text)>.mp3.
const instructionText = "Veamos la diferencia.";
const instructionHash = createHash("sha1")
  .update(instructionText, "utf8")
  .digest("hex");
const instructionLesson = {
  ...speechLesson,
  id: "lesson_ux_instruction_audio",
  name: "UX instruction audio",
  blocks: [
    {
      ...speechLesson.blocks[0],
      id: "block_ux_instruction_audio",
      promptText: instructionText,
    },
  ],
};

test("a sentence slide's instruction line requests its narrator clip on open", async ({
  page,
  request,
}) => {
  const courseResponse = await request.get("/api/admin/lesson-builder/lessons");
  const course = (await courseResponse.json()) as {
    modules: Array<{ id: string }>;
  };
  const response = await request.put(
    `/api/admin/lesson-builder/lessons/${instructionLesson.id}`,
    { data: { lesson: instructionLesson, moduleId: course.modules[0].id } },
  );
  expect(response.ok()).toBeTruthy();

  await page.route("**/audio/manifest.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ instructions: { [instructionHash]: true } }),
    }),
  );

  const clipRequests: string[] = [];
  await page.route("**/audio/instructions/*.mp3", (route) => {
    clipRequests.push(route.request().url());
    route.fulfill({
      status: 200,
      contentType: "audio/mpeg",
      body: Buffer.alloc(4),
    });
  });

  await page.goto(`/practice?lesson=${instructionLesson.id}`);

  await expect(page.locator(".stage-instruction")).toContainText(
    instructionText,
  );
  await expect.poll(() => clipRequests.length).toBeGreaterThanOrEqual(1);
  expect(clipRequests[0]).toContain(`/audio/instructions/${instructionHash}.mp3`);

  // The replay control sits at the end of the instruction line, and pressing
  // it is a real new request.
  const replay = page.locator(".stage-instruction button[aria-label='Escuchar']");
  await expect(replay).toBeVisible();
  const afterOpen = clipRequests.length;
  await replay.click();
  await expect
    .poll(() => clipRequests.length)
    .toBeGreaterThanOrEqual(afterOpen + 1);

  const cleanup = await request.delete(
    `/api/admin/lesson-builder/lessons/${instructionLesson.id}`,
  );
  expect(cleanup.ok()).toBeTruthy();
});
