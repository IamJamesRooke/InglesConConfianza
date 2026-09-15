import { expect, test } from "./fixtures";

test("sentence rest composition, hint tools, Escape, and explanation tools stay in flow", async ({ page }) => {
  await page.goto("/admin/lesson-builder");
  await page.getByRole("button", { name: /^(Add|Create) lesson$/ }).first().click();
  await page.locator("[data-lesson-title]").last().fill("UX smoke: editor finishing A");
  await page.keyboard.press("Enter");

  const row = page.locator("[data-lesson-row]").last();
  const explanation = row.getByRole("textbox", { name: "Explanation 1" });
  await explanation.fill("A short explanation");
  // E6: Ctrl+Alt+Enter inserts the predicted type (sentence, after an
  // explanation) directly and focuses it — no chooser to pick from.
  await page.keyboard.press("Control+Alt+Enter");

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
  // Two Escapes to fully rest (owner requirement 2026-09-15): the first
  // drops the field (still "editing" chrome), the second clears the
  // selection entirely — that's when the slide actually shows resting.
  await spanish.first().press("Escape");
  await page.keyboard.press("Escape");

  const resting = row.locator(".lesson-document-sentence.resting");
  await expect(resting).toBeVisible();
  await expect(resting.locator('.lesson-sentence-composed[lang="es"] > .lesson-sentence-phrase')).toHaveText(["Quiero", "hacerlo."]);
  await expect(resting.locator('.lesson-sentence-composed[lang="en"]')).toContainText("I want to do it.");
  // Hints are editing-only: resting presentation shows composed text alone,
  // no hint pill or other authoring metadata.
  await expect(resting.getByRole("button")).toHaveCount(0);
  await expect(resting.locator(".lesson-document-hint-pill")).toHaveCount(0);

  // Drag/duplicate/delete icons are hidden at rest (nothing focused, nothing
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
  // Phase 2: the toolbar needs a real selection to act on before it appears.
  await page.keyboard.press("Control+a");
  const formatTools = row.getByRole("toolbar", { name: "Format explanation text" });
  const toolsBox = await formatTools.boundingBox();
  const sentenceBox = await row.locator("[data-document-block]").nth(1).boundingBox();
  expect(toolsBox && sentenceBox && toolsBox.y + toolsBox.height <= sentenceBox.y).toBeTruthy();

  // No permanently visible shortcut strings; Bold/Italic show as B/I with full accessible names.
  await expect(formatTools.locator("kbd")).toHaveCount(0);
  await expect(formatTools.getByRole("button", { name: "Bold" })).toHaveText("B");
  await expect(formatTools.getByRole("button", { name: "Italic" })).toHaveText("I");
});

