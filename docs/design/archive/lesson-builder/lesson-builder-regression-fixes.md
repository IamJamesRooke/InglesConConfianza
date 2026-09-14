# Exact regression-fix contract

This owner-approved follow-up supersedes conflicting toolbar, menu and insertion-seam details in lesson-builder-finishing-plan.md. Current batch is DONE (/tmp/lesson-density-final.md); this is a bounded correction, NOT a new design pass. Retain composed resting sentences, editing-only hints, compact gray explanations, left-aligned tables, current content/IDs/history/persistence.

## E1. Slide actions (ALL slide types)

Restore upper-right DRAG HANDLE, DUPLICATE ICON, DELETE ICON, in that order. Desktop: reveal on slide hover OR focus within slide; not only after entering editing. Resting and unhovered: not visible, no reserved header row or vertical space. Actions must not cover/intercept text or formatting. Use safe horizontal clearance or gutter, not more slide height. Tooltips/accessibility names identify action and slide. On touch show usable compact actions. Existing drag interaction preserved; keyboard reorder support retained without visible up/down arrows (existing shortcuts or keyboard-operable handle). Remove duplicate slide controls from editing toolbars. DELETE must retain existing undo/recovery. No permanent 'Slide N · Type', 'Reorder', 'Duplicate', 'Delete slide' textual toolbar. Existing small numbered gutter stays.

## E2. Explanation editing

Rest: authored explanation on normal-sized light-gray surface with modest padding; NO toolbar footprint.
Active: same content surface PLUS ONE compact formatting row: Spanish, English, Normal, B, I. No permanently displayed shortcut key strings. B/I accessible names Bold/Italic; shortcuts in tooltip/help. Slide management is E1, NOT another toolbar. No bordered outer control panel, lift or extra shadow. Formatting row takes only its needed flow height and never overlaps next slide. Preserve actual authored bold/italic/language spans, caret/range during toolbar click, typing mode, Escape, and click-next-slide behavior. Do not rewrite lesson text.

## E3. Sentence editing

Rest: composed Spanish/English sentences only, plus authored instruction if present; no hints/tools/empty fields.
Active: bilingual pieces + one Add pair. Slide management is E1. Remove the large wrapping bordered management toolbar, repeated slide title/type, Reorder text, and gratuitously repeated selected-word label. Selected-pair tools: compact Add hint (or Edit hint), Alternatives, delete-pair icon. Accessible owner association retained without printing an extra ambiguous word. Pair tools must not expand individual pair widths. One modest Add instruction action, not unsolicited empty textarea. Existing hint pills only while editing and clickable to edit. Keep nested/main Escape and state switching intact.

## E4. Insertion seam: zero reserved CONTROL space at rest

REST: no separator line, no icons/labels, no insertion row min-height/padding/margin reserving control space. Ordinary compact inter-slide document spacing remains and supplies a discoverable hover hit area. Do not treat opacity:0 + 18px/32px min-height as meeting this requirement.
HOVER OR KEYBOARD FOCUS: reveal the subtle line AND all three direct icon+label buttons TOGETHER: Table, Sentence, Explanation. Line must remain visible while actions are shown (may flank actions). Expand flow space only while revealed, enough for comfortable targets, no overlay across neighboring text. Pointer can move from seam center to each button without losing hover or oscillating. Collapse when neither hovered nor focus-within and not actively engaged. No click-to-open dropdown. No invisible click-active buttons at rest.
Keyboard: reach seam through focusable accessible trigger/region that reveals on focus without permanent row height; then three named choices, Escape leaves/collapses without trapping focus. Touch: explicit usable equivalent (compact trigger acceptable); no hover-only inaccessible UI. Empty lesson/end insertion stays discoverable. Test exact insertion indices and focus-new-slide. Do not confuse this with lesson/slide actions: insertion choices KEEP short visible labels.

## N1. Lesson header

Remove ellipsis popup/menu for Duplicate/Delete. Restore direct icon buttons Preview, Duplicate, Delete, with tooltips/accessibility labels. Move to module stays REMOVED, no replacement/new drag feature. Preserve confirm/undo semantics and existing mutations. Screenshot d519… is LESSON header, E1 is individual SLIDE controls.

## N2. Module controls

Remove visible module up/down arrow buttons. Preserve current drag handle/reorder behavior and provide existing-equivalent keyboard access without permanent arrows. Do not redesign navigation/search/collapse.

## N3. Add module

Move the single Add module action BELOW the last module in module navigator list (outside filtered search hits if applicable). Compact text-plus action, NOT full-width dashed card/banner. No duplicate at top/page bottom. Empty course must still permit creation. No 100-module infrastructure work.

## Ownership, evidence, stop conditions

Claude lesson-ux owns E1–E4: document/sentence/explanation/insertion components, relevant editor helpers/tests, authoring-base.css and editor selectors in lesson-library-document.css. Claude ux-triage owns N1–N3: lesson-library.tsx, module navigator/header components and dedicated navigation styles/tests only. No shared-file edits; request parent integration if boundary crossed. No agents create subagents or commits. No real lessons.json/DB writes, owner localhost:3000 untouched; preserve all dirty work. No browser extension. Editor has isolated Playwright slot first, navigation runs static/unit checks until parent transfers slot. No full-suite/cache-restart loops.

For every E/N item report PASS or BLOCKED with file change and actual check, not generic 'polished'. E4 requires same-viewport resting/hover/focus/after-leave screenshots + measured seam heights, computed line visibility, actual pointer move and click all choices; no claimed baseline percentage. E1–3 require next-slide click, formatting selection, hint/Escape and editing/rest screenshots; ensure icons and text do not overlap at narrow width. N track needs UI removal checks, module create/reorder and lesson duplicate/delete tests (browser pending is explicit if slot not available). Update focused regression assertions legitimately rather than remove coverage. If a targeted run fails repeatedly, stop with exact blocker. Timeboxed checkpoints, no historical backlog work.
