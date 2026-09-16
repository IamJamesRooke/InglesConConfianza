"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";

import { ModuleNavigator } from "@/components/lesson-builder/module-navigator";
import { SyllabusPanel } from "@/components/lesson-builder/syllabus-panel";
import { EditingHud } from "@/components/lesson-builder/editing-hud";
import { KeyboardHelpDialog } from "@/components/lesson-builder/keyboard-help";
import { LessonRow } from "@/components/lesson-builder/lesson-library-row";
import {
  LessonBuilderProvider,
  type LessonBuilderActions,
} from "@/lib/lesson-builder/builder-context";
import {
  EditingProvider,
  isRealBlurAway,
  useLessonEditing,
  type EditingSelection,
} from "@/lib/lesson-builder/editing";
import { dispatchKeymap, fieldSelectionForBlock } from "@/lib/lesson-builder/keymap";
import { rememberFocus, restoreRememberedFocus } from "@/lib/lesson-builder/focus";
import type { Lesson, LessonFile, LessonModule } from "@/lib/lesson-builder/types";

// The single open-lesson id survives reloads so a teacher returns to where
// they left off (§1a "Lesson focus" — see docs/design/lesson-builder.md).
// Wrapped in try/catch: private browsing / storage-disabled contexts must
// degrade to "no memory," never throw.
const LAST_LESSON_KEY = "lesson-builder:last-lesson";

function readLastLesson(): string | null {
  try {
    return window.localStorage.getItem(LAST_LESSON_KEY);
  } catch {
    return null;
  }
}

function writeLastLesson(lessonId: string | null) {
  try {
    if (lessonId) window.localStorage.setItem(LAST_LESSON_KEY, lessonId);
    else window.localStorage.removeItem(LAST_LESSON_KEY);
  } catch {
    /* storage unavailable — nothing to remember for next time */
  }
}

function readLessonParam(): string | null {
  try {
    return new URLSearchParams(window.location.search).get("lesson");
  } catch {
    return null;
  }
}

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
  onFlushSave: () => void;
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
  onImported: (file: LessonFile) => void;
};

export function LessonLibrary(props: Props) {
  return (
    <EditingProvider lessons={props.lessons} actions={props.builder}>
      <LessonLibraryInner {...props} />
    </EditingProvider>
  );
}

