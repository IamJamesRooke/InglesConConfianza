import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isAdminDisabledInProduction } from "@/lib/admin/admin-disabled";
import { timingSafeEqualStrings } from "@/lib/admin/secret-compare";

// Belt-and-braces admin guard (docs/backlog.md "Admin guard",
// docs/engineering/deploy.md). Off entirely when ADMIN_SECRET is unset, so
// local dev needs no setup. When set, every request under /admin/* or
// /api/admin/* must carry a cookie `icc_admin` equal to the secret.
//
// This is Next.js 16's `proxy` file (the renamed `middleware` convention —
// see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
// and middleware.md, "deprecated ... renamed to proxy"). It defaults to the
// Node.js runtime in v16, but the guard logic below stays Edge-safe (no
// Node-only imports) in case that ever changes.
const COOKIE_NAME = "icc_admin";

function loginPageHtml(nextPath: string): string {
  const safeNext = nextPath.replace(/"/g, "&quot;");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Admin access</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root { color-scheme: light; }
  body {
    font-family: system-ui, -apple-system, sans-serif;
    background: #f4f5f7;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    margin: 0;
  }
  form {
    background: #fff;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 280px;
  }
  h1 { font-size: 1.05rem; margin: 0 0 0.5rem; font-weight: 600; }
  input[type="password"] {
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  button {
    padding: 0.5rem;
    font-size: 1rem;
    border: none;
    border-radius: 4px;
    background: #2563eb;
    color: #fff;
    cursor: pointer;
  }
  button:hover { background: #1d4ed8; }
</style>
</head>
<body>
<form method="post" action="/api/admin-login">
  <h1>Admin access — enter the secret</h1>
  <input type="hidden" name="next" value="${safeNext}" />
  <input type="password" name="secret" autofocus autocomplete="current-password" />
  <button type="submit">Continue</button>
</form>
</body>
</html>`;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Production safety net: an unset ADMIN_SECRET in production means the
  // belt-and-braces guard below is off too, so admin would be wide open if
  // it were ever reachable. Disable it outright instead — 404, not a login
  // page, so its existence isn't even signalled. See
  // docs/engineering/deploy.md.
  if (
    isAdminDisabledInProduction({
      NODE_ENV: process.env.NODE_ENV,
      ADMIN_SECRET: process.env.ADMIN_SECRET,
    })
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(COOKIE_NAME)?.value ?? "";
  const authorized = timingSafeEqualStrings(cookieValue, secret);

  if (pathname.startsWith("/api/admin")) {
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!authorized) {
      return new NextResponse(loginPageHtml(pathname), {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
