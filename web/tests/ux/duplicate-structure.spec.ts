import { expect, test } from "./fixtures";
import { readFileSync } from "node:fs";

import { uxCheckLessonsPath } from "../../playwright.config";

// E7 "New lesson like this one": builds a small lesson with all three slide
// types (explanation, sentence, vocabulary table) via keyboard, duplicates
// its *structure* (mouse — no chord for this action), and checks the new
// lesson landed right after the source with the same slide-type sequence,
// every slide emptied, and the title focused. Then verifies the design
// doc's placeholder rule directly: typing into the new lesson's first
// (entered) slide and finishing keeps that content, while the two
// untouched placeholder slides survive `leaveSlide`'s empty-slide pruning
// because they were never entered.

type LessonRecord = {
  id: string;
  name: string | null;
  concepts: unknown[];
  blocks: Array<{
    type: string;
    layout?: string;
    contentMarkdown?: string;
    languageBlocks?: Array<{
      id: string;
      spanish: string;
      callout: string | null;
      acceptedAnswers: string[];
    }>;
  }>;
};

function pieces(lesson: LessonRecord, blockIndex: number) {
  return lesson.blocks[blockIndex].languageBlocks!.map(
    ({ spanish, callout, acceptedAnswers }) => ({
      spanish,
      callout,
      acceptedAnswers,
    }),
  );
}

function readLessons(): { lessons: LessonRecord[] } {
  let raw: string;
  try {
    raw = readFileSync(uxCheckLessonsPath, "utf8");
  } catch {
    return { lessons: [] };
  }
  return JSON.parse(raw) as { lessons: LessonRecord[] };
}

async function waitForFocusedField(
  page: import("@playwright/test").Page,
  field: string,
) {
  await page.waitForFunction(
    (f) => (document.activeElement as HTMLElement | null)?.dataset.field === f,
    field,
  );
}

test("duplicate structure copies the slide-type sequence, emptied, and preserves untouched placeholders", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText(/All changes saved|Loading/)).toBeVisible();

  const before = readLessons();
  const beforeCount = before.lessons.length;

  // Build the source lesson: explanation, sentence, vocabulary table.
  await page
    .getByRole("button", { name: /^(Add|Create) lesson$/ })
    .first()
    .click();
  const sourceTitle = page.locator("[data-lesson-title]").last();
  await sourceTitle.fill("UX smoke: structure source");
  await sourceTitle.press("Enter");

  // Explanation slide (auto-created by title Enter).
  await page.keyboard.type("Some notes for the class.");

  // Sentence slide: predicted type after an explanation.
  await page.keyboard.press("Control+Alt+Enter");
  await waitForFocusedField(page, "spanish");
  await page.keyboard.type("hola");
  await page.keyboard.press("Tab");
  await waitForFocusedField(page, "english");
  await page.keyboard.type("hello");

  // Vocabulary table slide: predicted type after a sentence is an
  // explanation; two more quick Ctrl+Alt+Enter presses cycle the still-empty
  // just-inserted block explanation -> sentence -> vocabulary_table.
  await page.keyboard.press("Control+Alt+Enter");
  await page.keyboard.press("Control+Alt+Enter");
  await page.keyboard.press("Control+Alt+Enter");
  await waitForFocusedField(page, "spanish");
  await page.keyboard.type("gato");
  await page.keyboard.press("Tab");
  await waitForFocusedField(page, "english");
  await page.keyboard.type("cat");

  await page.keyboard.press("Control+Alt+d");
  await page.keyboard.press("Control+s");
  await expect(page.getByText("All changes saved")).toBeVisible({
    timeout: 5000,
  });

  const afterCreate = readLessons();
  const source = afterCreate.lessons.find(
    (l) => l.name === "UX smoke: structure source",
  );
  expect(source, "source lesson should be persisted").toBeTruthy();
  expect(source!.blocks.map((b) => b.layout ?? b.type)).toEqual([
    "explanation",
    "sentence",
    "vocabulary_table",
  ]);

  // Duplicate structure — mouse only, no chord.
  const sourceRow = page.locator(`[data-lesson-row="${source!.id}"]`);
  await sourceRow.getByRole("button", { name: "Duplicate structure" }).click();

  // New row lands right after the source, and its title is focused.
  const newTitle = page.locator("[data-lesson-title]");
  await expect(newTitle.nth(0)).toHaveValue("UX smoke: structure source");
  await expect(newTitle.nth(1)).toBeFocused();

  await expect
    .poll(() => readLessons().lessons.length)
    .toBe(beforeCount + 2);

  const afterDuplicate = readLessons();
  const sourceIndex = afterDuplicate.lessons.findIndex(
    (l) => l.id === source!.id,
  );
  const duplicate = afterDuplicate.lessons[sourceIndex + 1];
  expect(duplicate, "duplicate should land immediately after the source").toBeTruthy();
  expect(duplicate.name).toBeNull();
  expect(duplicate.concepts).toEqual([]);

  // Same slide-type sequence, same layout, every slide emptied.
  expect(duplicate.blocks.map((b) => b.layout ?? b.type)).toEqual([
    "explanation",
    "sentence",
    "vocabulary_table",
  ]);
  expect(duplicate.blocks[0].contentMarkdown).toBe("");
  expect(pieces(duplicate, 1)).toEqual([
    { spanish: "", callout: null, acceptedAnswers: [""] },
  ]);
  expect(pieces(duplicate, 2)).toEqual([
    { spanish: "", callout: null, acceptedAnswers: [""] },
  ]);
  // Fresh ids, not reused from the source.
  const sourceBlockIds = source!.blocks.map((b) => (b as { id?: string }).id);
  const duplicateBlockIds = duplicate.blocks.map(
    (b) => (b as { id?: string }).id,
  );
  expect(duplicateBlockIds).not.toEqual(sourceBlockIds);

  // Enter the new lesson's first (already-focused-into) slide, type into it,
  // and finish — the placeholder rule: an entered-then-filled slide keeps
  // its content, and the two placeholders we never entered survive intact.
  await newTitle.nth(1).press("Enter");
  await waitForFocusedField(page, "explanation");
  await page.keyboard.type("Filled in by the teacher.");
  await page.keyboard.press("Control+Alt+d");
  await page.keyboard.press("Control+s");
  await expect(page.getByText("All changes saved")).toBeVisible({
    timeout: 5000,
  });

  const afterFill = readLessons();
  const filled = afterFill.lessons.find((l) => l.id === duplicate.id)!;
  expect(filled.blocks.map((b) => b.layout ?? b.type)).toEqual([
    "explanation",
    "sentence",
    "vocabulary_table",
  ]);
  expect(filled.blocks[0].contentMarkdown).toBe("Filled in by the teacher.");
  expect(pieces(filled, 1)).toEqual([
    { spanish: "", callout: null, acceptedAnswers: [""] },
  ]);
  expect(pieces(filled, 2)).toEqual([
    { spanish: "", callout: null, acceptedAnswers: [""] },
  ]);

  // Clean up both lessons so the fixture data stays clean.
  for (const id of [duplicate.id, source!.id]) {
    const row = page.locator(`[data-lesson-row="${id}"]`);
    await row.locator("[data-lesson-delete-trigger]").click();
    await row.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(row).toHaveCount(0);
  }
  await expect.poll(() => readLessons().lessons.length).toBe(beforeCount);
});
