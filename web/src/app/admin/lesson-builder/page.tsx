"use client";

import {
  CheckCircle2,
  CircleAlert,
  Command,
  FileText,
  Keyboard,
  Languages,
  Layers2,
  Plus,
  Table2,
  X,
} from "lucide-react";
import { BuilderNav } from "@/components/lesson-builder/builder-nav";
import { ModuleMeta } from "@/components/lesson-builder/module-meta";
import { ModuleRail } from "@/components/lesson-builder/module-rail";
import {
  Fragment,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

import {
  CommandPalette,
  type BuilderCommand,
} from "@/components/lesson-builder/command-palette";
import { HotkeyReminder } from "@/components/lesson-builder/hotkey-reminder";
import {
  LessonSelector,
  type PracticeLesson,
} from "@/components/practice/lesson-selector";
import { LanguageBlockGrid } from "@/components/lesson-builder/language-block-grid";
import { LessonCardHeader } from "@/components/lesson-builder/lesson-card-header";
import { LessonConceptsField } from "@/components/lesson-builder/lesson-concepts-field";
import { PendingLessonExitDialog } from "@/components/lesson-builder/pending-lesson-exit-dialog";
import { ExplanationBlockEditor } from "@/components/lesson-builder/explanation-block-editor";
import { LessonBlockPreviewList } from "@/components/lesson-builder/lesson-block-preview";
import { SentenceBlockHeader } from "@/components/lesson-builder/sentence-block-header";
import {
  SentenceMarkdownFields,
  type SentenceMarkdownFieldName,
} from "@/components/lesson-builder/sentence-markdown-fields";
import type {
  Lesson,
  LessonBlock,
  LessonFile,
  LessonModule,
} from "@/lib/lesson-builder/types";
import {
  createId,
  getSentenceValidationIssueCount,
  normalizeLessons,
} from "@/lib/lesson-builder/utils";
import { moduleCoveredConceptKeys } from "@/lib/lesson-builder/lesson-file";
import { lessonsReducer } from "@/lib/lesson-builder/reducer";
import { useDragReorder } from "@/lib/lesson-builder/use-drag-reorder";

function isPracticeBlock(
  block: LessonBlock,
): block is Extract<LessonBlock, { type: "sentence" }> {
  return block.type === "sentence";
}

function ContentBlockPicker({
  onAddExplanation,
  onAddTeachingPair,
  onAddSentence,
  onAddVocabulary,
  onClose,
}: {
  onAddExplanation: () => void;
  onAddTeachingPair: () => void;
  onAddSentence: () => void;
  onAddVocabulary: () => void;
  onClose: () => void;
}) {
  return (
    <div
      role="group"
      aria-label="Choose a block type"
      className="rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
          Choose a block type
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close block picker"
          title="Close (Esc)"
          className="flex size-7 items-center justify-center rounded-md text-stone-400 transition hover:bg-stone-200 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-200"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={onAddTeachingPair}
          className="group flex items-start gap-3 rounded-xl border border-amber-200 bg-white p-4 text-left transition hover:border-amber-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-100"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 transition group-hover:bg-amber-100">
            <Layers2 className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-semibold text-stone-900">
              Teaching pair
            </span>
            <span className="mt-1 block text-sm leading-5 text-stone-500">
              Add an explanation followed by practice.
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onAddExplanation}
          className="group flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-4 text-left transition hover:border-violet-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 transition group-hover:bg-violet-100">
            <FileText className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-semibold text-stone-900">
              Explanation
            </span>
            <span className="mt-1 block text-sm leading-5 text-stone-500">
              Introduce an idea with formatted text.
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onAddSentence}
          className="group flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 transition group-hover:bg-blue-100">
            <Languages className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-semibold text-stone-900">Sentence</span>
            <span className="mt-1 block text-sm leading-5 text-stone-500">
              Build a prompt with learner answer blocks.
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onAddVocabulary}
          className="group flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100">
            <Table2 className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-semibold text-stone-900">
              Vocabulary table
            </span>
            <span className="mt-1 block text-sm leading-5 text-stone-500">
              Practice a vertical list of word pairs.
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}


