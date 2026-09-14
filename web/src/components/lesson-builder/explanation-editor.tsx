"use client";
import { useEffect, useRef, useState } from "react";
import {
  PracticeMarkdown,
  type PracticeMarkdownVariant,
} from "@/components/practice/practice-markdown";
import { serializeExplanation } from "@/lib/lesson-builder/serialize-explanation";
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
  const [isActive, setIsActive] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
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
  function caretMark(): HTMLElement | null {
    const root = rootRef.current;
    const selection = window.getSelection();
    if (!root || !selection || selection.rangeCount === 0) return null;
    let node: Node | null = selection.getRangeAt(0).startContainer;
    while (node && node !== root) {
      if (
        node instanceof HTMLElement &&
        node.tagName === "MARK" &&
        node.dataset.language
      )
        return node;
      node = node.parentNode;
    }
    return null;
  }
  function clearLanguageInRange(range: Range) {
    const fragment = range.extractContents();
    for (const mark of Array.from(
      fragment.querySelectorAll("mark[data-language]"),
    ))
      mark.replaceWith(...Array.from(mark.childNodes));
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
  function wordAroundCaret(range: Range): Range | null {
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return null;
    const text = node.textContent ?? "";
    const offset = range.startOffset;
    const isWord = (character: string) =>
      /[\p{L}\p{M}\p{N}'’-]/u.test(character);
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
  function setLanguageMode(next: "es" | "en" | null) {
    const root = rootRef.current;
    const selection = window.getSelection();
    if (!root || !selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!range.collapsed) {
      if (next) placeCaretAfter(wrapRange(range, next));
      else clearLanguageInRange(range);
      onChange(serializeExplanation(root));
      root.focus();
      return;
    }
    if (next) {
      const word = wordAroundCaret(range);
      if (word && !word.collapsed) {
        placeCaretAfter(wrapRange(word, next));
        onChange(serializeExplanation(root));
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
  function rememberSelection() {
    const selection = window.getSelection();
    const root = rootRef.current;
    if (
      !root ||
      !selection ||
      selection.rangeCount === 0 ||
      !root.contains(selection.anchorNode)
    ) {
      return;
    }
    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    setHasSelection(!selection.isCollapsed);
  }
  function restoreSelection() {
    const root = rootRef.current;
    const selection = window.getSelection();
    const saved = savedRangeRef.current;
    if (
      !root ||
      !selection ||
      !saved ||
      !root.contains(saved.commonAncestorContainer)
    )
      return false;
    root.focus({ preventScroll: true });
    selection.removeAllRanges();
    selection.addRange(saved.cloneRange());
    return true;
  }
  function formatSelection(
    format: "bold" | "italic" | "clear",
    useSavedRange = false,
  ) {
    const root = rootRef.current;
    const selection = window.getSelection();
    if (useSavedRange && !restoreSelection()) return;
    const range = useSavedRange
      ? window.getSelection()?.rangeCount
        ? window.getSelection()!.getRangeAt(0)
        : null
      : selection?.rangeCount
        ? selection.getRangeAt(0)
        : null;
    if (!root || !range || !root.contains(range.commonAncestorContainer))
      return;
    selection?.removeAllRanges();
    selection?.addRange(range);
    if (format === "bold") document.execCommand("bold");
    else if (format === "italic") document.execCommand("italic");
    else {
      document.execCommand("removeFormat");
      const live = selection?.getRangeAt(0);
      if (live && !live.collapsed) clearLanguageInRange(live);
    }
    onChange(serializeExplanation(root));
    root.focus();
    rememberSelection();
  }
  function applyLanguage(language: "es" | "en" | null) {
    if (!restoreSelection()) return;
    setLanguageMode(language);
    rememberSelection();
  }
  function applyNormalText() {
    if (!restoreSelection()) return;
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (!range) return;
    if (range.collapsed) {
      const current = caretMark();
      if (current) placeCaretAfter(current);
      // removeFormat does not reliably clear the browser's collapsed-caret
      // typing state, so explicitly toggle active inline commands off first.
      for (const command of ["bold", "italic"])
        if (document.queryCommandState(command)) document.execCommand(command);
      document.execCommand("removeFormat");
      endTypingMode();
      rootRef.current?.focus();
      rememberSelection();
      return;
    }
    formatSelection("clear");
  }
  function finishEditing(root: HTMLDivElement) {
    endTypingMode();
    const nextMarkdown = serializeExplanation(root);
    for (const node of Array.from(root.childNodes))
      if (
        node.nodeType === Node.TEXT_NODE ||
        (node instanceof HTMLElement &&
          !node.classList.contains("practice-markdown-content"))
      )
        node.remove();
    editingRef.current = false;
    savedRangeRef.current = null;
    setIsActive(false);
    setHasSelection(false);
    setRenderedMarkdown(nextMarkdown);
    onChange(nextMarkdown);
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
          setIsActive(true);
          const content = rootRef.current?.querySelector<HTMLElement>(
            ".practice-markdown-content",
          );
          if (content && content.childNodes.length === 0) {
            const range = document.createRange();
            range.selectNodeContents(content);
            range.collapse(true);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        }}
        onMouseUp={() => {
          rememberSelection();
          endTypingMode();
        }}
        onKeyUp={(event) => {
          rememberSelection();
          if (typingModeRef.current && event.key.startsWith("Arrow")) {
            const mark = caretMark();
            if (!mark || mark.dataset.language !== typingModeRef.current)
              endTypingMode();
          }
        }}
        onInput={(event) => {
          event.currentTarget.removeAttribute("data-empty");
          onChange(serializeExplanation(event.currentTarget));
        }}
        onBlur={(event) => {
          if (
            event.relatedTarget instanceof HTMLElement &&
            event.relatedTarget.closest(".authoring-format-menu")
          )
            return;
          finishEditing(event.currentTarget);
        }}
        onKeyDown={(event) => {
          // Ctrl+Alt, not Alt alone: plain Alt+letter is commonly grabbed by
          // Linux window managers (app-launch/switch binds) before the page
          // ever sees the keydown, and Ctrl+letter alone collides with the
          // browser — Ctrl+Alt is free of both in practice.
          if (
            event.altKey &&
            event.ctrlKey &&
            !event.metaKey &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            if (event.code === "KeyQ") {
              event.preventDefault();
              event.stopPropagation();
              setLanguageMode("es");
              return;
            }
            if (event.code === "KeyW") {
              event.preventDefault();
              event.stopPropagation();
              setLanguageMode(null);
              return;
            }
            if (event.code === "KeyE") {
              event.preventDefault();
              event.stopPropagation();
              setLanguageMode("en");
              return;
            }
          }
          if (
            (event.ctrlKey || event.metaKey) &&
            !event.shiftKey &&
            event.key.toLowerCase() === "b"
          ) {
            event.preventDefault();
            formatSelection("bold");
            return;
          }
          if (
            (event.ctrlKey || event.metaKey) &&
            !event.shiftKey &&
            event.key.toLowerCase() === "i"
          ) {
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
            if (typingModeRef.current) {
              endTypingMode();
              return;
            }
            event.currentTarget
              .closest("[data-document-block]")
              ?.querySelector<HTMLElement>(
                ".lesson-document-block-chrome summary",
              )
              ?.focus();
          }
        }}
      >
        <PracticeMarkdown
          key={renderedMarkdown}
          markdown={renderedMarkdown}
          variant={variant}
        />
      </div>
      {typingMode && (
        <span
          className="authoring-mode-badge"
          data-language={typingMode}
          aria-hidden="true"
        >
          {typingMode === "es" ? "Spanish" : "English"}{" "}
          <kbd>{typingMode === "es" ? "Ctrl Alt Q" : "Ctrl Alt E"}</kbd>
        </span>
      )}
      {showSelectionMenu && isActive && (
        <div
          className="authoring-format-menu"
          role="toolbar"
          aria-label="Format explanation text"
          data-has-selection={hasSelection ? "true" : "false"}
          onBlur={(event) => {
            if (
              event.relatedTarget instanceof HTMLElement &&
              event.relatedTarget.closest(".authoring-wysiwyg-shell")
            )
              return;
            if (rootRef.current) finishEditing(rootRef.current);
          }}
        >
          <FormatButton
            label="Spanish"
            shortcut="Ctrl Alt Q"
            className="spanish"
            pressed={typingMode === "es"}
            onFormat={() => applyLanguage("es")}
          />
          <FormatButton
            label="English"
            shortcut="Ctrl Alt E"
            className="english"
            pressed={typingMode === "en"}
            onFormat={() => applyLanguage("en")}
          />
          <FormatButton
            label="Normal"
            shortcut="Ctrl Alt W"
            onFormat={applyNormalText}
          />
          <FormatButton
            label="Bold"
            shortcut="Ctrl/⌘ B"
            onFormat={() => formatSelection("bold", true)}
          />
          <FormatButton
            label="Italic"
            shortcut="Ctrl/⌘ I"
            onFormat={() => formatSelection("italic", true)}
          />
        </div>
      )}
    </div>
  );
}
function FormatButton({
  label,
  shortcut,
  className = "",
  pressed,
  onFormat,
}: {
  label: string;
  shortcut: string;
  className?: string;
  pressed?: boolean;
  onFormat: () => void;
}) {
  return (
    <button
      type="button"
      className={className}
      aria-pressed={pressed}
      title={`${label} (${shortcut})`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onFormat}
    >
      {label} <kbd>{shortcut}</kbd>
    </button>
  );
}
