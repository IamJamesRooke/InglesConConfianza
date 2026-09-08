"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

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
  /(\[\[(?:es|en):[^\]]+\]\]|\\?<kbd>[^<]+?\\?<\/kbd>|==[^=]+==|\*\*[^*]+?\*\*|__[^_]+?__|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/gu;

type PracticeMarkdownVariant =
  | "explanation"
  | "eyebrow"
  | "prompt"
  | "helper"
  | "feedback";

export function PracticeMarkdown({
  markdown,
  variant = "explanation",
}: {
  markdown: string;
  variant?: PracticeMarkdownVariant;
}) {
  const blocks = parseMarkdown(normalizeLessonMarkdown(markdown));
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

        return (
          <p
            key={`${block.kind}-${blockIndex}-${block.content}`}
            className={`whitespace-pre-wrap ${
              isExplanation
                ? "text-2xl font-semibold leading-9 sm:text-3xl sm:leading-10"
                : variant === "eyebrow"
                  ? "text-sm font-medium uppercase tracking-[0.2em]"
                  : variant === "prompt"
                    ? "text-2xl font-semibold leading-tight sm:text-3xl"
                    : variant === "feedback"
                      ? "text-lg font-semibold leading-7 sm:text-xl sm:leading-8"
                      : "text-sm font-medium leading-5.5"
            }`}
          >
            {renderInlineMarkdown(block.content)}
          </p>
        );
      })}
    </div>
  );
}

export function EditablePracticeMarkdown({
  markdown,
  onChange,
  placeholder,
  ariaLabel,
  fieldName,
  variant = "explanation",
}: {
  markdown: string;
  onChange: (markdown: string) => void;
  placeholder: string;
  ariaLabel: string;
  fieldName?: string;
  variant?: PracticeMarkdownVariant;
}) {
  const [renderedMarkdown, setRenderedMarkdown] = useState(markdown);
  const [hasSelection, setHasSelection] = useState(false);
  const editingRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    if (!editingRef.current) setRenderedMarkdown(markdown);
  }, [markdown]);

  function rememberSelection() {
    const selection = window.getSelection();
    const root = rootRef.current;
    if (
      !root ||
      !selection ||
      selection.rangeCount === 0 ||
      selection.isCollapsed ||
      !root.contains(selection.anchorNode)
    ) {
      setHasSelection(false);
      return;
    }
    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    setHasSelection(true);
  }

  function formatSelection(format: "es" | "en" | "bold" | "clear") {
    const root = rootRef.current;
    const range = savedRangeRef.current;
    if (!root || !range || range.collapsed) return;

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    if (format === "bold") {
      document.execCommand("bold");
    } else if (format === "clear") {
      document.execCommand("removeFormat");
    } else {
      const mark = document.createElement("mark");
      mark.dataset.language = format;
      try {
        range.surroundContents(mark);
      } catch {
        const contents = range.extractContents();
        mark.append(contents);
        range.insertNode(mark);
      }
    }

    const nextMarkdown = serializeEditableMarkdown(root);
    onChange(nextMarkdown);
    savedRangeRef.current = null;
    setHasSelection(false);
    root.focus();
  }

  return (
    <div className="authoring-wysiwyg-shell">
      <div
        ref={rootRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={ariaLabel}
        aria-multiline="true"
        data-authoring-field={fieldName}
        data-placeholder={placeholder}
        className={`authoring-wysiwyg authoring-wysiwyg-${variant}`}
        onFocus={() => {
          editingRef.current = true;
        }}
        onMouseUp={rememberSelection}
        onKeyUp={rememberSelection}
        onInput={(event) => {
          event.currentTarget.removeAttribute("data-empty");
          onChange(serializeEditableMarkdown(event.currentTarget));
        }}
        onBlur={(event) => {
          if (event.relatedTarget instanceof HTMLElement && event.relatedTarget.closest(".authoring-format-menu")) return;
          const nextMarkdown = serializeEditableMarkdown(event.currentTarget);
          editingRef.current = false;
          setHasSelection(false);
          setRenderedMarkdown(nextMarkdown);
          onChange(nextMarkdown);
        }}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === "Digit1") {
            event.preventDefault();
            formatSelection("es");
            return;
          }
          if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === "Digit2") {
            event.preventDefault();
            formatSelection("en");
            return;
          }
          if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === "Digit0") {
            event.preventDefault();
            formatSelection("clear");
            return;
          }
          if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "b") {
            event.preventDefault();
            formatSelection("bold");
            return;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
      >
        <PracticeMarkdown markdown={renderedMarkdown} variant={variant} />
      </div>
      {hasSelection && (
        <div className="authoring-format-menu" role="toolbar" aria-label="Format selected text">
          <FormatButton label="Español" shortcut="⇧1" className="spanish" onFormat={() => formatSelection("es")} />
          <FormatButton label="English" shortcut="⇧2" className="english" onFormat={() => formatSelection("en")} />
          <FormatButton label="Bold" shortcut="B" onFormat={() => formatSelection("bold")} />
          <FormatButton label="Clear" shortcut="⇧0" onFormat={() => formatSelection("clear")} />
        </div>
      )}
    </div>
  );
}