export default function LessonBuilderPage() {
  const [lessons, dispatch] = useReducer(lessonsReducer, []);
  // The module structure (synced from every lessons API response). The builder
  // shows one module at a time; `activeModuleId` picks it (from ?module=).
  const [courseModules, setCourseModules] = useState<LessonModule[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [courseSaveState, setCourseSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const savedCourseJsonRef = useRef("[]");
  const courseTimerRef = useRef<number | undefined>(undefined);
  // Session-local undo stack for module-structure edits (key concepts, name,
  // order, lesson membership). Snapshots are the whole `courseModules` array
  // taken just before each user edit; rapid edits inside one burst coalesce.
  const courseUndoRef = useRef<LessonModule[][]>([]);
  const courseCoalesceKeyRef = useRef<string | null>(null);
  const [courseCanUndo, setCourseCanUndo] = useState(false);
  const [savedLessonsSnapshot, setSavedLessonsSnapshot] = useState<Lesson[]>(
    [],
  );
  const lessonUndoRef = useRef<Lesson[][]>([]);
  const lessonRedoRef = useRef<Lesson[][]>([]);
  const [lessonCanUndo, setLessonCanUndo] = useState(false);
  const [lessonCanRedo, setLessonCanRedo] = useState(false);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const lessonDrag = useDragReorder({ axis: "y", mode: "root" });
  const contentDrag = useDragReorder({ axis: "y", mode: "nested" });
  const languageDrag = useDragReorder({ axis: "x", mode: "nested" });
  const [openBlockPicker, setOpenBlockPicker] = useState<{
    lessonId: string;
    insertionIndex: number;
  } | null>(null);
  const [collapsedLessons, setCollapsedLessons] = useState(
    () => new Set<string>(),
  );
  const [fullyCollapsedLessons, setFullyCollapsedLessons] = useState(
    () => new Set<string>(),
  );
  const [collapsedContentBlocks, setCollapsedContentBlocks] = useState(
    () => new Set<string>(),
  );
  const [collapsedLanguageBlocks, setCollapsedLanguageBlocks] = useState(
    () => new Set<string>(),
  );
  const [isHotkeyReminderOpen, setIsHotkeyReminderOpen] = useState(false);
  const [previewLessonId, setPreviewLessonId] = useState<string | null>(null);
  const [previewBlockId, setPreviewBlockId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeSentenceMarkdownField, setActiveSentenceMarkdownField] =
    useState<{
      lessonId: string;
      blockId: string;
      field: SentenceMarkdownFieldName;
    } | null>(null);
  const [savingLessonId, setSavingLessonId] = useState<string | null>(null);
  const [pendingLessonExitId, setPendingLessonExitId] = useState<string | null>(
    null,
  );
  const languageBlockSpanishRefs = useRef(
    new Map<string, HTMLInputElement>(),
  );
  const acceptedAnswerRefs = useRef(new Map<string, HTMLInputElement>());
  const languageBlockCalloutRefs = useRef(new Map<string, HTMLInputElement>());
  const lessonNameRefs = useRef(new Map<string, HTMLInputElement>());
  const lessonConceptRefs = useRef(new Map<string, HTMLInputElement>());
  const contentBlockRefs = useRef(new Map<string, HTMLDivElement>());
  const savedLessonsJsonRef = useRef(JSON.stringify([]));
  const pendingLessonExitActionRef = useRef<(() => void) | null>(null);
  const bypassLessonExitWarningRef = useRef(false);
  const autosaveTimerRef = useRef<number | undefined>(undefined);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [activeContentBlock, setActiveContentBlock] = useState<{
    lessonId: string;
    blockId: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLessons() {
      try {
        const response = await fetch("/api/admin/lesson-builder/lessons");
        if (!response.ok) {
          throw new Error("Unable to load lessons.");
        }

        const lessonFile = (await response.json()) as LessonFile;
        const lessons = normalizeLessons(lessonFile.lessons);
        const lessonsJson = JSON.stringify(lessons);

        if (isMounted) {
          const modules = lessonFile.modules ?? [];
          savedLessonsJsonRef.current = lessonsJson;
          dispatch({ type: "SET_LESSONS", lessons });
          setCourseModules(modules);
          courseUndoRef.current = [];
          courseCoalesceKeyRef.current = null;
          setCourseCanUndo(false);
          const params = new URLSearchParams(window.location.search);
          const wantedModule = params.get("module");
          const wantedLessonModule = params.get("lesson")
            ? modules.find((module) =>
                module.lessonIds.includes(params.get("lesson")!),
              )?.id
            : undefined;
          setActiveModuleId(
            (wantedModule &&
              modules.some((module) => module.id === wantedModule) &&
              wantedModule) ||
              wantedLessonModule ||
              modules[0]?.id ||
              null,
          );
          setSavedLessonsSnapshot(lessons);
          lessonUndoRef.current = [];
          lessonRedoRef.current = [];
          setLessonCanUndo(false);
          setLessonCanRedo(false);
          setCollapsedLessons(new Set(lessons.map((lesson) => lesson.id)));
          // Lessons start as compact rows; click one to open its editor.
          setFullyCollapsedLessons(new Set(lessons.map((lesson) => lesson.id)));
          setCollapsedContentBlocks(
            new Set(
              lessons.flatMap((lesson) =>
                lesson.blocks.map((block) => `${lesson.id}-${block.id}`),
              ),
            ),
          );
          setCollapsedLanguageBlocks(
            new Set(
              lessons.flatMap((lesson) =>
                lesson.blocks.flatMap((block) =>
                  isPracticeBlock(block)
                    ? block.languageBlocks.map(
                        (languageBlock) =>
                          `${lesson.id}-${block.id}-${languageBlock.id}`,
                      )
                    : [],
                ),
              ),
            ),
          );
          setActiveLessonId(lessons[0]?.id ?? null);
          setIsDirty(false);
          setSaveStatus("idle");
        }
      } catch {
        if (isMounted) {
          setSaveStatus("error");
        }
      } finally {
        if (isMounted) {
          setIsLoadingLessons(false);
        }
      }
    }

    void loadLessons();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoadingLessons) {
      const nextIsDirty = JSON.stringify(lessons) !== savedLessonsJsonRef.current;
      setIsDirty(nextIsDirty);
      if (nextIsDirty && saveStatus === "saved") {
        setSaveStatus("idle");
      }
    }
  }, [isLoadingLessons, lessons, saveStatus]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [isDirty]);

  const saveLesson = useCallback(async (lessonId: string) => {
    const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
    const lesson = lessons[lessonIndex];
    const savedLesson = savedLessonsSnapshot.find(
      (candidate) => candidate.id === lessonId,
    );
    // For a brand-new lesson, tell the server which module and where in it.
    const targetModule = courseModules.find((module) =>
      module.lessonIds.includes(lessonId),
    );
    const insertionIndex = targetModule
      ? targetModule.lessonIds.indexOf(lessonId)
      : lessonIndex;

    if (
      !lesson ||
      isLoadingLessons ||
      JSON.stringify(lesson) === JSON.stringify(savedLesson) ||
      saveStatus === "saving"
    ) {
      return false;
    }

    setSaveStatus("saving");
    setSavingLessonId(lessonId);

    try {
      const response = await fetch(
        `/api/admin/lesson-builder/lessons/${encodeURIComponent(lessonId)}`,
        {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lesson,
            moduleId: targetModule?.id ?? activeModuleId,
            insertionIndex,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Unable to save lesson.");
      }

      const lessonFile = (await response.json()) as LessonFile;
      const savedLessons = normalizeLessons(lessonFile.lessons);
      savedLessonsJsonRef.current = JSON.stringify(savedLessons);
      setSavedLessonsSnapshot(savedLessons);
      // Only a first save changes module structure (the new lesson's insertion);
      // syncing modules on every save would clobber an in-flight course edit.
      if (!savedLesson) {
        setCourseModules(lessonFile.modules ?? []);
      }
      setSaveStatus("saved");
      return true;
    } catch {
      setSaveStatus("error");
      return false;
    } finally {
      setSavingLessonId(null);
    }
  }, [
    activeModuleId,
    courseModules,
    isLoadingLessons,
    lessons,
    savedLessonsSnapshot,
    saveStatus,
  ]);

  const isLessonDirty = useCallback(
    (lessonId: string) => {
      const lesson = lessons.find((candidate) => candidate.id === lessonId);
      const savedLesson = savedLessonsSnapshot.find(
        (candidate) => candidate.id === lessonId,
      );

      return JSON.stringify(lesson) !== JSON.stringify(savedLesson);
    },
    [lessons, savedLessonsSnapshot],
  );

  // Debounced autosave for lesson bodies. Module structure autosaves on its own
  // path; this covers block/sentence/answer edits so a long authoring session
  // never depends on remembering Alt+S. A pristine brand-new lesson (no name, no
  // blocks) is left alone until the user gives it substance.
  useEffect(() => {
    if (isLoadingLessons || pendingLessonExitId || saveStatus === "saving") {
      return;
    }
    const dirtyIds = lessons
      .filter((lesson) => {
        if (!isLessonDirty(lesson.id)) return false;
        const isNew = !savedLessonsSnapshot.some((s) => s.id === lesson.id);
        return !(isNew && lesson.name === null && lesson.blocks.length === 0);
      })
      .map((lesson) => lesson.id);
    if (dirtyIds.length === 0) return;

    window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(async () => {
      for (const lessonId of dirtyIds) {
        await saveLesson(lessonId);
      }
    }, 1500);
    return () => window.clearTimeout(autosaveTimerRef.current);
  }, [
    lessons,
    isLoadingLessons,
    pendingLessonExitId,
    saveStatus,
    isLessonDirty,
    savedLessonsSnapshot,
    saveLesson,
  ]);

  const confirmDiscardLessonChanges = useCallback(
    (lessonId: string, continueAction: () => void) => {
      if (bypassLessonExitWarningRef.current) {
        bypassLessonExitWarningRef.current = false;
        return true;
      }

      if (!isLessonDirty(lessonId)) {
        return true;
      }

      pendingLessonExitActionRef.current = continueAction;
      setPendingLessonExitId(lessonId);
      return false;
    },
    [isLessonDirty],
  );

  const continuePendingLessonExit = useCallback(() => {
    const continueAction = pendingLessonExitActionRef.current;
    pendingLessonExitActionRef.current = null;
    setPendingLessonExitId(null);
    bypassLessonExitWarningRef.current = true;
    continueAction?.();
  }, []);

  const discardPendingLessonChanges = useCallback(() => {
    if (!pendingLessonExitId) {
      return;
    }

    const savedLesson = savedLessonsSnapshot.find(
      (candidate) => candidate.id === pendingLessonExitId,
    );

    dispatch({
      type: "SET_LESSONS",
      lessons: savedLesson
        ? lessons.map((lesson) =>
            lesson.id === pendingLessonExitId ? savedLesson : lesson,
          )
        : lessons.filter((lesson) => lesson.id !== pendingLessonExitId),
    });
    continuePendingLessonExit();
  }, [
    continuePendingLessonExit,
    lessons,
    pendingLessonExitId,
    savedLessonsSnapshot,
  ]);

  const savePendingLessonChanges = useCallback(async () => {
    if (!pendingLessonExitId) {
      return;
    }

    if (await saveLesson(pendingLessonExitId)) {
      continuePendingLessonExit();
    }
  }, [continuePendingLessonExit, pendingLessonExitId, saveLesson]);

  const cancelPendingLessonExit = useCallback(() => {
    pendingLessonExitActionRef.current = null;
    setPendingLessonExitId(null);
  }, []);

  function isInteractiveLessonTarget(target: EventTarget | null) {
    return (
      target instanceof HTMLElement &&
      Boolean(
        target.closest(
          "a, button, input, textarea, select, [role='button'], [draggable='true']",
        ),
      )
    );
  }

  function registerLessonNameRef(
    lessonId: string,
    element: HTMLInputElement | null,
  ) {
    if (element) {
      lessonNameRefs.current.set(lessonId, element);
    } else {
      lessonNameRefs.current.delete(lessonId);
    }
  }

  function registerLessonConceptRef(
    lessonId: string,
    element: HTMLInputElement | null,
  ) {
    if (element) {
      lessonConceptRefs.current.set(lessonId, element);
    } else {
      lessonConceptRefs.current.delete(lessonId);
    }
  }

  function registerContentBlockRef(
    lessonId: string,
    blockId: string,
    element: HTMLDivElement | null,
  ) {
    const key = `${lessonId}-${blockId}`;
    if (element) {
      contentBlockRefs.current.set(key, element);
    } else {
      contentBlockRefs.current.delete(key);
    }
  }

  const activeLesson =
    lessons.find((lesson) => !collapsedLessons.has(lesson.id)) ??
    lessons.find((lesson) => lesson.id === activeLessonId) ??
    null;

  const activeBlock =
    activeContentBlock && activeContentBlock.lessonId === activeLesson?.id
      ? activeLesson.blocks.find(
          (block) => block.id === activeContentBlock.blockId,
        ) ?? null
      : null;

  const focusLessonName = useCallback((lessonId: string) => {
    window.setTimeout(() => {
      lessonNameRefs.current.get(lessonId)?.focus();
    }, 0);
  }, []);

  const focusLessonConcepts = useCallback((lessonId: string) => {
    window.setTimeout(() => {
      lessonConceptRefs.current.get(lessonId)?.focus();
    }, 0);
  }, []);

  const focusContentBlock = useCallback((lessonId: string, blockId: string) => {
    window.setTimeout(() => {
      contentBlockRefs.current.get(`${lessonId}-${blockId}`)?.focus();
    }, 0);
  }, []);

  const insertionIndexForActiveBlock = useCallback((lesson: Lesson) => {
    const blockIndex = activeContentBlock
      ? lesson.blocks.findIndex((block) => block.id === activeContentBlock.blockId)
      : -1;
    return blockIndex >= 0 ? blockIndex + 1 : lesson.blocks.length;
  }, [activeContentBlock]);

  const recordLessonStructuralUndo = useCallback(() => {
    lessonUndoRef.current = [...lessonUndoRef.current.slice(-49), lessons];
    lessonRedoRef.current = [];
    setLessonCanUndo(true);
    setLessonCanRedo(false);
  }, [lessons]);

  const undoLessonStructure = useCallback(() => {
    const previous = lessonUndoRef.current.at(-1);
    if (!previous) return false;
    lessonRedoRef.current = [...lessonRedoRef.current.slice(-49), lessons];
    lessonUndoRef.current = lessonUndoRef.current.slice(0, -1);
    setLessonCanUndo(lessonUndoRef.current.length > 0);
    setLessonCanRedo(true);
    dispatch({ type: "SET_LESSONS", lessons: previous });
    setActiveContentBlock(null);
    return true;
  }, [lessons]);

  const redoLessonStructure = useCallback(() => {
    const next = lessonRedoRef.current.at(-1);
    if (!next) return false;
    lessonUndoRef.current = [...lessonUndoRef.current.slice(-49), lessons];
    lessonRedoRef.current = lessonRedoRef.current.slice(0, -1);
    setLessonCanUndo(true);
    setLessonCanRedo(lessonRedoRef.current.length > 0);
    dispatch({ type: "SET_LESSONS", lessons: next });
    setActiveContentBlock(null);
    return true;
  }, [lessons]);

  const openLessonEditorNow = useCallback(
    (lessonId: string) => {
      setActiveSentenceMarkdownField(null);
      setCollapsedContentBlocks(
        new Set(
          lessons.flatMap((lesson) =>
            lesson.blocks.map((block) => `${lesson.id}-${block.id}`),
          ),
        ),
      );
      setCollapsedLessons(
        new Set(
          lessons
            .map((lesson) => lesson.id)
            .filter((currentLessonId) => currentLessonId !== lessonId),
        ),
      );
      setFullyCollapsedLessons((currentLessonIds) => {
        const nextLessonIds = new Set(currentLessonIds);
        nextLessonIds.delete(lessonId);
        return nextLessonIds;
      });
    },
    [lessons],
  );

  // Deep link from /admin/curriculum's "Lesson N" pill: ?lesson=<id> opens that
  // lesson's editor once, after the lessons have loaded.
  const didHandleDeepLink = useRef(false);
  useEffect(() => {
    if (isLoadingLessons || didHandleDeepLink.current) {
      return;
    }
    didHandleDeepLink.current = true;

    const targetId = new URLSearchParams(window.location.search).get("lesson");
    if (!targetId || !lessons.some((lesson) => lesson.id === targetId)) {
      return;
    }

    window.setTimeout(() => {
      openLessonEditorNow(targetId);
      setActiveLessonId(targetId);
      document
        .getElementById(`lesson-${targetId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, [isLoadingLessons, lessons, openLessonEditorNow]);

  const cycleLessonDisplayModeNow = useCallback(
    (lessonId: string) => {
      const isFullyCollapsed = fullyCollapsedLessons.has(lessonId);

      setActiveSentenceMarkdownField(null);
      setCollapsedLessons((currentLessonIds) => {
        const nextLessonIds = new Set(currentLessonIds);
        nextLessonIds.add(lessonId);
        return nextLessonIds;
      });
      setFullyCollapsedLessons((currentLessonIds) => {
        const nextLessonIds = new Set(currentLessonIds);
        if (isFullyCollapsed) {
          nextLessonIds.delete(lessonId);
        } else {
          nextLessonIds.add(lessonId);
        }
        return nextLessonIds;
      });
    },
    [fullyCollapsedLessons],
  );

  const openLessonEditor = useCallback((lessonId: string) => {
    const openLesson = lessons.find(
      (lesson) => !collapsedLessons.has(lesson.id),
    );

    if (
      openLesson &&
      openLesson.id !== lessonId &&
      !confirmDiscardLessonChanges(openLesson.id, () =>
        openLessonEditorNow(lessonId),
      )
    ) {
      return;
    }

    openLessonEditorNow(lessonId);
  }, [
    collapsedLessons,
    confirmDiscardLessonChanges,
    lessons,
    openLessonEditorNow,
  ]);

  const cycleLessonDisplayMode = useCallback((lessonId: string) => {
    if (
      !collapsedLessons.has(lessonId) &&
      !confirmDiscardLessonChanges(lessonId, () =>
        cycleLessonDisplayModeNow(lessonId),
      )
    ) {
      return;
    }

    cycleLessonDisplayModeNow(lessonId);
  }, [
    collapsedLessons,
    confirmDiscardLessonChanges,
    cycleLessonDisplayModeNow,
  ]);

  const cycleActiveLessonCollapseMode = useCallback(() => {
    const lessonId =
      lessons.find((lesson) => lesson.id === activeLessonId)?.id ??
      lessons[0]?.id;

    if (lessonId) {
      if (
        !collapsedLessons.has(lessonId) &&
        !confirmDiscardLessonChanges(lessonId, () =>
          cycleLessonDisplayModeNow(lessonId),
        )
      ) {
        return;
      }

      cycleLessonDisplayModeNow(lessonId);
    }
  }, [
    activeLessonId,
    collapsedLessons,
    confirmDiscardLessonChanges,
    cycleLessonDisplayModeNow,
    lessons,
  ]);

  const cycleAllLessonDisplayModesNow = useCallback(() => {
    const lessonIds = lessons.map((lesson) => lesson.id);

    if (lessonIds.length === 0) {
      return;
    }

    const areAllPartiallyCollapsed = lessonIds.every(
      (lessonId) =>
        collapsedLessons.has(lessonId) &&
        !fullyCollapsedLessons.has(lessonId),
    );
    const areAllFullyCollapsed = lessonIds.every((lessonId) =>
      fullyCollapsedLessons.has(lessonId),
    );

    if (areAllPartiallyCollapsed) {
      setCollapsedLessons(new Set(lessonIds));
      setFullyCollapsedLessons(new Set(lessonIds));
      return;
    }

    if (areAllFullyCollapsed) {
      setCollapsedLessons(new Set(lessonIds));
      setFullyCollapsedLessons(new Set());
      return;
    }

    setCollapsedLessons(new Set(lessonIds));
    setFullyCollapsedLessons(new Set());
  }, [collapsedLessons, fullyCollapsedLessons, lessons]);

  const cycleAllLessonDisplayModes = useCallback(() => {
    const openLesson = lessons.find(
      (lesson) => !collapsedLessons.has(lesson.id),
    );

    if (
      openLesson &&
      !confirmDiscardLessonChanges(
        openLesson.id,
        cycleAllLessonDisplayModesNow,
      )
    ) {
      return;
    }

    cycleAllLessonDisplayModesNow();
  }, [
    collapsedLessons,
    confirmDiscardLessonChanges,
    cycleAllLessonDisplayModesNow,
    lessons,
  ]);

  const createLessonNow = useCallback(() => {
    const lessonId = createId("lesson");

    dispatch({ type: "CREATE_LESSON", lessonId });
    // New lessons go into the module currently open in the builder.
    setCourseModules((current) =>
      current.map((module, index) =>
        module.id === activeModuleId ||
        (!activeModuleId && index === current.length - 1)
          ? { ...module, lessonIds: [...module.lessonIds, lessonId] }
          : module,
      ),
    );
    setCollapsedLessons(new Set(lessons.map((lesson) => lesson.id)));
    setFullyCollapsedLessons((currentLessonIds) => {
      const nextLessonIds = new Set(currentLessonIds);
      nextLessonIds.delete(lessonId);
      return nextLessonIds;
    });
    setActiveLessonId(lessonId);
    focusLessonName(lessonId);
  }, [activeModuleId, focusLessonName, lessons]);

  const createLesson = useCallback(() => {
    const openLesson = lessons.find(
      (lesson) => !collapsedLessons.has(lesson.id),
    );

    if (
      openLesson &&
      !confirmDiscardLessonChanges(openLesson.id, createLessonNow)
    ) {
      return;
    }

    createLessonNow();
  }, [
    collapsedLessons,
    confirmDiscardLessonChanges,
    createLessonNow,
    lessons,
  ]);

  const duplicateLesson = useCallback((lessonId: string) => {
    const duplicateId = createId("lesson");
    dispatch({ type: "DUPLICATE_LESSON", lessonId, duplicateId });
    setCourseModules((current) =>
      current.map((module) => {
        const sourceIndex = module.lessonIds.indexOf(lessonId);
        if (sourceIndex === -1) return module;
        return {
          ...module,
          lessonIds: module.lessonIds.toSpliced(sourceIndex + 1, 0, duplicateId),
        };
      }),
    );
    setCollapsedLessons(
      new Set(lessons.map((lesson) => lesson.id)),
    );
    setFullyCollapsedLessons((current) => {
      const next = new Set(current);
      next.delete(duplicateId);
      return next;
    });
    setActiveLessonId(duplicateId);
  }, [lessons]);

  const addExplanationBlock = useCallback(
    (lessonId: string, insertionIndex: number) => {
      const blockId = createId("block");

      recordLessonStructuralUndo();
      dispatch({
        type: "ADD_EXPLANATION_BLOCK",
        lessonId,
        insertionIndex,
        blockId,
      });
      setCollapsedContentBlocks(
        new Set(
          lessons.flatMap((lesson) =>
            lesson.blocks.map((block) => `${lesson.id}-${block.id}`),
          ),
        ),
      );
      setOpenBlockPicker(null);
      setActiveContentBlock({ lessonId, blockId });
      focusContentBlock(lessonId, blockId);
    },
    [focusContentBlock, lessons, recordLessonStructuralUndo],
  );

  const addSentenceBlock = useCallback(
    (lessonId: string, insertionIndex: number) => {
      const blockId = createId("block");
      const languageBlockId = createId("lang");

      recordLessonStructuralUndo();
      dispatch({
        type: "ADD_SENTENCE_BLOCK",
        lessonId,
        insertionIndex,
        blockId,
        languageBlockId,
      });
      setCollapsedContentBlocks(
        new Set(
          lessons.flatMap((lesson) =>
            lesson.blocks.map((block) => `${lesson.id}-${block.id}`),
          ),
        ),
      );
      setOpenBlockPicker(null);
      setActiveContentBlock({ lessonId, blockId });

      window.setTimeout(() => {
        languageBlockSpanishRefs.current
          .get(`${lessonId}-${blockId}-${languageBlockId}`)
          ?.focus();
      }, 0);
    },
    [lessons, recordLessonStructuralUndo],
  );

  const addVocabularyBlock = useCallback(
    (lessonId: string, insertionIndex: number) => {
      const blockId = createId("block");
      const languageBlockId = createId("lang");

      recordLessonStructuralUndo();
      dispatch({
        type: "ADD_SENTENCE_BLOCK",
        lessonId,
        insertionIndex,
        blockId,
        languageBlockId,
        layout: "vocabulary_table",
      });
      setCollapsedContentBlocks(
        new Set(
          lessons.flatMap((lesson) =>
            lesson.blocks.map((block) => `${lesson.id}-${block.id}`),
          ),
        ),
      );
      setOpenBlockPicker(null);
      setActiveContentBlock({ lessonId, blockId });

      window.setTimeout(() => {
        languageBlockSpanishRefs.current
          .get(`${lessonId}-${blockId}-${languageBlockId}`)
          ?.focus();
      }, 0);
    },
    [lessons, recordLessonStructuralUndo],
  );

  const addTeachingPair = useCallback(
    (lessonId: string, insertionIndex: number) => {
      const explanationBlockId = createId("block");
      const sentenceBlockId = createId("block");
      const languageBlockId = createId("lang");

      recordLessonStructuralUndo();
      dispatch({
        type: "ADD_EXPLANATION_BLOCK",
        lessonId,
        insertionIndex,
        blockId: explanationBlockId,
      });
      dispatch({
        type: "ADD_SENTENCE_BLOCK",
        lessonId,
        insertionIndex: insertionIndex + 1,
        blockId: sentenceBlockId,
        languageBlockId,
      });
      setCollapsedContentBlocks(
        new Set(
          lessons.flatMap((lesson) =>
            lesson.blocks.map((block) => `${lesson.id}-${block.id}`),
          ),
        ),
      );
      setOpenBlockPicker(null);
      setActiveContentBlock({ lessonId, blockId: sentenceBlockId });

      window.setTimeout(() => {
        languageBlockSpanishRefs.current
          .get(`${lessonId}-${sentenceBlockId}-${languageBlockId}`)
          ?.focus();
      }, 0);
    },
    [lessons, recordLessonStructuralUndo],
  );

  useEffect(() => {
    function handleLessonBuilderShortcut(event: KeyboardEvent) {
      if (
        event.key === "Escape" &&
        !event.repeat &&
        !event.isComposing &&
        pendingLessonExitId
      ) {
        event.preventDefault();
        cancelPendingLessonExit();
        return;
      }

      if (pendingLessonExitId) {
        return;
      }

      if (previewLessonId) {
        return;
      }

      const target =
        event.target instanceof HTMLElement ? event.target : null;
      const isTextEntryTarget = Boolean(
        target?.closest("input, textarea, [contenteditable='true']"),
      );
      const usesMod = event.metaKey || event.ctrlKey;

      if (
        usesMod &&
        !event.altKey &&
        event.key.toLowerCase() === "k" &&
        !event.repeat &&
        !event.isComposing
      ) {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      if (isCommandPaletteOpen) {
        return;
      }

      if (
        event.key === "Escape" &&
        !event.repeat &&
        !event.isComposing &&
        openBlockPicker
      ) {
        event.preventDefault();
        setOpenBlockPicker(null);
        return;
      }

      if (
        usesMod &&
        !event.altKey &&
        event.key.toLowerCase() === "s" &&
        !event.repeat &&
        !event.isComposing
      ) {
        event.preventDefault();
        const targetLesson = commandTargetLesson();
        if (targetLesson && isLessonDirty(targetLesson.id)) {
          void saveLesson(targetLesson.id);
        }
        return;
      }

      if (
        usesMod &&
        !event.altKey &&
        event.key === "Enter" &&
        !event.repeat &&
        !event.isComposing
      ) {
        event.preventDefault();
        previewCommandTarget();
        return;
      }

      if (
        usesMod &&
        event.shiftKey &&
        !event.altKey &&
        event.key.toLowerCase() === "d" &&
        !event.repeat &&
        !event.isComposing &&
        !isTextEntryTarget
      ) {
        event.preventDefault();
        duplicateActiveContentBlock();
        return;
      }

      if (
        usesMod &&
        event.shiftKey &&
        !event.altKey &&
        (event.key === "ArrowUp" || event.key === "ArrowDown") &&
        !event.repeat &&
        !event.isComposing &&
        !isTextEntryTarget
      ) {
        event.preventDefault();
        moveActiveContentBlock(event.key === "ArrowUp" ? -1 : 1);
        return;
      }

      if (
        event.key === "Delete" &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.repeat &&
        !event.isComposing &&
        !isTextEntryTarget &&
        target?.dataset.contentBlockContainer === "true"
      ) {
        event.preventDefault();
        deleteActiveContentBlock();
        return;
      }

      if (
        event.key === "F2" &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.repeat &&
        !event.isComposing
      ) {
        const targetLesson = commandTargetLesson();
        if (targetLesson) {
          event.preventDefault();
          focusLessonName(targetLesson.id);
        }
        return;
      }

      if (
        event.key === "Escape" &&
        !event.repeat &&
        !event.isComposing &&
        event.target instanceof HTMLElement &&
        event.target.closest(".lesson-markdown-editor")
      ) {
        event.preventDefault();
        setCollapsedContentBlocks(
          new Set(
            lessons.flatMap((lesson) =>
              lesson.blocks.map((block) => `${lesson.id}-${block.id}`),
            ),
          ),
        );
        return;
      }

      if (
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        ["ArrowUp", "ArrowDown"].includes(event.key) &&
        !event.repeat &&
        !event.isComposing
      ) {
        event.preventDefault();

        const targetLesson =
          lessons.find((lesson) => !collapsedLessons.has(lesson.id)) ??
          lessons.find((lesson) => lesson.id === activeLessonId);

        if (!targetLesson || targetLesson.blocks.length === 0) {
          return;
        }

        const expandedBlockIndex = targetLesson.blocks.findIndex(
          (block) =>
            !collapsedContentBlocks.has(`${targetLesson.id}-${block.id}`),
        );
        const destinationBlockIndex =
          expandedBlockIndex === -1
            ? event.key === "ArrowDown"
              ? 0
              : targetLesson.blocks.length - 1
            : expandedBlockIndex + (event.key === "ArrowDown" ? 1 : -1);

        if (
          destinationBlockIndex < 0 ||
          destinationBlockIndex >= targetLesson.blocks.length
        ) {
          return;
        }

        const expandedBlock = targetLesson.blocks[expandedBlockIndex];
        if (
          expandedBlock &&
          isPracticeBlock(expandedBlock) &&
          getSentenceValidationIssueCount(expandedBlock) > 0
        ) {
          return;
        }

        const destinationBlock = targetLesson.blocks[destinationBlockIndex];
        const destinationKey = `${targetLesson.id}-${destinationBlock.id}`;

        setCollapsedContentBlocks(
          new Set(
            lessons.flatMap((lesson) =>
              lesson.blocks
                .map((block) => `${lesson.id}-${block.id}`)
                .filter((key) => key !== destinationKey),
            ),
          ),
        );
        setOpenBlockPicker(null);
        setActiveLessonId(targetLesson.id);
        return;
      }

      if (
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        ["e", "p"].includes(event.key.toLowerCase()) &&
        !event.repeat &&
        !event.isComposing
      ) {
        event.preventDefault();

        const targetLesson =
          lessons.find((lesson) => !collapsedLessons.has(lesson.id)) ??
          lessons.find((lesson) => lesson.id === activeLessonId) ??
          lessons[0];

        if (targetLesson) {
          openLessonEditor(targetLesson.id);

          if (event.key.toLowerCase() === "e") {
            addExplanationBlock(targetLesson.id, targetLesson.blocks.length);
          } else {
            addSentenceBlock(targetLesson.id, targetLesson.blocks.length);
          }
        }
        return;
      }

      if (
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.key.toLowerCase() === "n" &&
        !event.repeat &&
        !event.isComposing
      ) {
        event.preventDefault();
        createLesson();
        return;
      }

      if (
        event.altKey &&
        event.ctrlKey &&
        !event.metaKey &&
        event.key.toLowerCase() === "m" &&
        !event.repeat &&
        !event.isComposing
      ) {
        event.preventDefault();
        cycleAllLessonDisplayModes();
        return;
      }

      if (
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.key.toLowerCase() === "m" &&
        !event.repeat &&
        !event.isComposing
      ) {
        event.preventDefault();
        cycleActiveLessonCollapseMode();
        return;
      }

      if (
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.key.toLowerCase() === "s" &&
        !event.repeat &&
        !event.isComposing
      ) {
        event.preventDefault();
        const targetLesson =
          lessons.find((lesson) => !collapsedLessons.has(lesson.id)) ??
          lessons.find((lesson) => lesson.id === activeLessonId);

        if (targetLesson && isLessonDirty(targetLesson.id)) {
          void saveLesson(targetLesson.id);
        }
        return;
      }

      if (
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.key.toLowerCase() === "k" &&
        !event.repeat &&
        !event.isComposing
      ) {
        event.preventDefault();
        setIsHotkeyReminderOpen(true);
      }
    }

    document.addEventListener("keydown", handleLessonBuilderShortcut);

    return () => {
      document.removeEventListener("keydown", handleLessonBuilderShortcut);
    };
  });

  function renameLesson(lessonId: string, name: string) {
    dispatch({ type: "RENAME_LESSON", lessonId, name });
  }

  async function deleteLesson(lessonId: string) {
    const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
    const lesson = lessons[lessonIndex];
    const lessonLabel = `Lesson ${lessonIndex + 1}${
      lesson?.name ? ` · ${lesson.name}` : ""
    }`;

    if (
      !window.confirm(
        `Delete ${lessonLabel}? This will remove all of its content blocks.`,
      )
    ) {
      return;
    }

    setSaveStatus("saving");

    try {
      const response = await fetch(
        `/api/admin/lesson-builder/lessons/${encodeURIComponent(lessonId)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error("Unable to delete lesson.");
      }

      const lessonFile = (await response.json()) as LessonFile;
      const savedLessons = normalizeLessons(lessonFile.lessons);
      savedLessonsJsonRef.current = JSON.stringify(savedLessons);
      setSavedLessonsSnapshot(savedLessons);
      setCourseModules(lessonFile.modules ?? []);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
      return;
    }

    dispatch({ type: "DELETE_LESSON", lessonId });
    setOpenBlockPicker((currentPicker) =>
      currentPicker?.lessonId === lessonId ? null : currentPicker,
    );
    setCollapsedLessons((currentLessonIds) => {
      const nextLessonIds = new Set(currentLessonIds);
      nextLessonIds.delete(lessonId);
      return nextLessonIds;
    });
    setFullyCollapsedLessons((currentLessonIds) => {
      const nextLessonIds = new Set(currentLessonIds);
      nextLessonIds.delete(lessonId);
      return nextLessonIds;
    });
    setActiveLessonId((currentLessonId) =>
      currentLessonId === lessonId ? null : currentLessonId,
    );
  }

  function toggleContentBlock(lessonId: string, blockId: string) {
    const key = `${lessonId}-${blockId}`;
    setActiveSentenceMarkdownField(null);
    setCollapsedContentBlocks((currentKeys) => {
      const expandedInvalidSentence = lessons
        .flatMap((lesson) =>
          lesson.blocks.map((block) => ({ lessonId: lesson.id, block })),
        )
        .find(
          ({ lessonId: currentLessonId, block }) =>
            isPracticeBlock(block) &&
            !currentKeys.has(`${currentLessonId}-${block.id}`) &&
            getSentenceValidationIssueCount(block) > 0,
        );

      if (expandedInvalidSentence) {
        return currentKeys;
      }

      if (currentKeys.has(key)) {
        const nextKeys = new Set(
          lessons.flatMap((lesson) =>
            lesson.blocks.map((block) => `${lesson.id}-${block.id}`),
          ),
        );
        nextKeys.delete(key);
        return nextKeys;
      }

      const nextKeys = new Set(currentKeys);
      nextKeys.add(key);
      return nextKeys;
    });
  }

  const deleteContentBlock = useCallback((lessonId: string, blockId: string) => {
    const lesson = lessons.find((candidate) => candidate.id === lessonId);
    const blockIndex =
      lesson?.blocks.findIndex((block) => block.id === blockId) ?? -1;
    const nextFocusBlock =
      blockIndex >= 0
        ? lesson?.blocks[blockIndex + 1] ?? lesson?.blocks[blockIndex - 1]
        : null;
    recordLessonStructuralUndo();
    dispatch({ type: "DELETE_CONTENT_BLOCK", lessonId, blockId });
    setActiveContentBlock(
      nextFocusBlock ? { lessonId, blockId: nextFocusBlock.id } : null,
    );
    if (nextFocusBlock) {
      focusContentBlock(lessonId, nextFocusBlock.id);
    }
  }, [focusContentBlock, lessons, recordLessonStructuralUndo]);

  const duplicateContentBlock = useCallback((lessonId: string, blockId: string) => {
    recordLessonStructuralUndo();
    dispatch({ type: "DUPLICATE_CONTENT_BLOCK", lessonId, blockId });
    setCollapsedContentBlocks(
      new Set(
        lessons.flatMap((lesson) =>
          lesson.blocks.map((block) => `${lesson.id}-${block.id}`),
        ),
      ),
    );
  }, [lessons, recordLessonStructuralUndo]);

  function updateSentencePromptText(
    lessonId: string,
    sentenceBlockId: string,
    promptText: string,
  ) {
    dispatch({
      type: "UPDATE_SENTENCE_BLOCK",
      lessonId,
      sentenceBlockId,
      patch: { promptText },
    });
  }

  function updateSentencePromptLabel(
    lessonId: string,
    sentenceBlockId: string,
    promptLabel: string,
  ) {
    dispatch({
      type: "UPDATE_SENTENCE_BLOCK",
      lessonId,
      sentenceBlockId,
      patch: { promptLabel },
    });
  }

  function updateSentenceHelperText(
    lessonId: string,
    sentenceBlockId: string,
    helperText: string,
  ) {
    dispatch({
      type: "UPDATE_SENTENCE_BLOCK",
      lessonId,
      sentenceBlockId,
      patch: { helperText },
    });
  }

  function updateSentenceAnswerFeedback(
    lessonId: string,
    sentenceBlockId: string,
    answerFeedback: string | null,
  ) {
    dispatch({
      type: "UPDATE_SENTENCE_BLOCK",
      lessonId,
      sentenceBlockId,
      patch: { answerFeedback },
    });
  }

  function updateLanguageBlockCallout(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
    callout: string | null,
  ) {
    dispatch({
      type: "UPDATE_LANGUAGE_BLOCK",
      lessonId,
      sentenceBlockId,
      languageBlockId,
      patch: { callout },
    });
  }

  function addLanguageBlockCallout(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
  ) {
    updateLanguageBlockCallout(
      lessonId,
      sentenceBlockId,
      languageBlockId,
      "",
    );
    window.setTimeout(() => {
      languageBlockCalloutRefs.current
        .get(`${lessonId}-${sentenceBlockId}-${languageBlockId}`)
        ?.focus();
    }, 0);
  }

  function updateExplanationBlock(
    lessonId: string,
    blockId: string,
    contentMarkdown: string,
  ) {
    dispatch({
      type: "UPDATE_EXPLANATION_BLOCK",
      lessonId,
      blockId,
      contentMarkdown,
    });
  }

  function updateSpanishPrompt(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
    value: string,
  ) {
    dispatch({
      type: "UPDATE_LANGUAGE_BLOCK",
      lessonId,
      sentenceBlockId,
      languageBlockId,
      patch: { spanish: value },
    });
  }

  function updateAcceptedAnswer(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
    answerIndex: number,
    value: string,
  ) {
    dispatch({
      type: "UPDATE_ACCEPTED_ANSWER",
      lessonId,
      sentenceBlockId,
      languageBlockId,
      answerIndex,
      value,
    });
  }

  function addAcceptedAnswer(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
    answerIndex: number,
  ) {
    dispatch({
      type: "ADD_ACCEPTED_ANSWER",
      lessonId,
      sentenceBlockId,
      languageBlockId,
    });

    window.setTimeout(() => {
      acceptedAnswerRefs.current
        .get(
          `${lessonId}-${sentenceBlockId}-${languageBlockId}-${answerIndex}`,
        )
        ?.focus();
    }, 0);
  }

  function removeAcceptedAnswer(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
    answerIndex: number,
  ) {
    dispatch({
      type: "REMOVE_ACCEPTED_ANSWER",
      lessonId,
      sentenceBlockId,
      languageBlockId,
      answerIndex,
    });
  }

  function addLanguageBlock(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
  ) {
    recordLessonStructuralUndo();
    dispatch({
      type: "ADD_LANGUAGE_BLOCK",
      lessonId,
      sentenceBlockId,
      languageBlockId,
    });
    setCollapsedLanguageBlocks(
      new Set(
        lessons.flatMap((lesson) =>
          lesson.blocks.flatMap((block) =>
                  isPracticeBlock(block)
              ? block.languageBlocks.map(
                  (languageBlock) =>
                    `${lesson.id}-${block.id}-${languageBlock.id}`,
                )
              : [],
          ),
        ),
      ),
    );

    window.setTimeout(() => {
      languageBlockSpanishRefs.current
        .get(`${lessonId}-${sentenceBlockId}-${languageBlockId}`)
        ?.focus();
    }, 0);
  }

  function openLanguageBlockAndFocusAnswer(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
    answerIndex: number,
  ) {
    const key = `${lessonId}-${sentenceBlockId}-${languageBlockId}`;
    setCollapsedLanguageBlocks(
      new Set(
        lessons
          .flatMap((lesson) =>
            lesson.blocks.flatMap((block) =>
                  isPracticeBlock(block)
                ? block.languageBlocks.map(
                    (languageBlock) =>
                      `${lesson.id}-${block.id}-${languageBlock.id}`,
                  )
                : [],
            ),
          )
          .filter((languageBlockKey) => languageBlockKey !== key),
      ),
    );

    window.setTimeout(() => {
      acceptedAnswerRefs.current
        .get(
          `${lessonId}-${sentenceBlockId}-${languageBlockId}-${answerIndex}`,
        )
        ?.focus();
    }, 0);
  }

  function openLanguageBlockAndFocusSpanish(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
  ) {
    const key = `${lessonId}-${sentenceBlockId}-${languageBlockId}`;
    setCollapsedLanguageBlocks(
      new Set(
        lessons
          .flatMap((lesson) =>
            lesson.blocks.flatMap((block) =>
                  isPracticeBlock(block)
                ? block.languageBlocks.map(
                    (languageBlock) =>
                      `${lesson.id}-${block.id}-${languageBlock.id}`,
                  )
                : [],
            ),
          )
          .filter((languageBlockKey) => languageBlockKey !== key),
      ),
    );

    window.setTimeout(() => {
      languageBlockSpanishRefs.current
        .get(`${lessonId}-${sentenceBlockId}-${languageBlockId}`)
        ?.focus();
    }, 0);
  }

  function deleteLanguageBlock(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
  ) {
    recordLessonStructuralUndo();
    dispatch({
      type: "DELETE_LANGUAGE_BLOCK",
      lessonId,
      sentenceBlockId,
      languageBlockId,
    });
  }

  // The three drag reorders share useDragReorder for start / over / reset; only
  // the "commit the move" step differs (a reducer dispatch), and moveLesson also
  // persists the new order.
  function moveDraggedLanguageBlock() {
    const dragged = languageDrag.dragged;
    const target = languageDrag.dropTarget;
    if (!dragged || !target || dragged.scope !== target.scope) {
      return;
    }
    const [lessonId, sentenceBlockId] = dragged.scope.split("::");
    recordLessonStructuralUndo();
    dispatch({
      type: "MOVE_LANGUAGE_BLOCK",
      lessonId,
      sentenceBlockId,
      draggedId: dragged.id,
      targetId: target.id,
      position: target.position,
    });
  }

  function moveDraggedContentBlock() {
    const dragged = contentDrag.dragged;
    const target = contentDrag.dropTarget;
    if (!dragged || !target || dragged.scope !== target.scope) {
      return;
    }
    recordLessonStructuralUndo();
    dispatch({
      type: "MOVE_CONTENT_BLOCK",
      lessonId: dragged.scope,
      draggedId: dragged.id,
      targetId: target.id,
      position: target.position,
    });
  }

  // A brand-new lesson lives only in local state until its first save; it is in
  // `lessons` but not yet in `savedLessonsSnapshot`.
  const hasUnsavedNewLesson = lessons.some(
    (lesson) =>
      !savedLessonsSnapshot.some((saved) => saved.id === lesson.id),
  );

  // All module-structure changes (module order/name/promise, lesson order,
  // lesson-to-module membership) go through PUT /course. Per-lesson content
  // still goes through PUT /lessons/[id]. Optimistic + debounced; the reducer's
  // `lessons` order is kept in sync by id (no content touched).
  const commitCourseModules = useCallback(
    (
      next: LessonModule[],
      options?: { recordUndo?: boolean; coalesceKey?: string },
    ) => {
      if (options?.recordUndo !== false) {
        // Discrete edits each get their own undo entry; only edits sharing a
        // coalesceKey with the previous one (module-name typing) fold together.
        const key = options?.coalesceKey ?? null;
        if (key === null || key !== courseCoalesceKeyRef.current) {
          courseUndoRef.current = [
            ...courseUndoRef.current.slice(-49),
            courseModules,
          ];
          setCourseCanUndo(true);
        }
        courseCoalesceKeyRef.current = key;
      }
      setCourseModules(next);
      dispatch({
        type: "SET_LESSON_ORDER",
        lessonIds: next.flatMap((module) => module.lessonIds),
      });
      setCourseSaveState("saving");
      const json = JSON.stringify(next);
      window.clearTimeout(courseTimerRef.current);
      courseTimerRef.current = window.setTimeout(async () => {
        try {
          const response = await fetch("/api/admin/lesson-builder/course", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ modules: next }),
          });
          if (response.ok) {
            savedCourseJsonRef.current = json;
            setCourseSaveState("saved");
          } else {
            setCourseSaveState("error");
          }
        } catch {
          setCourseSaveState("error");
        }
      }, 600);
    },
    [courseModules],
  );

  function patchActiveModule(patch: Partial<LessonModule>) {
    const isNameEdit =
      Object.keys(patch).length === 1 && Object.hasOwn(patch, "name");
    commitCourseModules(
      courseModules.map((module) =>
        module.id === currentModule?.id ? { ...module, ...patch } : module,
      ),
      isNameEdit ? { coalesceKey: `name:${currentModule?.id}` } : undefined,
    );
  }

  const undoCourseModules = useCallback(() => {
    const stack = courseUndoRef.current;
    if (stack.length === 0) return;
    // Rewinding the module structure past an unsaved new lesson would drop it —
    // the lesson list has no undo. Save or discard it first.
    if (hasUnsavedNewLesson) return;
    const previous = stack[stack.length - 1];
    courseUndoRef.current = stack.slice(0, -1);
    setCourseCanUndo(courseUndoRef.current.length > 0);
    courseCoalesceKeyRef.current = null; // next edit always starts a new entry
    if (previous.every((module) => module.id !== activeModuleId)) {
      setActiveModuleId(previous[0]?.id ?? null);
    }
    commitCourseModules(previous, { recordUndo: false });
  }, [activeModuleId, commitCourseModules, hasUnsavedNewLesson]);

  useEffect(() => {
    function handleUndoShortcut(event: KeyboardEvent) {
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        (event.key.toLowerCase() !== "z" &&
          event.key.toLowerCase() !== "y") ||
        event.isComposing
      ) {
        return;
      }
      // Leave native text undo alone when a field is focused.
      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      if (event.shiftKey || event.key.toLowerCase() === "y") {
        redoLessonStructure();
        return;
      }
      if (!undoLessonStructure()) {
        undoCourseModules();
      }
    }
    document.addEventListener("keydown", handleUndoShortcut);
    return () => document.removeEventListener("keydown", handleUndoShortcut);
  });

  function reorderModule(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= courseModules.length) return;
    const next = [...courseModules];
    [next[index], next[target]] = [next[target], next[index]];
    commitCourseModules(next);
  }

  function addModuleNow() {
    const created: LessonModule = {
      id: createId("module"),
      name: `Module ${courseModules.length + 1}`,
      keyConcepts: [],
      lessonIds: [],
    };
    commitCourseModules([...courseModules, created]);
    setActiveModuleId(created.id);
    window.history.replaceState(null, "", `/admin/lesson-builder?module=${created.id}`);
  }

  function deleteModuleNow(moduleId: string) {
    if (courseModules.length <= 1) {
      window.alert("At least one module is required.");
      return;
    }

    const deleteIndex = courseModules.findIndex(
      (module) => module.id === moduleId,
    );
    const deletedModule = courseModules[deleteIndex];
    if (!deletedModule) return;

    const destinationIndex = deleteIndex > 0 ? deleteIndex - 1 : 1;
    const destination = courseModules[destinationIndex];
    const moduleLabel = deletedModule.name || "Untitled module";
    const destinationLabel = destination.name || "Untitled module";
    const lessonMessage =
      deletedModule.lessonIds.length > 0
        ? ` Its ${deletedModule.lessonIds.length} lesson${
            deletedModule.lessonIds.length === 1 ? "" : "s"
          } will move to ${destinationLabel}.`
        : "";

    if (!window.confirm(`Delete ${moduleLabel}?${lessonMessage}`)) {
      return;
    }

    const next = courseModules
      .map((candidate) => {
        if (candidate.id === moduleId) return null;
        if (candidate.id !== destination.id) return candidate;
        const lessonIds =
          destinationIndex < deleteIndex
            ? [...candidate.lessonIds, ...deletedModule.lessonIds]
            : [...deletedModule.lessonIds, ...candidate.lessonIds];
        return { ...candidate, lessonIds };
      })
      .filter((candidate): candidate is LessonModule => Boolean(candidate));

    commitCourseModules(next);
    if (moduleId === activeModuleId) {
      setActiveModuleId(destination.id);
      window.history.replaceState(
        null,
        "",
        `/admin/lesson-builder?module=${destination.id}`,
      );
    }
  }

  function moveLessonToModule(lessonId: string, toModuleId: string) {
    commitCourseModules(
      courseModules.map((module) => {
        if (module.id === toModuleId) {
          return { ...module, lessonIds: [...module.lessonIds, lessonId] };
        }
        if (module.lessonIds.includes(lessonId)) {
          return {
            ...module,
            lessonIds: module.lessonIds.filter((id) => id !== lessonId),
          };
        }
        return module;
      }),
    );
    // The lesson <section> may unmount on this move, so its onDragEnd (which
    // normally clears the drag) can be lost — clear it here too.
    lessonDrag.reset();
  }

  function selectModule(moduleId: string) {
    setActiveModuleId(moduleId);
    window.history.replaceState(null, "", `/admin/lesson-builder?module=${moduleId}`);
  }

  function moveDraggedLesson() {
    const dragged = lessonDrag.dragged;
    const target = lessonDrag.dropTarget;
    if (!dragged || !target || dragged.id === target.id || !currentModule) {
      return;
    }
    const without = currentModule.lessonIds.filter((id) => id !== dragged.id);
    const targetIndex = without.indexOf(target.id);
    if (targetIndex === -1) return;
    without.splice(
      target.position === "after" ? targetIndex + 1 : targetIndex,
      0,
      dragged.id,
    );
    commitCourseModules(
      courseModules.map((module) =>
        module.id === currentModule.id
          ? { ...module, lessonIds: without }
          : module,
      ),
    );
  }

  const previewLessonIndex = lessons.findIndex(
    (lesson) => lesson.id === previewLessonId,
  );
  const previewLesson =
    previewLessonIndex >= 0 ? lessons[previewLessonIndex] : null;
  const previewBlocks = previewLesson
    ? previewBlockId
      ? previewLesson.blocks.filter((block) => block.id === previewBlockId)
      : previewLesson.blocks
    : [];
  const practicePreviewLesson: PracticeLesson | null = previewLesson
    ? {
        id: previewLesson.id,
        lessonNumber: previewLessonIndex + 1,
        name: previewLesson.name,
        explanationCount: previewBlocks.filter(
          (block) => block.type === "explanation",
        ).length,
        practiceCount: previewBlocks.filter(isPracticeBlock).length,
        previewText: "",
        blocks: previewBlocks,
      }
    : null;
  const pendingLessonExitIndex = lessons.findIndex(
    (lesson) => lesson.id === pendingLessonExitId,
  );
  const pendingLessonExit =
    pendingLessonExitIndex >= 0 ? lessons[pendingLessonExitIndex] : null;

  // The builder is scoped to one module. `moduleLessons` is that module's
  // lessons in order; everything below renders and numbers from it.
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const currentModule =
    courseModules.find((module) => module.id === activeModuleId) ??
    courseModules[0] ??
    null;
  const moduleLessons = (currentModule?.lessonIds ?? [])
    .map((id) => lessonById.get(id))
    .filter((lesson): lesson is Lesson => Boolean(lesson));
  const moduleCoveredKeys = currentModule
    ? moduleCoveredConceptKeys(currentModule, lessonById)
    : new Set<string>();

  function commandTargetLesson() {
    return activeLesson ?? moduleLessons[0] ?? null;
  }

  function openLessonFromCommand(lessonId: string) {
    openLessonEditor(lessonId);
    setActiveLessonId(lessonId);
    document
      .getElementById(`lesson-${lessonId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    focusLessonName(lessonId);
  }

  function addCommandBlock(
    type: "explanation" | "sentence" | "pair" | "vocabulary",
  ) {
    const lesson = commandTargetLesson();
    if (!lesson) return;
    openLessonEditor(lesson.id);
    const insertionIndex = insertionIndexForActiveBlock(lesson);
    if (type === "explanation") {
      addExplanationBlock(lesson.id, insertionIndex);
    } else if (type === "sentence") {
      addSentenceBlock(lesson.id, insertionIndex);
    } else if (type === "vocabulary") {
      addVocabularyBlock(lesson.id, insertionIndex);
    } else {
      addTeachingPair(lesson.id, insertionIndex);
    }
  }

  function previewCommandTarget() {
    const lesson = commandTargetLesson();
    if (!lesson) return;
    const issueCount = lesson.blocks.reduce(
      (count, block) =>
        count +
        (isPracticeBlock(block) ? getSentenceValidationIssueCount(block) : 0),
      0,
    );
    if (issueCount > 0) return;
    setPreviewLessonId(lesson.id);
    setPreviewBlockId(null);
  }

  function saveCommandTarget() {
    const lesson = commandTargetLesson();
    if (lesson && isLessonDirty(lesson.id)) {
      void saveLesson(lesson.id);
    }
  }

  function duplicateActiveContentBlock() {
    if (!activeLesson || !activeBlock) return;
    duplicateContentBlock(activeLesson.id, activeBlock.id);
    focusContentBlock(activeLesson.id, activeBlock.id);
  }

  function moveActiveContentBlock(direction: -1 | 1) {
    if (!activeLesson || !activeBlock) return;
    const currentIndex = activeLesson.blocks.findIndex(
      (block) => block.id === activeBlock.id,
    );
    const targetBlock = activeLesson.blocks[currentIndex + direction];
    if (!targetBlock) return;
    recordLessonStructuralUndo();
    dispatch({
      type: "MOVE_CONTENT_BLOCK",
      lessonId: activeLesson.id,
      draggedId: activeBlock.id,
      targetId: targetBlock.id,
      position: direction < 0 ? "before" : "after",
    });
    focusContentBlock(activeLesson.id, activeBlock.id);
  }

  function deleteActiveContentBlock() {
    if (!activeLesson || !activeBlock) return;
    if (!window.confirm("Delete this content block?")) return;
    deleteContentBlock(activeLesson.id, activeBlock.id);
  }

  function revealContentBlock(lessonId: string, blockId: string) {
    openLessonEditor(lessonId);
    setCollapsedContentBlocks(
      new Set(
        lessons.flatMap((lesson) =>
          lesson.blocks
            .map((block) => `${lesson.id}-${block.id}`)
            .filter((key) => key !== `${lessonId}-${blockId}`),
        ),
      ),
    );
    setActiveContentBlock({ lessonId, blockId });
    focusContentBlock(lessonId, blockId);
  }

  const commandTarget = commandTargetLesson();
  const activeLessonIndex = activeLesson
    ? moduleLessons.findIndex((lesson) => lesson.id === activeLesson.id)
    : -1;
  const activeLessonNumber = activeLessonIndex >= 0 ? activeLessonIndex + 1 : null;
  const activeLessonExplanationCount =
    activeLesson?.blocks.filter((block) => block.type === "explanation").length ??
    0;
  const activeLessonPracticeCount =
    activeLesson?.blocks.filter(isPracticeBlock).length ?? 0;
  const activeLessonIsDirty = activeLesson
    ? isLessonDirty(activeLesson.id)
    : false;
  const activeLessonIssues =
    activeLesson?.blocks
      .map((block, index) => ({
        block,
        index,
        issueCount: isPracticeBlock(block)
          ? getSentenceValidationIssueCount(block)
          : 0,
      }))
      .filter((entry) => entry.issueCount > 0) ?? [];
  const commandTargetIssues =
    commandTarget?.blocks.reduce(
      (count, block) =>
        count +
        (isPracticeBlock(block) ? getSentenceValidationIssueCount(block) : 0),
      0,
    ) ?? 0;
  const commandTargetDirty = commandTarget
    ? isLessonDirty(commandTarget.id)
    : false;

  const builderCommands: BuilderCommand[] = (() => {
    const targetLabel = commandTarget
      ? commandTarget.name || "Untitled lesson"
      : "No lesson selected";
    const blockLabel = activeBlock
      ? activeBlock.type === "explanation"
        ? "active explanation"
        : activeBlock.layout === "vocabulary_table"
          ? "active vocabulary table"
          : "active sentence"
      : "no focused block";

    return [
      {
        id: "lesson-new",
        label: "Create new lesson",
        detail: currentModule
          ? `In ${currentModule.name || "Untitled module"}`
          : undefined,
        shortcut: "Alt+N",
        icon: "lesson",
        keywords: ["new", "create", "author"],
        run: createLesson,
      },
      {
        id: "lesson-rename",
        label: "Rename active lesson",
        detail: targetLabel,
        shortcut: "F2",
        icon: "lesson",
        disabledReason: commandTarget ? undefined : "Select a lesson first",
        run: () => commandTarget && focusLessonName(commandTarget.id),
      },
      {
        id: "add-pair",
        label: "Add teaching pair",
        detail: commandTarget
          ? `After the focused block in ${targetLabel}`
          : undefined,
        icon: "pair",
        disabledReason: commandTarget ? undefined : "Select a lesson first",
        run: () => addCommandBlock("pair"),
      },
      {
        id: "add-explanation",
        label: "Add explanation block",
        detail: commandTarget ? `After the focused block in ${targetLabel}` : undefined,
        shortcut: "Alt+E",
        icon: "explanation",
        disabledReason: commandTarget ? undefined : "Select a lesson first",
        run: () => addCommandBlock("explanation"),
      },
      {
        id: "add-sentence",
        label: "Add practice block",
        detail: commandTarget ? `After the focused block in ${targetLabel}` : undefined,
        shortcut: "Alt+P",
        icon: "sentence",
        disabledReason: commandTarget ? undefined : "Select a lesson first",
        run: () => addCommandBlock("sentence"),
      },
      {
        id: "add-vocabulary",
        label: "Add vocabulary table",
        detail: commandTarget ? `After the focused block in ${targetLabel}` : undefined,
        icon: "vocabulary",
        disabledReason: commandTarget ? undefined : "Select a lesson first",
        run: () => addCommandBlock("vocabulary"),
      },
      {
        id: "lesson-concepts",
        label: "Focus concepts",
        detail: targetLabel,
        icon: "search",
        disabledReason: commandTarget ? undefined : "Select a lesson first",
        run: () => commandTarget && focusLessonConcepts(commandTarget.id),
      },
      {
        id: "lesson-preview",
        label: "Preview active lesson",
        detail: targetLabel,
        shortcut: "Mod+Enter",
        icon: "open",
        disabledReason: !commandTarget
          ? "Select a lesson first"
          : commandTargetIssues > 0
            ? `Resolve ${commandTargetIssues} validation issue${commandTargetIssues === 1 ? "" : "s"} first`
            : undefined,
        run: previewCommandTarget,
      },
      {
        id: "lesson-save",
        label: "Save active lesson",
        detail: targetLabel,
        shortcut: "Mod+S",
        icon: "save",
        disabledReason: !commandTarget
          ? "Select a lesson first"
          : commandTargetDirty
            ? undefined
            : "No unsaved changes",
        run: saveCommandTarget,
      },
      {
        id: "block-duplicate",
        label: "Duplicate focused block",
        detail: blockLabel,
        shortcut: "Mod+Shift+D",
        icon: "open",
        disabledReason: activeBlock ? undefined : "Focus a block first",
        run: duplicateActiveContentBlock,
      },
      {
        id: "block-move-up",
        label: "Move focused block up",
        detail: blockLabel,
        shortcut: "Mod+Shift+↑",
        icon: "open",
        disabledReason: activeBlock ? undefined : "Focus a block first",
        run: () => moveActiveContentBlock(-1),
      },
      {
        id: "block-move-down",
        label: "Move focused block down",
        detail: blockLabel,
        shortcut: "Mod+Shift+↓",
        icon: "open",
        disabledReason: activeBlock ? undefined : "Focus a block first",
        run: () => moveActiveContentBlock(1),
      },
      {
        id: "block-delete",
        label: "Delete focused block",
        detail: blockLabel,
        shortcut: "Delete",
        icon: "delete",
        disabledReason: activeBlock ? undefined : "Focus a block first",
        run: deleteActiveContentBlock,
      },
      {
        id: "undo-structure",
        label: "Undo structural edit",
        detail: "Blocks, language blocks, or module structure",
        shortcut: "Mod+Z",
        icon: "open",
        disabledReason:
          lessonCanUndo || (courseCanUndo && !hasUnsavedNewLesson)
            ? undefined
            : "No structural edit to undo",
        run: () => {
          if (!undoLessonStructure()) {
            undoCourseModules();
          }
        },
      },
      {
        id: "redo-structure",
        label: "Redo structural edit",
        detail: "Session history for block edits",
        shortcut: "Mod+Shift+Z",
        icon: "open",
        disabledReason: lessonCanRedo
          ? undefined
          : "No structural edit to redo",
        run: () => {
          redoLessonStructure();
        },
      },
      {
        id: "keyboard-help",
        label: "Show keyboard shortcuts",
        shortcut: "Alt+K",
        icon: "keyboard",
        run: () => setIsHotkeyReminderOpen(true),
      },
      ...moduleLessons.map((lesson, index) => ({
        id: `open-${lesson.id}`,
        label: `Open Lesson ${index + 1}`,
        detail: lesson.name || "Untitled lesson",
        icon: "open" as const,
        keywords: [lesson.name ?? "", "lesson", String(index + 1)],
        run: () => openLessonFromCommand(lesson.id),
      })),
    ];
  })();

  const courseSaveLabel =
    courseSaveState === "saving"
      ? "Saving…"
      : courseSaveState === "saved"
        ? "Saved"
        : courseSaveState === "error"
          ? "Save failed"
          : "";

  return (
    <main className="flex-1 bg-background px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
        <BuilderNav active="builder" />

        <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_19rem]">
          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <ModuleRail
              modules={courseModules}
              activeId={currentModule?.id ?? null}
              saveLabel={courseSaveLabel}
              canUndo={courseCanUndo && !hasUnsavedNewLesson}
              onUndo={undoCourseModules}
              draggedLessonId={lessonDrag.dragged?.id ?? null}
              onSelect={selectModule}
              onReorder={reorderModule}
              onAdd={addModuleNow}
              onDelete={deleteModuleNow}
              onMoveLesson={moveLessonToModule}
            />
            <section className="mt-4 rounded-xl border border-border bg-card p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Lessons
                </h2>
                <span className="text-xs text-muted-foreground">
                  {moduleLessons.length}
                </span>
              </div>
              {moduleLessons.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No lessons in this module.
                </p>
              ) : (
                <nav aria-label="Lessons in active module" className="space-y-1">
                  {moduleLessons.map((lesson, index) => {
                    const lessonIssueCount = lesson.blocks.reduce(
                      (count, block) =>
                        count +
                        (isPracticeBlock(block)
                          ? getSentenceValidationIssueCount(block)
                          : 0),
                      0,
                    );
                    const selected = lesson.id === activeLesson?.id;
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => openLessonFromCommand(lesson.id)}
                        aria-current={selected ? "true" : undefined}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 ${
                          selected
                            ? "bg-stone-900 text-white shadow-sm"
                            : "hover:bg-muted"
                        }`}
                      >
                        <span
                          className={`flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                            selected
                              ? "bg-white/15 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {lesson.name || "Untitled lesson"}
                          </span>
                          <span
                            className={`text-xs ${
                              selected
                                ? "text-white/65"
                                : "text-muted-foreground"
                            }`}
                          >
                            {lesson.blocks.length} blocks
                          </span>
                        </span>
                        {lessonIssueCount > 0 && (
                          <span
                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                              selected
                                ? "bg-red-400 text-white"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {lessonIssueCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              )}
            </section>
          </aside>

          <div className="flex min-w-0 flex-col gap-5">
            {currentModule && (
              <ModuleMeta
                module={currentModule}
                coveredConceptKeys={moduleCoveredKeys}
                onChange={patchActiveModule}
              />
            )}

            <p className="text-xs text-muted-foreground">
              {isLoadingLessons
                ? "Loading saved lessons…"
                : saveStatus === "error"
                  ? "Couldn't save — will retry"
                  : saveStatus === "saving"
                    ? "Saving…"
                    : saveStatus === "saved"
                      ? "All lesson changes saved"
                      : isDirty
                        ? "Unsaved changes"
                      : "Click a lesson to edit it."}
            </p>

        {moduleLessons.map((lesson, lessonIndex) => {
          const lessonNumber = lessonIndex + 1;
          const isDragging = lessonDrag.dragged?.id === lesson.id;
          const isLessonCollapsed = collapsedLessons.has(lesson.id);
          const isLessonFullyCollapsed = fullyCollapsedLessons.has(lesson.id);
          const isLessonEditableOnClick =
            isLessonCollapsed || isLessonFullyCollapsed;
          const lessonIsDirty = isLessonDirty(lesson.id);
          const isThisLessonSaving = savingLessonId === lesson.id;
          const lessonValidationIssueCount = lesson.blocks.reduce(
            (issueCount, block) =>
              issueCount +
              (isPracticeBlock(block)
                ? getSentenceValidationIssueCount(block)
                : 0),
            0,
          );
          const dropPosition =
            lessonDrag.dropTarget?.id === lesson.id
              ? lessonDrag.dropTarget.position
              : null;

          return (
            <section
              key={lesson.id}
              id={`lesson-${lesson.id}`}
              aria-label={`Lesson ${lessonNumber}`}
              onMouseEnter={() => setActiveLessonId(lesson.id)}
              onFocusCapture={() => setActiveLessonId(lesson.id)}
              onClick={(event) => {
                if (
                  isLessonEditableOnClick &&
                  !isInteractiveLessonTarget(event.target)
                ) {
                  openLessonEditor(lesson.id);
                }
              }}
              onDragOver={(event) => lessonDrag.dragOver(event, "", lesson.id)}
              onDrop={(event) => {
                event.preventDefault();
                if (lessonDrag.dropTarget) {
                  moveDraggedLesson();
                }
                lessonDrag.reset();
              }}
              className={`relative w-full overflow-hidden rounded-2xl border bg-[var(--surface)] shadow-md transition ${
                isLessonEditableOnClick
                  ? "cursor-pointer hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg hover:ring-4 hover:ring-violet-100/60"
                  : "min-h-72"
              } ${
                isDragging
                  ? "border-violet-300 opacity-45 shadow-none"
                  : "border-border shadow-stone-200/70"
              }`}
            >
              {dropPosition && (
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 z-10 h-1 rounded-full bg-violet-500 ${
                    dropPosition === "before" ? "top-0" : "bottom-0"
                  }`}
                />
              )}

              <LessonCardHeader
                lessonNumber={lessonNumber}
                name={lesson.name ?? ""}
                isDirty={lessonIsDirty}
                isCollapsed={isLessonCollapsed}
                isFullyCollapsed={isLessonFullyCollapsed}
                isSaving={isThisLessonSaving}
                validationIssueCount={lessonValidationIssueCount}
                stepCount={lesson.blocks.length}
                saveDisabled={
                  isLoadingLessons ||
                  !lessonIsDirty ||
                  saveStatus === "saving"
                }
                dragDisabled={hasUnsavedNewLesson}
                dragDisabledReason="Save new lessons before reordering"
                onHeaderClick={(event) => {
                  if (
                    !isLessonCollapsed &&
                    !isInteractiveLessonTarget(event.target)
                  ) {
                    cycleLessonDisplayMode(lesson.id);
                  }
                }}
                nameInputRef={(element) =>
                  registerLessonNameRef(lesson.id, element)
                }
                onNameChange={(value) => renameLesson(lesson.id, value)}
                onPreview={() => {
                  setPreviewLessonId(lesson.id);
                  setPreviewBlockId(null);
                }}
                onDuplicate={() => duplicateLesson(lesson.id)}
                onSave={() => void saveLesson(lesson.id)}
                onCycleDisplayMode={() => cycleLessonDisplayMode(lesson.id)}
                onDelete={() => deleteLesson(lesson.id)}
                onDragStart={(event) => lessonDrag.dragStart(event, "", lesson.id)}
                onDragEnd={lessonDrag.reset}
              />

              {!isLessonFullyCollapsed && (
                <LessonConceptsField
                  concepts={lesson.concepts}
                  onAdd={(concept) =>
                    dispatch({
                      type: "ADD_LESSON_CONCEPT",
                      lessonId: lesson.id,
                      concept,
                    })
                  }
                  onRemove={(lessonConceptId) =>
                    dispatch({
                      type: "REMOVE_LESSON_CONCEPT",
                      lessonId: lesson.id,
                      lessonConceptId,
                    })
                  }
                  onRelabel={(lessonConceptId, label) =>
                    dispatch({
                      type: "RELABEL_LESSON_CONCEPT",
                      lessonId: lesson.id,
                      lessonConceptId,
                      label,
                    })
                  }
                  inputRef={(element) =>
                    registerLessonConceptRef(lesson.id, element)
                  }
                />
              )}

              {isLessonCollapsed && !isLessonFullyCollapsed && (
                <LessonBlockPreviewList blocks={lesson.blocks} />
              )}

              {!isLessonCollapsed && (
              <div className="space-y-4 p-6">
                {lesson.blocks.length > 0 && (
                  <>
                    <div className="relative h-0">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenBlockPicker((currentPicker) =>
                            currentPicker?.lessonId === lesson.id &&
                            currentPicker.insertionIndex === 0
                              ? null
                              : {
                                  lessonId: lesson.id,
                                  insertionIndex: 0,
                                },
                          )
                        }
                        aria-label="Insert content before the first block"
                        aria-expanded={
                          openBlockPicker?.lessonId === lesson.id &&
                          openBlockPicker.insertionIndex === 0
                        }
                        className="absolute left-1/2 top-0 z-10 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground opacity-45 shadow-sm transition hover:scale-110 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-200"
                      >
                        <Plus className="size-3" aria-hidden="true" />
                      </button>
                    </div>
                    {openBlockPicker?.lessonId === lesson.id &&
                      openBlockPicker.insertionIndex === 0 && (
                        <ContentBlockPicker
                          onClose={() => setOpenBlockPicker(null)}
                          onAddTeachingPair={() =>
                            addTeachingPair(lesson.id, 0)
                          }
                          onAddExplanation={() =>
                            addExplanationBlock(lesson.id, 0)
                          }
                          onAddSentence={() => addSentenceBlock(lesson.id, 0)}
                          onAddVocabulary={() =>
                            addVocabularyBlock(lesson.id, 0)
                          }
                        />
                      )}
                  </>
                )}
                {lesson.blocks.map((block, blockIndex) => {
                  const contentBlockKey = `${lesson.id}-${block.id}`;
                  const isContentBlockCollapsed =
                    collapsedContentBlocks.has(contentBlockKey);
                  const sentenceValidationIssueCount =
                  isPracticeBlock(block)
                      ? getSentenceValidationIssueCount(block)
                      : 0;
                  const contentDropPosition =
                    contentDrag.dropTarget?.scope === lesson.id &&
                    contentDrag.dropTarget.id === block.id
                      ? contentDrag.dropTarget.position
                      : null;
                  const isDraggingContentBlock =
                    contentDrag.dragged?.scope === lesson.id &&
                    contentDrag.dragged.id === block.id;

                  return (
                    <Fragment key={block.id}>
                    <div
                      ref={(element) =>
                        registerContentBlockRef(lesson.id, block.id, element)
                      }
                      tabIndex={0}
                      data-content-block-container="true"
                      aria-label={`${block.type === "explanation" ? "Explanation" : block.layout === "vocabulary_table" ? "Vocabulary table" : "Sentence"} block ${blockIndex + 1}`}
                      onFocus={() =>
                        setActiveContentBlock({
                          lessonId: lesson.id,
                          blockId: block.id,
                        })
                      }
                      onDragOver={(event) =>
                        contentDrag.dragOver(event, lesson.id, block.id)
                      }
                      onDrop={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        moveDraggedContentBlock();
                        contentDrag.reset();
                      }}
                      className={`relative overflow-hidden rounded-xl border border-border bg-[var(--surface-raised)] transition ${
                        block.type === "explanation" &&
                        isContentBlockCollapsed
                          ? "shadow-none"
                          : "shadow-sm"
                      } ${
                        activeContentBlock?.lessonId === lesson.id &&
                        activeContentBlock.blockId === block.id
                          ? "ring-3 ring-violet-200"
                          : "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-200"
                      } ${isDraggingContentBlock ? "opacity-45" : ""}`}
                    >
                    {contentDropPosition && (
                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-2 z-20 h-1 rounded-full bg-violet-500 ${
                          contentDropPosition === "before"
                            ? "top-0"
                            : "bottom-0"
                        }`}
                      />
                    )}
                    {block.type === "explanation" ? (
                      <ExplanationBlockEditor
                        block={block}
                        isCollapsed={isContentBlockCollapsed}
                        onToggleCollapse={() =>
                          toggleContentBlock(lesson.id, block.id)
                        }
                        onDragStart={(event) =>
                          contentDrag.dragStart(event, lesson.id, block.id)
                        }
                        onDragEnd={contentDrag.reset}
                        onPreview={() => {
                          setPreviewLessonId(lesson.id);
                          setPreviewBlockId(block.id);
                        }}
                        onDuplicate={() =>
                          duplicateContentBlock(lesson.id, block.id)
                        }
                        onDelete={() =>
                          deleteContentBlock(lesson.id, block.id)
                        }
                        onChange={(markdown) =>
                          updateExplanationBlock(lesson.id, block.id, markdown)
                        }
                      />
                    ) : (
                      <>
                        <SentenceBlockHeader
                          block={block}
                          isCollapsed={isContentBlockCollapsed}
                          issueCount={sentenceValidationIssueCount}
                          onToggleCollapse={() =>
                            toggleContentBlock(lesson.id, block.id)
                          }
                          onDragStart={(event) =>
                            contentDrag.dragStart(event, lesson.id, block.id)
                          }
                          onDragEnd={contentDrag.reset}
                          onPreview={() => {
                            setPreviewLessonId(lesson.id);
                            setPreviewBlockId(block.id);
                          }}
                          onDuplicate={() =>
                            duplicateContentBlock(lesson.id, block.id)
                          }
                          onDelete={() =>
                            deleteContentBlock(lesson.id, block.id)
                          }
                        />
                        {!isContentBlockCollapsed && (
                        <div className="flex flex-col p-6">
                            <SentenceMarkdownFields
                              block={block}
                              activeField={
                                activeSentenceMarkdownField?.lessonId ===
                                  lesson.id &&
                                activeSentenceMarkdownField.blockId === block.id
                                  ? activeSentenceMarkdownField.field
                                  : null
                              }
                              onActivate={(field) =>
                                setActiveSentenceMarkdownField({
                                  lessonId: lesson.id,
                                  blockId: block.id,
                                  field,
                                })
                              }
                              onDeactivate={() =>
                                setActiveSentenceMarkdownField(null)
                              }
                              onChange={(field, markdown) => {
                                if (field === "promptLabel") {
                                  updateSentencePromptLabel(
                                    lesson.id,
                                    block.id,
                                    markdown,
                                  );
                                } else if (field === "promptText") {
                                  updateSentencePromptText(
                                    lesson.id,
                                    block.id,
                                    markdown,
                                  );
                                } else if (field === "helperText") {
                                  updateSentenceHelperText(
                                    lesson.id,
                                    block.id,
                                    markdown,
                                  );
                                } else {
                                  updateSentenceAnswerFeedback(
                                    lesson.id,
                                    block.id,
                                    markdown || null,
                                  );
                                }
                              }}
                            />
                          <LanguageBlockGrid
                            lessonId={lesson.id}
                            block={block}
                            drag={languageDrag}
                            collapsedKeys={collapsedLanguageBlocks}
                            spanishRefs={languageBlockSpanishRefs}
                            answerRefs={acceptedAnswerRefs}
                            calloutRefs={languageBlockCalloutRefs}
                            onCollapseKey={(key) =>
                              setCollapsedLanguageBlocks((currentKeys) =>
                                new Set(currentKeys).add(key),
                              )
                            }
                            onExpandFocusSpanish={(languageBlockId) =>
                              openLanguageBlockAndFocusSpanish(
                                lesson.id,
                                block.id,
                                languageBlockId,
                              )
                            }
                            onExpandFocusAnswer={(languageBlockId, answerIndex) =>
                              openLanguageBlockAndFocusAnswer(
                                lesson.id,
                                block.id,
                                languageBlockId,
                                answerIndex,
                              )
                            }
                            onMoveDragged={moveDraggedLanguageBlock}
                            onDeleteLanguageBlock={(languageBlockId) =>
                              deleteLanguageBlock(
                                lesson.id,
                                block.id,
                                languageBlockId,
                              )
                            }
                            onAddLanguageBlock={(languageBlockId) =>
                              addLanguageBlock(
                                lesson.id,
                                block.id,
                                languageBlockId,
                              )
                            }
                            onSpanishChange={(languageBlockId, value) =>
                              updateSpanishPrompt(
                                lesson.id,
                                block.id,
                                languageBlockId,
                                value,
                              )
                            }
                            onAnswerChange={(
                              languageBlockId,
                              answerIndex,
                              value,
                            ) =>
                              updateAcceptedAnswer(
                                lesson.id,
                                block.id,
                                languageBlockId,
                                answerIndex,
                                value,
                              )
                            }
                            onAnswerAppend={(languageBlockId) => {
                              const target = block.languageBlocks.find(
                                (candidate) => candidate.id === languageBlockId,
                              );
                              addAcceptedAnswer(
                                lesson.id,
                                block.id,
                                languageBlockId,
                                target?.acceptedAnswers.length ?? 0,
                              );
                            }}
                            onAnswerRemove={(languageBlockId, answerIndex) =>
                              removeAcceptedAnswer(
                                lesson.id,
                                block.id,
                                languageBlockId,
                                answerIndex,
                              )
                            }
                            onCalloutAdd={(languageBlockId) =>
                              addLanguageBlockCallout(
                                lesson.id,
                                block.id,
                                languageBlockId,
                              )
                            }
                            onCalloutChange={(languageBlockId, value) =>
                              updateLanguageBlockCallout(
                                lesson.id,
                                block.id,
                                languageBlockId,
                                value,
                              )
                            }
                            onCalloutRemove={(languageBlockId) =>
                              updateLanguageBlockCallout(
                                lesson.id,
                                block.id,
                                languageBlockId,
                                null,
                              )
                            }
                          />
                        </div>
                        )}
                      </>
                    )}
                    </div>
                    {blockIndex < lesson.blocks.length - 1 && (
                      <>
                        <div className="relative !mt-0 h-0">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenBlockPicker((currentPicker) =>
                                currentPicker?.lessonId === lesson.id &&
                                currentPicker.insertionIndex === blockIndex + 1
                                  ? null
                                  : {
                                      lessonId: lesson.id,
                                      insertionIndex: blockIndex + 1,
                                    },
                              )
                            }
                            aria-label={`Insert content after block ${blockIndex + 1}`}
                            aria-expanded={
                              openBlockPicker?.lessonId === lesson.id &&
                              openBlockPicker.insertionIndex === blockIndex + 1
                            }
                            className="absolute left-1/2 top-2 z-10 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground opacity-45 shadow-sm transition hover:scale-110 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-200"
                          >
                            <Plus className="size-3" aria-hidden="true" />
                          </button>
                        </div>
                        {openBlockPicker?.lessonId === lesson.id &&
                          openBlockPicker.insertionIndex === blockIndex + 1 && (
                            <ContentBlockPicker
                              onClose={() => setOpenBlockPicker(null)}
                              onAddTeachingPair={() =>
                                addTeachingPair(
                                  lesson.id,
                                  blockIndex + 1,
                                )
                              }
                              onAddExplanation={() =>
                                addExplanationBlock(
                                  lesson.id,
                                  blockIndex + 1,
                                )
                              }
                              onAddSentence={() =>
                                addSentenceBlock(lesson.id, blockIndex + 1)
                              }
                              onAddVocabulary={() =>
                                addVocabularyBlock(lesson.id, blockIndex + 1)
                              }
                            />
                          )}
                      </>
                    )}
                    </Fragment>
                  );
                })}

                <button
                  type="button"
                  onClick={() =>
                    setOpenBlockPicker((currentPicker) =>
                      currentPicker?.lessonId === lesson.id &&
                      currentPicker.insertionIndex === lesson.blocks.length
                        ? null
                        : {
                            lessonId: lesson.id,
                            insertionIndex: lesson.blocks.length,
                          },
                    )
                  }
                  aria-expanded={
                    openBlockPicker?.lessonId === lesson.id &&
                    openBlockPicker.insertionIndex === lesson.blocks.length
                  }
                  className="group flex min-h-20 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 px-4 font-medium text-stone-500 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add content block
                </button>

                {openBlockPicker?.lessonId === lesson.id &&
                  openBlockPicker.insertionIndex === lesson.blocks.length && (
                  <ContentBlockPicker
                    onClose={() => setOpenBlockPicker(null)}
                    onAddTeachingPair={() =>
                      addTeachingPair(lesson.id, lesson.blocks.length)
                    }
                    onAddExplanation={() =>
                      addExplanationBlock(lesson.id, lesson.blocks.length)
                    }
                    onAddSentence={() =>
                      addSentenceBlock(lesson.id, lesson.blocks.length)
                    }
                    onAddVocabulary={() =>
                      addVocabularyBlock(lesson.id, lesson.blocks.length)
                    }
                  />
                )}
              </div>
              )}
            </section>
          );
        })}

        <button
          type="button"
          onClick={createLesson}
          title="Create new lesson (Alt+N)"
          className="group flex min-h-40 w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 bg-white px-6 text-lg font-semibold text-stone-700 shadow-sm transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-stone-100 transition group-hover:bg-violet-100">
            <Plus className="size-5" aria-hidden="true" />
          </span>
          Create new lesson
          <kbd className="rounded-md border border-stone-200 bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-500">
            Alt+N
          </kbd>
        </button>
          </div>

          <aside className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:self-start">
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Lesson focus
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    {activeLesson
                      ? `${activeLessonNumber ? `Lesson ${activeLessonNumber}` : "Lesson"}`
                      : "No lesson"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  aria-label="Open command palette"
                  title="Command palette"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <Command className="size-4" aria-hidden="true" />
                </button>
              </div>

              {activeLesson ? (
                <>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {activeLesson.name || "Untitled lesson"}
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted px-2 py-2">
                      <p className="text-lg font-semibold tabular-nums">
                        {activeLesson.blocks.length}
                      </p>
                      <p className="text-[11px] font-medium text-muted-foreground">
                        blocks
                      </p>
                    </div>
                    <div className="rounded-lg bg-violet-50 px-2 py-2 text-violet-900">
                      <p className="text-lg font-semibold tabular-nums">
                        {activeLessonExplanationCount}
                      </p>
                      <p className="text-[11px] font-medium text-violet-600">
                        explain
                      </p>
                    </div>
                    <div className="rounded-lg bg-blue-50 px-2 py-2 text-blue-900">
                      <p className="text-lg font-semibold tabular-nums">
                        {activeLessonPracticeCount}
                      </p>
                      <p className="text-[11px] font-medium text-blue-600">
                        practice
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
                    <span className="font-medium text-muted-foreground">
                      Lesson state
                    </span>
                    <span
                      className={`font-semibold ${
                        saveStatus === "error"
                          ? "text-red-700"
                          : saveStatus === "saving"
                            ? "text-amber-700"
                            : activeLessonIsDirty
                              ? "text-amber-700"
                              : "text-emerald-700"
                      }`}
                    >
                      {saveStatus === "error"
                        ? "Save failed"
                        : saveStatus === "saving"
                          ? "Saving"
                          : activeLessonIsDirty
                            ? "Unsaved changes"
                            : "Saved"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <button
                      type="button"
                      onClick={() => addCommandBlock("pair")}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                    >
                      <Layers2 className="size-4" aria-hidden="true" />
                      Teaching pair
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => addCommandBlock("explanation")}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                      >
                        <FileText className="size-4" aria-hidden="true" />
                        Explain
                      </button>
                      <button
                        type="button"
                        onClick={() => addCommandBlock("sentence")}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                      >
                        <Languages className="size-4" aria-hidden="true" />
                        Practice
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Select a lesson or create one in the active module.
                </p>
              )}
            </section>

            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2">
                {activeLessonIssues.length === 0 ? (
                  <CheckCircle2
                    className="size-4 text-emerald-600"
                    aria-hidden="true"
                  />
                ) : (
                  <CircleAlert
                    className="size-4 text-red-600"
                    aria-hidden="true"
                  />
                )}
                <h2 className="text-sm font-semibold text-foreground">
                  Validation
                </h2>
              </div>
              {activeLessonIssues.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No structural issues detected.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {activeLessonIssues.map(({ block, index, issueCount }) => (
                    <button
                      key={block.id}
                      type="button"
                      onClick={() =>
                        activeLesson &&
                        revealContentBlock(activeLesson.id, block.id)
                      }
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-800 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-red-200"
                    >
                      <span className="min-w-0 truncate">
                        Block {index + 1}
                      </span>
                      <span className="shrink-0 text-xs font-semibold">
                        {issueCount}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">
                Focused block
              </h2>
              {activeBlock ? (
                <div className="mt-3 space-y-2 text-sm">
                  <p className="font-medium text-foreground">
                    {activeBlock.type === "explanation"
                      ? "Explanation"
                      : activeBlock.layout === "vocabulary_table"
                        ? "Vocabulary table"
                        : "Sentence practice"}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={duplicateActiveContentBlock}
                      className="rounded-lg border border-border px-2 py-1.5 text-xs font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => moveActiveContentBlock(-1)}
                      className="rounded-lg border border-border px-2 py-1.5 text-xs font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveActiveContentBlock(1)}
                      className="rounded-lg border border-border px-2 py-1.5 text-xs font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                    >
                      Down
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Focus a block to reveal block actions.
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsCommandPaletteOpen(true)}
        aria-label="Open command palette"
        title="Command palette (Mod+K)"
        className="fixed bottom-5 right-5 z-40 flex size-12 items-center justify-center rounded-full border border-border bg-popover text-popover-foreground shadow-lg transition hover:-translate-y-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
      >
        <Keyboard className="size-5" aria-hidden="true" />
      </button>

      {isCommandPaletteOpen && (
        <CommandPalette
          commands={builderCommands}
          onClose={() => setIsCommandPaletteOpen(false)}
        />
      )}

      {isHotkeyReminderOpen && (
        <HotkeyReminder onClose={() => setIsHotkeyReminderOpen(false)} />
      )}

      {practicePreviewLesson && (
        <LessonSelector
          lessons={[practicePreviewLesson]}
          initialLessonId={practicePreviewLesson.id}
          onCloseLesson={() => {
            setPreviewLessonId(null);
            setPreviewBlockId(null);
          }}
        />
      )}

      {pendingLessonExit && (
        <PendingLessonExitDialog
          lessonNumber={pendingLessonExitIndex + 1}
          isSaving={savingLessonId === pendingLessonExit.id}
          onCancel={cancelPendingLessonExit}
          onDiscard={discardPendingLessonChanges}
          onSave={() => void savePendingLessonChanges()}
        />
      )}
    </main>
  );
}
