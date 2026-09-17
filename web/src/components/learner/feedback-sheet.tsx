"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Per-slide feedback (docs/backlog.md "Per-slide feedback",
// docs/design/learner-direction.md, docs/engineering/feedback.md). Shared by
// the practice footer ("¿Algo que corregir?"), the completion screen and the
// home footer (both "¿Qué te pareció?") — only the trigger label/class and
// the slide context passed in differ.

const WHO_STORAGE_KEY = "icc.feedback.who";

export type FeedbackContext = {
  lessonId: string | null;
  lessonName: string | null;
  slideIndex: number | null;
  slideKind: string;
  slideText: string | null;
};

type SendState = "idle" | "sending" | "sent" | "error";

function readStoredWho(): string {
  try {
    return window.localStorage.getItem(WHO_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function storeWho(value: string) {
  try {
    if (value) window.localStorage.setItem(WHO_STORAGE_KEY, value);
    else window.localStorage.removeItem(WHO_STORAGE_KEY);
  } catch {
    // Private browsing / blocked storage — the field just won't be
    // remembered next time, which is not worth surfacing to the learner.
  }
}

export function FeedbackSheet({
  context,
  triggerLabel = "¿Qué te pareció?",
  triggerClassName = "muted-link",
}: {
  context: FeedbackContext;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [who, setWho] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setState("idle");
  }, []);

  const openSheet = useCallback(() => {
    setWho(readStoredWho());
    setMessage("");
    setState("idle");
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    textareaRef.current?.focus();
  }, [open]);

  // Capture phase so this beats the lesson session's own Escape-closes-lesson
  // listener (registered on document in the bubble phase): stopping
  // propagation here keeps that handler from ever running while the sheet
  // is open.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      close();
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, close]);

  useEffect(() => {
    if (state !== "sent") return;
    const timeout = setTimeout(close, 2000);
    return () => clearTimeout(timeout);
  }, [state, close]);

  const submit = useCallback(async () => {
    if (!message.trim() || state === "sending") return;
    setState("sending");
    storeWho(who.trim());
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: context.lessonId,
          lessonName: context.lessonName,
          slideIndex: context.slideIndex,
          slideKind: context.slideKind,
          slideText: context.slideText,
          message: message.trim(),
          who: who.trim() || undefined,
          page: window.location.pathname + window.location.search,
          userAgent: window.navigator.userAgent,
          at: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error("feedback request failed");
      setState("sent");
    } catch {
      setState("error");
    }
  }, [context, message, who, state]);

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={openSheet}
      >
        {triggerLabel}
      </button>
      {open && (
        <div className="feedback-sheet-overlay" onClick={close}>
          <div
            className="feedback-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-sheet-title"
            onClick={(event) => event.stopPropagation()}
          >
            {state === "sent" ? (
              <p className="feedback-sheet-thanks" role="status">
                ¡Gracias! Anotado.
              </p>
            ) : (
              <>
                <h2 id="feedback-sheet-title" className="feedback-sheet-title">
                  ¿Algo que corregir o mejorar?
                </h2>
                <textarea
                  ref={textareaRef}
                  className="feedback-sheet-textarea"
                  placeholder="Cuéntame qué está mal o qué mejorarías."
                  value={message}
                  maxLength={2000}
                  onChange={(event) => setMessage(event.target.value)}
                />
                <label className="feedback-sheet-who-label">
                  ¿Quién eres? (opcional)
                  <input
                    type="text"
                    className="feedback-sheet-who-input"
                    value={who}
                    maxLength={80}
                    onChange={(event) => setWho(event.target.value)}
                  />
                </label>
                {state === "error" && (
                  <p className="feedback-sheet-error" role="alert">
                    No se pudo enviar. Inténtalo otra vez.
                  </p>
                )}
                <div className="feedback-sheet-actions">
                  <button
                    type="button"
                    className="learner-button primary feedback-sheet-send"
                    disabled={!message.trim() || state === "sending"}
                    onClick={() => void submit()}
                  >
                    Enviar
                  </button>
                  <button
                    type="button"
                    className="muted-link feedback-sheet-cancel"
                    onClick={close}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
