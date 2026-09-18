// Markdown ⇄ ProseMirror-doc round-trip for the explanation dialect:
//
//   - paragraphs separated by a blank line ("\n\n")
//   - **bold** / __bold__, *italic* / _italic_
//   - [[es:…]] / [[en:…]] language marks (the dominant construct in real data)
//   - an [[en:…]] mark may carry a pronunciation bridge, `[[en:different|DIFF-rent]]`
//     — a learner-facing respelling spoken by the explanation voice track (see
//     docs/design/speech.md "Explanation voice track"); the `|bridge` suffix is
//     data on the mark, not visible text
//   - [[audio:…]] audio-only marks: text the narrator SAYS but the learner
//     never SEES (owner notation, 2026-09-17). Like bold/italic it can wrap
//     runs that contain `es`/`en` marks, so
//     `[[audio:, T-H-I-N-G, [[en:thing]]]]` is one audio run carrying a
//     nested English mark. `stripAudioOnly` below is what the learner
//     renderer uses to drop them.
//   - hard line breaks: a lone "\n" inside a paragraph
//
// Ported from the Phase 2 Tiptap spike, where it was property-tested (2000+
// generated cases) and round-tripped every real explanation byte-identically.
// Deliberately dependency-free (no DOM, no Tiptap import) so the unit tests
// run under plain `tsx --test`: it produces and consumes the plain JSON shape
// `schema.nodeFromJSON` accepts.
//
// Legacy inputs the previous hand-rolled editor accepted — `==highlight==`,
// `# headings`, `- lists`, `<kbd>` — are not part of this schema. They are
// flattened to plain text on parse rather than crashing or leaking their
// markers into the visible text.

export type PMMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "audio" }
  | { type: "lang"; attrs: { language: "es" | "en"; bridge?: string } };
type PMTextNode = { type: "text"; text: string; marks?: PMMark[] };
type PMHardBreak = { type: "hardBreak" };
export type PMInline = PMTextNode | PMHardBreak;
type PMParagraph = { type: "paragraph"; content?: PMInline[] };
export type PMDoc = { type: "doc"; content: PMParagraph[] };

// ---------------------------------------------------------------- parse ---

type Token =
  | { kind: "text"; value: string }
  | { kind: "break" }
  | { kind: "open"; mark: PMMark }
  | { kind: "close"; mark: PMMark["type"] };

