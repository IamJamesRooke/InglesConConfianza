import { test as base, expect } from "@playwright/test";
import { rm } from "node:fs/promises";
import { uxCheckLessonsPath } from "../../playwright.config";

// Every case gets an empty throwaway course. A failed cleanup must not leak
// lessons, selected-module assumptions, or stale answer arrays into later cases.
// The config deliberately uses one worker and a separate server/store; this
// never removes the owner's web/data/lessons.json.
export const test = base.extend<{ isolatedLessonStore: void }>({
  isolatedLessonStore: [async ({ request }, use) => {
    // Ensure the isolated web server is ready before resetting its file. Each
    // test's browser context is created afterwards and cannot queue old writes.
    await request.get("/api/admin/lesson-builder/lessons");
    await rm(uxCheckLessonsPath, { force: true });
    await use();
  }, { auto: true }],
});

export { expect };
