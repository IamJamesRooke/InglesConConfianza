# Lesson Builder as an editable teaching document

Implemented September 8, 2026. This direction replaces the separate Zen editing workflow in `lesson-builder-teacher-flow.md`. Its useful requirements for formatting, keyboard entry, recovery, and saving still apply.

## Intended experience

“I open a module, read my lessons, and type directly into them. What I write becomes the lesson the learner practices.”

Use the current expanded lesson as the visual starting point: white background, compact readable text, aligned Spanish and English, generous empty space, and very little interface. Module information is always visible. All lessons start expanded, including newly created lessons; teachers may hide individual lesson content for navigation.

The document contains structured slides internally, but teachers should not have to manage a card editor. Slide boundaries remain subtle and become explicit when focused, moved, or inserted. Student playback still presents those slides in sequence.

An empty module explains the core rhythm and offers one clear Create lesson action. A new empty lesson opens its three item choices immediately and focuses its title. Empty explanation and sentence surfaces show short, temporary instructions that disappear once writing begins. A labeled Keyboard help button opens the full workflow and shortcut reference in a modal, so help remains discoverable without permanently occupying the document.

## Layout and interactions

1. **Lesson heading.** Click the title to rename it in place. The number doubles as a discoverable drag handle. Keep a quiet Try lesson action and an inline Actions disclosure. Remove the arrow that launches editing, separate Edit/Done controls, setup screen, full-screen session, and floating menus.
2. **Covered concepts first.** Put an editable “Covers” line immediately under the title, before any teaching content. Reuse curriculum search and existing concept references. Render selected concepts as restrained text; reveal add/remove controls on interaction. Module concepts can sit under the module heading in the same style. These lines are teacher-only.
3. **Continuous content.** Clicking any passage places the caret there. No nested card borders, permanent type badges, or per-slide toolbars. Only the active passage gets a faint focus treatment and a small margin control. Focus styling must not change text dimensions or push surrounding content around.
4. **Quiet insertion.** A small plus appears between passages on hover or keyboard focus; keep “Add to lesson” visible at the bottom. It offers exactly Explanation, Sentence, and Vocabulary table in an inline row. Ctrl/Cmd+Enter opens the same row after the active item and predicts Sentence after an explanation, or Explanation after practice. Arrow keys choose, Enter adds, letter keys add directly, and Escape closes. Enter in an explanation creates a paragraph normally.

### Explanations

Edit formatted text directly in the rendered explanation, without a source mode, toolbar, or floating selection menu. Preserve paragraphs, bold, italics, and Spanish/English highlighting. Ctrl/Cmd+Shift+1, 2, and 0 mark selected text Spanish, English, or clear formatting; Ctrl/Cmd+B applies bold. Language highlighting applies to selected words and subsequent typing outside the selection returns to neutral formatting.

### Sentences

Retain the screenshot's Spanish-above-English arrangement. Each sentence piece is an aligned pair; adjacent pieces remain visibly grouped into the sentence they form. Fields look like text until focused and grow with their content.

The writing rhythm is Spanish → Tab → English → Tab → next Spanish. Shift+Tab retraces it. After the last completed pair, Tab offers one empty pair. That empty affordance is not saved until typing begins; partially written pairs are retained as drafts. Tab from an incomplete or wholly empty final English field exits to controls instead of producing more empty pairs. Escape leaves the accelerated writing sequence; ordinary keyboard navigation reaches all controls.

Use subtle focus-only indications to distinguish “next piece in this sentence” from “add a new sentence slide.” Never infer slide boundaries from punctuation or silently combine existing pieces.

### Tables

Use a simple Spanish/English table with understated alignment or rules. Click any cell to write. Tab moves Spanish → English → next row's Spanish, using the same empty-row and draft rules as sentences. Reveal row options at the margin. Preserve existing vocabulary-table data and learner behavior.

### Hints and congratulations

