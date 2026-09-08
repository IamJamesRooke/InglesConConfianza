"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCheck, ChevronDown, Copy, Eye, FileText, GripVertical, Languages, List, MoreHorizontal, Plus, Save, Settings2, Sparkles, Table2, Trash2, X } from "lucide-react";

import { ExplanationStep } from "@/components/practice/explanation-step";
import { SentencePracticeCard, type SentenceAuthoringProps } from "@/components/practice/sentence-practice-card";
import type { Lesson, LessonBlock } from "@/lib/lesson-builder/types";

type NewStepType = "explanation" | "sentence" | "vocabulary" | "pair";

export function LessonAuthoringSession({
  lesson, lessonNumber, moduleName, stepIndex, saveState, isDirty,
  onStepChange, onDone, onRename, onPreview, onSave, onUpdateExplanation,
  sentenceAuthoring, conceptEditor, onAddStep, onDuplicateStep, onMoveStep, onDeleteStep,
}: {
  lesson: Lesson;
  lessonNumber: number;
  moduleName: string | null;
  stepIndex: number;
  saveState: "idle" | "saving" | "saved" | "error";
  isDirty: boolean;
  onStepChange: (index: number) => void;
  onDone: () => void;
  onRename: (name: string) => void;
  onPreview: () => void;
  onSave: () => void;
  onUpdateExplanation: (markdown: string) => void;
  sentenceAuthoring: SentenceAuthoringProps;
  conceptEditor: ReactNode;
  onAddStep: (type: NewStepType) => void;
  onDuplicateStep: () => void;
  onMoveStep: (direction: -1 | 1) => void;
  onDeleteStep: () => void;
}) {
  const totalSteps = lesson.blocks.length;
  const safeStepIndex = Math.min(Math.max(stepIndex, 0), Math.max(totalSteps - 1, 0));
  const block: LessonBlock | undefined = lesson.blocks[safeStepIndex];
  const [isSetup, setIsSetup] = useState(lesson.blocks.length === 0);
  const [isEnding, setIsEnding] = useState(false);
  const [openMenu, setOpenMenu] = useState<"outline" | "add" | "more" | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [shortcutKey, setShortcutKey] = useState("Ctrl");
  const issues: Array<{ index: number | null; label: string }> = [
    ...(!lesson.name?.trim() ? [{ index: null, label: "Give the lesson a name" }] : []),
    ...(lesson.concepts.length === 0 ? [{ index: null, label: "Review concepts covered" }] : []),
    ...lesson.blocks.flatMap((candidate, index) => {
      const incomplete = candidate.type === "explanation"
        ? !candidate.contentMarkdown.trim()
        : candidate.languageBlocks.length === 0 || candidate.languageBlocks.some((item) => !item.spanish.trim() || !item.acceptedAnswers[0]?.trim());
      return incomplete ? [{ index, label: slideLabel(candidate, index) }] : [];
    }),
  ];
  const position = isSetup ? 0 : isEnding ? totalSteps + 1 : totalSteps ? safeStepIndex + 1 : 0;
  const saveLabel = saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed — retry" : isDirty ? "Unsaved" : "Saved";

  useEffect(() => {
    if (!/Mac|iPhone|iPad/u.test(navigator.platform)) return;
    const timer = window.setTimeout(() => setShortcutKey("⌘"), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const visitStep = useCallback((index: number) => {
    setIsSetup(false);
    setIsEnding(false);
    setOpenMenu(null);
    onStepChange(index);
  }, [onStepChange]);

  function addStep(type: NewStepType) {
    setIsSetup(false);
    setIsEnding(false);
    setOpenMenu(null);
    onAddStep(type);
    if (type === "explanation") {
      window.setTimeout(() =>
        document.querySelector<HTMLElement>(".lesson-stage [contenteditable='true']")?.focus(),
      0);
    }
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || event.isComposing) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      const isTextEntry = Boolean(target?.closest("input, textarea, [contenteditable='true']"));
      if (event.key === "Escape") {
        if (isTextEntry) { event.preventDefault(); target?.blur(); }
        else if (showKeyboardHelp) { event.preventDefault(); setShowKeyboardHelp(false); }
        else if (openMenu) { event.preventDefault(); setOpenMenu(null); }
        return;
      }
      if (event.key === "PageUp") {
        event.preventDefault();
        if (isEnding && totalSteps) visitStep(totalSteps - 1);
        else if (!isSetup && safeStepIndex > 0) visitStep(safeStepIndex - 1);
        else if (!isSetup) { setIsSetup(true); setIsEnding(false); }
      } else if (event.key === "PageDown") {
        event.preventDefault();
        if (isSetup && totalSteps) visitStep(0);
        else if (isSetup) setOpenMenu("add");
        else if (!isEnding && safeStepIndex < totalSteps - 1) visitStep(safeStepIndex + 1);
        else if (!isEnding && totalSteps) setIsEnding(true);
      } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault(); setOpenMenu("add");
      } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "o") {
        event.preventDefault(); setOpenMenu("outline");
      } else if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === "Enter") {
        event.preventDefault(); setOpenMenu("add");
      } else if (event.key === "?" && !isTextEntry) {
        event.preventDefault(); setShowKeyboardHelp(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handleKeyDown); };
  }, [isEnding, isSetup, openMenu, safeStepIndex, showKeyboardHelp, totalSteps, visitStep]);

  return (
    <section className="learner-theme lesson-session authoring-session" role="dialog" aria-modal="true" aria-labelledby="authoring-lesson-title">
      <header className="lesson-topbar authoring-topbar">
        <button type="button" className="learner-icon-button" onClick={onDone} aria-label="Finish editing" title="Done"><X size={20} aria-hidden="true" /></button>
        <div className="lesson-topbar-title authoring-title">
          <p>{moduleName || "Course"} · Lesson {lessonNumber}</p>
          <input id="authoring-lesson-title" autoFocus={lesson.name === null && lesson.blocks.length === 0} value={lesson.name ?? ""} onChange={(event) => onRename(event.target.value)} placeholder={`Name lesson ${lessonNumber}`} aria-label="Lesson name" />
        </div>
        <button type="button" className={`authoring-save-state ${saveState === "error" ? "error" : ""}`} onClick={saveState === "error" || isDirty ? onSave : undefined} disabled={saveState === "saving"}>
          {saveState === "saving" ? <Save size={14} className="authoring-spin" aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}{saveLabel}
        </button>
        <button type="button" className="authoring-topbar-action" onClick={onPreview} title={`Try lesson (${shortcutKey}+Enter)`}><Eye size={17} aria-hidden="true" /> Try lesson</button>
        <button type="button" className="authoring-topbar-action primary" onClick={onDone}>Done</button>
        <progress className="lesson-top-progress" aria-label="Lesson authoring progress" value={position + 1} max={totalSteps + 2} />
      </header>

      <div className="lesson-scroll-area" onClick={() => openMenu && setOpenMenu(null)}>
        <div className="lesson-stage" key={isSetup ? "setup" : isEnding ? "ending" : block?.id ?? "empty"}>
          {isSetup ? <LessonSetup lesson={lesson} moduleName={moduleName} conceptEditor={conceptEditor} />
            : isEnding ? <LessonEnding lesson={lesson} issues={issues} onVisitIssue={(index) => index === null ? (setIsSetup(true), setIsEnding(false)) : visitStep(index)} onPreview={onPreview} />
            : block ? block.type === "explanation"
              ? <ExplanationStep markdown={block.contentMarkdown} onChange={onUpdateExplanation} />
              : <SentencePracticeCard sentence={block} authoring={sentenceAuthoring} />
            : <div className="authoring-empty-lesson"><Sparkles size={26} aria-hidden="true" /><p>What should your learner understand first?</p><button type="button" autoFocus onClick={() => addStep("explanation")}><Plus size={18} aria-hidden="true" /> Write the first slide</button></div>}
        </div>
      </div>

      <footer className="lesson-controls authoring-controls">
        <div className="lesson-controls-inner">
          <button type="button" className="authoring-nav-button" disabled={isSetup} onClick={() => isEnding ? visitStep(totalSteps - 1) : safeStepIndex === 0 ? (setIsSetup(true), setIsEnding(false)) : visitStep(safeStepIndex - 1)}><ArrowLeft size={18} aria-hidden="true" /> Previous</button>
          <div className="authoring-footer-center">
            <div className="authoring-menu-anchor">
              <button type="button" className="authoring-position-button" onClick={(event) => { event.stopPropagation(); setOpenMenu(openMenu === "outline" ? null : "outline"); }}>{isSetup ? "Lesson setup" : isEnding ? "Lesson ending" : `Slide ${position} of ${totalSteps}`}<ChevronDown size={15} aria-hidden="true" /></button>
              {openMenu === "outline" && <div className="authoring-popover authoring-outline" onClick={(event) => event.stopPropagation()}>
                <p className="authoring-popover-title">Lesson outline</p>
                <button type="button" className={isSetup ? "active" : ""} onClick={() => { setIsSetup(true); setIsEnding(false); setOpenMenu(null); }}><span>0</span><Settings2 size={14} aria-hidden="true" /><span>Lesson setup · concepts covered</span></button>
                {lesson.blocks.map((item, index) => <button key={item.id} type="button" className={!isSetup && !isEnding && index === safeStepIndex ? "active" : ""} onClick={() => visitStep(index)}><span>{index + 1}</span><GripVertical size={14} aria-hidden="true" /><span>{slideLabel(item, index)}</span></button>)}
                <button type="button" className={isEnding ? "active" : ""} onClick={() => { setIsEnding(true); setOpenMenu(null); }}><span>{totalSteps + 1}</span><CheckCheck size={14} aria-hidden="true" /><span>Lesson ending</span></button>
              </div>}
            </div>
            <span className="authoring-key-hint"><kbd>PgUp</kbd><kbd>PgDn</kbd> slides · <kbd>{shortcutKey} K</kbd> commands · <button type="button" onClick={() => setShowKeyboardHelp(true)}>?</button></span>
          </div>
          <div className="authoring-footer-actions">
            {!isSetup && !isEnding && block && <div className="authoring-menu-anchor">
              <button type="button" className="authoring-icon-action" onClick={(event) => { event.stopPropagation(); setOpenMenu(openMenu === "more" ? null : "more"); }} aria-label="Slide options"><MoreHorizontal size={19} aria-hidden="true" /></button>
              {openMenu === "more" && <div className="authoring-popover authoring-action-menu" onClick={(event) => event.stopPropagation()}>
                <button type="button" onClick={() => { onMoveStep(-1); setOpenMenu(null); }} disabled={safeStepIndex === 0}>Move earlier <kbd>{shortcutKey}⇧↑</kbd></button>
                <button type="button" onClick={() => { onMoveStep(1); setOpenMenu(null); }} disabled={safeStepIndex === totalSteps - 1}>Move later <kbd>{shortcutKey}⇧↓</kbd></button>
                <button type="button" onClick={() => { onDuplicateStep(); setOpenMenu(null); }}><Copy size={15} /> Duplicate <kbd>{shortcutKey}⇧D</kbd></button>
                <button type="button" className="danger" onClick={() => { onDeleteStep(); setOpenMenu(null); }}><Trash2 size={15} /> Delete slide</button>
              </div>}
            </div>}
            <div className="authoring-menu-anchor">
              <button type="button" className="authoring-add-button" onClick={(event) => { event.stopPropagation(); setOpenMenu(openMenu === "add" ? null : "add"); }}><Plus size={18} aria-hidden="true" /> Add slide</button>
              {openMenu === "add" && <AddMenu onAdd={addStep} shortcutKey={shortcutKey} />}
            </div>
            <button type="button" className="learner-button primary authoring-next-button" onClick={() => { if (isSetup && !totalSteps) setOpenMenu("add"); else if (isSetup) visitStep(0); else if (isEnding) onDone(); else if (safeStepIndex < totalSteps - 1) visitStep(safeStepIndex + 1); else setIsEnding(true); }}>
              {isSetup && !totalSteps ? "Add first slide" : isSetup ? "Start slides" : isEnding ? "Done" : safeStepIndex === totalSteps - 1 ? "Review ending" : "Next"}{isEnding ? <Check size={18} aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </footer>
      {showKeyboardHelp && <KeyboardHelp shortcutKey={shortcutKey} onClose={() => setShowKeyboardHelp(false)} />}
    </section>
  );
}

