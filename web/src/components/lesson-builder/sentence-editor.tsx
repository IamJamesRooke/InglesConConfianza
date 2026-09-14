"use client";

import { Lightbulb, Plus, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { SentencePresentation } from "@/components/lesson-builder/sentence-presentation";
import { planAcceptedAnswersCommit } from "@/lib/lesson-builder/answer-commit-plan";
import { formatAnswerEntry, parseAnswerEntry } from "@/lib/lesson-builder/answer-entry";
import { useLessonBuilder } from "@/lib/lesson-builder/builder-context";
import type { SentenceBlock } from "@/lib/lesson-builder/types";

type Piece = SentenceBlock["languageBlocks"][number];
type HintOrigin = { field: "spanish" | "english"; caret: number };

type Props = {
  lessonId: string;
  block: SentenceBlock;
  active: boolean;
  onActivate: () => void;
  onExit: () => void;
};

export function SentenceEditor(props: Props) {
  const { lessonId, block, active } = props;
  const actions = useLessonBuilder();
  const boundActions = {
    onUpdateSentence: (field: "promptText" | "helperText" | "answerFeedback", value: string | null) =>
      actions.updateSentence(lessonId, block.id, field, value),
    onUpdateSpanish: (pieceId: string, value: string) =>
      actions.updateSpanish(lessonId, block.id, pieceId, value),
    onUpdateAnswer: (pieceId: string, answerIndex: number, value: string) =>
      actions.updateAnswer(lessonId, block.id, pieceId, answerIndex, value),
    onUpdateCallout: (pieceId: string, value: string | null) =>
      actions.updateCallout(lessonId, block.id, pieceId, value),
    onAddAnswer: (pieceId: string) => actions.addAnswer(lessonId, block.id, pieceId),
    onRemoveAnswer: (pieceId: string, answerIndex: number) =>
      actions.removeAnswer(lessonId, block.id, pieceId, answerIndex),
    onAddPiece: () => actions.addPiece(lessonId, block.id),
    onDeletePiece: (pieceId: string) => actions.deletePiece(lessonId, block.id, pieceId),
  };
  const [activePiece, setActivePiece] = useState<string | null>(null);
  // The hint input is clutter when it appears on every pair unasked (§1g) —
  // it only renders once the teacher explicitly asks for one on this pair
  // (Alt+ArrowDown or the lightbulb button), or the pair already has a
  // stored hint.
  const [hintRequested, setHintRequested] = useState<string | null>(null);
  const [showInstruction, setShowInstruction] = useState(false);
  // English alternatives edit as one local draft string (slash-delimited);
  // stored answers are only reconciled on commit (blur/Enter/Tab/Escape), so
  // typing never parses mid-keystroke and never touches history/persistence.
  const [englishDraft, setEnglishDraft] = useState<Record<string, string>>({});
  const spanishRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const englishRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const hintInputRef = useRef<HTMLInputElement | null>(null);
  const hintOrigin = useRef<HintOrigin | null>(null);
  const instructionButtonRef = useRef<HTMLButtonElement | null>(null);
  const focusCommittedPiece = useRef<string | null>(null);
  const isTable = block.layout === "vocabulary_table";
  const lastPiece = block.languageBlocks.at(-1);
  // Read the live English draft first, not just committed props — typing an
  // answer and clicking "Add pair" with the mouse (no intervening blur/Tab)
  // must not leave the button looking permanently disabled just because the
  // draft hasn't committed yet.
  const lastPieceEnglish = lastPiece ? (englishDraft[lastPiece.id] ?? lastPiece.acceptedAnswers[0] ?? "") : "";
  const lastPieceComplete = !lastPiece || (Boolean(lastPiece.spanish.trim()) && Boolean(lastPieceEnglish.trim()));

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
      setShowInstruction(false);
      setEnglishDraft({});
      setHintRequested(null);
    }, 0);
    return () => window.clearTimeout(reset);
  }, [active]);

  function pieceLabel(piece: Piece, index = block.languageBlocks.indexOf(piece)) {
    return piece.spanish.trim() || `${isTable ? "row" : "pair"} ${index + 1}`;
  }

  // Reconciles the local draft into the stored accepted-answers array by
  // diffing against the current committed values, so an unedited field never
  // dispatches a single mutation (no history noise, no eager rewriting of
  // already-well-formed data). A fully cleared field maps back to a single
  // empty slot — the same "no answer yet" shape a freshly created pair uses.
  function commitEnglishDraft(piece: Piece, raw?: string) {
    const draft = raw ?? englishDraft[piece.id];
    if (draft === undefined) return;
    const parsed = parseAnswerEntry(draft);
    const next = parsed.length > 0 ? parsed : [""];
    for (const op of planAcceptedAnswersCommit(piece.acceptedAnswers, next)) {
      if (op.kind === "update") boundActions.onUpdateAnswer(piece.id, op.index, op.value);
      else if (op.kind === "append") { boundActions.onAddAnswer(piece.id); boundActions.onUpdateAnswer(piece.id, op.index, op.value); }
      else boundActions.onRemoveAnswer(piece.id, op.index);
    }
    setEnglishDraft((prev) => {
      if (!(piece.id in prev)) return prev;
      const copy = { ...prev };
      delete copy[piece.id];
      return copy;
    });
  }

  // Reads live state, not stale props: Spanish and the hint are already
  // bound directly to props (every keystroke commits), but English is
  // buffered locally, so the draft (falling back to the committed answers
  // only when there's no in-progress draft) is the only reliable source.
  function isPieceBlank(piece: Piece) {
    const english = englishDraft[piece.id] ?? formatAnswerEntry(piece.acceptedAnswers);
    return !piece.spanish.trim() && parseAnswerEntry(english).length === 0 && !piece.callout?.trim();
  }

  // Exiting the sentence editor (real Escape exit, not a nested tool like
  // the hint input) prunes any pair left entirely blank — e.g. one created
  // via "Add pair" and then abandoned — without touching partially filled
  // pairs or deleting the slide itself.
  function exitEditing() {
    for (const piece of block.languageBlocks) {
      if (isPieceBlank(piece)) boundActions.onDeletePiece(piece.id);
    }
    props.onExit();
  }

  function closeHint(piece: Piece) {
    if (!piece.callout?.trim()) {
      boundActions.onUpdateCallout(piece.id, null);
      setHintRequested((current) => (current === piece.id ? null : current));
    }
  }

  function focusHint(piece: Piece, origin: HintOrigin) {
    hintOrigin.current = origin;
    setHintRequested(piece.id);
    if (activePiece !== piece.id) setActivePiece(piece.id);
    requestAnimationFrame(() => hintInputRef.current?.focus());
  }

  // The lightbulb button has no text caret of its own to remember, so it
  // hands focusHint the currently-focused field in this pair (falling back
  // to the end of the Spanish field) as the place Escape should return to.
  function requestHint(piece: Piece) {
    const englishField = englishRefs.current.get(piece.id);
    const spanishField = spanishRefs.current.get(piece.id);
    const focused = document.activeElement;
    if (focused === englishField) {
      focusHint(piece, { field: "english", caret: englishField?.selectionStart ?? 0 });
    } else if (focused === spanishField) {
      focusHint(piece, { field: "spanish", caret: spanishField?.selectionStart ?? 0 });
    } else {
      focusHint(piece, { field: "spanish", caret: piece.spanish.length });
    }
  }

  function returnFromHint(piece: Piece) {
    const origin = hintOrigin.current;
    hintOrigin.current = null;
    const ref = origin?.field === "english" ? englishRefs.current.get(piece.id) : spanishRefs.current.get(piece.id);
    // Synchronous, unlike focusHint's rAF: the Spanish/English fields are
    // already mounted the whole time the hint pill is open (only the pill
    // itself is conditionally rendered), so the ref is valid immediately —
    // no need to wait a frame. Deferring this via rAF let a fast follow-up
    // keystroke (e.g. Tab right after Escape) race ahead of the focus
    // restore and land on whatever had focus in between, silently losing
    // the keystroke's effect.
    ref?.focus();
    if (origin && ref) ref.setSelectionRange(origin.caret, origin.caret);
  }

  function blockNewline(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      return true;
    }
    return false;
  }

  function handleHintShortcut(event: KeyboardEvent<HTMLTextAreaElement>, piece: Piece, field: "spanish" | "english") {
    if (event.nativeEvent.isComposing) return false;
    if (!event.altKey || event.key !== "ArrowDown" || event.ctrlKey || event.metaKey || event.shiftKey) return false;
    event.preventDefault();
    focusHint(piece, { field, caret: event.currentTarget.selectionStart ?? 0 });
    return true;
  }

  function handleDeleteShortcut(event: KeyboardEvent<HTMLTextAreaElement>, piece: Piece) {
    if (!event.altKey || !event.ctrlKey || event.metaKey || event.shiftKey || event.nativeEvent.isComposing) return false;
    if (event.code === "Backspace") { event.preventDefault(); boundActions.onDeletePiece(piece.id); return true; }
    return false;
  }

  function handleSpanishKey(event: KeyboardEvent<HTMLTextAreaElement>, index: number) {
    const piece = block.languageBlocks[index];
    if (event.key === "Escape" && !event.nativeEvent.isComposing) {
      event.preventDefault(); event.stopPropagation(); exitEditing(); return;
    }
    if (handleHintShortcut(event, piece, "spanish")) return;
    if (blockNewline(event)) return;
    if (handleDeleteShortcut(event, piece)) return;
    if (event.key !== "Tab" || event.nativeEvent.isComposing) return;
    if (event.shiftKey) {
      if (index > 0) { event.preventDefault(); englishRefs.current.get(block.languageBlocks[index - 1].id)?.focus(); }
      return;
    }
    event.preventDefault();
    englishRefs.current.get(piece.id)?.focus();
  }

  function handleEnglishKey(event: KeyboardEvent<HTMLTextAreaElement>, index: number) {
    const piece = block.languageBlocks[index];
    if (event.key === "Escape" && !event.nativeEvent.isComposing) {
      event.preventDefault(); event.stopPropagation();
      commitEnglishDraft(piece, event.currentTarget.value);
      exitEditing();
      return;
    }
    if (handleHintShortcut(event, piece, "english")) return;
    if (blockNewline(event)) {
      commitEnglishDraft(piece, event.currentTarget.value);
      return;
    }
    if (handleDeleteShortcut(event, piece)) return;
    if (event.key !== "Tab" || event.nativeEvent.isComposing) return;
    const raw = event.currentTarget.value;
    if (event.shiftKey) {
      event.preventDefault();
      commitEnglishDraft(piece, raw);
      spanishRefs.current.get(piece.id)?.focus();
      return;
    }
    const isLast = index === block.languageBlocks.length - 1;
    if (isLast) {
      commitEnglishDraft(piece, raw);
      const complete = Boolean(piece.spanish.trim()) && parseAnswerEntry(raw).length > 0;
      if (complete) { event.preventDefault(); createPair(); }
      // Incomplete trailing pair: don't preventDefault — Tab continues to
      // the next real focusable element (the Add-pair button/tools) instead
      // of creating another blank pair or trapping the keyboard here.
      return;
    }
    event.preventDefault();
    commitEnglishDraft(piece, raw);
    spanishRefs.current.get(block.languageBlocks[index + 1].id)?.focus();
  }

  // Bypasses the `lastPieceComplete` prop-derived guard — callers that have
  // already established completeness from a value fresher than props (the
  // Tab handler below, mid-commit) must not be blocked by stale props from
  // before their own just-dispatched commit has re-rendered.
  function createPair() {
    const id = boundActions.onAddPiece();
    focusCommittedPiece.current = id;
  }

  function addPair() {
    if (!lastPieceComplete) return;
    if (lastPiece) commitEnglishDraft(lastPiece);
    createPair();
  }

  if (!active && !isTable) {
    return (
      <section className="lesson-document-sentence resting" aria-label="Sentence">
        <SentencePresentation block={block} />
      </section>
    );
  }

  return (
    <section className={`lesson-document-sentence editing ${isTable ? "vocab-table" : ""}`} aria-label={isTable ? "Vocabulary table" : "Sentence"}>
      {active && <div className="lesson-document-active-tools" role="toolbar" aria-label="Active sentence tools">
        {!block.promptText.trim() && !showInstruction && <button ref={instructionButtonRef} type="button" onClick={() => setShowInstruction(true)}>Add instruction</button>}
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
          onChange={(event) => boundActions.onUpdateSentence("promptText", event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !event.nativeEvent.isComposing) {
              event.preventDefault(); event.stopPropagation();
              if (!event.currentTarget.value.trim()) {
                setShowInstruction(false);
                requestAnimationFrame(() => instructionButtonRef.current?.focus());
              } else exitEditing();
            }
          }}
        />
      )}

      <div className={`lesson-document-sentence-body ${isTable ? "vocab-table" : ""}`}>
        <div className="lesson-document-pieces">
          {block.languageBlocks.map((piece, index) => (
            <div key={piece.id} className="lesson-document-pair" data-piece={piece.id}>
              <div className={`lesson-document-piece ${activePiece === piece.id ? "active" : ""}`} onFocus={() => setActivePiece(piece.id)}>
                <div className="lesson-document-language-field" data-language="es">
                  <textarea rows={1} data-field="spanish" ref={(element) => { if (element) spanishRefs.current.set(piece.id, element); else spanishRefs.current.delete(piece.id); }} value={piece.spanish} onChange={(event) => boundActions.onUpdateSpanish(piece.id, event.target.value)} onKeyDown={(event) => handleSpanishKey(event, index)} placeholder="Type in Spanish" lang="es" aria-label={`${isTable ? "Row" : "Sentence piece"} ${index + 1} Spanish`} />
                </div>
                <div className="lesson-document-language-field" data-language="en">
                  <textarea
                    rows={1}
                    data-field="english"
                    ref={(element) => { if (element) englishRefs.current.set(piece.id, element); else englishRefs.current.delete(piece.id); }}
                    value={englishDraft[piece.id] ?? formatAnswerEntry(piece.acceptedAnswers)}
                    onChange={(event) => setEnglishDraft((prev) => ({ ...prev, [piece.id]: event.target.value }))}
                    onKeyDown={(event) => handleEnglishKey(event, index)}
                    onBlur={(event) => commitEnglishDraft(piece, event.currentTarget.value)}
                    placeholder="Write in English"
                    lang="en"
                    aria-label={`${isTable ? "Row" : "Sentence piece"} ${index + 1} English. Separate alternatives with a slash, or use a backslash before one to type it literally.`}
                  />
                </div>
              </div>
              <button
                type="button"
                className="lesson-document-pair-delete"
                aria-label={`Delete ${isTable ? "row" : "pair"} ${pieceLabel(piece, index)}`}
                title={`Delete ${isTable ? "row" : "pair"}`}
                onClick={() => boundActions.onDeletePiece(piece.id)}
              >
                <X size={11} aria-hidden="true" />
              </button>
              {piece.callout !== null || hintRequested === piece.id ? (
                activePiece === piece.id ? (
                  <input
                    type="text"
                    className="lesson-document-hint-pill-input"
                    ref={hintInputRef}
                    value={piece.callout ?? ""}
                    onChange={(event) => boundActions.onUpdateCallout(piece.id, event.target.value)}
                    onBlur={() => closeHint(piece)}
                    onKeyDown={(event) => {
                      if (event.nativeEvent.isComposing) return;
                      if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); return; }
                      if (event.key === "Escape") {
                        event.preventDefault(); event.stopPropagation();
                        closeHint(piece);
                        returnFromHint(piece);
                      }
                    }}
                    placeholder="Hint"
                    aria-label={`Hint for ${pieceLabel(piece)}`}
                  />
                ) : piece.callout?.trim() ? (
                  <span className="lesson-document-hint-pill" aria-label={`Hint for ${pieceLabel(piece)}`}>{piece.callout}</span>
                ) : null
              ) : activePiece === piece.id ? (
                <button
                  type="button"
                  className="lesson-document-hint-add"
                  aria-label={`Add hint to ${pieceLabel(piece)}`}
                  onClick={() => requestHint(piece)}
                >
                  <Lightbulb size={18} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ))}
          {active && <button type="button" className={isTable ? "lesson-document-add-row" : "lesson-document-add-pair"} disabled={!lastPieceComplete} onClick={addPair}><Plus size={12} aria-hidden="true" /> Add {isTable ? "row" : "pair"}</button>}
        </div>
      </div>
    </section>
  );
}