function LessonLibraryInner(props: Props) {
  const editing = useLessonEditing();
  const [confirmDeleteModule, setConfirmDeleteModule] = useState<string | null>(null);
  const [dragged, setDragged] = useState<{
    moduleId: string;
    lessonId: string;
  } | null>(null);
  const lessonById = useMemo(
    () => new Map(props.lessons.map((lesson) => [lesson.id, lesson])),
    [props.lessons],
  );

  // Only the active module's lessons render as the inline document — the
  // rest live as compact rows in ModuleNavigator.
  const activeModuleId = props.modules.some(
    (module) => module.id === editing.activeModuleId,
  )
    ? editing.activeModuleId
    : (props.modules[0]?.id ?? null);

  const openLessonId = editing.openLessonId;

  // Sets the single open lesson and remembers it for next time (§1a), and
  // moves DOM focus + selection to its title — the one path every "open a
  // lesson" flow (search, chevron click, new-lesson) shares.
  const openLesson = useCallback(
    (lessonId: string | null) => {
      editing.setOpenLesson(lessonId);
      writeLastLesson(lessonId);
    },
    [editing],
  );

  // The "remembered/first" fallback, scoped to one module: the last-opened
  // lesson if it happens to belong to this module, else the module's first
  // (still-existing) lesson.
  function pickLessonForModule(module: LessonModule | undefined): string | null {
    if (!module) return null;
    const stored = readLastLesson();
    if (stored && lessonById.has(stored) && module.lessonIds.includes(stored)) {
      return stored;
    }
    return module.lessonIds.find((id) => lessonById.has(id)) ?? null;
  }

  function openModule(moduleId: string) {
    editing.setActiveModule(moduleId);
    const target = props.modules.find((candidate) => candidate.id === moduleId);
    if (!target) return;
    if (openLessonId && target.lessonIds.includes(openLessonId)) return;
    openLesson(pickLessonForModule(target));
  }

  // On first load, open exactly one lesson: the `?lesson=` URL param, else
  // the remembered last-opened lesson, else the active module's first
  // lesson (§1a). Guarded to run once, and only once real data has arrived.
  const initializedOpenLessonRef = useRef(false);
  useEffect(() => {
    if (initializedOpenLessonRef.current || props.saveLabel === "Loading…") {
      return;
    }
    initializedOpenLessonRef.current = true;
    const paramLesson = readLessonParam();
    let target: string | null =
      paramLesson && lessonById.has(paramLesson) ? paramLesson : null;
    let home = target
      ? props.modules.find((module) => module.lessonIds.includes(target!))
      : undefined;
    if (!target) {
      const stored = readLastLesson();
      if (stored && lessonById.has(stored)) {
        target = stored;
        home = props.modules.find((module) => module.lessonIds.includes(stored));
      }
    }
    if (!target) {
      home = props.modules[0];
      target = pickLessonForModule(home);
    }
    if (home) editing.setActiveModule(home.id);
    openLesson(target);
    // Runs once (guarded above); re-running on every dependency change would
    // fight a teacher's own subsequent open/close actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.saveLabel, props.modules, lessonById]);

  function jumpToLesson(lessonId: string, blockId?: string) {
    const home = props.modules.find((module) =>
      module.lessonIds.includes(lessonId),
    );
    if (home) editing.setActiveModule(home.id);
    openLesson(lessonId);
    // Item 5: a search result activates the matched slide (or the title,
    // for a title hit) rather than only scrolling it into view.
    const lesson = lessonById.get(lessonId);
    const block = blockId ? lesson?.blocks.find((candidate) => candidate.id === blockId) : undefined;
    const sel: EditingSelection = block
      ? fieldSelectionForBlock(lessonId, block)
      : { kind: "title", lessonId };
    editing.setSelection(sel);
    editing.focusSelection(sel);
  }

  const { onFlushSave } = props;
  const collapse = useCallback(
    (lessonId: string) => {
      openLesson(null);
      onFlushSave();
      const sel: EditingSelection = { kind: "title", lessonId };
      editing.setSelection(sel);
      editing.focusSelection(sel);
    },
    [openLesson, onFlushSave, editing],
  );

  const toggleLesson = useCallback(
    (lessonId: string) => {
      if (openLessonId === lessonId) collapse(lessonId);
      else openLesson(lessonId);
    },
    [openLessonId, collapse, openLesson],
  );

  const startDrag = useCallback(
    (event: DragEvent<HTMLButtonElement>, moduleId: string, lessonId: string) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", lessonId);
      setDragged({ moduleId, lessonId });
    },
    [],
  );

  const endDrag = useCallback(() => setDragged(null), []);

  const { onDropLesson } = props;
  const drop = useCallback(
    (
      event: DragEvent<HTMLElement>,
      moduleId: string,
      targetIndex: number,
      usePointer = false,
    ) => {
      event.preventDefault();
      if (!dragged) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const after = usePointer && event.clientY >= bounds.top + bounds.height / 2;
      onDropLesson(dragged.lessonId, moduleId, targetIndex + (after ? 1 : 0));
      setDragged(null);
    },
    [dragged, onDropLesson],
  );

  const startLesson = useCallback(
    (moduleId: string, insertionIndex?: number) => {
      const lessonId = props.builder.newLesson(moduleId, insertionIndex);
      openLesson(lessonId);
      const sel: EditingSelection = { kind: "title", lessonId };
      editing.setSelection(sel);
      editing.focusSelection(sel);
    },
    [props.builder, openLesson, editing],
  );

  function toggleKeyboardHelp() {
    if (!editing.helpOpen) rememberFocus();
    editing.setHelpOpen(!editing.helpOpen);
  }

  function closeKeyboardHelp() {
    editing.setHelpOpen(false);
    restoreRememberedFocus();
  }

  // Same-page bridge for the header's "Keyboard shortcuts" menu entry
  // (site-header.tsx, outside this component tree).
  useEffect(() => {
    const onExternalToggle = () => toggleKeyboardHelp();
    document.addEventListener("lesson-builder:toggle-keyboard-help", onExternalToggle);
    return () =>
      document.removeEventListener("lesson-builder:toggle-keyboard-help", onExternalToggle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing.helpOpen]);

  // ---------------------------------------------------------------------
  // The one keymap dispatcher (§3): a single capture-phase keydown listener
  // on the builder root, reading current selection/lessons/actions/editing
  // through refs kept fresh every render (subscribes once, like the effects
  // this replaced) so its own identity — and thus the listener — never
  // needs to change across a typing session.
  // ---------------------------------------------------------------------
  const dispatchDepsRef = useRef({ selection: editing.selection, lessons: props.lessons, actions: props.builder, editing });
  useEffect(() => {
    dispatchDepsRef.current = { selection: editing.selection, lessons: props.lessons, actions: props.builder, editing };
  });
  const rootRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    function onKeyDown(event: KeyboardEvent) {
      const deps = dispatchDepsRef.current;
      dispatchKeymap(event, { selection: deps.selection, lessons: deps.lessons, actions: deps.actions, editing: deps.editing });
    }
    // On `document`, not `root`: when nothing in the builder has focus yet
    // (a fresh empty course — no title, no field exists to hold it), a
    // keydown's real target is `document.body`, which isn't a descendant of
    // `root` — a capture-phase listener on `root` never sees an event whose
    // path doesn't pass through it. `document` is always an ancestor.
    document.addEventListener("keydown", onKeyDown, { capture: true });
    // Blur does not write "none" by itself (§1) — only a focusout whose
    // relatedTarget lands outside the builder root does; any focusin
    // within the root overwrites the selection anyway on its own, and a
    // focusout *followed by* a focusin inside the root (e.g. Tab from one
    // field to the next) must not flash "none" in between.
    //
    // Attached on `document`, not `root`, and deliberately *after* React's
    // own delegated listener has had a chance to run its field's onBlur
    // (e.g. sentence-editor.tsx committing the English draft): both are
    // reacting to the very same native focusout, in the same tick, with no
    // render in between, so whichever runs first sees stale props. Sitting
    // above React's root container in the bubble phase — instead of below
    // it, on `root` — means this store update composes with that commit
    // instead of racing it.
    function onFocusOut(event: FocusEvent) {
      if (!(event.target instanceof Node) || !root!.contains(event.target)) return;
      const next = event.relatedTarget;
      if (next instanceof Node) {
        // A resolvable `relatedTarget` tells us exactly where focus went,
        // which settles it either way — no need for the unresolved-only
        // heuristic below. Inside the root: not a departure (e.g. Tab from
        // one field to the next). Outside it — a click/focus landing on a
        // real, identifiable element elsewhere in the page, such as the
        // lesson-preview overlay (rendered as a sibling of the builder
        // root, not inside it) — is always real, even though the blurring
        // field's own block still matches the current selection: that
        // same-block signal exists only to protect the *unresolved* case
        // just below (a control that unmounts itself as a direct result of
        // its own click), not to veto a `relatedTarget` we actually have.
        if (root!.contains(next)) return;
        dispatchDepsRef.current.editing.setSelection({ kind: "none" }, { reason: "blur" });
        return;
      }
      // `relatedTarget` didn't land us safely back inside the root — but a
      // control that unmounts itself as a direct result of its own click
      // (Add instruction, hint lightbulb, Add pair/row, pair ×, the
      // block's drag/duplicate/delete chrome) can report this same
      // unresolved blur even though focus is about to return to that same
      // slide (via its own explicit `focusSelection` call, one render
      // later). Only collapse to "none" — and therefore run `leaveSlide`
      // — when the blurred target didn't belong to the slide the
      // selection already points at. See `isRealBlurAway`.
      //
      // A `title` selection has no blockId at all, so it needs its own
      // identity — `data-lesson-row` (the lesson's whole row, set in
      // lesson-library-row.tsx) — or every blur off a title (including the
      // in-between blur `Ctrl+Alt+ArrowUp/Down` fires when the move crosses
      // a module boundary and the row unmounts from the old module and
      // remounts in the new one) reads as `isRealBlurAway(null, null)` →
      // always "real," collapsing the selection before the row even
      // finishes remounting. Prefixed so a block id and a lesson id can
      // never collide.
      const selection = dispatchDepsRef.current.editing.selection;
      const selectionKey =
        selection.kind === "block" || selection.kind === "field"
          ? `block:${selection.blockId}`
          : selection.kind === "title"
            ? `title:${selection.lessonId}`
            : null;
      const targetEl = event.target instanceof HTMLElement ? event.target : null;
      const targetBlock = targetEl?.closest("[data-document-block]");
      const targetRow = targetEl?.closest("[data-lesson-row]");
      const targetKey = targetBlock
        ? `block:${targetBlock.getAttribute("data-document-block")}`
        : targetRow
          ? `title:${targetRow.getAttribute("data-lesson-row")}`
          : null;
      if (!isRealBlurAway(targetKey, selectionKey)) return;
      dispatchDepsRef.current.editing.setSelection({ kind: "none" }, { reason: "blur" });
    }
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("keydown", onKeyDown, { capture: true });
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return (
    <LessonBuilderProvider value={props.builder}>
    <section
      className="lesson-library"
      aria-label="Course lessons"
      ref={rootRef}
      data-lesson-library-root
      tabIndex={-1}
    >
      {editing.helpOpen && <KeyboardHelpDialog onClose={closeKeyboardHelp} />}

      <div className="lesson-library-with-navigator">
        <ModuleNavigator
          modules={props.modules}
          lessons={props.lessons}
          conceptDisplays={props.builder.conceptDisplays}
          activeModuleId={activeModuleId}
          onSelectModule={openModule}
          onSelectLesson={jumpToLesson}
          onAddModule={props.onAddModule}
          onReorderModule={props.onReorderModule}
          saveLabel={props.saveLabel}
          saveFailed={props.saveFailed}
          canUndo={props.canUndo}
          canRedo={props.canRedo}
          onUndo={props.onUndo}
          onRedo={props.onRedo}
          onRetrySave={props.onRetrySave}
          onImported={props.onImported}
        />
        <div className="lesson-library-modules">
          {props.modules
            .filter((module) => module.id === activeModuleId)
            .map((module) => {
              const moduleIndex = props.modules.indexOf(module);
              const moduleLessons = module.lessonIds
                .map((id) => lessonById.get(id))
                .filter((lesson): lesson is Lesson => Boolean(lesson));

              return (
                <Fragment key={module.id}>
                  <SyllabusPanel
                    module={module}
                    moduleIndex={moduleIndex}
                    modules={props.modules}
                    lessons={props.lessons}
                    conceptDisplays={props.builder.conceptDisplays}
                    onDisplayChange={props.builder.recordConceptDisplay}
                    onChangeModule={props.onChangeModule}
                  />
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
                          data-module-name={module.id}
                          data-keymap-ignore
                          value={module.name ?? ""}
                          onChange={(event) =>
                            props.onChangeModule(module.id, {
                              name: event.target.value || null,
                            })
                          }
                          placeholder="Untitled module"
                          aria-label={`Module ${moduleIndex + 1} name`}
                        />
                        <span className="lesson-library-module-pills">
                          <button
                            type="button"
                            aria-pressed={module.status === "draft"}
                            className={`lesson-library-module-pill${
                              module.status === "draft" ? " is-draft" : ""
                            }`}
                            onClick={() =>
                              props.onChangeModule(module.id, {
                                status: module.status === "draft" ? "published" : "draft",
                              })
                            }
                          >
                            {module.status === "draft" ? "Draft" : "Published"}
                          </button>
                          <button
                            type="button"
                            aria-pressed={module.access === "premium"}
                            className="lesson-library-module-pill"
                            onClick={() =>
                              props.onChangeModule(module.id, {
                                access: module.access === "premium" ? "free" : "premium",
                              })
                            }
                          >
                            {module.access === "premium" ? "Premium" : "Free"}
                          </button>
                        </span>
                        {confirmDeleteModule === module.id ? (
                          <span className="lesson-library-module-controls lesson-inline-confirm">
                            <span>Delete module and move its lessons?</span>
                            <button
                              type="button"
                              className="danger"
                              onClick={() => {
                                props.onDeleteModule(module.id);
                                setConfirmDeleteModule(null);
                              }}
                            >
                              Delete
                            </button>
                            <button type="button" onClick={() => setConfirmDeleteModule(null)}>
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <span className="lesson-library-module-controls">
                            <button
                              type="button"
                              className="danger lesson-library-module-delete"
                              disabled={props.modules.length === 1}
                              aria-disabled={props.modules.length === 1}
                              onClick={() => setConfirmDeleteModule(module.id)}
                              aria-label={
                                props.modules.length === 1
                                  ? "Can't delete the only module"
                                  : "Delete module"
                              }
                              title={
                                props.modules.length === 1
                                  ? "Can't delete the only module"
                                  : "Delete module"
                              }
                            >
                              <Trash2 size={15} aria-hidden="true" />
                            </button>
                          </span>
                        )}
                      </div>
                      <input
                        className="lesson-library-module-description"
                        data-keymap-ignore
                        value={module.description ?? ""}
                        onChange={(event) =>
                          props.onChangeModule(module.id, {
                            description: event.target.value,
                          })
                        }
                        placeholder="What will the learner be able to say?"
                        aria-label={`Module ${moduleIndex + 1} description`}
                      />
                    </div>

                    <div className="lesson-library-list">
                      {moduleLessons.map((lesson, lessonIndex) => (
                        <LessonRow
                          key={lesson.id}
                          lesson={lesson}
                          lessonIndex={lessonIndex}
                          moduleId={module.id}
                          isOpen={openLessonId === lesson.id}
                          isDragged={dragged?.lessonId === lesson.id}
                          dragInProgress={dragged !== null}
                          confirmingDelete={editing.confirmDeleteKey === `lesson:${lesson.id}`}
                          builder={props.builder}
                          onToggle={toggleLesson}
                          onFlushSave={onFlushSave}
                          onStartDrag={startDrag}
                          onDragEnd={endDrag}
                          onDrop={drop}
                          onStartLessonAt={startLesson}
                          onRequestDeleteConfirm={(key) => editing.requestDeleteConfirm(key)}
                          onCancelDeleteConfirm={() => editing.requestDeleteConfirm(null)}
                        />
                      ))}
                      {moduleLessons.length === 0 && (
                        <div className="lesson-library-first-lesson">
                          <button
                            type="button"
                            onClick={() => startLesson(module.id)}
                          >
                            <Plus size={15} /> Create lesson
                          </button>
                          <span>Everything saves automatically.</span>
                          <span>
                            Lesson 1 is the learner&rsquo;s first contact — assume nothing.
                          </span>
                        </div>
                      )}
                    </div>
                  </section>
                  {moduleLessons.length > 0 && (
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
          <EditingHud />
        </div>
      </div>

    </section>
    </LessonBuilderProvider>
  );
}
