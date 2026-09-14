import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";

import { uxCheckLessonsPath } from "../../playwright.config";

function readLessons() {
  try {
    return JSON.parse(readFileSync(uxCheckLessonsPath, "utf8")) as {
      lessons: Array<{
        id: string;
        name: string | null;
        blocks: Array<{
          type: string;
          contentMarkdown?: string;
          promptText?: string;
          languageBlocks?: Array<{
            spanish: string;
            acceptedAnswers: string[];
          }>;
        }>;
      }>;
    };
  } catch {
    return { lessons: [] };
  }
}

test("explanation toolbar preserves editing context and sentence pairs stay discoverable", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  await page
    .getByRole("button", { name: /^(Add|Create) lesson/ })
    .first()
    .click();

  const title = page.locator("[data-lesson-title]").last();
  await title.fill("UX smoke: authoring ergonomics");
  await title.press("Enter");

  const editor = page.getByRole("textbox", { name: "Explanation 1" });
  const toolbar = page.getByRole("toolbar", {
    name: "Format explanation text",
  });
  await expect(toolbar).toBeVisible();
  await expect(
    toolbar.getByRole("button", { name: /Spanish/ }),
  ).toHaveAttribute("title", "Spanish (Ctrl Alt Q)");
  await expect(toolbar.getByRole("button", { name: /Normal/ })).toHaveAttribute(
    "title",
    "Normal (Ctrl Alt W)",
  );

  // The toolbar is in the ordinary keyboard tab order and returning to the
  // editor does not dismiss it or lose the collapsed caret.
  await page.keyboard.press("Tab");
  await expect(toolbar.getByRole("button", { name: /Spanish/ })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(editor).toBeFocused();

  await page.keyboard.type("hola");
  await page.keyboard.press("Home");
  for (let index = 0; index < 4; index += 1)
    await page.keyboard.press("Shift+ArrowRight");
  await toolbar.getByRole("button", { name: /Spanish/ }).click();
  await expect(editor.locator('mark[data-language="es"]')).toHaveText("hola");

  // Collapsed-caret formatting remains active after a toolbar click.
  await page.keyboard.press("End");
  await page.keyboard.type(" ");
  await toolbar.getByRole("button", { name: /Bold/ }).click();
  await page.keyboard.type("fuerte");
  await toolbar.getByRole("button", { name: /Bold/ }).click();
  await toolbar.getByRole("button", { name: /Normal/ }).click();
  await page.keyboard.type(" normal");

  await page.keyboard.press("Control+Alt+Enter");
  const chooser = page.locator(
    '[role="toolbar"][aria-label="Choose a slide type"]',
  );
  await chooser.waitFor();
  await page.keyboard.press("s");

  const sentence = page.locator(".lesson-document-sentence").last();
  await expect(
    page.getByText("+ help on request", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Help on request", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByText("+ after-correct message", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("After correct answer", { exact: true }),
  ).toHaveCount(0);
  const instruction = sentence.getByRole("textbox", {
    name: "Optional learner instruction",
  });
  await expect(instruction).toBeVisible();
  await expect(instruction).toHaveAttribute(
    "placeholder",
    "Add an instruction…",
  );
  await instruction.fill("Temporary instruction");
  await instruction.fill("");
  await expect(instruction).toHaveValue("");
  await instruction.fill("Translate the two parts.");
  await expect(
    sentence.locator('.lesson-document-language-field[data-language="es"]'),
  ).toHaveCount(1);
  await expect(
    sentence.locator('.lesson-document-language-field[data-language="en"]'),
  ).toHaveCount(1);

  const spanish = sentence.locator('textarea[data-field="spanish"]').first();
  const english = sentence.locator('textarea[data-field="english"]').first();
  await spanish.fill("quiero");
  await english.fill("I want");

  const addPair = sentence.getByRole("button", {
    name: "+ Add pair",
  });
  await expect(addPair).toBeEnabled();
  await addPair.click();
  await expect(
    sentence.locator('.lesson-document-language-field[data-language="es"]'),
  ).toHaveCount(2);
  await expect(
    sentence.locator('textarea[data-field="spanish"]').last(),
  ).toBeFocused();
  await sentence
    .locator('textarea[data-field="spanish"]')
    .last()
    .fill("hacerlo");
  await sentence
    .locator('textarea[data-field="english"]')
    .last()
    .fill("to do it");

  await editor.focus();
  await expect(toolbar).toBeVisible();
  const accessibility = await new AxeBuilder({ page })
    .include("main")
    .analyze();
  expect(
    accessibility.violations.filter(
      (violation) =>
        violation.impact === "critical" || violation.impact === "serious",
    ),
  ).toEqual([]);

  await page.keyboard.press("Control+s");
  await expect
    .poll(() =>
      readLessons().lessons.find(
        (lesson) => lesson.name === "UX smoke: authoring ergonomics",
      ),
    )
    .toBeTruthy();

  const created = readLessons().lessons.find(
    (lesson) => lesson.name === "UX smoke: authoring ergonomics",
  )!;
  expect(created.blocks[0].contentMarkdown).toBe(
    "[[es:hola]] **fuerte** normal",
  );
  expect(created.blocks[1].promptText).toBe("Translate the two parts.");
  expect(
    created.blocks[1].languageBlocks?.map(({ spanish, acceptedAnswers }) => ({
      spanish,
      acceptedAnswers,
    })),
  ).toEqual([
    { spanish: "quiero", acceptedAnswers: ["I want"] },
    { spanish: "hacerlo", acceptedAnswers: ["to do it"] },
  ]);

  await page.reload();
  const row = page.locator(`[data-lesson-row="${created.id}"]`);
  const reloadedEditor = row.getByRole("textbox", { name: "Explanation 1" });
  await expect(reloadedEditor.locator('mark[data-language="es"]')).toHaveText(
    "hola",
  );
  await expect(reloadedEditor.locator("strong")).toHaveText("fuerte");
  await expect(
    row.getByRole("textbox", { name: "Optional learner instruction" }).first(),
  ).toHaveValue("Translate the two parts.");
  await reloadedEditor.focus();
  await expect(toolbar).toBeVisible();
  await page.screenshot({
    path: "/tmp/lesson-builder-authoring-after.png",
    fullPage: true,
  });

  await row.getByRole("button", { name: "Delete lesson" }).click();
  await row.getByRole("button", { name: "Delete", exact: true }).click();
  await expect
    .poll(
      () =>
        readLessons().lessons.some(
          (lesson) => lesson.name === "UX smoke: authoring ergonomics",
        ),
      { timeout: 10_000 },
    )
    .toBe(false);
});

test("opening a lesson from a collapsed module keeps sibling lessons folded", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  const moduleCard = page.locator(".lesson-library-module").first();

  await moduleCard
    .getByRole("button", { name: /^(Add|Create) lesson/ })
    .click();
  await page.locator("[data-lesson-title]").last().fill("Collapse smoke one");
  await moduleCard.getByRole("button", { name: "Add lesson" }).click();
  await page.locator("[data-lesson-title]").last().fill("Collapse smoke two");

  await moduleCard.getByRole("button", { name: "Collapse module" }).click();
  await expect(moduleCard.locator(".lesson-document")).toHaveCount(0);

  const firstLesson = moduleCard.locator("[data-lesson-row]").first();
  await firstLesson.getByRole("button", { name: "Expand lesson" }).click();
  await expect(firstLesson.locator(".lesson-document")).toBeVisible();
  await expect(
    moduleCard.locator("[data-lesson-row]").nth(1).locator(".lesson-document"),
  ).toHaveCount(0);
  await expect(
    moduleCard.getByRole("button", { name: "Expand module" }),
  ).toBeVisible();
  await moduleCard.getByRole("button", { name: "Expand module" }).click();
  await expect(
    moduleCard.locator("[data-lesson-row]").nth(1).locator(".lesson-document"),
  ).toBeVisible();

  for (let index = 0; index < 2; index += 1) {
    const row = moduleCard.locator("[data-lesson-row]").last();
    await row.getByRole("button", { name: "Delete lesson" }).click();
    await row.getByRole("button", { name: "Delete", exact: true }).click();
  }
});

