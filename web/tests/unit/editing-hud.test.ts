import assert from "node:assert/strict";
import test from "node:test";

import { HUD_LABELS } from "../../src/components/lesson-builder/editing-hud";
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
