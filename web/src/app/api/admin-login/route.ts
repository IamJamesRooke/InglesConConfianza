import { NextResponse } from "next/server";

import { timingSafeEqualStrings } from "@/lib/admin/secret-compare";

// Companion to src/proxy.ts's admin guard. Not under /api/admin (the guard
// matcher excludes this route on purpose — it's how you get the cookie in
// the first place).
const COOKIE_NAME = "icc_admin";
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

function safeNextPath(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value : "";
  // Only ever redirect back within the app — never off-site.
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/admin";
}

export async function POST(request: Request) {
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
