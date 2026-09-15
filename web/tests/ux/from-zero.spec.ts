import { readFileSync } from "node:fs";

import { uxCheckLessonsPath } from "../../playwright.config";
import { expect, test } from "./fixtures";

// Phase 1 acceptance: the owner's literal from-zero flow, plus every
// documented slide-exit path, asserted against the *saved JSON* — not just
// the DOM. This is exactly the class of test the diagnostic (
// docs/engineering/lesson-builder-diagnostic.md) says would have caught the
// confirmed data bug (an empty pair written to disk whenever a teacher
// finished a sentence slide with anything but Escape). See
// docs/design/lesson-builder-editing-model.md §4.

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

test.describe("from-zero: the owner's literal flow, keyboard only", () => {
  test("(a) title, explanation, a sentence with two pairs, a closing explanation, finish, reload — exactly 2 pairs, none blank", async ({
    page,
  }) => {
    await page.goto("/admin/lesson-builder");
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

    // Ctrl+Alt+L works from anywhere, even an empty module — the only
    // keyboard path to create the very first lesson.
    await page.keyboard.press("Control+Alt+l");
    const title = page.locator("[data-lesson-title]").last();
    await expect(title).toBeFocused();
    await title.fill("I want to do something.");
    await page.keyboard.press("Enter");
    await waitForFocusedField(page, "explanation");
    await page.keyboard.type("Quiero es I want.");

    // Predicted type after an explanation is a sentence — one press, no
    // chooser to pick from.
    await page.keyboard.press("Control+Alt+Enter");
    await waitForFocusedField(page, "spanish");
    await page.keyboard.type("Quiero");
    await page.keyboard.press("Tab");
    await waitForFocusedField(page, "english");
    await page.keyboard.type("I want");
    await page.keyboard.press("Tab");
    await waitForFocusedField(page, "spanish");
    await page.keyboard.type("hacerlo");
    await page.keyboard.press("Tab");
    await waitForFocusedField(page, "english");
    await page.keyboard.type("to do it");

    // Immediately Ctrl+Alt+Enter — not Escape — the exact sequence the
    // diagnostic traced to the "empty pair written to disk" bug. Predicted
    // type after a sentence is an explanation.
    await page.keyboard.press("Control+Alt+Enter");
    await waitForFocusedField(page, "explanation");
    await page.keyboard.type("Bien.");

    await page.keyboard.press("Control+Alt+d");
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });

    await page.reload();
    const created = lastLesson();
    expect(created.name).toBe("I want to do something.");
    expect(created.blocks[0]).toMatchObject({
      type: "explanation",
      // E1 (Phase 2, shipped ON): typing the terminator marks the two halves
      // of "<Spanish> es <English>." for the teacher.
      contentMarkdown: "[[es:Quiero]] es [[en:I want]].",
    });
    const sentence = created.blocks[1];
    if (sentence.type !== "sentence") throw new Error("expected a sentence block at index 1");
    expect(
      sentence.languageBlocks.map(({ spanish, acceptedAnswers }) => ({ spanish, acceptedAnswers })),
    ).toEqual([
      { spanish: "Quiero", acceptedAnswers: ["I want"] },
      { spanish: "hacerlo", acceptedAnswers: ["to do it"] },
    ]);
    expect(created.blocks[2]).toMatchObject({
      type: "explanation",
      contentMarkdown: "Bien.",
    });
  });
});

// (b)-(e): finish a pair, then leave via each documented exit path without
// ever pressing Escape on an empty trailing pair. Each must persist exactly
// the two real pairs — never a third, blank one.
type ExitPath = "escape" | "ctrlAltEnter" | "ctrlAltD" | "clickAway";

