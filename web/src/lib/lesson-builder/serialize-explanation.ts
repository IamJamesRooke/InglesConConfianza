const BLOCK_TAGS = /^(?:p|div|h[1-6]|ol|ul|li|blockquote|pre|section)$/i;

// This function deliberately accesses browser APIs only when it is called by
// the client-side explanation editor; importing it is safe during SSR.
//
// Serializes starting from the editor's own root element — never by
// `querySelector(".practice-markdown-content")`. That class belongs to the
// wrapper `<div>` `PracticeMarkdown` renders, but Chrome's own paragraph
// split (Enter on a never-yet-saved explanation) clones that class onto the
// new sibling `<div>` it creates, and a `querySelector` only ever returns
// the *first* match — every paragraph after the first was silently invisible
// to serialization. Walking from the root's own children, and asking the
// same "does this container hold block-level children?" question at every
// nested `<div>` (see `serializeContainer`/`serializeBlockNode` below)
// makes the class name irrelevant to correctness: any div, named or not,
// singular or duplicated, serializes the same way.
export function serializeExplanation(root: HTMLElement) {
  return serializeContainer(root);
}

function hasBlockChild(nodes: Node[]): boolean {
  return nodes.some(
    (node) => node instanceof HTMLElement && BLOCK_TAGS.test(node.tagName),
  );
}

// A container with no block-level children (no <p>/<div>/<li>/... among its
// direct children) is a flat inline run — text and <mark>/<strong>/etc. sit
// directly inside it, as happens before the first Enter in a brand-new
// explanation. Treat that whole run as one paragraph instead of one block
// per inline node (which would put every marked word on its own line).
// Containers that do have block children serialize as one block per child,
// joined by blank lines. This same question is asked again, recursively,
// for every nested <div> — so a wrapper div is transparent to the decision.
function serializeContainer(container: ParentNode): string {
  const childNodes = Array.from(container.childNodes);
  if (!hasBlockChild(childNodes)) return serializeInlineNodes(container).trim();
  return childNodes
    .flatMap((node) => serializeBlockNode(node))
    .filter(Boolean)
    .join("\n\n")
    .trim();
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
    // A list is ONE block: its items join with a single newline, not the
    // `\n\n` blank-line separator used between top-level blocks. Emitting
    // each <li> as its own top-level block (joined by `\n\n` like every
    // other block) is what used to make a 3-item list degrade into three
    // separate one-item lists on its very first save/reload —
    // `parseLessonMarkdown` treats a blank line as ending a list.
    const items = Array.from(node.children)
      .filter((child) => child.tagName.toLowerCase() === "li")
      .map((item, index) =>
        `${tag === "ol" ? `${index + 1}.` : "-"} ${serializeInlineNodes(item).trim()}`,
      );
    return items.length ? [items.join("\n")] : [];
  }
  if (tag === "p") return [serializeInlineNodes(node).trim()];
  if (tag === "br") return [""];
  if (tag === "div") {
    const inner = serializeContainer(node);
    return inner ? [inner] : [];
  }
  return [serializeInlineNode(node).trim()];
}

function serializeInlineNodes(node: ParentNode) {
  return Array.from(node.childNodes).map(serializeInlineNode).join("");
}

// Wraps `content` in `open`/`close` delimiters, but keeps leading/trailing
// whitespace outside them — `** text**`/`* text*` etc. are not valid
// CommonMark emphasis and silently fail to parse back, dropping the mark on
// the very next render. A wrapper that is all whitespace (or empty) is
// returned untouched: there's nothing to emphasize.
export function wrapTrimmed(content: string, open: string, close: string): string {
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(content);
  const [, lead, core, trail] = match ?? ["", "", content, ""];
  if (!core) return content;
  return `${lead}${open}${core}${close}${trail}`;
}

function serializeInlineNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE)
    return (node.textContent ?? "")
      .replaceAll("​", "")
      .replaceAll(" ", " ");
  if (!(node instanceof HTMLElement)) return "";

  const content = serializeInlineNodes(node);
  switch (node.tagName.toLowerCase()) {
    case "mark":
      if (!content.trim()) return content;
      return node.dataset.language === "es"
        ? wrapTrimmed(content, "[[es:", "]]")
        : node.dataset.language === "en"
          ? wrapTrimmed(content, "[[en:", "]]")
          : wrapTrimmed(content, "==", "==");
    case "strong":
    case "b":
      return wrapTrimmed(content, "**", "**");
    case "em":
    case "i":
      return wrapTrimmed(content, "*", "*");
    case "kbd":
      return `<kbd>${content}</kbd>`;
    case "br":
      return "\n";
    default:
      return content;
  }
}
