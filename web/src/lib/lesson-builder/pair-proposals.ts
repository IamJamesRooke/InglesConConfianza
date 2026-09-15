// E3 — practice pairs proposed from the explanation. An explanation
// containing marked (Spanish, English) pairs already *is* the practice
// content: `[[es:X]]` immediately followed by `[[en:Y]]` (allowing only the
// connective word "es"/"o", punctuation, and whitespace — including a
// paragraph break — between marks) becomes a proposed pair `X / Y` when a
// sentence or vocabulary-table slide is inserted right after that
// explanation. See docs/design/lesson-builder-rebuild.md E3 and
// docs/design/lesson-builder-editing-model.md.
//
// Pure and DOM-free — operates directly on the explanation's stored
// Markdown dialect (`explanation-markdown.ts`'s `[[es:…]]`/`[[en:…]]` marks),
// not the ProseMirror doc.

import type { DocumentBlockType } from "@/components/lesson-builder/slide-insert-control";
import type { LessonBlock } from "@/lib/lesson-builder/types";

export type ProposedPair = { spanish: string; english: string };

type Mark = { lang: "es" | "en"; text: string; start: number; end: number };

const MARK_RE = /\[\[(es|en):([^\]]*)\]\]/g;

function extractMarks(markdown: string): Mark[] {
  const marks: Mark[] = [];
  MARK_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MARK_RE.exec(markdown))) {
    marks.push({
      lang: match[1] as "es" | "en",
      text: match[2],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return marks;
}

// A gap between two marks is a legal connector when every whitespace-
// separated token in it is either the word "es"/"o" (case-insensitive) or
// pure punctuation — nothing else. Whitespace itself (including a blank
// line between paragraphs) is always allowed.
const CONNECTOR_TOKEN = /^(?:es|o|[.,;:¡!¿?()"'“”«»\-–—])+$/iu;

function isAllowedGap(gap: string): boolean {
  const tokens = gap.split(/\s+/u).filter(Boolean);
  return tokens.every((token) => CONNECTOR_TOKEN.test(token));
}

// For every `[[es:X]]` mark, walk forward through the marks that follow it,
// staying inside the run only while the text between consecutive marks is
// an allowed connector. Another `[[es:…]]` mark encountered along the way
// doesn't end the run (it starts its own scan too — this is how "algún o
// alguna es some" proposes two pairs sharing the trailing "some"); the first
// `[[en:…]]` mark reached ends the scan and yields the pair. Anything else
// (a disallowed gap, or running out of marks) yields nothing for this X.
export function proposePairsFromMarkdown(markdown: string): ProposedPair[] {
  if (!markdown) return [];
  const marks = extractMarks(markdown);
  const pairs: ProposedPair[] = [];

  for (let i = 0; i < marks.length; i += 1) {
    const spanishMark = marks[i];
    if (spanishMark.lang !== "es") continue;

    let cursor = spanishMark.end;
    for (let j = i + 1; j < marks.length; j += 1) {
      const next = marks[j];
      const gap = markdown.slice(cursor, next.start);
      if (!isAllowedGap(gap)) break;
      if (next.lang === "en") {
        const spanish = spanishMark.text.trim();
        const english = next.text.trim();
        if (spanish && english) pairs.push({ spanish, english });
        break;
      }
      cursor = next.end;
    }
  }

  return pairs;
}

// Wiring helper shared by the keyboard path (keymap.ts) and the mouse
// chooser (lesson-document.tsx): a new sentence/vocabulary slide proposes
// pairs only when it lands immediately after an explanation slide.
export function proposedPairsForBlock(
  precedingBlock: LessonBlock | undefined,
  type: DocumentBlockType,
): ProposedPair[] {
  if (type === "explanation") return [];
  if (!precedingBlock || precedingBlock.type !== "explanation") return [];
  return proposePairsFromMarkdown(precedingBlock.contentMarkdown);
}