function FormatButton({ label, shortcut, className = "", onFormat }: { label: string; shortcut: string; className?: string; onFormat: () => void }) {
  return (
    <button
      type="button"
      className={className}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onFormat}
    >
      {label} <kbd>{shortcut}</kbd>
    </button>
  );
}

function serializeEditableMarkdown(root: HTMLElement) {
  const content =
    root.querySelector<HTMLElement>(".practice-markdown-content") ?? root;
  const blocks = Array.from(content.childNodes)
    .flatMap((node) => serializeBlockNode(node))
    .filter(Boolean);
  return blocks.join("\n\n").trim();
}

function serializeBlockNode(node: Node): string[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim() ?? "";
    return text ? [text] : [];
  }
  if (!(node instanceof HTMLElement)) return [];

  const tag = node.tagName.toLowerCase();
  if (/^h[1-3]$/u.test(tag)) {
    return [`${"#".repeat(Number(tag[1]))} ${serializeInlineNodes(node).trim()}`];
  }
  if (tag === "ol" || tag === "ul") {
    return Array.from(node.children)
      .filter((child) => child.tagName.toLowerCase() === "li")
      .map((item, index) =>
        `${tag === "ol" ? `${index + 1}.` : "-"} ${serializeInlineNodes(item).trim()}`,
      );
  }
  if (tag === "p") return [serializeInlineNodes(node).trim()];
  if (tag === "br") return [""];
  if (tag === "div") {
    const childBlocks = Array.from(node.childNodes).flatMap((child) =>
      serializeBlockNode(child),
    );
    return childBlocks.length ? childBlocks : [serializeInlineNodes(node).trim()];
  }
  return [serializeInlineNode(node).trim()];
}

function serializeInlineNodes(node: ParentNode) {
  return Array.from(node.childNodes).map(serializeInlineNode).join("");
}

function serializeInlineNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (!(node instanceof HTMLElement)) return "";

  const content = serializeInlineNodes(node);
  switch (node.tagName.toLowerCase()) {
    case "mark":
      return node.dataset.language === "es"
        ? `[[es:${content}]]`
        : node.dataset.language === "en"
          ? `[[en:${content}]]`
          : `==${content}==`;
    case "strong":
    case "b":
      return `**${content}**`;
    case "em":
    case "i":
      return `*${content}*`;
    case "kbd":
      return `<kbd>${content}</kbd>`;
    case "br":
      return "\n";
    default:
      return content;
  }
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

    const languageMatch = /^\[\[(es|en):([\s\S]+)\]\]$/u.exec(part);
    if (languageMatch) {
      const language = languageMatch[1];
      nodes.push(
        <mark
          key={`${part}-${partIndex}`}
          data-language={language}
          lang={language}
          className={`practice-language-highlight ${language === "es" ? "spanish" : "english"}`}
        >
          {renderInlineMarkdown(languageMatch[2])}
        </mark>,
      );
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
          className="-mx-0.5 box-decoration-clone rounded-md bg-amber-200 px-0.5 py-0.5 font-bold text-stone-950"
        >
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
