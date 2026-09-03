"use client";

import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  FileText,
  GripVertical,
  Keyboard,
  Languages,
  Plus,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import {
  Fragment,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

import { HotkeyReminder } from "@/components/lesson-builder/hotkey-reminder";
import { MarkdownEditor } from "@/components/lesson-builder/markdown-editor";
import {
  LessonSelector,
  type PracticeLesson,
} from "@/components/practice/lesson-selector";
import { OverviewMarkdown } from "@/components/lesson-builder/overview-markdown";
import { LanguageBlockEditor } from "@/components/lesson-builder/language-block-editor";
import { LessonCardHeader } from "@/components/lesson-builder/lesson-card-header";
import { LessonConceptsField } from "@/components/lesson-builder/lesson-concepts-field";
import { PendingLessonExitDialog } from "@/components/lesson-builder/pending-lesson-exit-dialog";
import { SentenceConceptLinks } from "@/components/lesson-builder/sentence-concept-links";
import type {
  ConceptLink,
  Lesson,
  LessonBlock,
  LessonFile,
} from "@/lib/lesson-builder/types";
import {
  createConceptLink,
  createId,
  getSentenceValidationIssueCount,
  normalizeLessons,
} from "@/lib/lesson-builder/utils";
import { moveLesson as reorderLessons } from "@/lib/lesson-builder/mutations";
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

type SentenceMarkdownFieldName =
  | "promptLabel"
  | "promptText"
  | "helperText"
  | "answerFeedback";

function SentenceMarkdownFieldEditor({
  label,
  markdown,
  placeholder,
  tone = "violet",
  isOpen,
  onOpen,
  onClose,
  onChange,
}: {
  label: string;
  markdown: string;
  placeholder: string;
  tone?: "violet" | "emerald";
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onChange: (markdown: string) => void;
}) {
  const toneClasses =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50/45 text-emerald-800"
      : "border-violet-200 bg-violet-50/45 text-violet-800";

  if (!isOpen && !markdown.trim()) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-dashed px-3 py-2 text-left transition hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-current/15 ${toneClasses}`}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
          {label}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold">
          <Plus className="size-3.5" aria-hidden="true" />
          Add
        </span>
      </button>
    );
  }

  return (
    <section className={`overflow-hidden rounded-xl border ${toneClasses}`}>
      <div className="flex min-h-10 items-center justify-between gap-3 px-3 py-2">
        <button
          type="button"
          onClick={isOpen ? onClose : onOpen}
          className="min-w-0 flex-1 text-left text-[11px] font-semibold uppercase tracking-[0.12em] focus-visible:outline-none"
        >
          {label}
        </button>
        {isOpen && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs font-semibold transition hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/20"
          >
            Done
          </button>
        )}
      </div>
      {isOpen ? (
        <div className="border-t border-current/10 bg-white text-stone-900">
          <MarkdownEditor
            markdown={markdown}
            onChange={onChange}
            placeholder={placeholder}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="block w-full border-t border-current/10 bg-white/75 px-3 py-3 text-left text-sm leading-5 text-stone-700 transition hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-current/15"
        >
          {markdown.trim() ? (
            <OverviewMarkdown markdown={markdown} />
          ) : (
            <span className="italic text-stone-400">{placeholder}</span>
          )}
        </button>
      )}
    </section>
  );
}

export default function LessonBuilderPage() {
  const [lessons, dispatch] = useReducer(lessonsReducer, []);
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
  const [isSavingLessonOrder, setIsSavingLessonOrder] = useState(false);
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

  useEffect(() => {
    let isMounted = true;

    async function loadLessons() {
      try {
        const response = await fetch("/api/lesson-builder/lessons");
        if (!response.ok) {
          throw new Error("Unable to load lessons.");
        }

        const lessonFile = (await response.json()) as LessonFile;
        const lessons = normalizeLessons(lessonFile.lessons);
        const lessonsJson = JSON.stringify(lessons);

        if (isMounted) {
          savedLessonsJsonRef.current = lessonsJson;
          dispatch({ type: "SET_LESSONS", lessons });
          setSavedLessonsSnapshot(lessons);
          setCollapsedLessons(new Set(lessons.map((lesson) => lesson.id)));
          setFullyCollapsedLessons(new Set());
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
        `/api/lesson-builder/lessons/${encodeURIComponent(lessonId)}`,
        {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lesson, insertionIndex: lessonIndex }),
        },
      );

      if (!response.ok) {
        throw new Error("Unable to save lesson.");
      }

      const lessonFile = (await response.json()) as LessonFile;
      const savedLessons = normalizeLessons(lessonFile.lessons);
      savedLessonsJsonRef.current = JSON.stringify(savedLessons);
      setSavedLessonsSnapshot(savedLessons);
      setSaveStatus("saved");
      return true;
    } catch {
      setSaveStatus("error");
      return false;
    } finally {
      setSavingLessonId(null);
    }
  }, [
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

  // Deep link from /curriculum's "Lesson N" pill: ?lesson=<id> opens that
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
    setCollapsedLessons(new Set(lessons.map((lesson) => lesson.id)));
    setFullyCollapsedLessons((currentLessonIds) => {
      const nextLessonIds = new Set(currentLessonIds);
      nextLessonIds.delete(lessonId);
      return nextLessonIds;
    });
    setActiveLessonId(lessonId);
  }, [lessons]);

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
        `/api/lesson-builder/lessons/${encodeURIComponent(lessonId)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error("Unable to delete lesson.");
      }

      const lessonFile = (await response.json()) as LessonFile;
      const savedLessons = normalizeLessons(lessonFile.lessons);
      savedLessonsJsonRef.current = JSON.stringify(savedLessons);
      setSavedLessonsSnapshot(savedLessons);
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

  async function persistLessonOrder(reorderedLessons: Lesson[]) {
    setIsSavingLessonOrder(true);

    try {
      const response = await fetch("/api/lesson-builder/lesson-order", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonIds: reorderedLessons.map((lesson) => lesson.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save lesson order.");
      }

      const lessonFile = (await response.json()) as LessonFile;
      const savedLessons = normalizeLessons(lessonFile.lessons);
      savedLessonsJsonRef.current = JSON.stringify(savedLessons);
      setSavedLessonsSnapshot(savedLessons);
      setSaveStatus("saved");
      return true;
    } catch {
      setSaveStatus("error");
      return false;
    } finally {
      setIsSavingLessonOrder(false);
    }
  }

  function moveDraggedLesson() {
    const dragged = lessonDrag.dragged;
    const target = lessonDrag.dropTarget;
    if (!dragged || !target || dragged.id === target.id) {
      return;
    }

    const previousLessonIds = lessons.map((lesson) => lesson.id);
    const reorderedLessons = reorderLessons(lessons, {
      draggedId: dragged.id,
      targetId: target.id,
      position: target.position,
    });

    if (reorderedLessons === lessons) {
      return;
    }

    dispatch({ type: "SET_LESSONS", lessons: reorderedLessons });

    void persistLessonOrder(reorderedLessons).then((didSave) => {
      if (!didSave) {
        dispatch({ type: "SET_LESSON_ORDER", lessonIds: previousLessonIds });
      }
    });
  }

  const previewLessonIndex = lessons.findIndex(
    (lesson) => lesson.id === previewLessonId,
  );
  const hasUnsavedNewLesson = lessons.some(
    (lesson) =>
      !savedLessonsSnapshot.some(
        (savedLesson) => savedLesson.id === lesson.id,
      ),
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

  return (
    <main className="flex-1 bg-background px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Lesson Builder
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoadingLessons
                ? "Loading saved lessons..."
                : isSavingLessonOrder
                  ? "Saving lesson order..."
                : isDirty
                  ? "Unsaved changes"
                  : saveStatus === "saved"
                    ? "All changes saved"
                    : saveStatus === "error"
                      ? "Could not load or save lessons"
                      : "Loaded from lessons.json"}
            </p>
          </div>
        </div>

        {lessons.map((lesson, lessonIndex) => {
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
                dragDisabled={hasUnsavedNewLesson || isSavingLessonOrder}
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
                />
              )}

              {isLessonCollapsed && !isLessonFullyCollapsed && (
                <div className="space-y-3 border-t border-border bg-[var(--surface)] px-6 py-3">
                  {lesson.blocks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No content blocks yet.
                    </p>
                  ) : (
                    lesson.blocks.map((block) => (
                      <div
                        key={block.id}
                        className={
                          block.type === "explanation"
                            ? "rounded-lg bg-[var(--surface-sunken)] px-3 py-2 text-foreground"
                            : "px-1"
                        }
                      >
                        {block.type === "explanation" ? (
                          <div className="space-y-0 text-sm leading-5 text-foreground">
                            {block.contentMarkdown.trim() ? (
                              <OverviewMarkdown
                                markdown={block.contentMarkdown}
                              />
                            ) : (
                              <p>Empty explanation</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-foreground">
                            <p className="font-semibold">
                              {block.languageBlocks
                                .map((languageBlock) => languageBlock.spanish.trim())
                                .filter(Boolean)
                                .join(block.layout === "vocabulary_table" ? ", " : " ") ||
                                "Empty Spanish prompt"}
                            </p>
                            <p className="text-muted-foreground italic">
                              {block.languageBlocks
                                .map(
                                  (languageBlock) =>
                                    languageBlock.acceptedAnswers.find(
                                      (answer) => answer.trim(),
                                    )?.trim() ?? "",
                                )
                                .filter(Boolean)
                                .join(block.layout === "vocabulary_table" ? ", " : " ") ||
                                "No answer"}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
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
                      <>
                        <div
                          className={`flex items-center justify-between gap-3 ${
                            isContentBlockCollapsed
                              ? "bg-[var(--surface)] px-4 py-3"
                              : "border-b border-border bg-[var(--surface-sunken)] px-5 py-3"
                          }`}
                        >
                          {isContentBlockCollapsed ? (
                            <div
                              role="button"
                              tabIndex={0}
                              aria-label="Edit explanation"
                              onClick={() =>
                                toggleContentBlock(lesson.id, block.id)
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  toggleContentBlock(lesson.id, block.id);
                                }
                              }}
                              className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-md text-sm leading-5 text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-200"
                            >
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                                <FileText className="size-4" aria-hidden="true" />
                              </span>
                              <div className="min-w-0 flex-1 pt-1">
                                {block.contentMarkdown.trim() ? (
                                  <OverviewMarkdown
                                    markdown={block.contentMarkdown}
                                  />
                                ) : (
                                  <p className="italic text-muted-foreground">
                                    Empty explanation — click to edit
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                          <div
                            role="button"
                            tabIndex={0}
                            aria-label="Collapse explanation"
                            onClick={() =>
                              toggleContentBlock(lesson.id, block.id)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                toggleContentBlock(lesson.id, block.id);
                              }
                            }}
                            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-200"
                          >
                            <span className="flex size-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                              <FileText className="size-4" aria-hidden="true" />
                            </span>
                            <p className="font-semibold text-stone-900">
                              Explanation
                            </p>
                          </div>
                          )}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              draggable
                              onDragStart={(event) =>
                                contentDrag.dragStart(event, lesson.id, block.id)
                              }
                              onDragEnd={(event) => {
                                event.stopPropagation();
                                contentDrag.reset();
                              }}
                              aria-label="Drag explanation to reorder"
                              title="Drag to reorder"
                              className="flex size-8 cursor-grab items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 active:cursor-grabbing"
                            >
                              <GripVertical className="size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewLessonId(lesson.id);
                                setPreviewBlockId(block.id);
                              }}
                              aria-label="Preview explanation as learner"
                              title="Preview as learner"
                              className="flex size-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 hover:text-violet-700"
                            >
                              <Eye className="size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                duplicateContentBlock(lesson.id, block.id)
                              }
                              aria-label="Duplicate explanation"
                              title="Duplicate explanation"
                              className="flex size-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200"
                            >
                              <Copy className="size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                toggleContentBlock(lesson.id, block.id)
                              }
                              aria-label={`${isContentBlockCollapsed ? "Expand" : "Collapse"} explanation`}
                              title={isContentBlockCollapsed ? "Expand" : "Collapse"}
                              className={`flex h-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 ${
                                isContentBlockCollapsed
                                  ? "w-8"
                                  : "gap-2 px-2.5 text-xs font-semibold"
                              }`}
                            >
                              {isContentBlockCollapsed ? (
                                <ChevronDown className="size-4" aria-hidden="true" />
                              ) : (
                                <>
                                  Done
                                  <kbd className="rounded border border-stone-300 bg-white px-1.5 py-0.5 font-mono text-[10px] leading-none text-stone-500 shadow-sm">
                                    Esc
                                  </kbd>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                deleteContentBlock(lesson.id, block.id)
                              }
                              aria-label="Delete explanation"
                              title="Delete explanation"
                              className="flex size-8 items-center justify-center rounded-md text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        {!isContentBlockCollapsed && (
                          <MarkdownEditor
                            markdown={block.contentMarkdown}
                            onChange={(markdown) =>
                              updateExplanationBlock(
                                lesson.id,
                                block.id,
                                markdown,
                              )
                            }
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-3 border-b border-border bg-[var(--surface-sunken)] px-5 py-3">
                          <div
                            role="button"
                            tabIndex={0}
                            aria-disabled={
                              !isContentBlockCollapsed &&
                              sentenceValidationIssueCount > 0
                            }
                            aria-label={`${isContentBlockCollapsed ? "Expand" : "Collapse"} sentence`}
                            title={
                              !isContentBlockCollapsed &&
                              sentenceValidationIssueCount > 0
                                ? `Resolve ${sentenceValidationIssueCount} ${sentenceValidationIssueCount === 1 ? "issue" : "issues"} before closing this sentence.`
                                : undefined
                            }
                            onClick={() =>
                              toggleContentBlock(lesson.id, block.id)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                toggleContentBlock(lesson.id, block.id);
                              }
                            }}
                            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-200"
                          >
                            <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                              {block.layout === "vocabulary_table" ? (
                                <Table2 className="size-4" aria-hidden="true" />
                              ) : (
                                <Languages className="size-4" aria-hidden="true" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <span className="sr-only">
                                {block.layout === "vocabulary_table"
                                  ? "Vocabulary table block"
                                  : "Sentence block"}
                              </span>
                              <div className="space-y-0.5 text-sm">
                                <p className="truncate font-medium text-stone-700">
                                  {block.languageBlocks
                                    .map((languageBlock) =>
                                      languageBlock.spanish.trim(),
                                    )
                                    .filter(Boolean)
                                    .join(block.layout === "vocabulary_table" ? ", " : " ") ||
                                    "No Spanish text yet"}
                                </p>
                                <p className="truncate text-stone-500">
                                  {block.languageBlocks
                                    .map((languageBlock) =>
                                      languageBlock.acceptedAnswers[0]?.trim(),
                                    )
                                    .filter(Boolean)
                                    .join(block.layout === "vocabulary_table" ? ", " : " ") ||
                                    "No English answer yet"}
                                </p>
                              </div>
                            </div>
                            {sentenceValidationIssueCount > 0 && (
                              <span
                                role="status"
                                className="hidden shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 sm:inline-flex"
                              >
                                {sentenceValidationIssueCount}{" "}
                                {sentenceValidationIssueCount === 1
                                  ? "issue"
                                  : "issues"}
                              </span>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              draggable
                              onDragStart={(event) =>
                                contentDrag.dragStart(event, lesson.id, block.id)
                              }
                              onDragEnd={(event) => {
                                event.stopPropagation();
                                contentDrag.reset();
                              }}
                              aria-label="Drag sentence to reorder"
                              title="Drag to reorder"
                              className="flex size-8 cursor-grab items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 active:cursor-grabbing"
                            >
                              <GripVertical className="size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewLessonId(lesson.id);
                                setPreviewBlockId(block.id);
                              }}
                              disabled={sentenceValidationIssueCount > 0}
                              aria-label="Preview sentence as learner"
                              title={
                                sentenceValidationIssueCount > 0
                                  ? `Resolve ${sentenceValidationIssueCount} ${sentenceValidationIssueCount === 1 ? "issue" : "issues"} before previewing`
                                  : "Preview as learner"
                              }
                              className="flex size-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-stone-500"
                            >
                              <Eye className="size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                duplicateContentBlock(lesson.id, block.id)
                              }
                              aria-label="Duplicate sentence"
                              title="Duplicate sentence"
                              className="flex size-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200"
                            >
                              <Copy className="size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                toggleContentBlock(lesson.id, block.id)
                              }
                              disabled={
                                !isContentBlockCollapsed &&
                                sentenceValidationIssueCount > 0
                              }
                              aria-label={`${isContentBlockCollapsed ? "Expand" : "Collapse"} sentence`}
                              title={
                                !isContentBlockCollapsed &&
                                sentenceValidationIssueCount > 0
                                  ? `Resolve ${sentenceValidationIssueCount} ${sentenceValidationIssueCount === 1 ? "issue" : "issues"} before closing`
                                  : isContentBlockCollapsed
                                    ? "Expand"
                                    : "Collapse"
                              }
                              className="flex size-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
                            >
                              {isContentBlockCollapsed ? (
                                <ChevronDown className="size-4" aria-hidden="true" />
                              ) : (
                                <ChevronUp className="size-4" aria-hidden="true" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                deleteContentBlock(lesson.id, block.id)
                              }
                              aria-label="Delete sentence"
                              title="Delete sentence"
                              className="flex size-8 items-center justify-center rounded-md text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        {!isContentBlockCollapsed && (
                        <div className="flex flex-col p-6">
                            <div className="order-1 space-y-3">
                              <div className="flex items-center gap-3 text-stone-400">
                                <span className="h-px flex-1 bg-stone-200" />
                                <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                                  Optional fields
                                </span>
                                <span className="h-px flex-1 bg-stone-200" />
                              </div>
                              <SentenceMarkdownFieldEditor
                                label="Label"
                                markdown={block.promptLabel}
                                placeholder="For example: Tu turno"
                                isOpen={
                                  activeSentenceMarkdownField?.lessonId ===
                                    lesson.id &&
                                  activeSentenceMarkdownField.blockId ===
                                    block.id &&
                                  activeSentenceMarkdownField.field ===
                                    "promptLabel"
                                }
                                onOpen={() =>
                                  setActiveSentenceMarkdownField({
                                    lessonId: lesson.id,
                                    blockId: block.id,
                                    field: "promptLabel",
                                  })
                                }
                                onClose={() =>
                                  setActiveSentenceMarkdownField(null)
                                }
                                onChange={(markdown) =>
                                  updateSentencePromptLabel(
                                    lesson.id,
                                    block.id,
                                    markdown,
                                  )
                                }
                              />
                              <SentenceMarkdownFieldEditor
                                label="Prompt"
                                markdown={block.promptText}
                                placeholder="For example: ¿Cómo se dice “Estoy preparando”?"
                                isOpen={
                                  activeSentenceMarkdownField?.lessonId ===
                                    lesson.id &&
                                  activeSentenceMarkdownField.blockId ===
                                    block.id &&
                                  activeSentenceMarkdownField.field ===
                                    "promptText"
                                }
                                onOpen={() =>
                                  setActiveSentenceMarkdownField({
                                    lessonId: lesson.id,
                                    blockId: block.id,
                                    field: "promptText",
                                  })
                                }
                                onClose={() =>
                                  setActiveSentenceMarkdownField(null)
                                }
                                onChange={(markdown) =>
                                  updateSentencePromptText(
                                    lesson.id,
                                    block.id,
                                    markdown,
                                  )
                                }
                              />
                            </div>
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
                          <div
                            className={`order-2 mt-4 grid items-start gap-3 ${
                              block.layout === "vocabulary_table"
                                ? "grid-cols-1"
                                : "grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))]"
                            }`}
                          >
                            {block.languageBlocks.map(
                              (languageBlock, languageBlockIndex) => {
                                const languageBlockKey = `${lesson.id}-${block.id}-${languageBlock.id}`;
                                const langScope = `${lesson.id}::${block.id}`;
                                const isLastLanguageBlock =
                                  languageBlockIndex ===
                                  block.languageBlocks.length - 1;
                                const previousLanguageBlock =
                                  block.languageBlocks[languageBlockIndex - 1];
                                const languageDropPosition =
                                  languageDrag.dropTarget?.scope === langScope &&
                                  languageDrag.dropTarget.id === languageBlock.id
                                    ? languageDrag.dropTarget.position
                                    : null;
                                const isDraggingLanguageBlock =
                                  languageDrag.dragged?.scope === langScope &&
                                  languageDrag.dragged.id === languageBlock.id;

                                return (
                                  <LanguageBlockEditor
                                    key={languageBlock.id}
                                    languageBlock={languageBlock}
                                    index={languageBlockIndex}
                                    isCollapsed={collapsedLanguageBlocks.has(
                                      languageBlockKey,
                                    )}
                                    hasPreviousBlock={Boolean(
                                      previousLanguageBlock,
                                    )}
                                    dropPosition={languageDropPosition}
                                    isDragging={isDraggingLanguageBlock}
                                    onExpandFocusSpanish={() =>
                                      openLanguageBlockAndFocusSpanish(
                                        lesson.id,
                                        block.id,
                                        languageBlock.id,
                                      )
                                    }
                                    onCollapse={() =>
                                      setCollapsedLanguageBlocks((currentKeys) =>
                                        new Set(currentKeys).add(
                                          languageBlockKey,
                                        ),
                                      )
                                    }
                                    onDelete={() =>
                                      deleteLanguageBlock(
                                        lesson.id,
                                        block.id,
                                        languageBlock.id,
                                      )
                                    }
                                    onDragStart={(event) =>
                                      languageDrag.dragStart(
                                        event,
                                        langScope,
                                        languageBlock.id,
                                      )
                                    }
                                    onDragEnd={languageDrag.reset}
                                    onDragOver={(event) =>
                                      languageDrag.dragOver(
                                        event,
                                        langScope,
                                        languageBlock.id,
                                      )
                                    }
                                    onDrop={() => {
                                      moveDraggedLanguageBlock();
                                      languageDrag.reset();
                                    }}
                                    registerSpanishRef={(element) => {
                                      const key = `${lesson.id}-${block.id}-${languageBlock.id}`;
                                      if (element) {
                                        languageBlockSpanishRefs.current.set(
                                          key,
                                          element,
                                        );
                                      } else {
                                        languageBlockSpanishRefs.current.delete(
                                          key,
                                        );
                                      }
                                    }}
                                    onSpanishChange={(value) =>
                                      updateSpanishPrompt(
                                        lesson.id,
                                        block.id,
                                        languageBlock.id,
                                        value,
                                      )
                                    }
                                    onSpanishTabBackward={() => {
                                      if (previousLanguageBlock) {
                                        openLanguageBlockAndFocusAnswer(
                                          lesson.id,
                                          block.id,
                                          previousLanguageBlock.id,
                                          Math.max(
                                            previousLanguageBlock.acceptedAnswers
                                              .length - 1,
                                            0,
                                          ),
                                        );
                                      }
                                    }}
                                    onSpanishTabForward={() => {
                                      acceptedAnswerRefs.current
                                        .get(
                                          `${lesson.id}-${block.id}-${languageBlock.id}-0`,
                                        )
                                        ?.focus();
                                    }}
                                    registerAnswerRef={(answerIndex, element) => {
                                      const key = `${lesson.id}-${block.id}-${languageBlock.id}-${answerIndex}`;
                                      if (element) {
                                        acceptedAnswerRefs.current.set(
                                          key,
                                          element,
                                        );
                                      } else {
                                        acceptedAnswerRefs.current.delete(key);
                                      }
                                    }}
                                    onAnswerChange={(answerIndex, value) =>
                                      updateAcceptedAnswer(
                                        lesson.id,
                                        block.id,
                                        languageBlock.id,
                                        answerIndex,
                                        value,
                                      )
                                    }
                                    onAnswerAppend={() =>
                                      addAcceptedAnswer(
                                        lesson.id,
                                        block.id,
                                        languageBlock.id,
                                        languageBlock.acceptedAnswers.length,
                                      )
                                    }
                                    onAnswerRemove={(answerIndex) =>
                                      removeAcceptedAnswer(
                                        lesson.id,
                                        block.id,
                                        languageBlock.id,
                                        answerIndex,
                                      )
                                    }
                                    onAnswersTabForwardFromLast={() => {
                                      if (isLastLanguageBlock) {
                                        addLanguageBlock(
                                          lesson.id,
                                          block.id,
                                          createId("lang"),
                                        );
                                      } else {
                                        const nextLanguageBlock =
                                          block.languageBlocks[
                                            languageBlockIndex + 1
                                          ];
                                        if (nextLanguageBlock) {
                                          openLanguageBlockAndFocusSpanish(
                                            lesson.id,
                                            block.id,
                                            nextLanguageBlock.id,
                                          );
                                        }
                                      }
                                    }}
                                    registerCalloutRef={(element) => {
                                      const key = `${lesson.id}-${block.id}-${languageBlock.id}`;
                                      if (element) {
                                        languageBlockCalloutRefs.current.set(
                                          key,
                                          element,
                                        );
                                      } else {
                                        languageBlockCalloutRefs.current.delete(
                                          key,
                                        );
                                      }
                                    }}
                                    onCalloutAdd={() =>
                                      addLanguageBlockCallout(
                                        lesson.id,
                                        block.id,
                                        languageBlock.id,
                                      )
                                    }
                                    onCalloutChange={(value) =>
                                      updateLanguageBlockCallout(
                                        lesson.id,
                                        block.id,
                                        languageBlock.id,
                                        value,
                                      )
                                    }
                                    onCalloutRemove={() =>
                                      updateLanguageBlockCallout(
                                        lesson.id,
                                        block.id,
                                        languageBlock.id,
                                        null,
                                      )
                                    }
                                  />
                                );
                              },
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                addLanguageBlock(
                                  lesson.id,
                                  block.id,
                                  createId("lang"),
                                )
                              }
                              aria-label="Add language block"
                              title="Add language block"
                              className="group flex min-h-44 items-center justify-center rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 text-stone-400 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                            >
                              <span className="flex size-11 items-center justify-center rounded-full bg-white shadow-sm transition group-hover:bg-blue-100">
                                <Plus className="size-5" aria-hidden="true" />
                              </span>
                            </button>
                          </div>
                          <div className="order-3 mt-3">
                            <SentenceMarkdownFieldEditor
                              label="Helper text"
                              markdown={block.helperText ?? ""}
                              placeholder="For example: No hay penalización por equivocarse."
                              isOpen={
                                activeSentenceMarkdownField?.lessonId ===
                                  lesson.id &&
                                activeSentenceMarkdownField.blockId ===
                                  block.id &&
                                activeSentenceMarkdownField.field ===
                                  "helperText"
                              }
                              onOpen={() =>
                                setActiveSentenceMarkdownField({
                                  lessonId: lesson.id,
                                  blockId: block.id,
                                  field: "helperText",
                                })
                              }
                              onClose={() =>
                                setActiveSentenceMarkdownField(null)
                              }
                              onChange={(markdown) =>
                                updateSentenceHelperText(
                                  lesson.id,
                                  block.id,
                                  markdown,
                                )
                              }
                            />
                          </div>
                          <div className="order-4 mt-3">
                            <SentenceMarkdownFieldEditor
                              label="Answer feedback"
                              markdown={block.answerFeedback ?? ""}
                              placeholder="For example: Correcto. Ahora puedes usar la frase completa."
                              tone="emerald"
                              isOpen={
                                activeSentenceMarkdownField?.lessonId ===
                                  lesson.id &&
                                activeSentenceMarkdownField.blockId ===
                                  block.id &&
                                activeSentenceMarkdownField.field ===
                                  "answerFeedback"
                              }
                              onOpen={() =>
                                setActiveSentenceMarkdownField({
                                  lessonId: lesson.id,
                                  blockId: block.id,
                                  field: "answerFeedback",
                                })
                              }
                              onClose={() =>
                                setActiveSentenceMarkdownField(null)
                              }
                              onChange={(markdown) =>
                                updateSentenceAnswerFeedback(
                                  lesson.id,
                                  block.id,
                                  markdown || null,
                                )
                              }
                            />
                          </div>
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
