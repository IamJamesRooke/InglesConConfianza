// The Lesson Builder's one programmatic-focus helper. Every caller that
// needs to move DOM focus to a selection does so through `focusSelection`
// instead of calling `.focus()` on a node itself — see
// docs/design/lesson-builder-editing-model.md §1. This is also the only
// file in `src/lib/lesson-builder`/`src/components/lesson-builder` allowed
// to use `requestAnimationFrame`: a slide's real fields only exist in the
// DOM once React has rendered it as the active (`data-state="editing"`)
// block, one render after the selection that makes it so.

import type { EditingSelection } from "@/lib/lesson-builder/editing";

const WRITING_FIELD_SELECTOR =
  "[contenteditable='true'], input:not([type='button']), textarea";

function resolveFieldElement(
  slide: HTMLElement,
  selection: Extract<EditingSelection, { kind: "field" }>,
): HTMLElement | null {
  if (selection.pieceId) {
    // A specific piece was named — if it isn't mounted yet (a just-created
    // pair, still one render behind), that's a "not found yet, retry"
    // signal, not license to fall back to some *other* piece's field: a
    // sibling piece that happens to already exist would otherwise get
    // wrongly (and permanently, since the caller treats a match as
    // "settled") focused instead of the one actually asked for.
    const piece = slide.querySelector<HTMLElement>(`[data-piece="${selection.pieceId}"]`);
    return piece?.querySelector<HTMLElement>(`[data-field="${selection.field}"]`) ?? null;
  }
  return (
    slide.querySelector<HTMLElement>(`[data-field="${selection.field}"]`) ??
    slide.querySelector<HTMLElement>(WRITING_FIELD_SELECTOR)
  );
}

// Modules aren't part of `EditingSelection` (Phase 1 keeps selection to
// title/block/field within a lesson), so Ctrl+Alt+M's "focus the active
// module's name" goes through this narrow sibling helper instead of a bare
// `.focus()` call in the keymap.
export function focusModuleName(moduleId: string): void {
  if (typeof document === "undefined") return;
  const field = document.querySelector<HTMLInputElement>(`[data-module-name="${moduleId}"]`);
  field?.focus();
  field?.select();
}

// Remembers whatever has real DOM focus right now, so a modal (the keyboard
// help dialog) can hand it back on close — there's no fixed trigger element
// for every way the dialog can open (a chord, or the header menu).
let rememberedFocus: HTMLElement | null = null;

export function rememberFocus(): void {
  if (typeof document === "undefined") return;
  rememberedFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
}

export function restoreRememberedFocus(): void {
  const target = rememberedFocus;
  rememberedFocus = null;
  if (!target) return;
  // The dialog closes by React unmounting it (its own Escape handler
  // prevents the native close so it can run this same path on every close
  // trigger, not just Escape) — that unmount lands on the next commit, not
  // synchronously here, and a still-open native `<dialog>` traps focus
  // against anything outside it. One frame is enough for that commit to
  // land before the restore actually takes.
  requestAnimationFrame(() => target.focus());
}

