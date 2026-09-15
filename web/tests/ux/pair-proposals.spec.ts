import { readFileSync } from "node:fs";

import { uxCheckLessonsPath } from "../../playwright.config";
import { expect, test } from "./fixtures";

// E3 — practice pairs proposed from the explanation
// (docs/design/lesson-builder-rebuild.md E3). An explanation with an
// `[[es:X]] es [[en:Y]]` mark (E1 auto-marks this the moment the teacher
// types the terminator) already is the practice content: inserting a
// sentence slide right after it pre-fills the pair instead of leaving an
// empty one to retype.

type SavedLessonBlock =
  | { type: "explanation"; contentMarkdown: string }
  | {
      type: "sentence";
      layout?: "sentence" | "vocabulary_table";
      languageBlocks: Array<{ spanish: string; acceptedAnswers: string[]; callout: string | null }>;
    };

function readLessons() {
  try {
    return JSON.parse(readFileSync(uxCheckLessonsPath, "utf8")) as {
      lessons: Array<{ id: string; name: string | null; blocks: SavedLessonBlock[] }>;
    };
  } catch {
    return { lessons: [] };
  }
}

function lastLesson() {
  const lessons = readLessons().lessons;
  return lessons[lessons.length - 1];
}

async function waitForFocusedField(page: import("@playwright/test").Page, field: string) {
  await page.waitForFunction(
    (f) => (document.activeElement as HTMLElement | null)?.dataset.field === f,
    field,
  );
}

test("a sentence slide inserted after an explanation proposes its adjacent pair, focused on English", async ({
  page,
}, testInfo) => {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

  await page.keyboard.press("Control+Alt+l");
  const title = page.locator("[data-lesson-title]").last();
  await expect(title).toBeFocused();
  await title.fill("Quiero");
  await page.keyboard.press("Enter");
  await waitForFocusedField(page, "explanation");
  await page.keyboard.type("quiero es I want.");

  // Predicted type after an explanation is a sentence — one press.
  await page.keyboard.press("Control+Alt+Enter");
  await waitForFocusedField(page, "english");

  const firstPair = page.locator(".lesson-document-pair").first();
  await expect(firstPair.locator("[data-field='spanish']")).toHaveValue("quiero");
  await expect(firstPair.locator("[data-field='english']")).toHaveValue("I want");
  // Resize after authoring, not before — the module navigator's sub-900px
  // "Modules" disclosure would otherwise hide the save-status text this
  // test still checks below — resize back immediately after the shot.
  await page.setViewportSize({ width: 760, height: 900 });
  await page.screenshot({ path: testInfo.outputPath("proposals-760.png"), fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });

  // Enter in a (complete) last pair's English field creates a new, empty
  // pair and focuses its Spanish field — same as any other completed pair.
  await page.keyboard.press("Enter");
  await waitForFocusedField(page, "spanish");
  const pairs = page.locator(".lesson-document-pair");
  await expect(pairs).toHaveCount(2);

  // Escape (from the fresh empty pair's Spanish field) -> block; Escape
  // again -> fully deselected. leaveSlide prunes the still-empty trailing
  // pair on the way out, and the proposed (real-content) pair survives.
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");

  await page.keyboard.press("Control+Alt+d");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });

  await page.reload();
  const created = lastLesson();
  const sentence = created.blocks[1];
  if (sentence.type !== "sentence") throw new Error("expected a sentence block at index 1");
  expect(sentence.languageBlocks).toHaveLength(1);
  expect(
    sentence.languageBlocks.map(({ spanish, acceptedAnswers }) => ({ spanish, acceptedAnswers })),
  ).toEqual([{ spanish: "quiero", acceptedAnswers: ["I want"] }]);
});
