# Lesson Builder: final core-writing handoff for SOL

## Assignment

Implement this plan for the desktop Lesson Builder. The owner wants to write lessons with the keyboard, in a quiet editor that visually matches the learner experience. Keep the current visual direction; repair the interaction model. Complete the acceptance walkthrough below before calling the work finished.

Read the repository and `web/AGENTS.md`, relevant installed Next.js documentation, and `docs/teaching-methodology.md`. Preserve unrelated work, especially live edits in `web/data/lessons.json`. Keep Lesson Builder JSON-backed and curriculum PostgreSQL-backed. Do not curate curriculum or rewrite existing lessons as part of this task. Do not add mobile work.

## Final scope boundary

This document supersedes the broader brainstorming. Deliver six outcomes only: readable lesson overview, continuous sentence entry, natural text formatting, accessible deletion and recovery, reliable keyboard/focus behavior, and dependable setup/preview/save/Done.

Do not add explanation-to-practice generation, sentence-building templates, automatic translations, phrase suggestions, curriculum intelligence, teaching-history checks, lesson rhythm analysis, split/join tools, or lesson splitting. Preserve existing supported authoring operations; do not expand their feature set. Add abstractions or dependencies only where necessary to repair the demonstrated interactions. Work locally and do not commit or publish unless asked.

## What the teacher should experience

“I can skim my whole lesson, open exactly the slide I want, write Spanish and English in a steady rhythm, add an explanation, and carry on. I can always tell where I am, how to continue, whether my work is saved, and how to undo a mistake.”

Use three consistent teacher-facing terms:

- **Lesson**: the complete sequence.
- **Slide**: an explanation, sentence practice, or vocabulary table.
- **Sentence piece**: one Spanish prompt and its accepted English answer within a practice slide. For vocabulary, call this a **pair**.

Stop mixing “block,” “content block,” “language block,” and “answer piece” in teacher controls. Internal types can keep their existing names.

## Evidence from the current code

These are code findings, not a claim of a new browser walkthrough:

- `lesson-library.tsx` renders lesson headers but no expanded lesson-content view. `lesson-block-preview.tsx` still contains the earlier partial-preview component and can supply a starting point.
- `sentence-practice-card.tsx` provides no authoring Tab logic between Spanish and English fields. Ordinary DOM order includes help controls. “Remove piece” is hidden in answer details and is unavailable for the last piece.
- `command-palette.tsx` uses `z-50`; the Zen authoring surface uses `z-index: 90`. The palette can open and receive focus underneath the editor. Checking only whether its input received focus misses this defect. Audit preview, help, and other overlays for the same problem.
- Shortcut listeners are split between the page and authoring session. Several focus helpers still reference fields in the retired editor. Some shortcuts intentionally exclude text inputs, although writing is the primary activity.
- `practice-markdown.tsx` directly wraps a DOM range in a mark, without explicitly restoring a neutral typing position. It combines browser editing commands with hand-built DOM mutations and serialization. Recoloring, clearing, selection restoration, and undo need coverage together.
- `overview-markdown.tsx` does not parse the newer Spanish/English mark syntax. Reusing that summary renderer unchanged would expose raw markup.
- Structural undo currently restores snapshots of all lessons. This can discard intervening text edits. It is unsuitable as the safety net for effortless deletion.

## 1. Restore a readable lesson overview

Retain the current module-and-lesson library. Give every lesson a separate **Show content / Hide content** disclosure and an **Edit lesson** action. Expanding a lesson must not launch Zen mode.

The expanded view is a compact, read-only teaching script:

- Show every slide in order with its number and type.
- Render full explanation text with its formatting, no line clamping or raw markup.
- Render sentence pieces as aligned Spanish → English pairs, preserving their order and boundaries. Show vocabulary pairs as rows.
- Include authored instructions, helper text, context hints, accepted alternatives, and success feedback with quiet labels. Empty optional fields take no space.
- Provide an accessible Edit action per slide that opens that exact slide in Zen mode. Returning restores the expanded lesson and library scroll position.
- Allow several lessons to remain expanded, with one **Show all content / Hide all content** control. Use natural page scrolling, not a separate scrollbar per lesson.

