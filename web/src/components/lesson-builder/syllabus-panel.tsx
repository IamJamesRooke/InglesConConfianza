"use client";

// The module's "Syllabus" card — see docs/design/module-syllabus.md. Sits as
// its own card directly above the module's lesson-list card (owner feedback
// 2026-09-15, third pass): a small header (title + summary line), a thin
// progress bar always visible, and — once expanded — two wrapped pill lists
// (Main teaching points, Review) with no tabs and no numbered rows. Chips
// reuse `.lesson-concept-chip`; dragging a chip reorders it within its list
// or moves it to the other list (Main→Review demotes, Review→Main promotes,
// works for both accepted and proposed review items); `Ctrl Alt ←/→`
// reorders the focused chip and `Ctrl Alt ↑/↓` moves it to the other list —
// handled locally on the chip element (not the global keymap dispatcher:
// module-level `syllabus` state lives outside `LessonBuilderActions`/
// `lessons`, the dispatcher's only inputs, same reason the very first pass
// used plain buttons instead of new chords). Also taught / Reviewed render
// as two muted one-line lists below. Everything here reads/writes
// `module.syllabus` through `onChangeModule` (not part of the undoable
// lessons history — same as every other module-level edit).
//
// Structure (round 2, item A — docs/design/lesson-builder-round-2.md): the
// Main and Review lists render grouped by part of speech (Pronouns, Verbs,
// Connectors, Time/place/degree, Words, Untagged — syllabus-groups.ts) and
// every pill carries a 6px colour dot for its level. The grouping is
// render-only: `syllabus.main`/`.review` stay flat ordered arrays, so a drop
// on a pill in another group simply reorders the flat list to that pill's
// index, exactly as before. Colour is never the only signal (see
// docs/teaching-methodology.md): the pill's tooltip names the level in
// words and a legend at the card's foot names every dot on screen.
//
// Pill tone (owner, 2026-09-16): a planned-but-not-yet-taught pill is the
// *resting* state, not a problem — 23 dashed faint pills on a module with no
// lessons yet read as 23 errors. Coverage is now stated positively (a check +
// the success tint on `is-covered`); dashed is reserved for `is-missing`.
import { Check, ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from "react";

import { ConceptQuickEdit } from "@/components/lesson-builder/concept-quick-edit";
import { LessonConceptsField } from "@/components/lesson-builder/lesson-concepts-field";
import { AddFromLevelPicker } from "@/components/lesson-builder/syllabus-fill-picker";
import { renderConceptLabel } from "@/lib/lesson-builder/concept-label";
import { conceptKey } from "@/lib/lesson-builder/lesson-file";
import { createId } from "@/lib/lesson-builder/utils";
import { curriculumRoleLabel } from "@/lib/curriculum/types";
import { useDragReorder } from "@/lib/lesson-builder/use-drag-reorder";
import { groupSyllabusItems } from "@/lib/lesson-builder/syllabus-groups";
import type { ByLevelConcept } from "@/lib/lesson-builder/syllabus-fill";
import {
  addMainItem,
  addReviewItem,
  alsoTaughtAndReviewed,
  buildCourseTimeline,
  computeModuleWarnings,
  coverageOfItem,
  isMissingConcept,
  moduleBrief,
  promoteToMain,
  proposedReviewPlan,
  reorderMainItems,
  reorderReviewItems,
  removeMainItem,
  removeReviewItem,
  syllabusOf,
  type ModuleSyllabus,
  type SyllabusItem,
} from "@/lib/lesson-builder/syllabus";
import type {
  ConceptDisplayLookup,
  Lesson,
  LessonModule,
} from "@/lib/lesson-builder/types";

type Props = {
  module: LessonModule;
  moduleIndex: number;
  modules: LessonModule[];
  lessons: Lesson[];
  conceptDisplays: ConceptDisplayLookup;
  onDisplayChange: (conceptId: string, display: ConceptDisplayLookup[string]) => void;
  onChangeModule: (moduleId: string, patch: Partial<LessonModule>) => void;
};

type ListKind = "main" | "review";

// Level order for the legend line (the curriculum enum's own order).
const LEVEL_ROLES = ["P1", "P2", "P3", "P4", "P5", "Unranked"] as const;

function openStorageKey(moduleId: string) {
  return `lesson-builder:syllabus-open:${moduleId}`;
}

function readOpen(moduleId: string): boolean {
  try {
    return window.localStorage.getItem(openStorageKey(moduleId)) === "1";
  } catch {
    return false;
  }
}

function writeOpen(moduleId: string, open: boolean) {
  try {
    window.localStorage.setItem(openStorageKey(moduleId), open ? "1" : "0");
  } catch {
    /* storage unavailable — collapse state just won't stick */
  }
}

export function SyllabusPanel({
  module,
  moduleIndex,
  modules,
  lessons,
  conceptDisplays,
  onDisplayChange,
  onChangeModule,
}: Props) {
  const [open, setOpen] = useState(() => readOpen(module.id));
  // Freehand pill being renamed in place (no curriculum row to quick-edit).
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [briefCopied, setBriefCopied] = useState(false);
  const [dismissedProposed, setDismissedProposed] = useState<Set<string>>(new Set());
  // A cross-list keyboard move re-parents the chip (different array, so
  // React can't preserve the DOM node by key alone) — this ref remembers
  // which chip should regain focus once the next render lands it in its new
  // list; a plain ref (not state) so the effect below never has to call
  // setState itself.
  const pendingFocusRef = useRef<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const drag = useDragReorder({ axis: "x", mode: "nested" });
  const dragScope = module.id;

  const timeline = buildCourseTimeline(modules, lessons);
  const syllabus = syllabusOf(module);
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const moduleLessons = module.lessonIds
    .map((id) => lessonById.get(id))
    .filter((lesson): lesson is Lesson => Boolean(lesson));

  const mainCovered = syllabus.main.filter((item) => coverageOfItem(item, moduleLessons).covered).length;
  const reviewCovered = syllabus.review.filter((item) => coverageOfItem(item, moduleLessons).covered).length;
  const totalItems = syllabus.main.length + syllabus.review.length;
  const totalCovered = mainCovered + reviewCovered;

  // Curation debt, stated where the owner is already looking: an Unranked
  // concept is one nobody has placed on the level ladder yet.
  const plannedItems = [...syllabus.main, ...syllabus.review];
  const unrankedCount = plannedItems.filter(
    (item) => item.conceptId && conceptDisplays[item.conceptId]?.role === "Unranked",
  ).length;
  // Legend for the level dots, in level order — only the levels actually on
  // screen, and only when there is more than one to tell apart.
  const levelsPresent = LEVEL_ROLES.filter((role) =>
    plannedItems.some((item) => item.conceptId && conceptDisplays[item.conceptId]?.role === role),
  );

  const { alsoTaught, reviewed } = alsoTaughtAndReviewed(module, moduleIndex, lessons, timeline);

  const warnings = computeModuleWarnings(module, moduleIndex, lessons, timeline, conceptDisplays);
  const warningCount =
    warnings.notIntroducedYet.length +
    warnings.notNew.length +
    warnings.neverTaught.length +
    warnings.missing.length;

  const alreadyPlannedKeys = new Set([...syllabus.main, ...syllabus.review].map(conceptKey));
  const reviewSuggestions = proposedReviewPlan(moduleIndex, timeline).filter(
    (item) => !alreadyPlannedKeys.has(conceptKey(item)) && !dismissedProposed.has(conceptKey(item)),
  );

  useEffect(() => {
    const pendingId = pendingFocusRef.current;
    if (!pendingId) return;
    const el = rootRef.current?.querySelector<HTMLElement>(`[data-syllabus-chip="${pendingId}"]`);
    if (el) {
      el.focus();
      pendingFocusRef.current = null;
    }
  }, [syllabus]);

  function toggleOpen() {
    setOpen((current) => {
      const next = !current;
      writeOpen(module.id, next);
      return next;
    });
  }

  function patchSyllabus(next: ModuleSyllabus) {
    onChangeModule(module.id, { syllabus: next });
  }

  function labelFor(item: SyllabusItem): string {
    const display = item.conceptId ? conceptDisplays[item.conceptId] : undefined;
    return display?.english ?? item.label;
  }

  // Both languages on the pill, Spanish first (the concept is Spanish-first):
  // "tú → you" and "te → you" are otherwise the same pill (owner, 2026-09-16).
  function labelNode(item: SyllabusItem) {
    const display = item.conceptId ? conceptDisplays[item.conceptId] : undefined;
    if (!display) return renderConceptLabel(item.label);
    return (
      <>
        {renderConceptLabel(display.spanish)}
        <span className="lesson-concept-english">{renderConceptLabel(display.english)}</span>
      </>
    );
  }

  function toneFor(item: SyllabusItem): "is-covered" | "is-uncovered" | "is-missing" {
    if (isMissingConcept(item, conceptDisplays)) return "is-missing";
    return coverageOfItem(item, moduleLessons).covered ? "is-covered" : "is-uncovered";
  }

  function displayOf(item: SyllabusItem) {
    return item.conceptId ? conceptDisplays[item.conceptId] : undefined;
  }

  // The level dot reuses the Covers field's `role-*` token classes, so the
  // two surfaces read identically. A freehand pill has no curriculum row and
  // therefore no dot at all — its absence is the signal.
  function roleClassOf(item: SyllabusItem): string {
    const role = displayOf(item)?.role;
    if (!role) return "";
    return ` role-${role.replace(/[^A-Za-z0-9]/g, "")}`;
  }

  function titleFor(item: SyllabusItem): string {
    const display = item.conceptId ? conceptDisplays[item.conceptId] : undefined;
    const state = isMissingConcept(item, conceptDisplays)
      ? "No longer in the curriculum (Trash or deleted)"
      : coverageOfItem(item, moduleLessons).covered
        ? "Taught by a lesson in this module"
        : "Planned — not taught by a lesson in this module yet";
    // The full label (brackets and all) stays here, even though the pill
    // itself lets the `[…]` placeholders recede.
    const full = display?.spanish
      ? display.english
        ? `${display.spanish} → ${display.english}`
        : display.spanish
      : item.label;
    // The dot's colour is restated in words here (and in the card's legend).
    const level = display?.role ? ` · ${curriculumRoleLabel(display.role)}` : "";
    return `${full ? `${full} — ` : ""}${state}${level}`;
  }

  function listOf(kind: ListKind): SyllabusItem[] {
    return kind === "main" ? syllabus.main : syllabus.review;
  }

  function reorderFnFor(kind: ListKind) {
    return kind === "main" ? reorderMainItems : reorderReviewItems;
  }

  function removeFnFor(kind: ListKind) {
    return kind === "main" ? removeMainItem : removeReviewItem;
  }

  function relabelItem(itemId: string, label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    const rename = (items: SyllabusItem[]) =>
      items.map((item) => (item.id === itemId ? { ...item, label: trimmed } : item));
    patchSyllabus({ main: rename(syllabus.main), review: rename(syllabus.review) });
  }

  function findListOf(itemId: string): ListKind | null {
    if (syllabus.main.some((item) => item.id === itemId)) return "main";
    if (syllabus.review.some((item) => item.id === itemId)) return "review";
    return null;
  }

  function moveWithinList(itemId: string, kind: ListKind, delta: -1 | 1) {
    const list = listOf(kind);
    const index = list.findIndex((item) => item.id === itemId);
    const targetIndex = index + delta;
    if (index < 0 || targetIndex < 0 || targetIndex >= list.length) return;
    patchSyllabus(
      reorderFnFor(kind)(syllabus, itemId, list[targetIndex].id, delta < 0 ? "before" : "after"),
    );
  }

  // Main→Review demotes, Review→Main promotes (owner clarification
  // 2026-09-15) — same move either way, just which array loses/gains the
  // item; works for an already-accepted item regardless of direction.
  function moveAcrossLists(
    itemId: string,
    fromKind: ListKind,
    toKind: ListKind,
    targetId: string | null,
    position: "before" | "after",
  ) {
    if (fromKind === toKind) return;
    const fromList = listOf(fromKind);
    const item = fromList.find((entry) => entry.id === itemId);
    if (!item) return;
    const remainingFrom = fromList.filter((entry) => entry.id !== itemId);
    const toList = listOf(toKind);
    let nextTo: SyllabusItem[];
    if (targetId) {
      const idx = toList.findIndex((entry) => entry.id === targetId);
      const insertAt = idx < 0 ? toList.length : position === "before" ? idx : idx + 1;
      nextTo = toList.toSpliced(insertAt, 0, item);
    } else {
      nextTo = [...toList, item];
    }
    const next: ModuleSyllabus =
      fromKind === "main" ? { main: remainingFrom, review: nextTo } : { main: nextTo, review: remainingFrom };
    patchSyllabus(next);
    pendingFocusRef.current = itemId;
  }

  function handleContainerDrop(event: DragEvent<HTMLElement>, kind: ListKind) {
    if (!drag.dragged) return;
    event.preventDefault();
    const draggedId = drag.dragged.id;
    const fromKind = findListOf(draggedId);
    if (!fromKind) {
      drag.reset();
      return;
    }
    const targetId = drag.dropTarget?.id ?? null;
    const position = drag.dropTarget?.position ?? "after";
    if (fromKind === kind) {
      if (targetId && targetId !== draggedId) {
        patchSyllabus(reorderFnFor(kind)(syllabus, draggedId, targetId, position));
      }
    } else {
      moveAcrossLists(draggedId, fromKind, kind, targetId, position);
    }
    drag.reset();
  }

  function handleChipKeyDown(event: KeyboardEvent<HTMLElement>, itemId: string, kind: ListKind) {
    if (event.target === event.currentTarget && (event.key === "Backspace" || event.key === "Delete")) {
      // Only when the pill itself is focused (a second Backspace after the
      // field's first one, or Delete) — never from the quick-edit trigger.
      event.preventDefault();
      patchSyllabus(removeFnFor(kind)(syllabus, itemId));
      return;
    }
    if (!((event.ctrlKey || event.metaKey) && event.altKey)) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      moveWithinList(itemId, kind, event.key === "ArrowLeft" ? -1 : 1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      moveAcrossLists(itemId, kind, kind === "main" ? "review" : "main", null, "after");
    }
  }

  function acceptProposed(item: SyllabusItem) {
    patchSyllabus(addReviewItem(syllabus, item));
  }

  function dismissProposed(item: SyllabusItem) {
    setDismissedProposed((current) => new Set(current).add(conceptKey(item)));
  }

  function copyAsText() {
    const text = moduleBrief(module, moduleIndex, lessons, timeline, conceptDisplays);
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setBriefCopied(true);
        window.setTimeout(() => setBriefCopied(false), 1500);
      })
      .catch(() => {
        /* clipboard unavailable — the link just doesn't confirm */
      });
  }

  // "Add from Level…" (round 2, item B): append the picker's selection to
  // Main, in the order it was shown (group order, then flat order within a
  // group — the picker already hands rows back in that order). Each becomes
  // a linked LessonConcept with a fresh id, same shape the Covers typeahead
  // mints (addFromResult in concept-typeahead.tsx); recording the display
  // here means the pill can render (and group by pos) before any reload.
  function handleAddFromLevel(rows: ByLevelConcept[]) {
    if (rows.length === 0) return;
    const newItems: SyllabusItem[] = rows.map((row) => ({
      id: createId("lesson_concept"),
      conceptId: row.id,
      label: row.spanish,
    }));
    rows.forEach((row) => {
      onDisplayChange(row.id, {
        spanish: row.spanish,
        english: row.english,
        role: row.curriculumRole,
        pos: row.pos ?? undefined,
      });
    });
    patchSyllabus({ ...syllabus, main: [...syllabus.main, ...newItems] });
    pendingFocusRef.current = newItems[0].id;
  }

  function renderAcceptedChip(item: SyllabusItem, kind: ListKind) {
    const label = labelFor(item);
    const tone = toneFor(item);
    const isDragging = drag.dragged?.id === item.id;
    const dropClass = drag.dropTarget?.id === item.id ? ` drop-${drag.dropTarget.position}` : "";
    return (
      <span
        key={item.id}
        draggable
        tabIndex={0}
        data-syllabus-chip={item.id}
        data-chip-focusable
        className={`lesson-concept-chip syllabus-chip ${tone}${roleClassOf(item)}${isDragging ? " dragging" : ""}${dropClass}`}
        title={titleFor(item)}
        onDragStart={(event) => drag.dragStart(event, dragScope, item.id)}
        onDragEnd={drag.reset}
        onDragOver={(event) => drag.dragOver(event, dragScope, item.id)}
        onKeyDown={(event) => handleChipKeyDown(event, item.id, kind)}
      >
        {tone === "is-covered" && <Check size={11} className="syllabus-chip-check" aria-hidden="true" />}
        {item.conceptId ? (
          // Same popover as a lesson's Covers pill: edit the curriculum row
          // in place; the pill re-labels itself from the saved display.
          <ConceptQuickEdit
            conceptId={item.conceptId}
            className="lesson-concept-label"
            onSaved={(draft) => {
              if (!item.conceptId) return;
              onDisplayChange(item.conceptId, {
                spanish: draft.spanish,
                english: draft.english,
                role: draft.role,
                // The quick-edit dialog doesn't touch collections; keeping
                // the known `pos` stops the pill jumping to "Untagged".
                pos: conceptDisplays[item.conceptId]?.pos,
              });
              relabelItem(item.id, draft.spanish);
            }}
            onDeleted={() => patchSyllabus(removeFnFor(kind)(syllabus, item.id))}
          >
            {labelNode(item)}
          </ConceptQuickEdit>
        ) : renamingId === item.id ? (
          <input
            className="lesson-concept-label syllabus-chip-rename"
            defaultValue={item.label}
            aria-label={`Rename ${label}`}
            autoFocus
            data-keymap-ignore
            onBlur={(event) => {
              relabelItem(item.id, event.currentTarget.value);
              setRenamingId(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              } else if (event.key === "Escape") {
                event.preventDefault();
                event.currentTarget.value = item.label;
                event.currentTarget.blur();
              }
            }}
          />
        ) : (
          <button
            type="button"
            className="lesson-concept-label"
            title="Rename (not in the curriculum)"
            onClick={() => setRenamingId(item.id)}
          >
            {renderConceptLabel(label)}
          </button>
        )}
        <button
          type="button"
          className="lesson-concept-remove"
          aria-label={`Remove ${label}`}
          onClick={() => patchSyllabus(removeFnFor(kind)(syllabus, item.id))}
        >
          <X size={11} aria-hidden="true" />
        </button>
      </span>
    );
  }

  function renderProposedChip(item: SyllabusItem) {
    return (
      <span
        key={item.id}
        role="button"
        tabIndex={0}
        className="lesson-concept-chip is-proposed syllabus-chip"
        title="Proposed for review — click to accept"
        onClick={() => acceptProposed(item)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            acceptProposed(item);
          } else if (event.key === "Backspace" || event.key === "Delete") {
            event.preventDefault();
            dismissProposed(item);
          }
        }}
      >
        <Plus size={11} aria-hidden="true" />
        <span className="lesson-concept-label">{item.label}</span>
        <button
          type="button"
          className="lesson-concept-remove"
          aria-label={`Dismiss suggestion ${item.label}`}
          onClick={(event) => {
            event.stopPropagation();
            dismissProposed(item);
          }}
        >
          <X size={11} aria-hidden="true" />
        </button>
      </span>
    );
  }

  function renderList(kind: ListKind) {
    const items = listOf(kind);
    const add = kind === "main" ? addMainItem : addReviewItem;
    // One wrapped row per non-empty group, in the fixed group order; the
    // list itself is still one flat array, and every row is the same drop
    // target, so a pill dragged across a group boundary lands at the flat
    // index of whatever pill it was dropped on.
    const groups = groupSyllabusItems(items, (item) => displayOf(item)?.pos);
    const dropProps = {
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (drag.dragged) event.preventDefault();
      },
      onDrop: (event: DragEvent<HTMLElement>) => handleContainerDrop(event, kind),
    };
    return (
      <>
        {groups.map((group) => (
          <div key={group.id} className="syllabus-pos-group">
            <span className="syllabus-pos-eyebrow">{group.label}</span>
            <div className="syllabus-chip-row" {...dropProps}>
              {group.entries.map((entry) => renderAcceptedChip(entry.item, kind))}
            </div>
          </div>
        ))}
        <div className="syllabus-chip-row" {...dropProps}>
          {kind === "review" && reviewSuggestions.map((item) => renderProposedChip(item))}
          <LessonConceptsField
            variant="compact"
            label=""
            hideChips
            concepts={items}
            conceptDisplays={conceptDisplays}
            onAdd={(concept) => patchSyllabus(add(syllabus, concept))}
            onRemove={(id) => patchSyllabus(removeFnFor(kind)(syllabus, id))}
            onRelabel={relabelItem}
            onDisplayChange={onDisplayChange}
          />
        </div>
      </>
    );
  }

  return (
    <div className="syllabus-card" ref={rootRef}>
      <button
        type="button"
        className="syllabus-card-header"
        aria-expanded={open}
        onClick={toggleOpen}
      >
        {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
        <span className="syllabus-card-title">Syllabus</span>
        <span className="syllabus-card-summary">
          Main {mainCovered}/{syllabus.main.length} · Review {reviewCovered}/{syllabus.review.length} · Also
          taught {alsoTaught.length}
          {unrankedCount > 0 && ` · ${unrankedCount} unranked`}
          {warningCount > 0 && <span className="syllabus-card-warning-count"> · ⚠ {warningCount}</span>}
        </span>
      </button>
      {/* An always-empty bar on a module with no lessons yet is pure
          discouragement — the summary line already says 0/23. It appears as
          soon as the module has its first lesson (owner, 2026-09-16). The
          track still occupies its 3px while idle (`visibility: hidden`, not
          unmounted): dropping it from the layout made the whole lesson list
          jump 3px the moment the module got its first lesson, which is both
          a visible twitch and enough to move a hover target out from under
          a stationary pointer mid-click. */}
      {moduleLessons.length === 0 ? (
        <div className="syllabus-card-progress is-idle" aria-hidden="true" />
      ) : (
        <div
          className="syllabus-card-progress"
          role="progressbar"
          aria-valuenow={totalCovered}
          aria-valuemin={0}
          aria-valuemax={totalItems}
          aria-label="Syllabus coverage"
        >
          <div
            className="syllabus-card-progress-fill"
            style={{ width: `${totalItems === 0 ? 0 : Math.round((totalCovered / totalItems) * 100)}%` }}
          />
        </div>
      )}

      {open && (
        <div className="syllabus-card-body">
          <div className="syllabus-group">
            <span className="syllabus-group-eyebrow">Main teaching points</span>
            {renderList("main")}
          </div>
          <div className="syllabus-group">
            <span className="syllabus-group-eyebrow">Review</span>
            {renderList("review")}
          </div>

          <div className="syllabus-derived-line">
            <span className="syllabus-derived-eyebrow">Also taught:</span>
            {alsoTaught.length === 0 ? (
              <span className="syllabus-panel-empty">none yet</span>
            ) : (
              alsoTaught.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="lesson-concept-chip is-covered syllabus-chip"
                  title="Click to promote to Main"
                  onClick={() => patchSyllabus(promoteToMain(syllabus, item))}
                >
                  <span className="lesson-concept-label">{labelNode(item)}</span>
                </button>
              ))
            )}
          </div>
          <div className="syllabus-derived-line">
            <span className="syllabus-derived-eyebrow">Reviewed:</span>
            {reviewed.length === 0 ? (
              <span className="syllabus-panel-empty">none yet</span>
            ) : (
              reviewed.map((item) => (
                <span key={item.id} className="lesson-concept-chip is-covered syllabus-chip">
                  <span className="lesson-concept-label">{labelNode(item)}</span>
                </span>
              ))
            )}
          </div>

          {levelsPresent.length > 1 && (
            <div className="syllabus-legend">
              {levelsPresent.map((role) => (
                <span key={role} className={`syllabus-legend-item role-${role}`}>
                  <span className="syllabus-legend-dot" aria-hidden="true" />
                  {curriculumRoleLabel(role)}
                </span>
              ))}
            </div>
          )}

          <div className="syllabus-panel-footer">
            <AddFromLevelPicker modules={modules} onAdd={handleAddFromLevel} />
            <button
              type="button"
              className="syllabus-panel-copy-link"
              onClick={copyAsText}
              title="Copies this module's teaching points, review items and coverage as plain text — e.g. to paste into an AI prompt"
            >
              {briefCopied ? "Copied!" : "Copy as text"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
