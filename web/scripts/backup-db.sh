#!/usr/bin/env bash
# Belt-and-suspenders local DB backup for the curriculum curation work.
# The canonical backup is web/prisma/seed-data/*.json, committed every batch;
# this adds a timestamped local pg_dump + snapshot copy under <repo>/backups/db/.
set -euo pipefail
cd "$(dirname "$0")/../.."        # repo root
TS=$(date +%Y%m%d-%H%M%S)
mkdir -p backups/db
cp web/prisma/seed-data/curriculum.json         "backups/db/curriculum-$TS.json"
cp web/prisma/seed-data/curriculum-sources.json "backups/db/curriculum-sources-$TS.json"
git rev-parse HEAD > "backups/db/curriculum-$TS.commit"
CID=$(docker ps --filter name=postgres -q | head -1 || true)
if [ -n "${CID:-}" ]; then
  docker exec "$CID" pg_dump -U ingles -d ingles_con_confianza --no-owner \
    | gzip > "backups/db/pgdump-$TS.sql.gz"
  echo "pg_dump  -> backups/db/pgdump-$TS.sql.gz"
fi
# keep only the 20 most recent of each kind
for pat in 'pgdump-*.sql.gz' 'curriculum-2*.json' 'curriculum-sources-*.json' 'curriculum-2*.commit'; do
  ls -1t backups/db/$pat 2>/dev/null | tail -n +21 | xargs -r rm
done
echo "snapshot + commit ref -> backups/db/*-$TS.*"
