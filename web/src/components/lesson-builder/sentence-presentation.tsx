"use client";

import type { SentenceBlock } from "@/lib/lesson-builder/types";

type Piece = SentenceBlock["languageBlocks"][number];

function separator(previous: string, current: string) {
  if (!previous || !current) return "";
  if (/^[,.;:!?%)\]}»]/u.test(current)) return "";
  if (/[¿¡([{«]$/u.test(previous)) return "";
  return " ";
}

export function composeSentenceParts(
  pieces: Piece[],
  language: "spanish" | "english",
) {
  return pieces.reduce<Array<{ id: string; separator: string; text: string }>>(
    (parts, piece) => {
      const text = language === "spanish"
        ? piece.spanish.trim()
        : (piece.acceptedAnswers[0] ?? "").trim();
      if (!text) return parts;
      const previous = parts.at(-1)?.text ?? "";
      parts.push({ id: piece.id, separator: separator(previous, text), text });
      return parts;
    },
    [],
  );
}

// Resting presentation is teaching content only: composed Spanish/English
// (plus any authored instruction). Hints are an editing-only affordance —
// they surface as yellow pills in the active tool row (sentence-editor.tsx's
// hint list), never here, so a learner-facing screenshot never leaks
// authoring metadata.
export function SentencePresentation({ block }: { block: SentenceBlock }) {
  const spanish = composeSentenceParts(block.languageBlocks, "spanish");
  const english = composeSentenceParts(block.languageBlocks, "english");
  const empty = spanish.length === 0 && english.length === 0;

  return (
    <div className="lesson-sentence-presentation">
      {block.promptText.trim() && <p className="lesson-sentence-presentation-instruction">{block.promptText}</p>}
      {empty ? <span className="lesson-sentence-presentation-empty">Empty sentence</span> : (
        <>
          <p className="lesson-sentence-composed" lang="es">
            {spanish.map((part) => (
              <span className="lesson-sentence-phrase" key={part.id}>{part.separator}{part.text}</span>
            ))}
          </p>
          <p className="lesson-sentence-composed" lang="en">
            {english.map((part) => <span key={part.id}>{part.separator}{part.text}</span>)}
          </p>
        </>
      )}
    </div>
  );
}
