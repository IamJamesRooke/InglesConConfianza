export function OverviewMarkdown({ markdown }: { markdown: string }) {
  const lines = markdown
    .split(/\r?\n/u)
    .map((line) => line.replace(/^#{1,6}\s*/u, "").trim())
    .filter(Boolean);

  return lines.map((line, lineIndex) => {
    const parts = line.split(/(==[^=]+==)/u);

    return (
      <p key={`${line}-${lineIndex}`} className="whitespace-pre-wrap">
        {parts.map((part, partIndex) =>
          part.startsWith("==") && part.endsWith("==") ? (
            <strong
              key={`${part}-${partIndex}`}
              className="font-bold text-stone-900"
            >
              {part.slice(2, -2)}
            </strong>
          ) : (
            part
          ),
        )}
      </p>
    );
  });
}
