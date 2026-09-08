"use client";

import { Copy, GripVertical, Plus, Trash2, Undo2 } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";

import { LessonConceptsField, type ConceptDisplayLookup } from "@/components/lesson-builder/lesson-concepts-field";
import { EditablePracticeMarkdown } from "@/components/practice/practice-markdown";
import { focusSlideWritingField } from "@/lib/lesson-builder/focus";
import { useDragReorder } from "@/lib/lesson-builder/use-drag-reorder";
import type { Lesson, LessonConcept, SentenceBlock } from "@/lib/lesson-builder/types";

export type DocumentBlockType = "explanation" | "sentence" | "vocabulary";

type CaretOrigin =
  | { kind: "field"; el: HTMLInputElement | HTMLTextAreaElement; start: number; end: number }
  | { kind: "editable"; el: HTMLElement; textOffset: number }
  | { kind: "other"; el: HTMLElement };

// Caret position inside a contentEditable expressed as a character offset from
// its start, so it survives the field being re-rendered while the chooser is open.
function caretTextOffset(root: HTMLElement): number {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer)) return 0;
  const measure = range.cloneRange();
  measure.selectNodeContents(root);
  measure.setEnd(range.startContainer, range.startOffset);
  return measure.toString().length;
}

function setCaretAtOffset(root: HTMLElement, target: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let seen = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const length = node.textContent?.length ?? 0;
    if (seen + length >= target) {
      const range = document.createRange();
      range.setStart(node, Math.max(0, Math.min(length, target - seen)));
      range.collapse(true);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }
    seen += length;
  }
  const end = document.createRange();
  end.selectNodeContents(root);
  end.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(end);
}

type Props = {
  lesson: Lesson;
  conceptDisplays: ConceptDisplayLookup;
  undoDeletionLabel: string | null;
  onAddConcept: (concept: LessonConcept) => void;
  onRemoveConcept: (conceptId: string) => void;
  onRelabelConcept: (conceptId: string, label: string) => void;
  onUpdateExplanation: (blockId: string, markdown: string) => void;
  onUpdateSentence: (blockId: string, field: "promptText" | "helperText" | "answerFeedback", value: string | null) => void;
  onUpdateSpanish: (blockId: string, pieceId: string, value: string) => void;
  onUpdateAnswer: (blockId: string, pieceId: string, answerIndex: number, value: string) => void;
  onUpdateCallout: (blockId: string, pieceId: string, value: string | null) => void;
  onAddAnswer: (blockId: string, pieceId: string) => void;
  onRemoveAnswer: (blockId: string, pieceId: string, answerIndex: number) => void;
  onAddPiece: (blockId: string) => string;
  onDeletePiece: (blockId: string, pieceId: string) => void;
  onAddBlock: (type: DocumentBlockType, insertionIndex: number) => string;
  onDeleteBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: -1 | 1) => void;
  onReorderBlock: (draggedId: string, targetId: string, position: "before" | "after") => void;
  onDone: () => void;
  onAddLesson: () => void;
  onUndoDeletion: () => void;
};

const BLOCK_TYPES: { type: DocumentBlockType; label: string; key: string }[] = [
  { type: "explanation", label: "Explanation", key: "E" },
  { type: "sentence", label: "Sentence", key: "S" },
  { type: "vocabulary", label: "Vocabulary table", key: "V" },
];

