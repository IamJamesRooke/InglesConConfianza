import { expect, test } from "./fixtures";

// Sentence-stage beauty pass (docs/design/learner-direction.md, "Sentence
// slide" + "Colour", 2026-09-18): the fit-vs-wrap alignment rule, the
// answer slot, "Recuérdame" (renamed from "Pista"), and the primary
// button's width rule. Isolated fixture lessons only — never the owner's
// course.

const oneLineLesson = {
  id: "lesson_ux_stage_oneline",
  name: "Hola",
  concepts: [],
  blocks: [
    {
      id: "b1",
      type: "explanation" as const,
      contentMarkdown: "[[es:hola]] es [[en:hello]], pronunciado *jelóu*.",
    },
    {
      id: "b2",
      type: "sentence" as const,
      layout: "sentence" as const,
      promptLabel: "",
      promptText: "Escribe la respuesta en inglés.",
      helperText: "",
      answerFeedback: null,
      languageBlocks: [
        {
          id: "p1",
          spanish: "hola",
          callout: null,
          acceptedAnswers: ["hello", "hi"],
        },
      ],
    },
  ],
};

const somethingLesson = {
  id: "lesson_ux_stage_something",
  name: "Algo",
  concepts: [],
  blocks: [
    {
      id: "b1",
      type: "sentence" as const,
      layout: "sentence" as const,
      promptLabel: "",
      promptText: "Escribe la respuesta en inglés.",
      helperText: "",
      answerFeedback: null,
      languageBlocks: [
        {
          id: "p1",
          spanish: "algo",
          callout: null,
          acceptedAnswers: ["something"],
        },
      ],
    },
  ],
};

const wrappingLesson = {
  id: "lesson_ux_stage_wrap",
  name: "Frase larga",
  concepts: [],
  blocks: [
    {
      id: "b1",
      type: "sentence" as const,
      layout: "sentence" as const,
      promptLabel: "",
      promptText: "Un reto más grande. Tradúcela pieza por pieza.",
      helperText: "",
      answerFeedback: null,
      languageBlocks: [
        {
          id: "p1",
          spanish: "yo quiero",
          callout: null,
          acceptedAnswers: ["I want"],
        },
        {
          id: "p2",
          spanish: "que tú vengas",
          callout: null,
          acceptedAnswers: ["you to come"],
        },
        {
          id: "p3",
          spanish: "aquí mañana por la mañana",
          callout: null,
          acceptedAnswers: ["here tomorrow morning"],
        },
      ],
    },
  ],
};

async function seed(request: import("@playwright/test").APIRequestContext, lesson: unknown) {
  const course = await (
    await request.get("/api/admin/lesson-builder/lessons")
  ).json();
  const moduleId = course.modules[0].id;
  const response = await request.put(
    `/api/admin/lesson-builder/lessons/${(lesson as { id: string }).id}`,
    { data: { lesson, moduleId } },
  );
  expect(response.ok()).toBeTruthy();
}

