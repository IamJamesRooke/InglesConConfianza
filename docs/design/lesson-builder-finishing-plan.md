# Lesson Builder finishing plan

Owner-approved consolidated direction: compact teaching presentation at rest; obvious, contextual tools only during editing. This plan supersedes earlier move-dialog, split-button insertion, and always-visible piece-layout proposals. No additional branding/features.

## Scope and invariants

Authoring only. Preserve bilingual content, piece IDs/order, answer arrays and literal-semicolon handling, authored emphasis, undo/history/autosave and JSON persistence. Never test against real web/data/lessons.json or PostgreSQL; leave localhost:3000 untouched. No learner redesign or new dependencies/framework. No Claude browser extension; local Playwright and DOM inspection by default. No bulk stylesheet rewrite.

## 1. Remove module movement UI

Remove the lesson-header Move to module select completely, including now-unused UI wiring where appropriate. No replacement dialog or new drag functionality. Preserve underlying domain operations, persisted structure and existing unrelated reorder capabilities. Preserve Preview; put Duplicate/Delete in a compact accessible lesson actions menu if necessary to eliminate permanent header icon clutter. Keep existing module navigator, search and collapse semantics. Verify 100+ module fixture without adding new navigation infrastructure.

## 2. Slide presentation and editing

Resting sentence slides render a composed Spanish sentence above a composed English sentence, naturally wrapping. Compose from existing pieces; first accepted answer per piece is the English presentation, never all alternatives concatenated. Preserve source punctuation/spacing sensibly; no data rewriting. Do not apply sentence composition to vocabulary tables. Use a small neutral slide-number gutter and controlled between-slide spacing to distinguish separate slides without borders/cards. Explanation slides use normal body text, light-gray semantic background, modest content-height padding, no shadow/border. Preserve authored emphasis.

Activating a sentence reveals aligned bilingual piece editing. Keep transition position/scroll stable as reasonably possible. One Add pair while active; no unsolicited trailing blank pair, repeated visible language-key row, or empty instruction field. Keep accessible field labels. Add instruction explicitly through active tools; authored instructions remain visible at rest. Optional tools must not dictate pair widths.

Hints are EDITING ONLY in the authoring tool: resting sentence presentation contains only composed Spanish and English text (plus any authored instruction), no hint pills/indicators or metadata. While editing, saved hints remain compact yellow authored-text-only pills associated with their originating pair. Existing pill click/keyboard activation opens hint editing. Active pair tools have explicit Add hint; remove AUTHORING lightbulb. Hint editor/alternative editor outside pair sizing geometry, with named owner, remove action and safe dismissal. Learner reveal lightbulb untouched.

## 3. Single coherent active state and tool area

Separate slide editing state from incidental DOM focus. Use one compact tool area for the active slide in the active lesson, not floating controls over neighboring slides. In-flow lesson toolbar, optionally sticky within its containing lesson when verified safe, with explanation formatting and relevant slide/pair actions. Preserve explanation selection/caret during formatting. Do not expose multiple active toolbars across expanded lessons. Use smallest state coordination seam needed, not a new global editor framework.

Escape closes an open nested editor/palette first; otherwise commits the local draft through existing semantics, exits slide editing and focuses its non-editing container without focus handlers reactivating it. Clicking another slide switches active editing immediately. No lost text from blur, Escape, IME, toolbar use or rendering-mode switch. Non-editing container must support keyboard activation without trapping Tab.

## 4. Direct insertion palette

At the center of each between-slide gap, hover/focus reveals three direct actions with icons AND short visible labels: Table, Sentence, Explanation. A subtle insertion line identifies the exact seam. Keep palette visually distinct from vocabulary table headings. No click-to-open dropdown and no type-selection second stage. Generous hit target, compact resting seams, stable target geometry. Palette must not obscure or intercept either neighboring slide. Use flow space when revealed if needed without hover oscillation. Icon tooltips and accessible names. Keyboard can reach actions; touch has a clear usable equivalent without hover (show direct actions on coarse pointers where feasible). Empty lesson and lesson end have discoverable direct insertion choices. Exact insertion index, focus-new-slide, cancellation and undo preserved. Update relevant keyboard help rather than leave stale chooser instructions.

## 5. Final density corrections (owner approved after screenshots)

Keep the composed presentation model. Remove excessive resting min-heights, padding and space reserved for hidden editing/insertion controls at their actual source; use roughly 16–24px consistent inter-slide separation as a starting point and measure combined margins/seams, not each separately. Preserve tight Spanish/English line spacing. Left-align compact vocabulary tables with sentence text, superseding earlier centering. Restore the normal-size explanation light-gray surface where selector interactions lost it. Palette must fit compact seams without covering text, adding tall blank bands, or unstable hover geometry. No blanket additional CSS override layer.

## 6. Targeted structural cleanup

Consolidate touched contradictory editor CSS rules; do not append another override patch or rewrite all 3,104 lines. Separate resting rendering, active tools, and focus lifecycle with small components/helpers where justified. Keep persistence/history/domain logic unchanged. Coordinate lesson-level active state with parent only through a minimal explicit contract.

## Delivery and verification

Milestone A: fix Escape/active-state and explanation overlap, composed sentence rest view, clear active hint tools. Milestone B: direct insertion palette and targeted CSS cleanup. Module header cleanup is independent. Each milestone gets a concise checkpoint before further work; no expanding task queue.

Tests on isolated fixtures: resting vs editing screenshots at identical viewport; 3 consecutive sentence slides including wraps/alternatives/hints; punctuation composition; Escape nested/main, keyboard re-entry, click next slide, selection formatting; pair add/delete, hint add/edit/remove and alternatives save/reload; insert all three at start/middle/end, keyboard/touch; existing vocabulary layout; undo/redo/reorder/duplicate/delete, save/reload; expanded lessons and 100+ modules. Print hides tools/empty controls without forced slide-per-page breaks. Report actual dimensions/results and remaining failures, never claim print-page reduction without measurement. Run focused tests first; one coordinated final suite, no blind cache/port retry loops.

Owner lesson data excluded from commits. Parent reviews diff, evidence and focused tests before committing. No auto commits by agents.
