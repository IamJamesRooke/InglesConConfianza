import { defineConfig, devices } from "@playwright/test";
import os from "node:os";
import path from "node:path";

// Mechanical UX checks for the Lesson Builder: a scripted keyboard-driven
// authoring pass plus axe-core and click-target audits. Cheap to rerun after
// every change — no LLM tokens, no screenshots — so exploratory
// browser-driven sessions can stay reserved for genuinely new findings.
//
// Runs its own dev server on a separate port against an isolated,
// throwaway lessons file (outside the repo, in the OS temp dir) so it never
// touches real course data — safe to run anytime, including while someone
// is actively authoring lessons in the real app. Requires the curriculum
// database to be reachable (`npm run db:up`) for concept search, which is
// read-only here and shared safely.
// Overridable so parallel agent worktrees can each run their own isolated server.
const UX_CHECK_PORT = Number(process.env.UX_CHECK_PORT ?? 3100);
export const uxCheckLessonsPath = path.join(
  os.tmpdir(),
  `iccf-ux-check-lessons-${UX_CHECK_PORT}.json`,
);

export default defineConfig({
  testDir: "./tests/ux",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${UX_CHECK_PORT}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port " + UX_CHECK_PORT,
    url: `http://localhost:${UX_CHECK_PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      LESSON_BUILDER_DATA_PATH: uxCheckLessonsPath,
      UX_CHECK_DIST_DIR: `.next-ux-check-${UX_CHECK_PORT}`,
    },
  },
  globalSetup: "./tests/ux/global-setup.ts",
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
