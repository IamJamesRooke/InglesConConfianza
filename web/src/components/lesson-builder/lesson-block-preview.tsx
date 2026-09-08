import type { ReactNode } from "react";

import type { LessonBlock, SentenceBlock } from "@/lib/lesson-builder/types";
import { normalizeLessonMarkdown } from "@/lib/lesson-builder/markdown";

const markPattern = /(\[\[(?:es|en):[^\]]+\]\]|==[^=]+==)/gu;

function CompactExplanation({ markdown }: { markdown: string }) {
  const text = normalizeLessonMarkdown(markdown)
    .replace(/^#{1,6}\s+/gmu, "")
    .replace(/\s*\n+\s*/gu, " ")
    .trim();
  const content: ReactNode[] = text.split(markPattern).map((part, index) => {
    const marked = /^\[\[(es|en):([^\]]+)\]\]$/u.exec(part);
    if (marked) return <mark key={index} data-language={marked[1]}>{marked[2]}</mark>;
    if (part.startsWith("==") && part.endsWith("==")) return <mark key={index}>{part.slice(2, -2)}</mark>;
    return part.replace(/\*\*|__|\*|_/gu, "");
  });
  return <p className="lesson-preview-explanation">{content.length ? content : "Empty explanation"}</p>;
}

function joined(block: SentenceBlock, language: "es" | "en") {
  return block.languageBlocks
    .map((piece) => language === "es" ? piece.spanish.trim() : piece.acceptedAnswers[0]?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
}

function SentenceSummary({ block }: { block: SentenceBlock }) {
  if (block.layout === "vocabulary_table") {
    return <div className="lesson-preview-vocabulary">{block.languageBlocks.map((piece) => <div key={piece.id}><strong>{piece.spanish || "Empty Spanish"}</strong><span>{piece.acceptedAnswers[0] || "No answer"}</span></div>)}</div>;
  }
  const hints = block.languageBlocks.map((piece) => piece.callout?.trim()).filter(Boolean);
  return <div className="lesson-preview-sentence"><strong>{joined(block, "es") || "Empty Spanish sentence"}</strong><span>{joined(block, "en") || "No English answer"}</span>{hints.length > 0 && <small>{hints.join(" · ")}</small>}</div>;
}

export function LessonBlockPreviewList({ blocks }: { blocks: LessonBlock[] }) {
  return <div className="lesson-text-preview">
    {blocks.length === 0 && <p className="lesson-text-empty">Empty lesson</p>}
    {blocks.map((block) => <div key={block.id} className="lesson-preview-slide">{block.type === "explanation" ? <CompactExplanation markdown={block.contentMarkdown} /> : <SentenceSummary block={block} />}</div>)}
  </div>;
}