The active sentence reveals faint inline actions for context hint, helper text, success message, and accepted alternatives. Piece-specific actions target the selected pair explicitly. Empty optional fields take no space.

Adding an option opens a small inline annotation beneath its owner and focuses it. Existing authored annotations remain visible as quiet, editable secondary text with a small label identifying their learner state. Context hints stay adjacent to their piece; help and success text remain distinguishable because learners encounter them at different times. Closing an unused empty annotation removes its placeholder.

“Almost invisible” applies to the controls, not to authored teaching content. Keyboard focus reveals the same controls as hover. Keep lesson completion as the existing generated learner state; the current data model supports sentence success messages, not a custom lesson-ending message. Separate lesson-ending customization would need a further decision.

### Moving and recovery

Drag lessons by their number/heading handle, with a compact drag image and clear insertion marker. Text selection inside the document must never start a drag. Support moving within and between modules, including empty modules; retain keyboard-accessible Move earlier/later and Move to module actions. Temporarily compact drop targets during a drag if necessary, then restore expansion and scroll position on drop or cancellation.

Slides and sentence pieces retain reorder, duplicate, and delete through inline controls. Offer targeted Undo deletion that preserves subsequent edits elsewhere. Whole-lesson and module deletion use an inline Yes/Cancel confirmation rather than a browser dialog.

## Engineering approach

The current `lesson-library.tsx` owns expansion but renders `lesson-block-preview.tsx`, which flattens explanation paragraphs, strips some formatting, and joins sentence pieces. Use its appearance as a reference; replace its lossy summary path with faithful editable rendering.

Use a focused lesson-document component and small explanation, sentence, and table editing surfaces. Reuse shared formatting semantics, established mutations, concept search, and learner preview. Each explanation is its own contenteditable region; the module never becomes one unrestricted contenteditable element.

Keep one course state and existing JSON persistence. Bind all mutations, focus refs, options, and commands to lesson/slide/piece IDs. The former single-slide selectors, Zen session listeners, and large Markdown editor are removed. The lightweight rendered explanation surface remains editable at all times.

Audit autosave for editing several lessons before earlier requests finish, reordering during saves, newly created drafts, and failed requests. Show one quiet Saving/Saved/error status, retain dirty state on failure, and preserve navigation protection. “Saved” must describe acknowledged current content. Preview must use the current draft and restore the exact writing position on close.

## Delivery sequence

1. Build a working vertical slice: expanded lesson, inline title/concepts, explanation editing, sentence Tab flow, and save/reload. Check its visual density against the supplied screenshot.
2. Complete table editing, optional annotations, insertion, reorder, duplication, deletion recovery, and draft preview in the document.
3. Wire lesson dragging and multi-lesson persistence. Remove Zen UI, state, CSS, session-only shortcuts, and unreachable legacy editing paths once their supported operations are covered. Update the prior design guidance and teacher-authoring methodology to match the document workflow.
4. Verify browser interactions and learner playback, then run relevant unit checks, lint, and build. Preserve the owner's existing `web/data/lessons.json` edits throughout development.

## Completion checks

- Open a module and immediately read every lesson; edit any visible passage without opening another editing surface.
- Create an explanation, a multi-piece sentence, and a table with the keyboard; reload and recover exact content, boundaries, formatting, and order.
- Add and revise a context hint, helper text, alternative answer, and success message without interrupting the primary Tab flow.
- Edit two lessons rapidly, reorder them while changes save, and verify no stale response loses text or changes course order. A failed save remains clearly recoverable.
- Drag a long lesson within/across modules, cancel a drag, and perform equivalent keyboard moves without losing drafts or text selection behavior.
- Delete a slide, type elsewhere, and undo deletion without reverting that typing.
- Try the current draft as a learner: formatting, sentence-piece boundaries, table behavior, help, accepted answers, success feedback, and slide sequence match the authored intent. Closing preview restores the caret and scroll position.
- At rest, the page still resembles the supplied simple expanded lesson, with no permanent forest of controls. No Zen launch or alternate editing path remains.
