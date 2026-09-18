import { unlink } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "./fixtures";

// Part A — one image on an explanation slide (docs/design/onboarding.md
// "media option"). A small hand-authored SVG stands in for a real upload;
// it is uploaded through the real admin route so the test exercises the
// same path a teacher would, and deleted again afterward so it never lands
// in the repo's public/lesson-media/ for real.
const svgFixture = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 80">
  <text x="8" y="30" font-size="18">preparar</text>
  <line x1="80" y1="24" x2="130" y2="24" stroke="black" stroke-width="2" />
  <text x="140" y="30" font-size="18">to prepare</text>
</svg>`;

const explanationLesson = {
  id: "lesson_ux_explanation_image",
  name: "Imagen en la explicación",
  concepts: [],
  blocks: [
    {
      id: "block_ux_explanation_image",
      type: "explanation" as const,
      contentMarkdown: "preparar es to prepare",
      image: { file: "", alt: "preparar to prepare" },
    },
  ],
};

test("an explanation image renders above the text at 390 with Continue in view", async ({
  page,
  request,
}) => {
  const uploadResponse = await request.post("/api/admin/lesson-builder/media", {
    multipart: {
      file: {
        name: "preparar.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from(svgFixture),
      },
    },
  });
  expect(uploadResponse.ok()).toBeTruthy();
  const { file } = (await uploadResponse.json()) as { file: string };

  try {
    const courseResponse = await request.get("/api/admin/lesson-builder/lessons");
    const course = (await courseResponse.json()) as { modules: Array<{ id: string }> };
    const lesson = { ...explanationLesson, blocks: [{ ...explanationLesson.blocks[0], image: { file, alt: "preparar to prepare" } }] };
    const seed = await request.put(`/api/admin/lesson-builder/lessons/${lesson.id}`, {
      data: { lesson, moduleId: course.modules[0].id },
    });
    expect(seed.ok()).toBeTruthy();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/practice?lesson=${lesson.id}`);

    const explanationText = page.locator(".lesson-explanation .practice-markdown-content");
    await expect(explanationText).toBeVisible();
    const image = page.locator(".lesson-explanation-image");
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute("src", `/lesson-media/${file}`);
    await expect(image).toHaveAttribute("alt", "preparar to prepare");

    const textBox = await explanationText.boundingBox();
    const imageBox = await image.boundingBox();
    expect(textBox).not.toBeNull();
    expect(imageBox).not.toBeNull();
    // ABOVE the text (owner correction 2026-09-18), not beside or below it.
    expect(imageBox!.y + imageBox!.height).toBeLessThanOrEqual(textBox!.y + 1);

    const continueButton = page.getByRole("button", { name: /Continuar|Terminar lección|Empezar/ });
    await expect(continueButton).toBeInViewport();

    await page.screenshot({ path: "/tmp/claude-1000/explanation-image-390.png" });

    // Owner refinement, 2026-09-18: at a wider (~920px) viewport the card
    // stays capped at 720 and centred (never the full column), and — since
    // this explanation's text is a single line — the text stays centred
    // under the image, sharing its centre axis, rather than the left-
    // aligned/small look a stray fit-content shrink used to produce.
    await page.setViewportSize({ width: 920, height: 900 });
    const card = page.locator(".lesson-explanation");
    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.width).toBeLessThanOrEqual(721);
    const textAlign = await explanationText.evaluate(
      (el) => getComputedStyle(el).textAlign,
    );
    expect(textAlign).toBe("center");
    const wideTextBox = await explanationText.boundingBox();
    const wideImageBox = await image.boundingBox();
    // Same centre axis: the image and the (centred, one-line) text share
    // a horizontal midpoint.
    expect(
      Math.abs((wideImageBox!.x + wideImageBox!.width / 2) - (wideTextBox!.x + wideTextBox!.width / 2)),
    ).toBeLessThanOrEqual(2);

    await page.screenshot({ path: "/tmp/claude-1000/explanation-image-920.png" });
  } finally {
    await unlink(path.join(process.cwd(), "public", "lesson-media", file)).catch(() => {});
  }
});

// Regression (owner, live test): adding an image via the builder's own
// "Add image" file picker — the add -> has-image transition, not a
// pre-seeded lesson — is exactly what triggered React's "changing an
// uncontrolled input to be controlled" warning at ExplanationImageControl
// (the hidden file input and the alt-text input shared a DOM node across
// the transition; fixed with a distinct `key` per branch, see
// lesson-document.tsx). This drives that same transition live and asserts
// no console error is logged.
test("adding an image via the builder's file picker produces no console errors, and shows thumbnail/alt/remove", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/admin/lesson-builder");
  await page.getByRole("button", { name: /^(Add|Create) lesson$/ }).first().click();
  const title = page.locator("[data-lesson-title]").last();
  await title.fill("Explanation image regression");
  const id = await title.getAttribute("data-lesson-title");
  await title.press("Enter");
  const row = page.locator(`[data-lesson-row="${id}"]`);
  const explanation = row.getByRole("textbox", { name: "Explanation 1" });
  await expect(explanation).toBeFocused();
  await page.keyboard.type("preparar es to prepare");

  // Before the image: the "Add image" file picker branch.
  await expect(row.getByRole("button", { name: "Add image" })).toBeVisible();

  const fileInput = row.locator(".lesson-document-image-add input[type='file']");
  await fileInput.setInputFiles({
    name: "preparar.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(svgFixture),
  });

  const thumb = row.locator(".lesson-document-image-thumb");
  await expect(thumb).toBeVisible();
  const altField = row.getByRole("textbox", { name: "Image alt text" });
  await expect(altField).toHaveValue("");
  await altField.fill("preparar to prepare");
  await expect(altField).toHaveValue("preparar to prepare");

  await page.screenshot({ path: "/tmp/claude-1000/explanation-image-builder-1280.png" });

  const uploadedSrc = await row.locator(".lesson-document-image-thumb").getAttribute("src");
  const uploadedFile = uploadedSrc?.split("/").pop();

  await row.getByRole("button", { name: "Remove image" }).click();
  await expect(thumb).toHaveCount(0);
  await expect(row.getByRole("button", { name: "Add image" })).toBeVisible();

  expect(consoleErrors, `console errors: ${consoleErrors.join("\n")}`).toEqual([]);

  if (uploadedFile) {
    await unlink(path.join(process.cwd(), "public", "lesson-media", uploadedFile)).catch(() => {});
  }
});
