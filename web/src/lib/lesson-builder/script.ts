// Lesson script mode (E4) — a plain-text, line-based view of a lesson's
// block model. `parseScript`/`printScript` are the parser/serializer for
// the grammar in docs/design/lesson-script-grammar.md (THE CONTRACT for
// this file — read it before changing anything here).
//
// Scope note: this file does NOT auto-mark explanation text on parse (the
// "X es Y" auto-marking rule, E1) — explanation paragraphs are carried
// through verbatim, marks and all. E1 lives in the editor's input rules
// (explanation-e1.ts) and only fires while a teacher is typing in the
// block view.
//
// Not representable in this grammar: a hard line break *inside* one
// explanation paragraph (a lone "\n", as opposed to the "\n\n" that
// separates paragraphs) — the grammar is one script line per paragraph.
// No lesson in data/lessons.json currently contains one (verified
// 2026-09-15), so this doesn't affect round-tripping real content; a
// lesson that did would lose the internal break when printed to script.

import { createId, normalizeLessonConcept } from "@/lib/lesson-builder/utils";
import type {
  LanguageBlock,
  Lesson,
  LessonBlock,
  SentenceBlock,
} from "@/lib/lesson-builder/types";

export type ScriptError = { line: number; message: string };

export type ParseScriptResult = {
  title?: string;
  blocks: LessonBlock[];
  concepts?: string[];
  errors: ScriptError[];
};

// -----------------------------------------------------------------------
// Escaping — `\/`, `\|`, `\(` for literal characters inside pair text.
// -----------------------------------------------------------------------

const ESCAPABLE = new Set(["/", "|", "("]);

function unescapeText(value: string): string {
  return value.replace(/\\([/|(])/g, "$1");
}

function escapeText(value: string): string {
  let out = "";
  for (const char of value) {
    if (ESCAPABLE.has(char)) out += "\\";
    out += char;
  }
  return out;
}

/** Index of the first unescaped occurrence of `ch` in `value`, or -1. */
function findUnescaped(value: string, ch: string): number {
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === "\\") {
      i += 1;
      continue;
    }
    if (value[i] === ch) return i;
  }
  return -1;
}

