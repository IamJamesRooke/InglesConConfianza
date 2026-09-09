const BLOCK_TAGS = /^(?:p|div|h[1-6]|ol|ul|li|blockquote|pre|section)$/i;

// This function deliberately accesses browser APIs only when it is called by
// the client-side explanation editor; importing it is safe during SSR.
export function serializeExplanation(root: HTMLElement) {
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
      if (!content.trim()) return content;
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
