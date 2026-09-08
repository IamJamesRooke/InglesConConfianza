"use client";

import type { ReactNode } from "react";

import type { FocusContext } from "@/lib/lesson-builder/use-focus-context";

type Props = {
  context: FocusContext;
  lessonLabel: string | null;
};

function Row({ children }: { children: ReactNode }) {
  return <div className="editing-hud-row">{children}</div>;
}

const addRow = (
  <Row>
    add <kbd>⌥1</kbd> Explanation <kbd>⌥2</kbd> Sentence <kbd>⌥3</kbd> Vocab table · <kbd>⌥D</kbd> done · <kbd>⌥L</kbd> lesson
  </Row>
);
const pieceRow = (
  <Row>
    <kbd>⌥H</kbd> hint · <kbd>⌥A</kbd> alt answer · <kbd>⌥⌫</kbd> delete blank
  </Row>
);

export function EditingHud({ context, lessonLabel }: Props) {
  const kind = context.kind;

  let body: ReactNode;
  switch (kind) {
    case "title":
      body = <Row><kbd>⏎</kbd> start writing</Row>;
      break;
    case "covers":
      body = <Row>Type to search the curriculum · <kbd>⏎</kbd> to add</Row>;
      break;
    case "explanation":
      body = (
        <>
          <Row><kbd>⌥Q</kbd> Spanish · <kbd>⌥W</kbd> neutral · <kbd>⌥E</kbd> English</Row>
          {addRow}
        </>
      );
      break;
    case "sentence-es":
      body = (
        <>
          <Row><kbd>Tab</kbd> → English</Row>
          {pieceRow}
          {addRow}
        </>
      );
      break;
    case "sentence-en":
      body = (
        <>
          <Row><kbd>Tab</kbd> next blank · <kbd>⇧Tab</kbd> back</Row>
          {pieceRow}
          {addRow}
        </>
      );
      break;
    case "chooser":
      body = <Row><kbd>↑↓</kbd> choose · <kbd>⏎</kbd> add · <kbd>Esc</kbd> cancel</Row>;
      break;
    default:
      return null;
  }

  return (
    <div className="editing-hud" role="region" aria-label="Editing shortcuts">
      {lessonLabel && <div className="editing-hud-scope">{lessonLabel}</div>}
      {body}
    </div>
  );
}
