import { expect, test } from "./fixtures";

// The "Covers" concept typeahead (LessonConceptsField): readable, non-alarming
// popover styling (see src/styles/lesson-builder/lesson-concepts-field.css) and correct
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

// Owner, 2026-09-17: while writing slides nothing guesses — Enter with
// nothing explicitly arrowed-to only links a concept when the typed text is
// an exact match for a loaded result's own Spanish label; that's not a
// guess, since the teacher typed the concept's own word. A linked pill
// stacks the English target over the Spanish label (ConceptPillLabel), so
// asserting the English line proves it's linked, not freehand.
test("typing an exact concept label + Enter with nothing highlighted adds a LINKED pill", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const { row, input } = await openLessonWithCoversField(page);

  await input.click();
  await input.fill("algo");
  const popover = page.locator(".concept-typeahead-popover");
  await expect(popover.locator('[role="option"]')).not.toHaveCount(0);

  await input.press("Enter");

  await expect(popover).toBeHidden();
  const chip = row.locator(".lesson-concept-chip").last();
  await expect(chip).not.toHaveClass(/is-freehand/);
  await expect(chip.locator(".lesson-concept-pill-en")).toBeVisible();
});

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

test("repeated ArrowDown scrolls the active option into view within the popover", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const { input } = await openLessonWithCoversField(page);

  await input.click();
  await input.fill("querer");
  const popover = page.locator(".concept-typeahead-popover");
  await expect(popover).toBeVisible();
  const options = popover.locator('[role="option"]');
  await expect(options.nth(7)).toBeAttached({ timeout: 5000 });

  for (let i = 0; i < 8; i += 1) {
    await input.press("ArrowDown");
  }

  const active = popover.locator('[aria-selected="true"]');
  await expect(active).toHaveCount(1);
  const activeBox = await active.boundingBox();
  const popoverBox = await popover.boundingBox();
  expect(activeBox).not.toBeNull();
  expect(popoverBox).not.toBeNull();
  if (activeBox && popoverBox) {
    expect(activeBox.y).toBeGreaterThanOrEqual(popoverBox.y - 1);
    expect(activeBox.y + activeBox.height).toBeLessThanOrEqual(popoverBox.y + popoverBox.height + 1);
  }
});

test("backspace on an empty field focuses the last chip; a second backspace removes it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const { row, input } = await openLessonWithCoversField(page);

  await input.click();
  await input.fill("if");
  const popover = page.locator(".concept-typeahead-popover");
  await expect(popover.locator('[role="option"]')).not.toHaveCount(0);
  await input.press("ArrowDown");
  await input.press("Enter");
  const chip = row.locator(".lesson-concept-chip");
  await expect(chip).toHaveCount(1);

  // First Backspace: nothing is deleted, the chip takes focus.
  await input.press("Backspace");
  await expect(chip).toHaveCount(1);
  await expect(chip).toBeFocused();

  // Second Backspace, on the chip itself, removes it.
  await page.keyboard.press("Backspace");
  await expect(chip).toHaveCount(0);
});

test("a conjugated form ('estoy') offers its infinitive concept ('estar…') via the example sentence", async ({ page }) => {
  // Concepts are stored as infinitives ("estar [en un lugar]"), but a teacher
  // types the conjugated form she's about to teach ("estoy"), which never
  // appears in the label — only in the concept's own example sentence
  // ("Estoy cansado."). Verified read-only against the curriculum DB before
  // writing this test: "estar [en un estado]" (Unranked) has example_spanish
  // "Estoy cansado.", so "estoy" must surface a Spanish-label option starting
  // with "estar".
  await page.setViewportSize({ width: 1280, height: 900 });
  const { input } = await openLessonWithCoversField(page);

  await input.click();
  await input.fill("estoy");
  const popover = page.locator(".concept-typeahead-popover");
  await expect(popover).toBeVisible();

  const infinitiveOption = popover
    .locator(".concept-typeahead-option-spanish")
    .filter({ hasText: /^estar\b/ })
    .first();
  await expect(infinitiveOption).toBeVisible();
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

test("a short exact query ('ser') surfaces the generic row first despite hundreds of substring hits", async ({ page }) => {
  // "ser" is a substring of servir, conservar, "user"… — more than the SQL
  // candidate pool holds. The pool is ordered exact-then-prefix first so the
  // generic "ser → to be" row can never be truncated away (owner, 2026-09-16).
  await page.setViewportSize({ width: 1280, height: 900 });
  const { input } = await openLessonWithCoversField(page);
  await input.click();
  await input.fill("ser");
  const first = page.locator(".concept-typeahead-popover [role=option]").first();
  await expect(first).toBeVisible();
  await expect(first.locator(".concept-typeahead-option-spanish")).toHaveText("ser");
});
