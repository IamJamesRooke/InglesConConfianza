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
  off, `/admin/*` and `/api/admin/*` behave exactly as before.
- Set `ADMIN_SECRET`: every request to `/admin/*` or `/api/admin/*` must
  carry a cookie `icc_admin` equal to the secret. `/admin/*` without the
  cookie renders a minimal, English, Spanish-chrome-free login page
  ("Admin access — enter the secret") that posts to `/api/admin-login`;
  `/api/admin/*` without the cookie returns a 401 JSON body — no HTML,
  since these are called by `fetch` from admin UI, not navigated to.

Generate a secret with `npm run admin:secret` and paste it into `.env`.

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

## Environment variables

| Variable | Needed for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Admin only (curriculum database) | Not required for the learner build/runtime. |
| `GOOGLE_TTS_API_KEY` | `npm run audio:generate` only | Not needed at runtime once audio is generated and committed to `public/audio`. |
| `FEEDBACK_WEBHOOK_URL` | The feedback endpoint (`src/app/api/feedback`, built by another workstream) | Learner-facing; only needed where feedback is enabled. |
| `ADMIN_SECRET` | The admin guard | Optional; unset = guard off. See above. |

## Vercel steps

1. Import the repo into Vercel.
2. Set the project root to `web/` (this is a subdirectory of the git repo).
3. Set env vars as needed for the deploy's purpose — a read-only learner
   deploy needs none of the above by default (lessons/audio are bundled at
   build); set `FEEDBACK_WEBHOOK_URL` if feedback is enabled; only set
   `ADMIN_SECRET`/`DATABASE_URL` if admin is somehow reachable on that
   deploy (see "local-only" above — normally it should not be).
4. Build command: default (`next build` via `npm run build`, which runs
   `prisma generate` first via `prebuild`). No special static-export flags —
   this app is not statically exported, so `proxy` (and therefore the admin
   guard) applies to every deploy target Vercel builds from this repo.
