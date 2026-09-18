import { NextResponse, type NextRequest } from "next/server";

import { timingSafeEqualStrings } from "@/lib/admin/secret-compare";

// Companion to src/proxy.ts's admin guard. Not under /api/admin (the guard
// matcher excludes this route on purpose — it's how you get the cookie in
// the first place).
const COOKIE_NAME = "icc_admin";
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

// Tiny brute-force friction: 10 attempts/minute per IP -> 429. In-memory,
// single-instance guard (same shape as the feedback route's limiter) — not
// abuse-hardening, just enough to slow down a naive secret-guessing script.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_MAX_KEYS = 1000;
const loginAttempts = new Map<string, number[]>();

function clientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  // Evict stale keys once the map grows large, so a flood of spoofed
  // X-Forwarded-For values can't grow this unbounded.
  if (loginAttempts.size > RATE_LIMIT_MAX_KEYS) {
    for (const [mapKey, timestamps] of loginAttempts) {
      const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (recent.length === 0) loginAttempts.delete(mapKey);
      else loginAttempts.set(mapKey, recent);
    }
  }
  const recent = (loginAttempts.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );
  recent.push(now);
  loginAttempts.set(key, recent);
  return recent.length > RATE_LIMIT_MAX;
}

function safeNextPath(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value : "";
  // Only ever redirect back within the app — never off-site. Reject
  // protocol-relative ("//host/...") and backslash-variant ("/\host/...")
  // forms too: some browsers treat a leading "/\" as "//" for the purposes
  // of resolving a scheme-relative URL.
  const isSameOriginPath =
    raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\");
  return isSameOriginPath ? raw : "/admin";
}

export async function POST(request: NextRequest) {
  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a minute." },
      { status: 429 },
    );
  }

  const secret = process.env.ADMIN_SECRET;
  const formData = await request.formData();
  const submitted = typeof formData.get("secret") === "string" ? String(formData.get("secret")) : "";
  const nextPath = safeNextPath(formData.get("next"));
  const destination = new URL(nextPath, request.url);

  if (!secret || !timingSafeEqualStrings(submitted, secret)) {
    // Wrong secret (or the guard got disabled mid-flight): send them back to
    // the same page, which will re-render the login form.
    return NextResponse.redirect(destination, { status: 303 });
  }

  const response = NextResponse.redirect(destination, { status: 303 });
  response.cookies.set(COOKIE_NAME, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: THIRTY_DAYS_SECONDS,
    path: "/",
  });
  return response;
}
