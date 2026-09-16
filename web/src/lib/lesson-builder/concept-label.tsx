// Shared pill-label rendering for the module syllabus pills and a lesson's
// "Covers" pills (owner, 2026-09-16): a long concept label like
// "querer que [alguien] [haga algo]" took the width of five pills and read as
// noise. The bracketed placeholders are still there — they just recede
// (`.lesson-concept-placeholder`), so the eye lands on "querer que". The full
// text stays in the pill's `title` tooltip, untouched.
import { Fragment, type ReactNode } from "react";

export type ConceptLabelSegment = { text: string; placeholder: boolean };

const PLACEHOLDER = /\[[^\]]*\]/g;

// Pure splitter: alternating plain/bracketed segments, in source order, with
// no empty segments. Unit-tested in tests/unit/concept-label.test.ts.
export function splitConceptLabel(text: string): ConceptLabelSegment[] {
  const segments: ConceptLabelSegment[] = [];
  let index = 0;
  for (const match of text.matchAll(PLACEHOLDER)) {
    const start = match.index ?? 0;
    if (start > index) {
      segments.push({ text: text.slice(index, start), placeholder: false });
    }
    segments.push({ text: match[0], placeholder: true });
    index = start + match[0].length;
  }
  if (index < text.length) {
    segments.push({ text: text.slice(index), placeholder: false });
  }
  return segments;
}

export function renderConceptLabel(text: string): ReactNode {
  const segments = splitConceptLabel(text);
  if (segments.length <= 1) return text;
  return segments.map((segment, position) =>
    segment.placeholder ? (
      <span key={position} className="lesson-concept-placeholder">
        {segment.text}
      </span>
    ) : (
      <Fragment key={position}>{segment.text}</Fragment>
    ),
  );
}
