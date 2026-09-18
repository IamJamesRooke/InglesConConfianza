import { NextResponse, type NextRequest } from "next/server";

import { timingSafeEqualStrings } from "@/lib/admin/secret-compare";
import { clientKeyFromHeaders, createRateLimiter } from "@/lib/rate-limit";

// Companion to src/proxy.ts's admin guard. Not under /api/admin (the guard
// matcher excludes this route on purpose — it's how you get the cookie in
// the first place).
const COOKIE_NAME = "icc_admin";
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

// Tiny brute-force friction: 10 attempts/minute per IP -> 429. In-memory,
// single-instance guard (shared limiter shape with the feedback route) —
// not abuse-hardening, just enough to slow down a naive secret-guessing
// script.
const loginLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

function clientKey(request: NextRequest): string {
  return clientKeyFromHeaders(request.headers);
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
  if (loginLimiter.isRateLimited(clientKey(request))) {
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
