import { expect, test } from "./fixtures";

// Product-vision §7 items 1, 2, 5 (docs/design/product-vision.md): a module's
// learner-facing description and Draft/Published + Free/Premium pills in the
// blue module header, a per-lesson Draft toggle, and server-side filtering
// of draft modules/lessons from `/` and `/practice`.

async function waitForFocusedField(page: import("@playwright/test").Page, field: string) {
  await page.waitForFunction(
    (f) => (document.activeElement as HTMLElement | null)?.dataset.field === f,
    field,
  );
}

test.describe("module and lesson metadata", () => {
  test("(a) typing a module description and reloading keeps it", async ({ page }) => {
    await page.goto("/admin/lesson-builder");
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

    const description = page.getByPlaceholder("What will the learner be able to say?");
    await description.fill("Al terminar puedes decir lo que quieres.");
    await description.blur();
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });

    await page.reload();
    await expect(
      page.getByPlaceholder("What will the learner be able to say?"),
    ).toHaveValue("Al terminar puedes decir lo que quieres.");
  });

  test("(b) toggling Draft on a module hides it from /", async ({ page }) => {
    await page.goto("/admin/lesson-builder");
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

    // Module 1 gets a real lesson so the course has published content once
    // module 2 is drafted away.
    const moduleNameInput = page.getByLabel("Module 1 name");
    await moduleNameInput.fill("Confianza I");
    // The module name field is `data-keymap-ignore` (like the search box) —
    // the global chord dispatcher never sees keys typed there, so a
    // following `Ctrl+Alt+L` needs focus moved off it first.
    await moduleNameInput.blur();
    await page.keyboard.press("Control+Alt+l");
    const title = page.locator("[data-lesson-title]").last();
    await expect(title).toBeFocused();
    await title.fill("Quiero");
    await page.keyboard.press("Control+Alt+d");
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });

    await page.getByLabel("Add module").click();
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });
    await page.locator(".module-navigator-row", { hasText: "Module 2" }).click();
    await page.getByLabel(/Module \d name/).fill("Confianza III");
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });

    // The pill defaults to "Published" — click it to flip to "Draft".
    await page.getByRole("button", { name: "Published", exact: true }).click();
    await expect(page.getByRole("button", { name: "Draft", exact: true })).toBeVisible();
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });

    await page.goto("/");
    await expect(page.getByText("Confianza I").first()).toBeVisible();
    await expect(page.getByText("Confianza III")).toHaveCount(0);
  });

  test("(c) toggling Draft on a lesson hides it from / and /practice?lesson= redirects", async ({
    page,
  }) => {
    await page.goto("/admin/lesson-builder");
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

    await page.keyboard.press("Control+Alt+l");
    const title = page.locator("[data-lesson-title]").last();
    await expect(title).toBeFocused();
    await title.fill("Quiero");
    await page.keyboard.press("Enter");
    await waitForFocusedField(page, "explanation");
    // Deliberately no [[es:]]/[[en:]] marks here — marked adjacent pairs
    // would trigger E3's pair-proposal pre-fill on the next sentence slide
    // (pair-proposals.ts) and land focus on the English field instead of a
    // fresh empty Spanish one.
    await page.keyboard.type("Let's practice.");
    await page.keyboard.press("Control+Alt+Enter");
    await waitForFocusedField(page, "spanish");
    await page.keyboard.type("Quiero ir.");
    await page.keyboard.press("Tab");
    await waitForFocusedField(page, "english");
    await page.keyboard.type("I want to go.");

    const lessonId = await title.getAttribute("data-lesson-title");
    if (!lessonId) throw new Error("lesson id missing");

    await page.keyboard.press("Control+Alt+d");
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Mark as draft" }).click();
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });

    await page.goto(`/practice?lesson=${lessonId}`);
    await expect(page).toHaveURL("/");
  });

  test("screenshots: module header at 1280 and 760 wide", async ({ page }) => {
    await page.goto("/admin/lesson-builder");
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });
    await page.getByLabel("Module 1 name").fill("Confianza I");
    await page
      .getByPlaceholder("What will the learner be able to say?")
      .fill("Al terminar puedes decir lo que quieres.");
    await page.getByPlaceholder("What will the learner be able to say?").blur();
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });

    const header = page.locator(".lesson-library-module-meta").first();

    await page.setViewportSize({ width: 1280, height: 900 });
    await header.screenshot({ path: "test-results/module-header-1280.png" });

    await page.setViewportSize({ width: 760, height: 900 });
    await header.screenshot({ path: "test-results/module-header-760.png" });
  });
});
