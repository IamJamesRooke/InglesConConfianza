"use client";

import { Copy, Plus, Trash2, Undo2 } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";

import { LessonConceptsField, type ConceptDisplayLookup } from "@/components/lesson-builder/lesson-concepts-field";
import { EditablePracticeMarkdown } from "@/components/practice/practice-markdown";
import type { Lesson, LessonConcept, SentenceBlock } from "@/lib/lesson-builder/types";

export type DocumentBlockType = "explanation" | "sentence" | "vocabulary";

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
  onUndoDeletion: () => void;
};

const BLOCK_TYPES: { type: DocumentBlockType; label: string; key: string }[] = [
  { type: "explanation", label: "Explanation", key: "E" },
  { type: "sentence", label: "Sentence", key: "S" },
  { type: "vocabulary", label: "Vocabulary table", key: "V" },
];

export function LessonDocument(props: Props) {
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [insertAt, setInsertAt] = useState<number | null>(() => props.lesson.blocks.length === 0 ? 0 : null);
  const [insertChoice, setInsertChoice] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [focusAfterAdd, setFocusAfterAdd] = useState<string | null>(null);

  useEffect(() => {
    if (!focusAfterAdd) return;
    const frame = requestAnimationFrame(() => {
      const block = document.querySelector<HTMLElement>(`[data-document-block="${focusAfterAdd}"]`);
      block?.querySelector<HTMLElement>("[contenteditable='true'], input, textarea")?.focus();
      setFocusAfterAdd(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusAfterAdd, props.lesson.blocks]);

  function recommendedChoice(index: number) {
    const previous = props.lesson.blocks[index - 1];
    return previous?.type === "explanation" ? 1 : 0;
  }

  function openInsert(index: number) {
    setInsertChoice(recommendedChoice(index));
    setInsertAt(index);
  }

  function add(type: DocumentBlockType, index: number) {
    setFocusAfterAdd(props.onAddBlock(type, index));
    setInsertAt(null);
  }

  return (
    <div className="lesson-document">
      <LessonConceptsField
        variant="compact"
        label="Covers"
        concepts={props.lesson.concepts}
        conceptDisplays={props.conceptDisplays}
        onAdd={props.onAddConcept}
        onRemove={props.onRemoveConcept}
        onRelabel={props.onRelabelConcept}
      />

      <div
        className="lesson-document-body"
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            const blockIndex = props.lesson.blocks.findIndex((block) => block.id === activeBlock);
            event.preventDefault();
            event.stopPropagation();
            openInsert(blockIndex >= 0 ? blockIndex + 1 : props.lesson.blocks.length);
          }
        }}
      >
        {props.lesson.blocks.map((block, index) => (
          <div
            key={block.id}
            className="lesson-document-block"
            data-document-block={block.id}
            tabIndex={-1}
            onFocusCapture={() => setActiveBlock(block.id)}
            onKeyDownCapture={(event) => {
              if (event.key === "Escape" && event.target !== event.currentTarget) {
                event.preventDefault();
                event.stopPropagation();
                event.currentTarget.focus();
              }
            }}
          >
            <InsertControl
              open={insertAt === index}
              selected={insertChoice}
              onSelected={setInsertChoice}
              onToggle={() => insertAt === index ? setInsertAt(null) : openInsert(index)}
              onAdd={(type) => add(type, index)}
              onClose={() => setInsertAt(null)}
            />

            {block.type === "explanation" ? (
              <section className="lesson-document-explanation" aria-label={`Explanation ${index + 1}`}>
                <EditablePracticeMarkdown
                  markdown={block.contentMarkdown}
                  placeholder="Type an explanation…"
                  ariaLabel={`Explanation ${index + 1}`}
                  fieldName={`explanation-${block.id}`}
                  showSelectionMenu={false}
                  onChange={(markdown) => props.onUpdateExplanation(block.id, markdown)}
                />
                {!block.contentMarkdown.trim() && <p className="lesson-document-explanation-guide">Type normally. Select Spanish words and press Ctrl/⌘ + Shift + 1; select English words and press Ctrl/⌘ + Shift + 2.</p>}
              </section>
            ) : (
              <SentenceDocument
                block={block}
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

            <div className="lesson-document-block-actions" aria-label={`Actions for item ${index + 1}`}>
              <button type="button" onClick={() => props.onDuplicateBlock(block.id)}><Copy size={12} /> Duplicate</button>
              <button type="button" disabled={index === 0} onClick={() => props.onMoveBlock(block.id, -1)}>Earlier</button>
              <button type="button" disabled={index === props.lesson.blocks.length - 1} onClick={() => props.onMoveBlock(block.id, 1)}>Later</button>
              {confirmDelete === block.id ? (
                <span className="lesson-inline-confirm">
                  Delete? <button type="button" className="danger" onClick={() => { props.onDeleteBlock(block.id); setConfirmDelete(null); }}>Yes</button>
                  <button type="button" onClick={() => setConfirmDelete(null)}>Cancel</button>
                </span>
              ) : (
                <button type="button" className="danger" onClick={() => setConfirmDelete(block.id)}><Trash2 size={12} /> Delete</button>
              )}
            </div>
          </div>
        ))}

        {props.lesson.blocks.length === 0 && (
          <div className="lesson-document-empty"><strong>What should learners see first?</strong><span>Most lessons begin with a short explanation.</span></div>
        )}
        <InsertControl
          open={insertAt === props.lesson.blocks.length}
          end
          selected={insertChoice}
          onSelected={setInsertChoice}
          onToggle={() => insertAt === props.lesson.blocks.length ? setInsertAt(null) : openInsert(props.lesson.blocks.length)}
          onAdd={(type) => add(type, props.lesson.blocks.length)}
          onClose={() => setInsertAt(null)}
        />
        {props.undoDeletionLabel && (
          <button type="button" className="lesson-document-undo" onClick={props.onUndoDeletion}>
            <Undo2 size={14} /> {props.undoDeletionLabel} — Undo
          </button>
        )}
      </div>
    </div>
  );
}

function InsertControl({ open, end = false, selected, onSelected, onToggle, onAdd, onClose }: {
  open: boolean;
  end?: boolean;
  selected: number;
  onSelected: (index: number) => void;
  onToggle: () => void;
  onAdd: (type: DocumentBlockType) => void;
  onClose: () => void;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => buttons.current[selected]?.focus());
  }, [open, selected]);

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
    <div className={`lesson-document-insert ${end ? "end" : ""}`}>
      <button type="button" onClick={onToggle} aria-expanded={open}>
        <Plus size={13} /> {end ? "Add to lesson" : <span className="sr-only">Insert here</span>}
      </button>
      {open && (
        <div className="lesson-document-insert-choices" role="toolbar" aria-label="Choose the next item" onKeyDown={handleKey}>
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
          <span>Arrows choose · Enter adds · Esc closes</span>
        </div>
      )}
    </div>
  );
}

