import { expect, test } from "./fixtures";

// The "Edit concept" popover (concept-quick-edit.tsx) is a `createPortal`
// dialog rendered outside every wrapper's own DOM subtree. Two independent
// blur handlers used to mistake "focus moved into that portal" for "focus
// left the wrapper": `LessonConceptsField`'s `collapseIfFocusLeft` (a
// Covers pill) and `lesson-library.tsx`'s document-level `focusout`
// listener (any pill anywhere in the builder, including a module's
// Syllabus card, since that listener drives the shared editing selection
// and can run `leaveSlide`). Both now go through the shared
// `isFocusStillInside` predicate (focus.ts), and the popover itself
// returns focus to its trigger pill on every close path.

test("Covers pill: clicking into the popover's English field keeps it open; Cancel returns focus to the pill", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

  await page.keyboard.press("Control+Alt+l");
  const title = page.locator("[data-lesson-title]").last();
  await expect(title).toBeFocused();
  await title.fill("Concept quick-edit smoke");
  const lessonId = await title.getAttribute("data-lesson-title");
  await title.press("Enter");
  const row = page.locator(`[data-lesson-row="${lessonId}"]`);

  // Expand Covers and tag one real concept so its chip carries a
  // ConceptQuickEdit trigger (a freehand chip has no curriculum row to edit).
  await row.locator("[data-covers-summary]").click();
  const coversInput = row.locator("[data-covers-for]");
  await coversInput.click();
  await coversInput.fill("if");
  const coversPopover = page.locator(".concept-typeahead-popover");
  await expect(coversPopover).toBeVisible();
  await expect(coversPopover.locator('[role="option"]')).not.toHaveCount(0);
  await coversInput.press("ArrowDown");
  await coversInput.press("Enter");

  const trigger = row.locator(".lesson-concept-chip .lesson-concept-label").first();
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Edit concept" });
  await expect(dialog).toBeVisible();

  const english = dialog.getByLabel("English", { exact: true });
  await english.click();
  await english.press("End");
  await page.keyboard.type("!");

  // The bug: this click/type used to close the popover outright (the
  // Covers wrapper's blur handler saw the portal field as "focus left" and
  // collapsed, unmounting the chip and the popover with it).
  await expect(dialog).toBeVisible();
  await expect(english).toHaveValue(/!$/);

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("Syllabus pill: clicking into the popover's English field keeps it open, and the open lesson's slide survives", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

  // An open lesson with real content in its active slide — if the
  // library-level focusout ever mistakes the popover for "focus left the
  // slide" again, `leaveSlide` has nothing to delete here (the slide isn't
  // empty), but the selection getting stomped is the same root cause this
  // spec is guarding against.
  await page.keyboard.press("Control+Alt+l");
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("Syllabus pill smoke");
  await title.press("Enter");
  await page.waitForFunction(
    () => (document.activeElement as HTMLElement | null)?.dataset.field === "explanation",
  );
  await page.keyboard.type("Hola.");

  const syllabusHeader = page.locator(".syllabus-card-header").first();
  await syllabusHeader.click();
  const syllabusBody = page.locator(".syllabus-card-body");
  await expect(syllabusBody).toBeVisible();

  const idsBefore = await syllabusBody
    .locator("[data-syllabus-chip]")
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-syllabus-chip")));

  const addInput = syllabusBody.getByPlaceholder("Add concept…").first();
  await addInput.click();
  await addInput.fill("if");
  const addPopover = page.locator(".concept-typeahead-popover");
  await expect(addPopover).toBeVisible();
  await expect(addPopover.locator('[role="option"]')).not.toHaveCount(0);
  await addInput.press("ArrowDown");
  await addInput.press("Enter");

  await expect
    .poll(() =>
      syllabusBody
        .locator("[data-syllabus-chip]")
        .evaluateAll((els) => els.map((el) => el.getAttribute("data-syllabus-chip"))),
    )
    .toHaveLength(idsBefore.length + 1);
  const idsAfter = await syllabusBody
    .locator("[data-syllabus-chip]")
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-syllabus-chip")));
  const newId = idsAfter.find((id) => !idsBefore.includes(id));
  const trigger = syllabusBody.locator(`[data-syllabus-chip="${newId}"] .lesson-concept-label`);
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Edit concept" });
  await expect(dialog).toBeVisible();

  const english = dialog.getByLabel("English", { exact: true });
  await english.click();
  await english.press("End");
  await page.keyboard.type("!");
  await expect(dialog).toBeVisible();
  await expect(english).toHaveValue(/!$/);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  // The other lesson's active slide was never a real blur target — its
  // content must not have been wiped by a spurious `leaveSlide`.
  await expect(page.getByText("Slide deleted")).toHaveCount(0);
  await expect(page.locator('[data-field="explanation"]', { hasText: "Hola." })).toBeVisible();
});
