"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";

import {
  LessonConceptsField,
  type ConceptDisplayLookup,
} from "@/components/lesson-builder/lesson-concepts-field";
import type { Lesson, LessonModule } from "@/lib/lesson-builder/types";
import { getSentenceValidationIssueCount } from "@/lib/lesson-builder/utils";

export function LessonLibrary({
  modules,
  lessons,
  conceptDisplays,
  saveLabel,
  onOpenLesson,
  onNewLesson,
  onPreviewLesson,
  onDuplicateLesson,
  onDeleteLesson,
  onAddModule,
  onDeleteModule,
  onMoveModule,
  onMoveLesson,
  onMoveLessonToModule,
  onChangeModule,
}: {
  modules: LessonModule[];
  lessons: Lesson[];
  conceptDisplays: ConceptDisplayLookup;
  saveLabel: string;
  onOpenLesson: (moduleId: string, lessonId: string) => void;
  onNewLesson: (moduleId: string) => void;
  onPreviewLesson: (lessonId: string) => void;
  onDuplicateLesson: (lessonId: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onAddModule: () => void;
  onDeleteModule: (moduleId: string) => void;
  onMoveModule: (index: number, direction: -1 | 1) => void;
  onMoveLesson: (moduleId: string, index: number, direction: -1 | 1) => void;
  onMoveLessonToModule: (lessonId: string, moduleId: string) => void;
  onChangeModule: (moduleId: string, patch: Partial<LessonModule>) => void;
}) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [settingsModuleId, setSettingsModuleId] = useState<string | null>(null);
  const [openLessonMenu, setOpenLessonMenu] = useState<string | null>(null);
  const lessonById = useMemo(
    () => new Map(lessons.map((lesson) => [lesson.id, lesson])),
    [lessons],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const totalSlides = lessons.reduce((count, lesson) => count + lesson.blocks.length, 0);
  const hasSearchMatches = !normalizedQuery || lessons.some((lesson) =>
    lesson.name?.toLocaleLowerCase().includes(normalizedQuery) ||
    lesson.concepts.some((concept) => concept.label.toLocaleLowerCase().includes(normalizedQuery)),
  );

  return (
    <section className="lesson-library" aria-label="Course lessons">
      <header className="lesson-library-header">
        <div>
          <p className="lesson-library-eyebrow">Lesson Builder</p>
          <h1>Your course</h1>
          <p>{modules.length} module{modules.length === 1 ? "" : "s"} · {lessons.length} lessons · {totalSlides} slides</p>
        </div>
        <div className="lesson-library-header-actions">
          <span>{saveLabel}</span>
          <Link href="/course"><Eye size={16} /> Preview course</Link>
          <Link href="/admin/lesson-builder/coverage">Coverage</Link>
          <button type="button" onClick={onAddModule}><Plus size={16} /> New module</button>
        </div>
      </header>

      <label className="lesson-library-search">
        <Search size={18} aria-hidden="true" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a lesson or concept…" aria-label="Find a lesson or concept" />
        <kbd>Ctrl K</kbd>
      </label>

      <div className="lesson-library-modules">
        {modules.map((module, moduleIndex) => {
          const moduleLessons = module.lessonIds
            .map((id) => lessonById.get(id))
            .filter((lesson): lesson is Lesson => Boolean(lesson));
          const visibleLessons = moduleLessons.filter((lesson) =>
            !normalizedQuery ||
            lesson.name?.toLocaleLowerCase().includes(normalizedQuery) ||
            lesson.concepts.some((concept) => concept.label.toLocaleLowerCase().includes(normalizedQuery)),
          );
          if (normalizedQuery && visibleLessons.length === 0) return null;
          const isCollapsed = collapsed.has(module.id);
          const settingsOpen = settingsModuleId === module.id;

          return (
            <section key={module.id} className="lesson-library-module">
              <div className="lesson-library-module-header">
                <button
                  type="button"
                  className="lesson-library-collapse"
                  onClick={() => setCollapsed((current) => {
                    const next = new Set(current);
                    if (next.has(module.id)) next.delete(module.id); else next.add(module.id);
                    return next;
                  })}
                  aria-label={isCollapsed ? "Show lessons" : "Hide lessons"}
                >
                  {isCollapsed ? <ChevronRight size={19} /> : <ChevronDown size={19} />}
                </button>
                <div className="lesson-library-module-name">
                  <h2>{module.name || "Untitled module"}</h2>
                  <p>{moduleLessons.length} lesson{moduleLessons.length === 1 ? "" : "s"} · {moduleLessons.reduce((sum, lesson) => sum + lesson.blocks.length, 0)} slides</p>
                </div>
                <div className="lesson-library-module-actions">
                  <button type="button" onClick={() => setSettingsModuleId(settingsOpen ? null : module.id)}><Settings2 size={15} /> Module settings</button>
                  <button type="button" onClick={() => onNewLesson(module.id)} className="primary"><Plus size={16} /> New lesson</button>
                </div>
              </div>

              {settingsOpen && (
                <div className="lesson-library-module-settings">
                  <label><span>Module name</span><input value={module.name ?? ""} onChange={(event) => onChangeModule(module.id, { name: event.target.value || null })} /></label>
                  <label><span>Placement</span><select value={module.kind ?? "course"} onChange={(event) => onChangeModule(module.id, { kind: event.target.value as "course" | "onboarding" })}><option value="course">Numbered course module</option><option value="onboarding">Start-here onboarding</option></select></label>
                  <LessonConceptsField
                    variant="inline"
                    label="Module concepts"
                    concepts={module.keyConcepts}
                    conceptDisplays={conceptDisplays}
                    onAdd={(concept) => onChangeModule(module.id, { keyConcepts: [...module.keyConcepts, concept] })}
                    onRemove={(id) => onChangeModule(module.id, { keyConcepts: module.keyConcepts.filter((concept) => concept.id !== id) })}
                    onRelabel={(id, label) => onChangeModule(module.id, { keyConcepts: module.keyConcepts.map((concept) => concept.id === id ? { ...concept, label } : concept) })}
                  />
                  <div className="lesson-library-module-danger">
                    <button type="button" onClick={() => onMoveModule(moduleIndex, -1)} disabled={moduleIndex === 0}><ArrowUp size={14} /> Move module up</button>
                    <button type="button" onClick={() => onMoveModule(moduleIndex, 1)} disabled={moduleIndex === modules.length - 1}><ArrowDown size={14} /> Move module down</button>
                    <button type="button" onClick={() => onDeleteModule(module.id)} disabled={modules.length === 1}><Trash2 size={14} /> Delete module</button>
                  </div>
                </div>
              )}

              {(!isCollapsed || Boolean(normalizedQuery)) && (
                <div className="lesson-library-list">
                  {visibleLessons.map((lesson) => {
                    const courseLessonIndex = moduleLessons.findIndex((candidate) => candidate.id === lesson.id);
                    const issues = lesson.blocks.reduce((count, block) => count + (block.type === "sentence" ? getSentenceValidationIssueCount(block) : 0), 0);
                    const status = issues > 0 ? "Needs attention" : lesson.blocks.length === 0 || lesson.concepts.length === 0 || !lesson.name?.trim() ? "Draft" : "Ready";
                    return (
                      <article key={lesson.id} className="lesson-library-row">
                        <button type="button" className="lesson-library-open" onClick={() => onOpenLesson(module.id, lesson.id)}>
                          <span className="lesson-library-number">{courseLessonIndex + 1}</span>
                          <span className="lesson-library-summary">
                            <strong>{lesson.name || "Untitled lesson"}</strong>
                            <small>{lesson.blocks.length} slide{lesson.blocks.length === 1 ? "" : "s"} · {lesson.concepts.length ? lesson.concepts.map((concept) => concept.label).join(" · ") : "Concepts not reviewed"}</small>
                          </span>
                          <span className={`lesson-library-status ${status === "Ready" ? "ready" : status === "Needs attention" ? "attention" : "draft"}`}>{status}</span>
                          <ArrowRight size={18} aria-hidden="true" />
                        </button>
                        <div className="lesson-library-row-menu">
                          <button type="button" aria-label={`Options for ${lesson.name || "untitled lesson"}`} onClick={() => setOpenLessonMenu(openLessonMenu === lesson.id ? null : lesson.id)}><MoreHorizontal size={18} /></button>
                          {openLessonMenu === lesson.id && <div>
                            <button type="button" onClick={() => { onPreviewLesson(lesson.id); setOpenLessonMenu(null); }}><Eye size={14} /> Preview</button>
                            <button type="button" onClick={() => { onDuplicateLesson(lesson.id); setOpenLessonMenu(null); }}><Copy size={14} /> Duplicate</button>
                            <button type="button" onClick={() => onMoveLesson(module.id, courseLessonIndex, -1)} disabled={courseLessonIndex === 0}><ArrowUp size={14} /> Move earlier</button>
                            <button type="button" onClick={() => onMoveLesson(module.id, courseLessonIndex, 1)} disabled={courseLessonIndex === moduleLessons.length - 1}><ArrowDown size={14} /> Move later</button>
                            {modules.length > 1 && <label className="lesson-library-move-to"><span>Move to module</span><select value={module.id} onChange={(event) => { if (event.target.value !== module.id) onMoveLessonToModule(lesson.id, event.target.value); setOpenLessonMenu(null); }}>{modules.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name || "Untitled module"}</option>)}</select></label>}
                            <button type="button" className="danger" onClick={() => { onDeleteLesson(lesson.id); setOpenLessonMenu(null); }}><Trash2 size={14} /> Delete</button>
                          </div>}
                        </div>
                      </article>
                    );
                  })}
                  {visibleLessons.length === 0 && <div className="lesson-library-empty"><BookOpen size={22} /><p>No lessons here yet.</p><button type="button" onClick={() => onNewLesson(module.id)}>Create the first lesson</button></div>}
                </div>
              )}
            </section>
          );
        })}
        {!hasSearchMatches && <div className="lesson-library-no-results"><Search size={20} /><p>No lessons match “{query.trim()}”.</p></div>}
      </div>
    </section>
  );
}