function SentenceDocument({ block, onUpdateSentence, onUpdateSpanish, onUpdateAnswer, onUpdateCallout, onAddAnswer, onRemoveAnswer, onAddPiece, onDeletePiece }: {
  block: SentenceBlock;
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
  const spanishRefs = useRef(new Map<string, HTMLInputElement>());
  const englishRefs = useRef(new Map<string, HTMLInputElement>());
  const isTable = block.layout === "vocabulary_table";
  const isEmpty = block.languageBlocks.every((piece) => !piece.spanish.trim() && !(piece.acceptedAnswers[0] ?? "").trim());
  const lastPiece = block.languageBlocks.at(-1);
  const showTrailingPiece = !lastPiece || (Boolean(lastPiece.spanish.trim()) && Boolean(lastPiece.acceptedAnswers[0]?.trim()));

  function handleSpanishKey(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key !== "Tab") return;
    if (event.shiftKey) {
      if (index > 0) { event.preventDefault(); englishRefs.current.get(block.languageBlocks[index - 1].id)?.focus(); }
      return;
    }
    event.preventDefault();
    englishRefs.current.get(block.languageBlocks[index].id)?.focus();
  }

  function handleEnglishKey(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key !== "Tab") return;
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
    if (piece.spanish.trim() && (piece.acceptedAnswers[0] ?? "").trim()) {
      event.preventDefault();
      document.getElementById(`trailing-${block.id}`)?.focus();
    }
  }

  function commitTrailing(value: string) {
    if (!value) { setDraftSpanish(""); return; }
    const id = onAddPiece();
    onUpdateSpanish(id, value);
    setDraftSpanish("");
    requestAnimationFrame(() => spanishRefs.current.get(id)?.focus());
  }

  return (
    <section className={`lesson-document-sentence ${isTable ? "table" : ""}`} aria-label={isTable ? "Vocabulary table" : "Sentence practice"}>
      {isEmpty && <p className="lesson-document-sentence-guide">{isTable ? "Type Spanish, press Tab, then type English. Tab starts the next row." : "Type the Spanish prompt, press Tab, type the English answer, then press Tab to continue."}</p>}
      {showPrompt && <textarea autoFocus={!block.promptText} className="lesson-document-prompt" value={block.promptText} rows={1} placeholder={isTable ? "Optional table instruction…" : "Optional learner instruction…"} onChange={(event) => onUpdateSentence("promptText", event.target.value)} />}
      <div className="lesson-document-pieces">
        {block.languageBlocks.map((piece, index) => (
          <div key={piece.id} className={`lesson-document-piece ${activePiece === piece.id ? "active" : ""}`} onFocus={() => setActivePiece(piece.id)}>
            <input ref={(element) => { if (element) spanishRefs.current.set(piece.id, element); else spanishRefs.current.delete(piece.id); }} value={piece.spanish} onChange={(event) => onUpdateSpanish(piece.id, event.target.value)} onKeyDown={(event) => handleSpanishKey(event, index)} placeholder="español" lang="es" aria-label={`${isTable ? "Row" : "Sentence piece"} ${index + 1} Spanish`} />
            <input ref={(element) => { if (element) englishRefs.current.set(piece.id, element); else englishRefs.current.delete(piece.id); }} value={piece.acceptedAnswers[0] ?? ""} onChange={(event) => onUpdateAnswer(piece.id, 0, event.target.value)} onKeyDown={(event) => handleEnglishKey(event, index)} placeholder="English" lang="en" aria-label={`${isTable ? "Row" : "Sentence piece"} ${index + 1} English`} />
            {piece.callout !== null && <label className="lesson-document-annotation"><span>Context hint</span><input autoFocus={focusCalloutId === piece.id} value={piece.callout} onBlur={() => setFocusCalloutId(null)} onChange={(event) => onUpdateCallout(piece.id, event.target.value)} placeholder="A small clue the learner sees…" /></label>}
            {activePiece === piece.id && <div className="lesson-document-piece-actions">
              {piece.callout === null && <button type="button" onClick={() => { setFocusCalloutId(piece.id); onUpdateCallout(piece.id, ""); }}>+ hint</button>}
              <button type="button" onClick={() => { setFocusAlternativePieceId(piece.id); onAddAnswer(piece.id); }}>+ alternative</button>
              <button type="button" className="danger" onClick={() => onDeletePiece(piece.id)}>delete</button>
            </div>}
            {piece.acceptedAnswers.slice(1).map((answer, offset) => {
              const answerIndex = offset + 1;
              return <label key={answerIndex} className="lesson-document-annotation alternative"><span>Also accepted</span><input autoFocus={focusAlternativePieceId === piece.id && answerIndex === piece.acceptedAnswers.length - 1} value={answer} onBlur={() => setFocusAlternativePieceId(null)} onChange={(event) => onUpdateAnswer(piece.id, answerIndex, event.target.value)} /><button type="button" aria-label="Remove alternative" onClick={() => onRemoveAnswer(piece.id, answerIndex)}>×</button></label>;
            })}
          </div>
        ))}
        {showTrailingPiece && <div className="lesson-document-piece trailing"><input id={`trailing-${block.id}`} value={draftSpanish} onChange={(event) => { setDraftSpanish(event.target.value); commitTrailing(event.target.value); }} placeholder={isTable ? "Add Spanish row…" : "Continue in Spanish…"} lang="es" aria-label={isTable ? "Add vocabulary row in Spanish" : "Add sentence piece in Spanish"} /><span aria-hidden="true">{isTable ? "Tab to add English" : "Tab to add English"}</span></div>}
      </div>
      {(showHelper || block.answerFeedback !== null) && <div className="lesson-document-slide-notes">
        {showHelper && <label className="lesson-document-annotation"><span>Helper text</span><textarea autoFocus={!block.helperText} value={block.helperText} onChange={(event) => onUpdateSentence("helperText", event.target.value)} placeholder="Help available during practice…" /></label>}
        {block.answerFeedback !== null && <label className="lesson-document-annotation"><span>Success</span><textarea autoFocus={focusNewSuccess} value={block.answerFeedback} onBlur={() => setFocusNewSuccess(false)} onChange={(event) => onUpdateSentence("answerFeedback", event.target.value)} placeholder="A quiet congratulations…" /></label>}
      </div>}
      <div className="lesson-document-add-note">
        {!showPrompt && <button type="button" onClick={() => setShowPrompt(true)}>+ instruction</button>}
        {!showHelper && <button type="button" onClick={() => setShowHelper(true)}>+ helper</button>}
        {block.answerFeedback === null && <button type="button" onClick={() => { setFocusNewSuccess(true); onUpdateSentence("answerFeedback", ""); }}>+ success</button>}
      </div>
    </section>
  );
}

export function LessonDragHandle({ lessonNumber, onDragStart, onDragEnd }: { lessonNumber: number; onDragStart: (event: DragEvent<HTMLButtonElement>) => void; onDragEnd: () => void }) {
  return <button type="button" draggable onDragStart={onDragStart} onDragEnd={onDragEnd} className="lesson-document-drag lesson-library-number" aria-label={`Drag lesson ${lessonNumber} to reorder`} title="Drag lesson">{lessonNumber}</button>;
}
