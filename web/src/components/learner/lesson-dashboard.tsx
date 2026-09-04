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
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import {
  nextLessonToStudy,
  readProgress,
  serverProgress,
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
};
type LearnerModule = {
  id: string;
  name: string | null;
  kind: "course" | "onboarding";
  lessonCount: number;
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

  function selectModule(index: number) {
    setSelectedId(modules[index].id);
    const url = new URL(window.location.href);
    url.searchParams.set("module", modules[index].id);
    window.history.replaceState(null, "", url);
  }

  return (
    <main id="main-content" tabIndex={-1} className="learner-theme course-home">
      <div className="course-container">
        <div className="course-heading learner-enter">
          <div>
            <p className="learner-eyebrow">INGLÉS PARA TU VIDA</p>
            <h1>
              Mis lecciones<span className="coral-dot">.</span>
            </h1>
          </div>
          <div className="course-total">
            <CheckCheck size={20} aria-hidden="true" />
            <span>
              <strong>{completed}</strong> de {available.length} lecciones
              completas
            </span>
            <progress
              aria-label="Progreso del curso"
              value={completed}
              max={available.length || 1}
            />
          </div>
        </div>

        {nextLesson ? (
          <section
            className="course-feature learner-enter"
            aria-labelledby="next-lesson-title"
          >
            <Image
              src="/images/conversation-bogota.webp"
              alt=""
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="course-art"
            />
            <div className="course-feature-content">
              <p className="learner-eyebrow">
                {courseComplete
                  ? "Todo lo que ya puedes decir"
                  : progress[nextLesson.id]?.lastOpenedAt
                    ? "Retoma tu conversación"
                    : completed
                      ? "Tu siguiente paso"
                      : "Tu primera conversación"}
              </p>
              <h2 id="next-lesson-title">
                {nextLesson.name || `Lección ${nextLesson.lessonNumber}`}
              </h2>
              <p className="feature-meta">
                <Clock3 size={15} aria-hidden="true" /> Aprox.{" "}
                {lessonMinutes(nextLesson.stepCount)} min{" "}
                <span aria-hidden="true">·</span>{" "}
                {moduleLabel(modules, modules.indexOf(nextModule!))}
              </p>
              <Link
                href={`/practice?lesson=${encodeURIComponent(nextLesson.id)}`}
                className="learner-button primary"
              >
                {courseComplete
                  ? "Volver a practicar"
                  : progress[nextLesson.id]?.lastOpenedAt
                    ? "Continuar lección"
                    : "Empezar lección"}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
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
          <div className="course-curriculum">
            <aside className="module-navigation">
              <div className="section-label">
                <h2>Tu recorrido</h2>
                <span>{modules.length} módulos</span>
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
                <span className="module-fraction">
                  <strong>{moduleCompleted}</strong>/{moduleAvailable.length}
                </span>
              </div>
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
        )}
        <footer className="course-footer">
          <span>Inglés Con Confianza</span>
          <span>Una conversación a la vez.</span>
        </footer>
      </div>
    </main>
  );
}

function LessonRow({
  lesson,
  progress,
  isNext,
}: {
  lesson: LearnerLesson;
  progress?: LessonProgressEntry;
  isNext: boolean;
}) {
  const complete = Boolean(progress?.completedAt);
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
      {available ? (
        <Link href={`/practice?lesson=${encodeURIComponent(lesson.id)}`}>
          {content}
        </Link>
      ) : (
        <div>{content}</div>
      )}
    </li>
  );
}
