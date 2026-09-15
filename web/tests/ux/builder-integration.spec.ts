import { expect, test } from "./fixtures";

for (const width of [1280, 900, 390]) {
  test(`module fills available column through collapse cycle at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/admin/lesson-builder");
    // Item 6: below 900px the rail collapses behind a "Modules" disclosure
    // — open it before reaching for controls that live inside it.
    if (width <= 900) {
      await page.getByRole("button", { name: /^Modules/ }).click();
    }
    await page.getByRole("button", { name: "Add module", exact: true }).click();
    const column = page.locator(".lesson-library-modules");
    const shell = page.locator(".lesson-library-with-navigator");
    const widths: number[] = [];
    const measure = async () => {
      const box = await column.boundingBox();
      expect(box).not.toBeNull();
      widths.push(box!.width);
      if (width <= 900) {
        const available = await shell.boundingBox();
        expect(Math.abs(box!.width - available!.width)).toBeLessThan(2);
      }
      const overflow = await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        offenders: [...document.querySelectorAll("body *")].map((el) => {
          const box = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return { tag: el.tagName, className: el.className, right: box.right, width: box.width, minWidth: style.minWidth, display: style.display };
        }).filter((box) => box.right > innerWidth + 1 && box.width > 0),
      }));
      expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(width + 1);
    };
    await measure();
    await page.getByRole("button", { name: /^(Add|Create) lesson$/ }).last().click();
    const title = page.locator("[data-lesson-title]").last();
    await title.fill("Short");
    await title.press("Enter");
    await measure();
    await page.getByRole("button", { name: "Collapse lesson", exact: true }).last().click();
    await measure();
    await page.getByRole("button", { name: "Expand lesson", exact: true }).last().click();
    await measure();
    await page.getByRole("button", { name: "Collapse lesson", exact: true }).last().click();
    await measure();
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(2);
    await page.screenshot({ path: testInfo.outputPath(`module-${width}.png`), fullPage: true });
    await testInfo.attach("widths", { body: JSON.stringify(widths), contentType: "application/json" });
  });
}

test("keyboard writing preserves alternatives and hints and prunes abandoned pairs on Escape", async ({ page }, testInfo) => {
  await page.goto("/admin/lesson-builder");
  await page.getByRole("button", { name: /^(Add|Create) lesson$/ }).first().click();
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("Integration: hungry");
  const id = await title.getAttribute("data-lesson-title");
  await title.press("Enter");
  const row = page.locator(`[data-lesson-row="${id}"]`);
  const explanation = row.getByRole("textbox", { name: "Explanation 1" });
  await expect(explanation).toBeFocused();
  await page.keyboard.type("Tengo hambre es I'm hungry.");
  await page.keyboard.press("Control+Alt+Enter");
  // Ctrl+Alt+Enter focuses the tail seam's Sentence button via a
  // requestAnimationFrame scheduled in SlideInsertControl, not
  // synchronously — wait for that focus to actually land before pressing
  // "s"; otherwise "s" can race ahead of the rAF and land back on the
  // explanation field instead of the seam group, silently typing an "s"
  // instead of inserting a sentence.
  await expect(
    row.getByRole("button", { name: "Sentence — Insert at lesson end" }),
  ).toBeFocused();
  await page.keyboard.press("s");
  const sentence = row.locator(".lesson-document-sentence").last();
  const spanish = sentence.locator('textarea[data-field="spanish"]');
  const english = sentence.locator('textarea[data-field="english"]');
  await expect(spanish.first()).toBeFocused();
  await page.keyboard.type("Tengo hambre.");
  await page.keyboard.press("Tab");
  await expect(english.first()).toBeFocused();
  await page.keyboard.type("I'm hungry. / I am hungry.");
  await page.keyboard.press("Alt+ArrowDown");
  const hint = sentence.getByRole("textbox", { name: "Hint for Tengo hambre." });
  await expect(hint).toBeFocused();
  await page.keyboard.type("Estoy hambriento");
  await page.keyboard.press("Escape");
  await expect(english.first()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(spanish).toHaveCount(2);
  await expect(spanish.nth(1)).toBeFocused();
  await page.keyboard.press("Escape");
  const rest = row.locator(".lesson-document-sentence.resting");
  await expect(rest).toBeVisible();
  await expect(rest.locator('[lang="en"]')).toHaveText("I'm hungry.");
  await expect(rest).not.toContainText("Estoy hambriento");
  // Resting typography (§5, item C): Spanish 16px/600, English 15px/400
  // italic — not a matched pair of sizes.
  await expect(rest.locator('[lang="es"]')).toHaveCSS("font-size", "16px");
  await expect(rest.locator('[lang="es"]')).toHaveCSS("font-weight", "600");
  await expect(rest.locator('[lang="en"]')).toHaveCSS("font-size", "15px");
  await expect(rest.locator('[lang="en"]')).toHaveCSS("font-style", "italic");
  await expect(page.getByText("All changes saved", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("sentence-rest.png"), fullPage: true });
  await page.reload();
  await row.locator(".lesson-document-sentence.resting").click();
  await expect(spanish).toHaveCount(1);
  await expect(english.first()).toHaveValue("I'm hungry. / I am hungry.");
  await english.first().focus();
  await page.keyboard.press("Alt+ArrowDown");
  await expect(hint).toHaveValue("Estoy hambriento");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Tab");
  await expect(spanish).toHaveCount(2);
  await expect(spanish.nth(1)).toBeFocused();
  await page.keyboard.type("partial");
  await page.keyboard.press("Escape");
  await row.locator(".lesson-document-sentence.resting").click();
  await expect(spanish).toHaveCount(2);
  await expect(spanish.nth(1)).toHaveValue("partial");
  await expect(page.locator(".editing-hud")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("sentence-edit.png"), fullPage: true });
});

test("table presentation stays centered and compact through hint editing", async ({ page }, testInfo) => {
  await page.goto("/admin/lesson-builder");
  await page.getByRole("button", { name: /^(Add|Create) lesson$/ }).first().click();
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("Integration: vocabulary");
  const id = await title.getAttribute("data-lesson-title");
  await title.press("Enter");
  const row = page.locator(`[data-lesson-row="${id}"]`);
  const explanation = row.getByRole("textbox", { name: "Explanation 1" });
  await explanation.fill("Comer es to eat.");
  await page.keyboard.press("Control+Alt+Enter");
  // See the other test in this file: the seam's Sentence button focus is
  // rAF-scheduled, not synchronous — wait for it before pressing "t".
  await expect(
    row.getByRole("button", { name: "Sentence — Insert at lesson end" }),
  ).toBeFocused();
  await page.keyboard.press("t");
  const table = row.getByRole("region", { name: "Vocabulary table", exact: true });
  const spanish = table.locator('textarea[data-field="spanish"]');
  const english = table.locator('textarea[data-field="english"]');
  const examples = [["comer", "to eat"], ["beber / tomar", "to drink"], ["almorzar", "to have lunch"], ["desayunar", "to have breakfast"]];
  for (let index = 0; index < examples.length; index++) {
    await expect(spanish.nth(index)).toBeFocused();
    await page.keyboard.type(examples[index][0]);
    await page.keyboard.press("Tab");
    await page.keyboard.type(examples[index][1]);
    if (index < examples.length - 1) await page.keyboard.press("Tab");
  }
  await page.keyboard.press("Alt+ArrowDown");
  const hint = table.getByRole("textbox", { name: "Hint for desayunar" });
  await expect(hint).toBeFocused();
  await page.keyboard.type("Morning meal");
  await expect(hint).toHaveValue("Morning meal");
  await page.keyboard.press("Escape");
  await expect(english.last()).toBeFocused();
  await page.keyboard.press("Escape");
  await page.mouse.move(0, 0);
  await expect(table.getByRole("button", { name: "Add row" })).toHaveCount(0);
  await expect(table.getByText("Morning meal", { exact: true })).toBeVisible();
  await expect(table.locator(".lesson-document-hint-pill-input")).toHaveCount(0);
  await expect(spanish.first()).toHaveCSS("font-size", "16px");
  await expect(spanish.first()).toHaveCSS("font-weight", "600");
  await expect(english.first()).toHaveCSS("font-weight", "400");
  const content = table.locator(".lesson-document-pieces");
  const bounds = await content.boundingBox();
  const tableBounds = await table.boundingBox();
  expect(Math.abs(bounds!.x + bounds!.width / 2 - tableBounds!.x - tableBounds!.width / 2)).toBeLessThan(2);
  const englishStarts = await english.evaluateAll((fields) => fields.map((field) => field.getBoundingClientRect().x));
  expect(Math.max(...englishStarts) - Math.min(...englishStarts)).toBeLessThan(1);
  const tags = await row.locator(".lesson-document-tags").boundingBox();
  await testInfo.attach("table-geometry", { body: JSON.stringify({ table: bounds, concepts: tags, gap: tags!.y - bounds!.y - bounds!.height }), contentType: "application/json" });
  await page.screenshot({ path: testInfo.outputPath("table-rest.png"), fullPage: true });
  await english.last().focus();
  await expect(table.getByRole("button", { name: "Add row" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("table-edit.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  await page.screenshot({ path: testInfo.outputPath("table-mobile.png"), fullPage: true });
});

test("sidebar keyboard reorder retains focus and shortcut help restores its trigger", async ({ page }) => {
  await page.goto("/admin/lesson-builder");
  await page.getByRole("button", { name: "Add module", exact: true }).click();
  await page.getByRole("button", { name: "Add module", exact: true }).click();
  const names = page.locator(".module-navigator-row-name");
  const initial = await names.allTextContents();
  const moved = initial.at(-1)!;
  const handle = page.getByRole("button", { name: `Drag to reorder ${moved}, or press Alt+ArrowUp / Alt+ArrowDown to move it`, exact: true });
  await handle.focus();
  await page.keyboard.press("Alt+ArrowUp");
  await expect(names.nth(initial.length - 2)).toHaveText(moved);
  await expect(handle).toBeFocused();
  await page.keyboard.press("Alt+ArrowDown");
  await expect(names.last()).toHaveText(moved);
  await expect(handle).toBeFocused();
  await page.keyboard.press("Control+.");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(handle).toBeFocused();
  await expect(page.locator(".lesson-library-help-fab")).toHaveCount(0);
});
