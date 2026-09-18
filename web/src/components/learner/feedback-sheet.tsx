"use client";

import { MessageCircle } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { isMuted } from "@/lib/learner/speech";
import { getLearnerVariable } from "@/lib/learner/variables";

// Optional single-select chip row (docs/backlog.md "Feedback to issues"
// 2026-09-18): none selected by default, tap again to unselect, never
// required. Sent as `kind` in the payload.
type FeedbackKind = "problema" | "idea" | "elogio";
const KIND_OPTIONS: ReadonlyArray<{ value: FeedbackKind; label: string }> = [
  { value: "problema", label: "Algo falla" },
  { value: "idea", label: "Una idea" },
  { value: "elogio", label: "Me gustó" },
];

// Per-slide feedback (docs/backlog.md "Per-slide feedback",
// docs/design/learner-direction.md, docs/engineering/feedback.md). One
// floating pill (bottom-right, every learner screen) opens the same sheet —
// see FeedbackPill below. The context prop carries everything the
// coordinator needs to triage a note without asking; most of it (device,
// timing, mute state) is filled in here at submit time rather than threaded
// through as props.

const WHO_STORAGE_KEY = "icc.feedback.who";

export type FeedbackAnswerEntry = {
  index: number;
  typed: string;
  correct: boolean;
};

/**
 * Everything a caller (LessonSession, LessonDashboard) assembles ahead of
 * time. Answers/hints/slide content are read off the current slide; the
 * rest (device info, mute state, timing, page/at) is computed by this
 * component itself at submit time, since none of it needs to live in the
 * caller's render state.
 */
export type FeedbackContext = {
  moduleId: string | null;
  moduleName: string | null;
  lessonId: string | null;
  lessonName: string | null;
  slideIndex: number | null;
  slideCount: number | null;
  slideKind: string;
  slideId: string | null;
  slide: Record<string, unknown> | null;
  answers: FeedbackAnswerEntry[];
  hintsUsed: number | null;
  // Epoch ms the current slide became active — secondsOnSlide is derived
  // from this at submit time, so nothing has to re-render every second.
  slideStartedAt: number | null;
  speakerId: string | null;
  progress: { lessonsCompleted: number; lessonsTotal: number } | null;
};

export const EMPTY_FEEDBACK_CONTEXT: FeedbackContext = {
  moduleId: null,
  moduleName: null,
  lessonId: null,
  lessonName: null,
  slideIndex: null,
  slideCount: null,
  slideKind: "unknown",
  slideId: null,
  slide: null,
  answers: [],
  hintsUsed: null,
  slideStartedAt: null,
  speakerId: null,
  progress: null,
};

type SendState = "idle" | "sending" | "sent" | "error";

/** Imperative handle so another trigger (the home footer's "Comentar" link)
 * can open this same sheet instance instead of duplicating it. */
export type FeedbackSheetHandle = { open: () => void };

