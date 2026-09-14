import { expect, test } from "./fixtures";
import { readFileSync } from "node:fs";

import { uxCheckLessonsPath } from "../../playwright.config";

// Regression guard for the Lesson Builder's keyboard-driven authoring path.
// Recreates a small but representative lesson (explanation tagging,
// multi-piece cumulative sentences, a callout/hint, concept search) purely
// via keyboard, the way a teacher would, then asserts the persisted JSON and
// cleans up. This replaces the manual "recreate a lesson by hand" dogfood
// pass for regression purposes — reserve manual browser sessions for new
// scenarios, not re-checking this one.

function readLessons() {
  let raw: string;
  try {
    raw = readFileSync(uxCheckLessonsPath, "utf8");
  } catch {
    return { lessons: [] };
  }
  return JSON.parse(raw) as {
    lessons: Array<{
      id: string;
      name: string;
      concepts: Array<{ conceptId: string | null; label: string }>;
      blocks: Array<{
        type: string;
        contentMarkdown?: string;
        languageBlocks?: Array<{
          spanish: string;
          callout: string | null;
          acceptedAnswers: string[];
        }>;
      }>;
    }>;
  };
}

// Waits for focus to actually land on the expected field before typing.
// Playwright fires synthetic key events faster than a real hand ever
// could, so typing right after a Tab/Enter that triggers a React re-render
// (a new blank piece mounting, a chooser opening) can race the DOM update
// and land in the field that's about to lose focus instead.
async function waitForFocusedField(
  page: import("@playwright/test").Page,
  field: string,
) {
  await page.waitForFunction(
    (f) => (document.activeElement as HTMLElement | null)?.dataset.field === f,
    field,
  );
}

// The Ctrl+Alt+Enter insertion palette auto-focuses its Sentence button, but
// only once React has mounted/focused it — wait for real focus inside the
// palette's own group rather than assuming a fixed settle time.
async function waitForPaletteFocus(page: import("@playwright/test").Page) {
  await page.waitForFunction(
    () =>
      (document.activeElement as HTMLElement | null)?.closest(
        ".lesson-document-insert-actions",
      ) !== null,
  );
}

// Alt+ArrowDown focuses the selected pair's hint pill-input — wait for real
// focus inside it before typing.
async function waitForHintFocus(page: import("@playwright/test").Page) {
  await page.waitForFunction(
    () =>
      (document.activeElement as HTMLElement | null)?.closest(
        ".lesson-document-hint-pill-input",
      ) !== null,
  );
}

test("keyboard-only lesson authoring produces the expected structure", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText(/All changes saved|Loading/)).toBeVisible();

  const before = readLessons();
  const beforeCount = before.lessons.length;

  // Open the first module's "Add lesson" (or "Create lesson" when the
  // module starts empty) and author entirely by keyboard.
  await page
    .getByRole("button", { name: /^(Add|Create) lesson$/ })
    .first()
    .click();
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("UX smoke: voy a poder");
  await title.press("Enter");

  // Explanation slide: plain text, tag spans with Ctrl+Alt+S / Ctrl+Alt+E —
  // never raw [[es:]]/[[en:]] syntax. Ctrl+Alt, not Alt alone, since plain
  // Alt+letter is commonly grabbed by Linux window managers.
  await page.keyboard.type("voy a");
  await page.keyboard.press("Shift+Home");
  await page.keyboard.press("Control+Alt+s");
  await page.keyboard.press("End");
  await page.keyboard.type(" es I am going");
  await page.keyboard.press("Shift+Control+ArrowLeft");
  await page.keyboard.press("Shift+Control+ArrowLeft");
  await page.keyboard.press("Shift+Control+ArrowLeft");
  await page.keyboard.press("Control+Alt+e");

  // First sentence slide: single piece. The insertion palette needs a beat
  // to mount and auto-focus Sentence before it can react to the E/S/T key.
  await page.keyboard.press("Control+Alt+Enter");
  await waitForPaletteFocus(page);
  await page.keyboard.press("s");
  await waitForFocusedField(page, "spanish");
  await page.keyboard.type("voy a");
  await page.keyboard.press("Tab");
  await waitForFocusedField(page, "english");
  await page.keyboard.type("I am going");

  // Second sentence slide: two pieces, plus a hint via Alt+ArrowDown (no mouse).
  await page.keyboard.press("Control+Alt+Enter");
  await waitForPaletteFocus(page);
  await page.keyboard.press("s");
  await waitForFocusedField(page, "spanish");
  await page.keyboard.type("Voy a");
  await page.keyboard.press("Tab");
  await waitForFocusedField(page, "english");
  await page.keyboard.type("I am going");
  await page.keyboard.press("Tab");
  await waitForFocusedField(page, "spanish");
  await page.keyboard.type("poder");
  await page.keyboard.press("Tab");
  await waitForFocusedField(page, "english");
  await page.keyboard.type("to be able");
  await page.keyboard.press("Alt+ArrowDown");
  await waitForHintFocus(page);
  await page.keyboard.type("stem-changing");

  // Concept search: infinitive form should resolve to a linked concept.
  const conceptInput = page
    .locator(
      '[data-lesson-row] input[placeholder="Add concept…"], [data-lesson-row] input[placeholder="+ concept"]',
    )
    .last();
  await conceptInput.click();
  await conceptInput.fill("poder");
  await page.locator('[role="option"]').first().waitFor({ timeout: 5000 });
  await page.keyboard.press("Enter");

  await page.keyboard.press("Control+s");
  await expect(page.getByText("All changes saved")).toBeVisible({
    timeout: 5000,
  });

  const after = readLessons();
  const created = after.lessons.find((l) => l.name === "UX smoke: voy a poder");
  expect(created, "created lesson should be persisted").toBeTruthy();
  expect(after.lessons.length).toBe(beforeCount + 1);

  expect(created!.blocks[0]).toMatchObject({
    type: "explanation",
    contentMarkdown: "[[es:voy a]] es [[en:I am going]]",
  });
  const pieces = (blockIndex: number) =>
    created!.blocks[blockIndex].languageBlocks!.map(
      ({ spanish, callout, acceptedAnswers }) => ({
        spanish,
        callout,
        acceptedAnswers,
      }),
    );
  expect(pieces(1)).toEqual([
    { spanish: "voy a", callout: null, acceptedAnswers: ["I am going"] },
  ]);
  expect(pieces(2)).toEqual([
    { spanish: "Voy a", callout: null, acceptedAnswers: ["I am going"] },
    {
      spanish: "poder",
      callout: "stem-changing",
      acceptedAnswers: ["to be able"],
    },
  ]);
  expect(created!.concepts.length).toBe(1);
  expect(created!.concepts[0].conceptId).not.toBeNull();

  // Clean up: delete the lesson we created so the fixture data stays clean.
  const row = page.locator(`[data-lesson-row="${created!.id}"]`);
  await row.locator("[data-lesson-delete-trigger]").click();
  await row.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(row).toHaveCount(0);
  await expect.poll(() => readLessons().lessons.length).toBe(beforeCount);
});

