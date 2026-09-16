// The collapsed "Covers" quiet-line button for the compact Covers field (see lesson-concepts-field.tsx §5).
"use client";

export function CoversSummary({
  terms,
  onOpen,
}: {
  terms: string[];
  onOpen: () => void;
}) {
  const shown = terms.slice(0, 3);
  const extra = terms.length - shown.length;
  return (
    <button
      type="button"
      data-covers-summary
      className="lesson-covers-summary"
      onClick={onOpen}
      onFocus={onOpen}
      aria-label="Covers — click or press Enter to edit"
    >
      <span className="lesson-covers-summary-label">Covers</span>
      {shown.map((term, index) => (
        <span key={index} className="lesson-covers-summary-term">
          {" "}
          · {term}
        </span>
      ))}
      {extra > 0 && <span className="lesson-covers-summary-more"> · +{extra}</span>}
    </button>
  );
}
