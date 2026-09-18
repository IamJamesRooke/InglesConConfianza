// Production safety net for the admin guard (see docs/engineering/deploy.md
// "Admin: local-only, plus a guard as belt and braces"). The admin surfaces
// are meant to run locally only; ADMIN_SECRET is a second line of defense in
// case they're ever reachable on a public deploy. But an unset ADMIN_SECRET
// in production would leave that second line of defense OFF too — this
// function is the single decision point for whether that combination should
// disable admin entirely (return 404) rather than leave it open.
//
// Kept as a small pure function (rather than inlined in proxy.ts) so it can
// be unit-tested without spinning up the Edge runtime.
export function isAdminDisabledInProduction(env: {
  NODE_ENV?: string;
  ADMIN_SECRET?: string;
}): boolean {
  return env.NODE_ENV === "production" && !env.ADMIN_SECRET;
}
