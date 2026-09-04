import "dotenv/config";

import assert from "node:assert/strict";
import test from "node:test";

import { auditVerbConjugation } from "../scripts/audit-verb-conjugation";
import { prisma } from "../src/lib/database/prisma";

test("verb conjugation senses and paradigms are complete and clean", async (context) => {
  context.after(async () => {
    await prisma.$disconnect();
  });

  const { problems } = await auditVerbConjugation();
  assert.deepStrictEqual(
    problems,
    [],
    "verb sense/conjugation tagging has structural problems (npm run curriculum:audit:verbs)",
  );
});
