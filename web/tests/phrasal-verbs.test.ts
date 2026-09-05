import "dotenv/config";

import assert from "node:assert/strict";
import test from "node:test";

import { auditPhrasalVerbs } from "../scripts/audit-phrasal-verbs";
import { prisma } from "../src/lib/database/prisma";

test("phrasal and prepositional verbs are complete and clean", async (context) => {
  context.after(async () => {
    await prisma.$disconnect();
  });

  const { problems } = await auditPhrasalVerbs();
  assert.deepStrictEqual(
    problems,
    [],
    "phrasal-verb tagging has structural problems (npm run curriculum:audit:phrasal-verbs)",
  );
});
