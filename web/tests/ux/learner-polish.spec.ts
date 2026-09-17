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

  // Tab on a wrong/incomplete answer must not advance past it — it speaks
  // the answer through the speaker and keeps focus in place instead of
  // letting the learner skip an unanswered row. There is no lightbulb and no
  // amber hint field any more (owner, 2026-09-17): the answer appears in the
  // speaker's bubble, and the field is left exactly as the learner left it.
  await page.keyboard.press("Tab");
  await expect(inputs.nth(1)).toBeFocused();
  await expect(page.locator(".answer-diff")).toHaveCount(0);
  await expect(page.locator(".speaker-chip-bubble")).toContainText(
    "to really want to do something important",
  );
  await expect(inputs.nth(1)).toHaveValue("");
  await expect(page.locator(".answer-hint-toggle")).toHaveCount(0);

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
  await expect(page.locator(".lesson-celebration")).toBeVisible();
  await expect(page.locator(".completion-cta")).toBeVisible();
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
  const step = page.locator(".lesson-top-progress");
  await expect(input).toBeFocused();
  await expect(step).toHaveAttribute("value", "1");

  for (const key of ["ArrowLeft", "ArrowRight"]) {
    await page.keyboard.press(key);
    await expect(input).toBeFocused();
    await expect(step).toHaveAttribute("value", "1");
  }

  // Arrows never drive slide navigation even outside a text field.
  await page.getByRole("button", { name: "Paso anterior" }).focus();
  for (const key of ["ArrowLeft", "ArrowRight"]) {
    await page.keyboard.press(key);
    await expect(step).toHaveAttribute("value", "1");
  }
  await input.focus();

  const bubble = page.locator(".speaker-chip-bubble");
  await input.dispatchEvent("keydown", {
    key: "Enter",
    code: "Enter",
    isComposing: true,
    bubbles: true,
  });
  await expect(bubble).toHaveCount(0);
  await expect(step).toHaveAttribute("value", "1");

  // Help (Enter, Tab or Alt+H on an unanswered piece) shows the answer in the
  // speaker's bubble and never fills the field in (owner, 2026-09-17).
  await input.fill("to");
  // The ordinary sentence slide is the L2b stage card, not the old grid of
  // `.answer-piece` blocks — asking for help must not resize it.
  const card = page.locator(".stage-card");
  const heightBeforeHint = (await card.boundingBox())!.height;
  await input.press("Enter");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("to");
  await expect(bubble).toBeVisible();
  expect(Math.abs((await card.boundingBox())!.height - heightBeforeHint)).toBeLessThan(
    2,
  );
  await expect(step).toHaveAttribute("value", "1");

  await input.fill("to d");
  await input.press("Tab");
  // Tab must not advance past a wrong/incomplete answer to the next block —
  // it gives the answer through the speaker and keeps focus right here.
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("to d");

  await input.focus();
  await input.fill("partial attempt");
  // dispatchEvent, not click(): back now sits 24px from the left edge of the
  // footer (owner, 2026-09-17), which in a dev build is exactly where Next's
  // own dev-indicator portal sits and swallows synthetic pointer events. The
  // portal does not exist in a production build.
  await page
    .getByRole("button", { name: "Paso anterior" })
    .dispatchEvent("click");
  await page.getByRole("button", { name: /Vamos a practicar/ }).click();
  await expect(input).toHaveValue("partial attempt");

  const cleanup = await request.delete(
    `/api/admin/lesson-builder/lessons/${keyboardLesson.id}`,
  );
  expect(cleanup.ok()).toBeTruthy();
});

function moduleCompletionLesson(id: string, spanish: string, answer: string) {
  return {
    id,
    name: id,
    concepts: [],
    blocks: [
      {
        id: `${id}_block`,
        type: "sentence" as const,
        promptLabel: "",
        promptText: "",
        helperText: "",
        answerFeedback: null,
        languageBlocks: [
          {
            id: `${id}_lang`,
            spanish,
            callout: null,
            acceptedAnswers: [answer],
          },
        ],
      },
    ],
  };
}

