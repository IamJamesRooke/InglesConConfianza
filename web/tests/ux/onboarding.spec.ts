import { expect, test } from "./fixtures";
import type { APIRequestContext } from "@playwright/test";

// Onboarding, phase 1 (docs/design/onboarding.md): a pinned first "Onboarding"
// module, a learner-side gate that sends a first-time visitor to /bienvenida,
// no close button / no completion screen between its lessons, a whole-course
// progress bar, and a footer replay link. Seeded through the admin API (the
// isolated store the `isolatedLessonStore` fixture resets before every test).

const onboardingLesson1 = {
  id: "lesson_ob_1",
  name: "Hola",
  concepts: [],
  blocks: [
    {
      id: "block_ob_1a",
      type: "explanation" as const,
      contentMarkdown: "Hola, bienvenido a Inglés con Confianza.",
    },
  ],
};

const onboardingLesson2 = {
  id: "lesson_ob_2",
  name: "Tu nombre",
  concepts: [],
  blocks: [
    {
      id: "block_ob_2a",
      type: "explanation" as const,
      contentMarkdown: "Aprenderás inglés paso a paso.",
    },
  ],
};

const courseLesson1 = {
  id: "lesson_course_1",
  name: null,
  concepts: [],
  blocks: [
    {
      id: "block_course_1a",
      type: "explanation" as const,
      contentMarkdown: "Vamos a empezar la primera lección.",
    },
  ],
};

function buildFile(onboardingStatus: "published" | "draft" = "published") {
  return {
    version: 2 as const,
    modules: [
      {
        id: "m_onboarding",
        name: "Onboarding",
        kind: "onboarding" as const,
        status: onboardingStatus,
        lessonIds: [onboardingLesson1.id, onboardingLesson2.id],
      },
      {
        id: "m_course",
        name: "Confianza I",
        lessonIds: [courseLesson1.id],
      },
    ],
    lessons: [onboardingLesson1, onboardingLesson2, courseLesson1],
  };
}

async function seed(
  request: APIRequestContext,
  onboardingStatus: "published" | "draft" = "published",
) {
  const response = await request.put("/api/admin/lesson-builder/import-export", {
    data: buildFile(onboardingStatus),
  });
  expect(response.ok()).toBeTruthy();
}

async function finishCurrentOnboardingSlide(page: import("@playwright/test").Page) {
  await page
    .locator('button:has-text("Terminar lección"):visible, button:has-text("Continuar"):visible')
    .first()
    .click();
}

test.describe("onboarding gate and flow", () => {
  test("(a) a fresh visit redirects to /bienvenida; no close button; Escape does not exit", async ({
    page,
    request,
  }) => {
    await seed(request);
    await page.goto("/");
    await expect(page).toHaveURL(/\/bienvenida$/);
    await expect(page.getByText("Hola, bienvenido a Inglés con Confianza.")).toBeVisible();
    await expect(page.getByLabel("Volver a mis lecciones")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/bienvenida$/);
    await expect(page.getByText("Hola, bienvenido a Inglés con Confianza.")).toBeVisible();
  });

  test("(b) finishing onboarding lesson 1 opens lesson 2 directly, no completion screen, progress advances", async ({
    page,
    request,
  }) => {
    await seed(request);
    await page.goto("/bienvenida");
    await expect(page.getByText("Hola, bienvenido a Inglés con Confianza.")).toBeVisible();
    const progressBefore = await page.locator(".lesson-top-progress").getAttribute("value");

    await finishCurrentOnboardingSlide(page);

    await expect(page.getByText("Aprenderás inglés paso a paso.")).toBeVisible();
    await expect(page.locator(".lesson-celebration")).toHaveCount(0);
    const progressAfter = await page.locator(".lesson-top-progress").getAttribute("value");
    expect(Number(progressAfter)).toBeGreaterThan(Number(progressBefore));
  });

  test("(c) finishing the last onboarding lesson lands on /, survives reload, and only the course lesson is on the path (Lección 1)", async ({
    page,
    request,
  }) => {
    await seed(request);
    await page.goto("/bienvenida");
    await finishCurrentOnboardingSlide(page); // lesson 1 -> lesson 2
    await expect(page.getByText("Aprenderás inglés paso a paso.")).toBeVisible();
    await finishCurrentOnboardingSlide(page); // lesson 2 -> home

    await expect(page).toHaveURL(/\/$/);
    await page.reload();
    await expect(page).toHaveURL(/\/$/);

    const rows = page.locator(".path-row");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Lección 1");
  });

  test("(d) the footer replay link opens onboarding with a close button and changes no flags", async ({
    page,
    request,
  }) => {
    await seed(request);
    await page.goto("/bienvenida");
    await finishCurrentOnboardingSlide(page);
    await finishCurrentOnboardingSlide(page);
    await expect(page).toHaveURL(/\/$/);

    const before = await page.evaluate(() => localStorage.getItem("icc.onboarding.v1"));
    await page.getByRole("link", { name: "Ver la introducción otra vez" }).click();
    await expect(page).toHaveURL(/\/bienvenida\?repasar=1/);
    await expect(page.getByLabel("Volver a mis lecciones")).toBeVisible();
    const after = await page.evaluate(() => localStorage.getItem("icc.onboarding.v1"));
    expect(after).toBe(before);
  });

  test("(e) Reiniciar todo el progreso resets onboarding too", async ({ page, request }) => {
    await seed(request);
    await page.goto("/bienvenida");
    await finishCurrentOnboardingSlide(page);
    await finishCurrentOnboardingSlide(page);
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole("button", { name: "Reiniciar todo el progreso" }).click();
    await page.getByRole("button", { name: /¿Seguro\?/ }).click();

    await page.reload();
    await expect(page).toHaveURL(/\/bienvenida$/);
  });

  test("(f) drafting the onboarding module turns the gate off", async ({ page, request }) => {
    await seed(request, "draft");
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("onboarding in the builder", () => {
  test("(g) the onboarding slot is pinned first, undraggable, and offers Add onboarding when absent", async ({
    page,
  }) => {
    await page.goto("/admin/lesson-builder");
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

    const addOnboarding = page.getByRole("button", { name: "Add onboarding" });
    await expect(addOnboarding).toBeVisible();
    await addOnboarding.click();
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });

    const onboardingRow = page.locator(".module-navigator-onboarding-row");
    await expect(onboardingRow).toBeVisible();
    await expect(onboardingRow.locator(".module-navigator-row-drag")).toHaveCount(0);
    // A second click never creates a duplicate — the slot is singular.
    await expect(page.getByRole("button", { name: "Add onboarding" })).toHaveCount(0);

    await onboardingRow.click();
    await expect(page.getByRole("button", { name: "Draft", exact: true })).toBeVisible();
    // Onboarding is always free — no Free/Premium toggle in its header.
    await expect(page.getByRole("button", { name: "Free", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Premium", exact: true })).toHaveCount(0);
  });
});
