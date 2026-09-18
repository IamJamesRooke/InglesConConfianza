import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PracticeMarkdown } from "../../src/components/practice/practice-markdown";

// Spelled tokens as keycaps (owner, 2026-09-17; docs/design/speech.md
// "Audio-only marks"): a visible `T-H-I-N-G` renders one <kbd> per letter,
// while an ordinary hyphenated word like "e-mail" is untouched.
test("PracticeMarkdown renders a spelled token as one kbd per letter", () => {
  const html = renderToStaticMarkup(
    createElement(PracticeMarkdown, { markdown: "Spell it: T-H-I-N-G please." }),
  );
  const kbdCount = (html.match(/<kbd/gu) ?? []).length;
  assert.equal(kbdCount, 5);
  assert.match(html, /<kbd[^>]*>T<\/kbd>/u);
  assert.match(html, /<kbd[^>]*>G<\/kbd>/u);
});

test("PracticeMarkdown leaves an ordinary hyphenated word alone", () => {
  const html = renderToStaticMarkup(
    createElement(PracticeMarkdown, { markdown: "Send an e-mail today." }),
  );
  assert.doesNotMatch(html, /<kbd/u);
});

test("PracticeMarkdown spells a token nested inside an English mark", () => {
  const html = renderToStaticMarkup(
    createElement(PracticeMarkdown, {
      markdown: "[[es:cosa]] es [[en:thing]], T-H-I-N-G, [[en:thing]]",
    }),
  );
  const kbdCount = (html.match(/<kbd/gu) ?? []).length;
  assert.equal(kbdCount, 5);
});

// Audio-only runs never reach the learner DOM at all (stripAudioOnly), so a
// spelled token that only exists inside `[[audio:…]]` produces no keycaps.
test("PracticeMarkdown strips a spelled token that lives only inside an audio-only run", () => {
  const html = renderToStaticMarkup(
    createElement(PracticeMarkdown, {
      markdown: "[[es:cosa]] es [[en:thing]][[audio:, T-H-I-N-G, [[en:thing]]]]",
    }),
  );
  assert.doesNotMatch(html, /<kbd/u);
});
