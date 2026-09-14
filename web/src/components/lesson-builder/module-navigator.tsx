"use client";

import { ChevronRight, GripVertical, Plus, Search } from "lucide-react";
import { useState, type DragEvent } from "react";

import type { Lesson, LessonModule } from "@/lib/lesson-builder/types";

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
        const label = concept.label ?? "";
        const match = findMatch(label, foldedQuery);
        if (match) {
          contentHits.push({
            module: courseModule,
            lesson,
            blockId: null,
            field: "concept",
            isTitleHit: false,
            excerpt: buildExcerpt(label, match),
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
  activeModuleId: string | null;
  onSelectModule: (moduleId: string) => void;
  onSelectLesson: (lessonId: string, blockId?: string) => void;
  onAddModule: () => void;
  onReorderModule: (draggedModuleId: string, targetModuleId: string) => void;
};

export function ModuleNavigator({
  modules,
  lessons,
  activeModuleId,
  onSelectModule,
  onSelectLesson,
  onAddModule,
  onReorderModule,
}: Props) {
  const [query, setQuery] = useState("");
  const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null);
  const results = searchModuleNavigator(modules, lessons, query);
  const searching = query.trim().length > 0;

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
    if (!result.lesson) {
      onSelectModule(result.module.id);
      return;
    }
    onSelectLesson(result.lesson.id, result.blockId ?? undefined);
  }

  return (
    <nav className="module-navigator" aria-label="Course modules">
      <div className="module-navigator-header">
        <div className="module-navigator-search">
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
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
                aria-label={`Drag to reorder ${module.name?.trim() || "module"}`}
                title="Drag to reorder"
                onDragStart={(event) => startDrag(event, module.id)}
                onDragEnd={() => setDraggedModuleId(null)}
              >
                <GripVertical size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`module-navigator-row${
                  module.id === activeModuleId ? " active" : ""
                }`}
                aria-current={module.id === activeModuleId ? "true" : undefined}
                onClick={() => onSelectModule(module.id)}
              >
                <span className="module-navigator-row-name">
                  {module.name?.trim() || "Untitled module"}
                </span>
                <span className="module-navigator-row-count">
                  {module.lessonIds.length}
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
    </nav>
  );
}
