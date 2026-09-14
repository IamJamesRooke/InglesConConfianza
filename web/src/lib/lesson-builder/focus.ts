// One place that knows how to move the caret into a slide's main writing field.
// The Lesson Builder has three surfaces that all need this — creating a lesson,
// adding a slide, and the title → body transition — and they previously each
// scheduled their own animation-frame focus, which raced. Callers use this
// helper instead so there is a single scheduled focus per action.

type WritingFieldOptions = {
  // "first" targets the earliest writing field in the slide (Spanish for a
  // sentence, the paragraph for an explanation). "prompt" prefers an authored
  // instruction field if one is visible.
  prefer?: "first" | "prompt";
  // Targets one specific sentence/vocabulary pair's Spanish field (see the
  // `data-piece` attribute in sentence-editor.tsx) instead of the slide's
  // first field — used when restoring a single deleted pair via undo.
  pieceId?: string;
};

const WRITING_FIELD_SELECTOR =
  "[contenteditable='true'], input:not([type='button']), textarea";

function focusActualField(
  slide: HTMLElement,
  { prefer = "first", pieceId }: WritingFieldOptions,
) {
  if (pieceId) {
    const pieceField = slide.querySelector<HTMLElement>(
      `[data-piece="${pieceId}"] [data-field='spanish']`,
    );
    if (pieceField) {
      pieceField.focus({ preventScroll: true });
      return;
    }
  }
  const prompt =
    prefer === "prompt"
      ? slide.querySelector<HTMLElement>(".lesson-document-prompt")
      : null;
  const target =
    prompt ??
    slide.querySelector<HTMLElement>("[data-field='spanish']") ??
    slide.querySelector<HTMLElement>(WRITING_FIELD_SELECTOR);
  // preventScroll so the caret placement doesn't fight the smooth scroll.
  target?.focus({ preventScroll: true });
}

export function focusSlideWritingField(
  blockId: string,
  options: WritingFieldOptions = {},
) {
  requestAnimationFrame(() => {
    const slide = document.querySelector<HTMLElement>(
      `[data-document-block="${blockId}"]`,
    );
    if (!slide) return;

    // Bring the new slide fully into view — a plain focus() only nudges the
    // field to the edge, where the fixed bottom HUD covers it.
    slide.scrollIntoView({ behavior: "smooth", block: "center" });

    if (!slide.querySelector(WRITING_FIELD_SELECTOR)) {
      // Sentence/vocabulary slides only render their real fields once the
      // slide itself is "active" (lesson-document.tsx swaps the resting
      // presentation for the editing pieces on focus) — focus the slide
      // wrapper first (its onFocusCapture marks it active) so those fields
      // exist, then focus the real one on the next frame.
      slide.focus({ preventScroll: true });
      requestAnimationFrame(() => focusActualField(slide, options));
      return;
    }
    focusActualField(slide, options);
  });
}
