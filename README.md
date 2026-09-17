# Inglés con Confianza

## What the project is

Inglés con Confianza is an English-learning application for Spanish-speaking adults. It helps learners turn familiar Spanish ideas into useful English sentences through short explanations, immediate practice, and cumulative sentence building.

The learner experience focuses on production rather than recognition. Lessons ask for English, give non-punitive feedback and help, and finish by showing the learner a sentence they can now say. The project is currently preparing a pre-alpha with one larger Confianza I lesson while the owner continues curating the Level 1 curriculum.

## Local setup

Requirements:

- Node.js `24` (`.nvmrc`; `web/package.json` requires `>=24 <25`)
- Docker with Docker Compose, for local PostgreSQL

From the repository root:

```sh
cd web
npm install
cp .env.example .env
npm run db:up
```

Set these variables in `web/.env` as needed. Use local or private values; do not commit the file.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL used by Prisma and curriculum features. |
| `LESSON_BUILDER_DATA_PATH` | Optional path to a lessons JSON file; useful for isolated checks or alternate local data. |
| `GOOGLE_TTS_API_KEY` | Optional Google Cloud Text-to-Speech key for generating audio clips. |

The learner app can use browser speech when no Google TTS key or generated clips are available. Keep PostgreSQL running when using curriculum search and authoring features.

## Running

From `web/`:

```sh
npm run dev
```

- Learner site: [http://localhost:3000/](http://localhost:3000/)
- Lesson Builder: [http://localhost:3000/admin/lesson-builder](http://localhost:3000/admin/lesson-builder)
- Curriculum admin: [http://localhost:3000/admin/curriculum](http://localhost:3000/admin/curriculum)

## Checks

Run from `web/`:

```sh
npm run lint
npm run test:unit
npm run ux:check
npm run build
```

`ux:check` starts its own isolated server on a separate port and uses a throwaway lessons file; it does not use the owner's live authoring data.

## Generating audio

From `web/`:

```sh
npm run audio:generate
```

The command reads authored lessons, generates missing clips for the configured speakers when `GOOGLE_TTS_API_KEY` is available, and writes them under `web/public/audio`. Generated clips and the audio manifest are deploy assets and are committed to the repository. Without the key, the command reports what it would generate and the app falls back to browser speech.

## Repository map

| Path | Contents |
| --- | --- |
| `docs/` | Product, teaching, curriculum, design, and engineering documentation. |
| `web/src/app` | Next.js routes, pages, and API handlers. |
| `web/src/components` | Shared learner, practice, and admin UI components. |
| `web/src/lib` | Server and client application logic, including curriculum and lesson-builder code. |
| `web/data/lessons.json` | Handcrafted Lesson Builder store. Do not edit it by hand. |
| `web/prisma` | Prisma schema, migrations, seeds, and curriculum snapshots for PostgreSQL. |

## Deploy shape (planned)

The planned pre-alpha deployment is a read-only learner site with lessons and generated audio bundled at build time. The admin remains local-only: author, commit, and redeploy. One feedback function will collect learner feedback without making the admin public. Learner progress remains local to the browser; accounts and server-side learner history are not part of this shape.
