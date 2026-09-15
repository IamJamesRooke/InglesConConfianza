import { readFileSync } from "node:fs";

import { uxCheckLessonsPath } from "../../playwright.config";
import { expect, test } from "./fixtures";

// E4 script mode: Ctrl+Alt+T toggles a lesson between the block view and a
// plain-text script view (docs/design/lesson-script-grammar.md). Leaving
// the view parses; a clean parse replaces the lesson's blocks (saved JSON
// checked directly, per the Phase 1 lesson from
// docs/design/lesson-builder-editing-model.md §4), an invalid one shows an
// inline error and leaves the lesson untouched.

type SavedLanguageBlock = {
  spanish: string;
  acceptedAnswers: string[];
  callout: string | null;
  given?: true;
};
type SavedLessonBlock =
  | { type: "explanation"; contentMarkdown: string }
  | {
      type: "sentence";
      layout?: "sentence" | "vocabulary_table";
      promptText: string;
      languageBlocks: SavedLanguageBlock[];
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

async function openScriptView(page: import("@playwright/test").Page) {
  await page.keyboard.press("Control+Alt+t");
  const textarea = page.locator(".lesson-script-view-textarea");
  await expect(textarea).toBeFocused();
  return textarea;
}

test.describe("script mode", () => {
  test("round-trips a script with alternatives, a hint, a given piece, and an instructed table", async ({
    page,
  }) => {
    await page.goto("/admin/lesson-builder");
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

    await page.keyboard.press("Control+Alt+l");
    const title = page.locator("[data-lesson-title]").last();
    await expect(title).toBeFocused();
    await title.fill("Script mode test");

    const textarea = await openScriptView(page);
    const script = [
      "hoy es today",
      "",
      "> hoy / today | this day (adverb)",
      "> = ... / ...",
      "",
      "? Veamos la diferencia.",
      "| con / with",
      "| conmigo / with me",
    ].join("\n");
    await textarea.fill(script);
    await page.keyboard.press("Control+Alt+t");

    await expect(page.locator(".lesson-script-view-textarea")).toHaveCount(0);
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });
    await page.reload();

    const lesson = lastLesson();
    expect(lesson.blocks).toHaveLength(3);
    expect(lesson.blocks[0]).toMatchObject({ type: "explanation", contentMarkdown: "hoy es today" });
    const sentence = lesson.blocks[1] as Extract<SavedLessonBlock, { type: "sentence" }>;
    expect(sentence.languageBlocks).toHaveLength(2);
    expect(sentence.languageBlocks[0]).toMatchObject({
      spanish: "hoy",
      acceptedAnswers: ["today", "this day"],
      callout: "adverb",
    });
    expect(sentence.languageBlocks[1].given).toBe(true);
    const table = lesson.blocks[2] as Extract<SavedLessonBlock, { type: "sentence" }>;
    expect(table.layout).toBe("vocabulary_table");
    expect(table.promptText).toBe("Veamos la diferencia.");
    expect(table.languageBlocks).toHaveLength(2);

    // Toggling again reopens the script view showing the printed form of
    // what was just saved — round-tripped through the block model.
    await page.locator("[data-lesson-title]").last().click();
    await openScriptView(page);
    const reopened = await page.locator(".lesson-script-view-textarea").inputValue();
    expect(reopened).toContain("hoy es today");
    expect(reopened).toContain("| con / with");
  });

  test("an invalid line shows an inline error and leaves the lesson unchanged", async ({ page }) => {
    await page.goto("/admin/lesson-builder");
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

    await page.keyboard.press("Control+Alt+l");
    const title = page.locator("[data-lesson-title]").last();
    await expect(title).toBeFocused();
    await title.fill("Invalid script test");

    const textarea = await openScriptView(page);
    await textarea.fill("> no separator here");
    await page.keyboard.press("Control+Alt+t");

    // The view stays open with a line-numbered error instead of closing.
    await expect(page.locator(".lesson-script-view-errors")).toContainText("Line 1");
    await expect(page.locator(".lesson-script-view-textarea")).toBeVisible();

    // Fix it and leave again — now it saves.
    await textarea.fill("> hola / hello");
    await page.keyboard.press("Control+Alt+t");
    await expect(page.locator(".lesson-script-view-textarea")).toHaveCount(0);
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });
    await page.reload();

    const lesson = lastLesson();
    expect(lesson.blocks).toHaveLength(1);
  });

  // Regression: closing script view (any way) used to leave the shared
  // selection stomped to "none" — see lesson-document.tsx's script-toggle
  // effect and lesson-library.tsx's onFocusOut. With no selection, the
  // "lesson" scope Ctrl+Alt+T itself lives in is unreachable, so the same
  // chord pressed again did nothing: a 100%-reproducible dead chord after
  // the very first close, not a rare timing race.
  test("Ctrl+Alt+T reopens the script view reliably, immediately after closing, 10x in a row", async ({
    page,
  }) => {
    await page.goto("/admin/lesson-builder");
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

    await page.keyboard.press("Control+Alt+l");
    const title = page.locator("[data-lesson-title]").last();
    await expect(title).toBeFocused();
    await title.fill("Reopen regression");
    await page.keyboard.press("Enter");

    const textarea = page.locator(".lesson-script-view-textarea");
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Control+Alt+t");
      await expect(textarea, `open #${i}`).toBeVisible({ timeout: 2000 });
      await expect(textarea, `focused #${i}`).toBeFocused();
      await page.keyboard.press("Control+Alt+t");
      await expect(textarea, `closed #${i}`).toHaveCount(0);
    }
  });
});
