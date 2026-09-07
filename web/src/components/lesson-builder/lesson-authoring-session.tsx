"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Copy,
  Eye,
  FileText,
  Languages,
  Plus,
  Save,
  Table2,
  Trash2,
  X,
} from "lucide-react";

import { ExplanationStep } from "@/components/practice/explanation-step";
import {
  SentencePracticeCard,
  type SentenceAuthoringProps,
} from "@/components/practice/sentence-practice-card";
import type { Lesson, LessonBlock } from "@/lib/lesson-builder/types";

export function LessonAuthoringSession({
  lesson,
  lessonNumber,
  moduleName,
  stepIndex,
  saveState,
  isDirty,
  onStepChange,
  onClose,
  onRename,
  onPreview,
  onSave,
  onUpdateExplanation,
  sentenceAuthoring,
  onAddStep,
  onDuplicateStep,
  onMoveStep,
  onDeleteStep,
}: {
  lesson: Lesson;
  lessonNumber: number;
  moduleName: string | null;
  stepIndex: number;
  saveState: "idle" | "saving" | "saved" | "error";
  isDirty: boolean;
  onStepChange: (index: number) => void;
  onClose: () => void;
  onRename: (name: string) => void;
  onPreview: () => void;
  onSave: () => void;
  onUpdateExplanation: (markdown: string) => void;
  sentenceAuthoring: SentenceAuthoringProps;
  onAddStep: (type: "explanation" | "sentence" | "vocabulary") => void;
  onDuplicateStep: () => void;
  onMoveStep: (direction: -1 | 1) => void;
  onDeleteStep: () => void;
}) {
  const totalSteps = lesson.blocks.length;
  const safeStepIndex = Math.min(Math.max(stepIndex, 0), Math.max(totalSteps - 1, 0));
  const block: LessonBlock | undefined = lesson.blocks[safeStepIndex];
  const saveLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "error"
        ? "Save failed"
        : isDirty
          ? "Unsaved"
          : "Saved";

  return (
    <section
      className="learner-theme lesson-session authoring-session"
      role="dialog"
      aria-modal="true"
      aria-labelledby="authoring-lesson-title"
    >
      <header className="lesson-topbar">
        <button
          type="button"
          className="learner-icon-button"
          onClick={onClose}
          aria-label="Close lesson editor"
          title="Back to lessons"
        >
          <X size={21} aria-hidden="true" />
        </button>
        <div className="lesson-topbar-title authoring-title">
          <p>
            {moduleName || "Course"} · Lesson {lessonNumber}
            <span className="authoring-mode-label">Editing</span>
          </p>
          <input
            id="authoring-lesson-title"
            value={lesson.name ?? ""}
            onChange={(event) => onRename(event.target.value)}
            placeholder={`Lesson ${lessonNumber}`}
            aria-label="Lesson name"
          />
        </div>
        <span className={`authoring-save-state ${saveState === "error" ? "error" : ""}`}>
          {saveLabel}
        </span>
        <button
          type="button"
          className="authoring-topbar-action"
          onClick={onPreview}
          title="Try this lesson as a learner (Mod+Enter)"
        >
          <Eye size={17} aria-hidden="true" />
          Preview
        </button>
        <button
          type="button"
          className="authoring-topbar-action primary"
          onClick={onSave}
          disabled={!isDirty || saveState === "saving"}
          title="Save lesson (Mod+S)"
        >
          <Save size={17} aria-hidden="true" />
          Save
        </button>
        <span className="lesson-step-count">
          <strong>{totalSteps ? safeStepIndex + 1 : 0}</strong>
          <span> / {totalSteps}</span>
        </span>
        <progress
          className="lesson-top-progress"
          aria-label="Lesson authoring progress"
          value={totalSteps ? safeStepIndex + 1 : 0}
          max={totalSteps || 1}
        />
      </header>

      <div className="lesson-scroll-area">
        <div className="lesson-stage" key={block?.id ?? "empty"}>
          {block ? (
            <>
              <div className="authoring-step-tools" aria-label="Step tools">
                <span>
                  {block.type === "explanation"
                    ? "Explanation"
                    : block.layout === "vocabulary_table"
                      ? "Vocabulary table"
                      : "Practice"}
                </span>
                <button type="button" onClick={() => onMoveStep(-1)} disabled={safeStepIndex === 0} title="Move step earlier">
                  <ArrowUp size={16} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => onMoveStep(1)} disabled={safeStepIndex === totalSteps - 1} title="Move step later">
                  <ArrowDown size={16} aria-hidden="true" />
                </button>
                <button type="button" onClick={onDuplicateStep} title="Duplicate step">
                  <Copy size={16} aria-hidden="true" />
                </button>
                <button type="button" onClick={onDeleteStep} title="Delete step" className="danger">
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
              {block.type === "explanation" ? (
                <ExplanationStep
                  markdown={block.contentMarkdown}
                  onChange={onUpdateExplanation}
                />
              ) : (
                <SentencePracticeCard
                  sentence={block}
                  authoring={sentenceAuthoring}
                />
              )}
            </>
          ) : (
            <div className="authoring-empty-lesson">
              <p>Start with the first moment in this lesson.</p>
              <div>
                <AddStepButton icon={FileText} label="Explanation" onClick={() => onAddStep("explanation")} />
                <AddStepButton icon={Languages} label="Practice" onClick={() => onAddStep("sentence")} />
                <AddStepButton icon={Table2} label="Vocabulary" onClick={() => onAddStep("vocabulary")} />
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="lesson-controls authoring-controls">
        <div className="lesson-controls-inner">
          <button
            type="button"
            className="learner-icon-button previous-step"
            disabled={safeStepIndex === 0 || totalSteps === 0}
            onClick={() => onStepChange(safeStepIndex - 1)}
            aria-label="Previous step"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <div className="authoring-add-step">
            <span>Add after this step</span>
            <button type="button" onClick={() => onAddStep("explanation")} title="Add explanation (Alt+E)">
              <FileText size={17} aria-hidden="true" /> Explanation
            </button>
            <button type="button" onClick={() => onAddStep("sentence")} title="Add practice (Alt+P)">
              <Languages size={17} aria-hidden="true" /> Practice
            </button>
            <button type="button" onClick={() => onAddStep("vocabulary")} title="Add vocabulary table">
              <Table2 size={17} aria-hidden="true" /> Vocabulary
            </button>
          </div>
          <button
            type="button"
            className="learner-button primary"
            disabled={safeStepIndex >= totalSteps - 1 || totalSteps === 0}
            onClick={() => onStepChange(safeStepIndex + 1)}
          >
            Next step
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </section>
  );
}

function AddStepButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Plus;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}>
      <Icon size={19} aria-hidden="true" />
      {label}
    </button>
  );
}
