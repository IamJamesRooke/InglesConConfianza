import assert from "node:assert/strict";
import test from "node:test";

import { isEnglish, planEsEnMarks } from "../../src/lib/lesson-builder/explanation-classifier";
import {
  parseExplanation,
  serializeExplanationDoc,
  type PMDoc,
  type PMInline,
  type PMMark,
} from "../../src/lib/lesson-builder/explanation-markdown";

// Ported from the Phase 2 Tiptap spike (which used fast-check). The repo has
// no property-testing dependency and this task added exactly one approved
// dependency, so the generators below run off a small deterministic PRNG:
// same coverage, reproducible failures, no new package.
function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const WORDS = ["hola", "quiero", "algo", "day", "I", "want", "día", "to", "do", "today"];

function pick<T>(random: () => number, items: T[]): T {
  return items[Math.floor(random() * items.length) % items.length];
}

function plainRun(random: () => number): string {
  const count = 1 + Math.floor(random() * 3);
  return Array.from({ length: count }, () => pick(random, WORDS)).join(" ");
}

function markedSpan(random: () => number): string {
  const inner = plainRun(random);
  switch (Math.floor(random() * 4)) {
    case 0:
      return `**${inner}**`;
    case 1:
      return `*${inner}*`;
    case 2:
      return `[[es:${inner}]]`;
    default:
      return `[[en:${inner}]]`;
  }
}

// Marked runs are always separated by a literal space, exactly as real typing
// produces them: two adjacent marked runs with nothing between them would
// serialize to ambiguous delimiters (`*x**y***`), a genuine limitation of any
// wrapTrimmed-style delimiter serializer, documented in the spike.
function generateMarkdown(random: () => number): string {
  const paragraphs = 1 + Math.floor(random() * 3);
  return Array.from({ length: paragraphs }, () => {
    const chunks = 1 + Math.floor(random() * 4);
    return Array.from({ length: chunks }, () =>
      random() < 0.5 ? plainRun(random) : markedSpan(random),
    ).join(" ");
  }).join("\n\n");
}

test("property: serialize(parse(markdown)) === markdown for 500 generated documents", () => {
  const random = makeRandom(20260915);
  for (let i = 0; i < 500; i += 1) {
    const markdown = generateMarkdown(random);
    assert.equal(serializeExplanationDoc(parseExplanation(markdown)), markdown, `case ${i}`);
  }
});

function generateDoc(random: () => number): PMDoc {
  const marksFor = (): PMMark[] | undefined => {
    const roll = Math.floor(random() * 5);
    if (roll === 0) return [{ type: "bold" }];
    if (roll === 1) return [{ type: "italic" }];
    if (roll === 2) return [{ type: "lang", attrs: { language: "es" } }];
    if (roll === 3) return [{ type: "lang", attrs: { language: "en" } }];
    return undefined;
  };
  const paragraphs = 1 + Math.floor(random() * 3);
  return {
    type: "doc",
    content: Array.from({ length: paragraphs }, () => {
      const nodes: PMInline[] = [];
      const count = 1 + Math.floor(random() * 3);
      for (let i = 0; i < count; i += 1) {
        if (i > 0) nodes.push({ type: "text", text: " " });
        const marks = marksFor();
        nodes.push({ type: "text", text: plainRun(random), ...(marks ? { marks } : {}) });
      }
      return { type: "paragraph", content: nodes };
    }),
  };
}

test("property: parse(serialize(doc)) preserves text and marks for 500 generated docs", () => {
  const random = makeRandom(77);
  for (let i = 0; i < 500; i += 1) {
    const doc = generateDoc(random);
    const markdown = serializeExplanationDoc(doc);
    const reparsed = parseExplanation(markdown);
    assert.equal(serializeExplanationDoc(reparsed), markdown, `case ${i}`);
  }
});

// The five explanation blocks that exist in the owner's real lessons file.
const REAL_EXPLANATIONS = [
  "[[es:quiero]] es [[en:I want]]",
  "[[es:algo]] es [[en:something]]",
  "[[es:hacer]] es [[en:to do]], dos palabras",
  "[[es:día]] es [[en:day]]",
  "[[es:hoy]] es [[en:today]]",
];

test("every real explanation round-trips byte-identically", () => {
  for (const markdown of REAL_EXPLANATIONS) {
    assert.equal(serializeExplanationDoc(parseExplanation(markdown)), markdown);
  }
});

test("paragraphs, hard breaks, bold and italic round-trip", () => {
  const markdown = "Uno **dos** tres\ncuatro\n\n*cinco* [[es:seis]]";
  assert.equal(serializeExplanationDoc(parseExplanation(markdown)), markdown);
  const doc = parseExplanation(markdown);
  assert.equal(doc.content.length, 2);
  assert.ok(doc.content[0].content?.some((node) => node.type === "hardBreak"));
});

test("bold and a language mark can stack (nesting order is normalized, not lost)", () => {
  // Stacked marks always come back in one fixed nesting order (lang outside,
  // then bold, then italic), so a round-trip is a fixed point and the file
  // doesn't churn between the two legal spellings on every save.
  const once = serializeExplanationDoc(parseExplanation("[[es:**hola**]]"));
  assert.equal(once, "[[es:**hola**]]");
  assert.equal(serializeExplanationDoc(parseExplanation(once)), once);
});

// ---- pronunciation bridges ----------------------------------------------

