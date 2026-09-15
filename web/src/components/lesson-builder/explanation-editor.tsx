"use client";
import { useEffect, useRef, useState } from "react";
import {
  PracticeMarkdown,
  type PracticeMarkdownVariant,
} from "@/components/practice/practice-markdown";
import { serializeExplanation } from "@/lib/lesson-builder/serialize-explanation";
const WRAPPER_CLASS = "practice-markdown-content";

// Chrome's own paragraph split (Enter, in a never-yet-saved explanation
// whose content isn't wrapped in real <p> tags yet) duplicates the root
// wrapper's class onto the new sibling <div>; a rich-HTML paste can also
// leave a nested duplicate wrapper (`<div class="...content"><div
// class="...content">…</div></div>`). `serializeExplanation` no longer
// depends on this class at all (it walks from the root unconditionally —
// see serialize-explanation.ts), but other code here (`onFocus`'s empty-
// content caret placement, `finishEditing`'s cleanup) still looks the
// wrapper up by class, so keep the live DOM tidy: only the first
// same-class child of `root` keeps the class, and a wrapper nested inside
// another wrapper is unwrapped (its children hoisted, the duplicate
// removed).
function normalizeEditorDom(root: HTMLElement) {
  let seenTop = false;
  for (const child of Array.from(root.children)) {
    if (child.classList.contains(WRAPPER_CLASS)) {
      if (seenTop) child.classList.remove(WRAPPER_CLASS);
      else seenTop = true;
    }
    unwrapNestedWrappers(child);
  }
}

function unwrapNestedWrappers(node: Element) {
  for (const child of Array.from(node.children)) {
    if (child.classList.contains(WRAPPER_CLASS)) {
      while (child.firstChild) node.insertBefore(child.firstChild, child);
      child.remove();
      continue;
    }
    unwrapNestedWrappers(child);
  }
}

// Real OS paste (`text/plain`, falling back to stripping `text/html` down to
// text) is inserted as our own paragraphs/line breaks instead of letting the
// browser drop in foreign markup — a rich page paste used to explode one
// sentence into five disconnected paragraphs plus a list, since every
// element the source page used (spans, links, <li>s) became its own block
// once pasted. Styles/links/lists are intentionally dropped: this is the
// teacher's own bilingual dialect, not a web page.
// `text/plain` is the primary source; `text/html` (stripped down to its own
// text) is only a fallback for clipboard entries that carry no plain-text
// form at all — a paste from a source that supplies both wins on its own
// plain-text rendering, since that's usually the more sensible one for a
// dialect this constrained. `fromHtml` records which source actually won,
// since a single embedded newline means something different in each: a
// deliberate line break in real plain text, versus incidental markup
// whitespace in an HTML source with no plain-text fallback.
function extractPastedText(clipboardData: DataTransfer): {
  text: string;
  fromHtml: boolean;
} {
  const plain = clipboardData.getData("text/plain");
  if (plain) return { text: plain, fromHtml: false };
  const html = clipboardData.getData("text/html");
  if (!html) return { text: "", fromHtml: false };
  return { text: htmlToPlainText(html), fromHtml: true };
}

// A one-sentence rich-HTML paste (a bolded run, a colored span, a link) is
// still one paragraph — those are inline elements. Only genuine block-level
// boundaries (a paragraph/div/list-item/heading/line-break/table-row) become
// a paragraph break here, so a source `<ul>` becomes a few short paragraphs
// instead of the whole snippet gluing into one run with no separators, but a
// plain inline-formatted sentence doesn't explode the way it used to when
// the browser's raw markup was inserted node-by-node instead of read as text.
function htmlToPlainText(html: string): string {
  const template = document.createElement("template");
  template.innerHTML = html;
  for (const element of Array.from(
    template.content.querySelectorAll("p, div, li, h1, h2, h3, h4, h5, h6, br, tr"),
  )) {
    element.after(document.createTextNode("\n\n"));
  }
  return (template.content.textContent ?? "").trim();
}

function insertPastedText(text: string, fromHtml: boolean) {
  const paragraphs = text.split(/\n\s*\n/u);
  paragraphs.forEach((paragraph, index) => {
    if (index > 0) document.execCommand("insertParagraph");
    // A single newline pasted from an HTML source usually isn't a
    // deliberate line break (it's just how the source's markup wrapped) —
    // collapse it to a space. From plain text, a single newline is a real
    // authored line break: keep it as one, via <br>.
    const lines = paragraph.split("\n");
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        if (fromHtml) document.execCommand("insertText", false, " ");
        else document.execCommand("insertHTML", false, "<br>");
      }
      if (line) document.execCommand("insertText", false, line);
    });
  });
}

