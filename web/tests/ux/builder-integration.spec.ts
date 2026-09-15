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
  // E6: Ctrl+Alt+Enter inserts the *predicted* type directly (after an
  // explanation, that's a sentence) and focuses its Spanish field — no
  // chooser to pick from on the keyboard path any more. `toBeFocused()`
  // polls, so it waits out focus.ts's requestAnimationFrame on its own.
  await page.keyboard.press("Control+Alt+Enter");
  const sentence = row.locator(".lesson-document-sentence").last();
  const spanish = sentence.locator('textarea[data-field="spanish"]');
  const english = sentence.locator('textarea[data-field="english"]');
  // Not auto-marked by E1: "hungry"/"I'm" don't clear the classifier's
  // isEnglish threshold (explanation-classifier.ts), so this stays plain
  // text and E3 proposes nothing — the new pair starts empty, focus Spanish.
  await expect(spanish.first()).toBeFocused();
  await page.keyboard.type("Tengo hambre.");
  await page.keyboard.press("Tab");
  await expect(english.first()).toBeFocused();
  await page.keyboard.type("I'm hungry. / I am hungry.");
  await page.keyboard.press("Alt+ArrowDown");
  const hint = sentence.getByRole("textbox", { name: "Hint for Tengo hambre." });
  await expect(hint).toBeFocused();
  await page.keyboard.type("Estoy hambriento");
  // Escape from the hint returns to whichever field opened it (English here).
  await page.keyboard.press("Escape");
  await expect(english.first()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(spanish).toHaveCount(2);
  await expect(spanish.nth(1)).toBeFocused();
  // Two Escapes to fully rest (owner requirement 2026-09-15): the first
  // drops the field (block selected, still "editing" chrome — and this is
  // exactly when the abandoned blank pair is pruned); the second clears the
  // selection entirely, which is when the slide actually shows resting.
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  const rest = row.locator(".lesson-document-sentence.resting");
  await expect(rest).toBeVisible();
  await expect(rest.locator('[lang="en"]')).toHaveText("I'm hungry.");
  await expect(rest).not.toContainText("Estoy hambriento");
  // Resting typography (§5, item C; Phase 3b bumped the scale to 17/15):
  // Spanish 17px/600, English 15px/400 italic — not a matched pair of sizes.
  await expect(rest.locator('[lang="es"]')).toHaveCSS("font-size", "17px");
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
  // Two Escapes to fully rest — see the note above. Give the smooth-scroll
  // that follows a chance to settle before the click below.
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  await row.locator(".lesson-document-sentence.resting").click();
  await expect(spanish).toHaveCount(2);
  await expect(spanish.nth(1)).toHaveValue("partial");
  // This assertion predates the HUD entirely (added in 5972306e, when
  // `.editing-hud` was absent from the whole app) — it was never a check
  // that the bar hides while editing, just an incidental truth of an app
  // that didn't have one yet. The HUD was deliberately restored
  // 2026-09-15 (docs/design/lesson-builder.md, "HUD bar is wanted") and is
  // documented to show whenever `selection.kind !== "none"`, which is
  // exactly the state this click just produced — so the bar being present
  // here is correct, not a regression.
  await expect(page.locator(".editing-hud")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("sentence-edit.png"), fullPage: true });
});

test("table presentation stays left-aligned and compact through hint editing", async ({ page }, testInfo) => {
  await page.goto("/admin/lesson-builder");
  await page.getByRole("button", { name: /^(Add|Create) lesson$/ }).first().click();
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("Integration: vocabulary");
  const id = await title.getAttribute("data-lesson-title");
  await title.press("Enter");
  const row = page.locator(`[data-lesson-row="${id}"]`);
  const explanation = row.getByRole("textbox", { name: "Explanation 1" });
  // Deliberately no "<Spanish> es <English>." pattern here (E1 would mark
  // it, and E3 would then propose that pair into the sentence the first
  // Ctrl+Alt+Enter below inserts — real content the type-cycle refuses to
  // discard, so the second press wouldn't cycle it at all).
  await explanation.fill("Vamos a repasar vocabulario de comida.");
  // E6: no chooser on the keyboard path any more. The predicted type after
  // an explanation is a sentence, not a table — a second Ctrl+Alt+Enter
  // within 1.5s cycles the still-empty just-inserted block's type
  // (explanation -> sentence -> vocabulary -> …), so two presses land on a
  // vocabulary table.
  await page.keyboard.press("Control+Alt+Enter");
  await page.keyboard.press("Control+Alt+Enter");
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
  // Escape from the hint returns to whichever field opened it (English).
  await page.keyboard.press("Escape");
  await expect(english.last()).toBeFocused();
  // Two Escapes to fully rest — resting means presentation only, for
  // tables exactly like sentences: no inputs, no row delete `×`, no add-row
  // button, the hint as plain read-only text.
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.mouse.move(0, 0);
  await expect(table.getByRole("button", { name: "Add row" })).toHaveCount(0);
  await expect(table.locator("textarea")).toHaveCount(0);
  await expect(table.locator(".lesson-document-pair-delete")).toHaveCount(0);
  await expect(table.getByText("Morning meal", { exact: true })).toBeVisible();
  await expect(table.locator(".lesson-document-hint-pill-input")).toHaveCount(0);
  const restRows = table.locator(".lesson-sentence-presentation-row");
  await expect(restRows).toHaveCount(4);
  await expect(restRows.first().locator('[lang="es"]')).toHaveText("comer");
  await expect(restRows.first().locator('[lang="es"]')).toHaveCSS("font-weight", "600");
  await expect(restRows.first().locator('[lang="en"]')).toHaveCSS("font-style", "italic");
  await page.screenshot({ path: testInfo.outputPath("table-rest.png"), fullPage: true });

  // Click back in: re-enters editing, same shape as before (four rows, the
  // add-row button back, the authored hint back in its editable input).
  // A real coordinate-based click intermittently misses in this harness at
  // this exact scroll position (unrelated to the app itself — a native
  // `element.click()` and a dispatched click both land correctly) —
  // dispatch the click event directly instead of simulating a pointer.
  await restRows.first().dispatchEvent("click");
  await expect(spanish.first()).toBeFocused();
  await expect(spanish).toHaveCount(4);
  await expect(table.getByRole("button", { name: "Add row" })).toBeVisible();
  // §1 (Phase 3b): tables are left-aligned to the document's text column,
  // not centred — the rows' own left edge should line up with the table
  // section's left edge, not its midpoint.
  const content = table.locator(".lesson-document-pieces");
  const bounds = await content.boundingBox();
  const tableBounds = await table.boundingBox();
  expect(Math.abs(bounds!.x - tableBounds!.x)).toBeLessThan(2);
  const englishStarts = await english.evaluateAll((fields) => fields.map((field) => field.getBoundingClientRect().x));
  expect(Math.max(...englishStarts) - Math.min(...englishStarts)).toBeLessThan(1);
  const tags = await row.locator(".lesson-document-tags").boundingBox();
  await testInfo.attach("table-geometry", { body: JSON.stringify({ table: bounds, concepts: tags, gap: tags!.y - bounds!.y - bounds!.height }), contentType: "application/json" });
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
