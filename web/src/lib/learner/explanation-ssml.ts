// Builds the SSML the explanation voice track is synthesized from. See
// docs/design/speech.md "Explanation voice track" for the spec this
// implements, and src/lib/lesson-builder/explanation-markdown.ts for the
// `[[en:word|BRIDGE]]` pronunciation-bridge notation this reads.
//
// TWO voices, switched inline with Google Cloud TTS's SSML <voice name="…">
// element (verified against the live REST API — voice switching within one
// <speak> document is supported, so this does NOT fall back to synthesising
// separate requests and concatenating MPEG frames):
//   - Narrator (plain text, Spanish marks, and paragraph/hard breaks):
//     es-US-Neural2-B (Latin American Spanish, male) at <prosody
//     rate="88%">. Replaces the single American-accented voice that used to
//     read the Spanish too — an explicit owner correction, see
//     docs/design/speech.md.
//   - English marks (with or without a pronunciation bridge): en-US-Neural2-D,
//     wrapped with <break time="300ms"/> before and after so the language
//     switch reads as a deliberate teaching beat rather than an accent slip.
//
// Owner addition 2026-09-17: the taught words themselves — both the Spanish
// mark and the English mark — get extra emphasis and pause ("COSA … es …
// thing.") so they stand out from the surrounding narration:
//   - Every `es` mark (no voice switch, still the narrator voice):
//     `<break time="150ms"/><emphasis level="moderate"><prosody
//     rate="82%">cosa</prosody></emphasis><break time="350ms"/>`.
//   - Every `en` mark: `<break time="300ms"/>` then the English voice with
//     `<emphasis level="moderate"><prosody rate="85%">thing</prosody></emphasis>`
//     then `<break time="300ms"/>` — a bridged mark keeps its existing word +
//     pause + syllable-chunk rendering inside that same emphasis/prosody
//     wrapping.
//   - Plain (unmarked) text between them is read at the narrator's 88%.
// Owner addition 2026-09-17: an `[[audio:…]]` run is text the narrator SAYS
// but the learner never SEES. It is spoken by exactly the rules above (an
// `[[en:]]` inside it still switches to the USA voice with the taught-word
// emphasis); the learner-side renderer is what drops it. Inside or outside
// one, a token like `T-H-I-N-G` is spelled letter by letter — by the
// NARRATOR, in Spanish letter names, when it's in plain (unmarked) text; by
// the English voice, in English letter names, when it's inside an
// `[[en:…]]` mark. Both use the same `<say-as interpret-as="characters">`
// with no dedicated voice switch of its own — Google reads it in whichever
// voice already encloses it.
//
// Bold/italic carry no spoken meaning and are ignored. This is a pure string
// builder: no network call, no file I/O — scripts/generate-audio.ts sends
// the result to Google TTS, src/lib/learner/speech.ts resolves the clip URL.

const NARRATOR_VOICE = "es-US-Neural2-B";
const NARRATOR_RATE = "88%";
const SPANISH_MARK_RATE = "82%";
const ENGLISH_VOICE = "en-US-Neural2-D";
const ENGLISH_MARK_RATE = "85%";

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

// A spelled-out token: `T-H-I-N-G` — single letters joined by hyphens, the
// notation the owner uses to have a word spelled letter by letter
// (<say-as interpret-as="characters">), with a beat either side so the
// spelling stands apart from the narration around it. The lookbehind/ahead
// keep it to whole tokens, so ordinary hyphenated words ("e-mail") are
// untouched. See docs/design/speech.md "Audio-only marks".
const SPELLED_TOKEN = /(?<![A-Za-z-])[A-Za-z](?:-[A-Za-z])+(?![A-Za-z-])/gu;

/** Escapes `text`, lifting any spelled-out token into a `<say-as>` spelling
 * with a beat either side — WITHOUT switching voice. `<say-as
 * interpret-as="characters">` is read in whichever `<voice>` currently
 * encloses it, so the same markup spells in Spanish letter names from
 * inside the narrator's voice ("te-hache-i-ene-ge" for `thing`) and in
 * English letter names from inside the English voice (`englishVoiceSsml`).
 * Used for plain narrator text and for the body of an `[[en:…]]` mark. */
function withSpelledTokens(text: string): string {
  let out = "";
  let last = 0;
  for (const match of text.matchAll(SPELLED_TOKEN)) {
    const index = match.index ?? 0;
    out += escapeXml(text.slice(last, index));
    const word = match[0].split("-").join("").toLowerCase();
    out +=
      '<break time="150ms"/>' +
      `<say-as interpret-as="characters">${escapeXml(word)}</say-as>` +
      '<break time="150ms"/>';
    last = index + match[0].length;
  }
  return out + escapeXml(text.slice(last));
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

// A taught word is emphasised and given breathing room around it, whichever
// voice it's read in: `<break/><emphasis level="moderate"><prosody
// rate="…">content</prosody></emphasis><break/>`.
function emphasisedSsml(content: string, rate: string, breakBefore: string, breakAfter: string): string {
  return (
    `<break time="${breakBefore}"/>` +
    `<emphasis level="moderate"><prosody rate="${rate}">${content}</prosody></emphasis>` +
    `<break time="${breakAfter}"/>`
  );
}

// Wraps one English-marked run in the English voice, itself carrying the
// taught-word emphasis. Nested inside the outer narrator <voice> element —
// SSML voices nest, so control reverts to the narrator once this closes.
function englishVoiceSsml(content: string): string {
  return `<voice name="${ENGLISH_VOICE}">${emphasisedSsml(content, ENGLISH_MARK_RATE, "300ms", "300ms")}</voice>`;
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
    if (lang?.attrs.language === "en") {
      // A bridge keeps its word + pause + syllable-chunk rendering; either
      // way the run is spoken in the English voice, with the taught-word
      // emphasis wrapping the whole thing.
      const content =
        lang.attrs.bridge !== undefined
          ? bridgeSsml(node.text, lang.attrs.bridge)
          : withSpelledTokens(node.text);
      out += englishVoiceSsml(content);
      continue;
    }
    if (lang?.attrs.language === "es") {
      // A taught Spanish word: same emphasis treatment, no voice switch —
      // it's already the narrator's voice.
      out += emphasisedSsml(escapeXml(node.text), SPANISH_MARK_RATE, "150ms", "350ms");
      continue;
    }
    // Plain, unmarked text is read by the narrator voice at its base rate.
    // Text inside an audio-only mark lands here too — it is spoken exactly
    // like visible text, it just never reaches the learner's screen (the
    // `audio` mark carries no spoken meaning of its own, only a visual one).
    out += withSpelledTokens(node.text);
  }
  return out;
}

function docToSsml(doc: PMDoc): string {
  const paragraphs = doc.content
    .map((paragraph) => inlineToSsml(paragraph.content ?? []))
    .filter((paragraph) => paragraph.length > 0);
  return paragraphs.join('<break time="600ms"/>');
}

/**
 * Builds the `<speak>…</speak>` SSML document for one explanation block's
 * markdown, ready to send as Google TTS's `input.ssml`. The whole document is
 * read by the narrator voice, with English-marked runs switching briefly into
 * the English voice (see the file header for both voices/rates).
 */
export function explanationToSsml(markdown: string): string {
  const body = docToSsml(parseExplanation(markdown));
  return (
    `<speak><voice name="${NARRATOR_VOICE}"><prosody rate="${NARRATOR_RATE}">` +
    `${body}</prosody></voice></speak>`
  );
}
