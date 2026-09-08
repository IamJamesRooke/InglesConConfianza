"use client";

import { useEffect, useRef, useState } from "react";

// Where the caret is in the Lesson Builder, so the editing HUD can show the
// shortcuts and actions that actually apply right now (and to which lesson).

export type FocusKind =
  | "none"
  | "title"
  | "covers"
  | "explanation"
  | "sentence-es"
  | "sentence-en"
  | "chooser";

export type FocusContext = { kind: FocusKind; lessonId: string | null };

function readContext(): FocusContext {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement) || el === document.body) {
    return { kind: "none", lessonId: null };
  }
  const row = el.closest<HTMLElement>("[data-lesson-row]");
  const lessonId =
    el.dataset.lessonTitle ??
    el.dataset.coversFor ??
    row?.dataset.lessonRow ??
    null;

  if (el.closest(".lesson-document-insert-choices")) return { kind: "chooser", lessonId };
  if (el.hasAttribute("data-lesson-title")) return { kind: "title", lessonId };
  if (el.hasAttribute("data-covers-for")) return { kind: "covers", lessonId };
  if (el.closest(".lesson-document-explanation, .authoring-wysiwyg")) return { kind: "explanation", lessonId };
  if (el.dataset.field === "spanish") return { kind: "sentence-es", lessonId };
  if (el.dataset.field === "english") return { kind: "sentence-en", lessonId };
  if (el.closest(".lesson-document-piece")) return { kind: "sentence-es", lessonId };
  return { kind: "none", lessonId };
}

export function useFocusContext(): FocusContext {
  const [context, setContext] = useState<FocusContext>({ kind: "none", lessonId: null });
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const update = () => {
      if (raf.current !== undefined) cancelAnimationFrame(raf.current);
      // One frame after the focus events settle.
      raf.current = requestAnimationFrame(() => {
        setContext((current) => {
          const next = readContext();
          return current.kind === next.kind && current.lessonId === next.lessonId
            ? current
            : next;
        });
      });
    };
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    document.addEventListener("selectionchange", update);
    update();
    return () => {
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
      document.removeEventListener("selectionchange", update);
      if (raf.current !== undefined) cancelAnimationFrame(raf.current);
    };
  }, []);

  return context;
}
