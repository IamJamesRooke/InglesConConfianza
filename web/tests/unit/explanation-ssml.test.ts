import assert from "node:assert/strict";
import test from "node:test";

import { explanationToSsml } from "../../src/lib/learner/explanation-ssml";

test("plain text is wrapped in <speak> and read as-is", () => {
  assert.equal(explanationToSsml("Hola, today."), "<speak>Hola, today.</speak>");
});

test("a Spanish mark and an English mark without a bridge are read plainly", () => {
  assert.equal(
    explanationToSsml("[[es:quiero]] es [[en:I want]]"),
    "<speak>quiero es I want</speak>",
  );
});

test("a bridged English mark produces the word, breaks, and an emphasised chunk", () => {
  assert.equal(
    explanationToSsml("[[en:different|DIFF-rent]]"),
    '<speak>different<break time="350ms"/><emphasis level="strong">diff</emphasis>' +
      '<break time="200ms"/>rent</speak>',
  );
});

test("every hyphenated chunk of a bridge gets its own break, only the ALL-CAPS chunk is stressed", () => {
  assert.equal(
    explanationToSsml("[[en:comfortable|come-FOR-tuh-bul]]"),
    "<speak>comfortable" +
      '<break time="350ms"/>come<break time="200ms"/>' +
      '<emphasis level="strong">for</emphasis><break time="200ms"/>' +
      'tuh<break time="200ms"/>bul</speak>',
  );
});

test("paragraph breaks become a 500ms break, bold and italic carry no spoken meaning", () => {
  assert.equal(
    explanationToSsml("**Uno** dos\n\n*tres* cuatro"),
    '<speak>Uno dos<break time="500ms"/>tres cuatro</speak>',
  );
});

test("XML-sensitive characters in text and bridges are escaped", () => {
  assert.equal(
    explanationToSsml("Tom & Jerry's \"rule\" <ok>"),
    "<speak>Tom &amp; Jerry&apos;s &quot;rule&quot; &lt;ok&gt;</speak>",
  );
  assert.equal(
    explanationToSsml("[[en:R&B|ar-EN-bee]]"),
    '<speak>R&amp;B<break time="350ms"/>ar<break time="200ms"/>' +
      '<emphasis level="strong">en</emphasis><break time="200ms"/>bee</speak>',
  );
});