async function authorTwoCompletePairs(page: import("@playwright/test").Page, title: string) {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });
  await page.keyboard.press("Control+Alt+l");
  const titleField = page.locator("[data-lesson-title]").last();
  await titleField.fill(title);
  await page.keyboard.press("Enter");
  await waitForFocusedField(page, "explanation");
  await page.keyboard.type("Quiero es I want.");
  await page.keyboard.press("Control+Alt+Enter");
  await waitForFocusedField(page, "spanish");
  await page.keyboard.type("Quiero");
  await page.keyboard.press("Tab");
  await waitForFocusedField(page, "english");
  await page.keyboard.type("I want");
  await page.keyboard.press("Tab");
  await waitForFocusedField(page, "spanish");
  await page.keyboard.type("hacerlo");
  await page.keyboard.press("Tab");
  await waitForFocusedField(page, "english");
  await page.keyboard.type("to do it");
  // Completing the last pair via Tab auto-creates a third, empty pair and
  // focuses its Spanish field — exactly the state the owner's flow was in
  // right before each of these exit paths.
  await page.keyboard.press("Tab");
  await waitForFocusedField(page, "spanish");
}

function assertTwoCleanPairs(title: string) {
  const created = readLessons().lessons.find((lesson) => lesson.name === title);
  expect(created, `${title} should be persisted`).toBeTruthy();
  const sentence = created!.blocks[1];
  if (sentence.type !== "sentence") throw new Error("expected a sentence block at index 1");
  expect(
    sentence.languageBlocks.map(({ spanish, acceptedAnswers }) => ({ spanish, acceptedAnswers })),
  ).toEqual([
    { spanish: "Quiero", acceptedAnswers: ["I want"] },
    { spanish: "hacerlo", acceptedAnswers: ["to do it"] },
  ]);
}

const exitCases: Array<{ path: ExitPath; label: string }> = [
  { path: "escape", label: "Escape" },
  { path: "ctrlAltEnter", label: "Ctrl Alt Enter" },
  { path: "ctrlAltD", label: "Ctrl Alt D" },
  { path: "clickAway", label: "clicking another slide" },
];

for (const { path, label } of exitCases) {
  test(`(b-e) finishing a pair then leaving via ${label} prunes the trailing blank pair, not just Escape`, async ({
    page,
  }) => {
    const title = `From-zero exit: ${label}`;
    await authorTwoCompletePairs(page, title);

    if (path === "escape") {
      await page.keyboard.press("Escape");
      await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });
    } else if (path === "ctrlAltEnter") {
      await page.keyboard.press("Control+Alt+Enter");
      await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });
    } else if (path === "ctrlAltD") {
      await page.keyboard.press("Control+Alt+d");
      await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });
    } else {
      // Add a second lesson to click into, leaving the first slide's
      // trailing blank pair mid-edit — a real "click a different slide"
      // exit, not a chord.
      await page.keyboard.press("Control+Alt+l");
      const secondTitle = page.locator("[data-lesson-title]").last();
      await secondTitle.fill(`${title} (second)`);
      await secondTitle.click();
      await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });
    }

    await page.waitForTimeout(300); // let the debounced/flushed save land
    assertTwoCleanPairs(title);
  });
}

