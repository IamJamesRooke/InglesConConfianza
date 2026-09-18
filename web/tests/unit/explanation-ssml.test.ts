import assert from "node:assert/strict";
import test from "node:test";

import { explanationToSsml } from "../../src/lib/learner/explanation-ssml";

const NARRATOR_OPEN = '<speak><voice name="es-US-Neural2-B"><prosody rate="88%">';
const NARRATOR_CLOSE = "</prosody></voice></speak>";

function englishVoice(content: string): string {
  return (
    '<voice name="en-US-Neural2-D">' +
    '<break time="300ms"/><emphasis level="moderate"><prosody rate="85%">' +
    content +
    '</prosody></emphasis><break time="300ms"/></voice>'
  );
}

function spanishMark(content: string): string {
  return (
    '<break time="150ms"/><emphasis level="moderate"><prosody rate="82%">' +
    content +
    '</prosody></emphasis><break time="350ms"/>'
  );
}

test("plain text is wrapped in <speak> and the narrator voice, read as-is", () => {
  assert.equal(explanationToSsml("Hola, today."), `${NARRATOR_OPEN}Hola, today.${NARRATOR_CLOSE}`);
});

test("a Spanish mark gets the taught-word emphasis, an English mark switches voice", () => {
  assert.equal(
    explanationToSsml("[[es:quiero]] es [[en:I want]]"),
    `${NARRATOR_OPEN}${spanishMark("quiero")} es ${englishVoice("I want")}${NARRATOR_CLOSE}`,
  );
});

test('"cosa es thing" — the sample explanation the owner asked to see', () => {
  assert.equal(
    explanationToSsml("[[es:cosa]] es [[en:thing]]"),
    `${NARRATOR_OPEN}${spanishMark("cosa")} es ${englishVoice("thing")}${NARRATOR_CLOSE}`,
  );
});

test("a bridged English mark produces the word, breaks, and an emphasised chunk, inside the English voice", () => {
  assert.equal(
    explanationToSsml("[[en:different|DIFF-rent]]"),
    `${NARRATOR_OPEN}${englishVoice(
      'different<break time="350ms"/><emphasis level="strong">diff</emphasis>' +
        '<break time="200ms"/>rent',
    )}${NARRATOR_CLOSE}`,
  );
});

test("every hyphenated chunk of a bridge gets its own break, only the ALL-CAPS chunk is stressed", () => {
  assert.equal(
    explanationToSsml("[[en:comfortable|come-FOR-tuh-bul]]"),
    `${NARRATOR_OPEN}${englishVoice(
      "comfortable" +
        '<break time="350ms"/>come<break time="200ms"/>' +
        '<emphasis level="strong">for</emphasis><break time="200ms"/>' +
        'tuh<break time="200ms"/>bul',
    )}${NARRATOR_CLOSE}`,
  );
});

test("paragraph breaks become a 600ms break, bold and italic carry no spoken meaning", () => {
  assert.equal(
    explanationToSsml("**Uno** dos\n\n*tres* cuatro"),
    `${NARRATOR_OPEN}Uno dos<break time="600ms"/>tres cuatro${NARRATOR_CLOSE}`,
  );
});

test("a hard line break inside one paragraph is a smaller 200ms break", () => {
  assert.equal(
    explanationToSsml("Uno\ndos"),
    `${NARRATOR_OPEN}Uno<break time="200ms"/>dos${NARRATOR_CLOSE}`,
  );
});

test("XML-sensitive characters in text and bridges are escaped", () => {
  assert.equal(
    explanationToSsml("Tom & Jerry's \"rule\" <ok>"),
    `${NARRATOR_OPEN}Tom &amp; Jerry&apos;s &quot;rule&quot; &lt;ok&gt;${NARRATOR_CLOSE}`,
  );
  assert.equal(
    explanationToSsml("[[en:R&B|ar-EN-bee]]"),
    `${NARRATOR_OPEN}${englishVoice(
      'R&amp;B<break time="350ms"/>ar<break time="200ms"/>' +
        '<emphasis level="strong">en</emphasis><break time="200ms"/>bee',
    )}${NARRATOR_CLOSE}`,
  );
});

test("XML-sensitive characters in a Spanish mark are escaped", () => {
  assert.equal(
    explanationToSsml('[[es:Tom & "Jerry"]]'),
    `${NARRATOR_OPEN}${spanishMark("Tom &amp; &quot;Jerry&quot;")}${NARRATOR_CLOSE}`,
  );
});
