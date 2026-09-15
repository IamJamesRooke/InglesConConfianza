import { expect, test } from "./fixtures";

// Regressions from Phase 1 (commit 8459da76), owner-reported 2026-09-15:
// 1. Resting vocabulary tables lost their table look and rendered as a loose
//    sentence-pair list.
// 2. The lightbulb "Add hint" affordance (and Alt+ArrowDown) didn't work for
//    table rows.
// See docs/design/lesson-builder-editing-model.md §1 ("Resting means
// presentation only").
for (const width of [1280, 760]) {
  test(`vocabulary table hints and resting grid at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/admin/lesson-builder");
    await page.getByRole("button", { name: /^(Add|Create) lesson$/ }).first().click();
    const title = page.locator("[data-lesson-title]").last();
    await title.fill(`Integration: vocab table ${width}`);
    const id = await title.getAttribute("data-lesson-title");
    await title.press("Enter");
    const row = page.locator(`[data-lesson-row="${id}"]`);
    const explanation = row.getByRole("textbox", { name: "Explanation 1" });
    await explanation.fill("Comer es to eat.");
    // Cycle the just-inserted, still-empty block's predicted type
    // (explanation -> sentence -> vocabulary) with two presses within 1.5s.
    await page.keyboard.press("Control+Alt+Enter");
    await page.keyboard.press("Control+Alt+Enter");
    const table = row.getByRole("region", { name: "Vocabulary table", exact: true });
    const spanish = table.locator('textarea[data-field="spanish"]');
    const english = table.locator('textarea[data-field="english"]');
    const rows = [
      ["comer", "to eat"],
      ["beber", "to drink"],
      ["dormir", "to sleep"],
    ];
    for (let index = 0; index < rows.length; index++) {
      await expect(spanish.nth(index)).toBeFocused();
      await page.keyboard.type(rows[index][0]);
      await page.keyboard.press("Tab");
      await page.keyboard.type(rows[index][1]);
      if (index < rows.length - 1) await page.keyboard.press("Tab");
    }
    await expect(spanish).toHaveCount(3);

    // --- Hint via the lightbulb, on row 2 (index 1) ---
    await spanish.nth(1).click();
    const pair = table.locator(".lesson-document-pair").nth(1);
    const lightbulb = pair.getByRole("button", { name: "Add hint to beber" });
    await expect(lightbulb).toBeVisible();
    await lightbulb.click();
    const hint = table.getByRole("textbox", { name: "Hint for beber" });
    await expect(hint).toBeFocused();
    await page.keyboard.type("to drink (liquids)");
    await expect(hint).toHaveValue("to drink (liquids)");
    // Escape from the hint returns to whichever field opened it — the
    // lightbulb has no field of its own, so it defaults to Spanish.
    await page.keyboard.press("Escape");
    await expect(spanish.nth(1)).toBeFocused();

    // --- Confirm Alt+ArrowDown also reaches the hint for a table row,
    // reopening the same row's existing hint from its English field. ---
    await english.nth(1).click();
    await page.keyboard.press("Alt+ArrowDown");
    await expect(hint).toBeFocused();
    await expect(hint).toHaveValue("to drink (liquids)");
    await page.keyboard.press("Escape");
    await expect(english.nth(1)).toBeFocused();

    // Two Escapes to fully rest.
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.mouse.move(0, 0);

    const rest = table;
    await expect(rest.locator("input")).toHaveCount(0);
    await expect(rest.locator("textarea")).toHaveCount(0);
    await expect(rest.locator(".lesson-document-pair-delete")).toHaveCount(0);
    await expect(rest.getByRole("button", { name: "Add row" })).toHaveCount(0);

    const restRows = rest.locator(".lesson-sentence-presentation-row");
    await expect(restRows).toHaveCount(3);
    await expect(restRows.nth(0).locator('[lang="es"]')).toHaveText("comer");
    await expect(restRows.nth(0).locator('[lang="en"]')).toHaveText("to eat");
    await expect(restRows.nth(1).getByText("to drink (liquids)")).toBeVisible();

    // Required resting look: compact two-column grid, hairline row
    // separators, left-aligned to the document's text column (not centred).
    const tableEl = rest.locator(".lesson-sentence-presentation-table");
    await expect(tableEl).toHaveCSS("display", "grid");
    const firstRowBox = await restRows.nth(0).boundingBox();
    const secondRowBox = await restRows.nth(1).boundingBox();
    const documentColumn = row.locator(".lesson-document-sentence").first();
    const columnBox = await documentColumn.boundingBox();
    // Left-aligned to the document text column: same left edge, not centred
    // under some narrower content width.
    expect(Math.abs(firstRowBox!.x - columnBox!.x)).toBeLessThan(8);
    await expect(restRows.nth(0)).toHaveCSS("border-bottom-width", "1px");
    expect(firstRowBox).not.toBeNull();
    expect(secondRowBox).not.toBeNull();

    await expect(restRows.nth(0).locator('[lang="es"]')).toHaveCSS("font-weight", "600");
    await expect(restRows.nth(0).locator('[lang="en"]')).toHaveCSS("font-style", "italic");

    await page.screenshot({ path: testInfo.outputPath(`tbl-rest-${width}.png`), fullPage: true });

    // Re-enter editing and confirm the saved JSON carries the hint on row 2.
    await restRows.nth(0).dispatchEvent("click");
    await expect(spanish.first()).toBeFocused();
    await page.screenshot({ path: testInfo.outputPath(`tbl-edit-${width}.png`), fullPage: true });
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    // Autosave debounces 2s after the last edit (use-lesson-persistence.ts);
    // wait it out rather than relying on the save-status text, which is
    // hidden behind the "Modules" disclosure below 900px.
    await page.waitForTimeout(2500);

    const response = await page.request.get("/api/admin/lesson-builder/lessons");
    const stored = await response.json();
    const lesson = stored.lessons.find((entry: { id: string }) => entry.id === id);
    const block = lesson.blocks.find(
      (entry: { layout?: string }) => entry.layout === "vocabulary_table",
    );
    expect(block.languageBlocks[1].callout).toBe("to drink (liquids)");
  });
}
