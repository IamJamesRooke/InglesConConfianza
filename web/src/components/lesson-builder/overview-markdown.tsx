import { normalizeLessonMarkdown } from "@/lib/lesson-builder/markdown";

export function OverviewMarkdown({ markdown }: { markdown: string }) {
  const lines = normalizeLessonMarkdown(markdown)
    .split(/\r?\n/u)
    .map((line) => line.replace(/^#{1,6}\s*/u, "").trim())
    .filter(Boolean);

  return lines.map((line, lineIndex) => {
    const parts = line.split(/(\\?<kbd>[^<]+?\\?<\/kbd>|==[^=]+==)/u);

    return (
      <p key={`${line}-${lineIndex}`} className="whitespace-pre-wrap">
        {parts.map((part, partIndex) => {
          const keyboardShortcutMatch =
            /^\\?<kbd>([^<]+?)\\?<\/kbd>$/u.exec(part);

          if (keyboardShortcutMatch) {
            return (
              <kbd
                key={`${part}-${partIndex}`}
                className="mx-1 inline-flex items-center rounded-md border border-stone-300 bg-stone-100 px-1.5 py-0.5 font-mono text-xs font-semibold leading-none text-stone-700 shadow-sm"
              >
                {keyboardShortcutMatch[1]}
              </kbd>
            );
          }

          return part.startsWith("==") && part.endsWith("==") ? (
            <strong
              key={`${part}-${partIndex}`}
              className="font-bold text-stone-900"
            >
              {part.slice(2, -2)}
            </strong>
          ) : (
            part
          );
        })}
      </p>
    );
  });
}
