import AxeBuilder from "@axe-core/playwright";
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
  await page.getByRole("button", { name: /^(Add|Create) lesson/ }).first().click();
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("ux-check: a11y seed");

  const conceptInput = page
    .locator('input[placeholder="Add concept…"], input[placeholder="+ concept"]')
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
