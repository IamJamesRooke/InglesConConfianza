"use client";

import { Lightbulb, Plus, X } from "lucide-react";
import { useState } from "react";

import { SentencePresentation } from "@/components/lesson-builder/sentence-presentation";
import { formatAnswerEntry } from "@/lib/lesson-builder/answer-entry";
import { useLessonBuilder } from "@/lib/lesson-builder/builder-context";
import { activeBlockId, commitAnswerDraft, useLessonEditing } from "@/lib/lesson-builder/editing";
import type { SentenceBlock } from "@/lib/lesson-builder/types";

type Piece = SentenceBlock["languageBlocks"][number];

type Props = {
  lessonId: string;
  block: SentenceBlock;
};

// All chord handling (Tab/Enter pair navigation, Escape, Alt+ArrowDown hint,
// Ctrl+Alt+Backspace delete) lives in keymap.ts now — this component only
// owns element-level text semantics (typing, the "Add pair"/"Add
// instruction" buttons) and reports focus into the shared selection so the
// keymap always knows which piece/field is current. See
// docs/design/lesson-builder-editing-model.md.
export function SentenceEditor(props: Props) {
  const { lessonId, block } = props;
  const actions = useLessonBuilder();
  const editing = useLessonEditing();
  // Same "active" as the block-level chrome (editing.ts's `activeBlockId`):
  // `{kind:"block"}` still counts, on purpose — one Escape from a field
  // lands on the block wrapper (still selected, editing grid stays up);
  // a *second* Escape fully deselects to `{kind:"none"}`, which is when
  // this drops to the resting composed view. Two Escapes to fully rest,
  // by owner requirement 2026-09-15.
  const active = activeBlockId(editing.selection) === block.id;
  const selectedField =
    editing.selection.kind === "field" && editing.selection.blockId === block.id
      ? editing.selection
      : null;

  const [showInstruction, setShowInstruction] = useState(false);
  // English alternatives edit as one local draft string (slash-delimited);
  // stored answers are only reconciled on commit (blur, or a keymap command
  // reading the field's live value directly) — typing never parses
  // mid-keystroke.
  const [englishDraft, setEnglishDraft] = useState<Record<string, string>>({});
  const isTable = block.layout === "vocabulary_table";
  const lastPiece = block.languageBlocks.at(-1);
  const lastPieceEnglish = lastPiece
    ? (englishDraft[lastPiece.id] ?? lastPiece.acceptedAnswers[0] ?? "")
    : "";
  const lastPieceComplete =
    !lastPiece || (Boolean(lastPiece.spanish.trim()) && Boolean(lastPieceEnglish.trim()));

  function pieceLabel(piece: Piece, index = block.languageBlocks.indexOf(piece)) {
    return piece.spanish.trim() || `${isTable ? "row" : "pair"} ${index + 1}`;
  }

  function commitEnglishDraft(piece: Piece, raw?: string) {
    const draft = raw ?? englishDraft[piece.id];
    if (draft === undefined) return;
    commitAnswerDraft(actions, lessonId, block.id, piece, draft);
    setEnglishDraft((prev) => {
      if (!(piece.id in prev)) return prev;
      const copy = { ...prev };
      delete copy[piece.id];
      return copy;
    });
  }

  function selectField(field: "spanish" | "english" | "instruction", pieceId?: string) {
    editing.setSelection({ kind: "field", lessonId, blockId: block.id, field, pieceId });
  }

  function addPair() {
    if (!lastPieceComplete) return;
    if (lastPiece) commitEnglishDraft(lastPiece);
    const id = actions.addPiece(lessonId, block.id);
    editing.setSelection(
      { kind: "field", lessonId, blockId: block.id, field: "spanish", pieceId: id },
      { reason: "insert" },
    );
    editing.focusSelection({ kind: "field", lessonId, blockId: block.id, field: "spanish", pieceId: id });
  }

  if (!active) {
    return (
      <section
        className="lesson-document-sentence resting"
        aria-label={isTable ? "Vocabulary table" : "Sentence"}
      >
        <SentencePresentation block={block} />
      </section>
    );
  }

  return (
    <section
      className={`lesson-document-sentence editing ${isTable ? "vocab-table" : ""}`}
      aria-label={isTable ? "Vocabulary table" : "Sentence"}
    >
      {active && (
        <div className="lesson-document-active-tools" role="toolbar" aria-label="Active sentence tools">
          {!block.promptText.trim() && !showInstruction && (
            <button
              type="button"
              // Never let this click steal DOM focus off whatever field is
              // currently focused (e.g. a brand-new, still-empty pair's
              // Spanish field). This button unmounts itself the instant
              // `showInstruction` flips true — if the click had focused it
              // first, that self-removal fires a focusout whose
              // `relatedTarget` can't be resolved, which used to read as
              // "left the slide entirely" and delete it (owner-reported
              // 2026-09-15: "Add instruction" on an empty sentence made the
              // whole slide vanish). Keeping focus on the original field
              // through the click avoids the race outright, and the
              // freshly mounted instruction textarea's own `autoFocus`
              // then moves focus there as a normal, single native focus
              // change — its own `onFocus` reports the selection, same as
              // every other field.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setShowInstruction(true)}
            >
              Add instruction
            </button>
          )}
        </div>
      )}

      {!active && block.promptText.trim() ? (
        <p className="lesson-sentence-presentation-instruction">{block.promptText}</p>
      ) : (block.promptText.trim() || showInstruction) && (
        <textarea
          autoFocus={showInstruction && !block.promptText}
          className="lesson-document-prompt"
          data-field="instruction"
          value={block.promptText}
          rows={1}
          placeholder="Add an instruction…"
          aria-label="Optional learner instruction"
          onFocus={() => selectField("instruction")}
          onChange={(event) => actions.updateSentence(lessonId, block.id, "promptText", event.target.value)}
          onBlur={() => {
            if (!block.promptText.trim()) setShowInstruction(false);
          }}
        />
      )}

      <div className={`lesson-document-sentence-body ${isTable ? "vocab-table" : ""}`}>
        <div className="lesson-document-pieces">
          {block.languageBlocks.map((piece, index) => {
            const pieceActive = selectedField?.pieceId === piece.id;
            const hintOpen = pieceActive && selectedField?.field === "hint";
            return (
              <div key={piece.id} className="lesson-document-pair" data-piece={piece.id}>
                <div className={`lesson-document-piece ${pieceActive ? "active" : ""}`}>
                  <div className="lesson-document-language-field" data-language="es">
                    <textarea
                      rows={1}
                      data-field="spanish"
                      value={piece.spanish}
                      onFocus={() => selectField("spanish", piece.id)}
                      onChange={(event) => actions.updateSpanish(lessonId, block.id, piece.id, event.target.value)}
                      placeholder="Type in Spanish"
                      lang="es"
                      aria-label={`${isTable ? "Row" : "Sentence piece"} ${index + 1} Spanish`}
                    />
                  </div>
                  <div className="lesson-document-language-field" data-language="en">
                    <textarea
                      rows={1}
                      data-field="english"
                      value={englishDraft[piece.id] ?? formatAnswerEntry(piece.acceptedAnswers)}
                      onFocus={() => selectField("english", piece.id)}
                      onChange={(event) =>
                        setEnglishDraft((prev) => ({ ...prev, [piece.id]: event.target.value }))
                      }
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
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => actions.deletePiece(lessonId, block.id, piece.id)}
                >
                  <X size={11} aria-hidden="true" />
                </button>
                {piece.given && (
                  <span
                    className="lesson-document-given-tag"
                    title="Shown to the student, not tested"
                  >
                    given
                  </span>
                )}
                {piece.callout !== null || hintOpen ? (
                  pieceActive ? (
                    <input
                      type="text"
                      className="lesson-document-hint-pill-input"
                      data-field="hint"
                      value={piece.callout ?? ""}
                      onFocus={() =>
                        editing.setSelection({
                          kind: "field",
                          lessonId,
                          blockId: block.id,
                          field: "hint",
                          pieceId: piece.id,
                        })
                      }
                      onChange={(event) => actions.updateCallout(lessonId, block.id, piece.id, event.target.value)}
                      placeholder="Hint"
                      aria-label={`Hint for ${pieceLabel(piece)}`}
                    />
                  ) : piece.callout?.trim() ? (
                    <span className="lesson-document-hint-pill" aria-label={`Hint for ${pieceLabel(piece)}`}>
                      {piece.callout}
                    </span>
                  ) : null
                ) : pieceActive ? (
                  <button
                    type="button"
                    className="lesson-document-hint-add"
                    aria-label={`Add hint to ${pieceLabel(piece)}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      editing.setSelection({
                        kind: "field",
                        lessonId,
                        blockId: block.id,
                        field: "hint",
                        pieceId: piece.id,
                      });
                      editing.focusSelection({
                        kind: "field",
                        lessonId,
                        blockId: block.id,
                        field: "hint",
                        pieceId: piece.id,
                      });
                    }}
                  >
                    <Lightbulb size={18} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            );
          })}
          {active && (
            <button
              type="button"
              className={isTable ? "lesson-document-add-row" : "lesson-document-add-pair"}
              disabled={!lastPieceComplete}
              onMouseDown={(event) => event.preventDefault()}
              onClick={addPair}
            >
              <Plus size={12} aria-hidden="true" /> Add {isTable ? "row" : "pair"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