Share inline formatting semantics with the learner renderer; allow a compact typography variant. Do not maintain another Spanish/English-mark parser in the overview. Keep teacher-only metadata distinguishable from student text.

## 2. Make sentence composition the primary path

Creating a practice slide focuses the first Spanish field. The default writing sequence must be exactly:

`quiero → Tab → I want → Tab → hablar → Tab → to speak → Tab → inglés → Tab → English`

Each arrow is one Tab press. No menu, hint button, plus button, or extra Enter is inserted into that sequence.

Define the field behavior explicitly:

| Location | Tab | Shift+Tab |
| --- | --- | --- |
| Spanish field | English answer in the same piece | Previous piece’s English answer; on the first piece, leave the writing sequence |
| English field with a following piece | Following piece’s Spanish field | Same piece’s Spanish field |
| Final English field in a completed pair | Show one new empty pair and focus its Spanish field | Same piece’s Spanish field |
| Empty trailing pair | Spanish goes to English; Tab from its empty English exits to slide controls | Return through the existing fields |

Implementation details:

- Keep the trailing empty pair as an editor affordance until the teacher types. It must not silently become stored content, a learner-visible blank, or a validation error.
- Never discard a partially written pair. If Spanish exists and English is blank, preserve it as a draft and show a quiet completeness cue.
- Tab from an incomplete final English field leaves for controls rather than generating further empty pairs. Do not block focus with validation.
- Repeated Tab presses must not create a chain of empty records. Backward traversal never creates content.
- `Escape` leaves the writing sequence and focuses the slide surface; normal Tab then reaches every editor control. This provides an explicit keyboard exit from the accelerated writing path.
- Preserve ordinary caret movement and text selection within inputs. Do not advance just because the English text happens to match an answer; that is learner behavior.
- Use stable piece IDs and mounted-element refs. After adding a piece, focus it after React commits. Avoid arbitrary timeouts and refs belonging to the hidden old editor.
- After moving between slides, focus the remembered field for that slide when available, otherwise its first meaningful editable field. Scroll only enough to keep it visible.
- Use the same writing sequence for vocabulary pairs. Keep existing pairs visible in learner layout; extra pairs can wrap naturally without hiding the next focused field.

## 3. Make optional editing reachable without interrupting typing

The active sentence piece gets a discreet **Piece options** control, visible on keyboard focus as well as hover. It exposes context hint, accepted alternatives, and delete. Preserve existing piece reordering through keyboard-accessible controls or commands; do not add new piece-manipulation features. Use **Pair options** for vocabulary.

Hints and alternatives stay outside the primary Spanish/English Tab sequence. They are reachable through Piece options and contextual commands. Opening either focuses the requested field; closing it returns to the exact piece and field. A context hint already on the canvas remains directly editable in its learner position.

Question, hint, and success states should have accurately labeled previews. Keep actual student-visible content editable where it appears; use a compact options panel only for configuration such as accepted alternatives. Changing the preview state must not overwrite lesson content.

## 4. Make deletion and recovery trustworthy

Expose both **Delete sentence piece** and **Delete slide** with explicit, different names. Both must work using only the keyboard via contextual commands and focusable options. Do not rely on an undiscoverable Delete binding or a mouse-only icon.

- Delete a piece: focus the following piece’s Spanish field, or the previous piece if it was last.
- Delete the last piece: show the unstored empty-pair affordance. The slide remains an editable draft.
- Delete a slide: open the following slide, or the previous one; if none remain, return to Lesson Setup.
- After deletion, show a small “Sentence piece deleted — Undo” or “Slide deleted — Undo” message. Do not interrupt each content edit with a browser confirmation dialog.
- First implement reliable targeted structural undo. Store the removed entity, parent ID, and position, or equivalent inverse operations. Undoing a deletion must preserve text subsequently written in other fields. Whole-course snapshot restoration does not meet this requirement.
- Native/editor text undo belongs to the focused text field. An explicit Undo deletion action restores the structural operation without ambiguously hijacking text undo. Structural undo/redo is available from the slide surface and command menu.
- Preserve the existing confirmation behavior for whole-lesson/module deletion; this task does not require redesigning those destructive boundaries.

## 5. One keyboard system with visible instructions

