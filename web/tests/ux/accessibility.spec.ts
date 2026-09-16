import AxeBuilder from "@axe-core/playwright";
import { devices } from "@playwright/test";
import { expect, test } from "./fixtures";

// Mechanical accessibility + click-target audit for the Lesson Builder.
// Fails only on critical/serious axe violations (moderate/minor are printed,
// not blocking, so the check stays actionable instead of noisy). Also
// reports any visible icon-only control under the 24x24 target-size floor
// (WCAG 2.5.5) — printed, not asserted, since small text links like
// "+hint" are an intentional, conventional exception.

test("lesson builder page has no serious/critical accessibility violations", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  await page.getByText("All changes saved").waitFor({ timeout: 10_000 }).catch(() => {});

  // Seed one lesson with a concept chip so priority-chip markup (and the
  // color-contrast rule this once caught) is actually present in the scan —
  // an empty course would otherwise skip that surface entirely.
  await page.getByRole("button", { name: /^(Add|Create) lesson$/ }).first().click();
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("ux-check: a11y seed");

  const conceptInput = page
    .locator('input[placeholder="Add concept…"]')
    .last();
  await conceptInput.click();
  await conceptInput.fill("poder");
  await page.waitForTimeout(400);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);

  // Also expand the search dropdown itself so its markup is in the scan.
  await conceptInput.click();
  await conceptInput.fill("po");
  await page.waitForTimeout(400);

  const results = await new AxeBuilder({ page })
    .include("main")
    .analyze();

  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  const other = results.violations.filter(
    (v) => v.impact !== "critical" && v.impact !== "serious",
  );

  if (other.length) {
    console.log(
      `\n[ux-check] ${other.length} non-blocking a11y finding(s):\n` +
        other
          .map((v) => `  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
          .join("\n"),
    );
  }

  if (blocking.length) {
    console.log(
      `\n[ux-check] ${blocking.length} BLOCKING a11y violation(s):\n` +
        blocking
          .map(
            (v) =>
              `  - [${v.impact}] ${v.id}: ${v.help}\n` +
              v.nodes.map((n) => `      ${n.target.join(" ")}`).join("\n"),
          )
          .join("\n"),
    );
  }

  // Clean up the seed lesson regardless of outcome.
  const row = page.locator("[data-lesson-row]").last();
  await row.locator("[data-lesson-delete-trigger]").click();
  await row.getByRole("button", { name: "Delete", exact: true }).click();
  await page.keyboard.press("Control+s");
  await page.getByText("All changes saved").waitFor({ timeout: 5000 }).catch(() => {});

  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
});

test("icon-only controls meet a minimum click-target size", async ({ page }) => {
  await page.goto("/admin/lesson-builder");

  const tiny = await page.evaluate(() => {
    const MIN = 24;
    const findings: string[] = [];
    document.querySelectorAll<HTMLElement>("button, a[href]").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return; // not visible
      const hasVisibleText = (el.textContent ?? "").trim().length > 0;
      const isTextLink = hasVisibleText && rect.height < MIN && rect.width > MIN * 2;
      if (isTextLink) return; // conventional small text link, not an icon button
      if (rect.width < MIN || rect.height < MIN) {
        findings.push(
          `${el.tagName.toLowerCase()}[aria-label="${el.getAttribute("aria-label") ?? ""}"] ${Math.round(rect.width)}x${Math.round(rect.height)}`,
        );
      }
    });
    return findings;
  });

  if (tiny.length) {
    console.log(`\n[ux-check] ${tiny.length} control(s) under 24x24px:\n  - ${tiny.join("\n  - ")}`);
  }
  // Reported, not enforced — icon-button sizing is a design-pass decision.
});

// First-run friction #7: every icon-only control inside the Lesson
// Library/Document/module-navigator surface (drag/duplicate/delete, the
// seam "+" trigger, hint lightbulb, pair delete "x", undo/redo, module
// delete/drag, …) must have a >=24x24 hit area — via padding/min-width/
// min-height, not by growing the icon glyphs themselves. Scoped to
// `.lesson-library` (which contains the module navigator too) and to
// buttons/links with no visible text, so labelled buttons like the insert
// chooser's "Explanation"/"Sentence"/"Table" aren't flagged. Asserted, not
// just reported — this is the one this friction pass was asked to enforce.
test("lesson library icon-only controls meet the 24x24 click-target floor", async ({
  page,
}) => {
  await page.goto("/admin/lesson-builder");
  await page.getByText("All changes saved").waitFor({ timeout: 10_000 }).catch(() => {});

  // Add a second module first (so module delete/drag render meaningfully)
  // and a lesson with a sentence pair — but focus the pair LAST: leaving it
  // active is what keeps its editing DOM (pair delete "x", hint lightbulb)
  // mounted for the scan below, and any later focus change (e.g. clicking
  // "Add module" after this point) would collapse it back to its static
  // resting presentation, which renders no controls at all.
  await page.getByRole("button", { name: "Add module" }).click();
  await page.waitForTimeout(150);

  await page.getByRole("button", { name: /^(Add|Create) lesson$/ }).first().click();
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("ux-check: tap targets");
  await title.press("Enter");
  await page.waitForTimeout(150);

  const explanation = page.locator('[contenteditable="true"]').last();
  await explanation.click();
  await page.keyboard.down("Control");
  await page.keyboard.down("Alt");
  await page.keyboard.press("Enter");
  await page.keyboard.up("Alt");
  await page.keyboard.up("Control");
  await page.waitForTimeout(150);
  await page.keyboard.press("s");
  await page.waitForTimeout(150);

  const spanish = page.locator('.lesson-document-piece textarea[data-field="spanish"]').last();
  await spanish.click();
  await spanish.fill("Hola");
  await page.waitForTimeout(100);

  const tiny = await page.evaluate(() => {
    const MIN = 24;
    const findings: string[] = [];
    const scope = document.querySelector(".lesson-library");
    scope?.querySelectorAll<HTMLElement>("button, a[href]").forEach((el) => {
      const hasVisibleText = (el.textContent ?? "").trim().length > 0;
      if (hasVisibleText) return; // icon-only controls only
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return; // not visible/mounted
      if (rect.width < MIN || rect.height < MIN) {
        findings.push(
          `${el.tagName.toLowerCase()}[aria-label="${el.getAttribute("aria-label") ?? ""}"] ${Math.round(rect.width)}x${Math.round(rect.height)}`,
        );
      }
    });
    return findings;
  });

  // Clean up the seed lesson and second module regardless of outcome.
  const row = page.locator("[data-lesson-row]").last();
  await row.locator("[data-lesson-delete-trigger]").click();
  await row.getByRole("button", { name: "Delete", exact: true }).click();
  await page.keyboard.press("Control+s");
  await page.getByText("All changes saved").waitFor({ timeout: 5000 }).catch(() => {});

  expect(tiny, tiny.join("\n")).toEqual([]);
});

test("practice page has no serious/moderate accessibility violations on phone", async ({
  page,
  request,
}) => {
  // Seed one lesson with a single explanation + sentence block directly
  // through the lesson-builder API — the isolated course starts empty
  // (see fixtures.ts), and /practice redirects home for any lesson id with
  // zero blocks.
  const lessonId = "ux-a11y-practice-lesson";
  const lesson = {
    id: lessonId,
    name: "Practice a11y check",
    concepts: [],
    blocks: [
      {
        id: "block-explain",
        type: "explanation",
        contentMarkdown: "Hola, esto es una prueba.",
      },
      {
        id: "block-sentence",
        type: "sentence",
        promptLabel: "",
        promptText: "",
        helperText: "",
        answerFeedback: null,
        languageBlocks: [
          {
            id: "lang-1",
            spanish: "hola",
            callout: null,
            acceptedAnswers: ["hello"],
          },
        ],
      },
    ],
  };
  const putResponse = await request.put(
    `/api/admin/lesson-builder/lessons/${lessonId}`,
    { data: { lesson } },
  );
  expect(putResponse.ok()).toBeTruthy();

  // Reproduce on the phone profile, per the student-friction walkthrough.
  const browser = page.context().browser();
  const phoneContext = await browser!.newContext({ ...devices["iPhone 13"] });
  const phonePage = await phoneContext.newPage();
  try {
    await phonePage.goto(`/practice?lesson=${lessonId}`);
    await phonePage.getByRole("heading", { level: 1 }).waitFor();

    const results = await new AxeBuilder({ page: phonePage }).analyze();
    const blocking = results.violations.filter(
      (v) =>
        v.impact === "critical" ||
        v.impact === "serious" ||
        v.impact === "moderate",
    );
    if (blocking.length) {
      console.log(
        `\n[ux-check] ${blocking.length} blocking a11y violation(s) on /practice:\n` +
          blocking
            .map(
              (v) =>
                `  - [${v.impact}] ${v.id}: ${v.help}\n` +
                v.nodes.map((n) => `      ${n.target.join(" ")}`).join("\n"),
            )
            .join("\n"),
      );
    }
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  } finally {
    await phoneContext.close();
  }
});
