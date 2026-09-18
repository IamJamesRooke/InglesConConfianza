import "dotenv/config";

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // The public deployment has no DATABASE_URL on purpose (docs/engineering/
    // deploy.md). `prisma generate` never connects, so a placeholder lets the
    // client be generated there; anything that really needs the database
    // (migrate, seed, studio) still fails loudly against it.
    url:
      process.env.DATABASE_URL ??
      "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