// (f) a second Ctrl+Alt+Enter, within the window, cycles the still-empty
// just-inserted block's type instead of inserting another slide.
test("(f) a second Ctrl+Alt+Enter cycles the empty just-inserted block's type", async ({ page }) => {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });
  await page.keyboard.press("Control+Alt+l");
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("From-zero: cycle type");
  await page.keyboard.press("Enter");
  await waitForFocusedField(page, "explanation");
  await page.keyboard.type("Comer es to eat.");

  const row = page.locator("[data-lesson-row]").last();

  // First Ctrl+Alt+Enter: predicted type after an explanation is a
  // sentence — one empty pair mounts.
  await page.keyboard.press("Control+Alt+Enter");
  await waitForFocusedField(page, "spanish");
  await expect(row.getByRole("region", { name: "Sentence" })).toBeVisible();

  // Second Ctrl+Alt+Enter, immediately: cycles sentence -> vocabulary,
  // since the block is still completely empty.
  await page.keyboard.press("Control+Alt+Enter");
  await waitForFocusedField(page, "spanish");
  await expect(row.getByRole("region", { name: "Vocabulary table" })).toBeVisible();
  await expect(row.locator("[data-document-block]")).toHaveCount(2);

  await page.keyboard.type("mesa");
  await page.keyboard.press("Tab");
  await page.keyboard.type("table");
  // The English answer is a buffered local draft until the field commits
  // (blur, or leaving the slide) — leave before saving so it's persisted.
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+s");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });

  const created = readLessons().lessons.find((lesson) => lesson.name === "From-zero: cycle type");
  expect(created, "lesson should be persisted").toBeTruthy();
  expect(created!.blocks.length).toBe(2);
  const table = created!.blocks[1];
  if (table.type !== "sentence") throw new Error("expected a sentence-shaped block at index 1");
  expect(table.layout).toBe("vocabulary_table");
  expect(
    table.languageBlocks.map(({ spanish, acceptedAnswers, callout }) => ({
      spanish,
      acceptedAnswers,
      callout,
    })),
  ).toEqual([{ spanish: "mesa", acceptedAnswers: ["table"], callout: null }]);
});

// (g) Ctrl+Alt+Enter from the title inserts at index 0, not the tail.
test("(g) Ctrl+Alt+Enter from the title inserts a slide at index 0", async ({ page }) => {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });
  await page.keyboard.press("Control+Alt+l");
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("From-zero: title insert");
  // Do NOT press Enter — stay on the title itself, with zero slides in the
  // lesson, and insert directly from there.
  await page.keyboard.press("Control+Alt+Enter");
  await waitForFocusedField(page, "explanation");
  await page.keyboard.type("First slide, from the title.");
  await page.keyboard.press("Control+s");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });

  const created = readLessons().lessons.find((lesson) => lesson.name === "From-zero: title insert");
  expect(created, "lesson should be persisted").toBeTruthy();
  expect(created!.blocks.length).toBe(1);
  expect(created!.blocks[0]).toMatchObject({
    type: "explanation",
    contentMarkdown: "First slide, from the title.",
  });
});

// (h) leaving a still-empty sentence slide (created by Ctrl+Alt+Enter, never
// typed into) via two Escapes deletes it outright — no empty slide is ever
// saved, and the same "Slide deleted — Undo" affordance a manual delete
// shows must appear.
test("(h) Ctrl+Alt+Enter then Escape twice on the still-empty new sentence deletes it, with the Undo toast", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });
  await page.keyboard.press("Control+Alt+l");
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("From-zero: empty sentence deleted");
  await page.keyboard.press("Enter");
  await waitForFocusedField(page, "explanation");
  await page.keyboard.type("Comer es to eat.");

  await page.keyboard.press("Control+Alt+Enter");
  await waitForFocusedField(page, "spanish");

  // Never type anything into the new sentence slide's Spanish field — leave
  // it via Escape (field -> block), then Escape again (block -> none), the
  // documented two-Escape full-deselect path.
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");

  await expect(page.getByText("Slide deleted")).toBeVisible({ timeout: 5000 });
  await expect(page.getByText("Undo")).toBeVisible();
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });

  const created = readLessons().lessons.find(
    (lesson) => lesson.name === "From-zero: empty sentence deleted",
  );
  expect(created, "lesson should be persisted").toBeTruthy();
  expect(created!.blocks.length).toBe(1);
  expect(created!.blocks[0]).toMatchObject({
    type: "explanation",
    contentMarkdown: "[[es:Comer]] es [[en:to eat]].",
  });
  expect(created!.blocks.some((block) => block.type === "sentence")).toBe(false);
});

