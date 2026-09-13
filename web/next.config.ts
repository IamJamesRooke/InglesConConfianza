import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A separate dist dir lets the UX-check harness (tests/ux/) run its own
  // dev server on another port without tripping Next's single-instance lock
  // for a real dev server already running against this same project.
  ...(process.env.UX_CHECK_DIST_DIR
    ? { distDir: process.env.UX_CHECK_DIST_DIR }
    : {}),
};

export default nextConfig;
