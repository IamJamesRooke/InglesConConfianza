import assert from "node:assert/strict";
import test from "node:test";

import {
  applyLevelInline,
  type ApplyLevelInlineDeps,
} from "../../src/lib/curriculum/server/apply-level-inline";

function fakeDeps(overrides: Partial<ApplyLevelInlineDeps> = {}) {
  const calls: {
    updateRole: Array<[string, string]>;
    appendLog: Array<[string, string]>;
    exportSnapshots: number;
  } = { updateRole: [], appendLog: [], exportSnapshots: 0 };

  const deps: ApplyLevelInlineDeps = {
    updateRole: async (id, role) => {
      calls.updateRole.push([id, role]);
    },
    appendLog: async (id, role) => {
      calls.appendLog.push([id, role]);
    },
    exportSnapshots: async () => {
      calls.exportSnapshots += 1;
    },
    ...overrides,
  };

  return { deps, calls };
}

test("applyLevelInline updates the role, logs it, then re-exports the snapshot, in order", async () => {
  const order: string[] = [];
  const { deps } = fakeDeps({
    updateRole: async () => {
      order.push("updateRole");
    },
    appendLog: async () => {
      order.push("appendLog");
    },
    exportSnapshots: async () => {
      order.push("exportSnapshots");
    },
  });

  const result = await applyLevelInline("abc1234567", "P2", deps);

  assert.deepStrictEqual(result, {
    ok: true,
    conceptId: "abc1234567",
    curriculumRole: "P2",
  });
  assert.deepStrictEqual(order, ["updateRole", "appendLog", "exportSnapshots"]);
});

test("applyLevelInline passes the concept id and role through to each step", async () => {
  const { deps, calls } = fakeDeps();

  await applyLevelInline("abc1234567", "Unranked", deps);

  assert.deepStrictEqual(calls.updateRole, [["abc1234567", "Unranked"]]);
  assert.deepStrictEqual(calls.appendLog, [["abc1234567", "Unranked"]]);
  assert.equal(calls.exportSnapshots, 1);
});

test("applyLevelInline rejects a role outside the enum without touching any dependency", async () => {
  const { deps, calls } = fakeDeps();

  const result = await applyLevelInline(
    "abc1234567",
    // @ts-expect-error deliberately invalid
    "P9",
    deps,
  );

  assert.deepStrictEqual(result, {
    ok: false,
    error: "Invalid curriculum role.",
  });
  assert.equal(calls.updateRole.length, 0);
  assert.equal(calls.appendLog.length, 0);
  assert.equal(calls.exportSnapshots, 0);
});

test("applyLevelInline reports a not-found error when updateRole throws, without logging or exporting", async () => {
  const { deps, calls } = fakeDeps({
    updateRole: async () => {
      throw new Error("no row");
    },
  });

  const result = await applyLevelInline("doesnotexist", "P1", deps);

  assert.deepStrictEqual(result, { ok: false, error: "Concept not found." });
  assert.equal(calls.appendLog.length, 0);
  assert.equal(calls.exportSnapshots, 0);
});
