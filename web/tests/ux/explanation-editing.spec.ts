import { readFileSync } from "node:fs";

import { expect, test } from "./fixtures";
import { uxCheckLessonsPath } from "../../playwright.config";

// The explanation editor is Tiptap/ProseMirror (Phase 2). These cases cover
// what the previous hand-rolled contentEditable got wrong — above all,
// marking across an existing mark, which used to leave overlapping <mark>
// elements and serialize to unbalanced `[[es:…` that the teacher could then
// see as raw text in the middle of the slide.
//
// Clipboard cases use the real OS clipboard via Control+c/Control+v:
// synthetic paste events are untrusted and Chromium silently no-ops them.

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

async function save(page: import("@playwright/test").Page) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.request().method() === "PUT" &&
        candidate.url().includes("/api/admin/lesson-builder/lessons/"),
    ),
    page.keyboard.press("Control+s"),
  ]);
  expect(response.ok()).toBeTruthy();
}

async function savedBlocks(page: import("@playwright/test").Page, lessonName: string) {
  await save(page);
  return readLessons().find((candidate) => candidate.name === lessonName)?.blocks ?? [];
}

async function savedMarkdown(page: import("@playwright/test").Page, lessonName: string) {
  return (await savedBlocks(page, lessonName))[0]?.contentMarkdown ?? "";
}

/** Nothing the teacher sees may ever contain the serialized form of a mark. */
async function expectNoRawMarkup(page: import("@playwright/test").Page) {
  const visible = await page.evaluate(() => document.body.innerText);
  expect(visible).not.toContain("[[");
  expect(visible).not.toContain("]]");
}

// Synthetic key events arrive far faster than a human types, and the caret
// move a browser performs for an arrow key is asynchronous — without a beat
// between presses the *next* key can be handled against a selection one step
// behind. Real typing never gets close to this window.
async function press(page: import("@playwright/test").Page, key: string, times: number) {
  for (let i = 0; i < times; i += 1) {
    await page.keyboard.press(key);
    await page.waitForTimeout(15);
  }
}

test("typing survives save and reload byte-identically", async ({ page }) => {
  const name = "UX: explanation round-trip";
  const { row } = await createLesson(page, name);
  await page.keyboard.type("Primer parrafo.");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Segundo con **");
  await page.keyboard.press("Shift+Enter");
  await page.keyboard.type("tercera linea");

  const markdown = await savedMarkdown(page, name);
  expect(markdown).toBe("Primer parrafo.\n\nSegundo con **\ntercera linea");

  await page.reload();
  const reopened = row.page().locator("[data-lesson-row]").last();
  const explanation = reopened.getByRole("textbox", { name: "Explanation 1" });
  await expect(explanation).toContainText("Primer parrafo.");
  await expect(explanation).toContainText("tercera linea");
  // Reopening and leaving it alone must not rewrite the stored markdown.
  await explanation.click();
  await page.keyboard.press("Escape");
  expect(readLessons().find((lesson) => lesson.name === name)?.blocks[0]?.contentMarkdown).toBe(
    markdown,
  );
});

test("Ctrl+Alt+S marks a Shift+Arrow selection as Spanish", async ({ page }) => {
  const name = "UX: explanation chord mark";
  const { explanation } = await createLesson(page, name);
  await page.keyboard.type("hola mundo");
  await page.keyboard.press("Home");
  await press(page, "Shift+ArrowRight", 4);
  await page.keyboard.press("Control+Alt+s");

  await expect(explanation.locator('mark[data-language="es"]')).toHaveText("hola");
  expect(await savedMarkdown(page, name)).toBe("[[es:hola]] mundo");
  await expectNoRawMarkup(page);
});

// The owner's screenshot case: marking English across a run that is already
// marked Spanish. The `lang` mark excludes itself, so the new mark replaces
// the old one over the overlap instead of nesting inside it.
test("marking English across an existing Spanish mark replaces it, with no raw brackets", async ({
  page,
}) => {
  const name = "UX: explanation cross-mark";
  const { explanation } = await createLesson(page, name);
  await page.keyboard.type("quieres o tú quieres es you want");

  await page.keyboard.press("Home");
  await press(page, "Shift+ArrowRight", 7); // "quieres"
  await page.keyboard.press("Control+Alt+s");

  await page.keyboard.press("Home");
  await press(page, "ArrowRight", 10); // after "quieres o "
  await press(page, "Shift+ArrowRight", 10); // "tú quieres"
  await page.keyboard.press("Control+Alt+s");

  await page.keyboard.press("Home");
  await press(page, "ArrowRight", 8); // after "quieres "
  await press(page, "Shift+ArrowRight", 12); // "o tú quieres"
  await page.keyboard.press("Control+Alt+e");

  expect(await savedMarkdown(page, name)).toBe("[[es:quieres]] [[en:o tú quieres]] es you want");
  await expect(explanation.locator('mark[data-language="es"]')).toHaveCount(1);
  await expect(explanation.locator('mark[data-language="en"]')).toHaveText("o tú quieres");
  await expect(explanation.locator("mark mark")).toHaveCount(0);
  await expectNoRawMarkup(page);
});

