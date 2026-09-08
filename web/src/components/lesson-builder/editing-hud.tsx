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
      body = <Row><kbd>⏎</kbd> start writing</Row>;
      break;
    case "covers":
      body = <Row>Type to search the curriculum · <kbd>⏎</kbd> to add</Row>;
      break;
    case "explanation":
      body = <Row><kbd>Alt Enter</kbd> next slide · <kbd>Alt Q/W/E</kbd> Spanish / neutral / English</Row>;
      break;
    case "sentence-es":
      body = <Row><kbd>Tab</kbd> English · <kbd>Alt Enter</kbd> next slide</Row>;
      break;
    case "sentence-en":
      body = <Row><kbd>Tab</kbd> next blank · <kbd>Shift Tab</kbd> back · <kbd>Alt Enter</kbd> next slide</Row>;
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
