import { expect, test } from "./fixtures";

// Per-slide feedback (docs/backlog.md "Per-slide feedback",
// docs/engineering/feedback.md). Opens the shared sheet from the floating
// "Comentar" pill on a sentence slide, answers one piece correctly, reveals
// a hint once (Alt+H), then submits with POST /api/feedback mocked and
// checks the rich payload plus the thanks confirmation.
const feedbackLesson = {
  id: "lesson_ux_feedback",
  name: "UX feedback",
  concepts: [],
  blocks: [
    {
      id: "block_ux_feedback_sentence",
      type: "sentence" as const,
      promptLabel: "",
      promptText: "",
      helperText: "",
      answerFeedback: null,
      languageBlocks: [
        {
          id: "piece_1",
          spanish: "Quiero saber algo.",
          callout: null,
          acceptedAnswers: ["I want to know something."],
        },
      ],
    },
  ],
};

test("the floating feedback pill opens the sheet on a sentence slide and submits rich metadata", async ({
  page,
  request,
}) => {
  const courseResponse = await request.get("/api/admin/lesson-builder/lessons");
  const course = (await courseResponse.json()) as {
    modules: Array<{ id: string }>;
  };
  const putResponse = await request.put(
    `/api/admin/lesson-builder/lessons/${feedbackLesson.id}`,
    { data: { lesson: feedbackLesson, moduleId: course.modules[0].id } },
  );
  expect(putResponse.ok()).toBeTruthy();

  let capturedBody: Record<string, unknown> | null = null;
  await page.route("**/api/feedback", async (route) => {
    capturedBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto(`/practice?lesson=${feedbackLesson.id}`);

  const answerField = page.locator("[data-practice-answer]").first();
  await answerField.click();
  await answerField.press("Alt+h");
  await answerField.fill("I want to know something.");

  const pill = page.getByRole("button", { name: "Comentar" });
  await expect(pill).toBeVisible();
  await pill.click();

  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await expect(pill).not.toBeVisible();

  await sheet
    .getByPlaceholder("Cuéntame qué está mal o qué mejorarías.")
    .fill("El texto de este paso está mal escrito.");
  await sheet.getByRole("button", { name: "Enviar" }).click();

  await expect(sheet.getByText("¡Gracias! Anotado.")).toBeVisible();

  expect(capturedBody).not.toBeNull();
  const body = capturedBody!;
  expect(body.lessonId).toBe(feedbackLesson.id);
  expect(body.slideIndex).toBe(0);
  expect(body.slideKind).toBe("sentence");
  expect(body.slideCount).toBe(1);
  expect(body.message).toBe("El texto de este paso está mal escrito.");
  expect((body.slide as { pieces: unknown[] }).pieces).toBeTruthy();
  expect((body.answers as Array<{ correct: boolean }>)[0].correct).toBe(true);
  expect(body.hintsUsed).toBe(1);
  expect(body.viewport).toMatchObject({
    w: expect.any(Number),
    h: expect.any(Number),
  });

  // Auto-closes ~2s after the thanks state.
  await expect(sheet).not.toBeVisible({ timeout: 4000 });
});

test("choosing a kind chip sends it, and the honeypot stays empty for a real learner", async ({
  page,
  request,
}) => {
  const courseResponse = await request.get("/api/admin/lesson-builder/lessons");
  const course = (await courseResponse.json()) as {
    modules: Array<{ id: string }>;
  };
  const putResponse = await request.put(
    `/api/admin/lesson-builder/lessons/${feedbackLesson.id}`,
    { data: { lesson: feedbackLesson, moduleId: course.modules[0].id } },
  );
  expect(putResponse.ok()).toBeTruthy();

  let capturedBody: Record<string, unknown> | null = null;
  await page.route("**/api/feedback", async (route) => {
    capturedBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto(`/practice?lesson=${feedbackLesson.id}`);

  const pill = page.getByRole("button", { name: "Comentar" });
  await pill.click();

  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();

  const kindGroup = sheet.getByRole("radiogroup", { name: "Tipo de comentario (opcional)" });
  const praiseChip = kindGroup.getByRole("radio", { name: "Me gustó" });
  await praiseChip.click();
  await expect(praiseChip).toHaveAttribute("aria-checked", "true");

  await sheet
    .getByPlaceholder("Cuéntame qué está mal o qué mejorarías.")
    .fill("¡Me encantó esta lección!");
  await sheet.getByRole("button", { name: "Enviar" }).click();

  await expect(sheet.getByText("¡Gracias! Anotado.")).toBeVisible();

  expect(capturedBody).not.toBeNull();
  const body = capturedBody!;
  expect(body.kind).toBe("elogio");
  expect(body.website).toBe("");
});
