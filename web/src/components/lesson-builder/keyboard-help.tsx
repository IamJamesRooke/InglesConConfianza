"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

// Writing-tier keys highlighted on the QWERTY graphic below — kept in sync
// with the "Writing a lesson" table by hand since the graphic is a static
// visual aid, not derived from the table data.
const WRITING_TIER_KEYS = new Set([
  "E",
  "T",
  "S",
  "I",
  "Tab",
  "Ctrl",
  "Alt",
  "Enter",
  "Z",
  "B",
  "Esc",
]);

const KEYBOARD_ROWS: string[][] = [
  ["Esc", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["Tab", "A", "S", "D", "F", "G", "H", "J", "K", "L", "Enter"],
  ["Ctrl", "Alt", "Z", "X", "C", "V", "B", "N", "M"],
];

function KeyboardMap() {
  return (
    <div className="lesson-library-help-keymap" aria-hidden="true">
      {KEYBOARD_ROWS.map((row, index) => (
        <div className="lesson-library-help-keymap-row" key={index}>
          {row.map((key) => (
            <span
              key={key}
              className="lesson-library-help-keymap-key"
              data-active={WRITING_TIER_KEYS.has(key) ? "true" : "false"}
            >
              {key}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

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
      <div className="lesson-library-help-body">
        <section>
          <h3>Writing a lesson</h3>
          <dl>
            <div>
              <dt>
                <kbd>Enter</kbd>
              </dt>
              <dd>
                From the title: start writing. In an explanation: new
                paragraph.
              </dd>
            </div>
            <div>
              <dt>
                <kbd>Tab</kbd> / <kbd>⇧</kbd> <kbd>Tab</kbd>
              </dt>
              <dd>Spanish → English → next pair</dd>
            </div>
            <div>
              <dt>
                <kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>Enter</kbd>
              </dt>
              <dd>
                Open insert choices after this slide, then{" "}
                <kbd>E</kbd>/<kbd>S</kbd>/<kbd>T</kbd> to pick Explanation,
                Sentence, or Table
              </dd>
            </div>
            <div>
              <dt>
                <kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>B</kbd> ·{" "}
                <kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>I</kbd>
              </dt>
              <dd>Bold / italic</dd>
            </div>
            <div>
              <dt>
                <kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>Z</kbd> ·{" "}
                <kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>Z</kbd>
              </dt>
              <dd>Undo / redo</dd>
            </div>
            <div>
              <dt>
                <kbd>Esc</kbd>
              </dt>
              <dd>Close the nested tool / leave the slide</dd>
            </div>
          </dl>
        </section>

        <KeyboardMap />

        <section>
          <h3>More</h3>
          <dl>
            <div>
              <dt>
                <kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>S</kbd> ·{" "}
                <kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>E</kbd> ·{" "}
                <kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>N</kbd>
              </dt>
              <dd>
                In an explanation: mark as Spanish · English · neutral. With
                text selected, marks it.
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
                <kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>L</kbd>
              </dt>
              <dd>Add a new lesson right after this one</dd>
            </div>
            <div>
              <dt>
                <kbd>Alt</kbd> <kbd>↓</kbd>
              </dt>
              <dd>On a sentence pair: open its hint</dd>
            </div>
            <div>
              <dt>
                <kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>Backspace</kbd>
              </dt>
              <dd>Delete the pair</dd>
            </div>
          </dl>
        </section>
      </div>
      <footer>
        <button type="button" onClick={onClose}>
          Close <kbd>Esc</kbd>
        </button>
      </footer>
    </dialog>
  );
}
