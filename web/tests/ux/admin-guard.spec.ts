import { expect, test } from "@playwright/test";

// Runs the isolated UX-check server with ADMIN_SECRET set (see
// playwright.config.ts, which forwards it into the webServer env). Run with:
//   UX_CHECK_PORT=3223 ADMIN_SECRET=test-secret npx playwright test tests/ux/admin-guard.spec.ts
// Separately confirm the guard is OFF by default: from-zero.spec.ts still
// passes on a port with no ADMIN_SECRET set (e.g. UX_CHECK_PORT=3224).
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";

test.describe("admin guard", () => {
  test.skip(!ADMIN_SECRET, "requires ADMIN_SECRET to be set for this run");

  test("shows the login page for /admin/lesson-builder without the cookie", async ({ page }) => {
    await page.goto("/admin/lesson-builder");
    await expect(page.getByRole("heading", { name: "Admin access — enter the secret" })).toBeVisible();
  });

  test("wrong secret stays on the login page", async ({ page }) => {
    await page.goto("/admin/lesson-builder");
    await page.locator('input[name="secret"]').fill("not-the-secret");
    await page.locator('button[type="submit"]').click();
    await expect(page.getByRole("heading", { name: "Admin access — enter the secret" })).toBeVisible();
  });

  test("right secret sets the cookie and reaches the builder", async ({ page, context }) => {
    await page.goto("/admin/lesson-builder");
    await page.locator('input[name="secret"]').fill(ADMIN_SECRET);
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain("/admin/lesson-builder");

    const cookies = await context.cookies();
    const adminCookie = cookies.find((cookie) => cookie.name === "icc_admin");
    expect(adminCookie?.value).toBe(ADMIN_SECRET);
  });

  test("/api/admin/lesson-builder/lessons is 401 without the cookie", async ({ request }) => {
    const response = await request.get("/api/admin/lesson-builder/lessons");
    expect(response.status()).toBe(401);
  });
});
