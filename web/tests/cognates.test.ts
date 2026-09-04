import "dotenv/config";

import assert from "node:assert/strict";
import test from "node:test";

import { auditCognates } from "../scripts/audit-cognates";
import { prisma } from "../src/lib/database/prisma";

test("cognate patterns and families are complete and clean", async (context) => {
  context.after(async () => {
    await prisma.$disconnect();
  });

  const { problems } = await auditCognates();
  assert.deepStrictEqual(
    problems,
    [],
    "cognate tagging has structural problems (npm run curriculum:audit:cognates)",
  );
});