/** Splits on every unescaped occurrence of `ch` (used for `|` alternatives). */
function splitUnescaped(value: string, ch: string): string[] {
  const parts: string[] = [];
  let start = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === "\\") {
      i += 1;
      continue;
    }
    if (value[i] === ch) {
      parts.push(value.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

/** Strips a trailing ` (hint)` from `value` — the closing paren must be the
 * literal last character, and the matching opening paren must be
 * unescaped. Returns the text with the hint removed (trimmed) and the
 * hint's own text (unescaped, trimmed; null if empty or absent). */
function extractHint(value: string): { text: string; hint: string | null } {
  if (!value.endsWith(")")) return { text: value, hint: null };
  let depth = 0;
  let openIndex = -1;
  for (let i = value.length - 1; i >= 0; i -= 1) {
    const escaped = i > 0 && value[i - 1] === "\\";
    if (escaped) continue;
    if (value[i] === ")") depth += 1;
    else if (value[i] === "(") {
      depth -= 1;
      if (depth === 0) {
        openIndex = i;
        break;
      }
    }
  }
  if (openIndex === -1) return { text: value, hint: null };
  const hintRaw = unescapeText(value.slice(openIndex + 1, value.length - 1).trim());
  const rest = value.slice(0, openIndex).trimEnd();
  return { text: rest, hint: hintRaw.length > 0 ? hintRaw : null };
}

// Strips trailing terminal punctuation (.?!… and runs of them) — parity
// with mutations.ts's private `stripTerminalPunctuation`, replicated here
// since that function isn't exported (see lesson-mutations.test.ts for the
// parity check against the real `extendLastSentence`).
function stripTerminalPunctuation(text: string): string {
  return text.replace(/[.?!…]+\s*$/u, "").trimEnd();
}

function isSentenceSlide(block: LessonBlock | undefined): block is SentenceBlock {
  return Boolean(block && block.type === "sentence" && block.layout !== "vocabulary_table");
}

function copyPiecesForExtend(pieces: LanguageBlock[]): LanguageBlock[] {
  return pieces.map((piece, index) => {
    const isLast = index === pieces.length - 1;
    return {
      id: createId("lang"),
      spanish: isLast ? stripTerminalPunctuation(piece.spanish) : piece.spanish,
      callout: piece.callout,
      acceptedAnswers: isLast
        ? piece.acceptedAnswers.map(stripTerminalPunctuation)
        : [...piece.acceptedAnswers],
      ...(piece.given ? { given: true as const } : {}),
    };
  });
}

// -----------------------------------------------------------------------
// parseScript
// -----------------------------------------------------------------------

type PendingExplanation = { kind: "explanation"; paragraphs: string[] };
type PendingSlide = {
  kind: "sentence" | "table";
  promptText: string;
  isExtend: boolean;
  pieces: LanguageBlock[];
};
type Pending = PendingExplanation | PendingSlide | null;

function parsePiece(
  content: string,
  lineNo: number,
  isGiven: boolean,
  errors: ScriptError[],
): LanguageBlock | null {
  const slashIndex = findUnescaped(content, "/");
  if (slashIndex === -1) {
    errors.push({ line: lineNo, message: "Missing '/' separating Spanish and English." });
    return null;
  }
  const spanish = unescapeText(content.slice(0, slashIndex).trim());
  const { text: englishText, hint } = extractHint(content.slice(slashIndex + 1).trim());
  if (!spanish) {
    errors.push({ line: lineNo, message: "Spanish side is empty." });
    return null;
  }
  const acceptedAnswers = splitUnescaped(englishText, "|")
    .map((part) => unescapeText(part.trim()))
    .filter((part) => part.length > 0);
  if (acceptedAnswers.length === 0) {
    errors.push({ line: lineNo, message: "English side is empty." });
    return null;
  }
  return {
    id: createId("lang"),
    spanish,
    callout: hint,
    acceptedAnswers,
    ...(isGiven ? { given: true as const } : {}),
  };
}

const PAIR_RE = /^>\s+(?:(\+)\s+)?(?:(=)\s+)?(.*)$/;
const ROW_RE = /^\|\s+(.*)$/;
const TITLE_RE = /^#\s+(.*)$/;
const INSTRUCTION_RE = /^\?\s*(.*)$/;

export function parseScript(text: string): ParseScriptResult {
  const rawLines = text.split(/\r\n|\r|\n/);
  const errors: ScriptError[] = [];
  const blocks: LessonBlock[] = [];
  let title: string | undefined;
  let concepts: string[] | undefined;

  let startIndex = 0;
  const titleMatch = rawLines[0] !== undefined ? rawLines[0].match(TITLE_RE) : null;
  if (titleMatch) {
    title = titleMatch[1].trim();
    startIndex = 1;
  }

  let current: Pending = null;
  let pendingInstruction: { text: string; line: number } | null = null;

  function dropDanglingInstruction() {
    if (pendingInstruction) {
      errors.push({
        line: pendingInstruction.line,
        message: "Instruction line must be directly followed by '>' or '|' lines.",
      });
      pendingInstruction = null;
    }
  }

  function flush() {
    if (!current) return;
    if (current.kind === "explanation") {
      const markdown = current.paragraphs.join("\n\n");
      if (markdown.trim().length > 0) {
        blocks.push({ id: createId("block"), type: "explanation", contentMarkdown: markdown });
      }
    } else {
      let pieces = current.pieces;
      if (current.isExtend) {
        let sourceIndex = blocks.length - 1;
        while (sourceIndex >= 0 && !isSentenceSlide(blocks[sourceIndex])) sourceIndex -= 1;
        const source = sourceIndex >= 0 ? (blocks[sourceIndex] as SentenceBlock) : undefined;
        const copied = source ? copyPiecesForExtend(source.languageBlocks) : [];
        pieces = [...copied, ...pieces];
      }
      if (pieces.length > 0) {
        const block: SentenceBlock = {
          id: createId("block"),
          type: "sentence",
          ...(current.kind === "table" ? { layout: "vocabulary_table" as const } : {}),
          promptLabel: "",
          promptText: current.promptText,
          helperText: "",
          answerFeedback: null,
          languageBlocks: pieces,
        };
        blocks.push(block);
      }
    }
    current = null;
  }

  for (let i = startIndex; i < rawLines.length; i += 1) {
    const lineNo = i + 1;
    const raw = rawLines[i];
    const trimmed = raw.trim();

    if (trimmed === "") {
      flush();
      dropDanglingInstruction();
      continue;
    }
    if (trimmed.startsWith("//")) continue; // comment — ignored, doesn't flush

    if (trimmed.startsWith("@")) {
      flush();
      dropDanglingInstruction();
      const rest = trimmed.slice(1).trim();
      concepts = rest.length > 0 ? rest.split(",").map((s) => s.trim()).filter(Boolean) : [];
      continue;
    }

    const instructionMatch = raw.match(INSTRUCTION_RE);
    if (instructionMatch) {
      flush();
      dropDanglingInstruction();
      pendingInstruction = { text: instructionMatch[1].trim(), line: lineNo };
      continue;
    }

    const pairMatch = raw.match(PAIR_RE);
    if (pairMatch) {
      if (!current || current.kind !== "sentence") {
        flush();
        current = {
          kind: "sentence",
          promptText: pendingInstruction?.text ?? "",
          isExtend: Boolean(pairMatch[1]),
          pieces: [],
        };
        pendingInstruction = null;
      }
      const piece = parsePiece(pairMatch[3], lineNo, Boolean(pairMatch[2]), errors);
      if (piece) current.pieces.push(piece);
      continue;
    }

    const rowMatch = raw.match(ROW_RE);
    if (rowMatch) {
      if (!current || current.kind !== "table") {
        flush();
        current = {
          kind: "table",
          promptText: pendingInstruction?.text ?? "",
          isExtend: false,
          pieces: [],
        };
        pendingInstruction = null;
      }
      const piece = parsePiece(rowMatch[1], lineNo, false, errors);
      if (piece) current.pieces.push(piece);
      continue;
    }

    // Plain line — explanation paragraph.
    dropDanglingInstruction();
    if (!current || current.kind !== "explanation") {
      flush();
      current = { kind: "explanation", paragraphs: [] };
    }
    current.paragraphs.push(raw);
  }

  flush();
  dropDanglingInstruction();

  return { title, blocks, concepts, errors };
}

// -----------------------------------------------------------------------
// printScript
// -----------------------------------------------------------------------

function printPiece(prefix: ">" | "|", piece: LanguageBlock): string {
  const marker = piece.given ? "= " : "";
  const spanish = escapeText(piece.spanish);
  const english = piece.acceptedAnswers.map(escapeText).join(" | ");
  const hint = piece.callout ? ` (${escapeText(piece.callout)})` : "";
  return `${prefix} ${marker}${spanish} / ${english}${hint}`;
}

export function printScript(lesson: Lesson): string {
  const sections: string[] = [];

  if (lesson.name) sections.push(`# ${lesson.name}`);
  if (lesson.concepts.length > 0) {
    sections.push(`@ ${lesson.concepts.map((concept) => concept.label).join(", ")}`);
  }

  for (const block of lesson.blocks) {
    if (block.type === "explanation") {
      const paragraphs = block.contentMarkdown
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph.length > 0);
      if (paragraphs.length === 0) continue;
      sections.push(paragraphs.join("\n"));
      continue;
    }

    const rows: string[] = [];
    if (block.promptText.trim()) rows.push(`? ${block.promptText.trim()}`);
    const prefix: ">" | "|" = block.layout === "vocabulary_table" ? "|" : ">";
    for (const piece of block.languageBlocks) rows.push(printPiece(prefix, piece));
    if (rows.length === 0) continue;
    sections.push(rows.join("\n"));
  }

  return sections.join("\n\n");
}

// -----------------------------------------------------------------------
// REPLACE_LESSON_BLOCKS support — applies a parsed script back onto one
// lesson. Blocks are always replaced; title/concepts are only touched when
// the parse actually produced them (an untitled/tagless script leaves the
// lesson's existing name/concepts alone).
// -----------------------------------------------------------------------

export function applyScriptReplacement(
  lessons: Lesson[],
  lessonId: string,
  result: Pick<ParseScriptResult, "blocks" | "title" | "concepts">,
): Lesson[] {
  return lessons.map((lesson) => {
    if (lesson.id !== lessonId) return lesson;
    return {
      ...lesson,
      name: result.title !== undefined ? result.title.trim() || null : lesson.name,
      concepts:
        result.concepts !== undefined
          ? result.concepts.map((label) => normalizeLessonConcept({ label }))
          : lesson.concepts,
      blocks: result.blocks,
    };
  });
}