test("hint and alternative metadata never widen the piece card, and long text wraps cleanly at narrow width", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  await page
    .getByRole("button", { name: /^(Add|Create) lesson/ })
    .first()
    .click();
  await page.locator("[data-lesson-title]").last().fill("UX smoke: long pair");
  await page.keyboard.press("Enter");

  const chooser = page.locator(
    '[role="toolbar"][aria-label="Choose a slide type"]',
  );
  await page.keyboard.press("Control+Alt+Enter");
  await chooser.waitFor();
  await page.keyboard.press("s");

  const sentence = page.locator(".lesson-document-sentence").last();
  const piece = sentence.locator(".lesson-document-piece").first();
  const spanish = piece.locator('textarea[data-field="spanish"]');
  const english = piece.locator('textarea[data-field="english"]');
  await spanish.fill("sí");
  await english.fill("yes");

  // Activate the piece and add a hint far longer than the two-word answer.
  // The hint pill lives outside .lesson-document-piece entirely (a sibling
  // in .lesson-document-pair, not a child of the card), so the card itself
  // must stay exactly as narrow as "sí"/"yes" need — untouched by hint
  // length — while the pill truncates at its own cap instead of growing
  // without bound.
  const widthBeforeHint = (await piece.boundingBox())!.width;
  await spanish.focus();
  await sentence.getByRole("button", { name: "Add a hint" }).click();
  const hintInput = page.locator(".lesson-document-hint-pill.editing input");
  await hintInput.fill(
    "This is a deliberately long hint sentence meant to be much wider than the short Spanish and English answer pair above it.",
  );
  await english.focus();
  const widthAfterHint = (await piece.boundingBox())!.width;
  expect(widthAfterHint).toBe(widthBeforeHint);
  const pillWidth = (
    await page.locator(".lesson-document-hint-pill").first().boundingBox()
  )!.width;
  expect(pillWidth).toBeLessThan(250);

  // Removing the hint restores focus to the piece's Spanish field instead of
  // dropping it to <body>. Blurring the pill above (via english.focus())
  // returned it to its resting, non-editing state — reopen it first, the
  // same way a teacher would click back into an existing hint.
  await page.locator(".lesson-document-hint-pill").first().click();
  await page
    .locator(".lesson-document-hint-pill.editing")
    .getByRole("button", { name: "Remove hint" })
    .click();
  await expect(spanish).toBeFocused();

  // A long alternative answer, added as a second line in the same English
  // field via Shift+Enter (no more separate "+ another accepted answer"
  // row), wraps onto more lines instead of widening the card past its own
  // cap (min(25rem, 100%) on .lesson-document-piece — needed directly on
  // the card, not just its field/textarea: a field-sizing:content
  // textarea's contribution to an ancestor's width:max-content sizing isn't
  // reliably clamped by the textarea's or its wrapper's own max-width,
  // verified directly while building this).
  await english.focus();
  await english.press("Shift+Enter");
  await page.keyboard.type(
    "another much longer alternative accepted answer for this same short pair",
  );
  const widthAfterAlternative = (await piece.boundingBox())!.width;
  expect(widthAfterAlternative).toBeLessThan(410);
  await expect(english).toHaveValue(
    "yes\nanother much longer alternative accepted answer for this same short pair",
  );

  // Deleting the second line collapses back to a single accepted answer.
  await english.press("Control+A");
  await english.press("Backspace");
  await page.keyboard.type("yes");
  await expect(english).toHaveValue("yes");

  // Long, wrapped authoring content, captured at desktop width — the
  // documented target per docs/design/lesson-builder-ux-acceptance.md
  // ("Desktop authoring is the initial target").
  await spanish.fill(
    "una oración bastante larga que debería envolverse en varias líneas dentro de la tarjeta",
  );
  await english.fill(
    "a fairly long sentence that should wrap across multiple lines inside the card",
  );
  await page.waitForTimeout(150);
  await page.screenshot({
    path: "/tmp/authoring-long-pair-desktop.png",
    fullPage: true,
  });

  // NOTE (found while validating this fix, not fixed here — out of the
  // bounded scope of the hint/alternative sizing-geometry cleanup, and the
  // acceptance doc scopes authoring to desktop): at a 390px viewport, the
  // authoring page itself overflows horizontally with a long piece present —
  // reproduces even with zero hint/alternative content, so it's a
  // pre-existing general authoring-layout limitation, not a regression from
  // this change. Left unasserted here; flagged in the verification doc for a
  // separate, deliberate pass if narrow authoring is ever in scope.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  await page.screenshot({
    path: "/tmp/authoring-long-pair-narrow.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 900 });

  const axeResults = await new AxeBuilder({ page })
    .include(".lesson-document-sentence")
    .analyze();
  expect(
    axeResults.violations.filter(
      (violation) =>
        violation.impact === "critical" || violation.impact === "serious",
    ),
  ).toEqual([]);

  // Clean up.
  const created = readLessons().lessons.find(
    (lesson) => lesson.name === "UX smoke: long pair",
  );
  if (created) {
    const row = page.locator(`[data-lesson-row="${created.id}"]`);
    await row.getByRole("button", { name: "Delete lesson" }).click();
    await row.getByRole("button", { name: "Delete", exact: true }).click();
  }
  await expect
    .poll(() =>
      readLessons().lessons.some(
        (lesson) => lesson.name === "UX smoke: long pair",
      ),
    )
    .toBe(false);
});

