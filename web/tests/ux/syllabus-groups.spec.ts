import type { Locator, Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

import { uxCheckLessonsPath } from "../../playwright.config";
import { expect, test } from "./fixtures";

// The module Syllabus card's round-2 structure (docs/design/lesson-builder.md
// §5, docs/design/lesson-builder-round-2.md item A): Main/Review pills are
// grouped by part of speech in one fixed order, every curriculum-backed pill
// carries a level dot whose meaning is also stated in words (colour is never
// the only signal — docs/teaching-methodology.md), a freehand pill lands in
// Untagged, and "Copy as text" carries the same headings.

const GROUP_ORDER = [
  "Pronouns",
  "Verbs",
  "Connectors",
  "Time, place and degree",
  "Words",
  "Untagged",
];

async function openSyllabus(page: Page) {
  await page.goto("/admin/lesson-builder");
  const header = page.locator(".syllabus-card-header").first();
  await expect(header).toBeVisible();
  if ((await header.getAttribute("aria-expanded")) !== "true") {
    await header.click();
  }
  const card = page.locator(".syllabus-card").first();
  await expect(card.locator(".syllabus-card-body")).toBeVisible();
  return card;
}

async function addConcept(page: Page, card: Locator, term: string) {
  const input = card.locator("input.lesson-concept-add").first();
  const popover = page.locator(".concept-typeahead-popover");
  await input.click();
  await input.fill(term);
  await expect(popover.locator('[role="option"]').first()).toBeVisible({ timeout: 20_000 });
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(popover).toBeHidden();
}

async function addFreehand(page: Page, card: Locator, label: string) {
  const input = card.locator("input.lesson-concept-add").first();
  await input.click();
  await input.fill(label);
  await input.press("Enter");
}

test("syllabus pills group by part of speech, in the fixed order, with a named level dot", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const card = await openSyllabus(page);

  // One verb, one pronoun, one connector — added verb-first so the rendered
  // order can only come from the fixed group order, not insertion order.
  for (const term of ["estar", "conmigo", "porque"]) {
    await addConcept(page, card, term);
  }
  // …plus something the curriculum doesn't know, which must land in Untagged.
  await addFreehand(page, card, "zzz freehand point");

  const eyebrows = card.locator(".syllabus-pos-eyebrow");
  const labels = await eyebrows.allTextContents();
  expect(labels.length).toBeGreaterThanOrEqual(2);
  // Whatever subset is on screen, it is in the fixed order and every label
  // is one of the six known groups.
  for (const label of labels) expect(GROUP_ORDER).toContain(label);
  const positions = labels.map((label) => GROUP_ORDER.indexOf(label));
  expect(positions).toEqual([...positions].sort((a, b) => a - b));
  expect(labels).toContain("Untagged");

  // The freehand pill is in the Untagged group, not in a pos group.
  const untagged = card
    .locator(".syllabus-pos-group")
    .filter({ has: page.locator(".syllabus-pos-eyebrow", { hasText: "Untagged" }) });
  await expect(untagged.locator(".syllabus-chip")).toContainText("zzz freehand point");

  // Level: a curriculum-backed pill carries a `role-*` dot AND says the level
  // in its tooltip.
  const levelled = card.locator(".syllabus-chip[class*='role-']").first();
  await expect(levelled).toBeVisible();
  const title = await levelled.getAttribute("title");
  expect(title).toMatch(/Level [1-5]|Unranked/);
  const dot = await levelled.evaluate((el) => {
    const style = window.getComputedStyle(el, "::before");
    return { width: style.width, radius: style.borderTopLeftRadius };
  });
  expect(dot.width).toBe("6px");

  // The legend names every dot on screen, once more than one level is shown.
  const legend = card.locator(".syllabus-legend");
  if (await legend.isVisible()) {
    const items = await legend.locator(".syllabus-legend-item").allTextContents();
    expect(items.length).toBeGreaterThan(1);
    for (const item of items) expect(item).toMatch(/Level [1-5]|Unranked/);
  }
});

