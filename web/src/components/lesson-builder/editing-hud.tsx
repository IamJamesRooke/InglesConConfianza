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

export function EditingHud({ context, lessonLabel }: Props) {
  const kind = context.kind;

  let body: ReactNode;
  switch (kind) {
    case "title":
      body = <Row><kbd>Enter</kbd> start writing</Row>;
      break;
    case "covers":
      body = <Row>Type to search the curriculum · <kbd>Enter</kbd> to add</Row>;
      break;
    case "explanation":
      body = <Row><kbd>Ctrl Alt Enter</kbd> next slide · <kbd>Ctrl Alt Q/W/E</kbd> Spanish / neutral / English</Row>;
      break;
    case "sentence-es":
      body = <Row><kbd>Tab</kbd> English · <kbd>Ctrl Alt H</kbd> hint · <kbd>Ctrl Alt Enter</kbd> next slide</Row>;
      break;
    case "sentence-en":
      body = <Row><kbd>Tab</kbd> next blank · <kbd>Ctrl Alt H</kbd> hint · <kbd>Ctrl Alt A</kbd> alt. answer · <kbd>Ctrl Alt Enter</kbd> next slide</Row>;
      break;
    case "chooser":
      body = <Row><kbd>↑↓</kbd> choose · <kbd>Enter</kbd> add · <kbd>Esc</kbd> cancel</Row>;
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
