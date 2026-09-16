import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// "Add from Level…" (round 2, item B — docs/design/lesson-builder-round-2.md):
// a picker on the syllabus card that fills Main from the database instead of
// the owner re-typing a level by hand. Level 1 has ~100 rows in the real
// curriculum, so this spec only asserts a lower bound on the row count, not
// an exact one.

async function openSyllabus(page: Page) {
  await page.goto("/admin/lesson-builder");
  const header = page.locator(".syllabus-card-header").first();
  await expect(header).toBeVisible();
  if ((await header.getAttribute("aria-expanded")) !== "true") {
    await header.click();
  }
  const card = page.locator(".syllabus-card").first();
  await expect(card.locator(".syllabus-card-body")).toBeVisible();
  return card;
}

async function openPicker(page: Page, card: Locator) {
  await card.getByRole("button", { name: "Add from Level…" }).click();
  const popover = page.locator(".syllabus-fill-popover");
  await expect(popover).toBeVisible();
  await expect(popover.locator(".syllabus-fill-row").first()).toBeVisible({ timeout: 20_000 });
  return popover;
}

test("Level 1 lists rows grouped with eyebrows, and adding two fills Main", async ({ page }) => {
  test.setTimeout(120_000);
  const card = await openSyllabus(page);
  const summaryBefore = await card.locator(".syllabus-card-summary").innerText();
  const mainBefore = Number(summaryBefore.match(/Main (\d+)\/(\d+)/)?.[2] ?? "0");

  const popover = await openPicker(page, card);

  const rows = popover.locator(".syllabus-fill-row");
  expect(await rows.count()).toBeGreaterThanOrEqual(5);
  const eyebrows = popover.locator(".syllabus-pos-eyebrow");
  expect(await eyebrows.count()).toBeGreaterThan(0);

  // Select the first two rows in the list and add them to Main. Each row
  // carries the concept's own id (`data-syllabus-fill-row`), which is the
  // only reliable handle — Spanish/English text is too short to rule out
  // an unrelated row containing the same substring.
  await rows.nth(0).locator('input[type="checkbox"]').check();
  await rows.nth(1).locator('input[type="checkbox"]').check();
  const addedIds = await Promise.all(
    [0, 1].map((index) => rows.nth(index).getAttribute("data-syllabus-fill-row")),
  );

  const addButton = popover.getByRole("button", { name: "Add 2 to Main" });
  await expect(addButton).toBeVisible();
  await addButton.click();
  await expect(popover).toBeHidden();

  // Two new pills appear in Main, and the header count rose by 2.
  const summaryAfter = await card.locator(".syllabus-card-summary").innerText();
  const mainAfter = Number(summaryAfter.match(/Main (\d+)\/(\d+)/)?.[2] ?? "0");
  expect(mainAfter).toBe(mainBefore + 2);

  // Reopening the picker no longer lists the two just-added concepts.
  const popoverAgain = await openPicker(page, card);
  for (const id of addedIds) {
    if (id) await expect(popoverAgain.locator(`[data-syllabus-fill-row="${id}"]`)).toHaveCount(0);
  }
  await page.keyboard.press("Escape");
  await expect(popoverAgain).toBeHidden();

  // A second module's picker also excludes what the first module claimed
  // (course-wide exclusion, not per-module).
  await page.getByRole("button", { name: "Add module" }).click();
  const secondModuleRow = page.locator(".module-navigator-row").last();
  await secondModuleRow.click();
  const secondCard = await openSyllabus(page);
  const secondPopover = await openPicker(page, secondCard);
  for (const id of addedIds) {
    if (id) await expect(secondPopover.locator(`[data-syllabus-fill-row="${id}"]`)).toHaveCount(0);
  }
});

test("Escape closes the picker and returns focus to the trigger", async ({ page }) => {
  test.setTimeout(60_000);
  const card = await openSyllabus(page);
  const trigger = card.getByRole("button", { name: "Add from Level…" });
  await openPicker(page, card);
  await page.keyboard.press("Escape");
  await expect(page.locator(".syllabus-fill-popover")).toBeHidden();
  await expect(trigger).toBeFocused();
});