const DELIMITERS: Array<{ re: RegExp; mark: () => PMMark }> = [
  // Longest-prefix first would not matter here (the three `[[…:` openers are
  // mutually exclusive), but keep the audio opener above the language ones
  // so the intent stays obvious.
  { re: /^\[\[audio:/u, mark: () => ({ type: "audio" }) },
  { re: /^\[\[es:/u, mark: () => ({ type: "lang", attrs: { language: "es" } }) },
  { re: /^\[\[en:/u, mark: () => ({ type: "lang", attrs: { language: "en" } }) },
  { re: /^\*\*/u, mark: () => ({ type: "bold" }) },
  { re: /^__/u, mark: () => ({ type: "bold" }) },
];

// Italic is a single `*`/`_`, must not collide with `**`/`__` (checked first)
// and, matching the learner renderer's pattern, the character immediately
// inside the delimiter must be non-space.
function matchesItalicOpen(rest: string): boolean {
  return /^[*_](?=\S)/u.test(rest);
}

// Legacy-dialect flattening, per line: heading markers, list bullets and
// numbers, `==highlight==` and `<kbd>` wrappers all lose their markup and
// keep their text.
function stripLegacyMarkup(paragraph: string): string {
  return paragraph
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s{0,3}#{1,6}\s+/u, "")
        .replace(/^\s{0,3}(?:[-+]|\d{1,9}[.)])\s+/u, ""),
    )
    .join("\n")
    .replace(/==([^=]+)==/gu, "$1")
    .replace(/\\?<kbd>([\s\S]*?)\\?<\/kbd>/gu, "$1");
}

function tokenizeParagraph(source: string): Token[] {
  const tokens: Token[] = [];
  const openStack: Array<{ closer: string; mark: PMMark["type"]; ref: PMMark }> = [];
  let index = 0;
  let buffer = "";

  const flushText = () => {
    if (buffer) {
      tokens.push({ kind: "text", value: buffer });
      buffer = "";
    }
  };

  while (index < source.length) {
    const rest = source.slice(index);

    if (rest[0] === "\n") {
      flushText();
      tokens.push({ kind: "break" });
      index += 1;
      continue;
    }

    const top = openStack[openStack.length - 1];

    // A pronunciation bridge (`|BRIDGE`) is only meaningful directly inside
    // an `en` language mark, right before its closing `]]` — it is data on
    // the mark, not a nested inline construct, so it's captured raw (no
    // further tokenizing) rather than going through the delimiter machinery.
    if (
      rest[0] === "|" &&
      top &&
      top.mark === "lang" &&
      top.ref.type === "lang" &&
      top.ref.attrs.language === "en" &&
      top.ref.attrs.bridge === undefined
    ) {
      flushText();
      const closeIndex = rest.indexOf("]]", 1);
      const bridge = closeIndex === -1 ? rest.slice(1) : rest.slice(1, closeIndex);
      top.ref.attrs.bridge = bridge;
      index += 1 + bridge.length;
      continue;
    }

    if (top && rest.startsWith(top.closer)) {
      flushText();
      tokens.push({ kind: "close", mark: top.mark });
      openStack.pop();
      index += top.closer.length;
      continue;
    }

    const delimiter = DELIMITERS.find((candidate) => candidate.re.test(rest));
    if (delimiter) {
      const matched = delimiter.re.exec(rest)![0];
      const mark = delimiter.mark();
      flushText();
      tokens.push({ kind: "open", mark });
      openStack.push({
        closer: mark.type === "lang" || mark.type === "audio" ? "]]" : matched,
        mark: mark.type,
        ref: mark,
      });
      index += matched.length;
      continue;
    }

    if (matchesItalicOpen(rest)) {
      flushText();
      const mark: PMMark = { type: "italic" };
      tokens.push({ kind: "open", mark });
      openStack.push({ closer: rest[0], mark: "italic", ref: mark });
      index += 1;
      continue;
    }

    buffer += rest[0];
    index += 1;
  }
  flushText();
  // Unterminated delimiters simply stay open to the end of the paragraph —
  // this dialect has no escaping, and a half-typed `[[es:` shouldn't throw.
  return tokens;
}

function tokensToInline(tokens: Token[]): PMInline[] {
  const result: PMInline[] = [];
  const active: PMMark[] = [];

  for (const token of tokens) {
    if (token.kind === "text") {
      result.push({
        type: "text",
        text: token.value,
        ...(active.length ? { marks: active.map((mark) => ({ ...mark })) } : {}),
      });
    } else if (token.kind === "break") {
      result.push({ type: "hardBreak" });
    } else if (token.kind === "open") {
      active.push(token.mark);
    } else {
      const fromEnd = [...active].reverse().findIndex((mark) => mark.type === token.mark);
      if (fromEnd >= 0) active.splice(active.length - 1 - fromEnd, 1);
    }
  }
  return result;
}

export function parseExplanation(markdown: string): PMDoc {
  const paragraphs = (markdown ?? "").split(/\n\n+/u);
  return {
    type: "doc",
    content: paragraphs.map((paragraph) => {
      const content = tokensToInline(tokenizeParagraph(stripLegacyMarkup(paragraph)));
      return content.length ? { type: "paragraph", content } : { type: "paragraph" };
    }),
  };
}

// ------------------------------------------------------------ serialize ---

// Keeps leading/trailing whitespace *outside* the delimiters: `** text**` is
// invalid CommonMark and silently fails to re-parse (a real shipped bug the
// previous serializer already fixed this way).
function wrapTrimmed(content: string, open: string, close: string): string {
  const match = /^(\s*)([\s\S]*?)(\s*)$/u.exec(content);
  const [, lead, core, trail] = match ?? ["", "", content, ""];
  if (!core) return content;
  return `${lead}${open}${core}${close}${trail}`;
}

// Audio outermost (it wraps whole spoken asides, language marks included),
// then lang, then bold, then italic.
function markOrder(mark: PMMark): number {
  return mark.type === "audio" ? 0 : mark.type === "lang" ? 1 : mark.type === "bold" ? 2 : 3;
}

function sameMark(a: PMMark, b: PMMark): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "lang" && b.type === "lang") {
    return a.attrs.language === b.attrs.language && (a.attrs.bridge || undefined) === (b.attrs.bridge || undefined);
  }
  return true;
}

// Wraps runs of consecutive nodes sharing a mark together, so "**a** **b**"
// round-trips instead of collapsing and a multi-node run under one mark wraps
// once rather than per node.
function serializeInline(content: PMInline[]): string {
  let out = "";
  let i = 0;
  while (i < content.length) {
    const node = content[i];
    if (node.type === "hardBreak") {
      out += "\n";
      i += 1;
      continue;
    }
    const marks = node.marks ?? [];
    if (marks.length === 0) {
      out += node.text;
      i += 1;
      continue;
    }
    // Fixed nesting order — lang outermost, then bold, then italic — rather
    // than "whatever order the marks happen to sit in on this node". Marks
    // don't stack in any real explanation, but without a fixed order the two
    // legal spellings of a stacked run (`[[es:**x**]]` / `**[[es:x]]**`)
    // alternate on every round-trip and the file churns on every save.
    const mark = [...marks].sort((a, b) => markOrder(a) - markOrder(b))[0];
    let j = i;
    const run: PMInline[] = [];
    while (
      j < content.length &&
      content[j].type === "text" &&
      ((content[j] as PMTextNode).marks ?? []).some((candidate) => sameMark(candidate, mark))
    ) {
      const textNode = content[j] as PMTextNode;
      run.push({
        ...textNode,
        marks: (textNode.marks ?? []).filter((candidate) => !sameMark(candidate, mark)),
      });
      j += 1;
    }
    const inner = serializeInline(run);
    if (mark.type === "bold") out += wrapTrimmed(inner, "**", "**");
    else if (mark.type === "italic") out += wrapTrimmed(inner, "*", "*");
    else if (mark.type === "audio") out += wrapTrimmed(inner, "[[audio:", "]]");
    else {
      const open = mark.attrs.language === "es" ? "[[es:" : "[[en:";
      // The editor stores an absent bridge as null (Tiptap attribute default) —
      // any empty value means "no bridge", never a literal `|null`.
      const close = mark.attrs.bridge ? `|${mark.attrs.bridge}]]` : "]]";
      out += wrapTrimmed(inner, open, close);
    }
    i = j;
  }
  return out;
}

export function serializeExplanationDoc(doc: PMDoc): string {
  return doc.content.map((paragraph) => serializeInline(paragraph.content ?? [])).join("\n\n");
}

// ------------------------------------------------------- audio-only ---

/**
 * The markdown with every `[[audio:…]]` run removed entirely — including any
 * `es`/`en` marks nested inside it. This is what the learner sees: audio-only
 * text is narration, never presentation (docs/design/speech.md "Audio-only
 * marks"). Goes through parse/serialize rather than a regex so a nested
 * `]]` can't end the span early, and so a half-typed `[[audio:` behaves like
 * every other unterminated delimiter in this dialect instead of throwing.
 */
export function stripAudioOnly(markdown: string): string {
  const doc = parseExplanation(markdown);
  return serializeExplanationDoc({
    type: "doc",
    content: doc.content.map((paragraph) => {
      const content = (paragraph.content ?? []).filter(
        (node) =>
          node.type !== "text" || !(node.marks ?? []).some((mark) => mark.type === "audio"),
      );
      return content.length ? { type: "paragraph", content } : { type: "paragraph" };
    }),
  });
}