Create one small authoring command registry for command IDs, labels, handlers, enabled state, scope, and shortcuts. Generate the palette and help labels from it. Replace competing legacy authoring listeners when their functionality is migrated. Do not build a general-purpose shortcut framework.

The active scope is the topmost dialog/menu, then text editor or sentence composition, then slide, then library. Consumed keys never trigger a lower scope. Composition events must be respected.

Use a small primary vocabulary:

| Keys | Action |
| --- | --- |
| Tab / Shift+Tab | Follow the writing sequence or move between ordinary controls |
| Ctrl/Cmd+K | Open visible, focused commands from any authoring field |
| Ctrl/Cmd+Enter | Finish the current writing moment and open Add next slide |
| PageUp / PageDown | Navigate Setup, slides, and Ending when no menu/dialog owns the key |
| Escape | Close one layer or leave text editing, preserving content |
| Ctrl/Cmd+S | Save now |
| Ctrl/Cmd+Z | Undo text while writing; undo structure from the slide surface |
| Ctrl/Cmd+Shift+Z | Redo in the same scope |
| Ctrl/Cmd+Shift+1 / 2 | Mark selected text Spanish / English |
| Ctrl/Cmd+Shift+0 | Clear selected inline formatting |
| Ctrl/Cmd+B | Standard bold behavior in the text editor |

**Intentional change:** Ctrl/Cmd+Enter currently launches preview. Replace that binding consistently with Add next slide. Preview remains a visible **Try lesson** action and a searchable command. Do not leave both handlers active.

After Ctrl/Cmd+Enter, the Add menu offers Explain, Practice, Vocabulary, Explain + practice. Arrow keys choose; Enter creates and focuses the first field. Default to the last selected type within the session. Enter alone still adds a paragraph in explanations.

Additional actions—hints, alternatives, delete, duplicate, reorder, outline, setup, lesson ending, and Done—must be searchable in the palette. Teachers can type ordinary verbs such as “delete piece” or “add hint.” They need not memorize a separate combination for every operation. Display the current action target in destructive commands.

Keep a narrow context-sensitive footer, for example:

`Tab: English · Shift+Tab: previous piece · Ctrl+Enter: next slide · Ctrl+K: commands`

The footer changes when English, an explanation, or an options panel is focused. Include labeled **Commands** and **Keyboard help** buttons, not just an unexplained keyboard icon or question mark. Render platform-appropriate modifier labels after hydration. Include full modifiers in formatting-toolbar hints.

Fix overlays through a consistent portal/layer scheme. Command palette, help, and learner preview must appear above Zen, contain focus, and restore focus and text selection when dismissed. Commands that navigate elsewhere transfer focus to their destination instead. Long command lists scroll the active result into view, and disabled commands do not become dead-end selections.

Test actual browser key input and visibility, not just dispatched JavaScript key events or `activeElement`. If a browser/OS reserves a proposed shortcut, select and document a tested alternative; retain the visible command entry point.

## 6. Treat Spanish and English formatting as finite spans

The core behavior is **mark these words, then carry on normally**.

- Select text and choose Spanish/English: apply that language, then collapse the caret immediately after the span in neutral text. The next space and word are neutral.
- Language formatting requires a selection, made with the mouse or standard keyboard selection. Without a selection, show a concise “Select text to mark Spanish/English” hint; do not enter a sticky language mode. Automatic word selection is outside this pass.
- Editing inside a highlighted phrase preserves its language. Space inside “I want” must not split the phrase or exit the mark. Boundary behavior and interior behavior are different cases.
- Applying English to Spanish text replaces the language mark; applying the same mark again does not nest another mark. Clear removes language and other supported inline formatting from the selection, including existing marks.
- Keep Spanish/English mutually exclusive. Preserve supported bold/italic composition and legacy neutral highlights.
- Undo and redo must correctly cover typing, marking, recoloring, and clearing. Saving/reloading must preserve content and formatting, including paragraph boundaries, accented Spanish, and punctuation.

Choose the smallest maintainable implementation that passes these behaviors together. The existing combination of direct DOM mutations and browser editing commands needs particular scrutiny for undo, nested marks, and serialization. If it cannot reliably meet the acceptance checks, replace just that editing surface with a minimal structured rich-text implementation using the already installed dependencies (Lexical is present). Keep learner typography and shared rendering; do not introduce a stock editor toolbar. Inspect installed APIs before implementation. Preserve import/export of existing JSON markdown strings, including legacy neutral highlights. Do not migrate saved lessons or introduce a second canonical content store. A caret-only patch without testing history and mark replacement is insufficient.

