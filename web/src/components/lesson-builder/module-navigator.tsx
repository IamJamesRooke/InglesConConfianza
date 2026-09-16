"use client";

import { ChevronRight, GripVertical, Plus, Search } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";

import {
  buildImportDiff,
  exportFileName,
  validateImportedFile,
  type FileDiffSummary,
} from "@/lib/lesson-builder/import-export";
import type {
  ConceptDisplayLookup,
  Lesson,
  LessonFile,
  LessonModule,
} from "@/lib/lesson-builder/types";
import { ModuleNavigatorDisclosure } from "@/components/lesson-builder/module-navigator-disclosure";
import { ModuleNavigatorStatus } from "@/components/lesson-builder/module-navigator-status";

export type ModuleNavigatorMatchField =
  | "module-title"
  | "lesson-title"
  | "spanish"
  | "english-answer"
  | "explanation"
  | "instruction"
  | "concept";

type Excerpt = { before: string; hit: string; after: string };

export type ModuleNavigatorSearchResult = {
  module: LessonModule;
  lesson: Lesson | null;
  /** The specific slide to scroll to, when the match is inside a block. */
  blockId: string | null;
  field: ModuleNavigatorMatchField;
  isTitleHit: boolean;
  excerpt: Excerpt;
};

const MAX_RESULTS = 150;
const EXCERPT_RADIUS = 28;

/** Folds the handful of Spanish diacritics onto their base letter, 1 char to
 * 1 char, so indices into the folded string stay valid indices into the
 * original — no NFD/combining-mark bookkeeping needed for this alphabet. */
function foldForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áàä]/g, "a")
    .replace(/[éèë]/g, "e")
    .replace(/[íìï]/g, "i")
    .replace(/[óòö]/g, "o")
    .replace(/[úùü]/g, "u")
    .replace(/ñ/g, "n");
}

function findMatch(
  text: string | null | undefined,
  foldedQuery: string,
): { start: number; end: number } | null {
  if (!text) return null;
  const index = foldForSearch(text).indexOf(foldedQuery);
  if (index === -1) return null;
  return { start: index, end: index + foldedQuery.length };
}

/** Removes the authored markup wrappers (bilingual highlight tags, bold,
 * italic) so an explanation excerpt reads as plain teaching text, not
 * source syntax. Not a full markdown parser — just enough for a snippet. */
