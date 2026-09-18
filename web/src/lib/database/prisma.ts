import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  curriculumPrisma?: PrismaClient;
};

// The public deployment has no DATABASE_URL by design (docs/engineering/
// deploy.md — the learner site never needs the curriculum database). This
// module must therefore be SAFE TO IMPORT with no DATABASE_URL: Next's page
// data collection imports every module a route touches (even transitively,
// e.g. concept-display.ts from the /practice page) just to build the route,
// long before any request actually runs. Throwing here at import time would
// fail the build itself, not just the admin-only calls that really need a
// database.
//
// So the real client is created lazily, only when a caller first touches a
// property on `prisma` (a Prisma query, `$queryRaw`, etc.) — and it throws
// only then, not on import. `hasDatabase()` lets a caller check first and
// degrade gracefully instead of hitting that throw.
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is required. This deployment has no curriculum " +
        "database configured (docs/engineering/deploy.md) — this code path " +
        "should have checked hasDatabase() first.",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.curriculumPrisma) {
    const client = createPrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.curriculumPrisma = client;
    } else {
      return client;
    }
  }
  return globalForPrisma.curriculumPrisma;
}

// A Proxy over the lazily-created client: every property access/method call
// forwards to the real PrismaClient, created (and cached, in dev) on first
// use. Importing this module never creates a client and never throws;
// `prisma.curriculumConcept.findMany(...)` etc. throw only when actually
// called without a DATABASE_URL. Keeps the exported name and type identical
// to a plain `PrismaClient` so no caller needs to change.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrismaClient();
    return Reflect.get(client as object, property, receiver);
  },
});
