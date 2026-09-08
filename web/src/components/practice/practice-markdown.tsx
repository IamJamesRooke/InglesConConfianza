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
  | "document"
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
  showSelectionMenu = true,
}: {
  markdown: string;
  onChange: (markdown: string) => void;
  placeholder: string;
  ariaLabel: string;
  fieldName?: string;
  variant?: PracticeMarkdownVariant;
  showSelectionMenu?: boolean;
}) {
  const [renderedMarkdown, setRenderedMarkdown] = useState(markdown);
  const [hasSelection, setHasSelection] = useState(false);
  // Sticky language mode: what a fresh keystroke gets wrapped in.
  const [typingMode, setTypingMode] = useState<"es" | "en" | null>(null);
  const typingModeRef = useRef<"es" | "en" | null>(null);
  const editingRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    if (!editingRef.current) setRenderedMarkdown(markdown);
  }, [markdown]);

  function endTypingMode() {
    typingModeRef.current = null;
    setTypingMode(null);
  }

  // The <mark data-language> the caret currently sits in, if any.
  function caretMark(): HTMLElement | null {
    const root = rootRef.current;
    const selection = window.getSelection();
    if (!root || !selection || selection.rangeCount === 0) return null;
    let node: Node | null = selection.getRangeAt(0).startContainer;
    while (node && node !== root) {
      if (node instanceof HTMLElement && node.tagName === "MARK" && node.dataset.language) return node;
      node = node.parentNode;
    }
    return null;
  }

  function clearLanguageInRange(range: Range) {
    const fragment = range.extractContents();
    for (const mark of Array.from(fragment.querySelectorAll("mark[data-language]"))) {
      mark.replaceWith(...Array.from(mark.childNodes));
    }
    const inserted = Array.from(fragment.childNodes);
    range.insertNode(fragment);
    if (!inserted.length) return;
    const selection = window.getSelection();
    const restored = document.createRange();
    restored.setStartBefore(inserted[0]);
    restored.setEndAfter(inserted[inserted.length - 1]);
    selection?.removeAllRanges();
    selection?.addRange(restored);
  }

  function wrapRange(range: Range, language: "es" | "en") {
    const mark = document.createElement("mark");
    mark.dataset.language = language;
    try {
      range.surroundContents(mark);
    } catch {
      const contents = range.extractContents();
      mark.append(contents);
      range.insertNode(mark);
    }
    return mark;
  }

  function placeCaretAfter(node: Node) {
    const spacer = document.createTextNode("​");
    node.parentNode?.insertBefore(spacer, node.nextSibling);
    const caret = document.createRange();
    caret.setStart(spacer, 1);
    caret.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(caret);
  }

  // ⌥E / ⌥S / ⌥N — set the language you're about to type. With a selection, mark
  // it once instead of entering sticky mode.
  function setLanguageMode(next: "es" | "en" | null) {
    const root = rootRef.current;
    const selection = window.getSelection();
    if (!root || !selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    if (!range.collapsed) {
      if (next) {
        const mark = wrapRange(range, next);
        placeCaretAfter(mark);
      } else {
        clearLanguageInRange(range);
      }
      onChange(serializeEditableMarkdown(root));
      root.focus();
      return;
    }

    // Caret is in a word (no selection): mark that whole word.
    if (next) {
      const word = wordAroundCaret(range);
      if (word && !word.collapsed) {
        const mark = wrapRange(word, next);
        placeCaretAfter(mark);
        onChange(serializeEditableMarkdown(root));
        endTypingMode();
        root.focus();
        return;
      }
    }

    const current = caretMark();
    if (next === null) {
      if (current) placeCaretAfter(current);
      endTypingMode();
      root.focus();
      return;
    }
    if (current?.dataset.language === next) {
      // already inside a matching mark — just make the mode explicit
      typingModeRef.current = next;
      setTypingMode(next);
      return;
    }
    if (current) placeCaretAfter(current);
    const mark = document.createElement("mark");
    mark.dataset.language = next;
    mark.textContent = "​";
    const at = selection.getRangeAt(0);
    at.insertNode(mark);
    const caret = document.createRange();
    caret.setStart(mark.firstChild as Text, 1);
    caret.collapse(true);
    selection.removeAllRanges();
    selection.addRange(caret);
    typingModeRef.current = next;
    setTypingMode(next);
    root.focus();
  }

  function wordAroundCaret(range: Range): Range | null {
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return null;
    const text = node.textContent ?? "";
    const offset = range.startOffset;
    const isWord = (character: string) => /[\p{L}\p{M}\p{N}'’-]/u.test(character);
    let start = offset;
    let end = offset;
    while (start > 0 && isWord(text[start - 1])) start -= 1;
    while (end < text.length && isWord(text[end])) end += 1;
    if (start === end) return null;
    const word = document.createRange();
    word.setStart(node, start);
    word.setEnd(node, end);
    return word;
  }

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

  function formatSelection(format: "bold" | "italic" | "clear", useSavedRange = false) {
    const root = rootRef.current;
    const selection = window.getSelection();
    const range = useSavedRange ? savedRangeRef.current : selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (!root || !range || !root.contains(range.commonAncestorContainer)) return;
    selection?.removeAllRanges();
    selection?.addRange(range);
    if (format === "bold") {
      document.execCommand("bold");
    } else if (format === "italic") {
      document.execCommand("italic");
    } else {
      document.execCommand("removeFormat");
      const live = selection?.getRangeAt(0);
      if (live && !live.collapsed) clearLanguageInRange(live);
    }

    onChange(serializeEditableMarkdown(root));
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
          // When the rendered markdown is empty, `PracticeMarkdown` outputs an
          // empty `.practice-markdown-content` block. Browsers drop the caret in
          // the contentEditable root instead of inside it, so typed characters
          // land as a sibling of that block — leaving it behind as a stray blank
          // line (and losing the text on serialize). Anchor the caret inside it.
          const content = rootRef.current?.querySelector<HTMLElement>(".practice-markdown-content");
          if (content && content.childNodes.length === 0) {
            const range = document.createRange();
            range.selectNodeContents(content);
            range.collapse(true);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        }}
        onMouseUp={() => { rememberSelection(); endTypingMode(); }}
        onKeyUp={(event) => {
          rememberSelection();
          // Sticky mode ends the moment the caret leaves its mark (arrowing out).
          if (typingModeRef.current && event.key.startsWith("Arrow")) {
            const mark = caretMark();
            if (!mark || mark.dataset.language !== typingModeRef.current) endTypingMode();
          }
        }}
        onInput={(event) => {
          event.currentTarget.removeAttribute("data-empty");
          onChange(serializeEditableMarkdown(event.currentTarget));
        }}
        onBlur={(event) => {
          if (event.relatedTarget instanceof HTMLElement && event.relatedTarget.closest(".authoring-format-menu")) return;
          endTypingMode();
          const root = event.currentTarget;
          const nextMarkdown = serializeEditableMarkdown(root);
          // Anything the browser parked outside the managed content node (a stray
          // text node or block from a caret that escaped) would otherwise sit
          // beside the re-rendered content as a visible duplicate.
          for (const node of Array.from(root.childNodes)) {
            if (node.nodeType === Node.TEXT_NODE || (node instanceof HTMLElement && !node.classList.contains("practice-markdown-content"))) {
              node.remove();
            }
          }
          editingRef.current = false;
          setHasSelection(false);
          setRenderedMarkdown(nextMarkdown);
          onChange(nextMarkdown);
        }}
        onKeyDown={(event) => {
          // ⌥Q Spanish · ⌥W neutral · ⌥E English — the language you're typing in.
          if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.nativeEvent.isComposing) {
            if (event.code === "KeyQ") { event.preventDefault(); event.stopPropagation(); setLanguageMode("es"); return; }
            if (event.code === "KeyW") { event.preventDefault(); event.stopPropagation(); setLanguageMode(null); return; }
            if (event.code === "KeyE") { event.preventDefault(); event.stopPropagation(); setLanguageMode("en"); return; }
          }
          if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "b") {
            event.preventDefault();
            formatSelection("bold");
            return;
          }
          if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "i") {
            event.preventDefault();
            formatSelection("italic");
            return;
          }
          if (event.key === "Enter") {
            endTypingMode();
            return;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            if (typingModeRef.current) { endTypingMode(); return; }
            event.currentTarget.closest("[data-document-block]")?.querySelector<HTMLElement>(".lesson-document-block-chrome summary")?.focus();
          }
        }}
      >
        <PracticeMarkdown key={renderedMarkdown} markdown={renderedMarkdown} variant={variant} />
      </div>
      {typingMode && (
        <span className="authoring-mode-badge" data-language={typingMode} aria-hidden="true">
          {typingMode === "es" ? "Spanish" : "English"} <kbd>{typingMode === "es" ? "Alt Q" : "Alt E"}</kbd>
        </span>
      )}
      {showSelectionMenu && hasSelection && (
        <div className="authoring-format-menu" role="toolbar" aria-label="Format selected text">
          <FormatButton label="Español" shortcut="Alt Q" className="spanish" onFormat={() => setLanguageMode("es")} />
          <FormatButton label="English" shortcut="Alt E" className="english" onFormat={() => setLanguageMode("en")} />
          <FormatButton label="Bold" shortcut="Ctrl/⌘ B" onFormat={() => formatSelection("bold", true)} />
          <FormatButton label="Italic" shortcut="Ctrl/⌘ I" onFormat={() => formatSelection("italic", true)} />
          <FormatButton label="Clear" shortcut="Alt W" onFormat={() => formatSelection("clear", true)} />
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

const BLOCK_TAGS = /^(?:p|div|h[1-6]|ol|ul|li|blockquote|pre|section)$/i;

function serializeEditableMarkdown(root: HTMLElement) {
  const contentEl = root.querySelector<HTMLElement>(".practice-markdown-content");
  // If the caret escaped the (empty) content block, typed text is a sibling of
  // it under the root — serialize from the root so nothing is dropped.
  const content = contentEl && contentEl.childNodes.length > 0 ? contentEl : root;
  const childNodes = Array.from(content.childNodes);

  // An explanation that started empty has no <p> wrapper: marks and text sit
  // directly in the container. Treat that whole run as one paragraph instead of
  // one block per inline node (which put every marked word on its own line).
  const hasBlockChild = childNodes.some(
    (node) => node instanceof HTMLElement && BLOCK_TAGS.test(node.tagName),
  );
  if (!hasBlockChild) {
    return serializeInlineNodes(content).trim();
  }

  const blocks = childNodes
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
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? "").replaceAll("\u200B", "");
  if (!(node instanceof HTMLElement)) return "";

  const content = serializeInlineNodes(node);
  switch (node.tagName.toLowerCase()) {
    case "mark":
      if (!content.trim()) return content; // an abandoned language toggle
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
