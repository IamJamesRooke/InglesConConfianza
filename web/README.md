# Ingles Con Confianza web application

The Next.js application uses PostgreSQL for canonical curriculum concepts, collections, and immutable source provenance. Lesson Builder and Practice use `data/lessons.json`; that boundary remains intentional while Module 1 proves the lesson contract.

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

`db:seed` imports the immutable snapshots under `prisma/seed-data/` and refuses to run when curriculum tables already contain data. `db:verify` reconstructs the complete PostgreSQL curriculum state and compares it with those snapshots. `db:down` stops PostgreSQL without deleting its named volume.

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

## Curation manifests

Bulk curation is applied from reviewed TSV manifests. Both commands default to a
dry run and take `--apply` to write, transactionally, and re-clean orphan
collections afterward.

`curriculum:roles:apply` moves concepts between the `core`, `supporting`,
`reference`, and `trash` tiers. Each line is `concept-id`, new role, and a reason:

```bash
npm run curriculum:roles:apply -- manifest.tsv
npm run curriculum:roles:apply -- manifest.tsv --apply
```

`curriculum:concepts:apply` rewrites a concept's `spanish`, `english`, role, and
adds collections. Each line is `concept-id`, spanish, english, role,
`|`-separated collections to add, and a reason. It guards the unique
`(spanish, english)` constraint before writing:

```bash
npm run curriculum:concepts:apply -- manifest.tsv
npm run curriculum:concepts:apply -- manifest.tsv --apply
```

Record each applied manifest under `docs/curation/` with its per-row rationale.

Deletion is deferred: set a concept's role to `trash`, review the
`/curriculum?role=trash` filter, then bulk-delete the survivors from the
Curriculum table. Nothing is lost until that final delete.

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