test("Copy as text carries the group headings", async ({ page, context }) => {
  test.setTimeout(120_000);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const card = await openSyllabus(page);
  for (const term of ["estar", "conmigo"]) {
    await addConcept(page, card, term);
  }

  await card.getByRole("button", { name: "Copy as text" }).click();
  await expect(card.getByRole("button", { name: "Copied!" })).toBeVisible();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain("Main teaching points (in order):");
  expect(text).toMatch(/^(Pronouns|Verbs|Connectors|Time, place and degree|Words|Untagged):$/m);
  // Pronouns before Verbs, as on the card, whatever the flat order.
  expect(text.indexOf("Pronouns:")).toBeLessThan(text.indexOf("Verbs:"));
  // And the level in words, next to the entry.
  expect(text).toMatch(/\[(Level [1-5]|Unranked|not in the curriculum)\]/);
});

// Grouping is render-only: the `Ctrl Alt` chip moves still operate on the
// flat Main/Review arrays underneath the group headings.
test("Ctrl+Alt+Arrow still moves a grouped pill between the lists", async ({ page }) => {
  test.setTimeout(120_000);
  const card = await openSyllabus(page);
  await addConcept(page, card, "estar");

  const summary = card.locator(".syllabus-card-summary");
  await expect(summary).toContainText("Main 0/1");
  await expect(summary).toContainText("Review 0/0");

  // Main -> Review, from a pill that is now sitting under a group heading.
  const chip = card.locator("[data-syllabus-chip]").first();
  await chip.focus();
  await page.keyboard.press("Control+Alt+ArrowDown");

  await expect(summary).toContainText("Main 0/0");
  await expect(summary).toContainText("Review 0/1");
  // Still grouped on the other side of the move.
  await expect(card.locator(".syllabus-pos-eyebrow")).toHaveCount(1);
});

// Regression: a concept already sitting in the syllabus at page load must
// group the same as one added during the session. The load path
// (route.ts -> readConceptDisplays -> setConceptDisplays) once dropped
// `pos`, so every pre-existing pill fell into Untagged no matter its
// curriculum collections — only typeahead-added pills grouped correctly.
test("a concept already in the syllabus at load groups by its curriculum pos, not Untagged", async ({
  page,
}) => {
  test.setTimeout(60_000);
  // "yo" (concept o25n43wg3o) carries a `pos:pronoun` collection in the
  // curriculum database — verified read-only via psql before writing this.
  await writeFile(
    uxCheckLessonsPath,
    JSON.stringify({
      version: 2,
      modules: [
        {
          id: "module_seed",
          name: "Seeded module",
          lessonIds: [],
          syllabus: {
            main: [{ id: "syllabus_item_seed", conceptId: "o25n43wg3o", label: "yo" }],
            review: [],
          },
        },
      ],
      lessons: [],
    }),
  );

  const card = await openSyllabus(page);
  const pronouns = card
    .locator(".syllabus-pos-group")
    .filter({ has: page.locator(".syllabus-pos-eyebrow", { hasText: "Pronouns" }) });
  await expect(pronouns.locator(".syllabus-chip")).toContainText("yo");
  const untagged = card
    .locator(".syllabus-pos-group")
    .filter({ has: page.locator(".syllabus-pos-eyebrow", { hasText: "Untagged" }) });
  await expect(untagged).toHaveCount(0);
// Stacked bilingual pills (owner, 2026-09-16): a linked concept pill renders
// English above Spanish, not side by side on one line.
test("a linked syllabus pill stacks its English line above its Spanish line", async ({ page }) => {
  test.setTimeout(120_000);
  const card = await openSyllabus(page);
  await addConcept(page, card, "estar");

  const chip = card.locator(".syllabus-chip[data-syllabus-chip]").first();
  await expect(chip.locator(".lesson-concept-pill-label")).toBeVisible();
  const english = chip.locator(".lesson-concept-pill-en");
  const spanish = chip.locator(".lesson-concept-pill-es");
  await expect(english).toBeVisible();
  await expect(spanish).toBeVisible();
  const englishBox = await english.boundingBox();
  const spanishBox = await spanish.boundingBox();
  expect(englishBox).not.toBeNull();
  expect(spanishBox).not.toBeNull();
  if (englishBox && spanishBox) {
    // English's top sits above Spanish's top, with no horizontal offset
    // (a stack, not "spanish → english" side by side).
    expect(englishBox.y).toBeLessThan(spanishBox.y);
    expect(englishBox.x).toBe(spanishBox.x);
  }
});
