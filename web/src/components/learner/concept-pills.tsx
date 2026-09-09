import type { LearnerConcept } from "@/components/learner/types";

/**
 * The "lo que vas a aprender" concept list shown on the dashboard and inside each
 * lesson row. `compact` switches to the tighter in-row styling; `max` caps the
 * visible pills and renders a "+N" overflow marker.
 */
export function ConceptPills({
  concepts,
  compact = false,
  max,
}: {
  concepts: LearnerConcept[];
  compact?: boolean;
  max?: number;
}) {
  if (concepts.length === 0) return null;
  const shown = max ? concepts.slice(0, max) : concepts;
  const overflow = concepts.length - shown.length;

  return (
    <div
      className={`learner-concepts ${compact ? "compact" : ""}`}
      aria-label="Lo que vas a aprender"
    >
      {shown.map((concept) => (
        <span className="learner-concept" key={concept.id}>
          <strong lang="en">{concept.english}</strong>
          <span lang="es">{concept.spanish}</span>
        </span>
      ))}
      {overflow > 0 && (
        <span className="learner-concept-more">+{overflow}</span>
      )}
    </div>
  );
}
