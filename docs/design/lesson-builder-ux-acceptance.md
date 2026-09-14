# Lesson Builder UX acceptance checklist

Status: proposed acceptance gate; checks below have not yet been verified for the current redesign.

## Goal

A low-tech teacher can prepare a lesson confidently without learning hidden controls. Preserve inline course-binder editing, the teaching methodology, and separate JSON lesson persistence. Desktop authoring is the initial target.

## Teacher workflow

Test with disposable lesson content in an isolated store, not the owner's authored lessons.

- [ ] Create a lesson: the next writing action is apparent and the first useful field receives focus.
- [ ] Write a short explanation and format Spanish/English examples using visible controls, without memorizing shortcuts. Selection/caret stays usable and formatting survives save/reload.
- [ ] Enter three Spanish/English sentence pairs using both visible controls and keyboard flow. Language labels remain understandable without color; controls do not unexpectedly shift the writing position.
- [ ] The retired sentence-level “help on request” field is absent from authoring and learner practice. Legacy `helperText` remains storage-compatible and inert; per-piece callouts and learner answer reveal remain available.
- [ ] The optional instruction field is always visible directly above sentence pairs/tables, supports empty, filled, cleared, and reloaded states, and renders to learners only when non-empty.
- [ ] The retired after-correct message is absent from authoring and learner practice. Legacy `answerFeedback` remains storage-compatible and inert; normal success checks, progression, and lesson completion remain available.
- [ ] Preview the lesson, then return to the same editing location with focus and selection restored where applicable.
- [ ] Undo an editing mistake. Save progress, success, and failures are distinguishable; failed saves offer a clear recovery action.
- [ ] Open any visible lesson with one click, including from a collapsed module overview. Opening one lesson does not unexpectedly open every sibling.

## Visual direction

- [ ] Darker blue provides the visual anchor for primary actions, headers, and focus.
- [ ] Reading/writing surfaces are clean, readable neutrals; no peach/yellow decorative wash.
- [ ] Add lesson is an ordinary secondary action, not a full-width warning-colored strip. No decorative red module divider.
- [ ] Green communicates actual success. No authored or empty feedback rectangle appears before, during, or after an answer.
- [ ] Spanish/English highlighting is consistent and supplemented by non-color cues where needed.
- [ ] Color values live in central theme definitions; component styles consume semantic tokens.
- [ ] Text contrast, focus visibility, keyboard access, and comfortable pointer targets are verified on the affected surfaces.

## Evidence and completion

For each completed check, record observed behavior, relevant automated test results, or screenshot paths in the implementation handoff. Distinguish browser verification from code inspection. Report failing or untested cases explicitly; a passing build alone does not demonstrate good UX.

Review one representative explanation, one multi-pair sentence, a vocabulary table, and the learner practice states. Preserve existing unrelated work and avoid concurrent edits to overlapping files.

## Next priority decision

Ask the owner which real preparation task costs the most effort: explanation writing, sentence-pair entry, or sequence organization. Do not assume the answer or add features until the current acceptance gate has been reviewed.
