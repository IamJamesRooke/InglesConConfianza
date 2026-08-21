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
  Save,
  Sun,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";

import { HotkeyReminder } from "@/components/lesson-builder/hotkey-reminder";
import { MarkdownEditor } from "@/components/lesson-builder/markdown-editor";
import {
  LessonSelector,
  type PracticeLesson,
} from "@/components/practice/lesson-selector";
import { OverviewMarkdown } from "@/components/lesson-builder/overview-markdown";
import type {
  ConceptLink,
  ConceptRole,
  ConceptType,
  DropTarget,
  Lesson,
  LessonBlock,
  LessonFile,
  MappingDirection,
} from "@/lib/lesson-builder/types";
import {
  conceptRoleOptions,
  conceptTypeOptions,
  createConceptLink,
  createId,
  getAnswerValidationMessage,
  getSentenceValidationIssueCount,
  mappingDirectionOptions,
  normalizeLessons,
} from "@/lib/lesson-builder/utils";

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
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [savedLessonsSnapshot, setSavedLessonsSnapshot] = useState<Lesson[]>(
    [],
  );
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [draggedContentBlock, setDraggedContentBlock] = useState<{
    lessonId: string;
    blockId: string;
  } | null>(null);
  const [contentBlockDropTarget, setContentBlockDropTarget] = useState<{
    lessonId: string;
    blockId: string;
    position: "before" | "after";
  } | null>(null);
  const [draggedLanguageBlock, setDraggedLanguageBlock] = useState<{
    lessonId: string;
    sentenceBlockId: string;
    languageBlockId: string;
  } | null>(null);
  const [languageBlockDropTarget, setLanguageBlockDropTarget] = useState<{
    lessonId: string;
    sentenceBlockId: string;
    languageBlockId: string;
    position: "before" | "after";
  } | null>(null);
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
          setLessons(lessons);
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

    setLessons((currentLessons) =>
      savedLesson
        ? currentLessons.map((lesson) =>
            lesson.id === pendingLessonExitId ? savedLesson : lesson,
          )
        : currentLessons.filter(
            (lesson) => lesson.id !== pendingLessonExitId,
          ),
    );
    continuePendingLessonExit();
  }, [
    continuePendingLessonExit,
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

    setLessons((currentLessons) => [
      ...currentLessons,
      { id: lessonId, name: null, blocks: [] },
    ]);
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

      setLessons((currentLessons) =>
        currentLessons.map((lesson) => {
          if (lesson.id !== lessonId) {
            return lesson;
          }

          return {
            ...lesson,
            blocks: lesson.blocks.toSpliced(insertionIndex, 0, {
              id: blockId,
              type: "explanation",
              contentMarkdown: "",
            }),
          };
        }),
      );
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

      setLessons((currentLessons) =>
        currentLessons.map((lesson) => {
          if (lesson.id !== lessonId) {
            return lesson;
          }

          return {
            ...lesson,
            blocks: lesson.blocks.toSpliced(insertionIndex, 0, {
              id: blockId,
              type: "sentence",
              promptLabel: "",
              promptText: "",
              helperText: "",
              answerFeedback: null,
              conceptLinks: [],
              languageBlocks: [
                {
                  id: languageBlockId,
                  spanish: "",
                  callout: null,
                  acceptedAnswers: [""],
                  conceptLinks: [],
                },
              ],
            }),
          };
        }),
      );
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

      setLessons((currentLessons) =>
        currentLessons.map((lesson) => {
          if (lesson.id !== lessonId) {
            return lesson;
          }

          return {
            ...lesson,
            blocks: lesson.blocks.toSpliced(insertionIndex, 0, {
              id: blockId,
              type: "sentence",
              layout: "vocabulary_table",
              promptLabel: "",
              promptText: "",
              helperText: "",
              answerFeedback: null,
              conceptLinks: [],
              languageBlocks: [
                {
                  id: languageBlockId,
                  spanish: "",
                  callout: null,
                  acceptedAnswers: [""],
                  conceptLinks: [],
                },
              ],
            }),
          };
        }),
      );
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
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? { ...lesson, name: name.trimStart() || null }
          : lesson,
      ),
    );
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

    setLessons((currentLessons) =>
      currentLessons.filter((lesson) => lesson.id !== lessonId),
    );
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
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.filter((block) => block.id !== blockId),
            }
          : lesson,
      ),
    );
  }

  function duplicateContentBlock(lessonId: string, blockId: string) {
    const duplicateBlockId = createId("block");

    setLessons((currentLessons) =>
      currentLessons.map((lesson) => {
        if (lesson.id !== lessonId) {
          return lesson;
        }

        const sourceIndex = lesson.blocks.findIndex(
          (block) => block.id === blockId,
        );

        if (sourceIndex === -1) {
          return lesson;
        }

        const sourceBlock = lesson.blocks[sourceIndex];
        const duplicatedBlock =
          sourceBlock.type === "explanation"
            ? { ...sourceBlock, id: duplicateBlockId }
            : {
                ...sourceBlock,
                id: duplicateBlockId,
                conceptLinks: sourceBlock.conceptLinks.map((conceptLink) => ({
                  ...conceptLink,
                  id: createId("concept_link"),
                })),
                languageBlocks: sourceBlock.languageBlocks.map(
                  (languageBlock) => ({
                    ...languageBlock,
                    id: createId("lang"),
                    acceptedAnswers: [...languageBlock.acceptedAnswers],
                    conceptLinks: languageBlock.conceptLinks.map(
                      (conceptLink) => ({
                        ...conceptLink,
                        id: createId("concept_link"),
                      }),
                    ),
                  }),
                ),
              };
        const blocks = [...lesson.blocks];
        blocks.splice(sourceIndex + 1, 0, duplicatedBlock);
        return { ...lesson, blocks };
      }),
    );
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
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && isPracticeBlock(block)
                  ? { ...block, promptText }
                  : block,
              ),
            }
          : lesson,
      ),
    );
  }

  function updateSentencePromptLabel(
    lessonId: string,
    sentenceBlockId: string,
    promptLabel: string,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && isPracticeBlock(block)
                  ? { ...block, promptLabel }
                  : block,
              ),
            }
          : lesson,
      ),
    );
  }

  function updateSentenceHelperText(
    lessonId: string,
    sentenceBlockId: string,
    helperText: string,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && isPracticeBlock(block)
                  ? { ...block, helperText }
                  : block,
              ),
            }
          : lesson,
      ),
    );
  }

  function updateSentenceAnswerFeedback(
    lessonId: string,
    sentenceBlockId: string,
    answerFeedback: string | null,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && isPracticeBlock(block)
                  ? { ...block, answerFeedback }
                  : block,
              ),
            }
          : lesson,
      ),
    );
  }

  function addSentenceConceptLink(lessonId: string, sentenceBlockId: string) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && isPracticeBlock(block)
                  ? {
                      ...block,
                      conceptLinks: [
                        ...block.conceptLinks,
                        createConceptLink(),
                      ],
                    }
                  : block,
              ),
            }
          : lesson,
      ),
    );
  }

  function updateSentenceConceptLink(
    lessonId: string,
    sentenceBlockId: string,
    conceptLinkId: string,
    updates: Partial<Omit<ConceptLink, "id">>,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && isPracticeBlock(block)
                  ? {
                      ...block,
                      conceptLinks: block.conceptLinks.map((conceptLink) =>
                        conceptLink.id === conceptLinkId
                          ? { ...conceptLink, ...updates }
                          : conceptLink,
                      ),
                    }
                  : block,
              ),
            }
          : lesson,
      ),
    );
  }

  function removeSentenceConceptLink(
    lessonId: string,
    sentenceBlockId: string,
    conceptLinkId: string,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && isPracticeBlock(block)
                  ? {
                      ...block,
                      conceptLinks: block.conceptLinks.filter(
                        (conceptLink) => conceptLink.id !== conceptLinkId,
                      ),
                    }
                  : block,
              ),
            }
          : lesson,
      ),
    );
  }

  function updateLanguageBlockCallout(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
    callout: string | null,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && isPracticeBlock(block)
                  ? {
                      ...block,
                      languageBlocks: block.languageBlocks.map(
                        (languageBlock) =>
                          languageBlock.id === languageBlockId
                            ? { ...languageBlock, callout }
                            : languageBlock,
                      ),
                    }
                  : block,
              ),
            }
          : lesson,
      ),
    );
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
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === blockId && block.type === "explanation"
                  ? { ...block, contentMarkdown }
                  : block,
              ),
            }
          : lesson,
      ),
    );
  }

  function updateSpanishPrompt(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
    value: string,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && isPracticeBlock(block)
                  ? {
                      ...block,
                      languageBlocks: block.languageBlocks.map(
                        (languageBlock) =>
                          languageBlock.id === languageBlockId
                            ? { ...languageBlock, spanish: value }
                            : languageBlock,
                      ),
                    }
                  : block,
              ),
            }
          : lesson,
      ),
    );
  }

  function updateAcceptedAnswer(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
    answerIndex: number,
    value: string,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && isPracticeBlock(block)
                  ? {
                      ...block,
                      languageBlocks: block.languageBlocks.map(
                        (languageBlock) =>
                          languageBlock.id === languageBlockId
                            ? {
                                ...languageBlock,
                                acceptedAnswers:
                                  languageBlock.acceptedAnswers.map(
                                    (answer, currentAnswerIndex) =>
                                      currentAnswerIndex === answerIndex
                                        ? value
                                        : answer,
                                  ),
                              }
                            : languageBlock,
                      ),
                    }
                  : block,
              ),
            }
          : lesson,
      ),
    );
  }

  function addAcceptedAnswer(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
    answerIndex: number,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && isPracticeBlock(block)
                  ? {
                      ...block,
                      languageBlocks: block.languageBlocks.map(
                        (languageBlock) =>
                          languageBlock.id === languageBlockId
                            ? {
                                ...languageBlock,
                                acceptedAnswers: [
                                  ...languageBlock.acceptedAnswers,
                                  "",
                                ],
                              }
                            : languageBlock,
                      ),
                    }
                  : block,
              ),
            }
          : lesson,
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

  function removeAcceptedAnswer(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
    answerIndex: number,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && isPracticeBlock(block)
                  ? {
                      ...block,
                      languageBlocks: block.languageBlocks.map(
                        (languageBlock) =>
                          languageBlock.id === languageBlockId
                            ? {
                                ...languageBlock,
                                acceptedAnswers:
                                  languageBlock.acceptedAnswers.filter(
                                    (_, currentAnswerIndex) =>
                                      currentAnswerIndex !== answerIndex,
                                  ),
                              }
                            : languageBlock,
                      ),
                    }
                  : block,
              ),
            }
          : lesson,
      ),
    );
  }

  function addLanguageBlock(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && isPracticeBlock(block)
                  ? {
                      ...block,
                      languageBlocks: [
                        ...block.languageBlocks,
                        {
                          id: languageBlockId,
                          spanish: "",
                          callout: null,
                          acceptedAnswers: [""],
                          conceptLinks: [],
                        },
                      ],
                    }
                  : block,
              ),
            }
          : lesson,
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
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && isPracticeBlock(block)
                  ? {
                      ...block,
                      languageBlocks: block.languageBlocks.filter(
                        (languageBlock) =>
                          languageBlock.id !== languageBlockId,
                      ),
                    }
                  : block,
              ),
            }
          : lesson,
      ),
    );
  }

  function startDraggingLanguageBlock(
    event: DragEvent<HTMLElement>,
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
  ) {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", languageBlockId);
    setDraggedLanguageBlock({
      lessonId,
      sentenceBlockId,
      languageBlockId,
    });
    setLanguageBlockDropTarget(null);
  }

  function updateLanguageBlockDropTarget(
    event: DragEvent<HTMLDivElement>,
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
  ) {
    if (!draggedLanguageBlock) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (
      draggedLanguageBlock.lessonId !== lessonId ||
      draggedLanguageBlock.sentenceBlockId !== sentenceBlockId ||
      draggedLanguageBlock.languageBlockId === languageBlockId
    ) {
      setLanguageBlockDropTarget(null);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const position =
      event.clientX < bounds.left + bounds.width / 2 ? "before" : "after";
    setLanguageBlockDropTarget({
      lessonId,
      sentenceBlockId,
      languageBlockId,
      position,
    });
  }

  function moveDraggedLanguageBlock() {
    if (!draggedLanguageBlock || !languageBlockDropTarget) {
      return;
    }

    if (
      draggedLanguageBlock.lessonId !== languageBlockDropTarget.lessonId ||
      draggedLanguageBlock.sentenceBlockId !==
        languageBlockDropTarget.sentenceBlockId
    ) {
      return;
    }

    setLessons((currentLessons) =>
      currentLessons.map((lesson) => {
        if (lesson.id !== draggedLanguageBlock.lessonId) {
          return lesson;
        }

        return {
          ...lesson,
          blocks: lesson.blocks.map((block) => {
            if (
              block.id !== draggedLanguageBlock.sentenceBlockId ||
              !isPracticeBlock(block)
            ) {
              return block;
            }

            const draggedIndex = block.languageBlocks.findIndex(
              (languageBlock) =>
                languageBlock.id === draggedLanguageBlock.languageBlockId,
            );
            const targetIndex = block.languageBlocks.findIndex(
              (languageBlock) =>
                languageBlock.id ===
                languageBlockDropTarget.languageBlockId,
            );

            if (draggedIndex === -1 || targetIndex === -1) {
              return block;
            }

            const languageBlocks = [...block.languageBlocks];
            const [draggedBlock] = languageBlocks.splice(draggedIndex, 1);
            const adjustedTargetIndex =
              targetIndex > draggedIndex ? targetIndex - 1 : targetIndex;
            const insertionIndex =
              languageBlockDropTarget.position === "after"
                ? adjustedTargetIndex + 1
                : adjustedTargetIndex;
            languageBlocks.splice(insertionIndex, 0, draggedBlock);
            return { ...block, languageBlocks };
          }),
        };
      }),
    );
  }

  function finishDraggingLanguageBlock() {
    setDraggedLanguageBlock(null);
    setLanguageBlockDropTarget(null);
  }

  function startDraggingContentBlock(
    event: DragEvent<HTMLElement>,
    lessonId: string,
    blockId: string,
  ) {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", blockId);
    setDraggedContentBlock({ lessonId, blockId });
    setContentBlockDropTarget(null);
  }

  function updateContentBlockDropTarget(
    event: DragEvent<HTMLDivElement>,
    lessonId: string,
    blockId: string,
  ) {
    if (!draggedContentBlock) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (
      draggedContentBlock.lessonId !== lessonId ||
      draggedContentBlock.blockId === blockId
    ) {
      setContentBlockDropTarget(null);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const position =
      event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";

    setContentBlockDropTarget({ lessonId, blockId, position });
  }

  function moveDraggedContentBlock() {
    if (!draggedContentBlock || !contentBlockDropTarget) {
      return;
    }

    if (draggedContentBlock.lessonId !== contentBlockDropTarget.lessonId) {
      return;
    }

    setLessons((currentLessons) =>
      currentLessons.map((lesson) => {
        if (lesson.id !== draggedContentBlock.lessonId) {
          return lesson;
        }

        const draggedIndex = lesson.blocks.findIndex(
          (block) => block.id === draggedContentBlock.blockId,
        );
        const targetIndex = lesson.blocks.findIndex(
          (block) => block.id === contentBlockDropTarget.blockId,
        );

        if (draggedIndex === -1 || targetIndex === -1) {
          return lesson;
        }

        const blocks = [...lesson.blocks];
        const [draggedBlock] = blocks.splice(draggedIndex, 1);
        const adjustedTargetIndex =
          targetIndex > draggedIndex ? targetIndex - 1 : targetIndex;
        const insertionIndex =
          contentBlockDropTarget.position === "after"
            ? adjustedTargetIndex + 1
            : adjustedTargetIndex;

        blocks.splice(insertionIndex, 0, draggedBlock);
        return { ...lesson, blocks };
      }),
    );
  }

  function finishDraggingContentBlock() {
    setDraggedContentBlock(null);
    setContentBlockDropTarget(null);
  }

  function updateDropTarget(
    event: DragEvent<HTMLElement>,
    lessonId: string,
  ) {
    event.preventDefault();

    if (draggedLessonId === lessonId) {
      setDropTarget(null);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const position =
      event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";

    setDropTarget({ lessonId, position });
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

  function moveLesson(target: DropTarget) {
    if (draggedLessonId === null || draggedLessonId === target.lessonId) {
      return;
    }

    const previousLessonIds = lessons.map((lesson) => lesson.id);
    const reorderedLessons = lessons.filter(
      (lesson) => lesson.id !== draggedLessonId,
    );
    const targetIndex = reorderedLessons.findIndex(
      (lesson) => lesson.id === target.lessonId,
    );
    const draggedLesson = lessons.find(
      (lesson) => lesson.id === draggedLessonId,
    );

    if (!draggedLesson || targetIndex === -1) {
      return;
    }

    const insertionIndex =
      target.position === "after" ? targetIndex + 1 : targetIndex;

    reorderedLessons.splice(insertionIndex, 0, draggedLesson);
    setLessons(reorderedLessons);

    void persistLessonOrder(reorderedLessons).then((didSave) => {
      if (!didSave) {
        setLessons((currentLessons) => {
          const lessonById = new Map(
            currentLessons.map((lesson) => [lesson.id, lesson]),
          );
          return previousLessonIds
            .map((lessonId) => lessonById.get(lessonId))
            .filter((lesson): lesson is Lesson => Boolean(lesson));
        });
      }
    });
  }

  function finishDragging() {
    setDraggedLessonId(null);
    setDropTarget(null);
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
          const isDragging = draggedLessonId === lesson.id;
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
            dropTarget && dropTarget.lessonId === lesson.id
              ? dropTarget.position
              : null;

          return (
            <section
              key={lesson.id}
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
              onDragOver={(event) => updateDropTarget(event, lesson.id)}
              onDrop={(event) => {
                event.preventDefault();
                if (dropTarget) {
                  moveLesson(dropTarget);
                }
                finishDragging();
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

              <header
                onClick={(event) => {
                  if (
                    !isLessonCollapsed &&
                    !isInteractiveLessonTarget(event.target)
                  ) {
                    cycleLessonDisplayMode(lesson.id);
                  }
                }}
                className={`flex items-center gap-4 border-b border-border bg-[var(--surface-sunken)] px-6 py-4 ${
                  !isLessonCollapsed ? "cursor-pointer" : ""
                }`}
              >
                <h2 className="shrink-0 text-xl font-semibold tracking-tight text-stone-900">
                  Lesson {lessonNumber}
                </h2>
                {lessonIsDirty && (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    Unsaved
                  </span>
                )}
                <input
                  type="text"
                  value={lesson.name ?? ""}
                  onChange={(event) =>
                    renameLesson(lesson.id, event.target.value)
                  }
                  placeholder="Add lesson name (optional)"
                  aria-label={`Name for lesson ${lessonNumber}`}
                  className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-violet-400 focus:ring-3 focus:ring-violet-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewLessonId(lesson.id);
                    setPreviewBlockId(null);
                  }}
                  disabled={lessonValidationIssueCount > 0}
                  aria-label={`Preview lesson ${lessonNumber}`}
                  title={
                    lessonValidationIssueCount > 0
                      ? `Resolve ${lessonValidationIssueCount} ${lessonValidationIssueCount === 1 ? "issue" : "issues"} before previewing this lesson`
                      : "Preview lesson"
                  }
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-stone-500 transition hover:bg-stone-200 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-stone-500 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-200"
                >
                  <Eye className="size-4" aria-hidden="true" />
                  <span className="hidden lg:inline">Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => void saveLesson(lesson.id)}
                  disabled={
                    isLoadingLessons ||
                    !lessonIsDirty ||
                    saveStatus === "saving"
                  }
                  aria-label={`Save lesson ${lessonNumber}`}
                  title="Save lesson (Alt+S)"
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <Save className="size-4" aria-hidden="true" />
                  <span className="hidden lg:inline">
                    {isThisLessonSaving ? "Saving..." : "Save"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => cycleLessonDisplayMode(lesson.id)}
                  aria-label={`Cycle lesson ${lessonNumber} display mode`}
                  title="Cycle display mode (Alt+M)"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-200 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-200"
                >
                  {!isLessonCollapsed ? (
                    <ChevronUp className="size-4" aria-hidden="true" />
                  ) : isLessonFullyCollapsed ? (
                    <ChevronDown className="size-4" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="size-4 rotate-90" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => deleteLesson(lesson.id)}
                  aria-label={`Delete lesson ${lessonNumber}`}
                  title="Delete lesson"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-red-200"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  draggable={!hasUnsavedNewLesson && !isSavingLessonOrder}
                  disabled={hasUnsavedNewLesson || isSavingLessonOrder}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData(
                      "text/plain",
                      String(lesson.id),
                    );
                    setDraggedLessonId(lesson.id);
                  }}
                  onDragEnd={finishDragging}
                  aria-label={`Drag lesson ${lessonNumber} to reorder`}
                  title={
                    hasUnsavedNewLesson
                      ? "Save new lessons before reordering"
                      : "Drag to reorder"
                  }
                  className="flex shrink-0 cursor-grab items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-stone-500 transition hover:bg-stone-200 hover:text-stone-700 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="hidden sm:inline">Drag to reorder</span>
                  <GripVertical className="size-5" aria-hidden="true" />
                </button>
              </header>

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
                    contentBlockDropTarget?.lessonId === lesson.id &&
                    contentBlockDropTarget.blockId === block.id
                      ? contentBlockDropTarget.position
                      : null;
                  const isDraggingContentBlock =
                    draggedContentBlock?.lessonId === lesson.id &&
                    draggedContentBlock.blockId === block.id;

                  return (
                    <Fragment key={block.id}>
                    <div
                      onDragOver={(event) =>
                        updateContentBlockDropTarget(
                          event,
                          lesson.id,
                          block.id,
                        )
                      }
                      onDrop={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        moveDraggedContentBlock();
                        finishDraggingContentBlock();
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
                                startDraggingContentBlock(
                                  event,
                                  lesson.id,
                                  block.id,
                                )
                              }
                              onDragEnd={(event) => {
                                event.stopPropagation();
                                finishDraggingContentBlock();
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
                                startDraggingContentBlock(
                                  event,
                                  lesson.id,
                                  block.id,
                                )
                              }
                              onDragEnd={(event) => {
                                event.stopPropagation();
                                finishDraggingContentBlock();
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
                            <div className="order-5 mt-5 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                                  Concepts Taught
                                </p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    addSentenceConceptLink(lesson.id, block.id)
                                  }
                                  className="rounded-md px-2 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                                >
                                  Add concept
                                </button>
                              </div>
                              {block.conceptLinks.length > 0 ? (
                                <div className="space-y-2">
                                  {block.conceptLinks.map((conceptLink) => (
                                    <div
                                      key={conceptLink.id}
                                      className="rounded-lg bg-white p-3"
                                    >
                                      <div className="flex flex-col gap-2 sm:flex-row">
                                        <select
                                          value={conceptLink.type}
                                          onChange={(event) =>
                                            updateSentenceConceptLink(
                                              lesson.id,
                                              block.id,
                                              conceptLink.id,
                                              {
                                                type: event.target
                                                  .value as ConceptType,
                                              },
                                            )
                                          }
                                          className="rounded-md border border-blue-100 bg-white px-2.5 py-2 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                        >
                                          {conceptTypeOptions.map((option) => (
                                            <option
                                              key={option.value}
                                              value={option.value}
                                            >
                                              {option.label}
                                            </option>
                                          ))}
                                        </select>
                                        <select
                                          value={conceptLink.direction}
                                          onChange={(event) =>
                                            updateSentenceConceptLink(
                                              lesson.id,
                                              block.id,
                                              conceptLink.id,
                                              {
                                                direction: event.target
                                                  .value as MappingDirection,
                                              },
                                            )
                                          }
                                          className="rounded-md border border-blue-100 bg-white px-2.5 py-2 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                        >
                                          {mappingDirectionOptions.map(
                                            (option) => (
                                              <option
                                                key={option.value}
                                                value={option.value}
                                              >
                                                {option.label}
                                              </option>
                                            ),
                                          )}
                                        </select>
                                        <select
                                          value={conceptLink.role}
                                          onChange={(event) =>
                                            updateSentenceConceptLink(
                                              lesson.id,
                                              block.id,
                                              conceptLink.id,
                                              {
                                                role: event.target
                                                  .value as ConceptRole,
                                              },
                                            )
                                          }
                                          className="rounded-md border border-blue-100 bg-white px-2.5 py-2 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                        >
                                          {conceptRoleOptions.map((option) => (
                                            <option
                                              key={option.value}
                                              value={option.value}
                                            >
                                              {option.label}
                                            </option>
                                          ))}
                                        </select>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeSentenceConceptLink(
                                              lesson.id,
                                              block.id,
                                              conceptLink.id,
                                            )
                                          }
                                          aria-label="Remove sentence concept"
                                          title="Remove concept"
                                          className="flex size-9 shrink-0 items-center justify-center rounded-md text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                                        >
                                          <X className="size-4" aria-hidden="true" />
                                        </button>
                                      </div>
                                      <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                        <input
                                          type="text"
                                          value={conceptLink.sourceText}
                                          onChange={(event) =>
                                            updateSentenceConceptLink(
                                              lesson.id,
                                              block.id,
                                              conceptLink.id,
                                              { sourceText: event.target.value },
                                            )
                                          }
                                          placeholder="Source"
                                          className="min-w-0 rounded-md border border-blue-100 px-2.5 py-2 text-sm outline-none transition placeholder:text-stone-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                        />
                                        <input
                                          type="text"
                                          value={conceptLink.targetText}
                                          onChange={(event) =>
                                            updateSentenceConceptLink(
                                              lesson.id,
                                              block.id,
                                              conceptLink.id,
                                              { targetText: event.target.value },
                                            )
                                          }
                                          placeholder="Target"
                                          className="min-w-0 rounded-md border border-blue-100 px-2.5 py-2 text-sm outline-none transition placeholder:text-stone-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                        />
                                        <input
                                          type="text"
                                          value={conceptLink.contextLabel}
                                          onChange={(event) =>
                                            updateSentenceConceptLink(
                                              lesson.id,
                                              block.id,
                                              conceptLink.id,
                                              {
                                                contextLabel:
                                                  event.target.value,
                                              },
                                            )
                                          }
                                          placeholder="Context"
                                          className="min-w-0 rounded-md border border-blue-100 px-2.5 py-2 text-sm outline-none transition placeholder:text-stone-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                        />
                                      </div>
                                      <input
                                        type="text"
                                        value={conceptLink.label}
                                        onChange={(event) =>
                                          updateSentenceConceptLink(
                                            lesson.id,
                                            block.id,
                                            conceptLink.id,
                                            { label: event.target.value },
                                          )
                                        }
                                        placeholder="Optional display label"
                                        className="mt-2 w-full rounded-md border border-blue-100 px-2.5 py-2 text-sm outline-none transition placeholder:text-stone-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                      />
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-blue-700/70">
                                  Add phrase or sentence-level concepts here.
                                </p>
                              )}
                            </div>
                          <div
                            className={`order-2 mt-4 grid items-start gap-3 ${
                              block.layout === "vocabulary_table"
                                ? "grid-cols-1"
                                : "grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))]"
                            }`}
                          >
                            {block.languageBlocks.map(
                              (languageBlock, languageBlockIndex) => {
                                const isLastLanguageBlock =
                                  languageBlockIndex ===
                                  block.languageBlocks.length - 1;
                                const previousLanguageBlock =
                                  block.languageBlocks[languageBlockIndex - 1];
                                const languageBlockKey = `${lesson.id}-${block.id}-${languageBlock.id}`;
                                const isLanguageBlockCollapsed =
                                  collapsedLanguageBlocks.has(languageBlockKey);
                                const isSpanishMissing =
                                  !languageBlock.spanish.trim();
                                const languageDropPosition =
                                  languageBlockDropTarget?.lessonId ===
                                    lesson.id &&
                                  languageBlockDropTarget.sentenceBlockId ===
                                    block.id &&
                                  languageBlockDropTarget.languageBlockId ===
                                    languageBlock.id
                                    ? languageBlockDropTarget.position
                                    : null;
                                const isDraggingLanguageBlock =
                                  draggedLanguageBlock?.lessonId === lesson.id &&
                                  draggedLanguageBlock.sentenceBlockId ===
                                    block.id &&
                                  draggedLanguageBlock.languageBlockId ===
                                    languageBlock.id;

                                return (
                                  <div
                                    key={languageBlock.id}
                                    onClick={(event) => {
                                      if (
                                        event.target instanceof Element &&
                                          event.target.closest(
                                            "button, input, textarea, select, a, [contenteditable='true']",
                                          )
                                      ) {
                                        return;
                                      }

                                      if (isLanguageBlockCollapsed) {
                                        openLanguageBlockAndFocusSpanish(
                                          lesson.id,
                                          block.id,
                                          languageBlock.id,
                                        );
                                      } else {
                                        setCollapsedLanguageBlocks(
                                          (currentKeys) =>
                                            new Set(currentKeys).add(
                                              languageBlockKey,
                                            ),
                                        );
                                      }
                                    }}
                                    onDragOver={(event) =>
                                      updateLanguageBlockDropTarget(
                                        event,
                                        lesson.id,
                                        block.id,
                                        languageBlock.id,
                                      )
                                    }
                                    onDrop={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      moveDraggedLanguageBlock();
                                      finishDraggingLanguageBlock();
                                    }}
                                    className={`relative overflow-hidden rounded-xl border bg-white transition ${
                                      isLanguageBlockCollapsed
                                        ? "cursor-pointer shadow-sm"
                                        : "cursor-pointer shadow-md shadow-stone-200/60"
                                    } ${
                                      isSpanishMissing ||
                                      languageBlock.acceptedAnswers.some(
                                        (_, answerIndex) =>
                                          getAnswerValidationMessage(
                                            languageBlock.acceptedAnswers,
                                            answerIndex,
                                          ),
                                      )
                                        ? "border-red-300"
                                        : "border-stone-300"
                                    } ${isDraggingLanguageBlock ? "opacity-45" : ""}`}
                                  >
                                    {languageDropPosition && (
                                      <span
                                        aria-hidden="true"
                                        className={`absolute inset-y-2 z-20 w-1 rounded-full bg-blue-500 ${
                                          languageDropPosition === "before"
                                            ? "left-0"
                                            : "right-0"
                                        }`}
                                      />
                                    )}
                                    <div className="flex items-center justify-between gap-2 border-b border-stone-200 bg-stone-100 px-2 py-1.5">
                                      <button
                                        type="button"
                                        draggable
                                        onDragStart={(event) =>
                                          startDraggingLanguageBlock(
                                            event,
                                            lesson.id,
                                            block.id,
                                            languageBlock.id,
                                          )
                                        }
                                        onDragEnd={(event) => {
                                          event.stopPropagation();
                                          finishDraggingLanguageBlock();
                                        }}
                                        aria-label={`Drag language block ${languageBlockIndex + 1} to reorder`}
                                        title="Drag to reorder"
                                        className="flex size-7 cursor-grab items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 active:cursor-grabbing"
                                      >
                                        <GripVertical className="size-3.5" aria-hidden="true" />
                                      </button>
                                      <div className="flex items-center gap-0.5">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            deleteLanguageBlock(
                                              lesson.id,
                                              block.id,
                                              languageBlock.id,
                                            )
                                          }
                                          aria-label={`Delete language block ${languageBlockIndex + 1}`}
                                          title="Delete language block"
                                          className="flex size-7 items-center justify-center rounded-md text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                                        >
                                          <Trash2 className="size-3.5" aria-hidden="true" />
                                        </button>
                                      </div>
                                    </div>
                                    {isLanguageBlockCollapsed ? (
                                      <>
                                        <div
                                          role="button"
                                          tabIndex={0}
                                          onKeyDown={(event) => {
                                            if (
                                              event.key === "Enter" ||
                                              event.key === " "
                                            ) {
                                              event.preventDefault();
                                              openLanguageBlockAndFocusSpanish(
                                                lesson.id,
                                                block.id,
                                                languageBlock.id,
                                              );
                                            }
                                          }}
                                          className="cursor-pointer px-3 py-3 text-sm text-stone-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-blue-200"
                                        >
                                          <p className="font-bold text-stone-900">
                                            {languageBlock.spanish || "Spanish prompt"}
                                          </p>
                                          <div className="mt-1 space-y-0.5">
                                            {languageBlock.acceptedAnswers.some(
                                              (answer) => answer.trim(),
                                            ) ? (
                                              languageBlock.acceptedAnswers
                                                .filter((answer) => answer.trim())
                                                .map((answer, answerIndex) => (
                                                  <p
                                                    key={`${answer}-${answerIndex}`}
                                                    className="italic text-stone-500"
                                                  >
                                                    {answer}
                                                  </p>
                                                ))
                                            ) : (
                                              <p className="italic text-stone-400">
                                                English answer
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        {languageBlock.callout != null && (
                                          <div className="flex items-center gap-2 border-t border-amber-300 bg-gradient-to-r from-amber-100 via-yellow-200 to-orange-100 px-3 py-2 text-sm font-semibold text-amber-950">
                                            <Sun
                                              className="size-4 shrink-0 text-orange-600"
                                              aria-hidden="true"
                                            />
                                            <p className="min-w-0 truncate italic">
                                              {languageBlock.callout ||
                                                "Empty context hint"}
                                            </p>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                    <div className="flex min-h-28 flex-col items-center justify-center gap-2 px-4 py-5">
                                      <label className="w-full">
                                        <span className="sr-only">
                                          Spanish prompt
                                        </span>
                                        <input
                                          ref={(element) => {
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
                                          type="text"
                                          value={languageBlock.spanish}
                                          aria-invalid={isSpanishMissing}
                                          onChange={(event) =>
                                            updateSpanishPrompt(
                                              lesson.id,
                                              block.id,
                                              languageBlock.id,
                                              event.target.value,
                                            )
                                          }
                                          onKeyDown={(event) => {
                                            if (
                                              event.key === "Tab" &&
                                              event.shiftKey &&
                                              previousLanguageBlock
                                            ) {
                                              event.preventDefault();
                                              openLanguageBlockAndFocusAnswer(
                                                lesson.id,
                                                block.id,
                                                previousLanguageBlock.id,
                                                Math.max(
                                                  previousLanguageBlock
                                                    .acceptedAnswers.length - 1,
                                                  0,
                                                ),
                                              );
                                              return;
                                            }

                                            if (
                                              event.key === "Tab" &&
                                              !event.shiftKey
                                            ) {
                                              event.preventDefault();
                                              acceptedAnswerRefs.current
                                                .get(
                                                  `${lesson.id}-${block.id}-${languageBlock.id}-0`,
                                                )
                                                ?.focus();
                                            }
                                          }}
                                          placeholder="Spanish prompt"
                                          className="w-full bg-transparent text-center text-xl font-semibold tracking-tight text-stone-900 outline-none placeholder:text-stone-300"
                                        />
                                      </label>
                                      {isSpanishMissing && (
                                        <p className="text-xs font-medium text-red-600">
                                          Spanish text is required.
                                        </p>
                                      )}
                                    </div>
                                    <div className="border-t border-stone-800 bg-stone-900 px-3 py-3">
                                      <div className="space-y-2">
                                        {languageBlock.acceptedAnswers.map(
                                          (answer, answerIndex) => {
                                            const isPrimaryAnswer =
                                              answerIndex === 0;
                                            const isLastAnswer =
                                              answerIndex ===
                                              languageBlock.acceptedAnswers
                                                .length -
                                                1;
                                            const nextLanguageBlock =
                                              block.languageBlocks[
                                                languageBlockIndex + 1
                                              ];
                                            const answerValidationMessage =
                                              getAnswerValidationMessage(
                                                languageBlock.acceptedAnswers,
                                                answerIndex,
                                              );

                                            return (
                                              <label
                                                key={answerIndex}
                                                className="block"
                                              >
                                                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                                                  {isPrimaryAnswer
                                                    ? "English answer"
                                                    : "Also accepted"}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                  <input
                                                    ref={(element) => {
                                                      const key = `${lesson.id}-${block.id}-${languageBlock.id}-${answerIndex}`;
                                                      if (element) {
                                                        acceptedAnswerRefs.current.set(
                                                          key,
                                                          element,
                                                        );
                                                      } else {
                                                        acceptedAnswerRefs.current.delete(
                                                          key,
                                                        );
                                                      }
                                                    }}
                                                    type="text"
                                                    value={answer}
                                                    aria-invalid={
                                                      Boolean(
                                                        answerValidationMessage,
                                                      )
                                                    }
                                                    onChange={(event) =>
                                                      updateAcceptedAnswer(
                                                        lesson.id,
                                                        block.id,
                                                        languageBlock.id,
                                                        answerIndex,
                                                        event.target.value,
                                                      )
                                                    }
                                                    onKeyDown={(event) => {
                                                      if (
                                                        event.altKey &&
                                                        event.key === "Enter"
                                                      ) {
                                                        event.preventDefault();
                                                        addAcceptedAnswer(
                                                          lesson.id,
                                                          block.id,
                                                          languageBlock.id,
                                                          languageBlock
                                                            .acceptedAnswers
                                                            .length,
                                                        );
                                                        return;
                                                      }

                                                      if (
                                                        event.key === "Enter" &&
                                                        !isPrimaryAnswer
                                                      ) {
                                                        event.preventDefault();
                                                        addAcceptedAnswer(
                                                          lesson.id,
                                                          block.id,
                                                          languageBlock.id,
                                                          languageBlock
                                                            .acceptedAnswers
                                                            .length,
                                                        );
                                                        return;
                                                      }

                                                      if (
                                                        event.key === "Tab" &&
                                                        !event.shiftKey &&
                                                        isLastAnswer
                                                      ) {
                                                        event.preventDefault();

                                                        if (
                                                          isLastLanguageBlock
                                                        ) {
                                                          addLanguageBlock(
                                                            lesson.id,
                                                            block.id,
                                                            createId("lang"),
                                                          );
                                                        } else if (
                                                          nextLanguageBlock
                                                        ) {
                                                          openLanguageBlockAndFocusSpanish(
                                                            lesson.id,
                                                            block.id,
                                                            nextLanguageBlock.id,
                                                          );
                                                        }
                                                      }
                                                    }}
                                                    placeholder={
                                                      isPrimaryAnswer
                                                        ? "English answer"
                                                        : "Alternative answer"
                                                    }
                                                    className="min-w-0 flex-1 rounded-md bg-stone-800 px-2.5 py-2 text-sm font-semibold text-white outline-none transition placeholder:text-stone-500 focus:bg-stone-700 focus:ring-2 focus:ring-blue-400/50"
                                                  />
                                                  {!isPrimaryAnswer && (
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        removeAcceptedAnswer(
                                                          lesson.id,
                                                          block.id,
                                                          languageBlock.id,
                                                          answerIndex,
                                                        )
                                                      }
                                                      aria-label="Remove alternative answer"
                                                      title="Remove alternative answer"
                                                      className="flex size-8 shrink-0 items-center justify-center rounded-md text-stone-500 transition hover:bg-red-950/50 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
                                                    >
                                                      <X
                                                        className="size-4"
                                                        aria-hidden="true"
                                                      />
                                                    </button>
                                                  )}
                                                </span>
                                                {answerValidationMessage && (
                                                  <span className="mt-1 block text-xs font-medium text-red-300">
                                                    {answerValidationMessage}
                                                  </span>
                                                )}
                                              </label>
                                            );
                                          },
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          addAcceptedAnswer(
                                            lesson.id,
                                            block.id,
                                            languageBlock.id,
                                            languageBlock.acceptedAnswers.length,
                                          )
                                        }
                                        title="Add alternative answer (Alt+Enter)"
                                        className="mt-2 flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-stone-400 transition hover:bg-stone-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
                                      >
                                        <Plus
                                          className="size-3.5"
                                          aria-hidden="true"
                                        />
                                        Add alternative
                                      </button>
                                    </div>
                                    {languageBlock.callout == null ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          addLanguageBlockCallout(
                                            lesson.id,
                                            block.id,
                                            languageBlock.id,
                                          )
                                        }
                                        className="group flex min-h-12 w-full items-center justify-center gap-2 border-t border-amber-300 bg-gradient-to-r from-amber-100 via-yellow-200 to-orange-100 px-3 py-3 text-sm font-bold text-amber-900 transition hover:from-amber-200 hover:via-yellow-300 hover:to-orange-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-amber-400"
                                      >
                                        <span className="flex size-7 items-center justify-center rounded-full bg-white/75 text-orange-600 shadow-sm transition group-hover:rotate-12 group-hover:scale-105">
                                          <Sun
                                            className="size-4"
                                            aria-hidden="true"
                                          />
                                        </span>
                                        Add context hint
                                      </button>
                                    ) : (
                                      <div className="flex min-h-14 w-full items-center gap-2.5 border-t border-amber-300 bg-gradient-to-r from-amber-100 via-yellow-200 to-orange-100 px-3 py-3 text-amber-950">
                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/75 text-orange-600 shadow-sm">
                                          <Sun
                                            className="size-4.5"
                                            aria-hidden="true"
                                          />
                                        </span>
                                        <label className="min-w-0 flex-1">
                                          <span className="sr-only">
                                            Spanish context
                                          </span>
                                          <input
                                            ref={(element) => {
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
                                            type="text"
                                            value={languageBlock.callout ?? ""}
                                            onChange={(event) =>
                                              updateLanguageBlockCallout(
                                                lesson.id,
                                                block.id,
                                                languageBlock.id,
                                                event.target.value,
                                              )
                                            }
                                            placeholder="Add hint or context note."
                                            className="w-full bg-transparent text-sm font-semibold italic outline-none placeholder:text-amber-700/55"
                                          />
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            updateLanguageBlockCallout(
                                              lesson.id,
                                              block.id,
                                              languageBlock.id,
                                              null,
                                            )
                                          }
                                          aria-label="Remove context hint"
                                          title="Remove context hint"
                                          className="flex size-7 shrink-0 items-center justify-center rounded-md text-amber-700 transition hover:bg-white/60 hover:text-red-600"
                                        >
                                          <X
                                            className="size-4"
                                            aria-hidden="true"
                                          />
                                        </button>
                                      </div>
                                    )}
                                      </>
                                    )}
                                  </div>
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
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-lesson-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cancelPendingLessonExit();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl">
            <h2
              id="unsaved-lesson-title"
              className="text-xl font-semibold tracking-tight"
            >
              Save changes to Lesson {pendingLessonExitIndex + 1}?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This lesson has unsaved changes. Save them before leaving, discard
              them, or return to editing.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={cancelPendingLessonExit}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={discardPendingLessonChanges}
                className="rounded-lg border border-red-200 bg-background px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-red-200"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => void savePendingLessonChanges()}
                disabled={savingLessonId === pendingLessonExit.id}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                {savingLessonId === pendingLessonExit.id
                  ? "Saving..."
                  : "Save and leave"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
