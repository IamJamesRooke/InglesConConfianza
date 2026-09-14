"use client";

import { Lightbulb, ListPlus, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { SentencePresentation } from "@/components/lesson-builder/sentence-presentation";
import type { SentenceBlock } from "@/lib/lesson-builder/types";

type Piece = SentenceBlock["languageBlocks"][number];

type Props = {
  block: SentenceBlock;
  active: boolean;
  onActivate: () => void;
  onExit: () => void;
  onUpdateSentence: (field: "promptText" | "helperText" | "answerFeedback", value: string | null) => void;
  onUpdateSpanish: (pieceId: string, value: string) => void;
  onUpdateAnswer: (pieceId: string, answerIndex: number, value: string) => void;
  onUpdateCallout: (pieceId: string, value: string | null) => void;
  onAddAnswer: (pieceId: string) => void;
  onRemoveAnswer: (pieceId: string, answerIndex: number) => void;
  onAddPiece: () => string;
  onDeletePiece: (pieceId: string) => void;
};

export function SentenceEditor(props: Props) {
  const { block, active } = props;
  const [activePiece, setActivePiece] = useState<string | null>(null);
  const [editingHintId, setEditingHintId] = useState<string | null>(null);
  const [editingAlternativesId, setEditingAlternativesId] = useState<string | null>(null);
  const [showInstruction, setShowInstruction] = useState(false);
  const spanishRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const englishRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const hintInputRef = useRef<HTMLInputElement | null>(null);
  const instructionButtonRef = useRef<HTMLButtonElement | null>(null);
  const alternativeRefs = useRef(new Map<number, HTMLInputElement>());
  const focusCommittedPiece = useRef<string | null>(null);
  const isTable = block.layout === "vocabulary_table";
  const lastPiece = block.languageBlocks.at(-1);
  const lastPieceComplete = !lastPiece || (Boolean(lastPiece.spanish.trim()) && Boolean(lastPiece.acceptedAnswers[0]?.trim()));

  useEffect(() => {
    const id = focusCommittedPiece.current;
    if (!id) return;
    const field = spanishRefs.current.get(id);
    if (!field) return;
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
    focusCommittedPiece.current = null;
  }, [block.languageBlocks]);

  useEffect(() => {
    if (active) return;
    const reset = window.setTimeout(() => {
      setActivePiece(null);
      setEditingHintId(null);
      setEditingAlternativesId(null);
      setShowInstruction(false);
    }, 0);
    return () => window.clearTimeout(reset);
  }, [active]);

  function pieceLabel(piece: Piece, index = block.languageBlocks.indexOf(piece)) {
    return piece.spanish.trim() || `${isTable ? "row" : "pair"} ${index + 1}`;
  }

  function openHint(piece: Piece) {
    props.onActivate();
    setActivePiece(piece.id);
    setEditingAlternativesId(null);
    setEditingHintId(piece.id);
    if (piece.callout === null) props.onUpdateCallout(piece.id, "");
    requestAnimationFrame(() => hintInputRef.current?.focus());
  }

  function closeHint(piece: Piece) {
    if (!piece.callout?.trim()) props.onUpdateCallout(piece.id, null);
    setEditingHintId(null);
    requestAnimationFrame(() => spanishRefs.current.get(piece.id)?.focus());
  }

  function removeHint(piece: Piece) {
    props.onUpdateCallout(piece.id, null);
    setEditingHintId(null);
    requestAnimationFrame(() => spanishRefs.current.get(piece.id)?.focus());
  }

  function openAlternatives(piece: Piece) {
    setEditingHintId(null);
    setEditingAlternativesId(piece.id);
    if (piece.acceptedAnswers.length === 1) props.onAddAnswer(piece.id);
    requestAnimationFrame(() => alternativeRefs.current.get(1)?.focus());
  }

  function addAlternative(piece: Piece) {
    const index = piece.acceptedAnswers.length;
    props.onAddAnswer(piece.id);
    requestAnimationFrame(() => alternativeRefs.current.get(index)?.focus());
  }

  function removeAlternative(piece: Piece, answerIndex: number) {
    props.onRemoveAnswer(piece.id, answerIndex);
    requestAnimationFrame(() => englishRefs.current.get(piece.id)?.focus());
  }

  function splitSemicolonSegments(line: string): string[] {
    return line.split(/(?<!\\);/).map((part) => part.replace(/\\;/g, ";").trim()).filter(Boolean);
  }

  function commitSemicolonAlternatives(piece: Piece) {
    const first = piece.acceptedAnswers[0] ?? "";
    const split = splitSemicolonSegments(first);
    if (split.length <= 1) {
      const normalized = split[0] ?? first.replace(/\\;/g, ";");
      if (normalized !== first) props.onUpdateAnswer(piece.id, 0, normalized);
      return;
    }
    props.onUpdateAnswer(piece.id, 0, split[0]);
    split.slice(1).forEach((answer, offset) => {
      const index = offset + 1;
      if (index >= piece.acceptedAnswers.length) props.onAddAnswer(piece.id);
      props.onUpdateAnswer(piece.id, index, answer);
    });
    setEditingAlternativesId(piece.id);
  }

  function handlePieceActionKey(event: KeyboardEvent<HTMLTextAreaElement>, piece: Piece) {
    if (!event.altKey || !event.ctrlKey || event.metaKey || event.shiftKey || event.nativeEvent.isComposing) return false;
    if (event.code === "KeyH") { event.preventDefault(); openHint(piece); return true; }
    if (event.code === "KeyA") { event.preventDefault(); openAlternatives(piece); return true; }
    if (event.code === "Backspace") { event.preventDefault(); props.onDeletePiece(piece.id); return true; }
    return false;
  }

  function blockNewline(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      return true;
    }
    return false;
  }

  function handleSpanishKey(event: KeyboardEvent<HTMLTextAreaElement>, index: number) {
    if (event.key === "Escape" && !event.nativeEvent.isComposing) {
      event.preventDefault(); event.stopPropagation(); props.onExit(); return;
    }
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
    const piece = block.languageBlocks[index];
    if (event.key === "Escape" && !event.nativeEvent.isComposing) {
      event.preventDefault(); event.stopPropagation(); commitSemicolonAlternatives(piece); props.onExit(); return;
    }
    if (event.key === "Enter" && event.shiftKey && !event.ctrlKey && !event.metaKey && !event.nativeEvent.isComposing) {
      event.preventDefault(); openAlternatives(piece); return;
    }
    if (blockNewline(event)) return;
    if (handlePieceActionKey(event, piece)) return;
    if (event.key !== "Tab" || event.nativeEvent.isComposing) return;
    if (event.shiftKey) { event.preventDefault(); spanishRefs.current.get(piece.id)?.focus(); }
    else if (index < block.languageBlocks.length - 1) { event.preventDefault(); spanishRefs.current.get(block.languageBlocks[index + 1].id)?.focus(); }
  }

  function addPair() {
    if (!lastPieceComplete) return;
    const id = props.onAddPiece();
    focusCommittedPiece.current = id;
  }

  if (!active && !isTable) {
    return (
      <section className="lesson-document-sentence resting" aria-label="Sentence">
        <SentencePresentation block={block} />
      </section>
    );
  }

  const selectedPiece = block.languageBlocks.find((piece) => piece.id === activePiece) ?? null;
  const hintPiece = block.languageBlocks.find((piece) => piece.id === editingHintId) ?? null;
  const alternativesPiece = block.languageBlocks.find((piece) => piece.id === editingAlternativesId) ?? null;

  return (
    <section className={`lesson-document-sentence editing ${isTable ? "vocab-table" : ""}`} aria-label={isTable ? "Vocabulary table" : "Sentence"}>
      {active && <div className="lesson-document-active-tools" role="toolbar" aria-label="Active sentence tools">
        {!block.promptText.trim() && !showInstruction && <button ref={instructionButtonRef} type="button" onClick={() => setShowInstruction(true)}>Add instruction</button>}
        {selectedPiece && <>
          <button type="button" aria-label={`${selectedPiece.callout === null ? "Add" : "Edit"} hint for ${pieceLabel(selectedPiece)}`} title={selectedPiece.callout === null ? "Add hint" : "Edit hint"} onClick={() => openHint(selectedPiece)}><Lightbulb size={13} aria-hidden="true" /></button>
          <button type="button" aria-label={`Alternatives for ${pieceLabel(selectedPiece)}${selectedPiece.acceptedAnswers.length > 1 ? ` (${selectedPiece.acceptedAnswers.length - 1})` : ""}`} title="Alternatives" onClick={() => openAlternatives(selectedPiece)}><ListPlus size={13} aria-hidden="true" />{selectedPiece.acceptedAnswers.length > 1 && <span>{selectedPiece.acceptedAnswers.length - 1}</span>}</button>
          <button type="button" className="danger" aria-label={`Delete ${isTable ? "row" : "pair"} ${pieceLabel(selectedPiece)}`} title={`Delete ${isTable ? "row" : "pair"}`} onClick={() => props.onDeletePiece(selectedPiece.id)}><Trash2 size={13} aria-hidden="true" /></button>
        </>}
      </div>}

      {!active && block.promptText.trim() ? (
        <p className="lesson-sentence-presentation-instruction">{block.promptText}</p>
      ) : (block.promptText.trim() || showInstruction) && (
        <textarea
          autoFocus={showInstruction && !block.promptText}
          className="lesson-document-prompt"
          value={block.promptText}
          rows={1}
          placeholder="Add an instruction…"
          aria-label="Optional learner instruction"
          onChange={(event) => props.onUpdateSentence("promptText", event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !event.nativeEvent.isComposing) {
              event.preventDefault(); event.stopPropagation();
              if (!event.currentTarget.value.trim()) {
                setShowInstruction(false);
                requestAnimationFrame(() => instructionButtonRef.current?.focus());
              } else props.onExit();
            }
          }}
        />
      )}

      <div className={`lesson-document-sentence-body ${isTable ? "vocab-table" : ""}`}>
        {isTable && <div className="lesson-document-language-key vocab-table" aria-hidden="true"><span data-language="es">Spanish</span><span data-language="en">English</span></div>}
        <div className="lesson-document-pieces">
          {block.languageBlocks.map((piece, index) => (
            <div key={piece.id} className="lesson-document-pair">
              <div className={`lesson-document-piece ${activePiece === piece.id ? "active" : ""}`} onFocus={() => setActivePiece(piece.id)}>
                <div className="lesson-document-language-field" data-language="es">
                  <textarea rows={1} data-field="spanish" ref={(element) => { if (element) spanishRefs.current.set(piece.id, element); else spanishRefs.current.delete(piece.id); }} value={piece.spanish} onChange={(event) => props.onUpdateSpanish(piece.id, event.target.value)} onKeyDown={(event) => handleSpanishKey(event, index)} placeholder="Type in Spanish" lang="es" aria-label={`${isTable ? "Row" : "Sentence piece"} ${index + 1} Spanish`} />
                </div>
                <div className="lesson-document-language-field" data-language="en">
                  <textarea rows={1} data-field="english" ref={(element) => { if (element) englishRefs.current.set(piece.id, element); else englishRefs.current.delete(piece.id); }} value={piece.acceptedAnswers[0] ?? ""} onChange={(event) => props.onUpdateAnswer(piece.id, 0, event.target.value)} onKeyDown={(event) => handleEnglishKey(event, index)} onBlur={() => commitSemicolonAlternatives(piece)} placeholder="Write in English" lang="en" aria-label={`${isTable ? "Row" : "Sentence piece"} ${index + 1} English. Separate alternatives with a semicolon, or use a backslash before one to type it literally.`} />
                </div>
              </div>
            </div>
          ))}
          {active && <button type="button" className={isTable ? "lesson-document-add-row" : "lesson-document-add-pair"} disabled={!lastPieceComplete} onClick={addPair}><Plus size={12} aria-hidden="true" /> Add {isTable ? "row" : "pair"}</button>}
        </div>
      </div>

      {block.languageBlocks.some((piece) => piece.callout !== null) && !hintPiece && (
        <div className="lesson-document-hint-list" aria-label="Authored hints">
          {block.languageBlocks.filter((piece) => piece.callout !== null).map((piece) => (
            <button key={piece.id} type="button" className="lesson-document-hint-pill" onClick={() => openHint(piece)}><span>{pieceLabel(piece)}:</span> {piece.callout}</button>
          ))}
        </div>
      )}

      {active && hintPiece && (
        <div className="lesson-document-context-editor" aria-label={`Hint for ${pieceLabel(hintPiece)}`} onBlur={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          if (!hintPiece.callout?.trim()) props.onUpdateCallout(hintPiece.id, null);
          setEditingHintId(null);
        }}>
          <label htmlFor={`hint-${hintPiece.id}`}>Hint for “{pieceLabel(hintPiece)}”</label>
          <input id={`hint-${hintPiece.id}`} ref={hintInputRef} value={hintPiece.callout ?? ""} onChange={(event) => props.onUpdateCallout(hintPiece.id, event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeHint(hintPiece); } }} placeholder="A small clue the student sees…" />
          <button type="button" className="danger" onMouseDown={(event) => event.preventDefault()} onClick={() => removeHint(hintPiece)}>Remove hint</button>
        </div>
      )}

      {active && alternativesPiece && (
        <div className="lesson-document-context-editor" aria-label={`Alternatives for ${pieceLabel(alternativesPiece)}`} onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            for (let index = alternativesPiece.acceptedAnswers.length - 1; index >= 1; index -= 1)
              if (!alternativesPiece.acceptedAnswers[index]?.trim()) props.onRemoveAnswer(alternativesPiece.id, index);
            setEditingAlternativesId(null);
          }
        }}>
          <span>Alternatives for “{pieceLabel(alternativesPiece)}”</span>
          {alternativesPiece.acceptedAnswers.slice(1).map((answer, offset) => {
            const answerIndex = offset + 1;
            return <div className="lesson-document-alternative" key={answerIndex}>
              <input ref={(element) => { if (element) alternativeRefs.current.set(answerIndex, element); else alternativeRefs.current.delete(answerIndex); }} value={answer} aria-label={`Alternative ${answerIndex} for ${pieceLabel(alternativesPiece)}`} onChange={(event) => props.onUpdateAnswer(alternativesPiece.id, answerIndex, event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setEditingAlternativesId(null); requestAnimationFrame(() => englishRefs.current.get(alternativesPiece.id)?.focus()); } }} />
              <button type="button" aria-label={`Remove alternative ${answerIndex}`} onClick={() => removeAlternative(alternativesPiece, answerIndex)}>×</button>
            </div>;
          })}
          <button type="button" onClick={() => addAlternative(alternativesPiece)}>Add alternative</button>
        </div>
      )}
    </section>
  );
}
