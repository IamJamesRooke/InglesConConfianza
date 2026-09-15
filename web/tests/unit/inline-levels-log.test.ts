import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { appendInlineLevelLine } from "../../src/lib/curriculum/server/inline-levels-log";

test("appendInlineLevelLine creates the file with a # header, then appends id/role/inline rows", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "inline-levels-"));
  const filePath = path.join(directory, "inline-levels.tsv");

  try {
    await appendInlineLevelLine("abc1234567", "P1", filePath);
    const afterFirst = await readFile(filePath, "utf8");
    const firstLines = afterFirst.split("\n").filter(Boolean);
    assert.equal(firstLines.length, 2);
    assert.match(firstLines[0], /^#/);
    assert.equal(firstLines[1], "abc1234567\tP1\tinline");

    await appendInlineLevelLine("zzz9999999", "Unranked", filePath);
    const afterSecond = await readFile(filePath, "utf8");
    const secondLines = afterSecond.split("\n").filter(Boolean);
    assert.equal(secondLines.length, 3);
    // The header is written once, not duplicated on later calls.
    assert.equal(secondLines.filter((line) => line.startsWith("#")).length, 1);
    assert.equal(secondLines[2], "zzz9999999\tUnranked\tinline");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
