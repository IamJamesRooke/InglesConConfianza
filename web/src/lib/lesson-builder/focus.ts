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
};

const WRITING_FIELD_SELECTOR =
  "[contenteditable='true'], input:not([type='button']), textarea";

export function focusSlideWritingField(
  blockId: string,
  { prefer = "first" }: WritingFieldOptions = {},
) {
  requestAnimationFrame(() => {
    const slide = document.querySelector<HTMLElement>(
      `[data-document-block="${blockId}"]`,
    );
    if (!slide) return;

    // Bring the new slide fully into view — a plain focus() only nudges the
    // field to the edge, where the fixed bottom HUD covers it.
    slide.scrollIntoView({ behavior: "smooth", block: "center" });

    const prompt =
      prefer === "prompt"
        ? slide.querySelector<HTMLElement>(".lesson-document-prompt")
        : null;
    const target =
      prompt ?? slide.querySelector<HTMLElement>(WRITING_FIELD_SELECTOR);
    // preventScroll so the caret placement doesn't fight the smooth scroll.
    target?.focus({ preventScroll: true });
  });
}
