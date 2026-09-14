import { expect, test } from "./fixtures";

test("sentence rest composition, hint tools, Escape, and explanation tools stay in flow", async ({ page }) => {
  await page.goto("/admin/lesson-builder");
  await page.getByRole("button", { name: /^(Add|Create) lesson/ }).first().click();
  await page.locator("[data-lesson-title]").last().fill("UX smoke: editor finishing A");
  await page.keyboard.press("Enter");

  const row = page.locator("[data-lesson-row]").last();
  const explanation = row.getByRole("textbox", { name: "Explanation 1" });
  await explanation.fill("A short explanation");
  await page.keyboard.press("Control+Alt+Enter");
  const directSentence = row.getByRole("button", {
    name: "Sentence — Insert at lesson end",
  });
  await expect(directSentence).toBeFocused();
  await page.keyboard.press("Enter");

  const sentence = row.locator(".lesson-document-sentence").last();
  await expect(sentence.getByRole("toolbar", { name: "Active sentence tools" })).toBeVisible();
  await expect(sentence.getByRole("textbox", { name: "Optional learner instruction" })).toHaveCount(0);

  let spanish = sentence.locator('textarea[data-field="spanish"]');
  let english = sentence.locator('textarea[data-field="english"]');
  await spanish.first().fill("Quiero");
  await english.first().fill("I want");
  await sentence.getByRole("button", { name: "Add pair" }).click();
  spanish = sentence.locator('textarea[data-field="spanish"]');
  english = sentence.locator('textarea[data-field="english"]');
  await spanish.nth(1).fill("hacerlo.");
  await english.nth(1).fill("to do it.");

  await spanish.first().focus();
  await page.keyboard.press("Alt+ArrowDown");
  const hint = sentence.getByRole("textbox", { name: "Hint for Quiero" });
  await hint.fill("desire");
  await hint.press("Escape");
  await expect(spanish.first()).toBeFocused();
  await spanish.first().press("Escape");

  const resting = row.locator(".lesson-document-sentence.resting");
  await expect(resting).toBeVisible();
  await expect(resting.locator('.lesson-sentence-composed[lang="es"] > .lesson-sentence-phrase')).toHaveText(["Quiero", "hacerlo."]);
  await expect(resting.locator('.lesson-sentence-composed[lang="en"]')).toContainText("I want to do it.");
  // Hints are editing-only: resting presentation shows composed text alone,
  // no hint pill or other authoring metadata.
  await expect(resting.getByRole("button")).toHaveCount(0);
  await expect(resting.locator(".lesson-document-hint-pill")).toHaveCount(0);

  // E1: drag/duplicate/delete icons are hidden at rest (nothing focused, nothing
  // hovered), revealed on slide hover, no permanent text toolbar. The sentence
  // block itself holds focus right after Escape (by design), so check the
  // explanation block, which nothing has touched since.
  const explanationBlock = row.locator("[data-document-block]").first();
  const actions = explanationBlock.locator(".lesson-document-block-actions");
  await page.mouse.move(0, 0);
  await expect(actions).toHaveCSS("opacity", "0");
  await explanationBlock.hover();
  await expect(actions).toHaveCSS("opacity", "1");
  await expect(actions.getByRole("button", { name: /Drag slide/ })).toBeVisible();
  await expect(actions.getByRole("button", { name: /Duplicate slide/ })).toBeVisible();
  await expect(actions.getByRole("button", { name: /Delete slide/ })).toBeVisible();
  await expect(row.getByText("Reorder", { exact: true })).toHaveCount(0);
  await expect(row.getByText(/^Slide \d+ ·/)).toHaveCount(0);
  await page.mouse.move(0, 0);

  await explanation.focus();
  const formatTools = row.getByRole("toolbar", { name: "Format explanation text" });
  const toolsBox = await formatTools.boundingBox();
  const sentenceBox = await row.locator("[data-document-block]").nth(1).boundingBox();
  expect(toolsBox && sentenceBox && toolsBox.y + toolsBox.height <= sentenceBox.y).toBeTruthy();

  // E2: no permanently visible shortcut strings; Bold/Italic show as B/I with full accessible names.
  await expect(formatTools.locator("kbd")).toHaveCount(0);
  await expect(formatTools.getByRole("button", { name: "Bold" })).toHaveText("B");
  await expect(formatTools.getByRole("button", { name: "Italic" })).toHaveText("I");
});