export function EditablePracticeMarkdown({
  markdown,
  onChange,
  placeholder,
  ariaLabel,
  fieldName,
  variant = "explanation",
  showSelectionMenu = true,
  onExit,
  onUndo,
  onRedo,
}: {
  markdown: string;
  // `boundary: true` marks a formatting op or a paragraph break so the undo
  // history never coalesces it with the plain typing before/after it (see
  // lib/lesson-builder/history.ts).
  onChange: (markdown: string, options?: { boundary?: boolean }) => void;
  placeholder: string;
  ariaLabel: string;
  fieldName?: string;
  variant?: PracticeMarkdownVariant;
  showSelectionMenu?: boolean;
  onExit?: () => void;
  // Undo/redo routed through the page's own reducer history instead of
  // native contentEditable undo (which groups changes far more coarsely
  // than a teacher expects — 3 native Ctrl+Z presses after "type, bold,
  // type" wipes the whole field). Returns the restored contentMarkdown for
  // this block, or null if there was nothing to undo/redo. When provided,
  // native undo is suppressed entirely inside this field.
  onUndo?: () => string | null;
  onRedo?: () => string | null;
}) {
  const [renderedMarkdown, setRenderedMarkdown] = useState(markdown);
  const [isActive, setIsActive] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [typingMode, setTypingMode] = useState<"es" | "en" | null>(null);
  const typingModeRef = useRef<"es" | "en" | null>(null);
  const editingRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  // `document.execCommand` (bold/italic/removeFormat, and every
  // `insertText`/`insertParagraph`/`insertHTML` the paste handler below
  // issues) fires a native `input` event synchronously as part of the same
  // call — which the `onInput` handler would otherwise treat as ordinary
  // (non-boundary) typing and coalesce into whatever history step preceded
  // it. That silently merged a Ctrl+B onto the typing before it, so "type,
  // bold, type" produced only two undo steps instead of three. Every caller
  // that drives `execCommand` sets this around the call and issues its own
  // explicit `onChange` afterward instead.
  const suppressInputRef = useRef(false);
  // Set on Enter's keydown, consumed by the very next input event (the
  // paragraph split it produces) — a paragraph break is its own undo
  // boundary, never coalesced with the typing before or after it.
  const nextInputIsBoundaryRef = useRef(false);
  // Set right before an undo/redo-driven `setRenderedMarkdown`, consumed by
  // the effect below once the remount (`key={renderedMarkdown}`) lands, to
  // place the caret at the end of the restored content — undo/redo replaces
  // the field's content on purpose, unlike every other renderedMarkdown
  // change (which either happens on blur, when the caret doesn't matter, or
  // is skipped entirely while `editingRef.current` is true).
  const pendingCaretToEndRef = useRef(false);
  useEffect(() => {
    if (!editingRef.current) setRenderedMarkdown(markdown);
  }, [markdown]);
  useEffect(() => {
    if (!pendingCaretToEndRef.current) return;
    pendingCaretToEndRef.current = false;
    const root = rootRef.current;
    if (!root) return;
    root.focus({ preventScroll: true });
    const range = document.createRange();
    range.selectNodeContents(root);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [renderedMarkdown]);
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
      onChange(serializeExplanation(root), { boundary: true });
      root.focus();
      return;
    }
    // Checked before the "wrap the adjacent word" shortcut below: if the
    // caret is already inside a mark (same language or the other one), that
    // shortcut used to wrap the trailing word in a brand-new mark *without
    // leaving the enclosing one* — nesting `[[en:hola]]` inside `[[es:…]]`
    // for a same-word switch with no separating space/character. Falling
    // through instead to the close-current/open-sibling logic below (which
    // also arms typing mode for what's typed next) keeps marks siblings.
    const current = caretMark();
    if (next && !current) {
      const word = wordAroundCaret(range);
      if (word && !word.collapsed) {
        placeCaretAfter(wrapRange(word, next));
        onChange(serializeExplanation(root), { boundary: true });
        endTypingMode();
        root.focus();
        return;
      }
    }
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
    // A real (non-collapsed) selection is the "apply to this text" case; a
    // collapsed caret is the "arm/disarm typing mode" case (ordinary
    // word-processor Ctrl+B behavior) and must be left alone below.
    const hadSelection = !range.collapsed;
    selection?.removeAllRanges();
    selection?.addRange(range);
    suppressInputRef.current = true;
    if (format === "bold") document.execCommand("bold");
    else if (format === "italic") document.execCommand("italic");
    else {
      document.execCommand("removeFormat");
      const live = selection?.getRangeAt(0);
      if (live && !live.collapsed) clearLanguageInRange(live);
    }
    if (hadSelection && format !== "clear") {
      // Chrome/Firefox both carry the just-applied inline style forward as
      // "next typed character" state even after formatting a real
      // selection, which is why bolding two words used to bold the rest of
      // the sentence as the teacher kept typing. Collapse to the end of
      // what we just formatted, then explicitly re-toggle the command off
      // if the browser still reports it "on" for the (now empty) caret —
      // execCommand on a collapsed selection only flips the pending-typing
      // flag, it doesn't touch any existing text.
      const current = window.getSelection();
      current?.collapseToEnd();
      if (document.queryCommandState(format)) document.execCommand(format);
    }
    suppressInputRef.current = false;
    onChange(serializeExplanation(root), { boundary: true });
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
      suppressInputRef.current = true;
      for (const command of ["bold", "italic"])
        if (document.queryCommandState(command)) document.execCommand(command);
      document.execCommand("removeFormat");
      suppressInputRef.current = false;
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
        (node instanceof HTMLElement && !node.classList.contains(WRAPPER_CLASS))
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
            `.${WRAPPER_CLASS}`,
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
          if (suppressInputRef.current) return;
          event.currentTarget.removeAttribute("data-empty");
          normalizeEditorDom(event.currentTarget);
          const boundary = nextInputIsBoundaryRef.current;
          nextInputIsBoundaryRef.current = false;
          onChange(
            serializeExplanation(event.currentTarget),
            boundary ? { boundary: true } : undefined,
          );
        }}
        onPaste={(event) => {
          const clipboardData = event.clipboardData;
          if (!clipboardData) return;
          event.preventDefault();
          const { text, fromHtml } = extractPastedText(clipboardData);
          if (!text) return;
          suppressInputRef.current = true;
          insertPastedText(text, fromHtml);
          suppressInputRef.current = false;
          normalizeEditorDom(event.currentTarget);
          onChange(serializeExplanation(event.currentTarget), {
            boundary: true,
          });
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
            if (event.code === "KeyS") {
              event.preventDefault();
              event.stopPropagation();
              setLanguageMode("es");
              return;
            }
            if (event.code === "KeyN") {
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
          if (
            (event.ctrlKey || event.metaKey) &&
            !event.altKey &&
            event.key.toLowerCase() === "z" &&
            (onUndo || onRedo)
          ) {
            // Native contentEditable undo groups changes far more coarsely
            // than a teacher expects (3 presses after "type, bold, type"
            // wipes the whole field, per the friction pass) — route to the
            // page's own reducer history instead, which already coalesces
            // sensibly, and suppress native undo entirely inside this field.
            event.preventDefault();
            const restored = event.shiftKey ? onRedo?.() : onUndo?.();
            if (typeof restored === "string") {
              endTypingMode();
              pendingCaretToEndRef.current = true;
              setRenderedMarkdown(restored);
            }
            return;
          }
          if (event.key === "Enter") {
            endTypingMode();
            nextInputIsBoundaryRef.current = true;
            return;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            if (typingModeRef.current) {
              endTypingMode();
              return;
            }
            finishEditing(event.currentTarget);
            onExit?.();
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
          <kbd>{typingMode === "es" ? "Ctrl Alt S" : "Ctrl Alt E"}</kbd>
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
            shortcut="Ctrl Alt S"
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
            shortcut="Ctrl Alt N"
            onFormat={applyNormalText}
          />
          <FormatButton
            label="B"
            ariaLabel="Bold"
            shortcut="Ctrl/⌘ B"
            onFormat={() => formatSelection("bold", true)}
          />
          <FormatButton
            label="I"
            ariaLabel="Italic"
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
  ariaLabel,
  shortcut,
  className = "",
  pressed,
  onFormat,
}: {
  label: string;
  ariaLabel?: string;
  shortcut: string;
  className?: string;
  pressed?: boolean;
  onFormat: () => void;
}) {
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      aria-pressed={pressed}
      title={`${ariaLabel ?? label} (${shortcut})`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onFormat}
    >
      {label}
    </button>
  );
}