export function LessonDocument(props: Props) {
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [insertChoice, setInsertChoice] = useState(0);
  // The chooser only grabs focus when the teacher opened it (Ctrl/⌘+Enter or the
  // "+" button). The one shown on an empty lesson must not pull focus off the
  // title.
  const [insertFocus, setInsertFocus] = useState(false);
  const focusAfterAdd = useRef<string | null>(null);
  const caretOrigin = useRef<CaretOrigin | null>(null);
  const drag = useDragReorder({ axis: "y", mode: "nested" });
  const dragScope = props.lesson.id;

  useEffect(() => {
    if (!focusAfterAdd.current) return;
    focusSlideWritingField(focusAfterAdd.current);
    focusAfterAdd.current = null;
  }, [props.lesson.blocks]);

  function captureCaretOrigin() {
    const el = document.activeElement;
    if (!(el instanceof HTMLElement)) { caretOrigin.current = null; return; }
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      caretOrigin.current = { kind: "field", el, start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
      return;
    }
    if (el.isContentEditable) {
      caretOrigin.current = { kind: "editable", el, textOffset: caretTextOffset(el) };
      return;
    }
    caretOrigin.current = { kind: "other", el };
  }

  function restoreCaretOrigin() {
    const origin = caretOrigin.current;
    caretOrigin.current = null;
    if (!origin || !document.contains(origin.el)) return;
    origin.el.focus();
    if (origin.kind === "field") {
      try { origin.el.setSelectionRange(origin.start, origin.end); } catch { /* unsupported input type */ }
      return;
    }
    if (origin.kind === "editable") {
      setCaretAtOffset(origin.el, origin.textOffset);
    }
  }

  function recommendedChoice(index: number) {
    const previous = props.lesson.blocks[index - 1];
    return previous?.type === "explanation" ? 1 : 0;
  }

  function openInsert(index: number) {
    captureCaretOrigin();
    setInsertChoice(recommendedChoice(index));
    setInsertAt(index);
    setInsertFocus(true);
  }

  function closeInsert() {
    setInsertAt(null);
    setInsertFocus(false);
    restoreCaretOrigin();
  }

  function add(type: DocumentBlockType, index: number) {
    caretOrigin.current = null;
    focusAfterAdd.current = props.onAddBlock(type, index);
    setInsertAt(null);
    setInsertFocus(false);
  }

  // Ctrl/⌘+Enter: open the slide chooser after the active slide.
  function openInsertAfterActive() {
    const index = props.lesson.blocks.findIndex((block) => block.id === activeBlock);
    openInsert(index >= 0 ? index + 1 : props.lesson.blocks.length);
  }


  return (
    <div className="lesson-document">
      <div
        className="lesson-document-body"
        onKeyDown={(event) => {
          // Alt-based, so nothing collides with browser Ctrl/⌘ shortcuts (save,
          // history, address bar, paste…). event.code, not event.key, so Mac
          // Option+letter (which composes ´å∂…) still resolves.
          if (!event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing || event.defaultPrevented) return;
          const at = () => {
            const i = props.lesson.blocks.findIndex((block) => block.id === activeBlock);
            return i >= 0 ? i + 1 : props.lesson.blocks.length;
          };
          const stop = () => { event.preventDefault(); event.stopPropagation(); };
          if (event.code === "Enter" || event.code === "NumpadEnter") {
            if (event.shiftKey) { stop(); props.onDone(); }
            else if (insertAt === null) { stop(); openInsertAfterActive(); }
          } else if (event.shiftKey) {
            return;
          } else if (event.code === "Digit1") {
            stop(); add("explanation", at());
          } else if (event.code === "Digit2") {
            stop(); add("sentence", at());
          } else if (event.code === "Digit3") {
            stop(); add("vocabulary", at());
          } else if (event.code === "KeyD") {
            stop(); props.onDone();
          } else if (event.code === "KeyL") {
            stop(); props.onAddLesson();
          }
        }}
      >
        {props.lesson.blocks.map((block, index) => (
          <div
            key={block.id}
            className={`lesson-document-block${drag.dragged?.id === block.id ? " dragging" : ""}${
              drag.dropTarget?.id === block.id ? ` drop-${drag.dropTarget.position}` : ""
            }`}
            data-document-block={block.id}
            tabIndex={-1}
            onFocusCapture={() => setActiveBlock(block.id)}
            onDragOver={(event) => drag.dragOver(event, dragScope, block.id)}
            onDrop={(event) => {
              if (!drag.dragged) return;
              event.preventDefault();
              event.stopPropagation();
              if (drag.dragged && drag.dropTarget && drag.dragged.id !== drag.dropTarget.id) {
                props.onReorderBlock(drag.dragged.id, drag.dropTarget.id, drag.dropTarget.position);
              }
              drag.reset();
            }}
            onKeyDownCapture={(event) => {
              if (event.key !== "Escape" || event.target === event.currentTarget) return;
              // Let the insertion chooser handle its own Escape.
              if (insertAt === index || (event.target as HTMLElement).closest?.(".lesson-document-insert-choices")) return;
              event.preventDefault();
              event.stopPropagation();
              const actions = event.currentTarget.querySelector<HTMLElement>(".lesson-document-block-chrome button");
              (actions ?? event.currentTarget).focus();
            }}
          >
            <InsertControl
              open={insertAt === index}
              autoFocusOnOpen={insertFocus}
              selected={insertChoice}
              onSelected={setInsertChoice}
              onToggle={() => insertAt === index ? closeInsert() : openInsert(index)}
              onAdd={(type) => add(type, index)}
              onClose={closeInsert}
            />

            {block.type === "explanation" ? (
              <section className="lesson-document-explanation" aria-label={`Explanation ${index + 1}`}>
                <EditablePracticeMarkdown
                  markdown={block.contentMarkdown}
                  placeholder=""
                  ariaLabel={`Explanation ${index + 1}`}
                  fieldName={`explanation-${block.id}`}
                  variant="document"
                  onChange={(markdown) => props.onUpdateExplanation(block.id, markdown)}
                />
              </section>
            ) : (
              <SentenceDocument
                block={block}
                active={activeBlock === block.id}
                onUpdateSentence={(field, value) => props.onUpdateSentence(block.id, field, value)}
                onUpdateSpanish={(pieceId, value) => props.onUpdateSpanish(block.id, pieceId, value)}
                onUpdateAnswer={(pieceId, answerIndex, value) => props.onUpdateAnswer(block.id, pieceId, answerIndex, value)}
                onUpdateCallout={(pieceId, value) => props.onUpdateCallout(block.id, pieceId, value)}
                onAddAnswer={(pieceId) => props.onAddAnswer(block.id, pieceId)}
                onRemoveAnswer={(pieceId, answerIndex) => props.onRemoveAnswer(block.id, pieceId, answerIndex)}
                onAddPiece={() => props.onAddPiece(block.id)}
                onDeletePiece={(pieceId) => props.onDeletePiece(block.id, pieceId)}
              />
            )}


            <div className="lesson-document-block-chrome" aria-label={`Actions for slide ${index + 1}`}>
              <button type="button" title="Duplicate" aria-label={`Duplicate slide ${index + 1}`} onClick={() => props.onDuplicateBlock(block.id)}><Copy size={13} /></button>
              <button type="button" className="danger" title="Delete" aria-label={`Delete slide ${index + 1}`} onClick={() => props.onDeleteBlock(block.id)}><Trash2 size={13} /></button>
              <button
                type="button"
                className="lesson-document-block-handle"
                draggable
                aria-label={`Reorder slide ${index + 1}`}
                title="Drag to reorder"
                onDragStart={(event) => drag.dragStart(event, dragScope, block.id)}
                onDragEnd={drag.reset}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp" && index > 0) { event.preventDefault(); props.onMoveBlock(block.id, -1); }
                  if (event.key === "ArrowDown" && index < props.lesson.blocks.length - 1) { event.preventDefault(); props.onMoveBlock(block.id, 1); }
                }}
              >
                <GripVertical size={14} />
              </button>
            </div>
          </div>
        ))}

        <div className="lesson-document-tail">
          <InsertControl
            open={insertAt === props.lesson.blocks.length}
            inline={props.lesson.blocks.length === 0}
            label="Add slide"
            autoFocusOnOpen={props.lesson.blocks.length === 0 ? false : insertFocus}
            selected={insertChoice}
            onSelected={setInsertChoice}
            onToggle={() => insertAt === props.lesson.blocks.length ? closeInsert() : openInsert(props.lesson.blocks.length)}
            onAdd={(type) => add(type, props.lesson.blocks.length)}
            onClose={closeInsert}
          />
        </div>

        <div className="lesson-document-tags">
          <LessonConceptsField
            variant="compact"
            label="Covers"
            concepts={props.lesson.concepts}
            conceptDisplays={props.conceptDisplays}
            coversFor={props.lesson.id}
            onAdd={props.onAddConcept}
            onRemove={props.onRemoveConcept}
            onRelabel={props.onRelabelConcept}
          />
        </div>

        {props.undoDeletionLabel && (
          <button type="button" className="lesson-document-undo" onClick={props.onUndoDeletion}>
            <Undo2 size={14} /> {props.undoDeletionLabel} — Undo
          </button>
        )}
      </div>
    </div>
  );
}

