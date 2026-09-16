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
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from "react";

import { ConceptQuickEdit } from "@/components/lesson-builder/concept-quick-edit";
import { LessonConceptsField } from "@/components/lesson-builder/lesson-concepts-field";
import { conceptKey } from "@/lib/lesson-builder/lesson-file";
import { useDragReorder } from "@/lib/lesson-builder/use-drag-reorder";
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

  function toneFor(item: SyllabusItem): "is-covered" | "is-uncovered" | "is-missing" {
    if (isMissingConcept(item, conceptDisplays)) return "is-missing";
    return coverageOfItem(item, moduleLessons).covered ? "is-covered" : "is-uncovered";
  }

  function titleFor(item: SyllabusItem): string {
    const display = item.conceptId ? conceptDisplays[item.conceptId] : undefined;
    const coverage = coverageOfItem(item, moduleLessons).covered
      ? "Referenced by a lesson in this module"
      : "Not yet referenced by a lesson in this module";
    return display?.spanish ? `${display.spanish} — ${coverage}` : coverage;
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

  function renderAcceptedChip(item: SyllabusItem, kind: ListKind) {
    const label = labelFor(item);
    const isDragging = drag.dragged?.id === item.id;
    const dropClass = drag.dropTarget?.id === item.id ? ` drop-${drag.dropTarget.position}` : "";
    return (
      <span
        key={item.id}
        draggable
        tabIndex={0}
        data-syllabus-chip={item.id}
        data-chip-focusable
        className={`lesson-concept-chip syllabus-chip ${toneFor(item)}${isDragging ? " dragging" : ""}${dropClass}`}
        title={titleFor(item)}
        onDragStart={(event) => drag.dragStart(event, dragScope, item.id)}
        onDragEnd={drag.reset}
        onDragOver={(event) => drag.dragOver(event, dragScope, item.id)}
        onKeyDown={(event) => handleChipKeyDown(event, item.id, kind)}
      >
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
              });
              relabelItem(item.id, draft.spanish);
            }}
            onDeleted={() => patchSyllabus(removeFnFor(kind)(syllabus, item.id))}
          >
            {label}
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
            {label}
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
    return (
      <div
        className="syllabus-chip-row"
        onDragOver={(event) => {
          if (drag.dragged) event.preventDefault();
        }}
        onDrop={(event) => handleContainerDrop(event, kind)}
      >
        {items.map((item) => renderAcceptedChip(item, kind))}
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
          {warningCount > 0 && <span className="syllabus-card-warning-count"> · ⚠ {warningCount}</span>}
        </span>
      </button>
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
                  <span className="lesson-concept-label">{labelFor(item)}</span>
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
                  <span className="lesson-concept-label">{labelFor(item)}</span>
                </span>
              ))
            )}
          </div>

          <button
            type="button"
            className="syllabus-panel-copy-link"
            onClick={copyAsText}
            title="Copies this module's teaching points, review items and coverage as plain text — e.g. to paste into an AI prompt"
          >
            {briefCopied ? "Copied!" : "Copy as text"}
          </button>
        </div>
      )}
    </div>
  );
}
