"use client";

import {
  ChevronDown,
  ChevronRight,
  Play,
  Plus,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";

import { LessonHeaderActions } from "@/components/lesson-builder/lesson-header-actions";
import { ModuleNavigator } from "@/components/lesson-builder/module-navigator";
import "@/styles/module-navigation.css";
import { KeyboardHelpDialog } from "@/components/lesson-builder/keyboard-help";
import {
  LessonDocument,
  LessonDragHandle,
} from "@/components/lesson-builder/lesson-document";
import {
  LessonBuilderProvider,
  type LessonBuilderActions,
} from "@/lib/lesson-builder/builder-context";
import { focusSlideWritingField } from "@/lib/lesson-builder/focus";
import type { Lesson, LessonModule } from "@/lib/lesson-builder/types";

type Props = {
  modules: LessonModule[];
  lessons: Lesson[];
  builder: LessonBuilderActions;
  saveLabel: string;
  saveFailed: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onRetrySave: () => void;
  onAddModule: () => void;
  onDeleteModule: (moduleId: string) => void;
  onMoveModule: (index: number, direction: -1 | 1) => void;
  onReorderModule: (draggedModuleId: string, targetModuleId: string) => void;
  onDropLesson: (
    lessonId: string,
    moduleId: string,
    insertionIndex: number,
  ) => void;
  onMoveLessonToModule: (lessonId: string, moduleId: string) => void;
  onChangeModule: (moduleId: string, patch: Partial<LessonModule>) => void;
};

export function LessonLibrary(props: Props) {
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [collapsedLessons, setCollapsedLessons] = useState<Set<string>>(
    new Set(),
  );
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [dragged, setDragged] = useState<{
    moduleId: string;
    lessonId: string;
  } | null>(null);
  const lastFocusedBeforeHelpRef = useRef<HTMLElement | null>(null);
  const lessonById = useMemo(
    () => new Map(props.lessons.map((lesson) => [lesson.id, lesson])),
    [props.lessons],
  );

  // Only the active module's lessons render as the inline document — the
  // rest live as compact rows in ModuleNavigator. Derived rather than
  // effect-synced, so a deleted/renumbered active module falls back to the
  // first module on the very next render, with no extra render pass.
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const activeModuleId = props.modules.some(
    (module) => module.id === selectedModuleId,
  )
    ? selectedModuleId
    : (props.modules[0]?.id ?? null);

  function openModule(moduleId: string) {
    setSelectedModuleId(moduleId);
  }

  function jumpToLesson(lessonId: string, blockId?: string) {
    setCollapsedLessons((current) => {
      if (!current.has(lessonId)) return current;
      const next = new Set(current);
      next.delete(lessonId);
      return next;
    });
    const home = props.modules.find((module) =>
      module.lessonIds.includes(lessonId),
    );
    if (home) {
      openModule(home.id);
    }
    requestAnimationFrame(() => {
      // data-document-block is LessonDocument's own per-slide anchor.
      const target = blockId
        ? document.querySelector(`[data-document-block="${blockId}"]`)
        : document.querySelector(`[data-lesson-row="${lessonId}"]`);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }


  function collapse(lessonId: string) {
    setCollapsedLessons((current) => {
      const next = new Set(current);
      next.add(lessonId);
      return next;
    });
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLInputElement>(`[data-lesson-title="${lessonId}"]`)
        ?.focus(),
    );
  }

  function toggleLesson(lessonId: string) {
    setCollapsedLessons((current) => toggleSet(current, lessonId));
  }

  function startDrag(
    event: DragEvent<HTMLButtonElement>,
    moduleId: string,
    lessonId: string,
  ) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", lessonId);
    setDragged({ moduleId, lessonId });
  }

  function drop(
    event: DragEvent<HTMLElement>,
    moduleId: string,
    targetIndex: number,
    usePointer = false,
  ) {
    event.preventDefault();
    if (!dragged) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const after = usePointer && event.clientY >= bounds.top + bounds.height / 2;
    props.onDropLesson(
      dragged.lessonId,
      moduleId,
      targetIndex + (after ? 1 : 0),
    );
    setDragged(null);
  }

  function startLesson(moduleId: string, insertionIndex?: number) {
    const lessonId = props.builder.newLesson(moduleId, insertionIndex);
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLInputElement>(`[data-lesson-title="${lessonId}"]`)
        ?.focus();
    });
  }

  function toggleKeyboardHelp() {
    setShowKeyboardHelp((open) => {
      if (!open) {
        // Remember whatever had focus (the Ctrl+. keypress's target, or the
        // header menu's "Keyboard shortcuts" entry) so Escape/close can
        // return it there — there's no fixed trigger button to focus back onto.
        lastFocusedBeforeHelpRef.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
      }
      return !open;
    });
  }

  function closeKeyboardHelp() {
    setShowKeyboardHelp(false);
    requestAnimationFrame(() => lastFocusedBeforeHelpRef.current?.focus());
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        !(event.ctrlKey || event.metaKey) ||
        event.altKey ||
        event.shiftKey ||
        event.key !== "."
      )
        return;
      event.preventDefault();
      toggleKeyboardHelp();
    };
    // Same-page bridge for the header's "Keyboard shortcuts" menu entry
    // (site-header.tsx, outside this component tree) — dispatched instead
    // of prop-drilling dialog state up through the layout. Event name must
    // stay in sync with site-header.tsx's dispatch.
    const onExternalToggle = () => toggleKeyboardHelp();
    document.addEventListener("keydown", onKey);
    document.addEventListener(
      "lesson-builder:toggle-keyboard-help",
      onExternalToggle,
    );
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener(
        "lesson-builder:toggle-keyboard-help",
        onExternalToggle,
      );
    };
  }, []);

  return (
    <LessonBuilderProvider value={props.builder}>
    <section className="lesson-library" aria-label="Course lessons">
      <header className="lesson-library-utility">
        <span
          className="lesson-library-save module-navigator-save-quiet"
          role="status"
          aria-live="polite"
        >
          {props.saveLabel}
        </span>
        <span className="lesson-library-history">
          <button
            type="button"
            onClick={props.onUndo}
            disabled={!props.canUndo}
            suppressHydrationWarning
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            onClick={props.onRedo}
            disabled={!props.canRedo}
            suppressHydrationWarning
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={14} />
          </button>
        </span>
        {props.saveFailed && (
          <button
            type="button"
            className="lesson-library-retry module-navigator-retry-emphasis"
            onClick={props.onRetrySave}
          >
            Retry save
          </button>
        )}
      </header>
      {showKeyboardHelp && <KeyboardHelpDialog onClose={closeKeyboardHelp} />}

      <div className="lesson-library-with-navigator">
        <ModuleNavigator
          modules={props.modules}
          lessons={props.lessons}
          activeModuleId={activeModuleId}
          onSelectModule={openModule}
          onSelectLesson={jumpToLesson}
          onAddModule={props.onAddModule}
          onReorderModule={props.onReorderModule}
        />
        <div className="lesson-library-modules">
          {props.modules
            .filter((module) => module.id === activeModuleId)
            .map((module) => {
              const moduleIndex = props.modules.indexOf(module);
              const moduleLessons = module.lessonIds
                .map((id) => lessonById.get(id))
                .filter((lesson): lesson is Lesson => Boolean(lesson));
              const moduleDeleteKey = `module:${module.id}`;

              return (
                <Fragment key={module.id}>
                  <section
                    className="lesson-library-module"
                    onDragOver={(event) => {
                      if (dragged) event.preventDefault();
                    }}
                    onDrop={(event) => {
                      if (!moduleLessons.length) drop(event, module.id, 0);
                    }}
                  >
                    <div className="lesson-library-module-meta">
                      <div className="lesson-library-module-line">
                        <input
                          className="lesson-library-module-title"
                          value={module.name ?? ""}
                          onChange={(event) =>
                            props.onChangeModule(module.id, {
                              name: event.target.value || null,
                            })
                          }
                          placeholder="Untitled module"
                          aria-label={`Module ${moduleIndex + 1} name`}
                        />
                        {confirmDelete === moduleDeleteKey ? (
                          <span className="lesson-library-module-controls lesson-inline-confirm">
                            <span>Delete module and move its lessons?</span>
                            <button
                              type="button"
                              className="danger"
                              onClick={() => {
                                props.onDeleteModule(module.id);
                                setConfirmDelete(null);
                              }}
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(null)}
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <span className="lesson-library-module-controls">
                            <button
                              type="button"
                              className="danger lesson-library-module-delete"
                              disabled={props.modules.length === 1}
                              onClick={() => setConfirmDelete(moduleDeleteKey)}
                              aria-label="Delete module"
                              title="Delete module"
                            >
                              <Trash2 size={15} aria-hidden="true" />
                            </button>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="lesson-library-list">
                      {moduleLessons.map((lesson) => {
                        const lessonIndex = moduleLessons.findIndex(
                          (item) => item.id === lesson.id,
                        );
                        const lessonCollapsed = collapsedLessons.has(lesson.id);
                        const lessonDeleteKey = `lesson:${lesson.id}`;
                        return [
                          <div
                            key={`insert-${lesson.id}`}
                            className="lesson-library-insert"
                          >
                            <button
                              type="button"
                              aria-label="Add lesson here"
                              onClick={() =>
                                startLesson(module.id, lessonIndex)
                              }
                            >
                              <Plus size={11} aria-hidden="true" />
                              <span className="lesson-library-insert-label">
                                Add lesson
                              </span>
                            </button>
                          </div>,
                          <article
                            key={lesson.id}
                            data-lesson-row={lesson.id}
                            className={`lesson-library-row ${dragged?.lessonId === lesson.id ? "dragging" : ""}`}
                            onDragOver={(event) => {
                              if (dragged) event.preventDefault();
                            }}
                            onDrop={(event) =>
                              drop(event, module.id, lessonIndex, true)
                            }
                          >
                            <div className="lesson-library-row-head">
                              <LessonDragHandle
                                lessonNumber={lessonIndex + 1}
                                onDragStart={(event) =>
                                  startDrag(event, module.id, lesson.id)
                                }
                                onDragEnd={() => setDragged(null)}
                              />
                              <button
                                type="button"
                                className="lesson-library-collapse"
                                aria-expanded={!lessonCollapsed}
                                aria-label={
                                  lessonCollapsed
                                    ? "Expand lesson"
                                    : "Collapse lesson"
                                }
                                onClick={() => toggleLesson(lesson.id)}
                              >
                                {lessonCollapsed ? (
                                  <ChevronRight size={16} aria-hidden="true" />
                                ) : (
                                  <ChevronDown size={16} aria-hidden="true" />
                                )}
                              </button>
                              <input
                                data-lesson-title={lesson.id}
                                className="lesson-library-title-input"
                                value={lesson.name ?? ""}
                                onChange={(event) =>
                                  props.builder.renameLesson(
                                    lesson.id,
                                    event.target.value,
                                  )
                                }
                                onBlur={props.builder.endHistoryGroup}
                                onKeyDown={(event) => {
                                  if (
                                    event.key !== "Enter" ||
                                    event.nativeEvent.isComposing
                                  )
                                    return;
                                  event.preventDefault();
                                  // Enter from the title goes straight to writing — the
                                  // first explanation, creating one if needed.
                                  const first = lesson.blocks[0];
                                  focusSlideWritingField(
                                    first
                                      ? first.id
                                      : props.builder.addBlock(
                                          lesson.id,
                                          "explanation",
                                          0,
                                        ),
                                  );
                                }}
                                placeholder="Name this lesson…"
                                aria-label={`Lesson ${lessonIndex + 1} title`}
                              />
                              {confirmDelete === lessonDeleteKey ? (
                                <span className="lesson-library-row-icons lesson-inline-confirm">
                                  <span>Delete lesson?</span>
                                  <button
                                    type="button"
                                    className="danger"
                                    data-lesson-delete-confirm={lesson.id}
                                    onClick={() => {
                                      props.builder.deleteLesson(lesson.id);
                                      setConfirmDelete(null);
                                    }}
                                  >
                                    Delete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmDelete(null);
                                      requestAnimationFrame(() =>
                                        document
                                          .querySelector<HTMLButtonElement>(
                                            `[data-lesson-delete-trigger="${lesson.id}"]`,
                                          )
                                          ?.focus(),
                                      );
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </span>
                              ) : (
                                <span className="lesson-library-row-icons">
                                  <button
                                    type="button"
                                    className="lesson-library-try"
                                    onMouseDown={(event) =>
                                      event.preventDefault()
                                    }
                                    onClick={() =>
                                      props.builder.previewLesson(lesson.id)
                                    }
                                    aria-label="Preview lesson"
                                    title="Preview lesson"
                                  >
                                    <Play size={14} aria-hidden="true" />
                                  </button>
                                  <LessonHeaderActions
                                    lessonId={lesson.id}
                                    lessonName={
                                      lesson.name?.trim() || "Untitled lesson"
                                    }
                                    onDuplicate={() =>
                                      props.builder.duplicateLesson(lesson.id)
                                    }
                                    onRequestDelete={() => {
                                      setConfirmDelete(lessonDeleteKey);
                                      requestAnimationFrame(() =>
                                        document
                                          .querySelector<HTMLButtonElement>(
                                            `[data-lesson-delete-confirm="${lesson.id}"]`,
                                          )
                                          ?.focus(),
                                      );
                                    }}
                                  />
                                </span>
                              )}
                            </div>
                            {!lessonCollapsed && (
                              <LessonDocument
                                lesson={lesson}
                                onDone={() => collapse(lesson.id)}
                                onAddLesson={() => startLesson(module.id)}
                              />
                            )}
                          </article>,
                        ];
                      })}
                      {moduleLessons.length === 0 && (
                        <div className="lesson-library-first-lesson">
                          <button
                            type="button"
                            onClick={() => startLesson(module.id)}
                          >
                            <Plus size={15} /> Create lesson{" "}
                            <kbd>Ctrl Alt Shift L</kbd>
                          </button>
                          <span>Everything saves automatically.</span>
                        </div>
                      )}
                    </div>
                  </section>
                  {moduleLessons.length > 0 && (
                    // Outside the module card: an always-visible, compact,
                    // left-aligned control, not a boxed full-width in-card
                    // footer.
                    <button
                      type="button"
                      className="lesson-library-add-lesson"
                      onClick={() => startLesson(module.id)}
                    >
                      <Plus size={14} /> Add lesson
                    </button>
                  )}
                </Fragment>
              );
            })}
        </div>
      </div>

    </section>
    </LessonBuilderProvider>
  );
}

function toggleSet(current: Set<string>, id: string) {
  const next = new Set(current);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
