import "dotenv/config";

import assert from "node:assert/strict";
import test from "node:test";

import { auditDeterminerTopic } from "../scripts/audit-determiner-topic";
import { prisma } from "../src/lib/database/prisma";

test("the determiner topic is complete and clean", async (context) => {
  context.after(async () => {
    await prisma.$disconnect();
  });

  const { problems, missingEnglish } = await auditDeterminerTopic();
  assert.deepStrictEqual(
    problems,
    [],
    "topic:determiner concepts have structural problems (see curriculum:determiners:audit)",
  );
  assert.deepStrictEqual(
    missingEnglish,
    [],
    "English determiners with no Spanish source",
  );
});