test("Ctrl+Alt+N clears the mark on the word around the caret", async ({ page }) => {
  const name = "UX: explanation normal chord";
  const { explanation } = await createLesson(page, name);
  await page.keyboard.type("uno dos tres");
  await page.keyboard.press("Home");
  await press(page, "Shift+ArrowRight", 12);
  await page.keyboard.press("Control+Alt+s");
  expect(await savedMarkdown(page, name)).toBe("[[es:uno dos tres]]");

  // Collapsed caret inside the middle word — the case the old editor never
  // unwrapped anything for.
  await page.keyboard.press("Home");
  await press(page, "ArrowRight", 5);
  await page.keyboard.press("Control+Alt+n");

  expect(await savedMarkdown(page, name)).toBe("[[es:uno]] dos [[es:tres]]");
  await expect(explanation.locator('mark[data-language="es"]')).toHaveCount(2);
  await expectNoRawMarkup(page);
});

test("the floating toolbar's Normal button clears the selected mark", async ({ page }) => {
  const name = "UX: explanation normal toolbar";
  const { row, explanation } = await createLesson(page, name);
  await page.keyboard.type("uno dos tres");
  await page.keyboard.press("Home");
  await press(page, "Shift+ArrowRight", 12);
  await page.keyboard.press("Control+Alt+s");

  await page.keyboard.press("Home");
  await press(page, "ArrowRight", 4);
  await press(page, "Shift+ArrowRight", 3); // "dos"
  const toolbar = row.getByRole("toolbar", { name: "Format explanation text" });
  await expect(toolbar).toBeVisible();
  await toolbar.getByRole("button", { name: "Normal" }).click();

  expect(await savedMarkdown(page, name)).toBe("[[es:uno]] dos [[es:tres]]");
  await expect(explanation.locator('mark[data-language="es"]')).toHaveCount(2);
});

test("Ctrl+B and Ctrl+I toggle bold/italic on and off", async ({ page }) => {
  const name = "UX: explanation bold italic";
  const { explanation } = await createLesson(page, name);
  await page.keyboard.type("uno dos");
  await page.keyboard.press("Home");
  await press(page, "Shift+ArrowRight", 3);

  await page.keyboard.press("Control+b");
  await expect(explanation.locator("strong")).toHaveText("uno");
  expect(await savedMarkdown(page, name)).toBe("**uno** dos");

  await page.keyboard.press("Control+i");
  await expect(explanation.locator("em")).toHaveCount(1);

  await page.keyboard.press("Control+i");
  await page.keyboard.press("Control+b");
  await expect(explanation.locator("strong, em")).toHaveCount(0);
  expect(await savedMarkdown(page, name)).toBe("uno dos");
});

test("Enter in the middle of a mark splits the paragraph and keeps both halves marked", async ({
  page,
}) => {
  const name = "UX: explanation enter mid-mark";
  const { explanation } = await createLesson(page, name);
  await page.keyboard.type("hola mundo");
  await page.keyboard.press("Home");
  await press(page, "Shift+ArrowRight", 4);
  await page.keyboard.press("Control+Alt+s");

  await page.keyboard.press("Home");
  await press(page, "ArrowRight", 2);
  await page.keyboard.press("Enter");

  expect(await savedMarkdown(page, name)).toBe("[[es:ho]]\n\n[[es:la]] mundo");
  await expect(explanation.locator("p")).toHaveCount(2);
  await expectNoRawMarkup(page);
});

