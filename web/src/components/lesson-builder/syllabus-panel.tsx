"use client";

// The module header's "Syllabus" panel — see docs/design/module-syllabus.md.
// Two authored tabs (Main teaching points, Review) reuse the existing
// concept picker; Also taught and Reviewed are read-only derived lists.
// Everything here reads/writes `module.syllabus` through `onChangeModule`
// (the module store isn't part of the undoable lessons history — same as
// every other module-level edit, e.g. renaming).
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { useState } from "react";

import { LessonConceptsField } from "@/components/lesson-builder/lesson-concepts-field";
import { conceptKey } from "@/lib/lesson-builder/lesson-file";
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
  removeMainItem,
  removeReviewItem,
  syllabusOf,
  type ModuleSyllabus,
} from "@/lib/lesson-builder/syllabus";
import type {
  ConceptDisplayLookup,
  Lesson,
  LessonModule,
} from "@/lib/lesson-builder/types";
import { createId } from "@/lib/lesson-builder/utils";

type Props = {
  module: LessonModule;
  moduleIndex: number;
  modules: LessonModule[];
  lessons: Lesson[];
  conceptDisplays: ConceptDisplayLookup;
  onChangeModule: (moduleId: string, patch: Partial<LessonModule>) => void;
};

export function SyllabusPanel({
  module,
  moduleIndex,
  modules,
  lessons,
  conceptDisplays,
  onChangeModule,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"main" | "review">("main");
  const [briefCopied, setBriefCopied] = useState(false);

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
    (item) => !alreadyPlannedKeys.has(conceptKey(item)),
  );

  const missingKeys = new Set(
    [...syllabus.main, ...syllabus.review]
      .filter((item) => isMissingConcept(item, conceptDisplays))
      .map(conceptKey),
  );
  const coveredKeys = new Set(
    [...syllabus.main, ...syllabus.review]
      .filter((item) => coverageOfItem(item, moduleLessons).covered)
      .map(conceptKey),
  );

  function patchSyllabus(next: ModuleSyllabus) {
    onChangeModule(module.id, { syllabus: next });
  }

  function copyBrief() {
    const text = moduleBrief(module, moduleIndex, lessons, timeline, conceptDisplays);
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setBriefCopied(true);
        window.setTimeout(() => setBriefCopied(false), 1500);
      })
      .catch(() => {
        /* clipboard unavailable — the button just doesn't confirm */
      });
  }

  return (
    <div className="syllabus-panel">
      <button
        type="button"
        className="syllabus-panel-toggle"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
        <span className="syllabus-panel-title">Syllabus</span>
        <span className="syllabus-panel-summary">
          Main {mainCovered}/{syllabus.main.length} · Review {reviewCovered}/{syllabus.review.length} · Also
          taught {alsoTaught.length}
          {warningCount > 0 && <span className="syllabus-panel-warning-count"> · ⚠ {warningCount}</span>}
        </span>
      </button>

      {open && (
        <div className="syllabus-panel-body">
          <div
            className="syllabus-panel-progress"
            role="progressbar"
            aria-valuenow={totalCovered}
            aria-valuemin={0}
            aria-valuemax={totalItems}
            aria-label="Syllabus coverage"
          >
            <div
              className="syllabus-panel-progress-fill"
              style={{ width: `${totalItems === 0 ? 0 : Math.round((totalCovered / totalItems) * 100)}%` }}
            />
          </div>

          <div className="syllabus-panel-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "main"}
              className={tab === "main" ? "syllabus-panel-tab is-active" : "syllabus-panel-tab"}
              onClick={() => setTab("main")}
            >
              Main teaching points
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "review"}
              className={tab === "review" ? "syllabus-panel-tab is-active" : "syllabus-panel-tab"}
              onClick={() => setTab("review")}
            >
              Review
            </button>
          </div>

          {tab === "main" ? (
            <>
              <LessonConceptsField
                variant="compact"
                label=""
                concepts={syllabus.main}
                conceptDisplays={conceptDisplays}
                coveredConceptKeys={coveredKeys}
                missingConceptKeys={missingKeys}
                onAdd={(concept) => patchSyllabus(addMainItem(syllabus, concept))}
                onRemove={(id) => patchSyllabus(removeMainItem(syllabus, id))}
                onRelabel={() => {}}
              />
              {syllabus.main.length > 1 && (
                <ol className="syllabus-panel-order">
                  {syllabus.main.map((item, index) => (
                    <li key={item.id}>
                      <span className="syllabus-panel-order-label">
                        {index + 1}. {item.label}
                      </span>
                      <span className="syllabus-panel-order-controls">
                        <button
                          type="button"
                          disabled={index === 0}
                          aria-label={`Move ${item.label} earlier`}
                          onClick={() =>
                            patchSyllabus(
                              reorderMainItems(syllabus, item.id, syllabus.main[index - 1].id, "before"),
                            )
                          }
                        >
                          <ChevronUp size={13} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={index === syllabus.main.length - 1}
                          aria-label={`Move ${item.label} later`}
                          onClick={() =>
                            patchSyllabus(
                              reorderMainItems(syllabus, item.id, syllabus.main[index + 1].id, "after"),
                            )
                          }
                        >
                          <ChevronDown size={13} aria-hidden="true" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </>
          ) : (
            <>
              <LessonConceptsField
                variant="compact"
                label=""
                concepts={syllabus.review}
                conceptDisplays={conceptDisplays}
                coveredConceptKeys={coveredKeys}
                missingConceptKeys={missingKeys}
                onAdd={(concept) => patchSyllabus(addReviewItem(syllabus, concept))}
                onRemove={(id) => patchSyllabus(removeReviewItem(syllabus, id))}
                onRelabel={() => {}}
              />
              <div className="syllabus-panel-suggestions">
                {reviewSuggestions.length === 0 ? (
                  <p className="syllabus-panel-empty">
                    {moduleIndex === 0 ? "Nothing to review yet." : "No further review suggestions."}
                  </p>
                ) : (
                  reviewSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="syllabus-panel-suggestion"
                      onClick={() =>
                        patchSyllabus(addReviewItem(syllabus, { ...item, id: createId("lesson_concept") }))
                      }
                    >
                      + {item.label}
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          <div className="syllabus-panel-derived">
            <div className="syllabus-panel-derived-column">
              <h4>Also taught</h4>
              {alsoTaught.length === 0 ? (
                <p className="syllabus-panel-empty">None yet.</p>
              ) : (
                <ul>
                  {alsoTaught.map((item) => (
                    <li key={item.id}>
                      <span>{item.label}</span>
                      <button
                        type="button"
                        className="syllabus-panel-promote"
                        onClick={() => patchSyllabus(promoteToMain(syllabus, item))}
                      >
                        Promote to Main
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="syllabus-panel-derived-column">
              <h4>Reviewed</h4>
              {reviewed.length === 0 ? (
                <p className="syllabus-panel-empty">None yet.</p>
              ) : (
                <ul>
                  {reviewed.map((item) => (
                    <li key={item.id}>{item.label}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <button type="button" className="syllabus-panel-brief" onClick={copyBrief}>
            {briefCopied ? "Copied!" : "Copy module brief"}
          </button>
        </div>
      )}
    </div>
  );
}