test("direct seam actions insert at exact boundaries without overlay", async ({ page }) => {
  await page.goto("/admin/lesson-builder");
  await page.getByRole("button", { name: /^(Add|Create) lesson/ }).first().click();
  await page.locator("[data-lesson-title]").last().fill("UX smoke: editor finishing B");
  await page.keyboard.press("Enter");

  const row = page.locator("[data-lesson-row]").last();
  const tail = row.locator(".lesson-document-tail");
  await tail.getByRole("button", { name: "Sentence — Insert at lesson end" }).click();
  await expect(row.locator("[data-document-block]")).toHaveCount(2);

  const middle = row.locator(".lesson-document-insert").nth(1);

  // E4: zero reserved control space at rest — no line, no icons/labels, minimal height.
  await page.mouse.move(0, 0);
  const restBox = await middle.boundingBox();
  console.log("SEAM REST HEIGHT", restBox?.height);
  expect(restBox && restBox.height <= 8).toBeTruthy();
  await expect(middle.locator(".lesson-document-insert-actions")).toHaveCSS("opacity", "0");
  const restLineOpacity = await middle.evaluate((element) => getComputedStyle(element, "::before").opacity);
  expect(Number(restLineOpacity)).toBe(0);

  await middle.hover();
  await page.waitForTimeout(150); // let the 0.1s height transition settle
  const hoverBox = await middle.boundingBox();
  console.log("SEAM HOVER HEIGHT", hoverBox?.height);
  expect(hoverBox && hoverBox.height > restBox!.height).toBeTruthy();
  await expect(middle.locator(".lesson-document-insert-actions")).toHaveCSS("opacity", "1");
  const hoverLineOpacity = await middle.evaluate((element) => getComputedStyle(element, "::before").opacity);
  expect(Number(hoverLineOpacity)).toBeGreaterThan(0);
  await expect(middle.getByRole("button")).toHaveCount(3);

  await page.mouse.move(0, 0);
  await page.waitForTimeout(150); // let the 0.1s height transition settle
  const leaveBox = await middle.boundingBox();
  console.log("SEAM AFTER-LEAVE HEIGHT", leaveBox?.height);
  expect(leaveBox && leaveBox.height <= 8).toBeTruthy();

  const middleTable = middle.getByRole("button", {
    name: "Table — Insert before slide 2",
  });
  await middleTable.focus();
  const previousBox = await row.locator("[data-document-block]").nth(0).boundingBox();
  const paletteBox = await middle.locator(".lesson-document-insert-actions").boundingBox();
  const nextBox = await row.locator("[data-document-block]").nth(1).boundingBox();
  expect(previousBox && paletteBox && paletteBox.y >= previousBox.y + previousBox.height - 1).toBeTruthy();
  expect(nextBox && paletteBox && paletteBox.y + paletteBox.height <= nextBox.y + 1).toBeTruthy();
  await page.keyboard.press("Enter");
  await expect(row.locator("[data-document-block]")).toHaveCount(3);
  await expect(row.locator("[data-document-block]").nth(1).getByRole("region", { name: "Vocabulary table" })).toBeVisible();

  const firstSeam = row.locator(".lesson-document-insert").first();
  await firstSeam.getByRole("button", { name: "Explanation — Insert before slide 1" }).click();
  await expect(row.locator("[data-document-block]")).toHaveCount(4);
  await expect(row.locator("[data-document-block]").first().locator(".lesson-document-explanation")).toBeVisible();

  for (const seam of await row.locator(".lesson-document-insert").all()) {
    await expect(seam.getByRole("button")).toHaveCount(3);
  }
});
