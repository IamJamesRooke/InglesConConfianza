import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

const vocabularyLesson = {
  id: "lesson_ux_vocabulary_table",
  name: "UX vocabulary table",
  concepts: [],
  blocks: [
    {
      id: "block_ux_vocabulary_table",
      type: "sentence" as const,
      layout: "vocabulary_table" as const,
      promptLabel: "Vocabulario",
      promptText: "Translate each vocabulary row.",
      helperText: "Legacy helper text must remain stored but not render.",
      answerFeedback: "Legacy after-correct feedback must not render.",
      languageBlocks: [
        {
          id: "lang_ux_vocabulary_1",
          spanish: "hacer",
          callout: null,
          acceptedAnswers: ["to do"],
        },
        {
          id: "lang_ux_vocabulary_2",
          spanish: "tener muchas ganas de hacer algo importante",
          callout: null,
          acceptedAnswers: ["to really want to do something important"],
        },
        {
          id: "lang_ux_vocabulary_3",
          spanish: "poder",
          callout: "Capacidad o posibilidad",
          acceptedAnswers: ["to be able"],
        },
        {
          id: "lang_ux_vocabulary_4",
          spanish: "hacerlo",
          callout: null,
          acceptedAnswers: ["to do it"],
        },
      ],
    },
  ],
};

const ordinaryLesson = {
  id: "lesson_ux_ordinary_sentence",
  name: "UX ordinary sentence",
  concepts: [],
  blocks: [
    {
      id: "block_ux_ordinary_sentence",
      type: "sentence" as const,
      promptLabel: "Forma la oración",
      promptText: "",
      helperText: "",
      answerFeedback: null,
      languageBlocks: [
        {
          id: "lang_ux_ordinary_1",
          spanish: "quiero",
          callout: null,
          acceptedAnswers: ["I want"],
        },
        {
          id: "lang_ux_ordinary_2",
          spanish: "hacerlo",
          callout: null,
          acceptedAnswers: ["to do it"],
        },
      ],
    },
  ],
};

const keyboardLesson = {
  id: "lesson_ux_keyboard_answers",
  name: "UX keyboard answers",
  concepts: [],
  blocks: [
    {
      id: "block_ux_keyboard_intro",
      type: "explanation" as const,
      contentMarkdown: "Translate the next word.",
    },
    {
      id: "block_ux_keyboard_answer",
      type: "sentence" as const,
      promptLabel: "",
      promptText: "",
      helperText: "",
      answerFeedback: null,
      languageBlocks: [
        {
          id: "lang_ux_keyboard_answer",
          spanish: "hacer",
          callout: null,
          acceptedAnswers: ["to do"],
        },
      ],
    },
    {
      id: "block_ux_keyboard_outro",
      type: "explanation" as const,
      contentMarkdown: "Keep going.",
    },
  ],
};

