import { isAdminDisabledInProduction } from "@/lib/admin/admin-disabled";
import { timingSafeEqualStrings } from "@/lib/admin/secret-compare";

// The single source of truth for "is this admin request allowed", shared by
// src/proxy.ts (which must stay Edge-safe — no `next/headers`, no
// `server-only`) and src/lib/admin/assert-admin.ts (which wraps this for
// Server Actions and Route Handlers). Kept in its own file, separate from
// assert-admin.ts, specifically so proxy.ts can import *only* this pure
// function without pulling `next/headers`/`next/server` into its bundle.
//
// Rules, mirroring the old proxy.ts logic exactly:
//   - secret unset + not production -> allowed (local dev, zero setup)
//   - secret unset + production     -> NOT allowed (see admin-disabled.ts)
//   - secret set                    -> allowed only when the cookie
//                                       constant-time-equals the secret
export function isAdminRequestAllowed({
  nodeEnv,
  adminSecret,
  cookieValue,
}: {
  nodeEnv: string | undefined;
  adminSecret: string | undefined;
  cookieValue: string;
}): boolean {
  if (isAdminDisabledInProduction({ NODE_ENV: nodeEnv, ADMIN_SECRET: adminSecret })) {
    return false;
  }

  if (!adminSecret) {
    return true;
  }

  return timingSafeEqualStrings(cookieValue, adminSecret);
}
