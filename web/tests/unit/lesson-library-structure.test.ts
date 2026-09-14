import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

// Structure-only regression coverage for the next-round S2/S3/S4 fixes.
//
// lesson-library.tsx has a top-level `import "@/styles/module-navigation.css"`
// side-effect import (pre-existing, not added this round), which plain
// node:test/tsx can't resolve outside Next.js's webpack pipeline — there is
// no CSS-import stub already set up for this test runner (confirmed:
// module-navigation.test.ts only renders ModuleNavigator, which has no CSS
// import, so it doesn't hit this). Rather than add a module loader/mock
// just for this pass (out of the bounded scope), these are SOURCE-level
// checks against the component's own source text, not rendered-DOM checks.
// They verify the same structural facts a render would, at lower fidelity —
// flagged explicitly in the handoff, not claimed as more than they are.

const SOURCE_PATH = path.join(
  __dirname,
  "../../src/components/lesson-builder/lesson-library.tsx",
);
const source = readFileSync(SOURCE_PATH, "utf8");

test("(source) no displayed module-header drag handle or its dead handlers remain", () => {
  assert.ok(!source.includes("lesson-library-module-drag"));
  assert.ok(!source.includes("startModuleDrag"));
  assert.ok(!source.includes("dropModule"));
  assert.ok(!source.includes("setDraggedModule"));
  assert.ok(!source.includes("[draggedModule, "));
  assert.ok(!source.includes("Drag module"));
});

test("(source) sidebar module reordering wiring (onReorderModule -> ModuleNavigator) is untouched", () => {
  assert.match(
    source,
    /<ModuleNavigator[\s\S]*?onReorderModule=\{props\.onReorderModule\}/,
  );
});

test("(source) 'Add lesson' button for a populated module renders as a Fragment sibling after the module card closes, not inside .lesson-library-list", () => {
  const cardClose = source.indexOf("</section>");
  const addLessonButton = source.indexOf('className="lesson-library-add-lesson"');
  assert.ok(cardClose > -1 && addLessonButton > -1);
  assert.ok(
    addLessonButton > cardClose,
    "the Add lesson button's JSX must come after the module card's closing tag",
  );
  // Only rendered when the module has lessons — the empty-module case keeps
  // its own in-card prompt untouched.
  assert.match(source, /moduleLessons\.length > 0[\s\S]{0,600}lesson-library-add-lesson/);
});

test("(source) empty-module create-lesson prompt is untouched (still in-card, still conditional on zero lessons)", () => {
  assert.match(source, /moduleLessons\.length === 0[\s\S]{0,60}lesson-library-first-lesson/);
  assert.ok(source.includes("Create lesson"));
});

test("(source) between-lesson insert control carries a visible label, not screen-reader-only", () => {
  assert.ok(source.includes("lesson-library-insert-label"));
  assert.ok(!source.includes("Insert a lesson here"));
  assert.ok(!source.includes('className="sr-only"'));
});

test("(source) floating keyboard-help FAB button and its ref are gone", () => {
  assert.ok(!source.includes("lesson-library-help-fab"));
  assert.ok(!source.includes("keyboardHelpButtonRef"));
});

test("(source) Ctrl+. shortcut listener is preserved", () => {
  assert.match(source, /event\.key !== "\."/);
  assert.ok(source.includes('addEventListener("keydown", onKey)'));
});

test("(source) a same-page bridge event lets an external menu trigger the same dialog", () => {
  assert.ok(source.includes("lesson-builder:toggle-keyboard-help"));
});

test("(source) module delete, module title input, and lesson collapse markup are preserved", () => {
  assert.ok(source.includes('aria-label="Delete module"'));
  assert.ok(source.includes("lesson-library-module-title"));
  assert.ok(source.includes("Collapse lesson"));
});

test("(source) site-header.tsx exposes a matching keyboard-shortcuts menu entry, scoped to the Lesson Builder", () => {
  const headerSource = readFileSync(
    path.join(__dirname, "../../src/components/site-header.tsx"),
    "utf8",
  );
  assert.ok(headerSource.includes("lesson-builder:toggle-keyboard-help"));
  assert.ok(headerSource.includes('pathname.startsWith("/admin/lesson-builder")'));
  assert.match(headerSource, /Keyboard shortcuts|Shortcuts/);
});
