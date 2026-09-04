"use client";

import { FileText, Keyboard, Languages, Plus, Table2, X } from "lucide-react";
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
import { SentenceConceptLinks } from "@/components/lesson-builder/sentence-concept-links";
import {
  SentenceMarkdownFields,
  type SentenceMarkdownFieldName,
} from "@/components/lesson-builder/sentence-markdown-fields";
import type {
  ConceptLink,
  Lesson,
  LessonBlock,
  LessonFile,
  LessonModule,
} from "@/lib/lesson-builder/types";
import {
  createConceptLink,
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
  onAddSentence,
  onAddVocabulary,
  onClose,
}: {
  onAddExplanation: () => void;
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
  const savedLessonsJsonRef = useRef(JSON.stringify([]));
  const pendingLessonExitActionRef = useRef<(() => void) | null>(null);
  const bypassLessonExitWarningRef = useRef(false);
  const autosaveTimerRef = useRef<number | undefined>(undefined);

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
  }, [activeModuleId, lessons]);

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

  const addExplanationBlock = useCallback(
    (lessonId: string, insertionIndex: number) => {
      const blockId = createId("block");

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
    },
    [lessons],
  );

  const addSentenceBlock = useCallback(
    (lessonId: string, insertionIndex: number) => {
      const blockId = createId("block");
      const languageBlockId = createId("lang");

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

      window.setTimeout(() => {
        languageBlockSpanishRefs.current
          .get(`${lessonId}-${blockId}-${languageBlockId}`)
          ?.focus();
      }, 0);
    },
    [lessons],
  );

  const addVocabularyBlock = useCallback(
    (lessonId: string, insertionIndex: number) => {
      const blockId = createId("block");
      const languageBlockId = createId("lang");

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

      window.setTimeout(() => {
        languageBlockSpanishRefs.current
          .get(`${lessonId}-${blockId}-${languageBlockId}`)
          ?.focus();
      }, 0);
    },
    [lessons],
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
  }, [
    activeLessonId,
    addExplanationBlock,
    addSentenceBlock,
    cancelPendingLessonExit,
    collapsedContentBlocks,
    collapsedLessons,
    createLesson,
    cycleActiveLessonCollapseMode,
    cycleAllLessonDisplayModes,
    isLessonDirty,
    lessons,
    openLessonEditor,
    openBlockPicker,
    pendingLessonExitId,
    saveLesson,
  ]);

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

  function deleteContentBlock(lessonId: string, blockId: string) {
    dispatch({ type: "DELETE_CONTENT_BLOCK", lessonId, blockId });
  }

  function duplicateContentBlock(lessonId: string, blockId: string) {
    dispatch({ type: "DUPLICATE_CONTENT_BLOCK", lessonId, blockId });
    setCollapsedContentBlocks(
      new Set(
        lessons.flatMap((lesson) =>
          lesson.blocks.map((block) => `${lesson.id}-${block.id}`),
        ),
      ),
    );
  }

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

  function addSentenceConceptLink(lessonId: string, sentenceBlockId: string) {
    dispatch({
      type: "ADD_SENTENCE_CONCEPT_LINK",
      lessonId,
      sentenceBlockId,
      conceptLink: createConceptLink(),
    });
  }

  function updateSentenceConceptLink(
    lessonId: string,
    sentenceBlockId: string,
    conceptLinkId: string,
    updates: Partial<Omit<ConceptLink, "id">>,
  ) {
    dispatch({
      type: "UPDATE_SENTENCE_CONCEPT_LINK",
      lessonId,
      sentenceBlockId,
      conceptLinkId,
      updates,
    });
  }

  function removeSentenceConceptLink(
    lessonId: string,
    sentenceBlockId: string,
    conceptLinkId: string,
  ) {
    dispatch({
      type: "REMOVE_SENTENCE_CONCEPT_LINK",
      lessonId,
      sentenceBlockId,
      conceptLinkId,
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
        event.key.toLowerCase() !== "z" ||
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
      undoCourseModules();
    }
    document.addEventListener("keydown", handleUndoShortcut);
    return () => document.removeEventListener("keydown", handleUndoShortcut);
  }, [undoCourseModules]);

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
    const next = courseModules.filter((module) => module.id !== moduleId);
    commitCourseModules(next);
    if (moduleId === activeModuleId) {
      setActiveModuleId(next[0]?.id ?? null);
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

        <div className="grid gap-5 lg:grid-cols-[15rem_1fr]">
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
                  : isDirty || saveStatus === "saving"
                    ? "Saving…"
                    : saveStatus === "saved"
                      ? "All lesson changes saved"
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
                onNameChange={(value) => renameLesson(lesson.id, value)}
                onPreview={() => {
                  setPreviewLessonId(lesson.id);
                  setPreviewBlockId(null);
                }}
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
                            <SentenceConceptLinks
                              conceptLinks={block.conceptLinks}
                              onAdd={() =>
                                addSentenceConceptLink(lesson.id, block.id)
                              }
                              onUpdate={(conceptLinkId, updates) =>
                                updateSentenceConceptLink(
                                  lesson.id,
                                  block.id,
                                  conceptLinkId,
                                  updates,
                                )
                              }
                              onRemove={(conceptLinkId) =>
                                removeSentenceConceptLink(
                                  lesson.id,
                                  block.id,
                                  conceptLinkId,
                                )
                              }
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
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsHotkeyReminderOpen(true)}
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (Alt+K)"
        className="fixed bottom-5 right-5 z-40 flex size-12 items-center justify-center rounded-full border border-border bg-popover text-popover-foreground shadow-lg transition hover:-translate-y-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
      >
        <Keyboard className="size-5" aria-hidden="true" />
      </button>

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
