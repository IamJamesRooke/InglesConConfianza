// Builds the SSML the explanation voice track is synthesized from. See
// docs/design/speech.md "Explanation voice track" for the spec this
// implements, and src/lib/lesson-builder/explanation-markdown.ts for the
// `[[en:word|BRIDGE]]` pronunciation-bridge notation this reads.
//
// ONE voice reads the whole explanation (en-US-Neural2-D, a gringo accent on
// the Spanish is an explicit owner decision — see docs/design/speech.md).
// Bold/italic carry no spoken meaning and are ignored. This is a pure string
// builder: no network call, no file I/O — scripts/generate-audio.ts sends
// the result to Google TTS, src/lib/learner/speech.ts resolves the clip URL.

import {
  parseExplanation,
  type PMDoc,
  type PMInline,
  type PMMark,
} from "../lesson-builder/explanation-markdown";

function escapeXml(text: string): string {
  return text
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&apos;");
}

function langMark(marks: PMMark[] | undefined): Extract<PMMark, { type: "lang" }> | null {
  const mark = marks?.find((candidate) => candidate.type === "lang");
  return mark && mark.type === "lang" ? mark : null;
}

// `[[en:different|DIFF-rent]]` → the word, a pause, then each hyphenated
// chunk of the bridge with a shorter pause between, the chunk that was
// written in ALL CAPS wrapped in <emphasis> for the stress cue. Chunks are
// lowercased for the synthesiser (an all-caps chunk read by most TTS voices
// gets spelled out letter-by-letter rather than spoken as a syllable) — the
// emphasis tag is what actually carries the stress to the listener.
function bridgeSsml(word: string, bridge: string): string {
  const chunks = bridge
    .split("-")
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
  const spoken = chunks.map((chunk) => {
    const isStressed = /^[A-Z]+$/u.test(chunk);
    const lowered = escapeXml(chunk.toLowerCase());
    return isStressed ? `<emphasis level="strong">${lowered}</emphasis>` : lowered;
  });
  return [escapeXml(word), '<break time="350ms"/>', spoken.join('<break time="200ms"/>')].join("");
}

function inlineToSsml(nodes: PMInline[]): string {
  let out = "";
  for (const node of nodes) {
    if (node.type === "hardBreak") {
      // A teacher-inserted line break inside one paragraph — a smaller pause
      // than the paragraph break, not specified explicitly but consistent
      // with it.
      out += '<break time="200ms"/>';
      continue;
    }
    const lang = langMark(node.marks);
    if (lang?.attrs.language === "en" && lang.attrs.bridge !== undefined) {
      out += bridgeSsml(node.text, lang.attrs.bridge);
      continue;
    }
    // Plain text, a Spanish mark, or an English mark without a bridge are
    // all read plainly — same escaped text either way.
    out += escapeXml(node.text);
  }
  return out;
}

function docToSsml(doc: PMDoc): string {
  const paragraphs = doc.content
    .map((paragraph) => inlineToSsml(paragraph.content ?? []))
    .filter((paragraph) => paragraph.length > 0);
  return paragraphs.join('<break time="500ms"/>');
}

/**
 * Builds the `<speak>…</speak>` SSML document for one explanation block's
 * markdown, ready to send as Google TTS's `input.ssml`.
 */
export function explanationToSsml(markdown: string): string {
  return `<speak>${docToSsml(parseExplanation(markdown))}</speak>`;
}
