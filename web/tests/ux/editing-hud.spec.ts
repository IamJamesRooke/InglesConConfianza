import { test, expect } from "./fixtures";

// The editing HUD: a bottom-bar cheat sheet generated from KEYMAP, showing
// the chords live for whatever field/block/title has focus. See
// src/components/lesson-builder/editing-hud.tsx and
// docs/design/lesson-builder-editing-model.md §3.

async function waitForFocusedField(page: import("@playwright/test").Page, field: string) {
  await page.waitForFunction(
    (f) => (document.activeElement as HTMLElement | null)?.dataset.field === f,
    field,
  );
}

async function authorOneExplanationAndPair(page: import("@playwright/test").Page) {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });
  await page.keyboard.press("Control+Alt+l");
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("HUD check");
  await page.keyboard.press("Enter");
  await waitForFocusedField(page, "explanation");
  await page.keyboard.type("Hola es Hello.");
  await page.keyboard.press("Control+Alt+Enter");
  await waitForFocusedField(page, "spanish");
}

test.describe("editing HUD", () => {
  test("shows chords for a focused Spanish field", async ({ page }) => {
    await authorOneExplanationAndPair(page);
    const hud = page.locator(".editing-hud");
    await expect(hud).toBeVisible();
    await expect(hud).toContainText("Tab");
    await expect(hud).toContainText("Ctrl");
    await expect(hud).toContainText("Alt");
    await expect(hud).toContainText("Enter");
  });

  test("shows chords for a focused explanation field", async ({ page }) => {
    await page.goto("/admin/lesson-builder");
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });
    await page.keyboard.press("Control+Alt+l");
    const title = page.locator("[data-lesson-title]").last();
    await title.fill("HUD explanation check");
    await page.keyboard.press("Enter");
    await waitForFocusedField(page, "explanation");
    const hud = page.locator(".editing-hud");
    await expect(hud).toBeVisible();
    await expect(hud).toContainText("Ctrl");
    await expect(hud).toContainText("Alt");
    await expect(hud).toContainText("S");
  });

  test("hides after two Escapes deselect the block", async ({ page }) => {
    await authorOneExplanationAndPair(page);
    const hud = page.locator(".editing-hud");
    await expect(hud).toBeVisible();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(hud).toBeHidden();
  });

  test("Ctrl Alt ArrowDown across a module boundary keeps the title focused and the HUD visible", async ({
    page,
  }) => {
    // Regression for: moving a lesson down out of the last position of its
    // module crosses into the next module — the row unmounts from the old
    // module (only the active module's lessons render) and remounts fresh
    // in the new one. The old fix left `focusSelection`'s synchronous query
    // finding the about-to-be-removed row and "succeeding" on it, so
    // nothing ever focused the real, freshly-mounted title — selection fell
    // back to `none` and the HUD vanished.
    await page.goto("/admin/lesson-builder");
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Add module" }).click();
    await page.keyboard.press("Control+Alt+l");
    const title = page.locator("[data-lesson-title]").last();
    await title.fill("Crosses the boundary");
    const lessonId = await title.getAttribute("data-lesson-title");
    await page.getByRole("button", { name: "Add module" }).click();

    await title.focus();
    await expect(title).toBeFocused();
    await page.keyboard.press("Control+Alt+ArrowDown");

    const movedTitle = page.locator(`[data-lesson-title="${lessonId}"]`);
    await expect(movedTitle).toBeFocused();
    await expect(page.locator(".editing-hud")).toBeVisible();
  });

  test("stays a single line at 760px", async ({ page }) => {
    await authorOneExplanationAndPair(page);
    // Resize after authoring, not before — the module navigator's
    // sub-900px "Modules" disclosure hides the save-status text this
    // helper waits on to know the page has hydrated.
    await page.setViewportSize({ width: 760, height: 800 });
    const hud = page.locator(".editing-hud");
    await expect(hud).toBeVisible();
    const scrollHeight = await hud.evaluate((el) => el.scrollHeight);
    expect(scrollHeight).toBeLessThanOrEqual(40);
  });
});
