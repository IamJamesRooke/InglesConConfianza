import assert from "node:assert/strict";
import test from "node:test";

import {
  isAnswerAccepted,
  matchedAcceptedAnswer,
  normalizeAnswer,
} from "../../src/lib/lesson-builder/utils";

test("curly apostrophe typed matches straight apostrophe stored", () => {
  assert.equal(isAnswerAccepted("I’m", ["I'm"]), true);
});

test("straight apostrophe typed matches curly apostrophe stored", () => {
  assert.equal(isAnswerAccepted("I'm", ["I’m"]), true);
});

test("each apostrophe lookalike folds to the straight apostrophe", () => {
  const lookalikes = [
    "’", // right single quotation mark
    "‘", // left single quotation mark
    "ʼ", // modifier letter apostrophe
    "´", // acute accent
    "`", // grave accent
    "′", // prime
  ];
  for (const mark of lookalikes) {
    assert.equal(
      normalizeAnswer(`I${mark}m`),
      "i'm",
      `expected ${mark} (U+${mark.codePointAt(0)!.toString(16)}) to fold to '`,
    );
    assert.equal(isAnswerAccepted(`I${mark}m`, ["I'm"]), true);
  }
});

test("curly double quotes fold to the straight double quote", () => {
  assert.equal(normalizeAnswer("“hello”"), '"hello"');
  assert.equal(isAnswerAccepted("“hello”", ['"hello"']), true);
  assert.equal(isAnswerAccepted('"hello"', ["“hello”"]), true);
});

test("matchedAcceptedAnswer still returns the stored canonical spelling", () => {
  assert.equal(matchedAcceptedAnswer("I’m", ["I'm"]), "I'm");
  assert.equal(matchedAcceptedAnswer("I'm", ["I’m"]), "I’m");
});

test("punctuation is still not forgiven (unrelated to apostrophe folding)", () => {
  assert.equal(isAnswerAccepted("hello", ["Hello."]), false);
});
