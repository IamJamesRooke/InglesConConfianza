"use client";

import { Copy, Eye, Keyboard, Plus, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";

import { LessonConceptsField, type ConceptDisplayLookup } from "@/components/lesson-builder/lesson-concepts-field";
import { LessonDocument, LessonDragHandle, type DocumentBlockType } from "@/components/lesson-builder/lesson-document";
import type { Lesson, LessonConcept, LessonModule } from "@/lib/lesson-builder/types";

type Props = {
  modules: LessonModule[]; lessons: Lesson[]; conceptDisplays: ConceptDisplayLookup; saveLabel: string;
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
  deletionUndo: { lessonId: string; label: string } | null; onUndoDeletion: () => void;
};

export function LessonLibrary(props: Props) {
  const [query, setQuery] = useState("");
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [collapsedLessons, setCollapsedLessons] = useState<Set<string>>(new Set());
  const [lessonActions, setLessonActions] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [dragged, setDragged] = useState<{ moduleId: string; lessonId: string } | null>(null);
  const keyboardHelpButtonRef = useRef<HTMLButtonElement>(null);
  const lessonById = useMemo(() => new Map(props.lessons.map((lesson) => [lesson.id, lesson])), [props.lessons]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const totalSlides = props.lessons.reduce((sum, lesson) => sum + lesson.blocks.length, 0);

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

  return (
    <section className="lesson-library" aria-label="Course lessons">
      <header className="lesson-library-utility">
        <label className="lesson-library-search">
          <Search size={15} />
          <input id="lesson-library-search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find lesson or concept" aria-label="Find a lesson or concept" />
          <kbd>Ctrl K</kbd>
        </label>
        <span className="lesson-library-counts">{props.modules.length} modules · {props.lessons.length} lessons · {totalSlides} items</span>
        <span className="lesson-library-save">{props.saveLabel}</span>
        <button ref={keyboardHelpButtonRef} type="button" className="lesson-library-keyboard-help" aria-expanded={showKeyboardHelp} onClick={() => setShowKeyboardHelp(true)}><Keyboard size={14} /> Keyboard help</button>
        <Link href="/course"><Eye size={14} /> Preview</Link>
        <Link href="/admin/lesson-builder/coverage">Coverage</Link>
      </header>
      {showKeyboardHelp && <KeyboardHelpDialog onClose={closeKeyboardHelp} />}

      <div className="lesson-library-modules">
        {props.modules.map((module, moduleIndex) => {
          const moduleLessons = module.lessonIds.map((id) => lessonById.get(id)).filter((lesson): lesson is Lesson => Boolean(lesson));
          const visibleLessons = moduleLessons.filter((lesson) => !normalizedQuery || lesson.name?.toLocaleLowerCase().includes(normalizedQuery) || lesson.concepts.some((concept) => concept.label.toLocaleLowerCase().includes(normalizedQuery)));
          if (normalizedQuery && !visibleLessons.length) return null;
          const moduleDeleteKey = `module:${module.id}`;

          return (
            <section key={module.id} className="lesson-library-module" onDragOver={(event) => { if (dragged) event.preventDefault(); }} onDrop={(event) => { if (!moduleLessons.length) drop(event, module.id, 0); }}>
              <div className="lesson-library-module-meta">
                <div className="lesson-library-module-line">
                  <input className="lesson-library-module-title" value={module.name ?? ""} onChange={(event) => props.onChangeModule(module.id, { name: event.target.value || null })} placeholder="Untitled module" aria-label={`Module ${moduleIndex + 1} name`} />
                  <span>{moduleLessons.length} lessons · {moduleLessons.reduce((sum, lesson) => sum + lesson.blocks.length, 0)} items</span>
                  <div className="lesson-library-module-controls">
                    <button type="button" disabled={moduleIndex === 0} onClick={() => props.onMoveModule(moduleIndex, -1)}>Earlier</button>
                    <button type="button" disabled={moduleIndex === props.modules.length - 1} onClick={() => props.onMoveModule(moduleIndex, 1)}>Later</button>
                    {confirmDelete === moduleDeleteKey ? <span className="lesson-inline-confirm">Move its lessons and delete? <button type="button" className="danger" onClick={() => { props.onDeleteModule(module.id); setConfirmDelete(null); }}>Yes</button><button type="button" onClick={() => setConfirmDelete(null)}>Cancel</button></span> : <button type="button" className="danger" disabled={props.modules.length === 1} onClick={() => setConfirmDelete(moduleDeleteKey)}><Trash2 size={12} /> Delete</button>}
                  </div>
                </div>
                <LessonConceptsField
                  variant="compact"
                  label="Module concepts"
                  concepts={module.keyConcepts}
                  conceptDisplays={props.conceptDisplays}
                  onAdd={(concept) => props.onChangeModule(module.id, { keyConcepts: [...module.keyConcepts, concept] })}
                  onRemove={(id) => props.onChangeModule(module.id, { keyConcepts: module.keyConcepts.filter((concept) => concept.id !== id) })}
                  onRelabel={(id, label) => props.onChangeModule(module.id, { keyConcepts: module.keyConcepts.map((concept) => concept.id === id ? { ...concept, label } : concept) })}
                />
              </div>

              <div className="lesson-library-list">
                {visibleLessons.map((lesson) => {
                  const lessonIndex = moduleLessons.findIndex((item) => item.id === lesson.id);
                  const lessonCollapsed = collapsedLessons.has(lesson.id);
                  const actionsOpen = lessonActions === lesson.id;
                  const lessonDeleteKey = `lesson:${lesson.id}`;
                  return (
                    <article key={lesson.id} className={`lesson-library-row ${dragged?.lessonId === lesson.id ? "dragging" : ""}`} onDragOver={(event) => { if (dragged) event.preventDefault(); }} onDrop={(event) => drop(event, module.id, lessonIndex, true)}>
                      <div className="lesson-library-row-head">
                        <LessonDragHandle lessonNumber={lessonIndex + 1} onDragStart={(event) => startDrag(event, module.id, lesson.id)} onDragEnd={() => setDragged(null)} />
                        <input data-lesson-title={lesson.id} className="lesson-library-title-input" value={lesson.name ?? ""} onChange={(event) => props.onRenameLesson(lesson.id, event.target.value)} placeholder="Name this lesson…" aria-label={`Lesson ${lessonIndex + 1} title`} />
                        <span className="lesson-library-slide-count">{lesson.blocks.length} items</span>
                        <button type="button" className="lesson-library-try" onClick={() => props.onPreviewLesson(lesson.id)}>Try</button>
                        <button type="button" className="lesson-library-actions-toggle" aria-expanded={actionsOpen} onClick={() => setLessonActions(actionsOpen ? null : lesson.id)}>Actions</button>
                        <button type="button" className="lesson-library-content-toggle" onClick={() => setCollapsedLessons((current) => toggleSet(current, lesson.id))}>{lessonCollapsed ? "Show" : "Hide"}</button>
                      </div>
                      {actionsOpen && <div className="lesson-library-inline-actions">
                        <button type="button" onClick={() => props.onDuplicateLesson(lesson.id)}><Copy size={12} /> Duplicate</button>
                        <button type="button" disabled={lessonIndex === 0} onClick={() => props.onMoveLesson(module.id, lessonIndex, -1)}>Earlier</button>
                        <button type="button" disabled={lessonIndex === moduleLessons.length - 1} onClick={() => props.onMoveLesson(module.id, lessonIndex, 1)}>Later</button>
                        {props.modules.length > 1 && <label><span>Module</span><select value={module.id} onChange={(event) => props.onMoveLessonToModule(lesson.id, event.target.value)}>{props.modules.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
                        {confirmDelete === lessonDeleteKey ? <span className="lesson-inline-confirm">Delete this lesson? <button type="button" className="danger" onClick={() => { props.onDeleteLesson(lesson.id); setConfirmDelete(null); }}>Yes</button><button type="button" onClick={() => setConfirmDelete(null)}>Cancel</button></span> : <button type="button" className="danger" onClick={() => setConfirmDelete(lessonDeleteKey)}><Trash2 size={12} /> Delete</button>}
                      </div>}
                      {!lessonCollapsed && <LessonDocument
                        lesson={lesson} conceptDisplays={props.conceptDisplays} undoDeletionLabel={props.deletionUndo?.lessonId === lesson.id ? props.deletionUndo.label : null}
                        onAddConcept={(concept) => props.onAddLessonConcept(lesson.id, concept)} onRemoveConcept={(id) => props.onRemoveLessonConcept(lesson.id, id)} onRelabelConcept={(id, label) => props.onRelabelLessonConcept(lesson.id, id, label)}
                        onUpdateExplanation={(blockId, markdown) => props.onUpdateExplanation(lesson.id, blockId, markdown)} onUpdateSentence={(blockId, field, value) => props.onUpdateSentence(lesson.id, blockId, field, value)} onUpdateSpanish={(blockId, pieceId, value) => props.onUpdateSpanish(lesson.id, blockId, pieceId, value)} onUpdateAnswer={(blockId, pieceId, answerIndex, value) => props.onUpdateAnswer(lesson.id, blockId, pieceId, answerIndex, value)} onUpdateCallout={(blockId, pieceId, value) => props.onUpdateCallout(lesson.id, blockId, pieceId, value)} onAddAnswer={(blockId, pieceId) => props.onAddAnswer(lesson.id, blockId, pieceId)} onRemoveAnswer={(blockId, pieceId, answerIndex) => props.onRemoveAnswer(lesson.id, blockId, pieceId, answerIndex)} onAddPiece={(blockId) => props.onAddPiece(lesson.id, blockId)} onDeletePiece={(blockId, pieceId) => props.onDeletePiece(lesson.id, blockId, pieceId)} onAddBlock={(type, index) => props.onAddBlock(lesson.id, type, index)} onDeleteBlock={(blockId) => props.onDeleteBlock(lesson.id, blockId)} onDuplicateBlock={(blockId) => props.onDuplicateBlock(lesson.id, blockId)} onMoveBlock={(blockId, direction) => props.onMoveBlock(lesson.id, blockId, direction)} onUndoDeletion={props.onUndoDeletion}
                      />}
                    </article>
                  );
                })}
                {moduleLessons.length === 0 ? <div className="lesson-library-first-lesson">
                  <div><strong>Start your first lesson</strong><p>Write a short explanation, add a sentence for learners to practice, then repeat.</p></div>
                  <button type="button" onClick={() => startLesson(module.id)}><Plus size={15} /> Create lesson</button>
                  <span>Everything saves automatically.</span>
                </div> : <button type="button" className="lesson-library-add-lesson" onClick={() => startLesson(module.id)}><Plus size={14} /> Add lesson</button>}
              </div>
            </section>
          );
        })}
      </div>
      <button type="button" className="lesson-library-add-module" onClick={props.onAddModule}><Plus size={14} /> Add module</button>
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
    <header><div><span>Lesson writing</span><h2 id="lesson-keyboard-help-title">Keyboard help</h2></div><button type="button" onClick={onClose} aria-label="Close keyboard help"><X size={17} /></button></header>
    <div className="lesson-library-help-rhythm"><strong>The writing rhythm</strong><span>Explanation</span><b>→</b><span>Ctrl/⌘ + Enter</span><b>→</b><span>Sentence</span><b>→</b><span>Spanish · Tab · English · Tab</span><b>→</b><span>repeat</span></div>
    <dl>
      <div><dt>Ctrl/⌘ + Enter</dt><dd>Add the next item</dd></div>
      <div><dt>Ctrl/⌘ + Shift + 1</dt><dd>Mark selected text Spanish</dd></div>
      <div><dt>Ctrl/⌘ + Shift + 2</dt><dd>Mark selected text English</dd></div>
      <div><dt>Ctrl/⌘ + Shift + 0</dt><dd>Clear selected formatting</dd></div>
      <div><dt>Escape</dt><dd>Leave a field or close this help</dd></div>
      <div><dt>Ctrl/⌘ + S</dt><dd>Save now</dd></div>
    </dl>
    <footer><button type="button" onClick={onClose}>Close</button></footer>
  </dialog>;
}

function toggleSet(current: Set<string>, id: string) {
  const next = new Set(current);
  if (next.has(id)) next.delete(id); else next.add(id);
  return next;
}
