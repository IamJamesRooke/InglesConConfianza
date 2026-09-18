import { execSync } from "node:child_process";
import type { NextConfig } from "next";

// Build-time app version for feedback metadata (docs/engineering/feedback.md)
// — the short git sha of the commit being built, so a triage note can be
// matched to the code that produced it. Falls back to "dev" when there's no
// git repo available (a bare checkout, some deploy environments).
function appVersion(): string {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || appVersion(),
  },
  // A separate dist dir lets the UX-check harness (tests/ux/) run its own
  // dev server on another port without tripping Next's single-instance lock
  // for a real dev server already running against this same project.
  ...(process.env.UX_CHECK_DIST_DIR
    ? { distDir: process.env.UX_CHECK_DIST_DIR }
    : {}),
  // Baseline security headers (pre-deploy review, docs/engineering/deploy.md)
  // on every route. No Content-Security-Policy yet — this app relies on
  // Next's own inline styles and Google Fonts, so a CSP needs `self` plus
  // `fonts.googleapis.com`/`fonts.gstatic.com` and `'unsafe-inline'` (or a
  // nonce plumbed through Next's style injection) before it can be added
  // without breaking the app; left for a follow-up.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