test("direct seam actions insert at exact boundaries without overlay", async ({ page }) => {
  await page.goto("/admin/lesson-builder");
  await page.getByRole("button", { name: /^(Add|Create) lesson$/ }).first().click();
  await page.locator("[data-lesson-title]").last().fill("UX smoke: editor finishing B");
  await page.keyboard.press("Enter");

  const row = page.locator("[data-lesson-row]").last();
  // leaveSlide (editing.ts) deletes a blank slide on every departure,
  // `insert` included (owner requirement 2026-09-15: "an empty slide is
  // never worth keeping") — give the lesson's opening explanation real
  // content before leaving it via the tail-seam insert below, or it
  // vanishes instead of becoming the first of two blocks this test needs.
  await row.getByRole("textbox", { name: "Explanation 1" }).fill("Opening explanation");
  const tail = row.locator(".lesson-document-tail");
  // At rest the palette is `visibility: hidden` (not hit-testable); hover
  // the seam first, the way a real pointer user would, to reveal it.
  await tail.hover();
  await tail.getByRole("button", { name: "Sentence — Insert at lesson end" }).click();
  await expect(row.locator("[data-document-block]")).toHaveCount(2);
  // Same leaveSlide rule as above: this sentence stays blank for the rest
  // of the test (only its geometry/keyboard-reachability is under test
  // here), so give it real content now — otherwise the *next* insertion
  // below, which moves selection away from it, deletes it as an empty
  // slide instead of leaving it as the second of the three blocks that
  // insertion expects to land between.
  const insertedTail = row.locator(".lesson-document-sentence").last();
  await insertedTail.locator('textarea[data-field="spanish"]').first().fill("uno");
  await insertedTail.locator('textarea[data-field="english"]').first().fill("one");

  const middle = row.locator(".lesson-document-insert").nth(1);

  // Zero reserved control space at rest — no line, no icons/labels, minimal height.
  await page.mouse.move(0, 0);
  const restBox = await middle.boundingBox();
  console.log("SEAM REST HEIGHT", restBox?.height);
  expect(restBox && restBox.height <= 8).toBeTruthy();
  await expect(middle.locator(".lesson-document-insert-actions")).toHaveCSS("opacity", "0");
  // At rest the palette must be neither visible nor hit-testable — only the
  // container-level "+" signpost (::after) is actually visible, and then
  // only on the one seam immediately after the active slide (§5, item A).
  // This "middle" seam sits BEFORE the active slide (the just-inserted
  // sentence, last block), so its own "+" stays hidden at rest.
  await expect(middle.locator(".lesson-document-insert-actions")).toHaveCSS("visibility", "hidden");
  const restLineOpacity = await middle.evaluate((element) => getComputedStyle(element, "::before").opacity);
  expect(Number(restLineOpacity)).toBe(0);
  const restSignpostOpacity = await middle.evaluate((element) => getComputedStyle(element, "::after").opacity);
  expect(Number(restSignpostOpacity)).toBe(0);

  // The tail seam, right after the active (just-inserted) slide, is the one
  // seam that DOES show its "+" at rest — no hover/focus needed.
  const tailAfterActive = row.locator(".lesson-document-tail .lesson-document-insert");
  await expect(tailAfterActive).toHaveAttribute("data-after-active", "true");
  const tailSignpostOpacity = await tailAfterActive.evaluate(
    (element) => getComputedStyle(element, "::after").opacity,
  );
  expect(Number(tailSignpostOpacity)).toBeGreaterThan(0);

  await middle.hover();
  await page.waitForTimeout(150); // let the 0.1s height transition settle
  const hoverBox = await middle.boundingBox();
  console.log("SEAM HOVER HEIGHT", hoverBox?.height);
  expect(hoverBox && hoverBox.height > restBox!.height).toBeTruthy();
  await expect(middle.locator(".lesson-document-insert-actions")).toHaveCSS("opacity", "1");
  await expect(middle.locator(".lesson-document-insert-actions")).toHaveCSS("visibility", "visible");
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
  // Hover to reveal the palette again — a visibility:hidden element cannot
  // take focus, so this mirrors how a pointer user reaches it before
  // tabbing/clicking into a specific choice.
  await middle.hover();
  await middleTable.focus();
  // The hover above re-triggers the seam's 0.1s height transition (4px ->
  // 26px), which shifts the following block's layout box as it runs. Wait
  // for the seam to reach its expanded end state before reading anyone's
  // boundingBox(), or these reads can land mid-transition and the boundary
  // checks below flake.
  await expect.poll(async () => (await middle.boundingBox())?.height).toBe(26);
  const previousBox = await row.locator("[data-document-block]").nth(0).boundingBox();
  const paletteBox = await middle.locator(".lesson-document-insert-actions").boundingBox();
  const nextBox = await row.locator("[data-document-block]").nth(1).boundingBox();
  expect(previousBox && paletteBox && paletteBox.y >= previousBox.y + previousBox.height - 1).toBeTruthy();
  expect(nextBox && paletteBox && paletteBox.y + paletteBox.height <= nextBox.y + 1).toBeTruthy();
  await page.keyboard.press("Enter");
  await expect(row.locator("[data-document-block]")).toHaveCount(3);
  const insertedTable = row.locator("[data-document-block]").nth(1).getByRole("region", { name: "Vocabulary table" });
  await expect(insertedTable).toBeVisible();
  // Same leaveSlide rule as the tail-inserted sentence above: give this
  // table row real content before the next insertion moves selection away
  // from it, or it's deleted as an empty slide instead of becoming the
  // second of the four blocks the next check expects.
  await insertedTable.locator('textarea[data-field="spanish"]').first().fill("dos");
  await insertedTable.locator('textarea[data-field="english"]').first().fill("two");

  const firstSeam = row.locator(".lesson-document-insert").first();
  await firstSeam.hover();
  await firstSeam.getByRole("button", { name: "Explanation — Insert before slide 1" }).click();
  await expect(row.locator("[data-document-block]")).toHaveCount(4);
  await expect(row.locator("[data-document-block]").first().locator(".lesson-document-explanation")).toBeVisible();

  // Palette buttons exist per seam regardless of rest-state visibility —
  // count them in the accessibility tree including hidden nodes. Every seam
  // has at least Explanation/Sentence/Table; a seam whose preceding block is
  // a sentence slide (E3b) additionally gets a fourth "Extend" choice.
  for (const seam of await row.locator(".lesson-document-insert").all()) {
    const names = await seam.getByRole("button", { includeHidden: true }).allTextContents();
    expect(names.slice(0, 3)).toEqual(["Explanation", "Sentence", "Table"]);
    expect(names.length).toBeLessThanOrEqual(4);
    if (names.length === 4) expect(names[3]).toEqual("Extend");
  }
});