test("a one-line sentence gets a fit-content card sharing the explanation card's centre axis", async ({
  page,
  request,
}) => {
  await seed(request, oneLineLesson);
  await page.setViewportSize({ width: 920, height: 900 });
  await page.goto(`/practice?lesson=${oneLineLesson.id}`);

  const explanationCard = page.locator(".lesson-explanation");
  await expect(explanationCard).toBeVisible();
  const explanationBox = await explanationCard.boundingBox();

  await page.getByRole("button", { name: /Vamos a practicar/ }).click();
  const stageCard = page.locator(".stage-card");
  await expect(stageCard).toHaveAttribute("data-wraps", "false");
  await expect(stageCard).toHaveAttribute("data-hero", "true");
  const stageBox = await stageCard.boundingBox();

  expect(explanationBox).not.toBeNull();
  expect(stageBox).not.toBeNull();
  // Same horizontal centre, not necessarily the same width.
  const explanationCentre = explanationBox!.x + explanationBox!.width / 2;
  const stageCentre = stageBox!.x + stageBox!.width / 2;
  expect(Math.abs(explanationCentre - stageCentre)).toBeLessThan(2);

  // Direction ("One-line card min width"): a calm landscape box for a short
  // sentence like "hola", not a tall portrait one that just hugs the word.
  expect(stageBox!.width).toBeGreaterThanOrEqual(359);

  // The speaker cluster (portrait + flag/label + Recuérdame) sits INSIDE
  // the card's own left/right edges, its own left edge exactly on the
  // card's left edge (1px tolerance) — not sticking out to the left of it.
  const avatar = page.locator(".speaker-chip.stage .speaker-chip-avatar").first();
  const avatarBox = await avatar.boundingBox();
  expect(avatarBox).not.toBeNull();
  expect(Math.abs(avatarBox!.x - stageBox!.x)).toBeLessThanOrEqual(1);
  const labelRow = page
    .locator(".speaker-chip.stage .speaker-chip-label-row")
    .first();
  const labelRowBox = await labelRow.boundingBox();
  expect(labelRowBox).not.toBeNull();
  expect(labelRowBox!.x).toBeGreaterThanOrEqual(stageBox!.x - 1);
  expect(labelRowBox!.x + labelRowBox!.width).toBeLessThanOrEqual(
    stageBox!.x + stageBox!.width + 1,
  );

  // A one-piece sentence has nothing left to point at — no red underline on
  // the active Spanish piece.
  const spanishLine = page.locator(".stage-line-es");
  await expect(spanishLine).toHaveAttribute("data-single-piece", "true");
  const activeEs = page.locator('.stage-es[data-state="active"]');
  await expect(activeEs).toHaveCSS("border-bottom-style", "none");

  // The active answer slot is a rounded, filled box, not a bare underline.
  const input = page.locator(".stage-en-input").first();
  await expect(input).toBeFocused();
  await expect(input).toHaveCSS("border-radius", "8px");
  const background = await input.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  expect(background).not.toBe("rgba(0, 0, 0, 0)");

  // "Recuérdame" (renamed from "Pista"), and its bubble opens once pressed.
  const hint = page.getByRole("button", { name: "Recuérdame" });
  await expect(hint).toBeVisible();
  await hint.click();
  await expect(page.locator(".speaker-chip-bubble")).toContainText(/hello|hi/i);
});

test("Recuérdame's diff marks exactly the missing letter, and picks the closest alternative", async ({
  page,
  request,
}) => {
  // docs/design/learner-direction.md, "Help" (2026-09-18: the reminder's
  // diff is back, inside the bubble) — reuses the one-line fixture, whose
  // piece accepts "hello" or "hi".
  await seed(request, oneLineLesson);
  await page.goto(`/practice?lesson=${oneLineLesson.id}`);
  await page.getByRole("button", { name: /Vamos a practicar/ }).click();

  const input = page.locator(".stage-en-input").first();
  const bubble = page.locator(".speaker-chip-bubble");
  const hint = page.getByRole("button", { name: "Recuérdame" });

  await input.fill("helo");
  await hint.click();
  await expect(bubble).toContainText("hello");
  // Exactly one marked character — the missing "l" — not the whole word.
  await expect(bubble.locator(".answer-diff-fix")).toHaveCount(1);
  await expect(bubble.locator(".answer-diff-fix")).toHaveText("l");
  // A marked LETTER never gets the `--thin` min-width modifier — that's
  // reserved for a fix segment that's entirely whitespace/punctuation, or
  // it opens a visible gap around the letter ("hel l o").
  await expect(bubble.locator(".answer-diff-fix--thin")).toHaveCount(0);
  // The reminder is the payload — it renders at the larger --t-section size.
  await expect(bubble).toHaveClass(/speaker-chip-bubble--reminder/);

  await input.fill("hii");
  await hint.click();
  // Closest to "hii" is "hi", not the primary "hello".
  await expect(bubble).toContainText("hi");
  await expect(bubble).not.toContainText("hello");
});

