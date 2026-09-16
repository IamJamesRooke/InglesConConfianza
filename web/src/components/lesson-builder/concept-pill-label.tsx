import { renderConceptLabel } from "@/lib/lesson-builder/concept-label";

// Shared two-line pill label — English target on top (full ink), Spanish
// below (muted-foreground) — used by every linked concept pill: the
// syllabus card, a lesson's Covers field compact chips, and the "Add from
// Level…" picker rows (owner, 2026-09-16 — stacked bilingual pills, English
// on top; replaces the single-line "spanish → english" markup and its `→`
// CSS ::before). Bracketed placeholders keep the existing recede treatment
// on both lines via `renderConceptLabel`. Freehand pills (no concept) never
// render this — they stay single-line plain text.
export function ConceptPillLabel({ english, spanish }: { english: string; spanish: string }) {
  return (
    <span className="lesson-concept-pill-label">
      <span className="lesson-concept-pill-en">{renderConceptLabel(english)}</span>
      <span className="lesson-concept-pill-es">{renderConceptLabel(spanish)}</span>
    </span>
  );
}
