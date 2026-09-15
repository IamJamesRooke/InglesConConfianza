import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import * as mutations from "../../src/lib/lesson-builder/mutations";
import { lessonsReducer } from "../../src/lib/lesson-builder/reducer";
import { parseScript, printScript } from "../../src/lib/lesson-builder/script";
import type {
  Lesson,
  LessonBlock,
  LessonFile,
  SentenceBlock,
} from "../../src/lib/lesson-builder/types";

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function stripIds(blocks: LessonBlock[]): unknown {
  return blocks.map((block) => {
    if (block.type === "explanation") {
      return { type: "explanation", contentMarkdown: block.contentMarkdown };
    }
    return {
      type: "sentence",
      layout: block.layout ?? null,
      promptText: block.promptText,
      languageBlocks: block.languageBlocks.map((piece) => ({
        spanish: piece.spanish,
        callout: piece.callout,
        acceptedAnswers: piece.acceptedAnswers,
        given: piece.given ?? false,
      })),
    };
  });
}

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return { id: "lesson_1", name: null, concepts: [], blocks: [], ...overrides };
}

// ---------------------------------------------------------------------
// Grammar basics
// ---------------------------------------------------------------------

test("parses a title, explanation, and a simple pair", () => {
  const result = parseScript("# My lesson\n\nhacer es to do\n\n> hacer / to do");
  assert.deepEqual(result.errors, []);
  assert.equal(result.title, "My lesson");
  assert.equal(result.blocks.length, 2);
  assert.equal(result.blocks[0].type, "explanation");
  assert.equal((result.blocks[0] as { contentMarkdown: string }).contentMarkdown, "hacer es to do");
  const sentence = result.blocks[1] as SentenceBlock;
  assert.equal(sentence.languageBlocks.length, 1);
  assert.equal(sentence.languageBlocks[0].spanish, "hacer");
  assert.deepEqual(sentence.languageBlocks[0].acceptedAnswers, ["to do"]);
});

test("consecutive plain lines become paragraphs of one explanation slide", () => {
  const result = parseScript("con es with\nconmigo es with me\ncontigo es with you");
  assert.equal(result.blocks.length, 1);
  assert.equal(result.blocks[0].type, "explanation");
  assert.equal(
    (result.blocks[0] as { contentMarkdown: string }).contentMarkdown,
    "con es with\n\nconmigo es with me\n\ncontigo es with you",
  );
});

test("a blank line ends an explanation slide", () => {
  const result = parseScript("uno\n\ndos");
  assert.equal(result.blocks.length, 2);
});

test("alternatives, hint, and given pieces", () => {
  const result = parseScript("> hoy / today | this day (adverb)\n> = ... / ...");
  const sentence = result.blocks[0] as SentenceBlock;
  assert.deepEqual(sentence.languageBlocks[0].acceptedAnswers, ["today", "this day"]);
  assert.equal(sentence.languageBlocks[0].callout, "adverb");
  assert.equal(sentence.languageBlocks[0].given, undefined);
  assert.equal(sentence.languageBlocks[1].given, true);
  assert.deepEqual(sentence.languageBlocks[1].acceptedAnswers, ["..."]);
});

test("vocabulary table rows with an instruction", () => {
  const result = parseScript("? Veamos la diferencia.\n| con / with\n| conmigo / with me");
  assert.equal(result.blocks.length, 1);
  const table = result.blocks[0] as SentenceBlock;
  assert.equal(table.layout, "vocabulary_table");
  assert.equal(table.promptText, "Veamos la diferencia.");
  assert.equal(table.languageBlocks.length, 2);
});

test("comments are ignored and not round-tripped", () => {
  const result = parseScript("// a note\n> hola / hello\n// another\n> adios / bye");
  const sentence = result.blocks[0] as SentenceBlock;
  assert.equal(sentence.languageBlocks.length, 2);
});

test("concepts line", () => {
  const result = parseScript("@ to want, to do\n\n> quiero / I want");
  assert.deepEqual(result.concepts, ["to want", "to do"]);
});

test("escapes: \\/, \\|, \\( round-trip inside pair text", () => {
  const result = parseScript("> 1\\/2 / one \\| half \\(ish (a note)");
  const piece = (result.blocks[0] as SentenceBlock).languageBlocks[0];
  assert.equal(piece.spanish, "1/2");
  assert.deepEqual(piece.acceptedAnswers, ["one | half (ish"]);
  assert.equal(piece.callout, "a note");
});

// ---------------------------------------------------------------------
// Extend (`> +`)
// ---------------------------------------------------------------------

test("extend copies the previous sentence slide's pieces, stripping terminal punctuation", () => {
  const result = parseScript("> Quiero / I want\n\n> + hacer / to do\n> + algo. / something.");
  assert.equal(result.blocks.length, 2);
  const extended = result.blocks[1] as SentenceBlock;
  assert.equal(extended.languageBlocks.length, 3);
  assert.equal(extended.languageBlocks[0].spanish, "Quiero"); // copied, unstripped (not last)
  assert.equal(extended.languageBlocks[1].spanish, "hacer");
  assert.equal(extended.languageBlocks[2].spanish, "algo.");
  assert.deepEqual(extended.languageBlocks[2].acceptedAnswers, ["something."]);
});

