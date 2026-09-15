import assert from "node:assert/strict";
import test from "node:test";

import { curriculumRoleWhere } from "../../src/lib/curriculum/role-filter";
import { rolesUpToLevel } from "../../src/lib/curriculum/types";

test("rolesUpToLevel returns P1..P<n> in priority order", () => {
  assert.deepStrictEqual(rolesUpToLevel(1), ["P1"]);
  assert.deepStrictEqual(rolesUpToLevel(3), ["P1", "P2", "P3"]);
  assert.deepStrictEqual(rolesUpToLevel(5), ["P1", "P2", "P3", "P4", "P5"]);
});

test("an explicit role always wins over maxLevel", () => {
  assert.deepStrictEqual(curriculumRoleWhere("Unranked", 1), {
    curriculumRole: "Unranked",
  });
  assert.deepStrictEqual(curriculumRoleWhere("Trash", 3), {
    curriculumRole: "Trash",
  });
  assert.deepStrictEqual(curriculumRoleWhere("P5", 1), {
    curriculumRole: "P5",
  });
});

test("maxLevel narrows role=all to a P1..P<n> ceiling", () => {
  assert.deepStrictEqual(curriculumRoleWhere("all", 1), {
    curriculumRole: { in: ["P1"] },
  });
  assert.deepStrictEqual(curriculumRoleWhere("all", 3), {
    curriculumRole: { in: ["P1", "P2", "P3"] },
  });
});

test("role=all with no maxLevel filters nothing (Unranked/Trash included)", () => {
  assert.deepStrictEqual(curriculumRoleWhere("all"), {});
  assert.deepStrictEqual(curriculumRoleWhere("all", undefined), {});
});
