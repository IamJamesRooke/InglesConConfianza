import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { curriculumRoles } from "../../src/components/curriculum/curriculum-row-editor";

// The quick-edit "Edit concept" dialog's role select must use the exact same
// label source as the /admin/curriculum page ("Level 1"…"Level 5" / Unranked
// / Trash), never a duplicated "P1"-style list — see curriculum-row-editor.tsx.
const source = readFileSync(
  join(__dirname, "../../src/components/lesson-builder/concept-quick-edit.tsx"),
  "utf8",
);

test("(source) concept-quick-edit imports the shared curriculumRoles label source, not a duplicated list", () => {
  assert.match(
    source,
    /import \{ curriculumRoles \} from "@\/components\/curriculum\/curriculum-row-editor";/,
  );
  assert.ok(
    !source.includes('from "@/lib/curriculum/types"') ||
      !/curriculumRoles/.test(source.match(/import \{[^}]*\} from "@\/lib\/curriculum\/types";/)?.[0] ?? ""),
    "must not also import a role list from lib/curriculum/types",
  );
});

test("(source) the field is labeled 'Level', and options render role.label / role.value from the shared source", () => {
  assert.match(source, />\s*Level\s*<\/span>/);
  assert.match(source, /curriculumRoles\.map\(\(role\) => \(/);
  assert.match(source, /<option key=\{role\.value\} value=\{role\.value\}>/);
  assert.match(source, /\{role\.label\}/);
});

test("the dialog's option labels equal the curriculum page's own labels, in the same order", () => {
  // Both sides read the exact same exported array — this pins that
  // assumption so a future duplication is a failing test, not a silent
  // wording drift between the two screens.
  const expectedLabels = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Unranked", "Trash"];
  assert.deepEqual(
    curriculumRoles.map((role) => role.label),
    expectedLabels,
  );
});