// Round 2, item 2: the quiet "next slide · Ctrl Alt Enter" cue used to be
// absolutely positioned off the active block's own bottom edge, which
// overlapped the following slide's content. It now renders on the one seam
// immediately after the active slide (the same seam that shows the "+"
// signpost at rest, §5 item A) — labelling wherever Ctrl+Alt+Enter will
// actually insert, and stepping aside the instant that seam's own chooser
// opens so it never competes with the chooser UI.
test("next-slide cue only marks the seam after the active slide and hides while the insert chooser is open", async ({
  page,
}) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.removeItem("lesson-builder:next-slide-uses");
    } catch {
      /* ignore */
    }
  });
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText(/All changes saved|Loading/)).toBeVisible();

  const before = readLessons();
  const beforeCount = before.lessons.length;

  await page
    .getByRole("button", { name: /^(Add|Create) lesson$/ })
    .first()
    .click();
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("UX smoke: next-slide cue");
  await title.press("Enter");

  const lessonRow = page.locator("[data-lesson-row]").last();
  const cueLabel = ".lesson-document-insert-cue";
  // With one (active) block, the tail seam is the one after it.
  const tailCue = lessonRow.locator(`.lesson-document-tail ${cueLabel}`);
  await expect(tailCue).toBeVisible();
  await expect(tailCue).toContainText("next slide");
  await expect(lessonRow.locator(cueLabel)).toHaveCount(1);

  // A second slide (inserted at the tail) becomes active in its place — the
  // cue must follow it to the new tail seam, not stay on the seam between
  // the two slides.
  await page.keyboard.press("Control+Alt+Enter");
  await waitForPaletteFocus(page);
  await page.keyboard.press("e");
  await expect(lessonRow.locator(`.lesson-document-tail ${cueLabel}`)).toBeVisible();
  await expect(
    lessonRow
      .locator('.lesson-document-insert:has([aria-label="Insert before slide 2"])')
      .locator(cueLabel),
  ).toHaveCount(0);
  await expect(lessonRow.locator(cueLabel)).toHaveCount(1);

  // Opening the chooser again hides the cue for this lesson entirely.
  await page.keyboard.press("Control+Alt+Enter");
  await waitForPaletteFocus(page);
  await expect(lessonRow.locator(cueLabel)).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page.keyboard.press("Control+s");
  await expect(page.getByText("All changes saved")).toBeVisible({
    timeout: 5000,
  });

  const created = readLessons().lessons.find(
    (l) => l.name === "UX smoke: next-slide cue",
  );
  expect(created, "created lesson should be persisted").toBeTruthy();
  const row = page.locator(`[data-lesson-row="${created!.id}"]`);
  await row.locator("[data-lesson-delete-trigger]").click();
  await row.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(row).toHaveCount(0);
  await expect.poll(() => readLessons().lessons.length).toBe(beforeCount);
});
