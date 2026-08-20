import { normalizeLessonMarkdown } from "@/lib/lesson-builder/markdown";

const inlineMarkdownPattern =
  /(\\?<kbd>[^<]+?\\?<\/kbd>|==[^=]+==|\*\*[^*]+?\*\*|__[^_]+?__|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/gu;

export function OverviewMarkdown({ markdown }: { markdown: string }) {
  const lines = normalizeLessonMarkdown(markdown)
    .split(/\r?\n/u)
    .map((line) => line.replace(/^#{1,6}\s*/u, "").trim())
    .filter(Boolean);

  return lines.map((line, lineIndex) => {
    const parts = line.split(inlineMarkdownPattern);

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

          if (part.startsWith("==") && part.endsWith("==")) {
            return (
              <mark
                key={`${part}-${partIndex}`}
                className="rounded bg-amber-200 px-1 font-bold text-stone-950"
              >
                {part.slice(2, -2)}
              </mark>
            );
          }

          if (
            (part.startsWith("**") && part.endsWith("**")) ||
            (part.startsWith("__") && part.endsWith("__"))
          ) {
            return (
              <strong
                key={`${part}-${partIndex}`}
                className="font-bold text-stone-900"
              >
                {part.slice(2, -2)}
              </strong>
            );
          }

          if (
            (part.startsWith("*") && part.endsWith("*")) ||
            (part.startsWith("_") && part.endsWith("_"))
          ) {
            return (
              <em key={`${part}-${partIndex}`} className="italic">
                {part.slice(1, -1)}
              </em>
            );
          }

          return (
            <span
              key={`${part}-${partIndex}`}
            >
              {part}
            </span>
          );
        })}
      </p>
    );
  });
}
