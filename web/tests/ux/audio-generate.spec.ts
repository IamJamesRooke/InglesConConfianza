import { expect, test } from "./fixtures";

// Audio generation from the builder (docs/design/speech.md "Generating
// clips"): the module header's "Generate audio" icon POSTs
// /api/admin/audio/generate for each lesson in the module and reports the
// summed result inline for a few seconds. The API call itself is mocked
// here — this only checks the button's request/response wiring, not real
// TTS generation.
test("module header 'Generate audio' button reports the generated/skipped count", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText(/All changes saved|Loading/)).toBeVisible();

  // One lesson in the module, so exactly one POST fires and the mocked
  // response is the button's whole reported total.
  await page
    .getByRole("button", { name: /^(Add|Create) lesson$/ })
    .first()
    .click();
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("UX smoke: audio generate");
  await title.press("Enter");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });

  await page.route("**/api/admin/audio/generate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        generated: 3,
        skipped: 2,
        bytes: 12345,
        missingKey: false,
      }),
    });
  });

  await page
    .getByRole("button", { name: "Generate missing audio for this module" })
    .click();

  await expect(page.getByText("Generated 3 clips (2 already present)")).toBeVisible();
});
