export type MarkdownLine =
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

export function normalizeLessonMarkdown(markdown: string) {
  return markdown.replace(/\\=\\=/gu, "==");
}

export function parseLessonMarkdown(markdown: string): MarkdownLine[] {
  const lines = markdown.split(/\r?\n/gu);
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