function readStoredWho(): string {
  try {
    const remembered = window.localStorage.getItem(WHO_STORAGE_KEY);
    if (remembered) return remembered;
  } catch {
    // Blocked storage — fall through to the captured name below.
  }
  // Nothing remembered here yet, but onboarding may already have asked for
  // the learner's name (docs/design/onboarding.md "The capture piece") —
  // prefill from that rather than making them type it twice.
  return getLearnerVariable("name") ?? "";
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

function currentPointer(): "touch" | "mouse" | null {
  try {
    if (typeof window.matchMedia !== "function") return null;
    return window.matchMedia("(pointer: coarse)").matches ? "touch" : "mouse";
  } catch {
    return null;
  }
}

export const FeedbackSheet = forwardRef<FeedbackSheetHandle, {
  context: FeedbackContext;
  pillVariant?: "default" | "practice";
  // The pill renders by default; a caller with its own trigger elsewhere on
  // the page (the home footer's "Comentar" link) can hide it and drive the
  // sheet through the imperative handle instead.
  hidePill?: boolean;
}>(function FeedbackSheet({ context, pillVariant = "default", hidePill = false }, ref) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [who, setWho] = useState("");
  const [kind, setKind] = useState<FeedbackKind | null>(null);
  // Honeypot (docs/backlog.md "Feedback to issues"): off-screen, never
  // filled by a human. Non-empty on submit means a bot — the field's own
  // aria-hidden/tabIndex keep it out of the accessible flow.
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const kindRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const close = useCallback(() => {
    setOpen(false);
    setState("idle");
  }, []);

  const openSheet = useCallback(() => {
    setWho(readStoredWho());
    setMessage("");
    setKind(null);
    setWebsite("");
    setState("idle");
    setOpen(true);
  }, []);

  const focusKindAt = useCallback((index: number) => {
    const count = KIND_OPTIONS.length;
    const next = kindRefs.current[((index % count) + count) % count];
    next?.focus();
  }, []);

  const onKindKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        focusKindAt(index + 1);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        focusKindAt(index - 1);
      }
    },
    [focusKindAt],
  );

  useImperativeHandle(ref, () => ({ open: openSheet }), [openSheet]);

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
    const secondsOnSlide =
      context.slideStartedAt != null
        ? Math.max(0, Math.round((Date.now() - context.slideStartedAt) / 1000))
        : null;
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: context.moduleId,
          moduleName: context.moduleName,
          lessonId: context.lessonId,
          lessonName: context.lessonName,
          slideIndex: context.slideIndex,
          slideCount: context.slideCount,
          slideKind: context.slideKind,
          slideId: context.slideId,
          slide: context.slide,
          answers: context.answers,
          hintsUsed: context.hintsUsed,
          secondsOnSlide,
          muted: isMuted(),
          speakerId: context.speakerId,
          progress: context.progress,
          viewport: { w: window.innerWidth, h: window.innerHeight },
          userAgent: window.navigator.userAgent,
          language: window.navigator.language || null,
          pointer: currentPointer(),
          appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
          message: message.trim(),
          who: who.trim() || undefined,
          kind,
          website,
          page: window.location.pathname + window.location.search,
          at: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error("feedback request failed");
      setState("sent");
    } catch {
      setState("error");
    }
  }, [context, message, who, kind, website, state]);

  return (
    <>
      {!hidePill && (
        <button
          type="button"
          className={`feedback-pill${
            pillVariant === "practice" ? " feedback-pill--practice" : ""
          }${open ? " feedback-pill--hidden" : ""}`}
          onClick={openSheet}
          aria-label="Comentar"
          aria-hidden={open}
          tabIndex={open ? -1 : 0}
        >
          <MessageCircle size={20} aria-hidden="true" />
          <span className="feedback-pill-label" aria-hidden="true">
            Comentar
          </span>
        </button>
      )}
      {open && (
        <div className="feedback-sheet-overlay" onClick={close}>
          <div
            className="feedback-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-sheet-title"
            aria-describedby="feedback-sheet-help"
            onClick={(event) => event.stopPropagation()}
          >
            {state === "sent" ? (
              <p className="feedback-sheet-thanks" role="status">
                ¡Gracias! Anotado.
              </p>
            ) : (
              <>
                <h2 id="feedback-sheet-title" className="feedback-sheet-title">
                  ¿Qué nos quieres contar?
                </h2>
                <p id="feedback-sheet-help" className="feedback-sheet-help">
                  Un problema, una idea o algo que te gustó. Cada comentario
                  mejora las lecciones.
                </p>
                <div
                  className="feedback-sheet-kind"
                  role="radiogroup"
                  aria-label="Tipo de comentario (opcional)"
                >
                  {KIND_OPTIONS.map((option, index) => {
                    const selected = kind === option.value;
                    const isTabbable = selected || (!kind && index === 0);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        tabIndex={isTabbable ? 0 : -1}
                        ref={(element) => {
                          kindRefs.current[index] = element;
                        }}
                        className={`feedback-kind-chip${
                          selected ? " feedback-kind-chip--selected" : ""
                        }`}
                        onClick={() => setKind(selected ? null : option.value)}
                        onKeyDown={(event) => onKindKeyDown(event, index)}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {/* Honeypot: real learners never see or fill this. */}
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  className="feedback-sheet-honeypot"
                  aria-hidden="true"
                  tabIndex={-1}
                  autoComplete="off"
                />
                <textarea
                  ref={textareaRef}
                  className="feedback-sheet-textarea"
                  placeholder="Escribe aquí…"
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
                    onChange={(event) => {
                      setWho(event.target.value);
                      storeWho(event.target.value.trim());
                    }}
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
});
