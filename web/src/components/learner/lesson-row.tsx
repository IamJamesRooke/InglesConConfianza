import { Check, RotateCcw, SkipForward } from "lucide-react";
import Link from "next/link";

import type { LearnerLesson } from "@/components/learner/types";
import type { LessonProgressEntry } from "@/lib/learner/progress";

/**
 * One lesson entry in a module's list. An available lesson links to
 * `/practice?lesson=<id>` and offers skip / reset; an unavailable lesson renders
 * a "próximamente" placeholder with no link. Progress state comes from the
 * dashboard; this component reads it but never mutates it.
 */
export function LessonRow({
  lesson,
  progress,
  isNext,
  onSkip,
  onReset,
}: {
  lesson: LearnerLesson;
  progress?: LessonProgressEntry;
  isNext: boolean;
  onSkip: () => void;
  onReset: () => void;
}) {
  const complete = Boolean(progress?.completedAt);
  const hasProgress = Boolean(progress?.completedAt || progress?.lastOpenedAt);
  const available = lesson.stepCount > 0;
  const content = (
    <>
      <span className="lesson-number" aria-hidden="true">
        {complete ? (
          <Check size={19} />
        ) : (
          String(lesson.moduleLessonNumber).padStart(2, "0")
        )}
      </span>
      <span className="lesson-copy">
        <strong lang="en">
          {lesson.name || `Lección ${lesson.lessonNumber}`}
        </strong>
        <span lang="es">
          {available
            ? lesson.previewText
            : "Una nueva conversación, muy pronto."}
        </span>
      </span>
    </>
  );
  return (
    <li
      className={`lesson-row ${complete ? "complete" : ""} ${isNext ? "next" : ""} ${!available ? "unavailable" : ""}`}
    >
      <div className="lesson-row-layout">
        {available ? (
          <Link href={`/practice?lesson=${encodeURIComponent(lesson.id)}`}>
            {content}
          </Link>
        ) : (
          <div className="lesson-row-content">{content}</div>
        )}
        {available && (
          <div className="lesson-progress-options">
            {!complete && (
              <button type="button" onClick={onSkip} className="progress-option">
                <SkipForward size={14} aria-hidden="true" />
                Omitir
              </button>
            )}
            {hasProgress && (
              <button type="button" onClick={onReset} className="progress-option">
                <RotateCcw size={14} aria-hidden="true" />
                Reiniciar
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