function AddMenu({ onAdd, shortcutKey }: { onAdd: (type: NewStepType) => void; shortcutKey: string }) {
  return <div className="authoring-popover authoring-add-menu" onClick={(event) => event.stopPropagation()}>
    <p className="authoring-popover-title">Add after this slide</p>
    <button type="button" autoFocus onClick={() => onAdd("explanation")}><FileText size={18} /><span><strong>Explain</strong><small>A short idea or visible pattern</small></span></button>
    <button type="button" onClick={() => onAdd("sentence")}><Languages size={18} /><span><strong>Practice</strong><small>Ask the learner to retrieve English</small></span></button>
    <button type="button" onClick={() => onAdd("vocabulary")}><Table2 size={18} /><span><strong>Vocabulary</strong><small>Several Spanish and English pairs</small></span></button>
    <button type="button" onClick={() => onAdd("pair")}><Sparkles size={18} /><span><strong>Explain + practice</strong><small>Create the teaching rhythm in one step</small></span></button>
    <p className="authoring-popover-hint">Open anywhere with <kbd>{shortcutKey}⇧A</kbd></p>
  </div>;
}

function LessonSetup({ lesson, moduleName, conceptEditor }: { lesson: Lesson; moduleName: string | null; conceptEditor: ReactNode }) {
  return <div className="authoring-lesson-setup">
    <div className="authoring-setup-icon"><Settings2 size={24} aria-hidden="true" /></div>
    <p className="authoring-setup-eyebrow">Lesson setup</p>
    <h1>{lesson.name || "Name your lesson above"}</h1>
    <p className="authoring-setup-module">In {moduleName || "your course"}</p>
    <div className="authoring-setup-concepts">
      <div><h2>What concepts does this lesson cover?</h2><p>Search in Spanish or English. These tags help you track what has been taught.</p></div>
      {conceptEditor}
      {lesson.concepts.length === 0 && <p className="authoring-setup-note">Add at least one concept before the lesson is ready. You can still save a draft.</p>}
    </div>
  </div>;
}

