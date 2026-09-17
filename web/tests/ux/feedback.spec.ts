import { expect, test } from "./fixtures";

// Per-slide feedback (docs/backlog.md "Per-slide feedback",
// docs/engineering/feedback.md). Opens the shared sheet from the practice
// footer's "¿Algo que corregir?" trigger, submits with POST /api/feedback
// mocked, and checks the request body plus the thanks confirmation.
const feedbackLesson = {
  id: "lesson_ux_feedback",
  name: "UX feedback",
  concepts: [],
  blocks: [
    {
      id: "block_ux_feedback_explanation",
      type: "explanation" as const,
      contentMarkdown: "Say hello.",
    },
  ],
};

test("the practice footer's feedback trigger opens the sheet, submits, and shows the thanks state", async ({
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

  const trigger = page.getByRole("button", { name: "¿Algo que corregir?" });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();

  await sheet
    .getByPlaceholder("Cuéntame qué está mal o qué mejorarías.")
    .fill("El texto de este paso está mal escrito.");
  await sheet.getByRole("button", { name: "Enviar" }).click();

  await expect(sheet.getByText("¡Gracias! Anotado.")).toBeVisible();

  expect(capturedBody).not.toBeNull();
  expect(capturedBody!.lessonId).toBe(feedbackLesson.id);
  expect(capturedBody!.slideIndex).toBe(0);
  expect(capturedBody!.slideKind).toBe("explanation");
  expect(capturedBody!.message).toBe("El texto de este paso está mal escrito.");

  // Auto-closes ~2s after the thanks state.
  await expect(sheet).not.toBeVisible({ timeout: 4000 });
});