test("vocabulary rows stay compact through completion and ordinary sentences remain unchanged", async ({
  page,
  request,
}) => {
  test.setTimeout(45_000);
  const courseResponse = await request.get("/api/admin/lesson-builder/lessons");
  expect(courseResponse.ok()).toBeTruthy();
  const course = (await courseResponse.json()) as {
    modules: Array<{ id: string }>;
  };
  const moduleId = course.modules[0].id;

  for (const lesson of [ordinaryLesson, vocabularyLesson]) {
    const response = await request.put(
      `/api/admin/lesson-builder/lessons/${lesson.id}`,
      { data: { lesson, moduleId } },
    );
    expect(response.ok()).toBeTruthy();
  }

  // A normal builder save must carry the deprecated value through unchanged
  // even though its authoring control has been retired.
  await page.goto("/admin/lesson-builder");
  const vocabularyRow = page.locator(
    `[data-lesson-row="${vocabularyLesson.id}"]`,
  );
  await expect(vocabularyRow.getByText("+ help on request")).toHaveCount(0);
  await expect(vocabularyRow.getByText("+ after-correct message")).toHaveCount(
    0,
  );
  await vocabularyRow
    .locator("[data-lesson-title]")
    .fill("UX vocabulary table saved");
  await page.keyboard.press("Control+s");
  await expect(page.getByText("All changes saved")).toBeVisible();
  const storedResponse = await request.get("/api/admin/lesson-builder/lessons");
  const storedCourse = (await storedResponse.json()) as {
    lessons: Array<{
      id: string;
      blocks: Array<{ helperText?: string; answerFeedback?: string | null }>;
    }>;
  };
  expect(
    storedCourse.lessons.find((lesson) => lesson.id === vocabularyLesson.id)
      ?.blocks[0].helperText,
  ).toBe("Legacy helper text must remain stored but not render.");
  expect(
    storedCourse.lessons.find((lesson) => lesson.id === vocabularyLesson.id)
      ?.blocks[0].answerFeedback,
  ).toBe("Legacy after-correct feedback must not render.");

  await page.goto(`/practice?lesson=${vocabularyLesson.id}`);
  const table = page.locator(".vocabulary-practice .answer-grid");
  const rows = table.locator(".answer-piece");
  await expect(rows).toHaveCount(4);
  await expect(page.locator(".sentence-helper")).toHaveCount(0);
  await expect(page.locator(".sentence-authored-feedback")).toHaveCount(0);
  await expect(page.getByText("Translate each vocabulary row.")).toBeVisible();
  expect(
    await rows.first().evaluate((row) => getComputedStyle(row).display),
  ).toBe("grid");
  expect((await table.boundingBox())!.height).toBeLessThan(420);

  const inputs = table.locator("[data-practice-answer]");
  const firstRowHeight = (await rows.first().boundingBox())!.height;
  await inputs.nth(0).fill("to do");
  await expect(rows.nth(0)).toHaveClass(/correct/);
  await expect(inputs.nth(1)).toBeFocused();
  await page.waitForTimeout(200);
  expect(
    Math.abs((await rows.first().boundingBox())!.height - firstRowHeight),
  ).toBeLessThan(2);
  expect(
    await inputs
      .nth(0)
      .evaluate((input) => getComputedStyle(input).borderTopColor),
  ).toBe("rgba(0, 0, 0, 0)");

  // Tab on a wrong/incomplete answer must not advance past it — it reveals
  // the hint diff and keeps focus in place instead of letting the learner
  // skip an unanswered row.
  await page.keyboard.press("Tab");
  await expect(inputs.nth(1)).toBeFocused();
  await expect(page.locator(".answer-diff")).toBeVisible();
  // The row's mouse-reachable hint button is still available directly.
  const help = page.getByRole("button", {
    name: /Mostrar la respuesta de tener muchas ganas/,
  });
  await expect(help).toHaveCount(0); // hidden while the hint diff is showing

  await inputs.nth(1).fill("to really want to do something important");
  await inputs.nth(2).fill("to be able");
  await inputs.nth(3).fill("to do it");
  await expect(rows).toHaveClass([/correct/, /correct/, /correct/, /correct/]);
  await expect(page.locator(".sentence-success")).toBeVisible();
  await expect(
    page.getByText("Legacy after-correct feedback must not render."),
  ).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(rows.nth(3).locator(".answer-completed-text")).toBeVisible();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: "/tmp/vocabulary-table-after.png",
    fullPage: true,
  });

  const vocabularyAccessibility = await new AxeBuilder({ page })
    .include(".lesson-session")
    .analyze();
  expect(
    vocabularyAccessibility.violations.filter(
      (violation) =>
        violation.impact === "critical" || violation.impact === "serious",
    ),
  ).toEqual([]);

  await page.getByRole("button", { name: "Terminar lección" }).click();
  await expect(
    page.getByText("Lección completada", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".completion-actions")
      .getByRole("button", { name: "Volver a mis lecciones" }),
  ).toBeVisible();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: "/tmp/lesson-completion-after.png",
    fullPage: true,
  });
  const completionAccessibility = await new AxeBuilder({ page })
    .include(".lesson-session")
    .analyze();
  expect(
    completionAccessibility.violations.filter(
      (violation) =>
        violation.impact === "critical" || violation.impact === "serious",
    ),
  ).toEqual([]);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/practice?lesson=${vocabularyLesson.id}`);
  await inputs.nth(0).fill("to do");
  await expect(inputs.nth(1)).toBeFocused();
  await page.waitForTimeout(300);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await rows
      .nth(1)
      .evaluate((row) => getComputedStyle(row).gridTemplateColumns),
  ).not.toContain(" ");
  await page.screenshot({
    path: "/tmp/vocabulary-table-narrow-after.png",
    fullPage: true,
  });
  await inputs.nth(1).fill("to really want to do something important");
  await inputs.nth(2).fill("to be able");
  await inputs.nth(3).fill("to do it");
  await page.getByRole("button", { name: "Terminar lección" }).click();
  await page.waitForTimeout(300);
  expect(
    await page.evaluate(() => ({
      fits: document.documentElement.scrollWidth <= innerWidth,
      scrollX,
    })),
  ).toEqual({ fits: true, scrollX: 0 });
  await page.screenshot({
    path: "/tmp/lesson-completion-narrow-after.png",
    fullPage: true,
  });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`/practice?lesson=${ordinaryLesson.id}`);
  const ordinaryPiece = page
    .locator(".sentence-practice:not(.vocabulary-practice) .answer-piece")
    .first();
  await expect(ordinaryPiece).toBeVisible();
  expect(
    await ordinaryPiece.evaluate((row) => getComputedStyle(row).display),
  ).not.toBe("grid");

  for (const lesson of [vocabularyLesson, ordinaryLesson]) {
    const response = await request.delete(
      `/api/admin/lesson-builder/lessons/${lesson.id}`,
    );
    expect(response.ok()).toBeTruthy();
  }
});

test("learner answer keys reveal help without navigation, focus theft, or lost drafts", async ({
  page,
  request,
}) => {
  const courseResponse = await request.get("/api/admin/lesson-builder/lessons");
  const course = (await courseResponse.json()) as {
    modules: Array<{ id: string }>;
  };
  const response = await request.put(
    `/api/admin/lesson-builder/lessons/${keyboardLesson.id}`,
    { data: { lesson: keyboardLesson, moduleId: course.modules[0].id } },
  );
  expect(response.ok()).toBeTruthy();

  await page.goto(`/practice?lesson=${keyboardLesson.id}`);
  await page.getByRole("button", { name: /Vamos a practicar/ }).click();
  const input = page.getByRole("textbox", { name: "Traducción de hacer" });
  const step = page.locator(".lesson-step-count");
  await expect(input).toBeFocused();
  await expect(step).toContainText("2");

  for (const key of ["ArrowLeft", "ArrowRight"]) {
    await page.keyboard.press(key);
    await expect(input).toBeFocused();
    await expect(step).toContainText("2");
  }

  // Arrows never drive slide navigation even outside a text field.
  await page.getByRole("button", { name: "Paso anterior" }).focus();
  for (const key of ["ArrowLeft", "ArrowRight"]) {
    await page.keyboard.press(key);
    await expect(step).toContainText("2");
  }
  await input.focus();

  await input.dispatchEvent("keydown", {
    key: "Enter",
    code: "Enter",
    isComposing: true,
    bubbles: true,
  });
  await expect(input).not.toHaveClass(/showing-hint/);
  await expect(step).toContainText("2");

  await input.fill("to");
  const piece = input.locator("xpath=ancestor::*[contains(@class, 'answer-piece')]");
  const heightBeforeHint = (await piece.boundingBox())!.height;
  await input.press("Enter");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("to");
  await expect(input).toHaveClass(/showing-hint/);
  expect(Math.abs((await piece.boundingBox())!.height - heightBeforeHint)).toBeLessThan(
    2,
  );
  await expect(step).toContainText("2");

  await input.fill("to d");
  await expect(input).not.toHaveClass(/showing-hint/);
  await input.press("Tab");
  await expect(input).toHaveClass(/showing-hint/);
  // Tab must not advance past a wrong/incomplete answer to the next block —
  // it reveals the hint and keeps focus right here.
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("to d");

  await input.focus();
  await input.fill("partial attempt");
  await page.getByRole("button", { name: "Paso anterior" }).click();
  await page.getByRole("button", { name: /Vamos a practicar/ }).click();
  await expect(input).toHaveValue("partial attempt");

  const cleanup = await request.delete(
    `/api/admin/lesson-builder/lessons/${keyboardLesson.id}`,
  );
  expect(cleanup.ok()).toBeTruthy();
});