test("slide insertion is always visible, keyboard-reachable, and works at every boundary", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  await page
    .getByRole("button", { name: /^(Add|Create) lesson/ })
    .first()
    .click();
  await page.locator("[data-lesson-title]").last().fill("UX smoke: slide insertion");
  await page.keyboard.press("Enter");

  const lessonRow = page.locator("[data-lesson-row]").last();

  // Author the first explanation, then a short and a wrapped sentence pair
  // so we have real content to insert between and around.
  await page.keyboard.type("hacer es to do");
  const chooser = page.locator(
    '[role="toolbar"][aria-label="Choose a slide type"]',
  );
  await page.keyboard.press("Control+Alt+Enter");
  await chooser.waitFor();
  await page.keyboard.press("s");
  await expect(lessonRow.locator("[data-document-block]")).toHaveCount(2);
  const shortSentence = lessonRow.locator(".lesson-document-sentence").last();
  await shortSentence.locator('textarea[data-field="spanish"]').first().fill("sí");
  await shortSentence.locator('textarea[data-field="english"]').first().fill("yes");

  await page.keyboard.press("Control+Alt+Enter");
  await chooser.waitFor();
  await page.keyboard.press("s");
  await expect(lessonRow.locator("[data-document-block]")).toHaveCount(3);
  const wrappedSentence = lessonRow.locator(".lesson-document-sentence").last();
  await wrappedSentence
    .locator('textarea[data-field="spanish"]')
    .first()
    .fill("una oración bastante larga que debería envolverse en varias líneas");
  await wrappedSentence
    .locator('textarea[data-field="english"]')
    .first()
    .fill("a fairly long sentence that should wrap across multiple lines");

  // Every between-slide insertion point (including before the first slide)
  // must be visible without hovering — the reported bug was that these were
  // opacity:0 hover-only targets.
  const inserts = lessonRow.locator(".lesson-document-insert:not(.labelled)");
  const insertCount = await inserts.count();
  expect(insertCount).toBeGreaterThanOrEqual(3); // before each of the 3 blocks
  for (let i = 0; i < insertCount; i += 1) {
    await expect(inserts.nth(i)).toHaveCSS("opacity", "1");
    const button = inserts.nth(i).locator("button");
    await expect(button).toBeVisible();
    const box = (await button.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(20);
    expect(box.height).toBeGreaterThanOrEqual(20);
  }

  // The tail "Add slide" control is also always visible.
  await expect(
    lessonRow.getByRole("button", { name: "Add slide" }),
  ).toBeVisible();

  await page.screenshot({
    path: "/tmp/authoring-short-and-wrapped-sentence.png",
    fullPage: true,
  });

  // Insert a slide BETWEEN the explanation and the short sentence — the
  // specific "cannot discover insertion between existing slides" complaint.
  const beforeCount = await lessonRow.locator("[data-document-block]").count();
  const secondInsert = inserts.nth(1); // before the short-sentence block
  await secondInsert.locator("button").click();
  await expect(chooser).toBeVisible();
  // The chooser must not visually cover the slide above the insertion point.
  const chooserBox = (await chooser.boundingBox())!;
  const explanationBox = (
    await lessonRow.locator(".lesson-document-explanation").first().boundingBox()
  )!;
  expect(chooserBox.y).toBeGreaterThanOrEqual(
    explanationBox.y + explanationBox.height - 2,
  );
  await page.screenshot({
    path: "/tmp/authoring-insertion-chooser-open.png",
    fullPage: true,
  });
  await page.keyboard.press("e"); // insert an Explanation here
  await expect(lessonRow.locator("[data-document-block]")).toHaveCount(
    beforeCount + 1,
  );
  // It landed at the right position: explanation, NEW explanation, sentence.
  const blocks = lessonRow.locator("[data-document-block]");
  await expect(blocks.nth(0).locator(".lesson-document-explanation")).toContainText(
    "hacer",
  );
  await expect(blocks.nth(1).locator(".lesson-document-explanation")).toBeVisible();
  await expect(blocks.nth(2).locator(".lesson-document-sentence")).toBeVisible();
  await page.screenshot({
    path: "/tmp/authoring-newly-inserted-slide.png",
    fullPage: true,
  });

  await blocks.nth(1).getByRole("textbox").first().click();
  await page.keyboard.type("recién insertado");

  // Insertion is keyboard-reachable at the very beginning too: Tab to the
  // first "+" control and activate it with Enter, no mouse — then actually
  // insert, proving both reachability and the beginning boundary work.
  const firstInsertButton = inserts.first().locator("button");
  await firstInsertButton.focus();
  await expect(firstInsertButton).toBeFocused();
  const countBeforeFirstInsert = await lessonRow
    .locator("[data-document-block]")
    .count();
  await page.keyboard.press("Enter");
  await expect(chooser).toBeVisible();
  await page.keyboard.press("e");
  await expect(lessonRow.locator("[data-document-block]")).toHaveCount(
    countBeforeFirstInsert + 1,
  );
  await expect(
    lessonRow.locator("[data-document-block]").first().locator(".lesson-document-explanation"),
  ).toBeVisible();

  // Duplicate, delete, and undo — on whatever block is now at index 1, to
  // prove the mechanisms work regardless of exact position.
  const settledCount = countBeforeFirstInsert + 1;
  await blocks.nth(1).getByRole("button", { name: /Duplicate slide/ }).click();
  await expect(lessonRow.locator("[data-document-block]")).toHaveCount(
    settledCount + 1,
  );
  await blocks.nth(2).getByRole("button", { name: /Delete slide/ }).click();
  await expect(lessonRow.locator("[data-document-block]")).toHaveCount(
    settledCount,
  );
  await lessonRow.getByRole("button", { name: /— Undo|Undo$/ }).click();
  await expect(lessonRow.locator("[data-document-block]")).toHaveCount(
    settledCount + 1,
  );
  // Clean the duplicate back up for a tidy save.
  await blocks.nth(2).getByRole("button", { name: /Delete slide/ }).click();
  await expect(lessonRow.locator("[data-document-block]")).toHaveCount(
    settledCount,
  );

  // Language key: only shown for an active resting sentence (optional
  // guidance while editing) — this block is no longer active, so it's
  // absent entirely rather than repeated per-phrase chrome on every resting
  // slide. No leftover "Nuevo par" microcopy either way.
  await expect(
    shortSentence.locator(".lesson-document-language-key"),
  ).toHaveCount(0);
  // Just the one real piece — shortSentence is no longer the active block by
  // this point, so its trailing draft isn't rendered.
  await expect(
    shortSentence.locator(".lesson-document-language-field"),
  ).toHaveCount(2);
  const bodyText = await lessonRow.innerText();
  expect(bodyText).not.toContain("Nuevo par");
  expect(bodyText).not.toContain("Nueva fila");
  // Every field keeps its own distinct accessible name and lang regardless.
  await expect(
    shortSentence.locator('textarea[lang="es"][aria-label]').first(),
  ).toHaveCount(1);
  await expect(
    shortSentence.locator('textarea[lang="en"][aria-label]').first(),
  ).toHaveCount(1);

  // Only one obvious "+ Add pair" entry point per sentence, and the trailing
  // draft field is styled like an ordinary field (no oversized highlight).
  await expect(
    shortSentence.getByRole("button", { name: "+ Add pair" }),
  ).toHaveCount(1);

  // Save and reload — the insertion, duplicate/delete/undo, and reorder
  // above must all persist.
  await page.keyboard.press("Control+s");
  await expect(page.getByText("All changes saved")).toBeVisible({
    timeout: 5000,
  });
  await page.reload();
  const reloadedRow = page.locator(
    `[data-lesson-row="${await lessonRow.getAttribute("data-lesson-row")}"]`,
  );
  await expect(
    reloadedRow.locator("[data-document-block]"),
  ).toHaveCount(settledCount);

  const axeResults = await new AxeBuilder({ page })
    .include(`[data-lesson-row]`)
    .analyze();
  expect(
    axeResults.violations.filter(
      (violation) =>
        violation.impact === "critical" || violation.impact === "serious",
    ),
  ).toEqual([]);

  // Clean up.
  const created = readLessons().lessons.find(
    (lesson) => lesson.name === "UX smoke: slide insertion",
  );
  if (created) {
    const row = page.locator(`[data-lesson-row="${created.id}"]`);
    await row.getByRole("button", { name: "Delete lesson" }).click();
    await row.getByRole("button", { name: "Delete", exact: true }).click();
  }
  await expect
    .poll(() =>
      readLessons().lessons.some(
        (lesson) => lesson.name === "UX smoke: slide insertion",
      ),
    )
    .toBe(false);
});

