import { expect, test } from "./fixtures";

// The "Covers" concept typeahead (LessonConceptsField): readable, non-alarming
// popover styling (see src/styles/lesson-builder/concepts.css) and correct
// keyboard behavior. Also covers the search route's ranking (see
// src/lib/lesson-builder/concept-search-rank.ts): an exact match on the typed
// text sorts first.
async function openLessonWithCoversField(page: import("@playwright/test").Page) {
  await page.goto("/admin/lesson-builder");
  await page.getByRole("button", { name: /^(Add|Create) lesson$/ }).first().click();
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("Typeahead smoke");
  const id = await title.getAttribute("data-lesson-title");
  await title.press("Enter");
  const row = page.locator(`[data-lesson-row="${id}"]`);
  const input = row.locator('[data-covers-for]');
  return { row, input };
}

for (const width of [760, 1280]) {
  test(`covers typeahead popover is readable at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const { input } = await openLessonWithCoversField(page);

    await input.click();
    await input.fill("if");
    const popover = page.locator(".concept-typeahead-popover");
    await expect(popover).toBeVisible();
    const options = popover.locator('[role="option"]');
    await expect(options).not.toHaveCount(0);

    // First option is the exact match ("if"), ranked ahead of longer
    // substring matches like "wife" or "to verify".
    await expect(
      options.first().locator(".concept-typeahead-option-english"),
    ).toHaveText("if");

    // No horizontal overflow.
    const overflow = await popover.evaluate(
      (el) => el.scrollWidth - el.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    // Rows never overlap.
    const rects = await options.evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom };
      }),
    );
    for (let i = 1; i < rects.length; i += 1) {
      expect(rects[i].top).toBeGreaterThanOrEqual(rects[i - 1].bottom - 1);
    }

    await page.screenshot({ path: testInfo.outputPath(`typeahead-${width}.png`) });
  });
}

test("arrow down + enter adds the highlighted concept as a chip", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const { row, input } = await openLessonWithCoversField(page);

  await input.click();
  await input.fill("if");
  const popover = page.locator(".concept-typeahead-popover");
  await expect(popover).toBeVisible();

  await input.press("ArrowDown");
  await input.press("Enter");

  await expect(popover).toBeHidden();
  await expect(row.locator(".lesson-concept-chip")).toContainText("if");
});

test("escape closes the popover and returns focus to the input", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const { input } = await openLessonWithCoversField(page);

  await input.click();
  await input.fill("if");
  const popover = page.locator(".concept-typeahead-popover");
  await expect(popover).toBeVisible();

  await input.press("Escape");
  await expect(popover).toBeHidden();
  await expect(input).toBeFocused();
});