test("with every lesson in a module already complete, reopening an earlier one still hands off to the next — only the last lesson shows the module list", async ({
  page,
  request,
}) => {
  const courseResponse = await request.get("/api/admin/lesson-builder/lessons");
  const course = (await courseResponse.json()) as {
    modules: Array<{ id: string }>;
  };
  const moduleId = course.modules[0].id;

  const lessons = [
    moduleCompletionLesson("lesson_mc_1", "uno", "one"),
    moduleCompletionLesson("lesson_mc_2", "dos", "two"),
    moduleCompletionLesson("lesson_mc_3", "tres", "three"),
    moduleCompletionLesson("lesson_mc_4", "cuatro", "four"),
  ];
  for (const lesson of lessons) {
    const response = await request.put(
      `/api/admin/lesson-builder/lessons/${lesson.id}`,
      { data: { lesson, moduleId } },
    );
    expect(response.ok()).toBeTruthy();
  }

  // Mark every lesson in the module complete directly in localStorage —
  // the bug this reproduces only shows up once every lesson is done.
  await page.goto("/");
  await page.evaluate((ids: string[]) => {
    const completedAt = new Date().toISOString();
    const progress = Object.fromEntries(
      ids.map((id) => [id, { completedAt }]),
    );
    window.localStorage.setItem("icc.lessonProgress.v1", JSON.stringify(progress));
  }, lessons.map((lesson) => lesson.id));

  // Reopening lesson 1 (not the module's last lesson) must show the next
  // lesson card, not the module-end list, even though every lesson —
  // including the ones after it — is already complete.
  await page.goto(`/practice?lesson=${lessons[0].id}`);
  await expect(page.locator(".lesson-celebration")).toBeVisible();
  await expect(page.getByText("Siguiente", { exact: true })).toBeVisible();
  await expect(page.getByText("Lo que ya puedes decir")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Siguiente lección" }),
  ).toBeVisible();

  // The module's actual last lesson gets the module-end list and "Volver
  // al inicio" instead.
  await page.goto(`/practice?lesson=${lessons[3].id}`);
  await expect(page.locator(".lesson-celebration")).toBeVisible();
  await expect(page.getByText("Lo que ya puedes decir")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Volver al inicio" }),
  ).toBeVisible();

  for (const lesson of lessons) {
    const response = await request.delete(
      `/api/admin/lesson-builder/lessons/${lesson.id}`,
    );
    expect(response.ok()).toBeTruthy();
  }
});

// Owner screenshot, 2026-09-17 (practice completion at ~910x800): the page
// was wider than the viewport — the header's mute icon clipped at the right
// edge, the completion stack pinned left instead of centred. Nothing on a
// learner screen may scroll sideways, and the completion stack must stay a
// centred 720 column at every width above the phone.
const OVERFLOW_WIDTHS = [
  { width: 390, height: 844 },
  { width: 768, height: 900 },
  { width: 910, height: 800 },
  { width: 1280, height: 900 },
];

test("no learner screen scrolls sideways, and the completion stack stays a centred column", async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const courseResponse = await request.get("/api/admin/lesson-builder/lessons");
  const course = (await courseResponse.json()) as {
    modules: Array<{ id: string }>;
  };
  const moduleId = course.modules[0].id;
  const lessons = [
    moduleCompletionLesson("lesson_ov_1", "uno", "one"),
    moduleCompletionLesson("lesson_ov_2", "dos", "two"),
  ];
  for (const lesson of lessons) {
    const response = await request.put(
      `/api/admin/lesson-builder/lessons/${lesson.id}`,
      { data: { lesson, moduleId } },
    );
    expect(response.ok()).toBeTruthy();
  }

  await page.goto("/");
  await page.evaluate((ids: string[]) => {
    const completedAt = new Date().toISOString();
    window.localStorage.setItem(
      "icc.lessonProgress.v1",
      JSON.stringify(Object.fromEntries(ids.map((id) => [id, { completedAt }]))),
    );
  }, lessons.map((lesson) => lesson.id));

  for (const size of OVERFLOW_WIDTHS) {
    await page.setViewportSize(size);

    // A slide (the sentence stage) and both completion views.
    await page.goto(`/practice?lesson=${lessons[0].id}`);
    await page.locator(".lesson-celebration").waitFor();
    await expectNoSidewaysScroll(page, `completion-next @ ${size.width}`);
    await expectCentredCompletion(page, size.width);

    await page.goto(`/practice?lesson=${lessons[1].id}`);
    await page.locator(".lesson-celebration").waitFor();
    await expectNoSidewaysScroll(page, `completion-module @ ${size.width}`);
    await expectCentredCompletion(page, size.width);

    await page.goto("/");
    await page.locator(".course-home").waitFor();
    await expectNoSidewaysScroll(page, `home @ ${size.width}`);
  }

  for (const lesson of lessons) {
    const response = await request.delete(
      `/api/admin/lesson-builder/lessons/${lesson.id}`,
    );
    expect(response.ok()).toBeTruthy();
  }
});

async function expectNoSidewaysScroll(
  page: import("@playwright/test").Page,
  label: string,
) {
  const measured = await page.evaluate(() => {
    const innerWidth = window.innerWidth;
    const offenders: string[] = [];
    for (const element of Array.from(document.querySelectorAll("*"))) {
      const box = element.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) continue;
      if (box.right > innerWidth + 0.5 || box.left < -0.5) {
        const className =
          typeof element.className === "string" ? element.className : "";
        offenders.push(`${element.tagName.toLowerCase()}.${className.trim()}`);
      }
    }
    return {
      innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offenders: offenders.slice(0, 5),
    };
  });
  expect(
    measured.scrollWidth,
    `${label}: scrollWidth ${measured.scrollWidth} > innerWidth ${measured.innerWidth}; offenders: ${measured.offenders.join(", ")}`,
  ).toBeLessThanOrEqual(measured.innerWidth);
}

async function expectCentredCompletion(
  page: import("@playwright/test").Page,
  width: number,
) {
  const stack = await page.locator(".lesson-celebration").boundingBox();
  expect(stack).not.toBeNull();
  expect(stack!.width).toBeLessThanOrEqual(720);
  if (width >= 768) {
    expect(Math.abs(stack!.x - (width - stack!.width) / 2)).toBeLessThanOrEqual(2);
  }
}