function stripLessonMarkup(markdown: string): string {
  return markdown
    .replace(/\[\[(?:es|en):([^\]]*)\]\]/g, "$1")
    .replace(/==([^=]*)==/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*]*)\*/g, "$1")
    .replace(/__([^_]*)__/g, "$1")
    .replace(/_([^_]*)_/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function buildExcerpt(
  text: string,
  match: { start: number; end: number },
): Excerpt {
  const start = Math.max(0, match.start - EXCERPT_RADIUS);
  const end = Math.min(text.length, match.end + EXCERPT_RADIUS);
  return {
    before: (start > 0 ? "…" : "") + text.slice(start, match.start),
    hit: text.slice(match.start, match.end),
    after: text.slice(match.end, end) + (end < text.length ? "…" : ""),
  };
}

/**
 * Searches module/lesson titles, authored Spanish pieces, primary and
 * alternative English answers, explanation text, instruction text, and the
 * names of concepts attached to each lesson (not the whole curriculum).
 * Case- and accent-insensitive substring matching, no fuzzy/AI scoring —
 * title hits rank first, then content hits in document order. Pure and
 * synchronous: reuses the modules/lessons already in memory, no per-result
 * lookups. IDs, raw markup, and the retired helperText/answerFeedback
 * fields are never surfaced.
 */
export function searchModuleNavigator(
  modules: LessonModule[],
  lessons: Lesson[],
  query: string,
  conceptDisplays: ConceptDisplayLookup = {},
): ModuleNavigatorSearchResult[] {
  const foldedQuery = foldForSearch(query.trim());
  if (!foldedQuery) return [];
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const titleHits: ModuleNavigatorSearchResult[] = [];
  const contentHits: ModuleNavigatorSearchResult[] = [];

  for (const courseModule of modules) {
    const moduleTitle = courseModule.name ?? "";
    const moduleMatch = findMatch(moduleTitle, foldedQuery);
    if (moduleMatch) {
      titleHits.push({
        module: courseModule,
        lesson: null,
        blockId: null,
        field: "module-title",
        isTitleHit: true,
        excerpt: buildExcerpt(moduleTitle || "Untitled module", moduleMatch),
      });
    }

    for (const lessonId of courseModule.lessonIds) {
      const lesson = lessonById.get(lessonId);
      if (!lesson) continue;

      const lessonTitle = lesson.name ?? "";
      const titleMatch = findMatch(lessonTitle, foldedQuery);
      if (titleMatch) {
        titleHits.push({
          module: courseModule,
          lesson,
          blockId: null,
          field: "lesson-title",
          isTitleHit: true,
          excerpt: buildExcerpt(lessonTitle || "Untitled lesson", titleMatch),
        });
      }

      for (const concept of lesson.concepts) {
        // `concept.label` is whatever was stored when the concept was
        // tagged — the Spanish headword for a curriculum-linked concept, or
        // freehand text — while a linked concept's English gloss only lives
        // in `conceptDisplays` (fetched client-side, never persisted on the
        // lesson). Match against both so a query in either language finds
        // an already-tagged concept, matching the placeholder's promise.
        const display = concept.conceptId
          ? conceptDisplays[concept.conceptId]
          : undefined;
        const label = concept.label ?? "";
        const match =
          findMatch(label, foldedQuery) ??
          findMatch(display?.english, foldedQuery) ??
          findMatch(display?.spanish, foldedQuery);
        if (match) {
          const excerptSource =
            findMatch(label, foldedQuery) !== null
              ? label
              : (findMatch(display?.english, foldedQuery) !== null
                  ? display?.english
                  : display?.spanish) ?? label;
          contentHits.push({
            module: courseModule,
            lesson,
            blockId: null,
            field: "concept",
            isTitleHit: false,
            excerpt: buildExcerpt(excerptSource, match),
          });
        }
      }

      for (const block of lesson.blocks) {
        if (block.type === "explanation") {
          const plain = stripLessonMarkup(block.contentMarkdown);
          const match = findMatch(plain, foldedQuery);
          if (match) {
            contentHits.push({
              module: courseModule,
              lesson,
              blockId: block.id,
              field: "explanation",
              isTitleHit: false,
              excerpt: buildExcerpt(plain, match),
            });
          }
          continue;
        }
        const instructionMatch = findMatch(block.promptText, foldedQuery);
        if (instructionMatch) {
          contentHits.push({
            module: courseModule,
            lesson,
            blockId: block.id,
            field: "instruction",
            isTitleHit: false,
            excerpt: buildExcerpt(block.promptText, instructionMatch),
          });
        }
        for (const languageBlock of block.languageBlocks) {
          const spanishMatch = findMatch(languageBlock.spanish, foldedQuery);
          if (spanishMatch) {
            contentHits.push({
              module: courseModule,
              lesson,
              blockId: block.id,
              field: "spanish",
              isTitleHit: false,
              excerpt: buildExcerpt(languageBlock.spanish, spanishMatch),
            });
          }
          for (const answer of languageBlock.acceptedAnswers) {
            const answerMatch = findMatch(answer, foldedQuery);
            if (answerMatch) {
              contentHits.push({
                module: courseModule,
                lesson,
                blockId: block.id,
                field: "english-answer",
                isTitleHit: false,
                excerpt: buildExcerpt(answer, answerMatch),
              });
              break; // one hit per blank is enough; don't spam every alternative
            }
          }
        }
      }
    }
  }

  return [...titleHits, ...contentHits].slice(0, MAX_RESULTS);
}

function ResultExcerpt({ excerpt }: { excerpt: Excerpt }) {
  return (
    <span className="module-navigator-excerpt">
      {excerpt.before}
      <mark>{excerpt.hit}</mark>
      {excerpt.after}
    </span>
  );
}

const FIELD_LABEL: Record<ModuleNavigatorMatchField, string> = {
  "module-title": "Module",
  "lesson-title": "Lesson",
  spanish: "Spanish",
  "english-answer": "Answer",
  explanation: "Explanation",
  instruction: "Instruction",
  concept: "Concept",
};

type Props = {
  modules: LessonModule[];
  lessons: Lesson[];
  conceptDisplays: ConceptDisplayLookup;
  activeModuleId: string | null;
  onSelectModule: (moduleId: string) => void;
  onSelectLesson: (lessonId: string, blockId?: string) => void;
  onAddModule: () => void;
  onReorderModule: (draggedModuleId: string, targetModuleId: string) => void;
  /** E: save status + undo/redo, moved here from the retired full-width
   * `.lesson-library-utility` header bar — a small footer row under
   * "Add module" instead of its own big card. */
  saveLabel: string;
  saveFailed: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onRetrySave: () => void;
  // Backup (Export/Import): replaces the whole course after a confirmed
  // diff. The caller applies the returned file to its own lessons/modules
  // state — see docs/design/module-syllabus.md §Backup.
  onImported: (file: LessonFile) => void;
};

export function ModuleNavigator({
  modules,
  lessons,
  conceptDisplays,
  activeModuleId,
  onSelectModule,
  onSelectLesson,
  onAddModule,
  onReorderModule,
  saveLabel,
  saveFailed,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onRetrySave,
  onImported,
}: Props) {
  const [query, setQuery] = useState("");
  const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    file: LessonFile;
    diff: FileDiffSummary;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  function exportCourse() {
    const file: LessonFile = { version: 2, modules, lessons };
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = exportFileName();
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const pickedFile = input.files?.[0];
    input.value = ""; // allow re-picking the same file next time
    if (!pickedFile) return;
    setImportError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(await pickedFile.text());
    } catch {
      setImportError("That file isn't valid JSON.");
      return;
    }
    const validated = validateImportedFile(parsed);
    if ("error" in validated) {
      setImportError(validated.error);
      return;
    }
    const current: LessonFile = { version: 2, modules, lessons };
    setPendingImport({ file: validated.file, diff: buildImportDiff(current, validated.file) });
  }

  async function confirmImport() {
    if (!pendingImport) return;
    const response = await fetch("/api/admin/lesson-builder/import-export", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pendingImport.file),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setImportError(body?.error ?? "Import failed.");
      return;
    }
    const written = (await response.json()) as LessonFile;
    onImported(written);
    setPendingImport(null);
  }
  const results = searchModuleNavigator(modules, lessons, query, conceptDisplays);
  const searching = query.trim().length > 0;
  // Item 6 (first-run friction): below 900px the rail + header ate 45% of a
  // 760x900 viewport before any slide showed. The disclosure below collapses
  // everything but this one summary row under that breakpoint — CSS-only
  // above 900px (the button and the open/closed state it drives simply have
  // no visible effect there; see the delimited block in
  // module-navigation.css).
  const [railOpen, setRailOpen] = useState(false);
  const disclosureRef = useRef<HTMLButtonElement | null>(null);
  const activeModule = modules.find((module) => module.id === activeModuleId) ?? null;

  function handleRailKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape" || !railOpen) return;
    event.preventDefault();
    event.stopPropagation();
    setRailOpen(false);
    disclosureRef.current?.focus();
  }

  function startDrag(event: DragEvent<HTMLButtonElement>, moduleId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", moduleId);
    setDraggedModuleId(moduleId);
  }

  function dropOn(event: DragEvent<HTMLElement>, targetModuleId: string) {
    event.preventDefault();
    if (!draggedModuleId || draggedModuleId === targetModuleId) return;
    onReorderModule(draggedModuleId, targetModuleId);
    setDraggedModuleId(null);
  }

  function selectResult(result: ModuleNavigatorSearchResult) {
    setRailOpen(false);
    if (!result.lesson) {
      onSelectModule(result.module.id);
      return;
    }
    onSelectLesson(result.lesson.id, result.blockId ?? undefined);
  }

  return (
    <nav className="module-navigator" aria-label="Course modules" onKeyDown={handleRailKeyDown}>
      <ModuleNavigatorDisclosure
        activeModuleName={activeModule?.name?.trim() || "Untitled module"}
        open={railOpen}
        onToggle={() => setRailOpen((open) => !open)}
        buttonRef={disclosureRef}
      />
      <div className="module-navigator-collapsible" data-open={railOpen}>
      <div className="module-navigator-header">
        <div className="module-navigator-search">
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
            data-keymap-ignore
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search lessons, phrases, or concepts…"
            aria-label="Search lessons, phrases, or concepts"
          />
        </div>
      </div>

      {searching ? (
        <ul className="module-navigator-results" role="listbox">
          {results.length === 0 && (
            <li className="module-navigator-empty">No matches</li>
          )}
          {results.map((result, index) => (
            // Index-keyed on purpose: `results` is wholly replaced on every
            // keystroke (no reordering/insertion within a stable list), and
            // a composite key here previously collided whenever one block
            // had two matches of the same field (e.g. two Spanish blanks in
            // one sentence both matching), which made React reuse the wrong
            // list item's DOM node — the actual mechanism for "highlight
            // shows the wrong text" bugs, independent of the search logic
            // itself being correct.
            <li key={index}>
              <button
                type="button"
                className={`module-navigator-result${
                  result.isTitleHit ? " module-navigator-result-title" : ""
                }`}
                onClick={() => selectResult(result)}
              >
                <span className="module-navigator-result-breadcrumb">
                  {result.module.name?.trim() || "Untitled module"}
                  {result.lesson && (
                    <>
                      {" › "}
                      {result.lesson.name?.trim() || "Untitled lesson"}
                    </>
                  )}
                </span>
                {!result.isTitleHit && (
                  <span className="module-navigator-result-field">
                    {FIELD_LABEL[result.field]}
                  </span>
                )}
                <ResultExcerpt excerpt={result.excerpt} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="module-navigator-list">
          {modules.map((module) => (
            <li
              key={module.id}
              className={draggedModuleId === module.id ? "dragging" : ""}
              onDragOver={(event) => {
                if (draggedModuleId) event.preventDefault();
              }}
              onDrop={(event) => dropOn(event, module.id)}
            >
              <button
                type="button"
                className="module-navigator-row-drag"
                draggable
                aria-label={`Drag to reorder ${module.name?.trim() || "module"}, or press Alt+ArrowUp / Alt+ArrowDown to move it`}
                title="Drag to reorder (Alt+↑ / Alt+↓)"
                onDragStart={(event) => startDrag(event, module.id)}
                onDragEnd={() => setDraggedModuleId(null)}
                onKeyDown={(event) => {
                  if (!event.altKey) return;
                  const index = modules.indexOf(module);
                  if (event.key === "ArrowUp" && index > 0) {
                    event.preventDefault();
                    // Same-node reorder, not focus-follows-selection: React
                    // keys this <li> by module.id, so after the array
                    // reorders it's the same DOM button that moves — focus
                    // stays put with no extra bookkeeping, letting repeated
                    // presses keep walking the list.
                    onReorderModule(module.id, modules[index - 1].id);
                  } else if (
                    event.key === "ArrowDown" &&
                    index < modules.length - 1
                  ) {
                    event.preventDefault();
                    onReorderModule(modules[index + 1].id, module.id);
                  }
                }}
              >
                <GripVertical size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`module-navigator-row${
                  module.id === activeModuleId ? " active" : ""
                }`}
                aria-current={module.id === activeModuleId ? "true" : undefined}
                onClick={() => {
                  setRailOpen(false);
                  onSelectModule(module.id);
                }}
              >
                <span className="module-navigator-row-name">
                  {module.name?.trim() || "Untitled module"}
                </span>
                {module.id === activeModuleId && (
                  <ChevronRight size={14} aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!searching && (
        <button
          type="button"
          className="module-navigator-add"
          onClick={onAddModule}
          aria-label="Add module"
          title="Add module"
        >
          <Plus size={13} aria-hidden="true" />
          <span>Add module</span>
        </button>
      )}

      <ModuleNavigatorStatus
        saveLabel={saveLabel}
        saveFailed={saveFailed}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
        onRetrySave={onRetrySave}
      />

      <div className="module-navigator-backup-row">
        <button type="button" onClick={exportCourse}>
          Export
        </button>
        <button type="button" onClick={() => importInputRef.current?.click()}>
          Import…
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          aria-label="Import lessons.json"
          data-keymap-ignore
          className="module-navigator-backup-input"
          onChange={handleImportFile}
        />
      </div>
      {importError && <p className="module-navigator-import-error">{importError}</p>}
      {pendingImport && (
        <div className="module-navigator-import-diff" data-keymap-ignore>
          <p className="module-navigator-import-diff-title">Import this file?</p>
          <ul>
            {pendingImport.diff.modulesAdded.map((name) => (
              <li key={`ma-${name}`}>+ module {name}</li>
            ))}
            {pendingImport.diff.modulesRemoved.map((name) => (
              <li key={`mr-${name}`}>− module {name}</li>
            ))}
            {pendingImport.diff.modulesChanged.map((name) => (
              <li key={`mc-${name}`}>~ module {name}</li>
            ))}
            {pendingImport.diff.lessonsAdded.map((name) => (
              <li key={`la-${name}`}>+ lesson {name}</li>
            ))}
            {pendingImport.diff.lessonsRemoved.map((name) => (
              <li key={`lr-${name}`}>− lesson {name}</li>
            ))}
            {pendingImport.diff.lessonsChanged.map((name) => (
              <li key={`lc-${name}`}>~ lesson {name}</li>
            ))}
          </ul>
          {Object.values(pendingImport.diff).every((list) => list.length === 0) && (
            <p className="module-navigator-import-diff-empty">No differences from the current course.</p>
          )}
          <div className="module-navigator-import-diff-actions">
            <button type="button" onClick={confirmImport}>
              Replace course
            </button>
            <button type="button" onClick={() => setPendingImport(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      </div>
    </nav>
  );
}
