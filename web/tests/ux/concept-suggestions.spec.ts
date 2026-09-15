import { expect, test } from "./fixtures";

// Auto-Covers (E5, see docs/design/lesson-builder-rebuild.md): a lesson whose
// pairs already name a curriculum concept ("querer" / "to want", "hoy" /
// "today") should offer it as a one-keystroke "Covers" suggestion instead of
// making the teacher re-type it. See concept-suggestions.ts
// (extractLessonPairTerms / matchPairTermsToConcepts) and the
// /api/admin/curriculum/concepts/suggest route.

async function openLessonWithPairs(
  page: import("@playwright/test").Page,
  pairs: Array<[string, string]> = [
    ["querer", "to want"],
    ["hoy", "today"],
  ],
) {
  await page.goto("/admin/lesson-builder");
  await page.getByRole("button", { name: /^(Add|Create) lesson$/ }).first().click();
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("Auto-covers smoke");
  const id = await title.getAttribute("data-lesson-title");
  await title.press("Enter");

  const row = page.locator(`[data-lesson-row="${id}"]`);
  const tail = row.locator(".lesson-document-tail");
  await tail.hover();
  await tail.getByRole("button", { name: "Sentence — Insert at lesson end" }).click();

  const sentence = row.locator(".lesson-document-sentence").last();

  for (const [index, [spanish, english]] of pairs.entries()) {
    if (index > 0) await sentence.getByRole("button", { name: "Add pair" }).click();
    const spanishField = sentence.locator('textarea[data-field="spanish"]').nth(index);
    const englishField = sentence.locator('textarea[data-field="english"]').nth(index);
    await spanishField.fill(spanish);
    await englishField.fill(english);
    if (index === pairs.length - 1) await englishField.blur();
  }

  // Covers (Phase 3b) is a quiet line at rest — the suggestion chips only
  // mount once it's expanded (click/focus), same as the tagged chips.
  await row.locator("[data-covers-summary]").click();
  const coversInput = row.locator("[data-covers-for]");
  return { row, coversInput };
}

test("pairs already naming a concept surface as one-keystroke Covers suggestions", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 760, height: 900 });
  const { row, coversInput } = await openLessonWithPairs(page);

  // The suggest fetch is debounced 800ms after the pairs settle.
  const suggestions = row.locator(".is-pair-suggestion");
  await expect(suggestions).not.toHaveCount(0, { timeout: 5000 });
  const count = await suggestions.count();
  expect(count).toBeGreaterThanOrEqual(2);

  const labels = await suggestions.allTextContents();
  expect(labels.some((label) => /want/i.test(label))).toBe(true);
  expect(labels.some((label) => /today/i.test(label))).toBe(true);

  await page.screenshot({ path: testInfo.outputPath("covers-suggested-760.png") });

  // Ctrl+Enter on the Covers input accepts every visible suggestion at once.
  await coversInput.click();
  await coversInput.press("Control+Enter");
  await expect(suggestions).toHaveCount(0);
  const tagged = row.locator(".lesson-concept-chip:not(.is-pair-suggestion)");
  const taggedLabels = await tagged.allTextContents();
  expect(taggedLabels.some((label) => /want/i.test(label))).toBe(true);
  expect(taggedLabels.some((label) => /today/i.test(label))).toBe(true);
});

// Owner report (2026-09-15): "I want to do something today." suggested
// "to have [something] repaired", "stuff", "anything", "I mean" — loose
// substring/prefix hits on "something"/"algo"/"I". Whole-term matching
// (concept-suggestions.ts) must never surface "repaired" for this lesson.
test("owner-report lesson never suggests a loose substring/prefix hit like 'repaired'", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const { row } = await openLessonWithPairs(page, [
    ["quiero", "I want"],
    ["hacer", "to do"],
    ["algo", "something"],
    ["hoy", "today"],
  ]);

  const suggestions = row.locator(".is-pair-suggestion");
  await expect(suggestions).not.toHaveCount(0, { timeout: 5000 });

  const labels = await suggestions.allTextContents();
  expect(labels.some((label) => /repaired/i.test(label))).toBe(false);
});

test("dismissing a suggestion sticks for the rest of the session, not for the lesson data", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const { row } = await openLessonWithPairs(page);

  const suggestions = row.locator(".is-pair-suggestion");
  await expect(suggestions).not.toHaveCount(0, { timeout: 5000 });
  const before = await suggestions.count();

  const first = suggestions.first();
  const dismissedLabel = await first.textContent();
  await first.focus();
  await first.press("Backspace");
  await expect(suggestions).toHaveCount(before - 1);

  await page.reload();
  // Covers (Phase 3b) collapses to its quiet line again on reload — expand
  // it before checking suggestions.
  await row.locator("[data-covers-summary]").click();
  const suggestionsAfterReload = row.locator(".is-pair-suggestion");
  await expect(suggestionsAfterReload).not.toHaveCount(0, { timeout: 5000 });
  const labelsAfterReload = await suggestionsAfterReload.allTextContents();
  expect(labelsAfterReload).not.toContain(dismissedLabel);
});