test("E1 auto-marks '<Spanish> es <English>.' and one Ctrl+Z leaves the text", async ({ page }) => {
  const name = "UX: explanation E1";
  const { explanation } = await createLesson(page, name);
  await page.keyboard.type("Quiero es I want.");

  await expect(explanation.locator('mark[data-language="es"]')).toHaveText("Quiero");
  await expect(explanation.locator('mark[data-language="en"]')).toHaveText("I want");
  expect(await savedMarkdown(page, name)).toBe("[[es:Quiero]] es [[en:I want]].");

  await page.keyboard.press("Control+z");
  await expect(explanation.locator("mark")).toHaveCount(0);
  await expect(explanation).toHaveText("Quiero es I want.");
  expect(await savedMarkdown(page, name)).toBe("Quiero es I want.");
});

test("E1 marks only the subject and the translation, not an aside or a comment", async ({
  page,
}) => {
  const name = "UX: explanation E1 aside";
  const { explanation } = await createLesson(page, name);
  await page.keyboard.type("hacer es to do, dos palabras.");
  await expect(explanation.locator('mark[data-language="es"]')).toHaveText("hacer");
  await expect(explanation.locator('mark[data-language="en"]')).toHaveText("to do");
  expect(await savedMarkdown(page, name)).toBe("[[es:hacer]] es [[en:to do]], dos palabras.");
  await expectNoRawMarkup(page);
});

test("Ctrl+Alt+Enter from inside the editor inserts the next slide", async ({ page }) => {
  const name = "UX: explanation insert chord";
  const { row } = await createLesson(page, name);
  await page.keyboard.type("Una nota");
  await page.keyboard.press("Control+Alt+Enter");

  await expect(row.locator('[data-field="spanish"]').first()).toBeFocused();
  const blocks = await savedBlocks(page, name);
  expect(blocks.map((block) => block.type)).toEqual(["explanation", "sentence"]);
});

test("Escape leaves the editor for the block", async ({ page }) => {
  const name = "UX: explanation escape";
  const { row, explanation } = await createLesson(page, name);
  await page.keyboard.type("Una nota");
  await page.keyboard.press("Escape");

  await expect(explanation).not.toBeFocused();
  await expect(row.locator("[data-document-block]").first()).toBeFocused();
});

test("pasting foreign HTML flattens to plain paragraphs", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const name = "UX: explanation foreign paste";
  await createLesson(page, name);

  const html =
    "<b>Bold text</b> and <span style=\"color:red\">red span</span> and " +
    '<a href="https://example.com">a link</a>';
  await page.evaluate(async (payload) => {
    await navigator.clipboard.write([
      new ClipboardItem({ "text/html": new Blob([payload], { type: "text/html" }) }),
    ]);
  }, html);
  await page.keyboard.press("Control+v");

  const markdown = await savedMarkdown(page, name);
  expect(markdown).toBe("Bold text and red span and a link");
});

test("pasting our own dialect as plain text parses the marks", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const name = "UX: explanation dialect paste";
  const { explanation } = await createLesson(page, name);

  await page.evaluate(async () => {
    await navigator.clipboard.writeText("[[es:sí]] es [[en:yes]]");
  });
  await page.keyboard.press("Control+v");

  await expect(explanation.locator('mark[data-language="es"]')).toHaveText("sí");
  await expect(explanation.locator('mark[data-language="en"]')).toHaveText("yes");
  expect(await savedMarkdown(page, name)).toBe("[[es:sí]] es [[en:yes]]");
  await expectNoRawMarkup(page);
});

test("copying a marked run into another explanation keeps its marks", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const name = "UX: explanation copy marks";
  const { row } = await createLesson(page, name);
  await page.keyboard.type("hola mundo");
  await page.keyboard.press("Home");
  await press(page, "Shift+ArrowRight", 4);
  await page.keyboard.press("Control+Alt+s");
  await page.keyboard.press("Control+b");

  // The seam's palette only becomes visible on hover.
  const seam = row.locator(".lesson-document-insert").last();
  await seam.hover();
  await seam.getByRole("button", { name: "Explanation — Insert at lesson end" }).click();
  const second = row.getByRole("textbox", { name: "Explanation 2" });
  await expect(second).toBeVisible();
  // An explanation left empty is pruned when focus leaves it, so give the
  // destination slide something before going back for the copy.
  await second.click();
  await page.keyboard.type("destino");

  const first = row.getByRole("textbox", { name: "Explanation 1" });
  await first.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Control+c");
  await second.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Control+v");

  await expect(second.locator('mark[data-language="es"]')).toHaveText("hola");
  await expect(second.locator("strong")).toHaveCount(1);
  const blocks = await savedBlocks(page, name);
  expect(blocks[1]?.contentMarkdown).toBe("[[es:**hola**]] mundo");
  await expectNoRawMarkup(page);
});
