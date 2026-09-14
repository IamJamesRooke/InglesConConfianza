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
import "@/styles/module-navigation.css";
import { KeyboardHelpDialog } from "@/components/lesson-builder/keyboard-help";
import { LessonRow } from "@/components/lesson-builder/lesson-library-row";
import {
  LessonBuilderProvider,
  type LessonBuilderActions,
} from "@/lib/lesson-builder/builder-context";
import { focusSlideWritingField } from "@/lib/lesson-builder/focus";
import type { Lesson, LessonModule } from "@/lib/lesson-builder/types";

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
};

export function LessonLibrary(props: Props) {
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  // Strict single-open: at most one lesson is expanded at a time across the
  // whole builder (§1a). `null` means every lesson is collapsed.
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [dragged, setDragged] = useState<{
    moduleId: string;
    lessonId: string;
  } | null>(null);
  const lastFocusedBeforeHelpRef = useRef<HTMLElement | null>(null);
  // One-shot: set just before opening a lesson whose very next render should
  // jump straight into writing (item 8 — Enter on a collapsed title). State,
  // not a ref, because it's read during render (JSX below) and a ref can't
  // be read or written there. `LessonDocument` reports back via
  // `clearFocusOnMount` once consumed, so a later plain re-open (chevron
  // click) of the same lesson doesn't replay the jump.
  const [focusOnOpenLessonId, setFocusOnOpenLessonId] = useState<string | null>(
    null,
  );
  const clearFocusOnMount = useCallback(() => {
    setFocusOnOpenLessonId(null);
  }, []);
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

  // Sets the single open lesson and remembers it for next time (§1a).
  // Stable identity (no deps) so it — and everything built on it below —
  // stays safe to hand to the memoized LessonRow without forcing every
  // collapsed row to re-render on each keystroke elsewhere in the lesson.
  const openLesson = useCallback((lessonId: string | null) => {
    setOpenLessonId(lessonId);
    writeLastLesson(lessonId);
  }, []);

  // Item 8: Enter on a collapsed lesson's title expands it AND moves focus
  // into writing (creating an explanation if the lesson has none) — the
  // same jump a brand-new lesson gets. `focusOnOpenLessonIdRef` is set first
  // so the render that mounts this lesson's `LessonDocument` sees it.
  const openLessonForWriting = useCallback(
    (lessonId: string) => {
      setFocusOnOpenLessonId(lessonId);
      openLesson(lessonId);
    },
    [openLesson],
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
    setSelectedModuleId(moduleId);
    const target = props.modules.find((candidate) => candidate.id === moduleId);
    if (!target) return;
    // Leave the open lesson alone if it already belongs to this module —
    // only reassign when actually switching into a module that doesn't
    // contain the currently open lesson.
    if (openLessonId && target.lessonIds.includes(openLessonId)) return;
    openLesson(pickLessonForModule(target));
  }

  // On first load, open exactly one lesson: the `?lesson=` URL param, else
  // the remembered last-opened lesson, else the active module's first
  // lesson (§1a). Guarded to run once, and only once real data has arrived
  // (props.saveLabel stays "Loading…" until then).
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
    if (home) setSelectedModuleId(home.id);
    openLesson(target);
    // Runs once (guarded above); re-running on every dependency change would
    // fight a teacher's own subsequent open/close actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.saveLabel, props.modules, lessonById]);

  function jumpToLesson(lessonId: string, blockId?: string) {
    const home = props.modules.find((module) =>
      module.lessonIds.includes(lessonId),
    );
    if (home) setSelectedModuleId(home.id);
    openLesson(lessonId);
    requestAnimationFrame(() => {
      // Item 5: a search result used to only scroll the lesson into view,
      // leaving focus in the search box — a keyboard-only teacher had to
      // Tab/click in by hand. Now it activates the matched slide and
      // focuses its writing field (or the title, for a title hit).
      if (blockId) {
        // data-document-block is LessonDocument's own per-slide anchor.
        document
          .querySelector(`[data-document-block="${blockId}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
        focusSlideWritingField(blockId);
        return;
      }
      const titleField = document.querySelector<HTMLInputElement>(
        `[data-lesson-title="${lessonId}"]`,
      );
      titleField?.scrollIntoView({ behavior: "smooth", block: "start" });
      titleField?.focus();
    });
  }

  const { onFlushSave } = props;
  const collapse = useCallback(
    (lessonId: string) => {
      openLesson(null);
      onFlushSave();
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLInputElement>(`[data-lesson-title="${lessonId}"]`)
          ?.focus(),
      );
    },
    [openLesson, onFlushSave],
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

  // Item 2: Ctrl Alt ArrowUp/Down from a lesson's title moves it one
  // position within its module, or — at the module boundary — into the
  // end/start of the adjacent module. Reuses `onDropLesson`
  // (`moveLessonToPosition` in page.tsx) rather than adding a new API: a
  // same-module move is just a reorder within it, a cross-module move is
  // an insertion at the destination's end (moving up) or start (moving
  // down). Title rows only render for the active module (see the
  // `.filter` below), so `home.id` is always the current `activeModuleId`
  // when this fires — no extra bookkeeping needed to detect "did it move
  // to a different module," a plain id comparison is enough.
  const { modules: propModules } = props;
  const moveLessonKeyboard = useCallback(
    (lessonId: string, direction: -1 | 1) => {
      const homeIndex = propModules.findIndex((module) =>
        module.lessonIds.includes(lessonId),
      );
      if (homeIndex < 0) return;
      const home = propModules[homeIndex];
      const position = home.lessonIds.indexOf(lessonId);
      const withinModule = position + direction;
      let destinationModuleId = home.id;
      let insertionIndex: number;
      if (withinModule < 0 || withinModule >= home.lessonIds.length) {
        const adjacentIndex = homeIndex + direction;
        if (adjacentIndex < 0 || adjacentIndex >= propModules.length) return;
        const adjacent = propModules[adjacentIndex];
        destinationModuleId = adjacent.id;
        // Destination doesn't contain this lesson yet, so its lessonIds
        // array is already in "final" terms — no off-by-one to correct for.
        insertionIndex = direction === -1 ? adjacent.lessonIds.length : 0;
      } else {
        // `moveLessonToPosition` (page.tsx) reads insertionIndex as a
        // position in the module's *original* (pre-removal) lessonIds
        // array — it only subtracts 1 itself when the source sits before
        // that index. Moving backward, the target index is already before
        // the source, so it's used as-is; moving forward, we have to name
        // the original index one past where the lesson should land so that
        // same internal subtraction lands it exactly on `withinModule`.
        insertionIndex = direction > 0 ? withinModule + 1 : withinModule;
      }
      onDropLesson(lessonId, destinationModuleId, insertionIndex);
      if (destinationModuleId !== home.id) setSelectedModuleId(destinationModuleId);
      requestAnimationFrame(() => {
        document
          .querySelector<HTMLInputElement>(`[data-lesson-title="${lessonId}"]`)
          ?.focus();
      });
    },
    [propModules, onDropLesson],
  );

  const startLesson = useCallback(
    (moduleId: string, insertionIndex?: number) => {
      const lessonId = props.builder.newLesson(moduleId, insertionIndex);
      openLesson(lessonId);
      requestAnimationFrame(() => {
        document
          .querySelector<HTMLInputElement>(`[data-lesson-title="${lessonId}"]`)
          ?.focus();
      });
    },
    [props.builder, openLesson],
  );

  const requestDeleteConfirm = useCallback((key: string) => setConfirmDelete(key), []);
  const cancelDeleteConfirm = useCallback(() => setConfirmDelete(null), []);

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

  // Item 3: Ctrl Alt L adds a lesson from anywhere on the page — not just
  // from inside the currently open lesson's own document — since it's also
  // the only keyboard path to create the very first lesson in an empty
  // module (there is no open lesson, and no document keydown handler, to
  // catch it from). Inserted after the open lesson if there is one,
  // otherwise at the end of the active module.
  function addLessonFromAnywhere() {
    if (openLessonId) {
      const home = props.modules.find((module) =>
        module.lessonIds.includes(openLessonId),
      );
      if (home) {
        startLesson(home.id, home.lessonIds.indexOf(openLessonId) + 1);
        return;
      }
    }
    if (activeModuleId) startLesson(activeModuleId);
  }
  // The document keydown effect below subscribes once ([] deps, like the
  // Ctrl/⌘+. handler it lives beside) — read the latest closure through a
  // ref rather than resubscribing on every render. The ref is updated in an
  // effect (every commit, no deps) rather than during render itself, since
  // refs may not be written while rendering.
  const addLessonFromAnywhereRef = useRef(addLessonFromAnywhere);
  useEffect(() => {
    addLessonFromAnywhereRef.current = addLessonFromAnywhere;
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      // Ignore the concept typeahead (combobox/listbox) and any open dialog
      // (keyboard-help, the concept quick-edit) — they own their own keys.
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest('[role="combobox"], [role="listbox"], [role="dialog"]')) {
        return;
      }
      if (
        event.code === "KeyL" &&
        event.ctrlKey &&
        event.altKey &&
        !event.metaKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        addLessonFromAnywhereRef.current();
        return;
      }
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
      {showKeyboardHelp && <KeyboardHelpDialog onClose={closeKeyboardHelp} />}

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
                      {moduleLessons.map((lesson, lessonIndex) => (
                        <LessonRow
                          key={lesson.id}
                          lesson={lesson}
                          lessonIndex={lessonIndex}
                          moduleId={module.id}
                          isOpen={openLessonId === lesson.id}
                          isDragged={dragged?.lessonId === lesson.id}
                          dragInProgress={dragged !== null}
                          confirmingDelete={confirmDelete === `lesson:${lesson.id}`}
                          builder={props.builder}
                          onToggle={toggleLesson}
                          onCollapse={collapse}
                          onOpenForWriting={openLessonForWriting}
                          focusOnOpenLessonId={focusOnOpenLessonId}
                          onFocusOnMountHandled={clearFocusOnMount}
                          onFlushSave={onFlushSave}
                          onStartDrag={startDrag}
                          onDragEnd={endDrag}
                          onDrop={drop}
                          onStartLessonAt={startLesson}
                          onMoveLesson={moveLessonKeyboard}
                          onRequestDeleteConfirm={requestDeleteConfirm}
                          onCancelDeleteConfirm={cancelDeleteConfirm}
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
