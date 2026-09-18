import assert from "node:assert/strict";
import test from "node:test";

import { groupsForSelection, HUD_LABELS } from "../../src/components/lesson-builder/editing-hud";
import { KEYMAP, type Scope } from "../../src/lib/lesson-builder/keymap";

// Every chord in these scopes must have a hand-owned label — a missing entry
// still renders (editing-hud.tsx falls back to a humanised command name),
// but this test is the guard against that fallback ever shipping unnoticed.
const SCOPES_TO_CHECK: Scope[] = ["title", "explanation", "spanish", "english", "block"];

test("every chord in the checked scopes has a HUD label", () => {
  for (const scope of SCOPES_TO_CHECK) {
    const commands = KEYMAP[scope] ?? {};
    for (const chord of Object.keys(commands)) {
      assert.ok(
        HUD_LABELS[chord],
        `expected HUD_LABELS["${chord}"] to exist (scope "${scope}")`,
      );
    }
  }
});

// Owner requirement 2026-09-15: a keyboard legend, not a repeated-modifier
// chip rail — chords sharing a modifier prefix collapse into one group with
// the modifier written once; a modifier-less chord never merges with another
// one, and every modifier-less chord sorts after every modifier group.
test("the explanation scope groups Ctrl+Alt chords together, with Escape as its own solo group last", () => {
  const groups = groupsForSelection({
    kind: "field",
    lessonId: "lesson_1",
    blockId: "block_1",
    field: "explanation",
  });

  assert.equal(groups.length, 2);

  const [ctrlAlt, solo] = groups;
  assert.deepEqual(ctrlAlt.modifiers, ["Ctrl", "Alt"]);
  // S/E/N/A are the explanation scope's four marking chords (A = audio only,
  // added 2026-09-17 with the `[[audio:…]]` notation). The bar caps at
  // PRIMARY_COUNT chips, so the fourth marking chord pushes the universal
  // Ctrl+Alt+Enter "next slide" out of *this* scope's legend — it is still
  // in the keymap, still in the help dialog, and still shown in every other
  // scope's bar.
  assert.deepEqual(
    ctrlAlt.pairs.map((pair) => pair.key),
    ["S", "E", "N", "A"],
  );

  assert.deepEqual(solo.modifiers, []);
  assert.equal(solo.pairs.length, 1);
  assert.equal(solo.pairs[0].key, "Esc");
  assert.equal(solo.pairs[0].label, "leave");
});
