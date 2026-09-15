import { expect, test } from "./fixtures";

// E5b — curriculum autocomplete in pair fields
// (docs/design/lesson-builder-rebuild.md E5). Typing ≥2 characters in a
// sentence pair's Spanish (or English) field, after a short pause, offers
// up to 5 matching curriculum concepts in a popover; Tab/Enter accepts one,
// filling this field and (when empty) the other, then moves focus to the
// other field. Escape closes the popover only.

async function waitForFocusedField(page: import("@playwright/test").Page, field: string) {
  await page.waitForFunction(
    (f) => (document.activeElement as HTMLElement | null)?.dataset.field === f,
    field,
  );
}

test("Spanish/English pair-field autocomplete: popover, Tab-accept, Escape-closes-only", async ({
  page,
}, testInfo) => {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

  await page.keyboard.press("Control+Alt+l");
  const title = page.locator("[data-lesson-title]").last();
  await expect(title).toBeFocused();
  await title.fill("Querer");
  await page.keyboard.press("Enter");
  await waitForFocusedField(page, "explanation");
  // Predicted type after a fresh empty explanation is a sentence.
  await page.keyboard.press("Control+Alt+Enter");
  await waitForFocusedField(page, "spanish");

  const pair = page.locator(".lesson-document-pair").first();
  const spanish = pair.locator("[data-field='spanish']");
  const english = pair.locator("[data-field='english']");
  const popover = pair.locator(".concept-typeahead-popover");

  // Resize after authoring, not before — see pair-proposals.spec.ts.
  await page.setViewportSize({ width: 760, height: 900 });
  await spanish.pressSequentially("quer");
  await expect(popover).toBeVisible({ timeout: 2000 });
  await expect(
    popover.locator(".concept-typeahead-option-english", { hasText: "querer" }).first(),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("autocomplete-760.png"), fullPage: true });

  // Escape closes the popover only — the field stays focused/selected, no
  // slide-level Escape fires.
  await page.keyboard.press("Escape");
  await expect(popover).toBeHidden();
  await waitForFocusedField(page, "spanish");

  // Re-trigger the popover (the value must change for the debounced search
  // effect to refire) and accept the first completion with Tab.
  await spanish.pressSequentially("e");
  await expect(popover).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Tab");

  await waitForFocusedField(page, "english");
  await expect(spanish).not.toHaveValue("");
  await expect(english).not.toHaveValue("");
  await expect(spanish).toHaveValue(/querer/i);

  // The same completion, roles reversed, on the English field.
  await english.fill("");
  await english.pressSequentially("to wa");
  await expect(popover).toBeVisible({ timeout: 2000 });
  await expect(popover.locator(".concept-typeahead-option")).not.toHaveCount(0);
});
