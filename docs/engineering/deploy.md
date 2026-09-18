# Deploy shape

Decided 2026-09-17, alongside the admin guard (`docs/backlog.md` "Admin
guard").

## Learner site: read-only, static-ish

The public learner app is read-only against data baked in at build time:

- `web/data/lessons.json` — the Lesson Builder's store, bundled into the
  build. Learners never write to it; there is no runtime database write path
  on the learner side.
- `public/audio` — generated TTS clips (`npm run audio:generate`), bundled
  as static files.

The curriculum database (PostgreSQL, `DATABASE_URL`) is only read by admin
surfaces (`/admin/curriculum`, concept search in the Lesson Builder). The
learner app itself does not need `DATABASE_URL` at request time; it only
needs the JSON/audio files already in the build output.

## Admin: local-only, plus a guard as belt and braces

The admin tools (`/admin/lesson-builder`, `/admin/curriculum`, and their
`/api/admin/*` routes) are meant to run **locally only** — the owner authors
against their own Postgres and `web/data/lessons.json`, then re-exports/
re-builds for the public deploy. They are not meant to be reachable on the
public deploy at all.

The `ADMIN_SECRET` guard (`web/src/proxy.ts`, `web/src/app/api/admin-login/route.ts`)
exists as a second line of defense in case `/admin` and `/api/admin` are ever
accidentally reachable on a public deploy — e.g. someone forgets to gate them
at the hosting layer, or a future change exposes the admin routes by
mistake. It is not the primary control; not deploying admin publicly is.

- Unset `ADMIN_SECRET` (the default, including all local dev): the guard is
  off, `/admin/*` and `/api/admin/*` behave exactly as before — **except**
  in production (see "Production safety net" below).
- Set `ADMIN_SECRET`: every request to `/admin/*` or `/api/admin/*` must
  carry a cookie `icc_admin` equal to the secret. `/admin/*` without the
  cookie renders a minimal, English, Spanish-chrome-free login page
  ("Admin access — enter the secret") that posts to `/api/admin-login`;
  `/api/admin/*` without the cookie returns a 401 JSON body — no HTML,
  since these are called by `fetch` from admin UI, not navigated to.
  `/api/admin-login` itself is rate-limited (10 attempts/minute per IP,
  429 past that) as brute-force friction on the secret.

Generate a secret with `npm run admin:secret` and paste it into `.env`.

### Production safety net: unset `ADMIN_SECRET` in production disables admin

An unset `ADMIN_SECRET` normally means "guard off" — fine for local dev,
where reaching `/admin` at all requires deliberately running the app. But if
the admin routes were ever accidentally reachable on a **production**
deploy (`NODE_ENV === "production"`) with no secret configured, "guard off"
would mean "wide open to the internet" — the opposite of "belt and braces".

So the decision is inverted for that one combination: when
`NODE_ENV === "production"` and `ADMIN_SECRET` is unset, `proxy.ts` returns
a bare 404 for every `/admin/*` and `/api/admin/*` request instead of
`NextResponse.next()` — admin is disabled outright, not merely unguarded.
Setting `ADMIN_SECRET` in that same production environment re-enables it,
guarded as usual. The decision itself is a small pure function,
`isAdminDisabledInProduction` in `web/src/lib/admin/admin-disabled.ts`,
unit-tested in `web/tests/unit/admin-disabled.test.ts` so the logic doesn't
depend on the Edge runtime to verify.

### Mechanism: Next.js 16 `proxy` (not `middleware`)

Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts` — same
location (project root, or alongside `app/` when that lives under `src/`),
same capabilities, same `matcher` config; only the file and export name
changed. See `web/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
("Migration to Proxy") and the (now-stub) `middleware.md` in the same
directory, which just points here. The guard is implemented as
`web/src/proxy.ts`, matched to `/admin/:path*` and `/api/admin/:path*`.

**Static-export constraint found while implementing this**: `proxy`/
`middleware` does not run at all under Next's static export output — see
the proxy doc's "Platform support" table (`Static export: No`). This repo
does not set `output: "export"` in `next.config.ts` (the config only sets
`distDir` for isolated UX-check servers), so the guard runs normally on a
standard Node.js/Vercel deploy. If the project ever moves the learner site
to a static export while keeping admin in the same Next app, the guard
would need a different mechanism (e.g. hosting-layer auth, or splitting
admin into its own always-server-rendered app) — proxy-based gating alone
would silently stop protecting statically-exported routes.

### `/api/admin-login` is intentionally outside the guarded prefix

It lives at `/api/admin-login`, not `/api/admin/login`, specifically so the
guard's `/api/admin/:path*` matcher does not also gate the one route that
issues the cookie in the first place.

## Defence in depth: the guard isn't the only check

`proxy.ts`'s matcher (`/admin/:path*`, `/api/admin/:path*`) was, until now,
the *only* thing standing between a request and an admin-only read or write —
every route handler and Server Action underneath it trusted the proxy alone.
That's a single point of failure: Next.js's own guidance
(`web/node_modules/next/dist/docs/01-app/02-guides/authentication.md`,
"Server Actions") is to authorize *inside* every Server Action too, because
actions are invoked by an opaque id baked into the client bundle, not routed
through the path the proxy matches on — a refactor of the matcher, or a
Server Action reused from an unguarded page, would silently drop the only
check in front of a database write.

So the decision logic now has one pure source of truth,
`isAdminRequestAllowed` in `web/src/lib/admin/is-admin-request-allowed.ts`
(unit-tested in `web/tests/unit/assert-admin.test.ts`), used three ways:

- `proxy.ts` calls it directly (it has no `next/headers`/`next/server`
  import, so it stays Edge-safe).
- `web/src/lib/admin/assert-admin.ts` wraps it as `assertAdmin()` — throws
  an `AdminForbiddenError` — for Server Actions. Both curriculum "set level
  in place" actions (`web/src/lib/curriculum/server/set-level-inline.ts`)
  call it as their first statement.
- The same file also wraps it as `adminGuardResponse()` — returns a 404 (admin
  disabled in production) or 401 JSON response, or `null` to proceed — for
  Route Handlers. Every exported handler (GET included: reading the
  curriculum is admin-only too) under `web/src/app/api/admin/**` calls it
  first, except `/api/admin-login` and `/api/feedback`, which are public by
  design.

Explicit deploy rule: **never set `DATABASE_URL` on the public deployment;
the learner site does not need it** (see "Learner site: read-only" above —
it reads only the build-time JSON/audio files). Setting it there would let a
Server Action that ever slipped past its guard reach a real database from a
public deploy.

## `/` and `/practice` are dynamically rendered

Both routes call the onboarding gate's server helper
(`redirectToOnboardingIfNeeded`, `web/src/lib/learner/onboarding-gate-server.ts`),
which reads `cookies()` (the `icc_onboarded` hint) before deciding whether
to `redirect("/bienvenida")` — see `docs/design/onboarding.md` §1. Reading
`cookies()` in a page opts it into dynamic rendering regardless of any
`export const dynamic` already set (both routes already declared
`"force-dynamic"` for other reasons, e.g. reading the lesson file live).
`/bienvenida` reads no cookies itself (its own reconcile check is
client-side) but stays dynamic too, since the course it hosts changes with
every builder edit.

## Environment variables

| Variable | Needed for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Admin only (curriculum database) | Not required for the learner build/runtime. |
| `GOOGLE_TTS_API_KEY` | `npm run audio:generate` only | Not needed at runtime once audio is generated and committed to `public/audio`. |
| `FEEDBACK_WEBHOOK_URL` | The feedback endpoint (`src/app/api/feedback`) | Learner-facing; superseded by the two GitHub vars below when both are set — see `docs/engineering/feedback.md`. |
| `FEEDBACK_GITHUB_TOKEN` | The feedback endpoint | **Sensitive.** A fine-grained GitHub personal access token scoped to exactly one private repo — the feedback repo (`IamJamesRooke/InglesConConfianza-feedback`), NEVER the public project repo — with only the "Issues: Read and write" repository permission. The owner creates this himself and pastes it into Vercel; it is never committed. |
| `FEEDBACK_GITHUB_REPO` | The feedback endpoint | `owner/name` of that same private feedback repo. Both this and the token must be set together, or the route falls back to `FEEDBACK_WEBHOOK_URL`/local jsonl. |
| `ADMIN_SECRET` | The admin guard | Optional; unset = guard off. See above. |

## Vercel steps

1. Import the repo into Vercel.
2. Set the project root to `web/` (this is a subdirectory of the git repo).
3. Set env vars as needed for the deploy's purpose — a read-only learner
   deploy needs none of the above by default (lessons/audio are bundled at
   build); set `FEEDBACK_GITHUB_TOKEN` + `FEEDBACK_GITHUB_REPO` (or
   `FEEDBACK_WEBHOOK_URL`) if feedback is enabled; only set
   `ADMIN_SECRET`/`DATABASE_URL` if admin is somehow reachable on that
   deploy (see "local-only" above — normally it should not be).
4. Build command: default (`next build` via `npm run build`, which runs
   `prisma generate` first via `prebuild`). No special static-export flags —
   this app is not statically exported, so `proxy` (and therefore the admin
   guard) applies to every deploy target Vercel builds from this repo.

## Baseline security headers

`web/next.config.ts`'s `headers()` adds these to every route:
`X-Content-Type-Options: nosniff`, `Referrer-Policy:
strict-origin-when-cross-origin`, `X-Frame-Options: DENY`,
`Permissions-Policy: camera=(), microphone=(), geolocation=()`.

No `Content-Security-Policy` yet. A CSP for this app would need at least
`default-src 'self'`, `font-src fonts.gstatic.com`, `style-src 'self'
fonts.googleapis.com 'unsafe-inline'` (Next injects inline `<style>` tags for
its own runtime CSS unless a nonce is plumbed through), and `connect-src
'self'` (the learner app makes no cross-origin fetches at runtime; the admin
Lesson Builder only calls its own `/api/admin/*` routes). Left for a
follow-up rather than added speculatively.
