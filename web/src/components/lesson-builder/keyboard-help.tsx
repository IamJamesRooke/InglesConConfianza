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
      <KeyboardMap />
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
            <kbd>Alt</kbd> <kbd>Q</kbd> · <kbd>Alt</kbd> <kbd>W</kbd> ·{" "}
            <kbd>Alt</kbd> <kbd>E</kbd>
          </dt>
          <dd>
            In an explanation: type in Spanish · neutral · English. With text
            selected, marks it.
          </dd>
        </div>
        <div>
          <dt>
            <kbd>Alt</kbd> <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd>
          </dt>
          <dd>
            Add an Explanation / Sentence / Vocabulary table after the current
            slide
          </dd>
        </div>
        <div>
          <dt>
            <kbd>Alt</kbd> <kbd>Enter</kbd>
          </dt>
          <dd>Open the slide chooser after this slide</dd>
        </div>
        <div>
          <dt>
            <kbd>Alt</kbd> <kbd>D</kbd>
          </dt>
          <dd>Finish this lesson (collapse it)</dd>
        </div>
        <div>
          <dt>
            <kbd>Alt</kbd> <kbd>L</kbd> · <kbd>Alt</kbd> <kbd>Shift</kbd>{" "}
            <kbd>L</kbd>
          </dt>
          <dd>Add a lesson here · start a whole new lesson</dd>
        </div>
        <div>
          <dt>
            <kbd>Tab</kbd> / <kbd>⇧</kbd> <kbd>Tab</kbd>
          </dt>
          <dd>Move between Spanish, English, and the next blank</dd>
        </div>
        <div>
          <dt>
            <kbd>Alt</kbd> <kbd>H</kbd> · <kbd>Alt</kbd> <kbd>A</kbd> ·{" "}
            <kbd>Alt</kbd> <kbd>Backspace</kbd>
          </dt>
          <dd>
            On a sentence blank: add a hint · add an accepted answer · delete
            the blank
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
          <dd>Leave a field, or close this help</dd>
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

type Key = { k: string; act?: string; w?: number };
const KEYBOARD_ROWS: Key[][] = [
  [
    { k: "Esc", act: "leave field", w: 1.6 },
    { k: "1", act: "Explanation" },
    { k: "2", act: "Sentence" },
    { k: "3", act: "Vocab table" },
    { k: "4" },
    { k: "5" },
    { k: "6" },
    { k: "7" },
    { k: "8" },
    { k: "9" },
    { k: "0" },
  ],
  [
    { k: "Tab", act: "next field", w: 1.6 },
    { k: "Q", act: "Spanish" },
    { k: "W", act: "neutral" },
    { k: "E", act: "English" },
    { k: "R" },
    { k: "T" },
    { k: "Y" },
    { k: "U" },
    { k: "I" },
    { k: "O" },
    { k: "P" },
  ],
  [
    { k: "Alt", act: "hold for commands", w: 2 },
    { k: "A", act: "alt answer" },
    { k: "S" },
    { k: "D", act: "done" },
    { k: "F" },
    { k: "G" },
    { k: "H", act: "hint" },
    { k: "J" },
    { k: "K" },
    { k: "L", act: "add lesson" },
    { k: "Enter", act: "add slide", w: 1.8 },
  ],
  [
    { k: "Shift", act: "hold", w: 2.4 },
    { k: "Z", act: "undo" },
    { k: "X" },
    { k: "C" },
    { k: "V" },
    { k: "B", act: "bold" },
    { k: "N" },
    { k: "M" },
    { k: "," },
    { k: ".", act: "shortcuts" },
    { k: "/" },
  ],
  [{ k: "Space", w: 7 }, { k: "←" }, { k: "↑ ↓" }, { k: "→" }],
];

function KeyboardMap() {
  return (
    <div
      className="lesson-kbd-map"
      role="img"
      aria-label="Keyboard shortcut map"
    >
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="lesson-kbd-row">
          {row.map((key, keyIndex) => (
            <span
              key={keyIndex}
              className={`lesson-kbd-key${key.act ? " is-active" : ""}`}
              style={{ flexGrow: key.w ?? 1 }}
            >
              <span className="lesson-kbd-cap">{key.k}</span>
              {key.act && <span className="lesson-kbd-act">{key.act}</span>}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
