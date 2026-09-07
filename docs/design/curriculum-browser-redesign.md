# Curriculum browser redesign proposal

Prepared 2026-09-07. Status: implemented across all curriculum topics; responsive browser screenshots remain to be completed because no browser surface was available to the computer tool.

The production implementation keeps the existing PostgreSQL collections canonical and adds a display hierarchy in application code. Verbs uses semantic families, dictionary and phrasal-verb lookup views use alphabetic families, and smaller topics use purpose-based families. Concepts that are not represented by a topic's focused collections appear through an explicit “Outside these families” fallback. The table, inline editing, detail drawer, coverage links, filters, sorting, pagination, and legacy facet URLs remain supported.

The intended outcome is simple: selecting a topic, family, or collection should immediately show its concepts, with no page scrolling needed to reach the table. Turn the curriculum page into a library workspace with a bounded browser on the left and a stable results area on the right.

## Evidence and diagnosis

The user calls this `/curriculum`; the current application route is `/admin/curriculum`.

Inspection of `topics.ts` found 22 topics. Verbs has 134 configured subtopic buttons, Cognates 104, English → Spanish 147, and Phrasal verbs by root 156. `CurriculumTable` already has a sticky topic sidebar, but renders every subtopic in a grid above the results. Selecting a subtopic leaves that entire grid in place. The table also requires a minimum width of 900px, while the page repeats topic headings and descriptions above its workspace.

This combines two problems: too many choices presented together, and navigation occupying the space needed for the work. Moving the same 134 choices into one long sidebar only solves the second problem.

A read-only PostgreSQL inspection found 4,447 concepts: 310 Core, 1,112 Supporting, 2,803 Reference, and 222 Trash; 5,296 collection names are in use. “Saying & Telling (1)” already contains 12 concepts. Communication also includes retained parent collections alongside numbered subcollections. These overlapping tags make deduplication essential when calculating family results and counts.

The database uses `Collection` and `ConceptCollection` relations. The public concept object exposes collection names as an array. It does not currently have a parent/child collection hierarchy.

No running browser was exposed by the computer tool, and creating an in-app browser failed. The current layout diagnosis is based on source inspection, not a completed visual walkthrough. Database reads ran inside read-only transactions.

## Recommended information architecture