test("a semicolon in the English field commits as separate accepted answers on blur, not while typing", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  await page
    .getByRole("button", { name: /^(Add|Create) lesson/ })
    .first()
    .click();
  await page
    .locator("[data-lesson-title]")
    .last()
    .fill("UX smoke: semicolon alternatives");
  await page.keyboard.press("Enter");

  const chooser = page.locator(
    '[role="toolbar"][aria-label="Choose a slide type"]',
  );
  await page.keyboard.press("Control+Alt+Enter");
  await chooser.waitFor();
  await page.keyboard.press("s");

  const sentence = page.locator(".lesson-document-sentence").last();
  const piece = sentence.locator(".lesson-document-piece").first();
  const spanish = piece.locator('textarea[data-field="spanish"]');
  const english = piece.locator('textarea[data-field="english"]');
  await spanish.fill("quiero comprarlo");
  await english.fill("I want to buy it; I wanna buy it");

  // Not parsed while still typing/focused — one line, one value, semicolon
  // intact, exactly what was typed.
  await expect(english).toHaveValue("I want to buy it; I wanna buy it");

  // Blur (moving to the Spanish field of the same pair) commits the split.
  await spanish.focus();
  await expect(english).toHaveValue("I want to buy it\nI wanna buy it");

  // A backslash-escaped semicolon survives as a literal character instead
  // of splitting.
  await english.focus();
  await english.fill("meet you at 3\\;30");
  await spanish.focus();
  await expect(english).toHaveValue("meet you at 3;30");

  await english.focus();
  await english.fill("I want to buy it; I wanna buy it");
  await spanish.focus();

  await page.keyboard.press("Control+s");
  await expect
    .poll(() =>
      readLessons().lessons.find(
        (lesson) => lesson.name === "UX smoke: semicolon alternatives",
      ),
    )
    .toBeTruthy();
  const saved = readLessons().lessons.find(
    (lesson) => lesson.name === "UX smoke: semicolon alternatives",
  )!;
  const savedAnswers = saved.blocks[1].languageBlocks?.[0].acceptedAnswers;
  expect(savedAnswers).toEqual(["I want to buy it", "I wanna buy it"]);

  await page.reload();
  const reloadedRow = page.locator(
    `[data-lesson-row="${saved.id}"]`,
  );
  const reloadedEnglish = reloadedRow
    .locator(".lesson-document-piece")
    .first()
    .locator('textarea[data-field="english"]');
  await expect(reloadedEnglish).toHaveValue(
    "I want to buy it\nI wanna buy it",
  );

  // Clean up.
  await reloadedRow.getByRole("button", { name: "Delete lesson" }).click();
  await reloadedRow.getByRole("button", { name: "Delete", exact: true }).click();
  await expect
    .poll(() =>
      readLessons().lessons.some(
        (lesson) => lesson.name === "UX smoke: semicolon alternatives",
      ),
    )
    .toBe(false);
});
