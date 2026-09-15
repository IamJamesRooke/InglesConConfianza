import { readFileSync } from "node:fs";

import { expect, test } from "./fixtures";
import { uxCheckLessonsPath } from "../../playwright.config";

// Regression coverage for the explanation-editor friction pass (round R6):
// a data-loss bug in a brand-new multi-paragraph explanation, a rich-HTML
// paste exploding into disconnected paragraphs, mark-switching nesting
// instead of closing/reopening as siblings, and native contentEditable undo
// being far coarser than the reducer's own history. Each test uses the real
// OS clipboard via `Control+v` where relevant — synthetic `paste` dispatch
// is untrusted and Chromium silently no-ops it.

type PersistedLesson = {
  id: string;
  name: string;
  blocks: Array<{ type: string; contentMarkdown?: string }>;
};

function readLessons(): PersistedLesson[] {
  let raw: string;
  try {
    raw = readFileSync(uxCheckLessonsPath, "utf8");
  } catch {
    return [];
  }
  return (JSON.parse(raw) as { lessons: PersistedLesson[] }).lessons;
}

async function createLesson(page: import("@playwright/test").Page, name: string) {
  await page.goto("/admin/lesson-builder");
  await page.getByRole("button", { name: /^(Add|Create) lesson$/ }).first().click();
  await page.locator("[data-lesson-title]").last().fill(name);
  await page.keyboard.press("Enter");
  const row = page.locator("[data-lesson-row]").last();
  const explanation = row.getByRole("textbox", { name: "Explanation 1" });
  await expect(explanation).toBeFocused();
  return { row, explanation };
}

async function flushAndReadBlock(page: import("@playwright/test").Page, lessonName: string) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.request().method() === "PUT" &&
        candidate.url().includes("/api/admin/lesson-builder/lessons/"),
    ),
    page.keyboard.press("Control+s"),
  ]);
  expect(response.ok()).toBeTruthy();
  const lesson = readLessons().find((candidate) => candidate.name === lessonName);
  return lesson?.blocks[0];
}

test("a second paragraph in a brand-new explanation is not dropped on save/reload (bug #1)", async ({ page }) => {
  const name = "UX smoke: explanation data loss";
  const { row } = await createLesson(page, name);
  await page.keyboard.type("Primer.");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Segundo.");

  const block = await flushAndReadBlock(page, name);
  expect(block?.contentMarkdown).toBe("Primer.\n\nSegundo.");

  await page.reload();
  const reopened = row.page().locator("[data-lesson-row]").last();
  const reopenedExplanation = reopened.getByRole("textbox", { name: "Explanation 1" });
  await expect(reopenedExplanation).toContainText("Primer.");
  await expect(reopenedExplanation).toContainText("Segundo.");
});

test("a rich-HTML paste stays one paragraph, formatting/links/lists dropped (bug #2)", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const name = "UX smoke: explanation rich paste";
  await createLesson(page, name);

  const html =
    "<b>Bold text</b> and <span style=\"color:red\">red span</span> and " +
    '<a href="https://example.com">a link</a>';
  await page.evaluate(async (payload) => {
    const item = new ClipboardItem({
      "text/html": new Blob([payload], { type: "text/html" }),
    });
    await navigator.clipboard.write([item]);
  }, html);
  await page.keyboard.press("Control+v");

  const block = await flushAndReadBlock(page, name);
  const markdown = block?.contentMarkdown ?? "";
  // No paragraph explosion: everything from this one inline-formatted
  // snippet stays on one line, no blank-line block separators.
  expect(markdown.includes("\n\n")).toBe(false);
  // Styling/links are dropped, per the deliberate "no web-page markup" rule.
  expect(markdown).not.toContain("**");
  expect(markdown).not.toContain("<a");
  expect(markdown).toContain("Bold text");
  expect(markdown).toContain("red span");
  expect(markdown).toContain("a link");
});

test("switching mark language with no separator produces sibling marks, not nested (bug #4)", async ({ page }) => {
  const name = "UX smoke: explanation mark switch";
  await createLesson(page, name);

  await page.keyboard.press("Control+Alt+s");
  await page.keyboard.type("hola");
  await page.keyboard.press("Control+Alt+e");
  await page.keyboard.type("hello");

  const block = await flushAndReadBlock(page, name);
  expect(block?.contentMarkdown).toBe("[[es:hola]][[en:hello]]");
});

test("Ctrl+Z inside the explanation routes to the reducer's undo/redo, not native undo (bug #5)", async ({ page }) => {
  const name = "UX smoke: explanation undo routing";
  const { explanation } = await createLesson(page, name);

  await page.keyboard.type("Uno dos");
  await page.keyboard.press("Control+Shift+ArrowLeft");
  await page.keyboard.press("Control+b");
  await page.keyboard.type(" tres");
  await expect(explanation).toHaveText("Uno dos tres");
  await expect(explanation.locator("strong, b")).toHaveCount(1);

  // 1st undo: only the typing done after bolding goes away.
  await page.keyboard.press("Control+z");
  await expect(explanation).toHaveText("Uno dos");
  await expect(explanation.locator("strong, b")).toHaveCount(1);

  // 2nd undo: the bold formatting itself goes away, text intact.
  await page.keyboard.press("Control+z");
  await expect(explanation).toHaveText("Uno dos");
  await expect(explanation.locator("strong, b")).toHaveCount(0);

  // 3rd undo: back to a fully empty field.
  await page.keyboard.press("Control+z");
  await expect(explanation).toHaveText("");

  // Redo walks the same three steps back in order.
  await page.keyboard.press("Control+Shift+z");
  await expect(explanation).toHaveText("Uno dos");
  await expect(explanation.locator("strong, b")).toHaveCount(0);

  await page.keyboard.press("Control+Shift+z");
  await expect(explanation.locator("strong, b")).toHaveCount(1);

  await page.keyboard.press("Control+Shift+z");
  await expect(explanation).toHaveText("Uno dos tres");
});
