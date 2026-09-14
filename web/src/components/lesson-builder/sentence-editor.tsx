"use client";

import { Lightbulb, Trash2 } from "lucide-react";
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
  const [editingHintId, setEditingHintId] = useState<string | null>(null);
  const [draftSpanish, setDraftSpanish] = useState("");
  const spanishRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const englishRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const hintRefs = useRef(new Map<string, HTMLInputElement>());
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
  // A hint renders as a resting pill (plain authored text, no edit chrome)
  // until clicked or activated by keyboard, then swaps to an editable input
  // — "disclosure", not an always-open text field. Newly added hints start
  // straight in the editing state since there's nothing to show yet.
  function addHint(piece: Piece) {
    if (piece.callout !== null) return;
    setEditingHintId(piece.id);
    onUpdateCallout(piece.id, "");
  }
  // Removing a hint or alternative answer used to leave focus on whatever
  // button just unmounted — the browser falls back to <body>, silently
  // dropping keyboard users out of the piece they were editing. Return focus
  // to that piece's Spanish field instead, since it's always present.
  function removeHint(piece: Piece) {
    onUpdateCallout(piece.id, null);
    setEditingHintId(null);
    requestAnimationFrame(() => spanishRefs.current.get(piece.id)?.focus());
  }
  // The hint toggle button stays on the pair card (so it's reachable right
  // where the pair is), but the pill itself renders in an annotation region
  // right under that same pair (see renderHint below) — a sibling of the
  // card, not a child of it, so a long hint can't widen or reshape the
  // card's own shrink-wrap sizing. Toggling an existing hint opens it for
  // editing instead of creating a duplicate.
  function toggleHint(piece: Piece) {
    if (piece.callout === null) {
      addHint(piece);
      return;
    }
    setEditingHintId(piece.id);
    requestAnimationFrame(() => hintRefs.current.get(piece.id)?.focus());
  }
  // Alternate accepted answers now live as extra lines in the same English
  // field (Shift+Enter, or this shortcut, adds one) instead of separate
  // "+ another accepted answer" rows — see handleEnglishAnswerChange, which
  // reconciles the field's lines back into the acceptedAnswers array.
  function addAnswerLine(piece: Piece) {
    onAddAnswer(piece.id);
    requestAnimationFrame(() => {
      const field = englishRefs.current.get(piece.id);
      if (!field) return;
      field.focus();
      field.setSelectionRange(field.value.length, field.value.length);
    });
  }
  function handleEnglishAnswerChange(piece: Piece, rawValue: string) {
    const lines = rawValue.split("\n");
    const current = piece.acceptedAnswers.length;
    for (let i = current; i < lines.length; i += 1) onAddAnswer(piece.id);
    for (let i = current - 1; i >= lines.length; i -= 1)
      onRemoveAnswer(piece.id, i);
    lines.forEach((line, index) => onUpdateAnswer(piece.id, index, line));
  }
  // A semicolon is a second, inline way to add an accepted answer, without
  // reaching for Shift+Enter — "I want to buy; I wanna buy" becomes two
  // accepted answers. Runs on blur (an explicit "I'm done with this field"
  // moment), never on every keystroke, so ";" can still be typed mid-word
  // without the field jumping around underneath the teacher. A literal
  // semicolon that must survive as one answer is written "\;" — documented
  // in the field's own aria-label below.
  function splitSemicolonSegments(line: string): string[] {
    return line
      .split(/(?<!\\);/)
      .map((part) => part.replace(/\\;/g, ";").trim())
      .filter((part) => part.length > 0);
  }
  function commitSemicolonAlternatives(piece: Piece) {
    const expanded = piece.acceptedAnswers.flatMap((line) =>
      splitSemicolonSegments(line),
    );
    const next = expanded.length > 0 ? expanded : [""];
    const current = piece.acceptedAnswers;
    if (
      next.length === current.length &&
      next.every((value, index) => value === current[index])
    )
      return;
    for (let i = current.length; i < next.length; i += 1) onAddAnswer(piece.id);
    for (let i = current.length - 1; i >= next.length; i -= 1)
      onRemoveAnswer(piece.id, i);
    next.forEach((value, index) => onUpdateAnswer(piece.id, index, value));
  }

  // Ctrl+Alt+H hint · Ctrl+Alt+A alternative · Ctrl+Alt+Backspace delete —
  // from either field of a piece. Ctrl+Alt, not Alt alone: plain Alt+letter
  // is commonly grabbed by Linux window managers before the page ever sees
  // the keydown, and Ctrl+letter alone collides with the browser — Ctrl+Alt
  // is free of both in practice. event.code, not event.key, so Mac
  // Ctrl+Option+letter (´å∂…) still resolves.
  function handlePieceActionKey(
    event: KeyboardEvent<HTMLTextAreaElement>,
    piece: Piece,
  ) {
    if (
      !event.altKey ||
      !event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    )
      return false;
    if (event.code === "KeyH") {
      event.preventDefault();
      toggleHint(piece);
      return true;
    }
    if (event.code === "KeyA") {
      event.preventDefault();
      addAnswerLine(piece);
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
    // Shift+Enter is the one place a real newline is allowed: it starts a
    // new accepted-answer line in this same field instead of opening a
    // separate "+ another accepted answer" row.
    if (
      event.key === "Enter" &&
      event.shiftKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.nativeEvent.isComposing
    )
      return;
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

  function addPair() {
    if (!lastPieceComplete) return;
    const id = onAddPiece();
    focusCommittedPiece.current = id;
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

  // Renders as a resting pill (plain authored text, truncated rather than
  // stretching this pair's own footprint) until clicked or activated by
  // keyboard, then swaps to an editable input — the click/focus itself is
  // the "disclosure" of the full text, since an input can be scrolled/
  // selected into even where the pill's resting width can't grow.
  function renderHint(piece: Piece, index: number) {
    if (piece.callout === null) return null;
    const pieceLabel =
      piece.spanish.trim() || `${isTable ? "row" : "pair"} ${index + 1}`;
    const editing = editingHintId === piece.id || piece.callout === "";
    return editing ? (
      <div id={`hint-${piece.id}`} className="lesson-document-hint-pill editing">
        <input
          ref={(element) => {
            if (element) hintRefs.current.set(piece.id, element);
            else hintRefs.current.delete(piece.id);
          }}
          autoFocus
          value={piece.callout}
          onBlur={(event) => {
            setEditingHintId(null);
            if (!event.currentTarget.value.trim())
              onUpdateCallout(piece.id, null);
          }}
          onChange={(event) => onUpdateCallout(piece.id, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "Escape") {
              event.stopPropagation();
              event.currentTarget.blur();
            }
          }}
          placeholder="A small clue the student sees…"
          aria-label={`Editing hint for ${pieceLabel}`}
        />
        <button
          type="button"
          aria-label="Remove hint"
          // Without this, the mousedown here blurs the input first — the
          // blur handler above then exits editing mode and swaps this
          // whole button out for the resting pill before the click can
          // land on it, so "Remove hint" silently did nothing.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => removeHint(piece)}
        >
          ×
        </button>
      </div>
    ) : (
      <button
        type="button"
        id={`hint-${piece.id}`}
        className="lesson-document-hint-pill"
        onClick={() => setEditingHintId(piece.id)}
        aria-label={`Hint for ${pieceLabel}: ${piece.callout}. Activate to edit.`}
      >
        {piece.callout}
      </button>
    );
  }

  return (
    <section
      className={`lesson-document-sentence ${isTable ? "vocab-table" : ""}`}
      aria-label={isTable ? "Vocabulary table" : "Sentence"}
    >
      {isEmpty && (
        <p className="lesson-document-sentence-guide">
          {isTable
            ? "Type a Spanish word, press Tab, type its English meaning. Tab again starts the next row."
            : "Type the Spanish, press Tab, type the English answer, press Tab to add another blank."}
        </p>
      )}
      {(active || block.promptText.trim()) && (
        <textarea
          className="lesson-document-prompt"
          value={block.promptText}
          rows={1}
          placeholder="Add an instruction…"
          aria-label="Optional learner instruction"
          onChange={(event) => onUpdateSentence("promptText", event.target.value)}
        />
      )}
      {(block.languageBlocks.length > 0 || showTrailingPiece) && (
        <div className={`lesson-document-sentence-body ${isTable ? "vocab-table" : ""}`}>
          {/* Real table headings always stay (they're structural). For a
              sentence, the fields' own top/bottom order inside each card is
              already the non-color, always-present cue — this key is just
              optional guidance shown while actively editing, not repeated
              chrome on every resting slide. */}
          {(isTable || active) && (
            <div
              className={`lesson-document-language-key ${isTable ? "vocab-table" : ""}`}
              aria-hidden="true"
            >
              <span data-language="es">Spanish</span>
              <span data-language="en">English</span>
            </div>
          )}
          <div className="lesson-document-pieces">
            {block.languageBlocks.map((piece, index) => (
              <div key={piece.id} className="lesson-document-pair">
                <div
                  className={`lesson-document-piece ${activePiece === piece.id ? "active" : ""}`}
                  onFocus={() => setActivePiece(piece.id)}
                >
                  <div className="lesson-document-language-field" data-language="es">
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
                      placeholder="Type in Spanish"
                      lang="es"
                      aria-label={`${isTable ? "Row" : "Sentence piece"} ${index + 1} Spanish`}
                    />
                  </div>
                  <div className="lesson-document-language-field" data-language="en">
                    <textarea
                      rows={1}
                      data-field="english"
                      ref={(element) => {
                        if (element) englishRefs.current.set(piece.id, element);
                        else englishRefs.current.delete(piece.id);
                      }}
                      value={piece.acceptedAnswers.join("\n")}
                      onChange={(event) =>
                        handleEnglishAnswerChange(piece, event.target.value)
                      }
                      onKeyDown={(event) => handleEnglishKey(event, index)}
                      onBlur={() => commitSemicolonAlternatives(piece)}
                      placeholder="Write in English"
                      lang="en"
                      aria-label={`${isTable ? "Row" : "Sentence piece"} ${index + 1} English${piece.acceptedAnswers.length > 1 ? `, ${piece.acceptedAnswers.length} accepted answers` : ""}. Separate accepted answers with a semicolon, or use a backslash before one to type it literally.`}
                    />
                  </div>
                  {(activePiece === piece.id || piece.callout !== null) && (
                    <div className="lesson-document-piece-actions">
                      <button
                        type="button"
                        className={piece.callout !== null ? "has-hint" : ""}
                        aria-expanded={piece.callout !== null}
                        aria-controls={`hint-${piece.id}`}
                        aria-label={piece.callout === null ? "Add a hint" : "Edit hint"}
                        title={piece.callout === null ? "Add a hint (Ctrl Alt H)" : "Edit hint"}
                        onClick={() => toggleHint(piece)}
                      >
                        <Lightbulb size={13} aria-hidden="true" />
                      </button>
                      {activePiece === piece.id && (
                        <button
                          type="button"
                          className="lesson-document-piece-delete"
                          aria-label={isTable ? "Delete row" : "Delete pair"}
                          title="Delete (Ctrl Alt Backspace)"
                          onClick={() => onDeletePiece(piece.id)}
                        >
                          <Trash2 size={12} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {renderHint(piece, index)}
              </div>
            ))}
            {showTrailingPiece && (
              <div className="lesson-document-piece trailing">
                <div className="lesson-document-language-field" data-language="es">
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
                    placeholder={
                      isTable ? "Type a word" : "Type the next part"
                    }
                    lang="es"
                    aria-label={
                      isTable ? "New row, Spanish" : "New sentence piece, Spanish"
                    }
                  />
                </div>
                <span aria-hidden="true">Tab to add the English</span>
              </div>
            )}
            {!isTable && active && (
              <button
                type="button"
                className="lesson-document-add-pair"
                disabled={!lastPieceComplete}
                title={
                  lastPieceComplete
                    ? "Add another Spanish and English pair"
                    : "Finish the current Spanish and English pair first"
                }
                onClick={addPair}
              >
                + Add pair
              </button>
            )}
          </div>
        </div>
      )}
      {isTable && (
        <button
          type="button"
          className="lesson-document-add-row"
          disabled={!lastPieceComplete}
          title={
            lastPieceComplete
              ? "Add another vocabulary row"
              : "Finish the current row first"
          }
          onClick={addPair}
        >
          + Add row
        </button>
      )}
    </section>
  );
}
