"use client";

import type { SentenceBlock } from "@/lib/lesson-builder/types";
import { pieceEnglishSource } from "@/lib/lesson-builder/utils";

type Piece = SentenceBlock["languageBlocks"][number];

function separator(previous: string, current: string) {
  if (!previous || !current) return "";
  if (/^[,.;:!?%)\]}»]/u.test(current)) return "";
  if (/[¿¡([{«]$/u.test(previous)) return "";
  return " ";
}

function composeSentenceParts(
  pieces: Piece[],
  language: "spanish" | "english",
) {
  return pieces.reduce<
    Array<{ id: string; separator: string; text: string; given: boolean }>
  >((parts, piece) => {
    const text = language === "spanish"
      ? piece.spanish.trim()
      // A capture piece shows as its `{key}` chip — see sentence-editor.tsx.
      : pieceEnglishSource(piece);
    if (!text) return parts;
    const previous = parts.at(-1)?.text ?? "";
    parts.push({
      id: piece.id,
      separator: separator(previous, text),
      text,
      given: piece.given === true,
    });
    return parts;
  }, []);
}

// Vocabulary tables never compose into one flowing sentence — each row is
// its own Spanish/English pair, shown aligned. A row's authored hint (if
// any) reuses the same static-pill shape the editing view shows for an
// unselected pair (`lesson-document-hint-pill`) — never an editable input,
// and never a reserved/blank slot for rows without one.
function VocabularyTablePresentation({ block }: { block: SentenceBlock }) {
  const rows = block.languageBlocks.filter(
    (piece) => piece.spanish.trim() || piece.acceptedAnswers.some((answer) => answer.trim()),
  );
  return (
    <div className="lesson-sentence-presentation vocab-table">
      {block.promptText.trim() && (
        <p className="lesson-sentence-presentation-instruction">{block.promptText}</p>
      )}
      {rows.length === 0 ? (
        <span className="lesson-sentence-presentation-empty">Empty table</span>
      ) : (
        <div className="lesson-sentence-presentation-table" role="table">
          {rows.map((piece) => {
            const spanish = piece.spanish.trim();
            return (
              <div className="lesson-sentence-presentation-row" role="row" key={piece.id}>
                <span lang="es">{spanish}</span>
                <span lang="en">{pieceEnglishSource(piece)}</span>
                {piece.callout?.trim() && (
                  <span className="lesson-document-hint-pill" aria-label={`Hint for ${spanish}`}>
                    {piece.callout}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Resting presentation is teaching content only: composed Spanish/English
// (plus any authored instruction). Hints are an editing-only affordance —
// they surface as a pill next to the selected pair in sentence-editor.tsx,
// never here, so a learner-facing screenshot never leaks authoring metadata.
export function SentencePresentation({ block }: { block: SentenceBlock }) {
  if (block.layout === "vocabulary_table") return <VocabularyTablePresentation block={block} />;
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
            {english.map((part) => (
              <span
                key={part.id}
                data-given={part.given ? "true" : undefined}
                title={part.given ? "Shown to the student, not tested" : undefined}
              >
                {part.separator}{part.text}
              </span>
            ))}
          </p>
        </>
      )}
    </div>
  );
}
