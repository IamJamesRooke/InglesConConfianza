import type { ReactNode } from "react";

import { normalizeLessonMarkdown } from "@/lib/lesson-builder/markdown";

type MarkdownLine =
  | {
      kind: "heading";
      level: 1 | 2 | 3;
      content: string;
    }
  | {
      kind: "ordered-list";
      items: string[];
    }
  | {
      kind: "unordered-list";
      items: string[];
    }
  | {
      kind: "paragraph";
      content: string;
    };

const inlineMarkdownPattern =
  /(\\?<kbd>[^<]+?\\?<\/kbd>|==[^=]+==|\*\*[^*]+?\*\*|__[^_]+?__|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/gu;

export function PracticeMarkdown({ markdown }: { markdown: string }) {
  const blocks = parseMarkdown(normalizeLessonMarkdown(markdown));

  return (
    <div className="space-y-4 text-center text-foreground">
      {blocks.map((block, blockIndex) => {
        if (block.kind === "heading") {
          const HeadingTag = `h${block.level}` as const;
          const headingClassName =
            block.level === 1
              ? "text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
              : block.level === 2
                ? "text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
                : "text-2xl font-semibold leading-snug sm:text-3xl";

          return (
            <HeadingTag
              key={`${block.kind}-${blockIndex}-${block.content}`}
              className={headingClassName}
            >
              {renderInlineMarkdown(block.content)}
            </HeadingTag>
          );
        }

        if (block.kind === "ordered-list") {
          return (
            <ol
              key={`${block.kind}-${blockIndex}`}
              className="list-inside list-decimal space-y-2 text-2xl font-semibold leading-9 sm:text-3xl sm:leading-10"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`} className="pl-1">
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ol>
          );
        }

        if (block.kind === "unordered-list") {
          return (
            <ul
              key={`${block.kind}-${blockIndex}`}
              className="list-inside list-disc space-y-2 text-2xl font-semibold leading-9 sm:text-3xl sm:leading-10"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`} className="pl-1">
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={`${block.kind}-${blockIndex}-${block.content}`}
            className="whitespace-pre-wrap text-2xl font-semibold leading-9 sm:text-3xl sm:leading-10"
          >
            {renderInlineMarkdown(block.content)}
          </p>
        );
      })}
    </div>
  );
}

function parseMarkdown(markdown: string) {
  const lines = markdown.split(/\r?\n/u);
  const blocks: MarkdownLine[] = [];
  let currentList:
    | {
        kind: "ordered-list" | "unordered-list";
        items: string[];
      }
    | null = null;

  function flushList() {
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/u.exec(line);
    if (headingMatch) {
      flushList();
      blocks.push({
        kind: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        content: headingMatch[2],
      });
      return;
    }

    const orderedListMatch = /^\d+\.\s+(.+)$/u.exec(line);
    if (orderedListMatch) {
      if (currentList?.kind !== "ordered-list") {
        flushList();
        currentList = { kind: "ordered-list", items: [] };
      }
      currentList.items.push(orderedListMatch[1]);
      return;
    }

    const unorderedListMatch = /^[-*]\s+(.+)$/u.exec(line);
    if (unorderedListMatch) {
      if (currentList?.kind !== "unordered-list") {
        flushList();
        currentList = { kind: "unordered-list", items: [] };
      }
      currentList.items.push(unorderedListMatch[1]);
      return;
    }

    flushList();
    blocks.push({
      kind: "paragraph",
      content: line,
    });
  });

  flushList();
  return blocks;
}

function renderInlineMarkdown(text: string) {
  const nodes: ReactNode[] = [];
  const parts = text.split(inlineMarkdownPattern);

  parts.forEach((part, partIndex) => {
    if (!part) {
      return;
    }

    const keyboardShortcutMatch =
      /^\\?<kbd>([^<]+?)\\?<\/kbd>$/u.exec(part);

    if (keyboardShortcutMatch) {
      nodes.push(
        <kbd
          key={`${part}-${partIndex}`}
          className="mx-1 inline-flex translate-y-[-0.08em] items-center rounded-md border border-border bg-muted px-2 py-1 font-mono text-[0.72em] font-semibold leading-none text-foreground shadow-sm"
        >
          {keyboardShortcutMatch[1]}
        </kbd>,
      );
      return;
    }

    if (part.startsWith("==") && part.endsWith("==")) {
      nodes.push(
        <mark
          key={`${part}-${partIndex}`}
          className="box-decoration-clone rounded-md bg-amber-200 px-1.5 py-0.5 font-bold text-stone-950"
        >
          {part.slice(2, -2)}
        </mark>,
      );
      return;
    }

    if (
      (part.startsWith("**") && part.endsWith("**")) ||
      (part.startsWith("__") && part.endsWith("__"))
    ) {
      nodes.push(
        <strong key={`${part}-${partIndex}`} className="font-bold">
          {part.slice(2, -2)}
        </strong>,
      );
      return;
    }

    if (
      (part.startsWith("*") && part.endsWith("*")) ||
      (part.startsWith("_") && part.endsWith("_"))
    ) {
      nodes.push(
        <em key={`${part}-${partIndex}`} className="italic">
          {part.slice(1, -1)}
        </em>,
      );
      return;
    }

    nodes.push(part);
  });

  return nodes;
}