test("bug 1: the answer slot is measured to fit its own answer at hero size, on phone too", async ({
  page,
  request,
}) => {
  await seed(request, somethingLesson);
  await page.setViewportSize({ width: 930, height: 900 });
  await page.goto(`/practice?lesson=${somethingLesson.id}`);

  const input = page.locator(".stage-en-input").first();
  await expect(input).toHaveAttribute("data-piece-index", "0");
  await input.pressSequentially("somethin");
  const measured930 = await input.evaluate((el: HTMLInputElement) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    scrollLeft: el.scrollLeft,
  }));
  expect(measured930.scrollWidth).toBeLessThanOrEqual(measured930.clientWidth);
  expect(measured930.scrollLeft).toBe(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/practice?lesson=${somethingLesson.id}`);
  const input390 = page.locator(".stage-en-input").first();
  await input390.pressSequentially("somethin");
  const measured390 = await input390.evaluate((el: HTMLInputElement) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    scrollLeft: el.scrollLeft,
  }));
  expect(measured390.scrollWidth).toBeLessThanOrEqual(measured390.clientWidth);
  expect(measured390.scrollLeft).toBe(0);
});

test("bug 2: Recuérdame's diff stays live as the learner keeps typing", async ({
  page,
  request,
}) => {
  await seed(request, somethingLesson);
  await page.setViewportSize({ width: 930, height: 900 });
  await page.goto(`/practice?lesson=${somethingLesson.id}`);

  const input = page.locator(".stage-en-input").first();
  const bubble = page.locator(".speaker-chip-bubble");
  const hint = page.getByRole("button", { name: "Recuérdame" });

  // Reproduces the owner's screenshot exactly: type "somethin", then press
  // Recuérdame — "g" is the only missing letter.
  await input.pressSequentially("somethin");
  await hint.click();
  await expect(bubble).toContainText("something");
  await expect(bubble.locator(".answer-diff-fix")).toHaveText("g");

  // Back off to "someth" and press again: "ing" is missing.
  await input.fill("someth");
  await hint.click();
  await expect(bubble.locator(".answer-diff-fix")).toHaveText("ing");

  // Now keep typing WITHOUT pressing again — the diff must stay live and
  // shrink, not clear (the bug: it used to vanish/freeze on the very next
  // keystroke).
  await input.pressSequentially("in");
  await expect(bubble.locator(".answer-diff-fix")).toHaveText("g");
});

test("fix 3: the reminder bubble hugs its own text below 1024, not the full card width", async ({
  page,
  request,
}) => {
  await seed(request, somethingLesson);
  await page.setViewportSize({ width: 930, height: 900 });
  await page.goto(`/practice?lesson=${somethingLesson.id}`);

  const hint = page.getByRole("button", { name: "Recuérdame" });
  await hint.click();
  const bubble = page.locator(".speaker-chip-bubble");
  const stageCard = page.locator(".stage-card");
  const bubbleBox = await bubble.boundingBox();
  const cardBox = await stageCard.boundingBox();
  expect(bubbleBox).not.toBeNull();
  expect(cardBox).not.toBeNull();
  // Hugs its text — well short of the card's full width.
  expect(bubbleBox!.width).toBeLessThan(cardBox!.width * 0.6);
  // Left edge still on the card's own left edge.
  expect(Math.abs(bubbleBox!.x - cardBox!.x)).toBeLessThanOrEqual(2);
});

test("a wrapping sentence keeps the ordinary 720-wide, left-aligned card", async ({
  page,
  request,
}) => {
  await seed(request, wrappingLesson);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/practice?lesson=${wrappingLesson.id}`);

  const stageCard = page.locator(".stage-card");
  await expect(stageCard).toHaveAttribute("data-wraps", "true");
  await expect(stageCard).toHaveAttribute("data-hero", "false");
  const box = await stageCard.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(600);

  // More than one piece — the active piece's red underline is back.
  const firstInput = page.locator(".stage-en-input").first();
  await firstInput.fill("I want");
  await firstInput.press("Tab");
  const activeEs = page.locator('.stage-es[data-state="active"]');
  await expect(activeEs).toHaveCSS("border-bottom-style", "solid");
});

