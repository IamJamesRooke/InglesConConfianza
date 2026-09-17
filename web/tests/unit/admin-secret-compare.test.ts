import assert from "node:assert/strict";
import test from "node:test";

import { timingSafeEqualStrings } from "../../src/lib/admin/secret-compare";

test("equal strings match", () => {
  assert.equal(timingSafeEqualStrings("test-secret", "test-secret"), true);
});

test("different strings of the same length do not match", () => {
  assert.equal(timingSafeEqualStrings("test-secret", "test-secreT"), false);
});

test("different lengths do not match", () => {
  assert.equal(timingSafeEqualStrings("short", "much-longer-secret"), false);
  assert.equal(timingSafeEqualStrings("much-longer-secret", "short"), false);
});

test("empty strings match each other but nothing else", () => {
  assert.equal(timingSafeEqualStrings("", ""), true);
  assert.equal(timingSafeEqualStrings("", "a"), false);
  assert.equal(timingSafeEqualStrings("a", ""), false);
});