## 7. Close the remaining flow gaps

- Keep Lesson Setup first, with name and searchable concepts. A new lesson begins there; existing lessons resume their editing location.
- Inserting from Setup inserts before the first slide; inserting from Ending appends. Inserting while editing a slide goes immediately after that slide. Do not derive all three from a stale active block index.
- Keep lesson ending review and a clear Done action. Review missing title, concepts, empty explanations, and invalid prompt/answer pairs consistently with library status. “Ready” must mean the same thing in both places.
- Preview and its keyboard command must share behavior: if incomplete, show the specific problem and a jump-to-field action; never silently ignore the command.
- Autosave must preserve caret/focus. Show unsaved, saving, saved, and retry states accurately. Done must wait for saving and remain open with an actionable error on failure.
- Scope font sizing, field widths, overlays, and scroll behavior for desktop viewports including 1280×720. Make contextual hints readable without adding permanent sidebars or moving the sentence around while typing.

## Implementation order and files

1. Fix overlay visibility, shortcut ownership, active-field tracking, and stale focus refs. Primary files: `command-palette.tsx`, `lesson-authoring-session.tsx`, and the builder `page.tsx`.
2. Implement and test Spanish/English Tab composition, trailing empty pair, and contextual piece controls in `sentence-practice-card.tsx` and related mutations.
3. Implement targeted structural undo, visible deletion, and reliable focus after delete/reorder.
4. Implement semantic rich-text behavior and content round-trip tests in `practice-markdown.tsx` or a focused authoring editor module. Keep shared presentation in `learner.css` and the learner renderer.
5. Restore full lesson summaries in `lesson-library.tsx` and `lesson-block-preview.tsx`; consolidate the duplicated overview formatting renderer.
6. Consolidate command/help copy, insertion/preview/save behavior, and remove unreachable legacy authoring JSX/listeners after migrating the necessary actions. Remove that code incrementally, not as a prerequisite rewrite of the whole page.

## Completion gate: write a lesson entirely with the keyboard

Use isolated test data and persistence. Do not test by racing a refresh against autosave on the owner's live lessons.

1. Expand two lessons in the library; read every authored field; open a specific slide; return to the same expanded library position.
2. Create a lesson, name it, choose its concepts, and add an explanation.
3. Type an explanation, mark Spanish and English by keyboard, and continue with neutral text. Edit a multiword highlight internally, recolor it, clear it, undo/redo, save, and reload. Confirm there are no raw tokens or stray characters.
4. Add Practice. Enter `quiero / I want`, `hablar / to speak`, and `inglés / English` using only Tab between fields. Confirm no help buttons interrupt and no extra empty pair persists. Repeat in vocabulary layout.
5. Shift+Tab back to fix a word. Add an alternative and a context hint through commands; return to the original field.
6. Delete the middle piece, type elsewhere, then undo deletion. Confirm the later typing survives. Delete the last remaining piece and recover. Delete/undo a whole slide and confirm order and focus.
7. Open Ctrl/Cmd+K from Spanish, English, explanation, hint, and Setup. Assert the palette is visibly above the editor, accepts typing, runs the correct scoped action, and closes with focus restored. Do the same visibility check for preview and help.
8. Insert a slide from Setup, from the middle, and from Ending. Verify placement and focus.
9. Preview an incomplete lesson and get an actionable result; complete it, preview as a learner, finish editing, and reload to verify saved data. Simulate a save failure and confirm Done does not lose edits.
10. Check ordinary text selection, undo, accents/composition input, keyboard exits, and full control access at desktop sizes. Compare editor and learner screenshots for the same content and learner state.

Automate the meaningful interaction regressions with the project's available browser-test tooling and isolated fixtures. Run appropriate unit tests, lint, type checking, and production build. Existing presentation-course tests depend on live lesson content; document that limitation instead of rewriting owner data to make them pass. Report what was actually browser-tested and any remaining limitations. A successful build alone is not the completion gate.
