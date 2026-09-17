import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ConfirmResetButton } from "@/components/learner/confirm-reset-button";
import type { LearnerLesson } from "@/components/learner/types";
import type { LessonProgressEntry } from "@/lib/learner/progress";

/**
 * One lesson in the home path: a 12px node (filled = done, ring = next,
 * hairline = later) plus a number eyebrow, English title, and Spanish line.
 * The next lesson renders as a white card; every other row is plain. An
 * available lesson links to `/practice?lesson=<id>`; an unavailable one
 * (no authored steps yet) renders a "próximamente" placeholder with no
 * link. No skip, no reset — those moved off the home (see
 * docs/design/learner-direction.md's HOME section).
 */
export function LessonRow({
  lesson,
  progress,
  isNext,
  onReset,
}: {
  lesson: LearnerLesson;
  progress?: LessonProgressEntry;
  isNext: boolean;
  onReset?: (lessonId: string) => void;
}) {
  const complete = Boolean(progress?.completedAt);
  const available = lesson.stepCount > 0;
  const status: "done" | "next" | "later" =
    complete ? "done" : isNext && available ? "next" : "later";
  const content = (
    <>
      <span className={`path-node node-${status}`} aria-hidden="true" />
      <span className="path-row-copy">
        <span className="learner-eyebrow path-row-eyebrow">
          Lección {lesson.moduleLessonNumber}
        </span>
        <strong className="path-row-title" lang="en">
          {lesson.name || `Lección ${lesson.lessonNumber}`}
        </strong>
        <span className="path-row-spanish" lang="es">
          {available
            ? lesson.previewText
            : "Una nueva conversación, muy pronto."}
        </span>
      </span>
      {complete ? (
        <span className="learner-eyebrow path-row-review">Repasar</span>
      ) : null}
      {available ? (
        <ArrowRight
          className="path-row-arrow"
          size={18}
          aria-hidden="true"
        />
      ) : null}
    </>
  );
  return (
    <li
      className={`path-row ${status === "next" ? "path-row-card" : ""} ${!available ? "unavailable" : ""}`}
    >
      {available ? (
        <Link
          href={`/practice?lesson=${encodeURIComponent(lesson.id)}`}
          className="path-row-link"
        >
          {content}
        </Link>
      ) : (
        <div className="path-row-link path-row-static">{content}</div>
      )}
      {complete && onReset ? (
        <ConfirmResetButton
          className="path-row-reset"
          label="Reiniciar"
          confirmLabel="¿Seguro? Reiniciar"
          ariaLabel={`Reiniciar ${lesson.name || `lección ${lesson.moduleLessonNumber}`}`}
          onConfirm={() => onReset(lesson.id)}
        />
      ) : null}
    </li>
  );
}
