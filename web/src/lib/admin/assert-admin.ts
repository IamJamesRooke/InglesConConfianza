import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isAdminDisabledInProduction } from "@/lib/admin/admin-disabled";
import { isAdminRequestAllowed } from "@/lib/admin/is-admin-request-allowed";

// Defence in depth for the admin surfaces. src/proxy.ts is the belt-and-braces
// guard on *paths* (/admin/:path*, /api/admin/:path*), but Next.js's own
// guidance (node_modules/next/dist/docs/01-app/02-guides/authentication.md,
// "Server Actions") is to authorize inside every Server Action too, because
// actions are addressed by an opaque id baked into the client bundle, not by
// the path the guard matches on. The nine mutating route handlers under
// src/app/api/admin/** also currently trust the proxy alone; this module lets
// each of them check for itself, so a matcher typo or a future refactor of
// proxy.ts can't silently strip the only check in front of a DB write.
//
// The actual decision logic lives in is-admin-request-allowed.ts, which stays
// free of `next/headers`/`next/server` so proxy.ts (Edge) can import it
// directly. This file is the async, request-aware wrapper around it, and is
// marked `server-only` so it can never end up in a client bundle.
export { isAdminRequestAllowed } from "@/lib/admin/is-admin-request-allowed";

const COOKIE_NAME = "icc_admin";

export class AdminForbiddenError extends Error {
  constructor() {
    super("Admin access denied.");
    this.name = "AdminForbiddenError";
  }
}

async function readAdminCookieValue(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? "";
}

// For Server Actions: throws when the caller isn't an authorized admin.
// Call this as the very first statement of every "use server" action that
// reads or writes admin-only data.
export async function assertAdmin(): Promise<void> {
  const allowed = isAdminRequestAllowed({
    nodeEnv: process.env.NODE_ENV,
    adminSecret: process.env.ADMIN_SECRET,
    cookieValue: await readAdminCookieValue(),
  });

  if (!allowed) {
    throw new AdminForbiddenError();
  }
}

// For Route Handlers: returns a response to send back immediately (and
// `null` when the request is authorized to proceed). Mirrors proxy.ts's own
// responses so a handler that somehow runs without the proxy in front of it
// (e.g. a future rewrite of the matcher) fails exactly the same way: 404
// when admin is disabled in production, 401 JSON when the cookie is wrong.
export async function adminGuardResponse(): Promise<NextResponse | null> {
  const nodeEnv = process.env.NODE_ENV;
  const adminSecret = process.env.ADMIN_SECRET;

  if (isAdminDisabledInProduction({ NODE_ENV: nodeEnv, ADMIN_SECRET: adminSecret })) {
    return new NextResponse(null, { status: 404 });
  }

  const cookieValue = await readAdminCookieValue();
  const allowed = isAdminRequestAllowed({ nodeEnv, adminSecret, cookieValue });

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
