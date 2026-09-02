import "dotenv/config";

import assert from "node:assert/strict";
import test from "node:test";

import { auditPronounTopic } from "../scripts/audit-pronoun-topic";
import { prisma } from "../src/lib/database/prisma";

test("the pronoun topic is complete and clean", async (context) => {
  context.after(async () => {
    await prisma.$disconnect();
  });

  const { problems, missingEnglish } = await auditPronounTopic();
  assert.deepStrictEqual(
    problems,
    [],
    "topic:pronoun concepts have structural problems (see curriculum:pronouns:audit)",
  );
  assert.deepStrictEqual(
    missingEnglish,
    [],
    "English pronouns with no Spanish source",
  );
});
