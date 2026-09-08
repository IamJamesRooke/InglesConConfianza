"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import type { DocumentBlockType } from "@/components/lesson-builder/lesson-document";
import { LessonLibrary } from "@/components/lesson-builder/lesson-library";
import type { ConceptDisplayLookup } from "@/components/lesson-builder/lesson-concepts-field";
import { LessonSelector, type PracticeLesson } from "@/components/practice/lesson-selector";
import { undoableLessonsReducer, initialUndoableLessons } from "@/lib/lesson-builder/reducer";
import type { LanguageBlock, Lesson, LessonBlock, LessonConcept, LessonFile, LessonModule } from "@/lib/lesson-builder/types";
import { createId, normalizeLessons } from "@/lib/lesson-builder/utils";

type SaveState = "loading" | "idle" | "saving" | "saved" | "error";
type Deletion =
  | { kind: "slide"; lessonId: string; block: LessonBlock; index: number }
  | { kind: "piece"; lessonId: string; blockId: string; piece: LanguageBlock; index: number };
type PreviewOrigin = {
  element: HTMLElement | null;
  inputSelection: [number, number] | null;
  range: Range | null;
  scrollY: number;
};

function isTextEditingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, [contenteditable='true']"));
}

export default function LessonBuilderPage() {
  const [history, dispatch] = useReducer(undoableLessonsReducer, initialUndoableLessons);
  const lessons = history.present;
  const [modules, setModules] = useState<LessonModule[]>([]);
  const [conceptDisplays, setConceptDisplays] = useState<ConceptDisplayLookup>({});
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [savedLessonHashes, setSavedLessonHashes] = useState<Map<string, string>>(new Map());
  const [savedModulesHash, setSavedModulesHash] = useState("[]");
  const [previewLessonId, setPreviewLessonId] = useState<string | null>(null);
  const [deletionUndo, setDeletionUndo] = useState<{ lessonId: string; label: string } | null>(null);
  const deletionRef = useRef<Deletion | null>(null);
  const savedLessonJson = useRef(new Map<string, string>());
  const savedModulesJson = useRef("[]");
  const lessonsRef = useRef<Lesson[]>([]);
  const modulesRef = useRef<LessonModule[]>([]);
  const lessonSaveTimer = useRef<number | undefined>(undefined);
  const courseSaveTimer = useRef<number | undefined>(undefined);
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const previewOrigin = useRef<PreviewOrigin | null>(null);

  useEffect(() => { lessonsRef.current = lessons; }, [lessons]);
  useEffect(() => { modulesRef.current = modules; }, [modules]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const response = await fetch("/api/admin/lesson-builder/lessons");
        if (!response.ok) throw new Error("load failed");
        const file = await response.json() as LessonFile & { conceptDisplays?: ConceptDisplayLookup };
        if (!mounted) return;
        const normalized = normalizeLessons(file.lessons);
        dispatch({ type: "SET_LESSONS", lessons: normalized });
        setModules(file.modules);
        setConceptDisplays(file.conceptDisplays ?? {});
        const hashes = new Map(normalized.map((lesson) => [lesson.id, JSON.stringify(lesson)]));
        const modulesHash = JSON.stringify(file.modules);
        savedLessonJson.current = hashes;
        savedModulesJson.current = modulesHash;
        setSavedLessonHashes(hashes);
        setSavedModulesHash(modulesHash);
        setSaveState("idle");
      } catch {
        if (mounted) setSaveState("error");
      }
    })();
    return () => { mounted = false; };
  }, []);

  const dirtyLessons = useMemo(() => lessons.filter((lesson) => savedLessonHashes.get(lesson.id) !== JSON.stringify(lesson)), [lessons, savedLessonHashes]);
  const hasUnsavedNewLesson = lessons.some((lesson) => !savedLessonHashes.has(lesson.id));
  const modulesDirty = JSON.stringify(modules) !== savedModulesHash;
  const isDirty = dirtyLessons.length > 0 || modulesDirty;

  const saveLesson = useCallback(async (lesson: Lesson) => {
    if (savedLessonJson.current.get(lesson.id) === JSON.stringify(lesson)) return;
    const owner = modulesRef.current.find((module) => module.lessonIds.includes(lesson.id));
    const response = await fetch(`/api/admin/lesson-builder/lessons/${encodeURIComponent(lesson.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson, moduleId: owner?.id, insertionIndex: owner?.lessonIds.indexOf(lesson.id) ?? 0 }),
    });
    if (!response.ok) throw new Error("lesson save failed");
    const hash = JSON.stringify(lesson);
    savedLessonJson.current.set(lesson.id, hash);
    setSavedLessonHashes((current) => new Map(current).set(lesson.id, hash));
  }, []);

  const saveModules = useCallback(async (nextModules: LessonModule[]) => {
    if (JSON.stringify(nextModules) === savedModulesJson.current) return;
    const response = await fetch("/api/admin/lesson-builder/course", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modules: nextModules }),
    });
    if (!response.ok) throw new Error("course save failed");
    const hash = JSON.stringify(nextModules);
    savedModulesJson.current = hash;
    setSavedModulesHash(hash);
  }, []);

  const saveAll = useCallback(() => {
    const lessonSnapshot = lessonsRef.current;
    const moduleSnapshot = modulesRef.current;
    saveChain.current = saveChain.current.then(async () => {
      setSaveState("saving");
      try {
        for (const lesson of lessonSnapshot) await saveLesson(lesson);
        await saveModules(moduleSnapshot);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    });
    return saveChain.current;
  }, [saveLesson, saveModules]);

  useEffect(() => {
    if (saveState === "loading" || saveState === "error" || !dirtyLessons.length) return;
    window.clearTimeout(lessonSaveTimer.current);
    lessonSaveTimer.current = window.setTimeout(() => { void saveAll(); }, 1200);
    return () => window.clearTimeout(lessonSaveTimer.current);
  }, [dirtyLessons, saveAll, saveState]);

  useEffect(() => {
    if (saveState === "loading" || saveState === "error" || !modulesDirty || hasUnsavedNewLesson) return;
    window.clearTimeout(courseSaveTimer.current);
    courseSaveTimer.current = window.setTimeout(() => { void saveAll(); }, 500);
    return () => window.clearTimeout(courseSaveTimer.current);
  }, [hasUnsavedNewLesson, modulesDirty, saveAll, saveState]);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const cmd = event.ctrlKey || event.metaKey;
      const alt = event.altKey && !event.ctrlKey && !event.metaKey;
      if (cmd && !event.altKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveAll();
      } else if (alt && !event.shiftKey && event.code === "KeyK") {
        event.preventDefault();
        document.getElementById("lesson-library-search-input")?.focus();
      } else if (cmd && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "z" && !isTextEditingTarget(event.target)) {
        event.preventDefault();
        dispatch({ type: "UNDO" });
      } else if (cmd && !event.altKey && event.shiftKey && event.key.toLowerCase() === "z" && !isTextEditingTarget(event.target)) {
        event.preventDefault();
        dispatch({ type: "REDO" });
      } else if (alt && event.shiftKey && event.code === "KeyL") {
        event.preventDefault();
        const target = modulesRef.current.at(-1);
        if (!target) return;
        const lessonId = createId("lesson");
        dispatch({ type: "CREATE_LESSON", lessonId });
        updateModules(modulesRef.current.map((module) => module.id === target.id ? { ...module, lessonIds: [...module.lessonIds, lessonId] } : module));
        requestAnimationFrame(() => document.querySelector<HTMLInputElement>(`[data-lesson-title="${lessonId}"]`)?.focus());
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [saveAll]);

  function updateModules(next: LessonModule[]) {
    modulesRef.current = next;
    setModules(next);
  }

  function createLesson(moduleId: string) {
    const lessonId = createId("lesson");
    dispatch({ type: "CREATE_LESSON", lessonId });
    updateModules(modules.map((module) => module.id === moduleId ? { ...module, lessonIds: [...module.lessonIds, lessonId] } : module));
    return lessonId;
  }

  function duplicateLesson(lessonId: string) {
    const duplicateId = createId("lesson");
    dispatch({ type: "DUPLICATE_LESSON", lessonId, duplicateId });
    updateModules(modules.map((module) => {
      const index = module.lessonIds.indexOf(lessonId);
      return index < 0 ? module : { ...module, lessonIds: module.lessonIds.toSpliced(index + 1, 0, duplicateId) };
    }));
  }

  async function deleteLesson(lessonId: string) {
    setSaveState("saving");
    try {
      if (savedLessonJson.current.has(lessonId)) {
        const response = await fetch(`/api/admin/lesson-builder/lessons/${encodeURIComponent(lessonId)}`, { method: "DELETE" });
        if (!response.ok) throw new Error("delete failed");
      }
      dispatch({ type: "DELETE_LESSON", lessonId });
      savedLessonJson.current.delete(lessonId);
      setSavedLessonHashes((current) => { const nextHashes = new Map(current); nextHashes.delete(lessonId); return nextHashes; });
      const next = modules.map((module) => ({ ...module, lessonIds: module.lessonIds.filter((id) => id !== lessonId) }));
      updateModules(next);
      savedModulesJson.current = JSON.stringify(next);
      setSavedModulesHash(JSON.stringify(next));
      setSaveState("saved");
    } catch { setSaveState("error"); }
  }

  function addModule() {
    updateModules([...modules, { id: createId("module"), name: `Module ${modules.length + 1}`, keyConcepts: [], lessonIds: [] }]);
  }

  function deleteModule(moduleId: string) {
    if (modules.length === 1) return;
    const index = modules.findIndex((module) => module.id === moduleId);
    const removed = modules[index];
    const destination = modules[index > 0 ? index - 1 : 1];
    if (!removed || !destination) return;
    updateModules(modules.filter((module) => module.id !== moduleId).map((module) => module.id === destination.id ? { ...module, lessonIds: [...module.lessonIds, ...removed.lessonIds] } : module));
  }

  function moveModule(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= modules.length) return;
    const next = [...modules];
    [next[index], next[target]] = [next[target], next[index]];
    updateModules(next);
  }

  function moveLessonWithinModule(moduleId: string, index: number, direction: -1 | 1) {
    const target = index + direction;
    updateModules(modules.map((module) => {
      if (module.id !== moduleId || target < 0 || target >= module.lessonIds.length) return module;
      const lessonIds = [...module.lessonIds];
      [lessonIds[index], lessonIds[target]] = [lessonIds[target], lessonIds[index]];
      return { ...module, lessonIds };
    }));
  }

  function moveLessonToPosition(lessonId: string, moduleId: string, insertionIndex: number) {
    const source = modules.find((module) => module.lessonIds.includes(lessonId));
    const sourceIndex = source?.lessonIds.indexOf(lessonId) ?? -1;
    updateModules(modules.map((module) => {
      const without = module.lessonIds.filter((id) => id !== lessonId);
      if (module.id !== moduleId) return { ...module, lessonIds: without };
      const at = source?.id === moduleId && sourceIndex < insertionIndex ? insertionIndex - 1 : insertionIndex;
      return { ...module, lessonIds: without.toSpliced(Math.max(0, Math.min(at, without.length)), 0, lessonId) };
    }));
  }

  function moveLessonToModule(lessonId: string, moduleId: string) {
    const destination = modules.find((module) => module.id === moduleId);
    moveLessonToPosition(lessonId, moduleId, destination?.lessonIds.length ?? 0);
  }

  function patchModule(moduleId: string, patch: Partial<LessonModule>) {
    updateModules(modules.map((module) => module.id === moduleId ? { ...module, ...patch } : module));
  }

  function addBlock(lessonId: string, type: DocumentBlockType, insertionIndex: number) {
    const blockId = createId("block");
    if (type === "explanation") {
      dispatch({ type: "ADD_EXPLANATION_BLOCK", lessonId, insertionIndex, blockId });
      return blockId;
    }
    dispatch({
      type: "ADD_SENTENCE_BLOCK",
      lessonId,
      insertionIndex,
      blockId,
      languageBlockId: createId("lang"),
      ...(type === "vocabulary" ? { layout: "vocabulary_table" as const } : {}),
    });
    return blockId;
  }

  function addPiece(lessonId: string, blockId: string) {
    const languageBlockId = createId("lang");
    dispatch({ type: "ADD_LANGUAGE_BLOCK", lessonId, sentenceBlockId: blockId, languageBlockId });
    return languageBlockId;
  }

  function deleteBlock(lessonId: string, blockId: string) {
    const lesson = lessons.find((candidate) => candidate.id === lessonId);
    const index = lesson?.blocks.findIndex((block) => block.id === blockId) ?? -1;
    const block = lesson?.blocks[index];
    if (!block) return;
    deletionRef.current = { kind: "slide", lessonId, block, index };
    setDeletionUndo({ lessonId, label: "Slide deleted" });
    dispatch({ type: "DELETE_CONTENT_BLOCK", lessonId, blockId });
  }

  function deletePiece(lessonId: string, blockId: string, pieceId: string) {
    const block = lessons.find((lesson) => lesson.id === lessonId)?.blocks.find((candidate) => candidate.id === blockId);
    if (!block || block.type !== "sentence") return;
    const index = block.languageBlocks.findIndex((piece) => piece.id === pieceId);
    const piece = block.languageBlocks[index];
    if (!piece) return;
    deletionRef.current = { kind: "piece", lessonId, blockId, piece, index };
    setDeletionUndo({ lessonId, label: "Sentence piece deleted" });
    dispatch({ type: "DELETE_LANGUAGE_BLOCK", lessonId, sentenceBlockId: blockId, languageBlockId: pieceId });
  }

  function undoDeletion() {
    const deleted = deletionRef.current;
    if (!deleted) return;
    if (deleted.kind === "slide") dispatch({ type: "RESTORE_CONTENT_BLOCK", lessonId: deleted.lessonId, block: deleted.block, insertionIndex: deleted.index });
    else dispatch({ type: "RESTORE_LANGUAGE_BLOCK", lessonId: deleted.lessonId, sentenceBlockId: deleted.blockId, languageBlock: deleted.piece, insertionIndex: deleted.index });
    deletionRef.current = null;
    setDeletionUndo(null);
  }

  function moveBlock(lessonId: string, blockId: string, direction: -1 | 1) {
    const lesson = lessons.find((candidate) => candidate.id === lessonId);
    const index = lesson?.blocks.findIndex((block) => block.id === blockId) ?? -1;
    const target = lesson?.blocks[index + direction];
    if (!target) return;
    dispatch({ type: "MOVE_CONTENT_BLOCK", lessonId, draggedId: blockId, targetId: target.id, position: direction < 0 ? "before" : "after" });
  }

  function openPreview(lessonId: string) {
    const element = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const inputSelection = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
      ? [element.selectionStart ?? 0, element.selectionEnd ?? 0] as [number, number]
      : null;
    const selection = window.getSelection();
    const range = element?.isContentEditable && selection?.rangeCount
      ? selection.getRangeAt(0).cloneRange()
      : null;
    previewOrigin.current = { element, inputSelection, range, scrollY: window.scrollY };
    setPreviewLessonId(lessonId);
  }

  function closePreview() {
    setPreviewLessonId(null);
    requestAnimationFrame(() => {
      const origin = previewOrigin.current;
      previewOrigin.current = null;
      if (!origin) return;
      window.scrollTo({ top: origin.scrollY, behavior: "auto" });
      if (!origin.element || !document.contains(origin.element)) return;
      origin.element.focus({ preventScroll: true });
      if (origin.inputSelection && (origin.element instanceof HTMLInputElement || origin.element instanceof HTMLTextAreaElement)) {
        origin.element.setSelectionRange(...origin.inputSelection);
      } else if (origin.range) {
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(origin.range);
      }
    });
  }

  const previewLesson = lessons.find((lesson) => lesson.id === previewLessonId);
  const preview: PracticeLesson | null = previewLesson ? {
    id: previewLesson.id,
    lessonNumber: lessons.findIndex((lesson) => lesson.id === previewLesson.id) + 1,
    name: previewLesson.name,
    explanationCount: previewLesson.blocks.filter((block) => block.type === "explanation").length,
    practiceCount: previewLesson.blocks.filter((block) => block.type === "sentence").length,
    previewText: "",
    concepts: [],
    blocks: previewLesson.blocks,
  } : null;

  const saveLabel = saveState === "loading" ? "Loading…" : saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed" : isDirty ? "Unsaved changes" : "All changes saved";

  return <main className="lesson-builder-page flex-1 bg-background px-4 py-3 sm:px-6 sm:py-4">
    <div className="mx-auto w-full max-w-[1180px]">
      <LessonLibrary
        modules={modules} lessons={lessons} conceptDisplays={conceptDisplays} saveLabel={saveLabel} saveFailed={saveState === "error"}
        canUndo={history.past.length > 0} canRedo={history.future.length > 0}
        onUndo={() => dispatch({ type: "UNDO" })} onRedo={() => dispatch({ type: "REDO" })} onRetrySave={() => void saveAll()}
        onNewLesson={createLesson} onPreviewLesson={openPreview} onDuplicateLesson={duplicateLesson} onDeleteLesson={(id) => void deleteLesson(id)}
        onAddModule={addModule} onDeleteModule={deleteModule} onMoveModule={moveModule} onMoveLesson={moveLessonWithinModule} onDropLesson={moveLessonToPosition} onMoveLessonToModule={moveLessonToModule} onChangeModule={patchModule}
        onRenameLesson={(lessonId, name) => dispatch({ type: "RENAME_LESSON", lessonId, name })}
        onAddLessonConcept={(lessonId, concept: LessonConcept) => dispatch({ type: "ADD_LESSON_CONCEPT", lessonId, concept })}
        onRemoveLessonConcept={(lessonId, lessonConceptId) => dispatch({ type: "REMOVE_LESSON_CONCEPT", lessonId, lessonConceptId })}
        onRelabelLessonConcept={(lessonId, lessonConceptId, label) => dispatch({ type: "RELABEL_LESSON_CONCEPT", lessonId, lessonConceptId, label })}
        onUpdateExplanation={(lessonId, blockId, contentMarkdown) => dispatch({ type: "UPDATE_EXPLANATION_BLOCK", lessonId, blockId, contentMarkdown })}
        onUpdateSentence={(lessonId, sentenceBlockId, field, value) => dispatch({ type: "UPDATE_SENTENCE_BLOCK", lessonId, sentenceBlockId, patch: { [field]: value } })}
        onUpdateSpanish={(lessonId, sentenceBlockId, languageBlockId, spanish) => dispatch({ type: "UPDATE_LANGUAGE_BLOCK", lessonId, sentenceBlockId, languageBlockId, patch: { spanish } })}
        onUpdateAnswer={(lessonId, sentenceBlockId, languageBlockId, answerIndex, value) => dispatch({ type: "UPDATE_ACCEPTED_ANSWER", lessonId, sentenceBlockId, languageBlockId, answerIndex, value })}
        onUpdateCallout={(lessonId, sentenceBlockId, languageBlockId, callout) => dispatch({ type: "UPDATE_LANGUAGE_BLOCK", lessonId, sentenceBlockId, languageBlockId, patch: { callout } })}
        onAddAnswer={(lessonId, sentenceBlockId, languageBlockId) => dispatch({ type: "ADD_ACCEPTED_ANSWER", lessonId, sentenceBlockId, languageBlockId })}
        onRemoveAnswer={(lessonId, sentenceBlockId, languageBlockId, answerIndex) => dispatch({ type: "REMOVE_ACCEPTED_ANSWER", lessonId, sentenceBlockId, languageBlockId, answerIndex })}
        onAddPiece={addPiece} onDeletePiece={deletePiece} onAddBlock={addBlock} onDeleteBlock={deleteBlock}
        onDuplicateBlock={(lessonId, blockId) => dispatch({ type: "DUPLICATE_CONTENT_BLOCK", lessonId, blockId })}
        onMoveBlock={moveBlock}
        onReorderBlock={(lessonId, draggedId, targetId, position) => dispatch({ type: "MOVE_CONTENT_BLOCK", lessonId, draggedId, targetId, position })}
        deletionUndo={deletionUndo} onUndoDeletion={undoDeletion} onEndHistoryGroup={() => dispatch({ type: "END_HISTORY_GROUP" })}
      />
    </div>
    {preview && <LessonSelector lessons={[preview]} initialLessonId={preview.id} onCloseLesson={closePreview} />}
  </main>;
}
