import assert from "node:assert/strict";
import test from "node:test";

import { createHash } from "node:crypto";

import {
  clearLearnerVariables,
  getLearnerVariable,
  isAcceptableCaptureValue,
  learnerVariablesStorageKey,
  normalizeCaptureValue,
  readLearnerVariables,
  resetLearnerVariablesCache,
  setLearnerVariable,
  spokenTextWithoutVariables,
  substituteVariables,
} from "../../src/lib/learner/variables";
import { parseScript, printScript } from "../../src/lib/lesson-builder/script";
import type { Lesson, SentenceBlock } from "../../src/lib/lesson-builder/types";
import { isLesson } from "../../src/lib/lesson-builder/lesson-file";
import {
  captureDisplayText,
  isAnswerAccepted,
  pieceEnglishSource,
  sentenceEnglishText,
} from "../../src/lib/lesson-builder/utils";

// Capture pieces + learner variables — docs/design/onboarding.md "The
// capture piece". Covers the store, the token dialect (substitution and the
// tidy rules), lesson-file validation, the script round-trip, the
// generator/playback clip-key parity, and a `{name}` piece going through the
// ordinary answer matcher.

function withFakeWindow(run: (data: Map<string, string>) => void) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    value: {
      localStorage: {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => void data.set(key, value),
        removeItem: (key: string) => void data.delete(key),
      },
    },
    configurable: true,
  });
  resetLearnerVariablesCache();
  try {
    run(data);
  } finally {
    if (original) Object.defineProperty(globalThis, "window", original);
    else Reflect.deleteProperty(globalThis as object, "window");
    resetLearnerVariablesCache();
  }
}

// ---------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------

test("the variable store reads, writes and clears through localStorage", () => {
  withFakeWindow((data) => {
    assert.deepEqual(readLearnerVariables(), {});
    assert.equal(getLearnerVariable("name"), null);

    setLearnerVariable("name", "James");
    assert.equal(getLearnerVariable("name"), "James");
    assert.deepEqual(
      JSON.parse(data.get(learnerVariablesStorageKey) ?? "{}"),
      { name: "James" },
    );

    setLearnerVariable("color", "azul");
    assert.deepEqual(readLearnerVariables(), { name: "James", color: "azul" });

    // Blank removes rather than storing "".
    setLearnerVariable("color", "   ");
    assert.deepEqual(readLearnerVariables(), { name: "James" });

    clearLearnerVariables();
    assert.deepEqual(readLearnerVariables(), {});
    assert.equal(data.has(learnerVariablesStorageKey), false);
  });
});

test("the variable store ignores malformed storage and invalid keys", () => {
  withFakeWindow((data) => {
    data.set(learnerVariablesStorageKey, "not json");
    resetLearnerVariablesCache();
    assert.deepEqual(readLearnerVariables(), {});

    data.set(
      learnerVariablesStorageKey,
      JSON.stringify({ name: "James", "9bad": "x", other: 3 }),
    );
    resetLearnerVariablesCache();
    assert.deepEqual(readLearnerVariables(), { name: "James" });

    // An invalid key is never written.
    setLearnerVariable("Name", "Nope");
    assert.deepEqual(readLearnerVariables(), { name: "James" });
  });
});

test("reading variables off the browser is empty, never a throw", () => {
  resetLearnerVariablesCache();
  assert.deepEqual(readLearnerVariables(), {});
});

// ---------------------------------------------------------------------
// substituteVariables
// ---------------------------------------------------------------------

test("substituteVariables fills a value, a fallback, or nothing", () => {
  assert.equal(substituteVariables("Hi, {name}!", { name: "James" }), "Hi, James!");
  assert.equal(substituteVariables("Hola, {name|amigo}.", {}), "Hola, amigo.");
  assert.equal(
    substituteVariables("Hola, {name|amigo}.", { name: "James" }),
    "Hola, James.",
  );
  // Text with nothing to substitute is returned byte-for-byte.
  assert.equal(substituteVariables("  spaced   out  ", {}), "  spaced   out  ");
});

test("an empty substitution tidies the punctuation it leaves behind", () => {
  assert.equal(substituteVariables("Hi, {name}!", {}), "Hi!");
  assert.equal(substituteVariables("My name is {name}.", {}), "My name is.");
  assert.equal(substituteVariables("{name}, ¿cómo estás?", {}), "¿cómo estás?");
  assert.equal(substituteVariables("A {name} B", {}), "A B");
  assert.equal(
    substituteVariables("Hi, {name}!\nBye, {name}!", {}),
    "Hi!\nBye!",
  );
});

