import { expect, test } from "./fixtures";

// The practice stage animates a shake on a wrong answer, a fill on a correct
// one, a drift on slide transitions, and a spring pop on the completion
// seal. A learner with prefers-reduced-motion:reduce must get none of that
// motion — see the blanket kill-switch at the bottom of
// practice-responsive-overrides.css.

const lesson = {
  id: "lesson_ux_reduced_motion",
  name: "UX reduced motion",
  concepts: [],
  blocks: [
    {
      id: "block_ux_reduced_motion_explain",
      type: "explanation" as const,
      contentMarkdown: "Reduced motion check.",
    },
    {
      id: "block_ux_reduced_motion_answer",
      type: "sentence" as const,
      promptLabel: "",
      promptText: "",
      helperText: "",
      answerFeedback: null,
      languageBlocks: [
        {
          id: "lang_ux_reduced_motion",
          spanish: "hacer",
          callout: null,
          acceptedAnswers: ["to do"],
        },
      ],
    },
  ],
};

test("reduced motion disables the stage's shake, fill, drift, and seal animations", async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  const courseResponse = await request.get(
    "/api/admin/lesson-builder/lessons",
  );
  const course = (await courseResponse.json()) as {
    modules: Array<{ id: string }>;
  };
  const response = await request.put(
    `/api/admin/lesson-builder/lessons/${lesson.id}`,
    { data: { lesson, moduleId: course.modules[0].id } },
  );
  expect(response.ok()).toBeTruthy();

  await page.goto(`/practice?lesson=${lesson.id}`);
  const explanation = page.locator(".lesson-explanation.stage-enter");
  await expect(explanation).toBeVisible();
  expect(
    await explanation.evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");

  await page.getByRole("button", { name: /Vamos a practicar/ }).click();
  const input = page.getByRole("textbox", { name: "Traducción de hacer" });
  await expect(input).toBeVisible();
  const piece = input.locator(
    "xpath=ancestor::*[contains(@class, 'answer-piece')]",
  );

  // A wrong, non-empty answer would normally shake the blank.
  await input.fill("to see");
  await input.press("Enter");
  await expect(piece).toHaveClass(/shake/);
  expect(
    await piece.evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");

  // A correct answer fills the underline instead of just recoloring.
  await input.fill("to do");
  await expect(piece).toHaveClass(/correct/);
  const fillAfter = await piece.evaluate((el) => {
    const after = getComputedStyle(el, "::after");
    return { transition: after.transitionDuration, width: after.width };
  });
  expect(fillAfter.transition).toBe("0s");

  await page.getByRole("button", { name: "Terminar lección" }).click();
  const seal = page.locator(".completion-seal");
  await expect(seal).toBeVisible();
  expect(
    await seal.evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");

  const cleanup = await request.delete(
    `/api/admin/lesson-builder/lessons/${lesson.id}`,
  );
  expect(cleanup.ok()).toBeTruthy();
});
