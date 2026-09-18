import assert from "node:assert/strict";
import test from "node:test";

// The public deployment has no DATABASE_URL (docs/engineering/deploy.md —
// the curriculum database is admin-only). Importing src/lib/database/prisma
// must never throw just because DATABASE_URL is unset — Next's page-data
// collection imports every module a route touches (even transitively, e.g.
// via concept-display.ts from the /practice page) just to build the route,
// long before any request runs a query. Only *using* the client without a
// DATABASE_URL should throw, and only at that point.
//
// This suite manipulates process.env.DATABASE_URL directly and re-imports
// the module fresh each time (via a cache-busting query string) so each
// case starts from a clean module-level Proxy/cache state.

const MODULE_PATH = "../../src/lib/database/prisma";

async function freshImport() {
  return import(`${MODULE_PATH}?t=${Date.now()}-${Math.random()}`);
}

test("importing the prisma module never throws, with or without DATABASE_URL", async () => {
  const original = process.env.DATABASE_URL;
  try {
    delete process.env.DATABASE_URL;
    await assert.doesNotReject(freshImport());

    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    await assert.doesNotReject(freshImport());
  } finally {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
  }
});

test("hasDatabase() reflects DATABASE_URL presence", async () => {
  const original = process.env.DATABASE_URL;
  try {
    delete process.env.DATABASE_URL;
    const { hasDatabase: hasDatabaseUnset } = await freshImport();
    assert.equal(hasDatabaseUnset(), false);

    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    const { hasDatabase: hasDatabaseSet } = await freshImport();
    assert.equal(hasDatabaseSet(), true);
  } finally {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
  }
});

test("using the client without DATABASE_URL throws only on first use, not on import", async () => {
  const original = process.env.DATABASE_URL;
  try {
    delete process.env.DATABASE_URL;
    const { prisma } = await freshImport();
    // Any property access forwards through the Proxy to the lazily-created
    // real client, which is where the throw happens.
    assert.throws(
      () => prisma.curriculumConcept,
      /DATABASE_URL is required/,
    );
  } finally {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
  }
});