test("spokenTextWithoutVariables drops tokens AND fallbacks", () => {
  assert.equal(spokenTextWithoutVariables("Hi, {name}!"), "Hi!");
  assert.equal(spokenTextWithoutVariables("Hi, {name|amigo}!"), "Hi!");
  assert.equal(spokenTextWithoutVariables("Nothing to strip."), "Nothing to strip.");
});

// ---------------------------------------------------------------------
// Capture values
// ---------------------------------------------------------------------

test("a capture value accepts anything non-empty of 1–40 characters", () => {
  assert.equal(isAcceptableCaptureValue(""), false);
  assert.equal(isAcceptableCaptureValue("   "), false);
  assert.equal(isAcceptableCaptureValue("J"), true);
  assert.equal(isAcceptableCaptureValue("x".repeat(40)), true);
  assert.equal(isAcceptableCaptureValue("x".repeat(41)), false);
});

test("a stored capture value loses trailing punctuation and keeps the learner's case", () => {
  assert.equal(normalizeCaptureValue("james"), "James");
  assert.equal(normalizeCaptureValue("James."), "James");
  assert.equal(normalizeCaptureValue(" james! "), "James");
  assert.equal(normalizeCaptureValue("mcDonald"), "mcDonald");
  assert.equal(normalizeCaptureValue("María José"), "María José");
  assert.equal(normalizeCaptureValue("..."), "");
});

test("an all-lowercase capture value gets every word capitalised", () => {
  assert.equal(normalizeCaptureValue("maría josé"), "María José");
  assert.equal(normalizeCaptureValue("juan de la cruz"), "Juan de la Cruz");
  assert.equal(normalizeCaptureValue("ana-maría"), "Ana-María");
  assert.equal(normalizeCaptureValue("berg van berg"), "Berg van Berg");
  assert.equal(normalizeCaptureValue("de sousa"), "De Sousa");
  assert.equal(normalizeCaptureValue("josé maría de la ñusta"), "José María de la Ñusta");
});

test("any uppercase letter the learner typed leaves their casing alone entirely", () => {
  assert.equal(normalizeCaptureValue("maría JOSÉ"), "maría JOSÉ");
  assert.equal(normalizeCaptureValue("Juan de la cruz"), "Juan de la cruz");
});

test("a capture piece displays its value plus its literal suffix", () => {
  const piece = { capture: { key: "name", suffix: "." } };
  assert.equal(captureDisplayText(piece, "James"), "James.");
  assert.equal(captureDisplayText({ capture: { key: "name" } }, "James"), "James");
  assert.equal(captureDisplayText(piece, ""), "");
});

// ---------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------

function lessonWithPiece(capture: unknown): unknown {
  return {
    id: "lesson_1",
    name: null,
    concepts: [],
    blocks: [
      {
        id: "block_1",
        type: "sentence",
        promptLabel: "",
        promptText: "",
        helperText: "",
        answerFeedback: null,
        languageBlocks: [
          {
            id: "lang_1",
            spanish: "tu nombre",
            callout: null,
            acceptedAnswers: [],
            capture,
          },
        ],
      },
    ],
  };
}

test("lesson validation accepts a capture piece with no English answer", () => {
  assert.equal(isLesson(lessonWithPiece({ key: "name" })), true);
  assert.equal(isLesson(lessonWithPiece({ key: "name", suffix: "." })), true);
  assert.equal(isLesson(lessonWithPiece({ key: "Name" })), false);
  assert.equal(isLesson(lessonWithPiece({ key: 7 })), false);
  assert.equal(isLesson(lessonWithPiece({ key: "name", suffix: 1 })), false);
});

// ---------------------------------------------------------------------
// Script round-trip
// ---------------------------------------------------------------------

function firstSentence(blocks: Lesson["blocks"]): SentenceBlock {
  const block = blocks.find((item) => item.type === "sentence");
  assert.ok(block && block.type === "sentence");
  return block;
}