function InsertControl({ open, label, inline = false, autoFocusOnOpen = true, selected, onSelected, onToggle, onAdd, onClose }: {
  open: boolean;
  label?: string;
  inline?: boolean;
  autoFocusOnOpen?: boolean;
  selected: number;
  onSelected: (index: number) => void;
  onToggle: () => void;
  onAdd: (type: DocumentBlockType) => void;
  onClose: () => void;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const showChoices = open || inline;

  useEffect(() => {
    if (showChoices && autoFocusOnOpen) requestAnimationFrame(() => buttons.current[selected]?.focus());
  }, [showChoices, autoFocusOnOpen, selected]);

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      onSelected((selected + 1) % BLOCK_TYPES.length);
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      onSelected((selected - 1 + BLOCK_TYPES.length) % BLOCK_TYPES.length);
      return;
    }
    const directChoice = BLOCK_TYPES.find((choice) => choice.key.toLowerCase() === event.key.toLowerCase());
    if (directChoice) {
      event.preventDefault();
      onAdd(directChoice.type);
    }
  }

  return (
    <div className={`lesson-document-insert${label ? " labelled" : ""}${inline ? " inline" : ""}`}>
      {!inline && (
        <button type="button" onClick={onToggle} aria-expanded={open}>
          <Plus size={13} /> {label ?? <span className="sr-only">Insert slide here</span>}
        </button>
      )}
      {showChoices && (
        <div className="lesson-document-insert-choices" role="toolbar" aria-label="Choose the first slide" onKeyDown={handleKey}>
          {BLOCK_TYPES.map((choice, index) => (
            <button
              key={choice.type}
              ref={(element) => { buttons.current[index] = element; }}
              type="button"
              className={selected === index ? "selected" : ""}
              onFocus={() => onSelected(index)}
              onClick={() => onAdd(choice.type)}
            >
              {choice.label} <kbd>{choice.key}</kbd>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SentenceDocument({ block, active, onUpdateSentence, onUpdateSpanish, onUpdateAnswer, onUpdateCallout, onAddAnswer, onRemoveAnswer, onAddPiece, onDeletePiece }: {
  block: SentenceBlock;
  active: boolean;
  onUpdateSentence: (field: "promptText" | "helperText" | "answerFeedback", value: string | null) => void;
  onUpdateSpanish: (pieceId: string, value: string) => void;
  onUpdateAnswer: (pieceId: string, answerIndex: number, value: string) => void;
  onUpdateCallout: (pieceId: string, value: string | null) => void;
  onAddAnswer: (pieceId: string) => void;
  onRemoveAnswer: (pieceId: string, answerIndex: number) => void;
  onAddPiece: () => string;
  onDeletePiece: (pieceId: string) => void;
}) {
  const [activePiece, setActivePiece] = useState<string | null>(null);
  const [showHelper, setShowHelper] = useState(Boolean(block.helperText));
  const [showPrompt, setShowPrompt] = useState(Boolean(block.promptText));
  const [focusNewSuccess, setFocusNewSuccess] = useState(false);
  const [focusCalloutId, setFocusCalloutId] = useState<string | null>(null);
  const [focusAlternativePieceId, setFocusAlternativePieceId] = useState<string | null>(null);
  const [draftSpanish, setDraftSpanish] = useState("");
  const spanishRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const englishRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const committingRef = useRef(false);
  const isTable = block.layout === "vocabulary_table";
  const isEmpty = block.languageBlocks.every((piece) => !piece.spanish.trim() && !(piece.acceptedAnswers[0] ?? "").trim());
  const lastPiece = block.languageBlocks.at(-1);
  const lastPieceComplete = !lastPiece || (Boolean(lastPiece.spanish.trim()) && Boolean(lastPiece.acceptedAnswers[0]?.trim()));
  const showTrailingPiece = lastPieceComplete && (active || block.languageBlocks.length === 0);

  type Piece = SentenceBlock["languageBlocks"][number];
  function addHint(piece: Piece) {
    if (piece.callout !== null) return;
    setFocusCalloutId(piece.id);
    onUpdateCallout(piece.id, "");
  }
  function addAlternative(piece: Piece) {
    setFocusAlternativePieceId(piece.id);
    onAddAnswer(piece.id);
  }

  // Alt+H hint · Alt+A alternative · Alt+Backspace delete — from either field of
  // a piece. event.code, not event.key, so Mac Option+letter (´å∂…) still resolves.
  function handlePieceActionKey(event: KeyboardEvent<HTMLTextAreaElement>, piece: Piece) {
    if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.nativeEvent.isComposing) return false;
    if (event.code === "KeyH") { event.preventDefault(); addHint(piece); return true; }
    if (event.code === "KeyA") { event.preventDefault(); addAlternative(piece); return true; }
    if (event.code === "Backspace") { event.preventDefault(); onDeletePiece(piece.id); return true; }
    return false;
  }

  // Plain Enter never splits a sentence piece / table row. Ctrl/⌘+Enter is left
  // alone so it can bubble to the "next slide" handler.
  function blockNewline(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      return true;
    }
    return false;
  }

  function handleSpanishKey(event: KeyboardEvent<HTMLTextAreaElement>, index: number) {
    if (blockNewline(event)) return;
    if (handlePieceActionKey(event, block.languageBlocks[index])) return;
    if (event.key !== "Tab" || event.nativeEvent.isComposing) return;
    if (event.shiftKey) {
      if (index > 0) { event.preventDefault(); englishRefs.current.get(block.languageBlocks[index - 1].id)?.focus(); }
      return;
    }
    event.preventDefault();
    englishRefs.current.get(block.languageBlocks[index].id)?.focus();
  }

  function handleEnglishKey(event: KeyboardEvent<HTMLTextAreaElement>, index: number) {
    if (blockNewline(event)) return;
    if (handlePieceActionKey(event, block.languageBlocks[index])) return;
    if (event.key !== "Tab" || event.nativeEvent.isComposing) return;
    if (event.shiftKey) {
      event.preventDefault();
      spanishRefs.current.get(block.languageBlocks[index].id)?.focus();
      return;
    }
    if (index < block.languageBlocks.length - 1) {
      event.preventDefault();
      spanishRefs.current.get(block.languageBlocks[index + 1].id)?.focus();
      return;
    }
    const piece = block.languageBlocks[index];
    const trailing = document.getElementById(`trailing-${block.id}`);
    if (trailing && piece.spanish.trim() && (piece.acceptedAnswers[0] ?? "").trim()) {
      event.preventDefault();
      trailing.focus();
    }
  }

  // Persist the trailing draft as a real piece exactly once, on an explicit
  // move (Tab) or on blur — never on every keystroke, so rapid typing and IME
  // composition are safe. Returns the new piece id.
  function commitTrailingDraft(): string | null {
    const value = draftSpanish.trim();
    if (!value || committingRef.current) return null;
    committingRef.current = true;
    const id = onAddPiece();
    onUpdateSpanish(id, value);
    setDraftSpanish("");
    window.setTimeout(() => { committingRef.current = false; }, 0);
    return id;
  }

  function handleTrailingKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (blockNewline(event)) return;
    if (event.key !== "Tab" || event.nativeEvent.isComposing) return;
    if (event.shiftKey) {
      const previous = block.languageBlocks.at(-1);
      if (previous) { event.preventDefault(); englishRefs.current.get(previous.id)?.focus(); }
      return;
    }
    if (!draftSpanish.trim()) return; // empty trailing → ordinary Tab leaves the sentence
    event.preventDefault();
    const id = commitTrailingDraft();
    if (id) requestAnimationFrame(() => englishRefs.current.get(id)?.focus());
  }

  return (
    <section className={`lesson-document-sentence ${isTable ? "table" : ""}`} aria-label={isTable ? "Vocabulary table" : "Sentence"}>
      {isEmpty && <p className="lesson-document-sentence-guide">{isTable ? "Type a Spanish word, press Tab, type its English meaning. Tab again starts the next row." : "Type the Spanish, press Tab, type the English answer, press Tab to add another blank."}</p>}
      {showPrompt && <textarea autoFocus={!block.promptText} className="lesson-document-prompt" value={block.promptText} rows={1} placeholder={isTable ? "Instruction above the word list…" : "Instruction above the exercise…"} onChange={(event) => onUpdateSentence("promptText", event.target.value)} />}
      <div className="lesson-document-pieces">
        {block.languageBlocks.map((piece, index) => (
          <div key={piece.id} className={`lesson-document-piece ${activePiece === piece.id ? "active" : ""}`} onFocus={() => setActivePiece(piece.id)}>
            <textarea rows={1} data-field="spanish" ref={(element) => { if (element) spanishRefs.current.set(piece.id, element); else spanishRefs.current.delete(piece.id); }} value={piece.spanish} onChange={(event) => onUpdateSpanish(piece.id, event.target.value)} onKeyDown={(event) => handleSpanishKey(event, index)} placeholder="español" lang="es" aria-label={`${isTable ? "Row" : "Sentence piece"} ${index + 1} Spanish`} />
            <textarea rows={1} data-field="english" ref={(element) => { if (element) englishRefs.current.set(piece.id, element); else englishRefs.current.delete(piece.id); }} value={piece.acceptedAnswers[0] ?? ""} onChange={(event) => onUpdateAnswer(piece.id, 0, event.target.value)} onKeyDown={(event) => handleEnglishKey(event, index)} placeholder="English" lang="en" aria-label={`${isTable ? "Row" : "Sentence piece"} ${index + 1} English`} />
            {piece.callout !== null && <label className="lesson-document-annotation"><span>Hint shown to student</span><input autoFocus={focusCalloutId === piece.id} value={piece.callout} onBlur={() => setFocusCalloutId(null)} onChange={(event) => onUpdateCallout(piece.id, event.target.value)} placeholder="A small clue the student sees…" /></label>}
            {activePiece === piece.id && <div className="lesson-document-piece-actions">
              {piece.callout === null && <button type="button" onClick={() => addHint(piece)}>+ hint</button>}
              <button type="button" onClick={() => addAlternative(piece)}>+ another accepted answer</button>
              <button type="button" className="danger" onClick={() => onDeletePiece(piece.id)}>delete</button>
            </div>}
            {piece.acceptedAnswers.slice(1).map((answer, offset) => {
              const answerIndex = offset + 1;
              return <label key={answerIndex} className="lesson-document-annotation alternative"><span>Also accept</span><input autoFocus={focusAlternativePieceId === piece.id && answerIndex === piece.acceptedAnswers.length - 1} value={answer} onBlur={() => setFocusAlternativePieceId(null)} onChange={(event) => onUpdateAnswer(piece.id, answerIndex, event.target.value)} /><button type="button" aria-label="Remove alternative" onClick={() => onRemoveAnswer(piece.id, answerIndex)}>×</button></label>;
            })}
          </div>
        ))}
        {showTrailingPiece && <div className="lesson-document-piece trailing"><textarea rows={1} data-field="spanish" id={`trailing-${block.id}`} value={draftSpanish} onChange={(event) => setDraftSpanish(event.target.value)} onKeyDown={handleTrailingKey} onBlur={() => commitTrailingDraft()} placeholder={isTable ? "Add a row…" : "Add another blank…"} lang="es" aria-label={isTable ? "New row, Spanish" : "New sentence piece, Spanish"} /><span aria-hidden="true">Tab to add the English</span></div>}
      </div>
      {(showHelper || block.answerFeedback !== null) && <div className="lesson-document-slide-notes">
        {showHelper && <label className="lesson-document-annotation"><span>Help on request</span><textarea autoFocus={!block.helperText} value={block.helperText} onChange={(event) => onUpdateSentence("helperText", event.target.value)} placeholder="Shown when the student asks for help…" /></label>}
        {block.answerFeedback !== null && <label className="lesson-document-annotation"><span>After correct answer</span><textarea autoFocus={focusNewSuccess} value={block.answerFeedback} onBlur={() => setFocusNewSuccess(false)} onChange={(event) => onUpdateSentence("answerFeedback", event.target.value)} placeholder="A short message after they get it right…" /></label>}
      </div>}
      <div className="lesson-document-add-note">
        {!showPrompt && <button type="button" onClick={() => setShowPrompt(true)}>+ instruction</button>}
        {!showHelper && <button type="button" onClick={() => setShowHelper(true)}>+ help on request</button>}
        {block.answerFeedback === null && <button type="button" onClick={() => { setFocusNewSuccess(true); onUpdateSentence("answerFeedback", ""); }}>+ after-correct message</button>}
      </div>
    </section>
  );
}

export function LessonDragHandle({ lessonNumber, onDragStart, onDragEnd }: { lessonNumber: number; onDragStart: (event: DragEvent<HTMLButtonElement>) => void; onDragEnd: () => void }) {
  return (
    <button type="button" draggable onDragStart={onDragStart} onDragEnd={onDragEnd} className="lesson-document-drag lesson-library-number" aria-label={`Drag lesson ${lessonNumber} to reorder`} title="Drag to reorder lesson">
      <GripVertical size={16} aria-hidden="true" />
    </button>
  );
}