// (i) Ctrl+Alt+Enter from a still-empty (never typed into) explanation slide
// inserts the next slide and removes the empty explanation — same
// "delete on leave" rule applied to reason "insert".
test("(i) Ctrl+Alt+Enter from an empty explanation inserts the next slide and removes the empty explanation", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });
  await page.keyboard.press("Control+Alt+l");
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("From-zero: empty explanation deleted on insert");
  await page.keyboard.press("Enter");
  // The lesson opens with a freshly created, empty explanation slide
  // focused — do not type into it.
  await waitForFocusedField(page, "explanation");

  await page.keyboard.press("Control+Alt+Enter");
  await waitForFocusedField(page, "spanish");
  await page.keyboard.type("Quiero");
  await page.keyboard.press("Tab");
  await page.keyboard.type("I want");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+s");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });

  const created = readLessons().lessons.find(
    (lesson) => lesson.name === "From-zero: empty explanation deleted on insert",
  );
  expect(created, "lesson should be persisted").toBeTruthy();
  expect(created!.blocks.length).toBe(1);
  const sentence = created!.blocks[0];
  if (sentence.type !== "sentence") throw new Error("expected the surviving block to be the sentence");
  expect(sentence.languageBlocks.map(({ spanish, acceptedAnswers }) => ({ spanish, acceptedAnswers }))).toEqual([
    { spanish: "Quiero", acceptedAnswers: ["I want"] },
  ]);
});

// Regression 2026-09-15 (owner hit this live): a click on one of an empty
// new sentence slide's own controls (Add instruction, hint lightbulb, Add
// pair) must never make the whole slide disappear — the click's own focus
// churn (the control unmounting itself, or focus briefly landing outside
// any field) is not "leaving the slide," it's staying inside it.
async function newEmptySentenceSlide(page: import("@playwright/test").Page, title: string) {
  await page.goto("/admin/lesson-builder");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });
  await page.keyboard.press("Control+Alt+l");
  const titleField = page.locator("[data-lesson-title]").last();
  await titleField.fill(title);
  await page.keyboard.press("Enter");
  await waitForFocusedField(page, "explanation");
  await page.keyboard.type("Comer es to eat.");
  await page.keyboard.press("Control+Alt+Enter");
  await waitForFocusedField(page, "spanish");
  return page.locator("[data-lesson-row]").last();
}

test("(j) clicking 'Add instruction' on an empty new sentence slide keeps the slide and focuses the instruction field", async ({
  page,
}) => {
  const row = await newEmptySentenceSlide(page, "From-zero: add instruction keeps slide");
  await row.getByRole("button", { name: "Add instruction", exact: true }).click();
  await waitForFocusedField(page, "instruction");
  await expect(row.locator("[data-document-block]")).toHaveCount(2);

  await page.keyboard.type("Fill in the blank.");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+s");
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 5000 });

  const created = readLessons().lessons.find(
    (lesson) => lesson.name === "From-zero: add instruction keeps slide",
  );
  expect(created, "lesson should be persisted").toBeTruthy();
  expect(created!.blocks.length).toBe(2);
  const sentence = created!.blocks[1] as { type: string; promptText?: string };
  expect(sentence.type).toBe("sentence");
  expect(sentence.promptText).toBe("Fill in the blank.");
});

test("(k) clicking the hint lightbulb on an empty new sentence slide keeps the slide and focuses the hint field", async ({
  page,
}) => {
  const row = await newEmptySentenceSlide(page, "From-zero: hint lightbulb keeps slide");
  await row.getByRole("button", { name: /^Add hint/ }).click();
  await waitForFocusedField(page, "hint");
  await expect(row.locator("[data-document-block]")).toHaveCount(2);
});

test("(l) clicking 'Add pair' on an empty new sentence slide keeps the slide and focuses the new pair", async ({
  page,
}) => {
  const row = await newEmptySentenceSlide(page, "From-zero: add pair keeps slide");
  await page.keyboard.type("Quiero");
  await page.keyboard.press("Tab");
  await page.keyboard.type("I want");
  // Commit the draft (blur) before clicking "Add pair" with the mouse.
  await row.getByRole("button", { name: "Add pair", exact: true }).click();
  await waitForFocusedField(page, "spanish");
  await expect(row.locator("[data-document-block]")).toHaveCount(2);
  await expect(row.locator("[data-piece]")).toHaveCount(2);
});