test("extend with no preceding sentence slide degrades to a plain sentence", () => {
  const result = parseScript("> + hacer / to do");
  assert.equal(result.blocks.length, 1);
  const block = result.blocks[0] as SentenceBlock;
  assert.equal(block.languageBlocks.length, 1);
  assert.equal(block.languageBlocks[0].spanish, "hacer");
});

test("a preceding table slide is skipped when looking for an extend source", () => {
  const result = parseScript(
    "> Quiero / I want\n\n| con / with\n\n> + hacer / to do",
  );
  const extended = result.blocks[2] as SentenceBlock;
  // Copies from the sentence slide (Quiero), not the intervening table.
  assert.equal(extended.languageBlocks[0].spanish, "Quiero");
});

test("extend parity with the real extendLastSentence mutation", () => {
  const lessons: Lesson[] = [
    {
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
            { id: "p1", spanish: "Quiero", callout: null, acceptedAnswers: ["I want"] },
            { id: "p2", spanish: "algo.", callout: null, acceptedAnswers: ["something."] },
          ],
        },
      ],
    },
  ];
  const viaMutation = mutations.extendLastSentence(lessons, "lesson_1", "block_1", "new_block", "new_lang");
  const mutationBlock = (viaMutation[0].blocks[1] as SentenceBlock).languageBlocks;

  const parsed = parseScript("> Quiero / I want\n> algo. / something.\n\n> + hoy / today");
  const scriptBlock = (parsed.blocks[1] as SentenceBlock).languageBlocks;

  // Both copy the same source pieces with the same stripping rule (only the
  // appended new piece differs, which isn't compared here).
  assert.equal(mutationBlock[0].spanish, scriptBlock[0].spanish);
  assert.equal(mutationBlock[1].spanish, scriptBlock[1].spanish);
  assert.deepEqual(mutationBlock[1].acceptedAnswers, scriptBlock[1].acceptedAnswers);
});

// ---------------------------------------------------------------------
// Errors — line-numbered, never a blank pair or empty slide
// ---------------------------------------------------------------------

test("missing '/' is a line-numbered error", () => {
  const result = parseScript("uno\n\n> no separator here");
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].line, 3);
  assert.equal(result.blocks.length, 1); // the explanation only; no bogus sentence block
});

test("empty Spanish side is a line-numbered error", () => {
  const result = parseScript("> / to do");
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].line, 1);
  assert.equal(result.blocks.length, 0);
});

test("empty English side is a line-numbered error", () => {
  const result = parseScript("> hacer /");
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].line, 1);
  assert.equal(result.blocks.length, 0);
});

test("a dangling instruction at end of file is an error", () => {
  const result = parseScript("? Veamos la diferencia.");
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].line, 1);
});

test("a dangling instruction followed by a blank line is an error", () => {
  const result = parseScript("? Veamos la diferencia.\n\n> hola / hello");
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].line, 1);
  // The instruction never attaches to the later, disconnected pair.
  const sentence = result.blocks[0] as SentenceBlock;
  assert.equal(sentence.promptText, "");
});

test("no error ever produces a blank pair or an empty slide", () => {
  const result = parseScript("> /\n> hacer / to do");
  for (const block of result.blocks) {
    if (block.type === "sentence") {
      assert.ok(block.languageBlocks.length > 0);
      for (const piece of block.languageBlocks) {
        assert.ok(piece.spanish.trim().length > 0 || piece.acceptedAnswers.some((a) => a.trim()));
      }
    } else {
      assert.ok(block.contentMarkdown.trim().length > 0);
    }
  }
});

// ---------------------------------------------------------------------
// Property: printScript(parseScript(printScript(lesson))) === printScript(lesson)
// i.e. printing is a fixed point once passed through the parser once.
// ---------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WORDS = ["hacer", "quiero", "algo", "hoy", "con", "the", "word", "test", "cat", "dog", "day", "want"];

function randomWords(rand: () => number, count: number): string {
  return Array.from({ length: count }, () => WORDS[Math.floor(rand() * WORDS.length)]).join(" ");
}