Use **Topic → Family → Collection → concepts**. The first three are navigation levels; concepts are the table rows, like songs. The inspiration is the successive narrowing in [Apple's iTunes column browser](https://support.apple.com/en-ca/guide/itunes/itns72c6bc8b/windows), adapted to preserve width for bilingual text.

| Topic | Family | Collection | Result |
| --- | --- | --- | --- |
| Verbs | Communication | Saying & Telling (1) | Its existing 12 concepts |
| Verbs | Communication | Talking (1) | Existing talking collection |
| Verbs | Thinking & knowing | Knowing (1) | Existing knowing collection |
| Pronouns | Personal pronouns | Subject | Existing subject-pronoun collection |
| Pronouns | Personal pronouns | Direct object | Existing direct-object collection |
| Word building | Endings | -ful | Existing suffix collection |

Family names are proposed navigation labels, not new curriculum records. These examples establish the pattern; the complete mapping of existing choices is an implementation deliverable.

Keep existing topics for the first release. For Verbs, begin evaluating these middle-level families: Being & existence; Modals & auxiliaries; Communication; Thinking & knowing; Perception & feelings; Movement; Possession & transfer; Daily life & work; Making & changing; Social interaction; Formal & specialized uses; Common confusions. Adjust boundaries against the actual memberships before finalizing them.

Aim for roughly 6–12 meaningful choices in a family where the material supports it. This is a design preference, not a curriculum constraint. Large families get a local search and independent scrolling. Dictionary and phrasal-root views can use alphabetic ranges at the middle level because their natural lookup unit is a word. Small topics can go directly to collections; never invent a redundant level simply to require three clicks.

An 8–15 concept collection is a useful focused browsing target, not a hard size limit or a lesson definition. Keep coherent collections together; paginate broader results. Retain numbered labels during the initial layout rollout. Later, review whether groups such as “Other (1)” or “Idioms (1) (2)” can earn descriptive names. Renaming, merging, or splitting actual memberships remains a separate curation batch.

## Desktop layout and interaction

Use one compact application header and a workspace that fills the remaining viewport. Start with a 300–340px left browser; let the table take all remaining width. Treat these dimensions as prototype starting points to validate at 1280×800 and 1440×900.

The left browser contains three vertically arranged sections:

1. **Topic:** a compact searchable picker showing the current topic, with the existing topic groups in its menu. “All curriculum” is always reachable.
2. **Family:** single-selection text rows for the chosen topic, with counts. “All Verbs” is a selectable scope above its families.
3. **Collection:** single-selection text rows for the chosen family, with counts and a small search field when needed. “All Communication” is selectable above its collections.

Give family and collection lists bounded heights and their own scrolling. Their headers and selected path remain visible. Do not allow either list to increase the height of the results area. Give the active row a restrained background and a visible selection indicator.

The right side contains a compact breadcrumb, search and filters, then the table. Keep its toolbar and column headings visible while the table body scrolls. Scope changes reset only the result scroll position to the first row; the left browser keeps its position. Results appear at every level, including immediately on initial load. No automatic selection of the first family or collection.

Clicking a topic shows all concepts in that topic and its families. Clicking a family shows its distinct concepts and available collections. Clicking a collection shows its concepts. Selecting a sibling replaces the previous selection. Clicking the current selection again leaves it selected; use the explicit “All…” row or breadcrumb to broaden the scope.

Opening a topic picker or navigating a long list must never push the table downward. Menus overlay within the viewport. Preserve a stable workspace during loading and indicate “Updating results”; prevent stale rows from being edited under a newly selected scope until its response arrives. Ignore superseded responses.

## Search, filters, and navigation state

- Concept search stays above the table, searches Spanish and English, and visibly identifies its scope, such as “Search in Communication.” Include an explicit “Search all curriculum” action that preserves the query while clearing the browse path.
- Navigation search matches topic/family/collection labels and shows the complete path. Selecting a match opens that path directly. It does not change the concept search string.
- Role and Taught remain independent filters. Preserve their values, concept search, and sort when changing the browse path; show active restrictions in the toolbar so an empty result is explainable.
- Changing topic clears family, collection, old topic facets, any ad hoc collection restriction, and page. Changing family clears its selected collection, old facets/ad hoc restriction, and page. Changing collection clears old facets/ad hoc restriction and page. Filter and sort changes reset page only.
- Distinguish hierarchy collections from an ad hoc exact collection filter opened from concept details. Show the latter as a removable restriction; never leave it hidden when navigating elsewhere.
- “All roles” initially retains the current admin meaning, including Trash. Mark that meaning clearly. Keep exact Core/Supporting/Reference/Trash options. Nothing in this redesign changes teaching-facing Trash exclusion.
- Counts mean distinct matching concepts under the topic/family/collection scope and the current role, search, Taught, and ad hoc filters. A parent's count is not a sum of child counts. Keep zero-result choices visible but disabled; do not reorder families as counts change.
- A topic-level “Outside these families” fallback exposes concepts not covered by the configured leaf collections. This keeps imperfect taxonomy visible during curation.
- Put the browse path and result filters in the URL. Browser Back/Forward restores the path, query, filters, sort, and page; refresh preserves the same result set. Save only display preferences and list positions in local/session storage.
- Retain existing `topic`, `facets`, `collection`, `role`, `search`, `sort`, `taught`, and `page` links. Add stable family/leaf identifiers with an explicit compatibility resolver. Resolve old known facets to their path when unambiguous. Preserve multiple legacy facets as explicit AND restrictions when they cannot map to one path, rather than silently broadening them. Unknown paths fall back visibly to the nearest valid scope.

## Make the table easier to read

The default table should emphasize Spanish, English, Role, Taught, and a compact details action. Remove the permanent collections column from the default view; collection metadata belongs in the existing concept detail panel. Keep an optional Columns control for users who want it back. Keep bilingual examples available through the existing examples toggle and detail panel.

Preserve inline text and role editing, save feedback, sorting, lesson coverage links, and concept details. The existing detail drawer should overlay the right side and close back to the same row and scroll position. Avoid opening a permanent third pane that makes both language columns cramped.

For ordinary curation, provide recoverable “Move to Trash.” Keep permanent deletion limited to the explicit Trash review workflow with its existing confirmation safeguards. This is a UI boundary to implement and verify, not permission to delete data during the redesign.

Selections apply to the current displayed page and clear when scope, query, filters, sorting, or page changes. State “Select this page,” never imply the entire query is selected. If navigation would discard an unsaved cell edit, offer Save, Discard, or Cancel; keep failed edits recoverable. Reserve toolbar space for selection actions so selecting rows does not move the first result.

Start with existing server pagination (100 concepts per page). A 12-concept collection naturally fits one page. Avoid infinite scroll or virtualization unless measurement reveals a need; both complicate editing, selection, and returning to a known place.

## Smaller screens and accessibility

At widths where the bilingual table becomes cramped, collapse the browser behind a “Browse” button that also shows the current scope. Open the same navigation in a drawer; selecting a final collection closes it and returns to results. Include “View these concepts” so a user can stop at topic or family level. On phones, retain readable paired concept rows and open details full width.

Use native buttons/list semantics for the stacked browser, labeled scroll regions, visible keyboard focus, and a text/shape selection indicator. A custom ARIA tree is unnecessary. Ensure every navigation item works without a pointer. Trap and restore focus for actual modal drawers; Escape closes them without losing scope. Announce result counts politely after completed updates. Check 200% zoom, long Spanish/English patterns, large text, empty and loading states, and touch targets.

## Data model and implementation approach

Keep PostgreSQL and existing collection memberships canonical. Define only display hierarchy, stable navigation IDs, order, and references to canonical collections in the existing topic configuration. No concept copies, curated ID lists, new curriculum tables, or parallel content catalogs.

For the initial release, a family's concepts are the union of its explicitly mapped leaf collection memberships, intersected with the topic's base collection. A leaf normally resolves to one existing collection. An explicitly configured multi-collection leaf uses OR across its member collections. Global filters and an ad hoc exact collection restriction are ANDed with that scope. Query concept rows directly to avoid duplicate rows. Never implement a family as requiring membership in every child collection: the existing `requireCollections` option is AND-only.

Extend the existing read layer with a small shared scope predicate used by both results and navigation counts. Batch counts for visible navigation choices; do not issue one request per sidebar row or download all concepts to the browser. Add a deterministic ID tie-breaker to paginated sorting. Profile before adding indexes or caches; role and membership edits must invalidate affected counts and results.

Likely code boundaries:

- `web/src/lib/curriculum/topics.ts`: explicit family/leaf navigation metadata; preserve existing aliases.
- `web/src/components/curriculum/topic-presentation.ts`: display labels and concise explanations.
- `web/src/app/admin/curriculum/page.tsx`: URL resolution, requested scope, result/count reads, compact page shell.
- `web/src/lib/curriculum/server/curriculum-store.ts`: shared scope logic, distinct counts, deterministic pagination.
- Extract a browser and toolbar from `curriculum-table.tsx`; keep its proven edit/detail logic while giving table results a stable scroll container. Avoid remounting the entire workspace on every filter change, as the current route's large `key` does.

Read the installed Next.js guides before implementation, as required by `web/AGENTS.md`.

## Implementation record and remaining gate

1. **Navigation mapping complete.** Every configured topic facet is represented exactly once in the display hierarchy. A database coverage audit identified concepts outside those focused facets and the UI exposes them through a fallback family.
2. **Vertical slice complete.** Verbs supports topic, semantic family, and collection scopes; family queries use OR semantics and distinct concept counts. “Communication” returns 163 concepts and “Saying & Telling (1)” returns its existing 12.
3. **All-topic rollout complete.** The same browser serves all 22 topics. Dictionary and phrasal-verb views use alphabetic ranges. A topic with one natural family goes directly to its collections.
4. **Compatibility and curation actions complete.** URL state supports Back, Forward, and refresh; single-facet legacy links resolve into the hierarchy and multi-facet legacy links remain explicit AND filters. Ordinary bulk removal moves concepts to Trash; permanent deletion is exposed only while reviewing the Trash role.
5. **Automated verification complete.** Focused navigation and presentation tests, TypeScript, lint, the production build, curriculum database regression tests, and snapshot parity pass. Existing unrelated presentation-course test failures remain in the user-edited lesson data.
6. **Responsive browser validation remains.** Test at 1440×900, 1280×800, 1024px width, and 390×844 mobile, plus 200% zoom, when a browser surface is available. Verify table position, independent scrolling, the mobile browser, focus behavior, and editing in the rendered interface.

Collection renaming remains a separate optional curation batch. Review numbered, oversized, or unclear names with the owner, apply approved changes through the established manifests, record rationales, export snapshots, and pass parity checks.

Acceptance criteria:

- The table header and first concept are visible without scrolling after every topic/family/collection selection on supported desktop sizes. Increasing a family's navigation list from 10 to 150 choices does not change the table's vertical start position.
- Every existing topic and facet remains reachable; unmapped concepts remain accessible. Overlapping children produce one row per concept and accurate distinct counts.
- Family selection is a union, leaf selection narrows correctly, and role/search/Taught restrictions behave consistently in results and counts. Empty combinations explain how to broaden the scope.
- Back, Forward, refresh, old deep links, and malformed URLs yield predictable visible scopes. Sidebar scrolling does not scroll the table, and result paging does not reset the sidebar.
- Search, sorting, examples, inline editing, save failures, role changes, details, and coverage links continue to work. Selection does not leak into another scope; navigation cannot silently discard an edit.
- Keyboard and mobile users can reach concepts and return to their previous context. No page-wide horizontal scrolling in the default layout.
- UI-only deployment leaves curriculum records, roles, memberships, source provenance, seed snapshots, and Lesson Builder persistence unchanged. Regression and parity verification should confirm that boundary; exporting snapshots is only needed if a later approved curation batch changes data.

## Alternatives considered

Three full-height columns on the left most literally reproduce the music browser, but consume too much width for Spanish, English, and examples. A fully expanded folder tree risks recreating the enormous scrolling list. A card-based topic landing page adds repeated transitions and hides results while browsing. The recommended compact topic picker and two bounded lists preserve the narrowing interaction while prioritizing the table.

Saved views and recent collections could help repeated curation later. Defer them until the basic browse-and-edit workflow proves a need; ordinary deep links already support bookmarking useful scopes.
