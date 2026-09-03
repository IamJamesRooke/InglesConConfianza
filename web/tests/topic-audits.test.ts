import "dotenv/config";

import assert from "node:assert/strict";
import test from "node:test";

import { auditTopic, TOPIC_AUDIT_SPECS } from "../scripts/topic-audit";
import { prisma } from "../src/lib/database/prisma";

test("every curriculum topic is complete and clean", async (context) => {
  context.after(async () => {
    await prisma.$disconnect();
  });

  for (const spec of TOPIC_AUDIT_SPECS) {
    const { problems, missingEnglish } = await auditTopic(spec);
    assert.deepStrictEqual(
      problems,
      [],
      `topic:${spec.slug} has structural problems (npm run curriculum:audit ${spec.slug})`,
    );
    assert.deepStrictEqual(
      missingEnglish,
      [],
      `topic:${spec.slug} — English targets with no Spanish source`,
    );
  }
});
