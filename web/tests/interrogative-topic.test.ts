import "dotenv/config";

import assert from "node:assert/strict";
import test from "node:test";

import { auditInterrogativeTopic } from "../scripts/audit-interrogative-topic";
import { prisma } from "../src/lib/database/prisma";

test("the interrogative topic is complete and clean", async (context) => {
  context.after(async () => {
    await prisma.$disconnect();
  });

  const { problems, missingEnglish } = await auditInterrogativeTopic();
  assert.deepStrictEqual(problems, [], "topic:interrogative concepts have structural problems");
  assert.deepStrictEqual(missingEnglish, [], "English interrogatives with no Spanish source");
});
