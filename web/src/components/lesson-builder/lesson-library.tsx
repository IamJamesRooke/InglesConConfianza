"use client";

import { ChevronDown, ChevronRight, Copy, Keyboard, Play, Plus, Redo2, Search, Trash2, Undo2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";

import { EditingHud } from "@/components/lesson-builder/editing-hud";
import { LessonConceptsField, type ConceptDisplayLookup } from "@/components/lesson-builder/lesson-concepts-field";
import { LessonDocument, LessonDragHandle, type DocumentBlockType } from "@/components/lesson-builder/lesson-document";
import { focusSlideWritingField } from "@/lib/lesson-builder/focus";
import { conceptKey } from "@/lib/lesson-builder/lesson-file";
import { useFocusContext } from "@/lib/lesson-builder/use-focus-context";
import type { Lesson, LessonConcept, LessonModule } from "@/lib/lesson-builder/types";

type Props = {
  modules: LessonModule[]; lessons: Lesson[]; conceptDisplays: ConceptDisplayLookup; saveLabel: string;
  canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void;
  onNewLesson: (moduleId: string) => string; onPreviewLesson: (lessonId: string) => void;
  onDuplicateLesson: (lessonId: string) => void; onDeleteLesson: (lessonId: string) => void;
  onAddModule: () => void; onDeleteModule: (moduleId: string) => void;
  onMoveModule: (index: number, direction: -1 | 1) => void;
  onMoveLesson: (moduleId: string, index: number, direction: -1 | 1) => void;
  onDropLesson: (lessonId: string, moduleId: string, insertionIndex: number) => void;
  onMoveLessonToModule: (lessonId: string, moduleId: string) => void;
  onChangeModule: (moduleId: string, patch: Partial<LessonModule>) => void;
  onRenameLesson: (lessonId: string, name: string) => void;
  onAddLessonConcept: (lessonId: string, concept: LessonConcept) => void;
  onRemoveLessonConcept: (lessonId: string, conceptId: string) => void;
  onRelabelLessonConcept: (lessonId: string, conceptId: string, label: string) => void;
  onUpdateExplanation: (lessonId: string, blockId: string, markdown: string) => void;
  onUpdateSentence: (lessonId: string, blockId: string, field: "promptText" | "helperText" | "answerFeedback", value: string | null) => void;
  onUpdateSpanish: (lessonId: string, blockId: string, pieceId: string, value: string) => void;
  onUpdateAnswer: (lessonId: string, blockId: string, pieceId: string, answerIndex: number, value: string) => void;
  onUpdateCallout: (lessonId: string, blockId: string, pieceId: string, value: string | null) => void;
  onAddAnswer: (lessonId: string, blockId: string, pieceId: string) => void;
  onRemoveAnswer: (lessonId: string, blockId: string, pieceId: string, answerIndex: number) => void;
  onAddPiece: (lessonId: string, blockId: string) => string;
  onDeletePiece: (lessonId: string, blockId: string, pieceId: string) => void;
  onAddBlock: (lessonId: string, type: DocumentBlockType, insertionIndex: number) => string;
  onDeleteBlock: (lessonId: string, blockId: string) => void;
  onDuplicateBlock: (lessonId: string, blockId: string) => void;
  onMoveBlock: (lessonId: string, blockId: string, direction: -1 | 1) => void;
  onReorderBlock: (lessonId: string, draggedId: string, targetId: string, position: "before" | "after") => void;
  deletionUndo: { lessonId: string; label: string } | null; onUndoDeletion: () => void;
};

export function LessonLibrary(props: Props) {
  const [query, setQuery] = useState("");
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [collapsedLessons, setCollapsedLessons] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [dragged, setDragged] = useState<{ moduleId: string; lessonId: string } | null>(null);
  const keyboardHelpButtonRef = useRef<HTMLButtonElement>(null);
  const lessonById = useMemo(() => new Map(props.lessons.map((lesson) => [lesson.id, lesson])), [props.lessons]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const totalSlides = props.lessons.reduce((sum, lesson) => sum + lesson.blocks.length, 0);

  const focus = useFocusContext();
  const hudLessonLabel = useMemo(() => {
    if (!focus.lessonId) return null;
    const lesson = lessonById.get(focus.lessonId);
    if (!lesson) return null;
    if (lesson.name?.trim()) return lesson.name.trim();
    const home = props.modules.find((module) => module.lessonIds.includes(lesson.id));
    const position = home ? home.lessonIds.indexOf(lesson.id) + 1 : 0;
    return position ? `Lesson ${position}` : "This lesson";
  }, [focus.lessonId, lessonById, props.modules]);

  function collapse(lessonId: string) {
    setCollapsedLessons((current) => { const next = new Set(current); next.add(lessonId); return next; });
  }

  function startDrag(event: DragEvent<HTMLButtonElement>, moduleId: string, lessonId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", lessonId);
    setDragged({ moduleId, lessonId });
  }

  function drop(event: DragEvent<HTMLElement>, moduleId: string, targetIndex: number, usePointer = false) {
    event.preventDefault();
    if (!dragged) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const after = usePointer && event.clientY >= bounds.top + bounds.height / 2;
    props.onDropLesson(dragged.lessonId, moduleId, targetIndex + (after ? 1 : 0));
    setDragged(null);
  }

  function startLesson(moduleId: string) {
    const lessonId = props.onNewLesson(moduleId);
    requestAnimationFrame(() => {
      document.querySelector<HTMLInputElement>(`[data-lesson-title="${lessonId}"]`)?.focus();
    });
  }

  function closeKeyboardHelp() {
    setShowKeyboardHelp(false);
    requestAnimationFrame(() => keyboardHelpButtonRef.current?.focus());
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey || event.key !== ".") return;
      event.preventDefault();
      setShowKeyboardHelp((open) => !open);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section className="lesson-library" aria-label="Course lessons">
      <header className="lesson-library-utility">
        <label className="lesson-library-search">
          <Search size={15} />
          <input id="lesson-library-search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find lesson or concept" aria-label="Find a lesson or concept" />
          <kbd>⌥K</kbd>
        </label>
        <span className="lesson-library-counts">{props.modules.length} modules · {props.lessons.length} lessons · {totalSlides} items</span>
        <span className="lesson-library-history">
          <button type="button" onClick={props.onUndo} disabled={!props.canUndo} suppressHydrationWarning aria-label="Undo" title="Undo (Ctrl+Z)"><Undo2 size={14} /></button>
          <button type="button" onClick={props.onRedo} disabled={!props.canRedo} suppressHydrationWarning aria-label="Redo" title="Redo (Ctrl+Shift+Z)"><Redo2 size={14} /></button>
        </span>
        <span className="lesson-library-save">{props.saveLabel}</span>
      </header>
      <button
        ref={keyboardHelpButtonRef}
        type="button"
        className="lesson-library-help-fab"
        aria-expanded={showKeyboardHelp}
        aria-label="Keyboard shortcuts — press Ctrl or Command then period"
        title="Keyboard shortcuts  ( Ctrl/⌘ . )"
        onClick={() => setShowKeyboardHelp((open) => !open)}
      >
        <Keyboard size={20} aria-hidden="true" />
        <kbd aria-hidden="true">Ctrl .</kbd>
      </button>
      {showKeyboardHelp && <KeyboardHelpDialog onClose={closeKeyboardHelp} />}

      <div className="lesson-library-modules">
        {props.modules.map((module, moduleIndex) => {
          const moduleLessons = module.lessonIds.map((id) => lessonById.get(id)).filter((lesson): lesson is Lesson => Boolean(lesson));
          const visibleLessons = moduleLessons.filter((lesson) => !normalizedQuery || lesson.name?.toLocaleLowerCase().includes(normalizedQuery) || lesson.concepts.some((concept) => concept.label.toLocaleLowerCase().includes(normalizedQuery)));
          if (normalizedQuery && !visibleLessons.length) return null;
          const taughtInModule = new Set(moduleLessons.flatMap((lesson) => lesson.concepts.map(conceptKey)));

          return (
            <section key={module.id} className="lesson-library-module" onDragOver={(event) => { if (dragged) event.preventDefault(); }} onDrop={(event) => { if (!moduleLessons.length) drop(event, module.id, 0); }}>
              <div className="lesson-library-module-meta">
                <div className="lesson-library-module-line">
                  <input className="lesson-library-module-title" value={module.name ?? ""} onChange={(event) => props.onChangeModule(module.id, { name: event.target.value || null })} placeholder="Untitled module" aria-label={`Module ${moduleIndex + 1} name`} />
                  <span>{moduleLessons.length} lessons · {moduleLessons.reduce((sum, lesson) => sum + lesson.blocks.length, 0)} items</span>
                  <button
                    type="button"
                    className="lesson-library-module-delete danger"
                    title="Delete module"
                    aria-label="Delete module"
                    disabled={props.modules.length === 1}
                    onClick={() => {
                      const lessonCount = moduleLessons.length;
                      const note = lessonCount > 0
                        ? ` Its ${lessonCount} lesson${lessonCount === 1 ? "" : "s"} will move to another module.`
                        : "";
                      if (window.confirm(`Delete “${module.name ?? "this module"}”?${note}`)) props.onDeleteModule(module.id);
                    }}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
                <LessonConceptsField
                  variant="compact"
                  label="Module concepts"
                  concepts={module.keyConcepts}
                  conceptDisplays={props.conceptDisplays}
                  coveredConceptKeys={taughtInModule}
                  onAdd={(concept) => props.onChangeModule(module.id, { keyConcepts: [...module.keyConcepts, concept] })}
                  onRemove={(id) => props.onChangeModule(module.id, { keyConcepts: module.keyConcepts.filter((concept) => concept.id !== id) })}
                  onRelabel={(id, label) => props.onChangeModule(module.id, { keyConcepts: module.keyConcepts.map((concept) => concept.id === id ? { ...concept, label } : concept) })}
                />
              </div>

              <div className="lesson-library-list">
                {visibleLessons.map((lesson) => {
                  const lessonIndex = moduleLessons.findIndex((item) => item.id === lesson.id);
                  const lessonCollapsed = collapsedLessons.has(lesson.id);
                  const lessonDeleteKey = `lesson:${lesson.id}`;
                  return (
                    <article key={lesson.id} data-lesson-row={lesson.id} className={`lesson-library-row ${dragged?.lessonId === lesson.id ? "dragging" : ""}`} onDragOver={(event) => { if (dragged) event.preventDefault(); }} onDrop={(event) => drop(event, module.id, lessonIndex, true)}>
                      <div className="lesson-library-row-head">
                        <LessonDragHandle lessonNumber={lessonIndex + 1} onDragStart={(event) => startDrag(event, module.id, lesson.id)} onDragEnd={() => setDragged(null)} />
                        <button type="button" className="lesson-library-collapse" aria-expanded={!lessonCollapsed} aria-label={lessonCollapsed ? "Expand lesson" : "Collapse lesson"} onClick={() => setCollapsedLessons((current) => toggleSet(current, lesson.id))}>
                          {lessonCollapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                        </button>
                        <input
                          data-lesson-title={lesson.id}
                          className="lesson-library-title-input"
                          value={lesson.name ?? ""}
                          onChange={(event) => props.onRenameLesson(lesson.id, event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
                            event.preventDefault();
                            // Enter from the title goes straight to writing — the
                            // first explanation, creating one if needed.
                            const first = lesson.blocks[0];
                            focusSlideWritingField(first ? first.id : props.onAddBlock(lesson.id, "explanation", 0));
                          }}
                          placeholder="Name this lesson…"
                          aria-label={`Lesson ${lessonIndex + 1} title`}
                        />
                        <span className="lesson-library-slide-count">{lesson.blocks.length} items</span>
                        {props.modules.length > 1 && (
                          <select className="lesson-library-move-module" value={module.id} aria-label="Move lesson to module" onChange={(event) => props.onMoveLessonToModule(lesson.id, event.target.value)}>
                            {props.modules.map((item) => <option key={item.id} value={item.id}>{item.name ?? "Untitled module"}</option>)}
                          </select>
                        )}
                        <span className="lesson-library-row-icons">
                          <button type="button" className="lesson-library-try" title="Preview this lesson" aria-label="Preview this lesson" onClick={() => props.onPreviewLesson(lesson.id)}><Play size={14} aria-hidden="true" /></button>
                          <button type="button" title="Duplicate lesson" aria-label="Duplicate lesson" onClick={() => props.onDuplicateLesson(lesson.id)}><Copy size={14} aria-hidden="true" /></button>
                          {confirmDelete === lessonDeleteKey ? (
                            <span className="lesson-library-delete-confirm">
                              <button type="button" className="danger" onClick={() => { props.onDeleteLesson(lesson.id); setConfirmDelete(null); }}>Delete</button>
                              <button type="button" onClick={() => setConfirmDelete(null)}>Cancel</button>
                            </span>
                          ) : (
                            <button type="button" className="danger" title="Delete lesson" aria-label="Delete lesson" onClick={() => setConfirmDelete(lessonDeleteKey)}><Trash2 size={14} aria-hidden="true" /></button>
                          )}
                        </span>
                      </div>
                      {!lessonCollapsed && <LessonDocument
                        lesson={lesson} conceptDisplays={props.conceptDisplays} undoDeletionLabel={props.deletionUndo?.lessonId === lesson.id ? props.deletionUndo.label : null}
                        onAddConcept={(concept) => props.onAddLessonConcept(lesson.id, concept)} onRemoveConcept={(id) => props.onRemoveLessonConcept(lesson.id, id)} onRelabelConcept={(id, label) => props.onRelabelLessonConcept(lesson.id, id, label)}
                        onUpdateExplanation={(blockId, markdown) => props.onUpdateExplanation(lesson.id, blockId, markdown)} onUpdateSentence={(blockId, field, value) => props.onUpdateSentence(lesson.id, blockId, field, value)} onUpdateSpanish={(blockId, pieceId, value) => props.onUpdateSpanish(lesson.id, blockId, pieceId, value)} onUpdateAnswer={(blockId, pieceId, answerIndex, value) => props.onUpdateAnswer(lesson.id, blockId, pieceId, answerIndex, value)} onUpdateCallout={(blockId, pieceId, value) => props.onUpdateCallout(lesson.id, blockId, pieceId, value)} onAddAnswer={(blockId, pieceId) => props.onAddAnswer(lesson.id, blockId, pieceId)} onRemoveAnswer={(blockId, pieceId, answerIndex) => props.onRemoveAnswer(lesson.id, blockId, pieceId, answerIndex)} onAddPiece={(blockId) => props.onAddPiece(lesson.id, blockId)} onDeletePiece={(blockId, pieceId) => props.onDeletePiece(lesson.id, blockId, pieceId)} onAddBlock={(type, index) => props.onAddBlock(lesson.id, type, index)} onDeleteBlock={(blockId) => props.onDeleteBlock(lesson.id, blockId)} onDuplicateBlock={(blockId) => props.onDuplicateBlock(lesson.id, blockId)} onMoveBlock={(blockId, direction) => props.onMoveBlock(lesson.id, blockId, direction)} onReorderBlock={(draggedId, targetId, position) => props.onReorderBlock(lesson.id, draggedId, targetId, position)} onDone={() => collapse(lesson.id)} onAddLesson={() => startLesson(module.id)} onUndoDeletion={props.onUndoDeletion}
                      />}
                    </article>
                  );
                })}
                {moduleLessons.length === 0 ? <div className="lesson-library-first-lesson">
                  <button type="button" onClick={() => startLesson(module.id)}><Plus size={15} /> Create lesson <kbd>⌥⇧L</kbd></button>
                  <span>Everything saves automatically.</span>
                </div> : moduleLessons.every((lesson) => collapsedLessons.has(lesson.id)) && (
                  <button type="button" className="lesson-library-add-lesson" onClick={() => startLesson(module.id)}><Plus size={14} /> Add lesson</button>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <button type="button" className="lesson-library-add-module" onClick={props.onAddModule}><Plus size={14} /> Add module</button>

      <EditingHud context={focus} lessonLabel={hudLessonLabel} />
    </section>
  );
}

function KeyboardHelpDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return <dialog
    ref={dialogRef}
    className="lesson-library-help"
    aria-labelledby="lesson-keyboard-help-title"
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClose={onClose}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
  >
    <header><div><span>Lesson writing</span><h2 id="lesson-keyboard-help-title">Keyboard help <kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>.</kbd></h2></div><button type="button" onClick={onClose} aria-label="Close keyboard help"><X size={17} /></button></header>
    <KeyboardMap />
    <dl>
      <div><dt><kbd>Enter</kbd></dt><dd>From the title: start writing. In an explanation: new paragraph.</dd></div>
      <div><dt><kbd>⌥</kbd> <kbd>Q</kbd> · <kbd>⌥</kbd> <kbd>W</kbd> · <kbd>⌥</kbd> <kbd>E</kbd></dt><dd>In an explanation: type in Spanish · neutral · English. With text selected, marks it.</dd></div>
      <div><dt><kbd>⌥</kbd> <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></dt><dd>Add an Explanation / Sentence / Vocabulary table after the current slide</dd></div>
      <div><dt><kbd>⌥</kbd> <kbd>Enter</kbd></dt><dd>Open the slide chooser after this slide</dd></div>
      <div><dt><kbd>⌥</kbd> <kbd>D</kbd></dt><dd>Finish this lesson (collapse it)</dd></div>
      <div><dt><kbd>⌥</kbd> <kbd>L</kbd> · <kbd>⌥</kbd> <kbd>⇧</kbd> <kbd>L</kbd></dt><dd>Add a lesson here · start a whole new lesson</dd></div>
      <div><dt><kbd>Tab</kbd> / <kbd>⇧</kbd> <kbd>Tab</kbd></dt><dd>Move between Spanish, English, and the next blank</dd></div>
      <div><dt><kbd>⌥</kbd> <kbd>H</kbd> · <kbd>⌥</kbd> <kbd>A</kbd> · <kbd>⌥</kbd> <kbd>⌫</kbd></dt><dd>On a sentence blank: add a hint · add an accepted answer · delete the blank</dd></div>
      <div><dt><kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>B</kbd></dt><dd>Bold the selection</dd></div>
      <div><dt><kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>Z</kbd> · <kbd>⇧</kbd> <kbd>Z</kbd></dt><dd>Undo · redo</dd></div>
      <div><dt><kbd>⌥</kbd> <kbd>K</kbd></dt><dd>Jump to search</dd></div>
      <div><dt><kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>S</kbd></dt><dd>Save now (it also autosaves)</dd></div>
      <div><dt><kbd>Esc</kbd></dt><dd>Leave a field, or close this help</dd></div>
    </dl>
    <footer><button type="button" onClick={onClose}>Close <kbd>Esc</kbd></button></footer>
  </dialog>;
}

type Key = { k: string; act?: string; w?: number };
const KEYBOARD_ROWS: Key[][] = [
  [{ k: "Esc", act: "leave field", w: 1.6 }, { k: "1", act: "Explanation" }, { k: "2", act: "Sentence" }, { k: "3", act: "Vocab table" }, { k: "4" }, { k: "5" }, { k: "6" }, { k: "7" }, { k: "8" }, { k: "9" }, { k: "0" }],
  [{ k: "Tab", act: "next field", w: 1.6 }, { k: "Q", act: "Spanish" }, { k: "W", act: "neutral" }, { k: "E", act: "English" }, { k: "R" }, { k: "T" }, { k: "Y" }, { k: "U" }, { k: "I" }, { k: "O" }, { k: "P" }],
  [{ k: "⌥ Alt", act: "hold for commands", w: 2 }, { k: "A", act: "alt answer" }, { k: "S" }, { k: "D", act: "done" }, { k: "F" }, { k: "G" }, { k: "H", act: "hint" }, { k: "J" }, { k: "K", act: "search" }, { k: "L", act: "add lesson" }, { k: "Enter", act: "add slide", w: 1.8 }],
  [{ k: "Shift", act: "hold", w: 2.4 }, { k: "Z", act: "undo" }, { k: "X" }, { k: "C" }, { k: "V" }, { k: "B", act: "bold" }, { k: "N" }, { k: "M" }, { k: "," }, { k: ".", act: "shortcuts" }, { k: "/" }],
  [{ k: "Space", w: 7 }, { k: "←" }, { k: "↑ ↓" }, { k: "→" }],
];

function KeyboardMap() {
  return (
    <div className="lesson-kbd-map" role="img" aria-label="Keyboard shortcut map">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="lesson-kbd-row">
          {row.map((key, keyIndex) => (
            <span
              key={keyIndex}
              className={`lesson-kbd-key${key.act ? " is-active" : ""}`}
              style={{ flexGrow: key.w ?? 1 }}
            >
              <span className="lesson-kbd-cap">{key.k}</span>
              {key.act && <span className="lesson-kbd-act">{key.act}</span>}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function toggleSet(current: Set<string>, id: string) {
  const next = new Set(current);
  if (next.has(id)) next.delete(id); else next.add(id);
  return next;
}