export function focusSelection(selection: EditingSelection): void {
  if (typeof document === "undefined") return;

  if (selection.kind === "none") {
    // Fully deselected (Escape from a block): no rail, no chrome — park
    // focus on the builder root itself, which carries its own
    // `outline: none` so this never draws a visible ring.
    document
      .querySelector<HTMLElement>("[data-lesson-library-root]")
      ?.focus({ preventScroll: true });
    return;
  }

  if (selection.kind === "title") {
    const lessonId = selection.lessonId;
    const title = document.querySelector<HTMLElement>(`[data-lesson-title="${lessonId}"]`);
    if (title) title.focus({ preventScroll: true });
    // One frame later, confirm focus actually stuck. Most title-focus
    // transitions target a node that's already stable, so the synchronous
    // focus above is the whole story. But `Ctrl+Alt+ArrowUp/Down` moving a
    // lesson across a module boundary calls this *before* React has
    // committed the module switch — the query above still finds the old
    // module's (about-to-be-removed) row and "succeeds" on a node that's
    // gone a moment later, with nothing left to focus the fresh row that
    // remounts in the new module. If the expected title isn't the active
    // element by next frame, fall back to the same retry loop a brand-new
    // lesson uses (its row doesn't exist yet at all, same fix either way).
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.getAttribute("data-lesson-title") === lessonId) {
        return;
      }
      retryFocusTitle(lessonId, 10);
    });
    return;
  }

  // Try synchronously first: Tab/Enter pair-navigation and Escape-to-block
  // target a field or wrapper that's *already* mounted (nothing new was
  // just inserted), and focusing it in the very same tick as the keydown
  // is what makes fast, repeated typing/navigation land in the right place
  // — a blanket requestAnimationFrame here delayed every such transition by
  // a frame, long enough for a fast typist (or Playwright's synthetic
  // typing) to start the next keystroke before the field it was meant for
  // had actually received focus. Only fall back to a (repeated) rAF wait
  // when the target genuinely doesn't exist yet — a slide that just became
  // active this same tick (a sentence swapping from its resting
  // presentation to its editing fields, or a brand-new block/piece).
  const settled = trySettleFocus(selection);
  if (!settled) {
    requestAnimationFrame(() => {
      if (!trySettleFocus(selection)) {
        const slide = document.querySelector<HTMLElement>(
          `[data-document-block="${selection.blockId}"]`,
        );
        if (!slide) return;
        if (selection.kind === "field") {
          // Do NOT park focus on the wrapper here: the wrapper's own
          // onFocus (lesson-document.tsx) writes `{kind:"block"}` whenever
          // it is genuinely the focus target, which would stomp this still-
          // pending field selection before the field it names has even
          // mounted — a table row's or sentence pair's hint input, opened
          // via the lightbulb or Alt+ArrowDown, can still be a frame or two
          // from existing under load. Selection already drives the block's
          // `data-state="editing"` render regardless of DOM focus, so
          // there's nothing lost by leaving focus where it is and just
          // retrying the real field for a few more frames.
          retryResolveField(slide, selection, 10);
          return;
        }
        // Focus the wrapper now so the block renders as active, then keep
        // retrying the real field for a few more frames — under load a
        // single extra frame isn't always enough for the editing grid
        // (several pieces, each with its own fields) to have committed.
        slide.focus({ preventScroll: true });
      }
    });
  }
}

// Attempts the focus (and its scroll-into-view) right now, synchronously.
// Returns false only when the target slide or field doesn't exist in the
// DOM yet, so the caller knows to wait a frame and retry.
function trySettleFocus(selection: Extract<EditingSelection, { kind: "block" | "field" }>): boolean {
  const slide = document.querySelector<HTMLElement>(`[data-document-block="${selection.blockId}"]`);
  if (!slide) return false;
  slide.scrollIntoView({ behavior: "smooth", block: "center" });

  if (selection.kind === "block") {
    slide.focus({ preventScroll: true });
    return true;
  }

  const target = resolveFieldElement(slide, selection);
  if (!target) return false;
  target.focus({ preventScroll: true });
  return true;
}

function retryFocusTitle(lessonId: string, framesLeft: number): void {
  if (framesLeft <= 0) return;
  requestAnimationFrame(() => {
    const title = document.querySelector<HTMLElement>(`[data-lesson-title="${lessonId}"]`);
    if (title) {
      title.focus({ preventScroll: true });
      return;
    }
    retryFocusTitle(lessonId, framesLeft - 1);
  });
}

function retryResolveField(
  slide: HTMLElement,
  selection: Extract<EditingSelection, { kind: "field" }>,
  framesLeft: number,
): void {
  if (framesLeft <= 0) return;
  requestAnimationFrame(() => {
    const target = resolveFieldElement(slide, selection);
    if (target) {
      target.focus({ preventScroll: true });
      return;
    }
    retryResolveField(slide, selection, framesLeft - 1);
  });
}
