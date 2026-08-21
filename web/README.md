# Inglés Con Confianza web application

The Next.js application uses PostgreSQL for approved curriculum concepts and curriculum review history. Lesson Builder and Practice still use `data/lessons.json`; they are intentionally outside this database migration.

## Local setup

Use Node 24 and Docker:

```bash
nvm use
npm install
cp .env.example .env
npm run db:up
npm run db:deploy
npm run db:seed
npm run db:verify
npm run dev
```

`db:seed` imports the immutable snapshots under `prisma/seed-data/` and refuses to run when curriculum tables contain data. `db:verify` reconstructs the complete curriculum and review data from PostgreSQL and compares it with those snapshots. `db:down` stops PostgreSQL without deleting its named volume.

Use `npm run db:migrate -- --name <migration-name>` when changing the Prisma schema and `npm run db:studio` for local database inspection.

## Curriculum review workflow

A new audit batch is a temporary JSON object matching `ReviewBatch`. Validate it without writing first, then import it:

```bash
npm run curriculum:review:import -- --file /path/to/batch.json
npm run curriculum:review:import -- --file /path/to/batch.json --apply
```

After the owner reviews candidates in the Review inbox, validate and apply the approved candidates transactionally:

```bash
npm run curriculum:migrate -- --batch <batch-id>
npm run curriculum:migrate -- --batch <batch-id> --apply
```

Both commands default to a rollback-only dry run. Curriculum migration includes only approved, non-deleted, non-migrated candidates and marks the batch complete only when no unresolved candidates remain.

## Validation

```bash
npm run lint
npm run build
npm run db:test
npm audit
```
