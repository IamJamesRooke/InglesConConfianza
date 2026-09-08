# Lesson Builder: make writing feel natural

Proposed September 8, 2026. Sonnet implementation handoff; no application changes made during this review.

## Direction

The owner wants to enjoy writing lessons: a minimal document where ordinary typing, selection, formatting, and keyboard navigation feel familiar to someone who uses Microsoft Word.

Keep the expanded teaching document. Make its next action obvious and its caret dependable. Success means the teacher can concentrate on what to teach instead of operating the editor. Fewer visible buttons alone will not accomplish this: essential actions need clear names and nearby cues.

This refines `lesson-builder-document-editor.md`. It does not revive Zen mode. Implement the passes below separately; try Pass 1 with the owner before undertaking the rest. The proposed interaction choices are a starting point for that trial, not settled owner preferences.

## What the code reveals

This is a source review, not a browser usability test. No server responded at localhost:3000. Reproduce the relevant behavior in a browser before changing it.

- `lesson-document.tsx`: explanations receive an empty placeholder. Insertion choices say “Note / Fill-in-the-blank / Word list,” while help says “Explanation / Sentence.” Shortcut letters exist but are not displayed.
- `lesson-library.tsx`: new-lesson creation focuses its title; the empty document's insertion effect also schedules focus. There is no explicit title-to-body transition.
- `lesson-document.tsx`: Spanish/English Tab handling already exists. The trailing Spanish affordance lacks explicit reverse navigation. New-piece entry replaces the input on its first change, which needs rapid-typing and composition checks.
- The outer slide capture handler consumes Escape before the insertion chooser can handle it. Closing insertion does not explicitly restore the originating caret.
- Sentence fields are single-line inputs. Long authored phrases cannot wrap naturally.
- `page.tsx`: document-wide Undo intercepts text editing; Ctrl/Cmd+R is assigned to Redo. `practice-markdown.tsx` suppresses incoming rendering while focused. Together these create a risk of visible explanation text diverging from reducer history and being written back on blur.
- `reducer.ts`: typing coalesces without time or focus boundaries, and patch field names are absent from the coalescing key.
- Preview is rendered from the draft, but its close callback only clears the preview ID; precise caret restoration is not implemented there.

## Working contract

Use **Explanation**, **Sentence**, and **Vocabulary table** consistently in insertion, help, and accessible labels. A sentence contains Spanish/English pieces; a table contains rows. Preserve their existing learner behavior and explicit slide boundaries.

| Context | Expected behavior |
| --- | --- |
| New lesson | Focus title once. Enter starts writing its first explanation. |
| Explanation | Enter adds a paragraph; Shift+Enter adds a line break. Ordinary selection, arrows, copy/paste, bold, and italics work. |
| Any slide's main writing field | Ctrl/Cmd+Enter opens “Next slide” immediately after this slide. Explanation predicts Sentence; practice predicts Explanation. Nothing is inserted until selected. |
| Next-slide chooser | Show labels and E/S/V shortcuts. Arrows choose; Enter inserts and focuses the first writing field. Escape cancels and restores the original selection. |
| Sentence or table | Tab: Spanish → English → next piece/row. Shift+Tab reverses the same path, including the trailing affordance. |
| Completed final pair | Tab offers one empty next pair. Persist it only once text is entered. An incomplete/empty final pair permits exiting; no infinite blank creation. |
| Escape in a writing field | Focus the slide's labeled Actions button. Tab then uses ordinary control navigation. Escape inside a nested control closes that control first. |
| Preview closes | Return to the originating field, selection, and scroll position. |

Keep visible equivalents: “Next slide” with its shortcut, an accessible Actions button, and concise guidance when a surface is empty. Do not require memorizing shortcuts or opening help to discover how to continue. Plain Enter must never silently split an explanation into slides.

## Pass 1 — finish one uninterrupted writing loop

Primary files: `web/src/components/lesson-builder/lesson-document.tsx`, `lesson-library.tsx`, and the Lesson Builder rules in `web/src/app/learner.css`.

1. Give new-lesson focus one owner. Focus the title; Enter creates/focuses the first explanation only if the lesson has no slides. If it has content, Enter focuses the first slide without creating another. Existing title edits must not change content. Keep a visible first-slide chooser for teachers who want to begin with practice.
2. Add a real empty explanation prompt: “Write your explanation…” and one quiet nearby “Next slide · Ctrl/⌘ Enter” cue. Placeholder text must never enter saved content.
3. Implement the insertion contract above. Save the originating field/selection before opening; target lesson/slide IDs, not array indices or the last vaguely active element. Avoid competing animation-frame focus effects. Scope keyboard handlers to their owning surface and respect handled events and composition.
4. Complete forward/reverse pair navigation. Ensure rapid typing, pasted text, accents, and IME composition survive creation of the next pair exactly once. Preserve partially written drafts. Explain “next piece in this sentence” versus “next slide” beside the active entry point.
5. Replace sentence inputs with wrapping, content-sized fields while retaining Spanish above English and table column alignment. Enter within these fields must not create slides or rows. Keep ordinary editing and selection behavior.

Acceptance: starting at Create lesson, write a title, two explanation paragraphs, a two-piece sentence, another explanation, and a three-row table without touching the mouse or opening Keyboard help. Reverse through pairs with Shift+Tab. Cancel insertion from the middle of a paragraph and continue at that caret. Reload and verify exact text and boundaries. Retest with two expanded lessons to catch focus going to the wrong lesson.