test("the script round-trips a capture piece, with and without a suffix", () => {
  const script = [
    "> Mi nombre / My name",
    "> = es / is",
    "> ? tu nombre / {name}.",
  ].join("\n");
  const parsed = parseScript(script);
  assert.deepEqual(parsed.errors, []);
  const sentence = firstSentence(parsed.blocks);
  const last = sentence.languageBlocks.at(-1);
  assert.deepEqual(last?.capture, { key: "name", suffix: "." });
  assert.deepEqual(last?.acceptedAnswers, []);

  const lesson: Lesson = {
    id: "lesson_1",
    name: null,
    concepts: [],
    blocks: parsed.blocks,
  };
  assert.equal(printScript(lesson), script);
});

test("a capture piece with no suffix and a hint round-trips too", () => {
  const script = "> ? tu nombre / {name} (Escribe tu nombre.)";
  const parsed = parseScript(script);
  assert.deepEqual(parsed.errors, []);
  const piece = firstSentence(parsed.blocks).languageBlocks[0];
  assert.deepEqual(piece.capture, { key: "name" });
  assert.equal(piece.callout, "Escribe tu nombre.");
  assert.equal(
    printScript({ id: "l", name: null, concepts: [], blocks: parsed.blocks }),
    script,
  );
});

test("a capture piece whose English side is not a {key} token is an error", () => {
  const parsed = parseScript("> ? tu nombre / your name");
  assert.equal(parsed.errors.length, 1);
  assert.match(parsed.errors[0].message, /\{key\} token/);
});

// ---------------------------------------------------------------------
// Audio key parity
// ---------------------------------------------------------------------

// The generator hashes sha1 of the text it synthesizes; playback hashes sha1
// of the text it looks up. Both go through spokenTextWithoutVariables, so
// this asserts the two sides land on the same hash for text a learner
// variable appears in. (collectTexts/clipUrlFor themselves do fs/fetch, so
// the parity that matters is the string both derive their hash from.)
const sha1 = (text: string) => createHash("sha1").update(text, "utf8").digest("hex");

test("generation and playback derive the same clip key for text with a token", () => {
  const authored = "Hi, {name}!";
  // Generation side: generate-clips.ts collects spokenTextWithoutVariables(markdown).
  const generated = spokenTextWithoutVariables(authored);
  // Playback side: explanationClipUrl / instructionClipUrl / speak() hash the
  // same helper's output for whatever authored text they are handed.
  const playback = spokenTextWithoutVariables(authored);
  assert.equal(generated, "Hi!");
  assert.equal(sha1(generated), sha1(playback));
  // And the displayed text is emphatically NOT the key.
  assert.notEqual(sha1(substituteVariables(authored, { name: "James" })), sha1(generated));
});

test("a sentence with a capture piece is voiced without it", () => {
  const blocks = [
    { spanish: "Mi nombre", acceptedAnswers: ["My name"] },
    { spanish: "es", acceptedAnswers: ["is"] },
    { spanish: "tu nombre", acceptedAnswers: [], capture: { key: "name", suffix: "." } },
  ];
  assert.equal(sentenceEnglishText(blocks), "My name is");
  // A `{key}` token inside an ordinary answer is stripped the same way.
  assert.equal(
    sentenceEnglishText([
      { spanish: "Hola", acceptedAnswers: ["Hi, {name}!"] },
    ]),
    "Hi!",
  );
});

test("a composed sentence shows a capture piece as its token", () => {
  assert.equal(
    pieceEnglishSource({ acceptedAnswers: [], capture: { key: "name", suffix: "." } }),
    "{name}.",
  );
  assert.equal(pieceEnglishSource({ acceptedAnswers: ["is"] }), "is");
});

// ---------------------------------------------------------------------
// Matcher
// ---------------------------------------------------------------------

test("an ordinary piece whose English holds {name} is matched after substitution", () => {
  const authored = ["Hi, {name}!"];
  const substituted = authored.map((answer) =>
    substituteVariables(answer, { name: "James" }),
  );
  assert.equal(isAnswerAccepted("hi, james!", substituted), true);
  assert.equal(isAnswerAccepted("Hi, James!", substituted), true);
  assert.equal(isAnswerAccepted("hi, sara!", substituted), false);
  // With no value stored the token disappears and the tidy rule applies, so
  // the learner types what they actually see.
  assert.equal(
    isAnswerAccepted("hi!", authored.map((a) => substituteVariables(a, {}))),
    true,
  );
});
