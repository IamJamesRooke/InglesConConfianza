"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export function KeyboardHelpDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="lesson-library-help"
      aria-labelledby="lesson-keyboard-help-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header>
        <div>
          <span>Lesson writing</span>
          <h2 id="lesson-keyboard-help-title">
            Keyboard help <kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>.</kbd>
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close keyboard help"
        >
          <X size={17} />
        </button>
      </header>
      <dl>
        <div>
          <dt>
            <kbd>Enter</kbd>
          </dt>
          <dd>
            From the title: start writing. In an explanation: new paragraph.
          </dd>
        </div>
        <div>
          <dt>
            <kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>Q</kbd> · <kbd>Ctrl</kbd>{" "}
            <kbd>Alt</kbd> <kbd>W</kbd> · <kbd>Ctrl</kbd> <kbd>Alt</kbd>{" "}
            <kbd>E</kbd>
          </dt>
          <dd>
            In an explanation: type in Spanish · neutral · English. With text
            selected, marks it.
          </dd>
        </div>
        <div>
          <dt>
            <kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>1</kbd> <kbd>2</kbd>{" "}
            <kbd>3</kbd>
          </dt>
          <dd>
            Add an Explanation / Sentence / Vocabulary table after the current
            slide
          </dd>
        </div>
        <div>
          <dt>
            <kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>Enter</kbd>
          </dt>
          <dd>
            Open insert choices after this slide — Explanation, Sentence
            (focused first), Table; press <kbd>E</kbd>/<kbd>S</kbd>/<kbd>T</kbd> to pick
          </dd>
        </div>
        <div>
          <dt>
            <kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>↑</kbd> <kbd>↓</kbd>
          </dt>
          <dd>Move the active slide up or down</dd>
        </div>
        <div>
          <dt>
            <kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>D</kbd>
          </dt>
          <dd>Finish this lesson (collapse it)</dd>
        </div>
        <div>
          <dt>
            <kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>L</kbd> · <kbd>Ctrl</kbd>{" "}
            <kbd>Alt</kbd> <kbd>Shift</kbd> <kbd>L</kbd>
          </dt>
          <dd>Add a lesson here · start a whole new lesson</dd>
        </div>
        <div>
          <dt>
            <kbd>Tab</kbd> / <kbd>⇧</kbd> <kbd>Tab</kbd>
          </dt>
          <dd>Move between Spanish, English, and active tools</dd>
        </div>
        <div>
          <dt>
            <kbd>Alt</kbd> <kbd>↓</kbd> · <kbd>/</kbd> · <kbd>Ctrl</kbd>{" "}
            <kbd>Alt</kbd> <kbd>Backspace</kbd>
          </dt>
          <dd>
            On a sentence pair: jump to its hint · separate alternative
            English answers in the same field · delete the pair
          </dd>
        </div>
        <div>
          <dt>
            <kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>B</kbd> / <kbd>I</kbd>
          </dt>
          <dd>Bold or italic</dd>
        </div>
        <div>
          <dt>
            <kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>Z</kbd> · <kbd>⇧</kbd>{" "}
            <kbd>Z</kbd>
          </dt>
          <dd>Undo · redo</dd>
        </div>
        <div>
          <dt>
            <kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>S</kbd>
          </dt>
          <dd>Save now (it also autosaves)</dd>
        </div>
        <div>
          <dt>
            <kbd>Esc</kbd>
          </dt>
          <dd>Close a nested tool first; otherwise leave slide editing</dd>
        </div>
      </dl>
      <footer>
        <button type="button" onClick={onClose}>
          Close <kbd>Esc</kbd>
        </button>
      </footer>
    </dialog>
  );
}
