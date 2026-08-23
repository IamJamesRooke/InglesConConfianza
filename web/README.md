# Ingles Con Confianza web application

The Next.js application uses PostgreSQL for canonical curriculum concepts, collections, review history, and immutable source provenance. Lesson Builder and Practice use `data/lessons.json`; that boundary remains intentional while Module 1 proves the lesson contract.

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

`db:seed` imports the immutable snapshots under `prisma/seed-data/` and refuses to run when curriculum tables already contain data. `db:verify` reconstructs the complete PostgreSQL curriculum and review state and compares it with those snapshots. `db:down` stops PostgreSQL without deleting its named volume.

Use `npm run db:migrate -- --name <migration-name>` when changing the Prisma schema and `npm run db:studio` for direct local inspection.

## Curriculum curation

The Curriculum page supports bilingual search, exact role and collection filters, pagination, inline editing, role changes, collection editing, and deletion. Work in bounded batches and avoid concurrent edits from the UI and another database-writing process.

After an approved curation batch, export and verify the immutable snapshots:

```bash
npm run curriculum:snapshots:export
npm run curriculum:snapshots:export -- --apply
npm run db:verify
npm run db:test
```

The first export command is a dry run. The second writes the snapshots.

## Guarded additions and revisions

Review batches remain the protected path for proposing new concepts or bulk revisions. Preflight a temporary `ReviewBatch` JSON file before importing it:

```bash
npm run curriculum:review:preflight -- --file /path/to/batch.json
npm run curriculum:review:import -- --file /path/to/batch.json
npm run curriculum:review:import -- --file /path/to/batch.json --apply
```

Inspect the candidates in Review inbox, then apply only approved, non-deleted candidates transactionally:

```bash
npm run curriculum:migrate -- --batch <batch-id>
npm run curriculum:migrate -- --batch <batch-id> --apply
```

These commands default to rollback-only dry runs. The historical database field is still named `migrated`; in the current workflow it means that an approved review candidate was applied to the canonical curriculum.

## Source provenance

The retired Markdown curriculum is preserved as immutable database provenance. Inspect it without restoring the old filesystem hierarchy:

```bash
npm run curriculum:sources:inventory
npm run curriculum:sources:query -- --search <text>
```

## Validation

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run db:test
npm run db:verify
npm audit
```
