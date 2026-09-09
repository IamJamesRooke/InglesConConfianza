import type { ReactNode } from "react";

import {
  normalizeLessonMarkdown,
  parseLessonMarkdown,
} from "@/lib/lesson-builder/markdown";

const inlineMarkdownPattern =
  /(\[\[(?:es|en):[^\]]+\]\]|\\?<kbd>[^<]+?\\?<\/kbd>|==[^=]+==|\*\*[^*]+?\*\*|__[^_]+?__|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/gu;

export type PracticeMarkdownVariant =
  "explanation" | "document" | "eyebrow" | "prompt" | "helper" | "feedback";

export function PracticeMarkdown({
  markdown,
  variant = "explanation",
}: {
  markdown: string;
  variant?: PracticeMarkdownVariant;
}) {
  const blocks = parseLessonMarkdown(normalizeLessonMarkdown(markdown));
  const isExplanation = variant === "explanation";

  return (
    <div
      className={`practice-markdown-content ${
        isExplanation
          ? "space-y-4 text-center text-foreground"
          : variant === "feedback"
            ? "space-y-2 text-center"
            : "space-y-2 text-left"
      }`}
    >
      {blocks.map((block, blockIndex) => {
        if (block.kind === "heading") {
          const HeadingTag = `h${block.level}` as const;
          const headingClassName = isExplanation
            ? block.level === 1
              ? "text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
              : block.level === 2
                ? "text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
                : "text-2xl font-semibold leading-snug sm:text-3xl"
            : variant === "eyebrow"
              ? "text-sm font-semibold uppercase tracking-[0.2em]"
              : variant === "prompt"
                ? "text-2xl font-semibold leading-tight sm:text-3xl"
                : variant === "feedback"
                  ? "text-lg font-semibold leading-7 sm:text-xl"
                  : "text-sm font-semibold leading-5.5";

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
              className={
                isExplanation
                  ? "list-inside list-decimal space-y-2 text-2xl font-semibold leading-9 sm:text-3xl sm:leading-10"
                  : "list-inside list-decimal space-y-1"
              }
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
              className={
                isExplanation
                  ? "list-inside list-disc space-y-2 text-2xl font-semibold leading-9 sm:text-3xl sm:leading-10"
                  : "list-inside list-disc space-y-1"
              }
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`} className="pl-1">
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
        }

        const className = isExplanation
          ? "text-2xl font-semibold leading-9 sm:text-3xl sm:leading-10"
          : variant === "eyebrow"
            ? "text-sm font-medium uppercase tracking-[0.2em]"
            : variant === "prompt"
              ? "text-2xl font-semibold leading-tight sm:text-3xl"
              : variant === "feedback"
                ? "text-lg font-semibold leading-7 sm:text-xl sm:leading-8"
                : "text-sm font-medium leading-5.5";

        return (
          <p
            key={`${block.kind}-${blockIndex}-${block.content}`}
            className={`whitespace-pre-wrap ${className}`}
          >
            {renderInlineMarkdown(block.content)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineMarkdown(text: string) {
  const nodes: ReactNode[] = [];

  text.split(inlineMarkdownPattern).forEach((part, partIndex) => {
    if (!part) return;

    const languageMatch = /^\[\[(es|en):([\s\S]+)\]\]$/u.exec(part);
    if (languageMatch) {
      const language = languageMatch[1];
      nodes.push(
        <mark
          key={`${part}-${partIndex}`}
          data-language={language}
          lang={language}
          className={`practice-language-highlight ${
            language === "es" ? "spanish" : "english"
          }`}
        >
          {renderInlineMarkdown(languageMatch[2])}
        </mark>,
      );
      return;
    }

    const keyboardShortcutMatch = /^\\?<kbd>([^<]+?)\\?<\/kbd>$/u.exec(part);
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
        <mark key={`${part}-${partIndex}`} className="practice-highlight">
          {renderInlineMarkdown(part.slice(2, -2))}
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
          {renderInlineMarkdown(part.slice(2, -2))}
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
          {renderInlineMarkdown(part.slice(1, -1))}
        </em>,
      );
      return;
    }

    nodes.push(part);
  });

  return nodes;
}
