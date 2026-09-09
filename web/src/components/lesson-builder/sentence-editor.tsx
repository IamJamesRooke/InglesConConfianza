"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import type { SentenceBlock } from "@/lib/lesson-builder/types";

type Props = {
  block: SentenceBlock;
  active: boolean;
  onUpdateSentence: (
    field: "promptText" | "helperText" | "answerFeedback",
    value: string | null,
  ) => void;
  onUpdateSpanish: (pieceId: string, value: string) => void;
  onUpdateAnswer: (pieceId: string, answerIndex: number, value: string) => void;
  onUpdateCallout: (pieceId: string, value: string | null) => void;
  onAddAnswer: (pieceId: string) => void;
  onRemoveAnswer: (pieceId: string, answerIndex: number) => void;
  onAddPiece: () => string;
  onDeletePiece: (pieceId: string) => void;
};

export function SentenceEditor({
  block,
  active,
  onUpdateSentence,
  onUpdateSpanish,
  onUpdateAnswer,
  onUpdateCallout,
  onAddAnswer,
  onRemoveAnswer,
  onAddPiece,
  onDeletePiece,
}: Props) {
  const [activePiece, setActivePiece] = useState<string | null>(null);
  const [showHelper, setShowHelper] = useState(Boolean(block.helperText));
  const [showPrompt, setShowPrompt] = useState(Boolean(block.promptText));
  const [focusNewSuccess, setFocusNewSuccess] = useState(false);
  const [focusCalloutId, setFocusCalloutId] = useState<string | null>(null);
  const [focusAlternativePieceId, setFocusAlternativePieceId] = useState<
    string | null
  >(null);
  const [draftSpanish, setDraftSpanish] = useState("");
  const spanishRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const englishRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const committingRef = useRef(false);
  const composingTrailingRef = useRef(false);
  const focusCommittedPiece = useRef<string | null>(null);
  const isTable = block.layout === "vocabulary_table";
  const isEmpty = block.languageBlocks.every(
    (piece) =>
      !piece.spanish.trim() && !(piece.acceptedAnswers[0] ?? "").trim(),
  );
  const lastPiece = block.languageBlocks.at(-1);
  const lastPieceComplete =
    !lastPiece ||
    (Boolean(lastPiece.spanish.trim()) &&
      Boolean(lastPiece.acceptedAnswers[0]?.trim()));
  const showTrailingPiece =
    lastPieceComplete && (active || block.languageBlocks.length === 0);

  useEffect(() => {
    const id = focusCommittedPiece.current;
    if (!id) return;
    const field = spanishRefs.current.get(id);
    if (!field) return;
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
    focusCommittedPiece.current = null;
  }, [block.languageBlocks]);

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
  function handlePieceActionKey(
    event: KeyboardEvent<HTMLTextAreaElement>,
    piece: Piece,
  ) {
    if (
      !event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    )
      return false;
    if (event.code === "KeyH") {
      event.preventDefault();
      addHint(piece);
      return true;
    }
    if (event.code === "KeyA") {
      event.preventDefault();
      addAlternative(piece);
      return true;
    }
    if (event.code === "Backspace") {
      event.preventDefault();
      onDeletePiece(piece.id);
      return true;
    }
    return false;
  }

  // Plain Enter never splits a sentence piece / table row. Ctrl/⌘+Enter is left
  // alone so it can bubble to the "next slide" handler.
  function blockNewline(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.nativeEvent.isComposing &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      return true;
    }
    return false;
  }

  function handleSpanishKey(
    event: KeyboardEvent<HTMLTextAreaElement>,
    index: number,
  ) {
    if (blockNewline(event)) return;
    if (handlePieceActionKey(event, block.languageBlocks[index])) return;
    if (event.key !== "Tab" || event.nativeEvent.isComposing) return;
    if (event.shiftKey) {
      if (index > 0) {
        event.preventDefault();
        englishRefs.current.get(block.languageBlocks[index - 1].id)?.focus();
      }
      return;
    }
    event.preventDefault();
    englishRefs.current.get(block.languageBlocks[index].id)?.focus();
  }

  function handleEnglishKey(
    event: KeyboardEvent<HTMLTextAreaElement>,
    index: number,
  ) {
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
    if (
      trailing &&
      piece.spanish.trim() &&
      (piece.acceptedAnswers[0] ?? "").trim()
    ) {
      event.preventDefault();
      trailing.focus();
    }
  }

  // Persist the trailing draft as a real piece on its first real input. IME
  // text waits for compositionend, and the guard prevents duplicate pieces.
  function commitTrailingDraft(rawValue = draftSpanish): string | null {
    const value = rawValue.trim();
    if (!value || committingRef.current) return null;
    committingRef.current = true;
    const id = onAddPiece();
    onUpdateSpanish(id, value);
    setDraftSpanish("");
    focusCommittedPiece.current = id;
    window.setTimeout(() => {
      committingRef.current = false;
    }, 0);
    return id;
  }

  function handleTrailingKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (blockNewline(event)) return;
    if (event.key !== "Tab" || event.nativeEvent.isComposing) return;
    if (event.shiftKey) {
      const previous = block.languageBlocks.at(-1);
      if (previous) {
        event.preventDefault();
        englishRefs.current.get(previous.id)?.focus();
      }
      return;
    }
    if (!draftSpanish.trim()) return; // empty trailing → ordinary Tab leaves the sentence
    event.preventDefault();
    const id = commitTrailingDraft();
    if (id) requestAnimationFrame(() => englishRefs.current.get(id)?.focus());
  }

  return (
    <section
      className={`lesson-document-sentence ${isTable ? "table" : ""}`}
      aria-label={isTable ? "Vocabulary table" : "Sentence"}
    >
      {isEmpty && (
        <p className="lesson-document-sentence-guide">
          {isTable
            ? "Type a Spanish word, press Tab, type its English meaning. Tab again starts the next row."
            : "Type the Spanish, press Tab, type the English answer, press Tab to add another blank."}
        </p>
      )}
      {showPrompt && (
        <textarea
          autoFocus={!block.promptText}
          className="lesson-document-prompt"
          value={block.promptText}
          rows={1}
          placeholder={
            isTable
              ? "Instruction above the word list…"
              : "Instruction above the exercise…"
          }
          onChange={(event) =>
            onUpdateSentence("promptText", event.target.value)
          }
          onBlur={(event) => {
            if (!event.currentTarget.value.trim()) {
              onUpdateSentence("promptText", null);
              setShowPrompt(false);
            }
          }}
        />
      )}
      <div className="lesson-document-pieces">
        {block.languageBlocks.map((piece, index) => (
          <div
            key={piece.id}
            className={`lesson-document-piece ${activePiece === piece.id ? "active" : ""}`}
            onFocus={() => setActivePiece(piece.id)}
          >
            <textarea
              rows={1}
              data-field="spanish"
              ref={(element) => {
                if (element) spanishRefs.current.set(piece.id, element);
                else spanishRefs.current.delete(piece.id);
              }}
              value={piece.spanish}
              onChange={(event) =>
                onUpdateSpanish(piece.id, event.target.value)
              }
              onKeyDown={(event) => handleSpanishKey(event, index)}
              placeholder="español"
              lang="es"
              aria-label={`${isTable ? "Row" : "Sentence piece"} ${index + 1} Spanish`}
            />
            <textarea
              rows={1}
              data-field="english"
              ref={(element) => {
                if (element) englishRefs.current.set(piece.id, element);
                else englishRefs.current.delete(piece.id);
              }}
              value={piece.acceptedAnswers[0] ?? ""}
              onChange={(event) =>
                onUpdateAnswer(piece.id, 0, event.target.value)
              }
              onKeyDown={(event) => handleEnglishKey(event, index)}
              placeholder="English"
              lang="en"
              aria-label={`${isTable ? "Row" : "Sentence piece"} ${index + 1} English`}
            />
            {piece.callout !== null && (
              <label className="lesson-document-annotation">
                <span>Hint shown to student</span>
                <input
                  autoFocus={focusCalloutId === piece.id}
                  value={piece.callout}
                  onBlur={(event) => {
                    setFocusCalloutId(null);
                    if (!event.currentTarget.value.trim())
                      onUpdateCallout(piece.id, null);
                  }}
                  onChange={(event) =>
                    onUpdateCallout(piece.id, event.target.value)
                  }
                  placeholder="A small clue the student sees…"
                />
              </label>
            )}
            {activePiece === piece.id && (
              <div className="lesson-document-piece-actions">
                {piece.callout === null && (
                  <button type="button" onClick={() => addHint(piece)}>
                    + hint
                  </button>
                )}
                <button type="button" onClick={() => addAlternative(piece)}>
                  + another accepted answer
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => onDeletePiece(piece.id)}
                >
                  delete
                </button>
              </div>
            )}
            {piece.acceptedAnswers.slice(1).map((answer, offset) => {
              const answerIndex = offset + 1;
              return (
                <label
                  key={answerIndex}
                  className="lesson-document-annotation alternative"
                >
                  <span>Also accept</span>
                  <input
                    autoFocus={
                      focusAlternativePieceId === piece.id &&
                      answerIndex === piece.acceptedAnswers.length - 1
                    }
                    value={answer}
                    onBlur={(event) => {
                      setFocusAlternativePieceId(null);
                      if (!event.currentTarget.value.trim())
                        onRemoveAnswer(piece.id, answerIndex);
                    }}
                    onChange={(event) =>
                      onUpdateAnswer(piece.id, answerIndex, event.target.value)
                    }
                  />
                  <button
                    type="button"
                    aria-label="Remove alternative"
                    onClick={() => onRemoveAnswer(piece.id, answerIndex)}
                  >
                    ×
                  </button>
                </label>
              );
            })}
          </div>
        ))}
        {showTrailingPiece && (
          <div className="lesson-document-piece trailing">
            <textarea
              rows={1}
              data-field="spanish"
              id={`trailing-${block.id}`}
              value={draftSpanish}
              onChange={(event) => {
                const value = event.target.value;
                setDraftSpanish(value);
                if (!composingTrailingRef.current && value.trim())
                  commitTrailingDraft(value);
              }}
              onCompositionStart={() => {
                composingTrailingRef.current = true;
              }}
              onCompositionEnd={(event) => {
                composingTrailingRef.current = false;
                if (event.currentTarget.value.trim())
                  commitTrailingDraft(event.currentTarget.value);
              }}
              onKeyDown={handleTrailingKey}
              placeholder={isTable ? "Add a row…" : "Add another blank…"}
              lang="es"
              aria-label={
                isTable ? "New row, Spanish" : "New sentence piece, Spanish"
              }
            />
            <span aria-hidden="true">Tab to add the English</span>
          </div>
        )}
      </div>
      {(showHelper || block.answerFeedback !== null) && (
        <div className="lesson-document-slide-notes">
          {showHelper && (
            <label className="lesson-document-annotation">
              <span>Help on request</span>
              <textarea
                autoFocus={!block.helperText}
                value={block.helperText}
                onChange={(event) =>
                  onUpdateSentence("helperText", event.target.value)
                }
                onBlur={(event) => {
                  if (!event.currentTarget.value.trim()) {
                    onUpdateSentence("helperText", null);
                    setShowHelper(false);
                  }
                }}
                placeholder="Shown when the student asks for help…"
              />
            </label>
          )}
          {block.answerFeedback !== null && (
            <label className="lesson-document-annotation">
              <span>After correct answer</span>
              <textarea
                autoFocus={focusNewSuccess}
                value={block.answerFeedback}
                onBlur={(event) => {
                  setFocusNewSuccess(false);
                  if (!event.currentTarget.value.trim())
                    onUpdateSentence("answerFeedback", null);
                }}
                onChange={(event) =>
                  onUpdateSentence("answerFeedback", event.target.value)
                }
                placeholder="A short message after they get it right…"
              />
            </label>
          )}
        </div>
      )}
      {(!showPrompt || !showHelper || block.answerFeedback === null) && (
        <details className="lesson-document-options">
          <summary>Options</summary>
          <div className="lesson-document-add-note">
            {!showPrompt && (
              <button type="button" onClick={() => setShowPrompt(true)}>
                + instruction
              </button>
            )}
            {!showHelper && (
              <button type="button" onClick={() => setShowHelper(true)}>
                + help on request
              </button>
            )}
            {block.answerFeedback === null && (
              <button
                type="button"
                onClick={() => {
                  setFocusNewSuccess(true);
                  onUpdateSentence("answerFeedback", "");
                }}
              >
                + after-correct message
              </button>
            )}
          </div>
        </details>
      )}
    </section>
  );
}
