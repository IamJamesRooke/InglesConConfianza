# Final surfaces — approved follow-up contract

This brief supersedes conflicting earlier presentation-table, hint-entry, header and lesson-tail details. No new features beyond these corrections. Preserve prior dirty work and composed resting sentence behavior. Parent reviews actual browser evidence; source-only claims are not visual verification.

## D1 Explanation geometry

Screenshots 26af057c-75e2-4e00-8e2b-6af4244d4749 (rest), 6661750c-7988-4c68-8ee8-00bba7887942 (hover), 345b0e29-15e0-415c-b2c1-8b61c6ba66cb (editing), all /tmp/pi-clipboard-*.png: gray disappears/text shifts on hover then returns on edit. Root-cause inspect computed styles across states. Same gray surface, width, horizontal text position and padding in all states. Hover changes only slide-action visibility. Editing adds compact formatting row below text in flow, no overlap with next slide. Restored hover-only upper-right drag/duplicate/delete icons stay usable. No content rewriting.

## D2 Lesson and module endings

Screenshots 70a74939-1a69-4fe9-a28c-b11327230341 and 78a06b83-9fbe-4540-a2a2-94c93553f303. Remove extra stacked divider lines and excessive bottom padding. Nonempty lesson tail uses SAME seam behavior as between slides: no insertion line/actions or reserved CONTROL row height at rest; line and Table/Sentence/Explanation icon+label actions appear together on hover/focus, stable flow expansion. Remove redundant Add slide prefix. Ordinary compact slide spacing remains. Tail must remain discoverable via generous existing-gap hover target, keyboard and touch equivalent; empty lesson immediately shows choices. Module-end Add lesson stays ALWAYS visible, modest left-aligned text-plus action, no outlined button box, no separate large bordered footer. Preserve lesson creation, exact tail insertion index, focus/undo/save.

## D3 Vocabulary table presentation and editing

Screenshots 845f861f-0b8b-4441-9918-4ef19d76e85d (rest) and ca32a2c5-b779-45b5-91c8-6dec1202ab88 (edit). Keep left-aligned content-sized table, Spanish/English teaching colors/readable type. Remove blue perimeter/rounded card, retain faint NEUTRAL horizontal row separators, compact consistent cells. Remove visible Spanish/English headings BOTH rest/edit, retain accessible column/field names. Normal modest separation from next slide. Same table columns/geometry on entry to editing; selected cell focus outline only. Add row directly after last row only while editing. Whole-slide controls stay upper right; row delete clearly belongs to selected row and is distinct from slide delete. Optional instruction only on request; no unsolicited blank field.

## D4 Hint entry — OWNER CHOSE OPTION 1, NOT A THIRD COLUMN

Direct pill-shaped input adjacent to selected table row. Appears only for selected row while editing; no Add hint text/button/lightbulb or extra click-to-open hint dialog for tables. Empty pill is visually quiet but discoverable (short Hint placeholder acceptable, accessible owner-specific name required). Type directly; on blur/Enter existing save semantics commit. Clear text removes hint, no separate mandatory delete action. Preserve drafts/IME and nested Escape behavior; do not insert syntax into English answers. Existing semicolon alternatives stay working; avoid mandatory hint stop between Spanish/English entry. Put pill outside Spanish/English column sizing so neither column stretches; responsive below-row fallback if needed. Existing hint edited directly in same pill input.

TABLE REST: authored hint displays yellow text-only pill associated with its row; no blank placeholder for rows without hints, not an always-reserved third column. This is a table-specific owner-authorized exception to editing-only hint presentation. SENTENCE REST remains composed Spanish/English with NO hints. Do not change learner hints, stored data schema, hint values or accepted-answer arrays. Do not apply third-column design accidentally. Sentence-editor hint UX outside vocabulary branch stays unchanged this batch; shared code may extract table-specific mode minimally.

## H1 Dark header

Owner chose dark navy, superseding light-header proposal. Use existing deep-navy token; white brand text/menu icon; muted light ADMIN with verified contrast. White stepping-stone symbol without blue square. Flat surface, no gradient/shadow/contrasting blue border. Preserve brand wording, link/menu navigation, keyboard focus, responsive accessibility. Prefer builder/admin-scoped header variant to avoid redesigning learner surfaces; do not globally retheme logo/favicon or mutate semantic tokens. Reuse current brand mark rather than redesign it.

## Ownership and verification

Claude builder-presentation owns D1–D4: lesson-document/sentence-editor/sentence-presentation/slide-insert-control/explanation components as necessary, editor/lesson-footer selectors in lesson-library-document.css, authoring-base.css, dedicated helpers/tests. Parent must approve other component writes. Claude builder-structure owns H1: actual site-header/brand component + dedicated header styles only; inspect actual paths. Do not edit globals.css, lesson-library-document.css or authoring-base.css on header track. If header lives in shared file use scoped component/style, not broad learner changes. No shared files/auto commits/subagents/dependencies.

No real lessons.json/PostgreSQL writes, no localhost3000 restart/build/cache disruption. No browser extension. Header does source/static checks first; document editor has isolated browser slot after code stable. Do not test while another track changing relevant rendered source; report ready then parent coordinates final combined verification. No broad full suite or repeated cache/port experiments; focused regression tests and preserve failure artifacts. Each agent checkpoints within ~20min then reports specific PASS/BLOCKED and remaining checks, not unlimited design loop.

Evidence: D1 same-viewport text x/width bounds rest/hover/edit; D2 resting/revealed/leave seam heights and line visibility, tail mouse/keyboard insertion and module Add lesson; D3 table rest/edit labels/perimeter/column widths/focus; D4 select row/type/blur/reload/clear/Escape/semicolon and no resting sentence hints. H1 screenshot, contrast/focus/menu at desktop/narrow viewport. Preserve and retest earlier structure removals/width behavior. Never call inferred CSS results browser-verified.
