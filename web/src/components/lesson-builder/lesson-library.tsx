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
import { type ConceptDisplayLookup } from "@/components/lesson-builder/lesson-concepts-field";
import { KeyboardHelpDialog } from "@/components/lesson-builder/keyboard-help";
import {
  LessonDocument,
  LessonDragHandle,
  type DocumentBlockType,
} from "@/components/lesson-builder/lesson-document";
import { focusSlideWritingField } from "@/lib/lesson-builder/focus";
import type {
  Lesson,
  LessonConcept,
  LessonModule,
} from "@/lib/lesson-builder/types";

type Props = {
  modules: LessonModule[];
  lessons: Lesson[];
  conceptDisplays: ConceptDisplayLookup;
  saveLabel: string;
  saveFailed: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onRetrySave: () => void;
  onNewLesson: (moduleId: string, insertionIndex?: number) => string;
  onPreviewLesson: (lessonId: string) => void;
  onDuplicateLesson: (lessonId: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onAddModule: () => void;
  onDeleteModule: (moduleId: string) => void;
  onMoveModule: (index: number, direction: -1 | 1) => void;
  onReorderModule: (draggedModuleId: string, targetModuleId: string) => void;
  onMoveLesson: (moduleId: string, index: number, direction: -1 | 1) => void;
  onDropLesson: (
    lessonId: string,
    moduleId: string,
    insertionIndex: number,
  ) => void;
  onMoveLessonToModule: (lessonId: string, moduleId: string) => void;
  onChangeModule: (moduleId: string, patch: Partial<LessonModule>) => void;
  onRenameLesson: (lessonId: string, name: string) => void;
  onAddLessonConcept: (lessonId: string, concept: LessonConcept) => void;
  onRemoveLessonConcept: (lessonId: string, conceptId: string) => void;
  onRelabelLessonConcept: (
    lessonId: string,
    conceptId: string,
    label: string,
  ) => void;
  onUpdateExplanation: (
    lessonId: string,
    blockId: string,
    markdown: string,
  ) => void;
  onUpdateSentence: (
    lessonId: string,
    blockId: string,
    field: "promptText" | "helperText" | "answerFeedback",
    value: string | null,
  ) => void;
  onUpdateSpanish: (
    lessonId: string,
    blockId: string,
    pieceId: string,
    value: string,
  ) => void;
  onUpdateAnswer: (
    lessonId: string,
    blockId: string,
    pieceId: string,
    answerIndex: number,
    value: string,
  ) => void;
  onUpdateCallout: (
    lessonId: string,
    blockId: string,
    pieceId: string,
    value: string | null,
  ) => void;
  onAddAnswer: (lessonId: string, blockId: string, pieceId: string) => void;
  onRemoveAnswer: (
    lessonId: string,
    blockId: string,
    pieceId: string,
    answerIndex: number,
  ) => void;
  onAddPiece: (lessonId: string, blockId: string) => string;
  onDeletePiece: (lessonId: string, blockId: string, pieceId: string) => void;
  onAddBlock: (
    lessonId: string,
    type: DocumentBlockType,
    insertionIndex: number,
  ) => string;
  onDeleteBlock: (lessonId: string, blockId: string) => void;
  onDuplicateBlock: (lessonId: string, blockId: string) => void;
  onMoveBlock: (lessonId: string, blockId: string, direction: -1 | 1) => void;
  onReorderBlock: (
    lessonId: string,
    draggedId: string,
    targetId: string,
    position: "before" | "after",
  ) => void;
  deletionUndo: { lessonId: string; label: string } | null;
  onUndoDeletion: () => void;
  onEndHistoryGroup: () => void;
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
      // data-document-block is LessonDocument's own per-slide anchor
      // (owned by lesson-ux) — read-only reuse, no changes to that file.
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
    const lessonId = props.onNewLesson(moduleId, insertionIndex);
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
        // return it there — no fixed trigger button to focus back onto
        // now that the floating FAB is gone (S4).
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
                                  props.onRenameLesson(
                                    lesson.id,
                                    event.target.value,
                                  )
                                }
                                onBlur={props.onEndHistoryGroup}
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
                                      : props.onAddBlock(
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
                                      props.onDeleteLesson(lesson.id);
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
                                      props.onPreviewLesson(lesson.id)
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
                                      props.onDuplicateLesson(lesson.id)
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
                                conceptDisplays={props.conceptDisplays}
                                undoDeletionLabel={
                                  props.deletionUndo?.lessonId === lesson.id
                                    ? props.deletionUndo.label
                                    : null
                                }
                                onAddConcept={(concept) =>
                                  props.onAddLessonConcept(lesson.id, concept)
                                }
                                onRemoveConcept={(id) =>
                                  props.onRemoveLessonConcept(lesson.id, id)
                                }
                                onRelabelConcept={(id, label) =>
                                  props.onRelabelLessonConcept(
                                    lesson.id,
                                    id,
                                    label,
                                  )
                                }
                                onUpdateExplanation={(blockId, markdown) =>
                                  props.onUpdateExplanation(
                                    lesson.id,
                                    blockId,
                                    markdown,
                                  )
                                }
                                onUpdateSentence={(blockId, field, value) =>
                                  props.onUpdateSentence(
                                    lesson.id,
                                    blockId,
                                    field,
                                    value,
                                  )
                                }
                                onUpdateSpanish={(blockId, pieceId, value) =>
                                  props.onUpdateSpanish(
                                    lesson.id,
                                    blockId,
                                    pieceId,
                                    value,
                                  )
                                }
                                onUpdateAnswer={(
                                  blockId,
                                  pieceId,
                                  answerIndex,
                                  value,
                                ) =>
                                  props.onUpdateAnswer(
                                    lesson.id,
                                    blockId,
                                    pieceId,
                                    answerIndex,
                                    value,
                                  )
                                }
                                onUpdateCallout={(blockId, pieceId, value) =>
                                  props.onUpdateCallout(
                                    lesson.id,
                                    blockId,
                                    pieceId,
                                    value,
                                  )
                                }
                                onAddAnswer={(blockId, pieceId) =>
                                  props.onAddAnswer(lesson.id, blockId, pieceId)
                                }
                                onRemoveAnswer={(
                                  blockId,
                                  pieceId,
                                  answerIndex,
                                ) =>
                                  props.onRemoveAnswer(
                                    lesson.id,
                                    blockId,
                                    pieceId,
                                    answerIndex,
                                  )
                                }
                                onAddPiece={(blockId) =>
                                  props.onAddPiece(lesson.id, blockId)
                                }
                                onDeletePiece={(blockId, pieceId) =>
                                  props.onDeletePiece(
                                    lesson.id,
                                    blockId,
                                    pieceId,
                                  )
                                }
                                onAddBlock={(type, index) =>
                                  props.onAddBlock(lesson.id, type, index)
                                }
                                onDeleteBlock={(blockId) =>
                                  props.onDeleteBlock(lesson.id, blockId)
                                }
                                onDuplicateBlock={(blockId) =>
                                  props.onDuplicateBlock(lesson.id, blockId)
                                }
                                onMoveBlock={(blockId, direction) =>
                                  props.onMoveBlock(
                                    lesson.id,
                                    blockId,
                                    direction,
                                  )
                                }
                                onReorderBlock={(
                                  draggedId,
                                  targetId,
                                  position,
                                ) =>
                                  props.onReorderBlock(
                                    lesson.id,
                                    draggedId,
                                    targetId,
                                    position,
                                  )
                                }
                                onDone={() => collapse(lesson.id)}
                                onAddLesson={() => startLesson(module.id)}
                                onUndoDeletion={props.onUndoDeletion}
                                onEndHistoryGroup={props.onEndHistoryGroup}
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
                    // Outside the module card — S3: an always-visible, compact,
                    // left-aligned control, not a boxed full-width in-card
                    // footer. Restyle requested from Track E via
                    // /tmp/next-round-css-contract.md (existing class name kept,
                    // moved position in the DOM).
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
  );
}

function toggleSet(current: Set<string>, id: string) {
  const next = new Set(current);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
