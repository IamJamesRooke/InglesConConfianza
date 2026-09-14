import { expect, test } from "./fixtures";

// Structure-only regression guard for the Lesson Builder shell: the sidebar
// (ModuleNavigator) is the sole module navigator, the sidebar shows no
// lesson-count badge, modules have no collapse chevron (lessons still do),
// and the document column's available width stays stable regardless of how
// much content the active module currently holds.

test("toolbar has no redundant jump/outline popup", async ({ page }) => {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText(/All changes saved|Loading/)).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Jump to a lesson" }),
  ).toHaveCount(0);
});

test("sidebar shows module names without a lesson-count badge", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  await page
    .getByRole("button", { name: /^(Add|Create) lesson/ })
    .first()
    .click();
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("UX smoke: structure badge check");
  await title.press("Enter");

  const moduleRow = page.locator(".module-navigator-row").first();
  await expect(moduleRow).toBeVisible();
  await expect(moduleRow).toContainText("Module 1");
  await expect(page.locator(".module-navigator-row-count")).toHaveCount(0);
});

test("modules have no collapse chevron, lessons keep theirs", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  await page
    .getByRole("button", { name: /^(Add|Create) lesson/ })
    .first()
    .click();
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("UX smoke: chevron scope");
  await title.press("Enter");

  await expect(
    page.getByRole("button", { name: "Collapse module" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Expand module" }),
  ).toHaveCount(0);

  const lessonCollapse = page.getByRole("button", { name: "Collapse lesson" });
  await expect(lessonCollapse).toHaveCount(1);
  await lessonCollapse.click();
  await expect(
    page.getByRole("button", { name: "Expand lesson" }),
  ).toHaveCount(1);
});

test("sidebar search still selects a module/lesson", async ({ page }) => {
  await page.goto("/admin/lesson-builder");
  await page
    .getByRole("button", { name: /^(Add|Create) lesson/ })
    .first()
    .click();
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("UX smoke: sidebar search target");
  const lessonId = await title.getAttribute("data-lesson-title");
  await title.press("Enter");

  const search = page.getByPlaceholder("Search lessons, phrases, or concepts…");
  await search.fill("sidebar search target");
  const result = page
    .locator(".module-navigator-results .module-navigator-result")
    .filter({ hasText: "sidebar search target" });
  await expect(result).toBeVisible();
  await result.click();
  await expect(
    page.locator(`[data-lesson-title="${lessonId}"]`),
  ).toHaveValue("UX smoke: sidebar search target");
});

test("document column width is stable across empty, short, and populated modules", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText(/All changes saved|Loading/)).toBeVisible();

  const documentColumn = page.locator(".lesson-library-modules");

  // Create and switch to a fresh, empty module — isolated from whatever
  // earlier tests left in module 1.
  await page.getByRole("button", { name: "Add module" }).click();
  const freshModuleRow = page.locator(".module-navigator-row").last();
  await freshModuleRow.click();

  const emptyBox = await documentColumn.boundingBox();
  expect(emptyBox).not.toBeNull();

  // Populate it with a lesson (long content).
  await page.getByRole("button", { name: /^(Add|Create) lesson/ }).click();
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("UX smoke: width stability, a fairly long lesson title");
  await title.press("Enter");

  const populatedBox = await documentColumn.boundingBox();
  expect(populatedBox).not.toBeNull();

  // Collapse the lesson down to just its header row (short content).
  await page.getByRole("button", { name: "Collapse lesson" }).last().click();
  const collapsedBox = await documentColumn.boundingBox();
  expect(collapsedBox).not.toBeNull();

  // Add a second, separate empty module and switch to it.
  await page.getByRole("button", { name: "Add module" }).click();
  const secondModuleRow = page.locator(".module-navigator-row").last();
  await secondModuleRow.click();
  const secondEmptyBox = await documentColumn.boundingBox();
  expect(secondEmptyBox).not.toBeNull();

  const widths = [
    emptyBox!.width,
    populatedBox!.width,
    collapsedBox!.width,
    secondEmptyBox!.width,
  ];
  const max = Math.max(...widths);
  const min = Math.min(...widths);
  // All four states share the same available column width — well within a
  // scrollbar-width tolerance, not shrink-to-fit around current content.
  expect(max - min).toBeLessThan(4);
});