test("the primary button is full width only below 640px, centred and capped from 640 up", async ({
  page,
  request,
}) => {
  await seed(request, oneLineLesson);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/practice?lesson=${oneLineLesson.id}`);
  const narrowButton = page.getByRole("button", { name: /Vamos a practicar/ });
  const narrowBox = await narrowButton.boundingBox();
  expect(narrowBox!.width).toBeGreaterThan(300);

  await page.setViewportSize({ width: 920, height: 900 });
  await page.goto(`/practice?lesson=${oneLineLesson.id}`);
  const wideButton = page.getByRole("button", { name: /Vamos a practicar/ });
  const wideBox = await wideButton.boundingBox();
  expect(wideBox!.width).toBeLessThanOrEqual(360);
  expect(wideBox!.width).toBeGreaterThanOrEqual(280);
  // Centred under the stage, not flush to an edge.
  const viewport = page.viewportSize()!;
  const centre = wideBox!.x + wideBox!.width / 2;
  expect(Math.abs(centre - viewport.width / 2)).toBeLessThan(4);
});

for (const width of [1440, 1880]) {
  test(`two-actor one-line card is centred on the PAGE axis at ${width}px, not the {speaker + card} group`, async ({
    page,
    request,
  }) => {
    // Owner screenshot at ~1880px: the two-actor row used to stretch
    // `.stage-column` to fill the row, which centred the SPANISH line on
    // that stretched column's own axis while the narrower, un-stretched
    // ENGLISH answer slot sat at the stretched column's left edge — two
    // axes for one card — and let the card itself run past 720px. Below
    // 1024 is unaffected; this is the 1280px+ two-actor composition only.
    await seed(request, oneLineLesson);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/practice?lesson=${oneLineLesson.id}`);

    const explanationCard = page.locator(".lesson-explanation");
    const explanationBox = await explanationCard.boundingBox();
    await page.getByRole("button", { name: /Vamos a practicar/ }).click();

    const card = page.locator(".stage-card");
    const cardBox = await card.boundingBox();
    const speaker = page.locator(".stage-speaker");
    const speakerBox = await speaker.boundingBox();
    const esBox = await page.locator(".stage-line-es").boundingBox();
    const enBox = await page.locator(".stage-line-en").boundingBox();

    const viewportCentre = width / 2;
    const cardCentre = cardBox!.x + cardBox!.width / 2;

    // The card sits on the page's own centre line — same axis as the
    // explanation card — independent of the speaker column's width.
    expect(Math.abs(cardCentre - viewportCentre)).toBeLessThanOrEqual(2);
    expect(
      Math.abs(explanationBox!.x + explanationBox!.width / 2 - cardCentre),
    ).toBeLessThanOrEqual(2);
    // Never wider than 720, however much room the viewport has to spare.
    expect(cardBox!.width).toBeLessThanOrEqual(720);
    // Both lines share the card's own centre (two axes -> one).
    expect(Math.abs(esBox!.x + esBox!.width / 2 - cardCentre)).toBeLessThanOrEqual(2);
    expect(Math.abs(enBox!.x + enBox!.width / 2 - cardCentre)).toBeLessThanOrEqual(2);
    // The speaker column hangs to the left, outside the axis, 32px from
    // the card's own left edge.
    expect(
      Math.abs(cardBox!.x - (speakerBox!.x + speakerBox!.width) - 32),
    ).toBeLessThanOrEqual(2);

    // Completing the piece must not move either line off that axis, or
    // the button out from under the card.
    const input = page.locator(".stage-en-input").first();
    await input.fill("hello");
    await page.waitForTimeout(300);
    const cardBox2 = await card.boundingBox();
    const cardCentre2 = cardBox2!.x + cardBox2!.width / 2;
    const enDoneBox = await page.locator(".stage-en-done").boundingBox();
    expect(
      Math.abs(enDoneBox!.x + enDoneBox!.width / 2 - cardCentre2),
    ).toBeLessThanOrEqual(2);
    const button = page.getByRole("button", { name: /Terminar/ });
    const buttonBox = await button.boundingBox();
    expect(
      Math.abs(buttonBox!.x + buttonBox!.width / 2 - cardCentre2),
    ).toBeLessThanOrEqual(2);
  });
}

test("the two-actor squeeze (1024-1279): a one-line card falls back to the stacked layout, never overlapping the speaker", async ({
  page,
  request,
}) => {
  await seed(request, oneLineLesson);
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.goto(`/practice?lesson=${oneLineLesson.id}`);
  await page.getByRole("button", { name: /Vamos a practicar/ }).click();

  const cardBox = await page.locator(".stage-card").boundingBox();
  const speakerBox = await page.locator(".stage-speaker").boundingBox();
  expect(cardBox).not.toBeNull();
  expect(speakerBox).not.toBeNull();
  // The speaker row sits entirely below the card (stacked), never beside
  // it overlapping — bottom of the card is at or above the top of the
  // speaker row.
  expect(speakerBox!.y).toBeGreaterThanOrEqual(cardBox!.y + cardBox!.height - 1);
});