function LessonEnding({ lesson, issues, onVisitIssue, onPreview }: { lesson: Lesson; issues: Array<{ index: number | null; label: string }>; onVisitIssue: (index: number | null) => void; onPreview: () => void }) {
  return <div className="lesson-celebration authoring-ending">
    <div className="completion-seal"><CheckCheck size={32} aria-hidden="true" /></div><p className="completion-status">Lesson ending</p>
    <h1>{lesson.name || "Untitled lesson"}</h1><p>This is where your learner finishes after the final teaching slide.</p>
    {issues.length ? <div className="authoring-ending-issues"><strong>{issues.length} item{issues.length === 1 ? " needs" : "s need"} attention</strong>{issues.map((issue, issueIndex) => <button type="button" key={`${issue.index}-${issueIndex}`} onClick={() => onVisitIssue(issue.index)}>{issue.index === null ? "Lesson setup" : `Slide ${issue.index + 1}`}: {issue.label} <ArrowRight size={14} /></button>)}</div>
      : <p className="authoring-ending-ready"><Check size={17} /> Every practice slide has a prompt and answer.</p>}
    <button type="button" className="completion-action primary" onClick={onPreview}><Eye size={17} /> Try the complete lesson</button>
  </div>;
}

function KeyboardHelp({ shortcutKey, onClose }: { shortcutKey: string; onClose: () => void }) {
  const rows = [["Tab / Shift Tab", "Move through fields"], ["PageUp / PageDown", "Previous or next slide"], [`${shortcutKey} K`, "Find any action or lesson"], [`${shortcutKey} S`, "Save now"], [`${shortcutKey} Enter`, "Add the next slide"], [`${shortcutKey} Shift A`, "Add a slide"], [`${shortcutKey} Shift O`, "Open lesson outline"], [`${shortcutKey} Shift 1 / 2`, "Mark selected text Spanish or English"], [`${shortcutKey} B`, "Bold selected text"], [`${shortcutKey} Shift 0`, "Clear selected formatting"], ["Escape", "Finish editing or close a menu"]];
  return <div className="authoring-help-backdrop" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="authoring-help-dialog"><div><span><List size={18} /> Keyboard shortcuts</span><button type="button" autoFocus onClick={onClose} aria-label="Close"><X size={18} /></button></div>{rows.map(([keys, label]) => <p key={keys}><span>{label}</span><kbd>{keys}</kbd></p>)}</div></div>;
}

function slideLabel(block: LessonBlock, index: number) {
  const type = block.type === "explanation" ? "Explanation" : block.layout === "vocabulary_table" ? "Vocabulary" : "Practice";
  const text = block.type === "explanation" ? block.contentMarkdown : block.promptText || block.languageBlocks[0]?.spanish || block.promptLabel;
  const plain = text.replace(/\[\[(?:es|en):([^\]]+)\]\]|==([^=]+)==|[*#_<>/]/gu, "$1$2").trim();
  return plain ? `${type} — ${plain.slice(0, 42)}` : `${type} ${index + 1}`;
}
