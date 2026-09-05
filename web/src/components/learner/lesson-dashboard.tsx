"use client";

import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Check,
  CheckCheck,
  Clock3,
  MessageCircle,
  Play,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import {
  nextLessonToStudy,
  readProgress,
  resetLessonProgress,
  serverProgress,
  skipLesson,
  skipLessons,
  subscribeToProgress,
  type LessonProgressEntry,
} from "@/lib/learner/progress";
import { lessonMinutes } from "@/lib/learner/presentation";

type LearnerLesson = {
  id: string;
  lessonNumber: number;
  moduleLessonNumber: number;
  name: string | null;
  previewText: string;
  stepCount: number;
  concepts: LearnerConcept[];
};
type LearnerConcept = {
  id: string;
  spanish: string;
  english: string;
};
type LearnerModule = {
  id: string;
  name: string | null;
  kind: "course" | "onboarding";
  lessonCount: number;
  concepts: LearnerConcept[];
  lessons: LearnerLesson[];
};

function moduleLabel(modules: LearnerModule[], index: number) {
  return modules[index]?.kind === "onboarding"
    ? "Primeros pasos"
    : `Módulo ${modules.slice(0, index + 1).filter((module) => module.kind !== "onboarding").length}`;
}

export function LessonDashboard({
  modules,
  initialModuleId = null,
}: {
  modules: LearnerModule[];
  initialModuleId?: string | null;
}) {
  const progress = useSyncExternalStore(
    subscribeToProgress,
    readProgress,
    serverProgress,
  );
  const [selectedId, setSelectedId] = useState(initialModuleId);
  const [resetTarget, setResetTarget] = useState<{
    label: string;
    lessonIds: string[];
    scope: "lesson" | "module";
  } | null>(null);
  const moduleButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const lessons = modules.flatMap((module) => module.lessons);
  const available = lessons.filter((lesson) => lesson.stepCount > 0);
  const completed = available.filter(
    (lesson) => progress[lesson.id]?.completedAt,
  ).length;
  const nextLesson = nextLessonToStudy(lessons, progress);
  const nextModule = modules.find((module) =>
    module.lessons.some((lesson) => lesson.id === nextLesson?.id),
  );
  const selected =
    modules.find((module) => module.id === selectedId) ??
    nextModule ??
    modules[0];
  const courseComplete = available.length > 0 && completed === available.length;
  const moduleAvailable =
    selected?.lessons.filter((lesson) => lesson.stepCount > 0) ?? [];
  const moduleCompleted = moduleAvailable.filter(
    (lesson) => progress[lesson.id]?.completedAt,
  ).length;
  const selectedIndex = modules.indexOf(selected);
  const hasActivity = available.some(
    (lesson) =>
      progress[lesson.id]?.lastOpenedAt ||
      progress[lesson.id]?.completedAt,
  );

  function resetLesson(lesson: LearnerLesson) {
    setResetTarget({
      label: lesson.name || `Lección ${lesson.lessonNumber}`,
      lessonIds: [lesson.id],
      scope: "lesson",
    });
  }

  function resetModule(module: LearnerModule) {
    setResetTarget({
      label: module.name || "este módulo",
      lessonIds: module.lessons.map((lesson) => lesson.id),
      scope: "module",
    });
  }

  function selectModule(index: number) {
    setSelectedId(modules[index].id);
    const url = new URL(window.location.href);
    url.searchParams.set("module", modules[index].id);
    window.history.replaceState(null, "", url);
  }

  return (
    <main id="main-content" tabIndex={-1} className="learner-theme course-home">
      <div className="course-container">
        {nextLesson ? (
          <section
            className="course-feature learner-enter"
            aria-labelledby="next-lesson-title"
          >
            <div className="course-feature-content">
              <p className="learner-eyebrow">Inglés para la vida real</p>
              <h1>
                {hasActivity ? (
                  <>
                    Sigamos conversando<span aria-hidden="true">.</span>
                  </>
                ) : (
                  <>
                    Habla inglés.
                    <br />
                    Con confianza<span aria-hidden="true">.</span>
                  </>
                )}
              </h1>
              <p className="course-promise">
                Aprende paso a paso y construye frases que puedes usar desde hoy.
              </p>
              <div className="featured-lesson">
                <p className="featured-lesson-label">
                  {courseComplete
                    ? "Vuelve a practicar"
                    : progress[nextLesson.id]?.lastOpenedAt
                      ? "Continúa donde estabas"
                      : completed
                        ? "Tu siguiente lección"
                        : "Tu primera lección"}
                </p>
                <h2 id="next-lesson-title">
                  {nextLesson.name || `Lección ${nextLesson.lessonNumber}`}
                </h2>
                <p className="feature-meta">
                  <Clock3 size={15} aria-hidden="true" />
                  {lessonMinutes(nextLesson.stepCount)} min
                  <span aria-hidden="true">·</span>
                  {moduleLabel(modules, modules.indexOf(nextModule!))}
                </p>
                <ConceptPills concepts={nextLesson.concepts} compact />
                <Link
                  href={`/practice?lesson=${encodeURIComponent(nextLesson.id)}`}
                  className="learner-button primary"
                >
                  {courseComplete
                    ? "Volver a practicar"
                    : progress[nextLesson.id]?.lastOpenedAt
                      ? "Continuar lección"
                      : completed
                        ? "Empezar siguiente lección"
                        : "Empezar mi primera lección"}
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="course-feature-demo" aria-hidden="true">
              <p>Una idea útil</p>
              <div className="demo-phrase">
                <strong>I can speak English.</strong>
                <span>Puedo hablar inglés.</span>
              </div>
              <div className="demo-confidence">
                <Check size={18} strokeWidth={2.5} />
                <span>Ya lo puedes decir</span>
              </div>
            </div>
          </section>
        ) : (
          <section className="course-empty">
            <BookOpen size={32} aria-hidden="true" />
            <h2>Nos vemos pronto</h2>
            <p>Las próximas conversaciones ya están en camino.</p>
          </section>
        )}

        {selected && (
          <section
            className="course-journey"
            aria-labelledby="course-journey-title"
          >
            <div className="course-journey-heading">
              <div>
                <p className="learner-eyebrow">Tu curso</p>
                <h2 id="course-journey-title">Tu recorrido</h2>
              </div>
              {hasActivity && (
                <p className="course-progress-summary">
                  <strong>{completed}</strong> de {available.length} lecciones
                  completas
                </p>
              )}
            </div>
            <div className="course-curriculum">
              <aside className="module-navigation">
                <div className="section-label">
                  <h3>Módulos</h3>
                  <span>{modules.length}</span>
                </div>
              <div
                role="tablist"
                aria-label="Módulos del curso"
                className="module-tabs"
              >
                {modules.map((module, index) => {
                  const ready = module.lessons.filter(
                    (lesson) => lesson.stepCount > 0,
                  );
                  const done = ready.filter(
                    (lesson) => progress[lesson.id]?.completedAt,
                  ).length;
                  const isDone = ready.length > 0 && done === ready.length;
                  return (
                    <button
                      key={module.id}
                      ref={(node) => {
                        moduleButtons.current[index] = node;
                      }}
                      type="button"
                      role="tab"
                      id={`module-tab-${module.id}`}
                      aria-controls="module-lessons"
                      aria-selected={selected.id === module.id}
                      tabIndex={selected.id === module.id ? 0 : -1}
                      className={`module-tab ${selected.id === module.id ? "selected" : ""} ${isDone ? "complete" : ""}`}
                      onClick={() => selectModule(index)}
                      onKeyDown={(event) => {
                        let target = index;
                        if (
                          event.key === "ArrowRight" ||
                          event.key === "ArrowDown"
                        )
                          target = (index + 1) % modules.length;
                        else if (
                          event.key === "ArrowLeft" ||
                          event.key === "ArrowUp"
                        )
                          target =
                            (index - 1 + modules.length) % modules.length;
                        else if (event.key === "Home") target = 0;
                        else if (event.key === "End")
                          target = modules.length - 1;
                        else return;
                        event.preventDefault();
                        selectModule(target);
                        moduleButtons.current[target]?.focus();
                      }}
                    >
                      <span className="module-symbol" aria-hidden="true">
                        {isDone ? (
                          <Check size={20} />
                        ) : module.kind === "onboarding" ? (
                          <MessageCircle size={20} />
                        ) : (
                          String(
                            modules
                              .slice(0, index + 1)
                              .filter((item) => item.kind !== "onboarding")
                              .length,
                          ).padStart(2, "0")
                        )}
                      </span>
                      <span className="module-tab-copy">
                        <span className="module-label">
                          {moduleLabel(modules, index)}
                        </span>
                        <strong>
                          {module.name || moduleLabel(modules, index)}
                        </strong>
                        <span className="module-count">
                          {ready.length
                            ? `${done} de ${ready.length} completas`
                            : "Próximamente"}
                        </span>
                      </span>
                      <ArrowRight
                        className="module-arrow"
                        size={16}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
                </div>
              </aside>

            <section
              id="module-lessons"
              role="tabpanel"
              aria-labelledby={`module-tab-${selected.id}`}
              tabIndex={0}
              className="module-lessons"
              key={selected.id}
            >
              <div className="module-heading">
                <div>
                  <p className="learner-eyebrow">
                    {moduleLabel(modules, selectedIndex)}
                  </p>
                  <h2>
                    {selected.name || moduleLabel(modules, selectedIndex)}
                  </h2>
                </div>
                <div className="module-heading-actions">
                  <span className="module-fraction">
                    <strong>{moduleCompleted}</strong>/{moduleAvailable.length}
                  </span>
                  {moduleAvailable.length > 0 &&
                    moduleCompleted < moduleAvailable.length && (
                      <button
                        type="button"
                        className="progress-option"
                        onClick={() =>
                          skipLessons(moduleAvailable.map((lesson) => lesson.id))
                        }
                      >
                        <SkipForward size={14} aria-hidden="true" />
                        Omitir módulo
                      </button>
                    )}
                  {moduleAvailable.some(
                    (lesson) =>
                      progress[lesson.id]?.completedAt ||
                      progress[lesson.id]?.lastOpenedAt,
                  ) && (
                    <button
                      type="button"
                      className="progress-option"
                      onClick={() => resetModule(selected)}
                    >
                      <RotateCcw size={14} aria-hidden="true" />
                      Reiniciar módulo
                    </button>
                  )}
                </div>
              </div>
              <ConceptPills concepts={selected.concepts} />
              <progress
                className="module-progress"
                aria-label="Progreso del módulo"
                value={moduleCompleted}
                max={moduleAvailable.length || 1}
              />
              <ol className="lesson-list">
                {selected.lessons.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    progress={progress[lesson.id]}
                    isNext={lesson.id === nextLesson?.id && !courseComplete}
                    onSkip={() => skipLesson(lesson.id)}
                    onReset={() => resetLesson(lesson)}
                  />
                ))}
              </ol>
              {selected.lessons.length === 0 && (
                <p className="module-empty">
                  Las lecciones de este módulo estarán disponibles pronto.
                </p>
              )}
              {moduleAvailable.length > 0 &&
                moduleCompleted === moduleAvailable.length && (
                  <p className="module-finish">
                    <CheckCheck size={19} aria-hidden="true" /> Módulo completo.
                    Cada frase cuenta.
                  </p>
                )}
              {selectedIndex < modules.length - 1 && (
                <button
                  type="button"
                  className="next-module"
                  onClick={() => {
                    selectModule(selectedIndex + 1);
                    moduleButtons.current[selectedIndex + 1]?.focus();
                  }}
                >
                  Siguiente módulo
                  <ArrowDown size={16} aria-hidden="true" />
                </button>
              )}
              </section>
            </div>
          </section>
        )}
        <footer className="course-footer">
          <span>Inglés con Confianza.</span>
          <span>Una conversación a la vez.</span>
        </footer>
      </div>
      {resetTarget && (
        <div
          className="progress-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setResetTarget(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setResetTarget(null);
          }}
        >
          <section
            className="progress-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="progress-dialog-title"
          >
            <p className="learner-eyebrow">Volver a empezar</p>
            <h2 id="progress-dialog-title">¿Reiniciar {resetTarget.label}?</h2>
            <p>
              {resetTarget.scope === "module"
                ? "Se borrará el progreso de todas las lecciones de este módulo."
                : "Volverás al primer paso de esta lección."}
            </p>
            <div className="progress-dialog-actions">
              <button
                type="button"
                className="learner-button text-button"
                onClick={() => setResetTarget(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="learner-button primary"
                autoFocus
                onClick={() => {
                  resetLessonProgress(resetTarget.lessonIds);
                  setResetTarget(null);
                }}
              >
                Sí, reiniciar
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function ConceptPills({
  concepts,
  compact = false,
}: {
  concepts: LearnerConcept[];
  compact?: boolean;
}) {
  if (concepts.length === 0) return null;

  return (
    <div
      className={`learner-concepts ${compact ? "compact" : ""}`}
      aria-label="Lo que vas a aprender"
    >
      {concepts.map((concept) => (
        <span className="learner-concept" key={concept.id}>
          <strong lang="en">{concept.english}</strong>
          <span lang="es">{concept.spanish}</span>
        </span>
      ))}
    </div>
  );
}

function LessonRow({
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
  const state = complete
    ? "Completada"
    : available
      ? progress?.lastOpenedAt
        ? "En curso"
        : ""
      : "Próximamente";
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
        <strong>{lesson.name || `Lección ${lesson.lessonNumber}`}</strong>
        <span>
          {available
            ? lesson.previewText
            : "Una nueva conversación, muy pronto."}
        </span>
        {available && <ConceptPills concepts={lesson.concepts} compact />}
        <span className="lesson-meta">
          {available && (
            <>
              <Clock3 size={13} aria-hidden="true" /> Aprox.{" "}
              {lessonMinutes(lesson.stepCount)} min
            </>
          )}
          {state && <span className="lesson-state">{state}</span>}
          {isNext && !state && (
            <span className="lesson-state">Empieza aquí</span>
          )}
        </span>
      </span>
      {available && (
        <span className="lesson-action" aria-hidden="true">
          {complete ? (
            <RotateCcw size={17} />
          ) : (
            <Play size={17} fill={isNext ? "currentColor" : "none"} />
          )}
        </span>
      )}
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
