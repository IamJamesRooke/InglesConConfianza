import { Check, Circle, Lock, RotateCcw, SkipForward } from "lucide-react";
import Link from "next/link";

import type { LearnerLesson } from "@/components/learner/types";
import { lessonMinutes } from "@/lib/learner/presentation";
import type { LessonProgressEntry } from "@/lib/learner/progress";

/**
 * One lesson entry in the course path. An available lesson links to
 * `/practice?lesson=<id>` and offers skip / reset; an unavailable lesson
 * renders a locked "Pronto" placeholder with no link. Progress state comes
 * from the dashboard; this component reads it but never mutates it.
 */
export function LessonRow({
  lesson,
  progress,
  isNext,
  onSkip,
  onReset,
  delayMs = 0,
}: {
  lesson: LearnerLesson;
  progress?: LessonProgressEntry;
  isNext: boolean;
  onSkip: () => void;
  onReset: () => void;
  /** Stagger offset for the row's fade-up entrance (40ms per row). */
  delayMs?: number;
}) {
  const complete = Boolean(progress?.completedAt);
  const hasProgress = Boolean(progress?.completedAt || progress?.lastOpenedAt);
  const available = lesson.stepCount > 0;
  const content = (
    <>
      <span className="lesson-number" aria-hidden="true">
        {String(lesson.moduleLessonNumber).padStart(2, "0")}
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
      <span className="lesson-state">
        {!available ? (
          <span className="lesson-state-locked">
            <Lock size={13} aria-hidden="true" />
            Pronto
          </span>
        ) : complete ? (
          <span className="lesson-state-done">
            <Check size={16} aria-hidden="true" />
          </span>
        ) : isNext ? (
          <span className="lesson-state-next">
            <span className="lesson-dot lesson-dot-filled" aria-hidden="true" />
            Sigue aquí
          </span>
        ) : (
          <span className="lesson-state-upcoming">
            <Circle size={9} aria-hidden="true" />
          </span>
        )}
        {available && (
          <span className="lesson-duration">
            <span aria-hidden="true">·</span> {lessonMinutes(lesson.stepCount)}{" "}
            min
          </span>
        )}
        {complete && (
          <span className="lesson-repasar" aria-hidden="true">
            Repasar
          </span>
        )}
      </span>
    </>
  );
  return (
    <li
      className={`lesson-row home-fade-up ${complete ? "complete" : ""} ${isNext ? "next" : ""} ${!available ? "unavailable" : ""}`}
      style={{ animationDelay: `${delayMs}ms` }}
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
