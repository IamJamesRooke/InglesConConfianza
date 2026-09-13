import { rm } from "node:fs/promises";

import { uxCheckLessonsPath } from "../../playwright.config";

// Start every UX-check run from a clean, empty course — the app bootstraps
// an empty lessons file on first read (see lesson-store.ts's ENOENT
// fallback), so deleting any leftover fixture here is enough.
export default async function globalSetup() {
  await rm(uxCheckLessonsPath, { force: true });
}