Stop after this pass for an owner writing trial. Ask for the first moment they had to think about the interface. Do not spend the remaining budget on cosmetic polish before that trial.

## Pass 2 — make editing and recovery trustworthy

Primary files: `web/src/app/admin/lesson-builder/page.tsx`, `web/src/components/practice/practice-markdown.tsx`, `web/src/lib/lesson-builder/reducer.ts`, and the document components.

1. Remove Ctrl/Cmd+R interception. Support ordinary platform Redo conventions. Scope builder shortcuts so search, concept editing, dialogs, and learner preview keep their own keyboard behavior.
2. Use native text undo inside inputs, textareas, and explanation contenteditable; do not also dispatch reducer Undo for the same keystroke. Ensure native undo/redo updates application state through the editor's input path. Keep reducer history for explicit document Undo/Redo controls and structural actions outside text fields.
3. When explicit document Undo/Redo changes a focused explanation, synchronize the visible editor with the restored value and invalidate stale saved ranges. Do not let blur serialize an obsolete DOM over the restored draft. Ordinary typing updates must still preserve the caret. Add focus/session boundaries and field identity to reducer coalescing so revisiting a field does not undo an entire writing session.
4. Retain targeted Undo deletion: delete a slide, type elsewhere, restore the deleted slide without discarding that typing. Restore focus to a surviving field/action after deletion.
5. Capture field identity, selection offsets, and scroll before draft preview; restore on close with a safe fallback if the target no longer exists. Test keyboard opening and closing as well as clicking.
6. Verify existing autosave with edits to two lessons while requests are pending and one failed save. Repair only reproduced failures. “Saved” must mean the current content is acknowledged; retry must retain drafts. Provide a visible Retry action on error.

Acceptance: type → undo → redo in each writing surface; format → undo; explicit document Undo while an explanation is focused → blur → reload; delete → type elsewhere → targeted restore; preview → close → continue mid-sentence; failed save → retry → reload. Check both visible content and persisted content. These are correctness gates, not optional polish.

## Pass 3 — make the document quiet and familiar

Primary files: the same document/library components, `practice-markdown.tsx`, and scoped `learner.css` rules.

1. Keep lesson title, a labeled “Try lesson,” and one Actions disclosure visible. Put duplicate, delete, and module movement inside Actions. Use the same pattern for slide actions. All operations remain keyboard reachable; focused controls must be visible. Do not hide essential actions behind hover alone.
2. Keep “Covers” as optional teacher metadata. An empty concepts line should be compact and should never be a required step between title and writing. Preserve existing concept search.
3. Group optional sentence annotations under a labeled Options disclosure. Authored hints, help, alternatives, and success messages remain readable beside their owners. Opening an option focuses it; canceling an unused empty option removes its placeholder. Keep these fields out of accelerated pair navigation.
4. Make Ctrl/Cmd+B and Ctrl/Cmd+I work on selections and at a collapsed caret as ordinary formatting toggles. The current bold handler requires a selection. Keep semantic Spanish/English marking selection-based, with neutral typing afterward. Retain one small discoverable formatting surface; do not introduce a ribbon or duplicate toolbars. Verify any existing selection menu can be reached using the keyboard without losing the selection.
5. Keep the active insertion hint near the writing position. Use readable text, stable spacing, visible focus, and natural page scrolling. Avoid arbitrary animation, extra panels, or a visual redesign unrelated to writing.

Acceptance: the owner can discover insertion and formatting without reading documentation; write the Pass 1 lesson, add one hint and alternative answer, preview it, and resume. Record remaining hesitations instead of claiming that subjective “joy” has been proven by tests.

## Constraints and economical delivery

- Read root/web AGENTS.md and relevant installed Next.js guides before code changes. Read the teacher-authoring section of `docs/teaching-methodology.md`; preserve short explanation → immediate retrieval teaching sequences.
- Keep JSON lesson persistence and PostgreSQL curriculum boundaries. No curriculum edits, schema changes, content generation, migration, new editor framework, or dependency upgrades for this plan.
- Preserve the owner's `web/data/lessons.json`. Use isolated test data for browser authoring; never restore a whole old file over newer owner edits. Do not commit or publish unless asked.
- Reuse existing mutations, rendering semantics, draft preview, and save machinery. Extract a small focus helper if needed; avoid a general command framework.
- Add focused regression tests for changed history/state logic in `web/tests/unit/lesson-mutations.test.ts` or the existing relevant suite. Keyboard, caret, composition, and layout require a real browser walkthrough. Use existing browser tooling; do not build a new testing platform.
- After each pass, run relevant unit tests and lint from `web`; run build before handing back an integrated change. Report any checks that could not run. Do not change unrelated code to clear pre-existing failures.
- Report only: changes, checks, remaining friction, and any material limitation. Update the current design document only after behavior has been implemented and verified.

## Copyable Sonnet assignment

> Implement Pass 1 only from `docs/design/lesson-builder-writing-flow.md`. Read its evidence, working contract, and constraints first. Reproduce the relevant current behavior, make the smallest coherent change, and complete its keyboard acceptance walkthrough using isolated lesson data. Preserve owner content and unrelated changes. Do not implement Passes 2–3, add dependencies, commit, or publish. Report changes, verification, and remaining friction briefly. If a later-pass defect prevents the Pass 1 walkthrough, document it explicitly rather than silently expanding scope.