function generateLesson(rand: () => number, index: number): Lesson {
  const blocks: LessonBlock[] = [];
  const blockCount = 1 + Math.floor(rand() * 4);
  for (let b = 0; b < blockCount; b += 1) {
    const kind = rand();
    if (kind < 0.4) {
      const paragraphCount = 1 + Math.floor(rand() * 3);
      const contentMarkdown = Array.from({ length: paragraphCount }, () => randomWords(rand, 3))
        .join("\n\n");
      blocks.push({ id: `block_${index}_${b}`, type: "explanation", contentMarkdown });
      continue;
    }
    const isTable = kind > 0.75;
    const pieceCount = 1 + Math.floor(rand() * 3);
    const languageBlocks = Array.from({ length: pieceCount }, (_, p) => {
      const hasAlt = !isTable && rand() > 0.7;
      const hasHint = rand() > 0.7;
      const given = !isTable && rand() > 0.85;
      return {
        id: `lang_${index}_${b}_${p}`,
        spanish: randomWords(rand, 1 + Math.floor(rand() * 2)),
        callout: hasHint ? randomWords(rand, 2) : null,
        acceptedAnswers: hasAlt
          ? [randomWords(rand, 2), randomWords(rand, 1)]
          : [randomWords(rand, 1 + Math.floor(rand() * 2))],
        ...(given ? { given: true as const } : {}),
      };
    });
    const promptText = rand() > 0.7 ? randomWords(rand, 3) : "";
    blocks.push({
      id: `block_${index}_${b}`,
      type: "sentence",
      ...(isTable ? { layout: "vocabulary_table" as const } : {}),
      promptLabel: "",
      promptText,
      helperText: "",
      answerFeedback: null,
      languageBlocks,
    });
  }
  const hasTitle = rand() > 0.5;
  const hasConcepts = rand() > 0.5;
  return {
    id: `lesson_${index}`,
    name: hasTitle ? randomWords(rand, 3) : null,
    concepts: hasConcepts
      ? Array.from({ length: 1 + Math.floor(rand() * 3) }, (_, c) => ({
          id: `concept_${index}_${c}`,
          conceptId: null,
          label: WORDS[Math.floor(rand() * WORDS.length)],
        }))
      : [],
    blocks,
  };
}

test("printScript(parseScript(printScript(lesson))) is a fixed point for 500 generated lessons", () => {
  const rand = mulberry32(20260915);
  for (let i = 0; i < 500; i += 1) {
    const lesson = generateLesson(rand, i);
    const text = printScript(lesson);
    const parsed = parseScript(text);
    assert.deepEqual(parsed.errors, [], `unexpected errors for lesson ${i}: ${JSON.stringify(parsed.errors)}`);
    const roundTripped: Lesson = {
      id: lesson.id,
      name: parsed.title ?? null,
      concepts: (parsed.concepts ?? []).map((label, c) => ({
        id: `rt_${i}_${c}`,
        conceptId: null,
        label,
      })),
      blocks: parsed.blocks,
    };
    const text2 = printScript(roundTripped);
    assert.equal(text2, text, `round-trip mismatch for lesson ${i}`);
  }
});

// ---------------------------------------------------------------------
// Real lessons: parseScript(printScript(lesson)) deep-equals the block
// model (ignoring ids) for the owner's two real lessons.
// ---------------------------------------------------------------------

test("real lessons round-trip through the block model, ignoring ids", () => {
  const file: LessonFile = JSON.parse(
    readFileSync(path.join(__dirname, "../../data/lessons.json"), "utf8"),
  );
  const realLessons = file.lessons.slice(0, 2);
  assert.ok(realLessons.length >= 2, "expected at least two real lessons to test against");
  for (const lesson of realLessons) {
    const text = printScript(lesson);
    const parsed = parseScript(text);
    assert.deepEqual(parsed.errors, [], `unexpected errors for lesson ${lesson.id}`);
    // The script trims piece text by design, so stray edge whitespace in the
    // data file is normalised rather than round-tripped.
    assert.deepEqual(
      trimStrings(stripIds(parsed.blocks)),
      trimStrings(stripIds(lesson.blocks)),
      `mismatch for lesson ${lesson.id}`,
    );
  }
});

function trimStrings<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === "string" ? v.trim() : v)),
  ) as T;
}

// ---------------------------------------------------------------------
// REPLACE_LESSON_BLOCKS reducer wiring
// ---------------------------------------------------------------------

test("REPLACE_LESSON_BLOCKS replaces blocks and applies title/concepts when given", () => {
  const lessons: Lesson[] = [makeLesson({ id: "lesson_1", name: "Old" })];
  const parsed = parseScript("# New title\n\n@ a, b\n\n> hola / hello");
  const next = lessonsReducer(lessons, {
    type: "REPLACE_LESSON_BLOCKS",
    lessonId: "lesson_1",
    blocks: parsed.blocks,
    title: parsed.title,
    concepts: parsed.concepts,
  });
  assert.equal(next[0].name, "New title");
  assert.deepEqual(next[0].concepts.map((c) => c.label), ["a", "b"]);
  assert.equal(next[0].blocks.length, 1);
});

test("REPLACE_LESSON_BLOCKS leaves title/concepts alone when the script omits them", () => {
  const lessons: Lesson[] = [
    makeLesson({
      id: "lesson_1",
      name: "Keep me",
      concepts: [{ id: "c1", conceptId: null, label: "keep" }],
    }),
  ];
  const parsed = parseScript("> hola / hello");
  const next = lessonsReducer(lessons, {
    type: "REPLACE_LESSON_BLOCKS",
    lessonId: "lesson_1",
    blocks: parsed.blocks,
    title: parsed.title,
    concepts: parsed.concepts,
  });
  assert.equal(next[0].name, "Keep me");
  assert.deepEqual(next[0].concepts.map((c) => c.label), ["keep"]);
});
