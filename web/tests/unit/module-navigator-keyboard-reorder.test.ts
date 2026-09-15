import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

// Module keyboard reorder (Alt+ArrowUp/Alt+ArrowDown on the sidebar drag
// handle in module-navigator.tsx) reuses the existing
// onReorderModule(draggedId, targetId) callback — no separate callback, no
// separate visible controls.
//
// onReorderModule's implementation lives in page.tsx and isn't exported as a
// pure function, so it's reproduced here verbatim from page.tsx's
// `reorderModule` to verify the *argument convention* the keyboard handler
// uses actually produces the intended adjacent swap. If page.tsx's
// implementation changes shape, this reproduction may drift out of sync.
function reorderModule<T extends { id: string }>(
  modules: T[],
  draggedId: string,
  targetId: string,
): T[] {
  if (draggedId === targetId) return modules;
  const without = modules.filter((m) => m.id !== draggedId);
  const targetIndex = without.findIndex((m) => m.id === targetId);
  if (targetIndex < 0) return modules;
  const dragged = modules.find((m) => m.id === draggedId);
  if (!dragged) return modules;
  return without.toSpliced(targetIndex, 0, dragged);
}

const modules = () => [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }];

test("Alt+ArrowUp convention (reorderModule(current, previous)) swaps a middle module up", () => {
  const m = modules();
  // Moving B (index 1) up: current=B, previous=A.
  const result = reorderModule(m, "B", "A");
  assert.deepEqual(
    result.map((x) => x.id),
    ["B", "A", "C", "D"],
  );
});

test("Alt+ArrowDown convention (reorderModule(next, current)) swaps a middle module down", () => {
  const m = modules();
  // Moving B (index 1) down: next=C, current=B.
  const result = reorderModule(m, "C", "B");
  assert.deepEqual(
    result.map((x) => x.id),
    ["A", "C", "B", "D"],
  );
});

test("Alt+ArrowDown on the second-to-last module moves it to the end", () => {
  const m = modules();
  // Moving C (index 2) down: next=D, current=C.
  const result = reorderModule(m, "D", "C");
  assert.deepEqual(
    result.map((x) => x.id),
    ["A", "B", "D", "C"],
  );
});

test("Alt+ArrowUp on the second module moves it to the front", () => {
  const m = modules();
  const result = reorderModule(m, "B", "A");
  assert.equal(result[0].id, "B");
});

test("repeated Up presses walk a module to the front, one adjacent swap at a time", () => {
  let m = modules();
  // Simulate index tracking the way the component does: re-derive index
  // from the current array before each call, exactly like the onKeyDown
  // handler's `modules.indexOf(module)`.
  for (let steps = 0; steps < 3; steps += 1) {
    const index = m.findIndex((x) => x.id === "D");
    if (index <= 0) break;
    m = reorderModule(m, "D", m[index - 1].id);
  }
  assert.deepEqual(
    m.map((x) => x.id),
    ["D", "A", "B", "C"],
  );
});

const source = readFileSync(
  path.join(__dirname, "../../src/components/lesson-builder/module-navigator.tsx"),
  "utf8",
);

test("(source) keyboard reorder lives on the existing drag-handle button, uses onReorderModule, no new controls", () => {
  assert.match(source, /className="module-navigator-row-drag"[\s\S]{0,400}onKeyDown=/);
  assert.ok(source.includes("event.altKey"));
  assert.ok(source.includes('"ArrowUp"'));
  assert.ok(source.includes('"ArrowDown"'));
  assert.ok(source.includes("onReorderModule(module.id, modules[index - 1].id)"));
  assert.ok(source.includes("onReorderModule(modules[index + 1].id, module.id)"));
  // No new icon import for the reorder feature itself (e.g. ArrowUp/
  // ArrowDown/ChevronUp) — same GripVertical handle, no new visible arrow
  // buttons. Redo2/Undo2 are present for the unrelated save-status footer
  // row (round 2, item E), not for reordering. ChevronDown is present for
  // the also-unrelated compact-rail disclosure (first-run friction #6).
  assert.match(
    source,
    /^import \{ ChevronDown, ChevronRight, GripVertical, Plus, Redo2, Search, Undo2 \} from "lucide-react";/m,
  );
});

test("(source) drag handle's accessible name/help mentions the keyboard shortcut", () => {
  assert.match(source, /Alt\+ArrowUp \/ Alt\+ArrowDown/);
  assert.match(source, /Alt\+↑ \/ Alt\+↓/);
});