test("an en mark with a pronunciation bridge round-trips byte-identically", () => {
  const markdown = "[[es:diferente]] es [[en:different|DIFF-rent]]";
  const doc = parseExplanation(markdown);
  const marked = doc.content[0].content?.find(
    (node) => node.type === "text" && node.text === "different",
  ) as { marks?: PMMark[] } | undefined;
  const langMark = marked?.marks?.find((mark) => mark.type === "lang");
  assert.deepEqual(langMark, { type: "lang", attrs: { language: "en", bridge: "DIFF-rent" } });
  assert.equal(serializeExplanationDoc(doc), markdown);
});

test("an en mark without a bridge has no bridge attr and round-trips as before", () => {
  const markdown = "[[en:today]]";
  const doc = parseExplanation(markdown);
  const marked = doc.content[0].content?.[0] as { marks?: PMMark[] } | undefined;
  const langMark = marked?.marks?.find((mark) => mark.type === "lang");
  assert.deepEqual(langMark, { type: "lang", attrs: { language: "en" } });
  assert.equal(serializeExplanationDoc(doc), markdown);
});

test("a bridge on an es mark is not special-cased (bridges are en-only)", () => {
  // A stray "|" inside an es mark is just text — bridges only trigger on an
  // English mark, per docs/design/speech.md.
  const markdown = "[[es:día|no]]";
  assert.equal(serializeExplanationDoc(parseExplanation(markdown)), markdown);
});

test("a bridge can nest inside bold, and a multi-word bridged phrase round-trips", () => {
  const markdown = "[[en:**something**|SUM-thing]] and [[en:to do|too DOO]]";
  assert.equal(serializeExplanationDoc(parseExplanation(markdown)), markdown);
});

test("an unterminated bridge does not throw", () => {
  for (const markdown of ["[[en:x|Y", "[[en:x|", "[[en:|]]"]) {
    assert.doesNotThrow(() => serializeExplanationDoc(parseExplanation(markdown)));
  }
});

// ---- legacy inputs the previous editor accepted -------------------------
// None of these are in the schema any more. They must flatten to plain text
// rather than crashing or leaking their markers into the visible text.

test("legacy ==highlight== becomes plain text", () => {
  const doc = parseExplanation("Esto es ==importante== hoy");
  assert.equal(serializeExplanationDoc(doc), "Esto es importante hoy");
});

test("legacy headings become plain text", () => {
  assert.equal(serializeExplanationDoc(parseExplanation("# Título\n\n## Sub")), "Título\n\nSub");
});

test("legacy lists become plain text lines", () => {
  assert.equal(
    serializeExplanationDoc(parseExplanation("- uno\n- dos\n\n1. tres\n2. cuatro")),
    "uno\ndos\n\ntres\ncuatro",
  );
});

test("legacy <kbd> becomes plain text", () => {
  assert.equal(serializeExplanationDoc(parseExplanation("Pulsa <kbd>Enter</kbd>")), "Pulsa Enter");
});

test("half-typed and unbalanced markup does not throw", () => {
  for (const markdown of ["[[es:", "**bold", "[[en:x]] ]] **", "*", "[[es:a]", ""]) {
    assert.doesNotThrow(() => serializeExplanationDoc(parseExplanation(markdown)));
  }
});

// ---- E1 classifier ------------------------------------------------------

test("isEnglish accepts an English phrase and rejects a Spanish one", () => {
  assert.equal(isEnglish("I want"), true);
  assert.equal(isEnglish("today"), true);
  assert.equal(isEnglish("rojo"), false, "no positive English evidence");
  assert.equal(isEnglish("to do, dos palabras"), false, "below the 60% threshold");
  assert.equal(isEnglish(""), false);
});

// ---- E1 pattern, on the owner's real lines ------------------------------

function planned(text: string) {
  const plan = planEsEnMarks(text);
  if (!plan) return null;
  return {
    es: text.slice(plan.spanish.from, plan.spanish.to),
    en: text.slice(plan.english.from, plan.english.to),
  };
}

test("E1 marks the plain '<Spanish> es <English>.' shape", () => {
  assert.deepEqual(planned("Quiero es I want."), { es: "Quiero", en: "I want" });
});

test("E1 leaves a comma-delimited aside unmarked", () => {
  assert.deepEqual(planned("sí, con tilde, es yes"), { es: "sí", en: "yes" });
});

test("E1 handles a dash-delimited aside that contains its own verbs", () => {
  assert.deepEqual(
    planned("si, sin tilde—como si tú quieres o sí tu necesitas—es if"),
    { es: "si", en: "if" },
  );
});

test("E1 leaves a trailing Spanish comment unmarked", () => {
  assert.deepEqual(planned("hacer es to do, dos palabras"), { es: "hacer", en: "to do" });
});

test("E1 stays neutral when the right side isn't English", () => {
  assert.equal(planned("El libro es rojo."), null);
  assert.equal(planned("no hay pivote aquí"), null);
});

test("a null/empty bridge attribute (Tiptap default) serializes without a |bridge suffix", () => {
  const doc = {
    type: "doc",
    content: [{ type: "paragraph", content: [
      { type: "text", text: "Quiero", marks: [{ type: "lang", attrs: { language: "es", bridge: null } }] },
      { type: "text", text: " es " },
      { type: "text", text: "I want", marks: [{ type: "lang", attrs: { language: "en", bridge: "" } }] },
    ] }],
  };
  assert.equal(serializeExplanationDoc(doc as never), "[[es:Quiero]] es [[en:I want]]");
});
