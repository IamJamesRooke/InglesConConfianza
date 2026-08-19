"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  FileText,
  GripVertical,
  Languages,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

import { MarkdownEditor } from "@/components/lesson-builder/markdown-editor";

type DropTarget = {
  lessonId: number;
  position: "before" | "after";
};

type Lesson = {
  id: number;
  name: string | null;
  blocks: LessonBlock[];
};

type ExplanationBlock = {
  id: number;
  type: "explanation";
  contentMarkdown: string;
};

type SentenceBlock = {
  id: number;
  type: "sentence";
  explainerText: string | null;
  answerFeedback: string | null;
  languageBlocks: LanguageBlock[];
};

type LanguageBlock = {
  id: number;
  spanish: string;
  callout: string | null;
  acceptedAnswers: string[];
};

type LessonBlock = ExplanationBlock | SentenceBlock;

export default function LessonBuilderPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [draggedLessonId, setDraggedLessonId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [openBlockPickerLessonId, setOpenBlockPickerLessonId] = useState<
    number | null
  >(null);
  const [collapsedLessons, setCollapsedLessons] = useState(
    () => new Set<number>(),
  );
  const [collapsedContentBlocks, setCollapsedContentBlocks] = useState(
    () => new Set<string>(),
  );
  const [collapsedLanguageBlocks, setCollapsedLanguageBlocks] = useState(
    () => new Set<string>(),
  );
  const languageBlockSpanishRefs = useRef(
    new Map<string, HTMLInputElement>(),
  );
  const acceptedAnswerRefs = useRef(new Map<string, HTMLInputElement>());
  const languageBlockCalloutRefs = useRef(new Map<string, HTMLInputElement>());
  const sentenceExplainerTextRefs = useRef(
    new Map<string, HTMLTextAreaElement>(),
  );
  const sentenceAnswerFeedbackRefs = useRef(
    new Map<string, HTMLTextAreaElement>(),
  );

  function createLesson() {
    setLessons((currentLessons) => {
      const nextLessonId =
        Math.max(0, ...currentLessons.map((lesson) => lesson.id)) + 1;

      return [
        ...currentLessons,
        { id: nextLessonId, name: null, blocks: [] },
      ];
    });
  }

  function renameLesson(lessonId: number, name: string) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? { ...lesson, name: name.trimStart() || null }
          : lesson,
      ),
    );
  }

  function deleteLesson(lessonId: number) {
    setLessons((currentLessons) =>
      currentLessons.filter((lesson) => lesson.id !== lessonId),
    );
    setOpenBlockPickerLessonId((currentLessonId) =>
      currentLessonId === lessonId ? null : currentLessonId,
    );
    setCollapsedLessons((currentLessonIds) => {
      const nextLessonIds = new Set(currentLessonIds);
      nextLessonIds.delete(lessonId);
      return nextLessonIds;
    });
  }

  function toggleLesson(lessonId: number) {
    setCollapsedLessons((currentLessonIds) => {
      const nextLessonIds = new Set(currentLessonIds);
      if (nextLessonIds.has(lessonId)) {
        nextLessonIds.delete(lessonId);
      } else {
        nextLessonIds.add(lessonId);
      }
      return nextLessonIds;
    });
  }

  function toggleContentBlock(lessonId: number, blockId: number) {
    const key = `${lessonId}-${blockId}`;
    setCollapsedContentBlocks((currentKeys) => {
      const nextKeys = new Set(currentKeys);
      if (nextKeys.has(key)) {
        nextKeys.delete(key);
      } else {
        nextKeys.add(key);
      }
      return nextKeys;
    });
  }

  function deleteContentBlock(lessonId: number, blockId: number) {
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

  function moveContentBlock(
    lessonId: number,
    blockId: number,
    direction: -1 | 1,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) => {
        if (lesson.id !== lessonId) {
          return lesson;
        }

        const currentIndex = lesson.blocks.findIndex(
          (block) => block.id === blockId,
        );
        const targetIndex = currentIndex + direction;

        if (
          currentIndex === -1 ||
          targetIndex < 0 ||
          targetIndex >= lesson.blocks.length
        ) {
          return lesson;
        }

        const blocks = [...lesson.blocks];
        [blocks[currentIndex], blocks[targetIndex]] = [
          blocks[targetIndex],
          blocks[currentIndex],
        ];
        return { ...lesson, blocks };
      }),
    );
  }

  function addExplanationBlock(lessonId: number) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) => {
        if (lesson.id !== lessonId) {
          return lesson;
        }

        const nextBlockId =
          Math.max(0, ...lesson.blocks.map((block) => block.id)) + 1;

        return {
          ...lesson,
          blocks: [
            ...lesson.blocks,
            {
              id: nextBlockId,
              type: "explanation",
              contentMarkdown: "",
            },
          ],
        };
      }),
    );
    setOpenBlockPickerLessonId(null);
  }

  function addSentenceBlock(lessonId: number) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) => {
        if (lesson.id !== lessonId) {
          return lesson;
        }

        const nextBlockId =
          Math.max(0, ...lesson.blocks.map((block) => block.id)) + 1;

        return {
          ...lesson,
          blocks: [
            ...lesson.blocks,
            {
              id: nextBlockId,
              type: "sentence",
              explainerText: null,
              answerFeedback: null,
              languageBlocks: [
                {
                  id: 1,
                  spanish: "",
                  callout: null,
                  acceptedAnswers: [""],
                },
              ],
            },
          ],
        };
      }),
    );
    setOpenBlockPickerLessonId(null);
  }

  function updateSentenceExplainerText(
    lessonId: number,
    sentenceBlockId: number,
    explainerText: string | null,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && block.type === "sentence"
                  ? { ...block, explainerText }
                  : block,
              ),
            }
          : lesson,
      ),
    );
  }

  function addSentenceExplainerText(lessonId: number, sentenceBlockId: number) {
    updateSentenceExplainerText(lessonId, sentenceBlockId, "");
    window.setTimeout(() => {
      sentenceExplainerTextRefs.current
        .get(`${lessonId}-${sentenceBlockId}`)
        ?.focus();
    }, 0);
  }

  function updateSentenceAnswerFeedback(
    lessonId: number,
    sentenceBlockId: number,
    answerFeedback: string | null,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && block.type === "sentence"
                  ? { ...block, answerFeedback }
                  : block,
              ),
            }
          : lesson,
      ),
    );
  }

  function addSentenceAnswerFeedback(
    lessonId: number,
    sentenceBlockId: number,
  ) {
    updateSentenceAnswerFeedback(lessonId, sentenceBlockId, "");
    window.setTimeout(() => {
      sentenceAnswerFeedbackRefs.current
        .get(`${lessonId}-${sentenceBlockId}`)
        ?.focus();
    }, 0);
  }

  function updateLanguageBlockCallout(
    lessonId: number,
    sentenceBlockId: number,
    languageBlockId: number,
    callout: string | null,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && block.type === "sentence"
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
    lessonId: number,
    sentenceBlockId: number,
    languageBlockId: number,
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
    lessonId: number,
    blockId: number,
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
    lessonId: number,
    sentenceBlockId: number,
    languageBlockId: number,
    value: string,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && block.type === "sentence"
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
    lessonId: number,
    sentenceBlockId: number,
    languageBlockId: number,
    answerIndex: number,
    value: string,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && block.type === "sentence"
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
    lessonId: number,
    sentenceBlockId: number,
    languageBlockId: number,
    answerIndex: number,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && block.type === "sentence"
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
    lessonId: number,
    sentenceBlockId: number,
    languageBlockId: number,
    answerIndex: number,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && block.type === "sentence"
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
    lessonId: number,
    sentenceBlockId: number,
    languageBlockId: number,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && block.type === "sentence"
                  ? {
                      ...block,
                      languageBlocks: [
                        ...block.languageBlocks,
                        {
                          id: languageBlockId,
                          spanish: "",
                          callout: null,
                          acceptedAnswers: [""],
                        },
                      ],
                    }
                  : block,
              ),
            }
          : lesson,
      ),
    );

    window.setTimeout(() => {
      languageBlockSpanishRefs.current
        .get(`${lessonId}-${sentenceBlockId}-${languageBlockId}`)
        ?.focus();
    }, 0);
  }

  function toggleLanguageBlock(
    lessonId: number,
    sentenceBlockId: number,
    languageBlockId: number,
  ) {
    const key = `${lessonId}-${sentenceBlockId}-${languageBlockId}`;
    setCollapsedLanguageBlocks((currentKeys) => {
      const nextKeys = new Set(currentKeys);
      if (nextKeys.has(key)) {
        nextKeys.delete(key);
      } else {
        nextKeys.add(key);
      }
      return nextKeys;
    });
  }

  function deleteLanguageBlock(
    lessonId: number,
    sentenceBlockId: number,
    languageBlockId: number,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && block.type === "sentence"
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

  function moveLanguageBlock(
    lessonId: number,
    sentenceBlockId: number,
    languageBlockId: number,
    direction: -1 | 1,
  ) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) => {
        if (lesson.id !== lessonId) {
          return lesson;
        }

        return {
          ...lesson,
          blocks: lesson.blocks.map((block) => {
            if (block.id !== sentenceBlockId || block.type !== "sentence") {
              return block;
            }

            const currentIndex = block.languageBlocks.findIndex(
              (languageBlock) => languageBlock.id === languageBlockId,
            );
            const targetIndex = currentIndex + direction;

            if (
              currentIndex === -1 ||
              targetIndex < 0 ||
              targetIndex >= block.languageBlocks.length
            ) {
              return block;
            }

            const languageBlocks = [...block.languageBlocks];
            [languageBlocks[currentIndex], languageBlocks[targetIndex]] = [
              languageBlocks[targetIndex],
              languageBlocks[currentIndex],
            ];
            return { ...block, languageBlocks };
          }),
        };
      }),
    );
  }

  function updateDropTarget(
    event: DragEvent<HTMLElement>,
    lessonId: number,
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

  function moveLesson(target: DropTarget) {
    if (draggedLessonId === null || draggedLessonId === target.lessonId) {
      return;
    }

    setLessons((currentLessons) => {
      const reorderedLessons = currentLessons.filter(
        (lesson) => lesson.id !== draggedLessonId,
      );
      const targetIndex = reorderedLessons.findIndex(
        (lesson) => lesson.id === target.lessonId,
      );
      const draggedLesson = currentLessons.find(
        (lesson) => lesson.id === draggedLessonId,
      );

      if (!draggedLesson || targetIndex === -1) {
        return currentLessons;
      }

      const insertionIndex =
        target.position === "after" ? targetIndex + 1 : targetIndex;

      reorderedLessons.splice(insertionIndex, 0, draggedLesson);
      return reorderedLessons;
    });
  }

  function finishDragging() {
    setDraggedLessonId(null);
    setDropTarget(null);
  }

  return (
    <main className="flex-1 bg-stone-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {lessons.map((lesson, lessonIndex) => {
          const lessonNumber = lessonIndex + 1;
          const isDragging = draggedLessonId === lesson.id;
          const isLessonCollapsed = collapsedLessons.has(lesson.id);
          const dropPosition =
            dropTarget && dropTarget.lessonId === lesson.id
              ? dropTarget.position
              : null;

          return (
            <section
              key={lesson.id}
              aria-label={`Lesson ${lessonNumber}`}
              onDragOver={(event) => updateDropTarget(event, lesson.id)}
              onDrop={(event) => {
                event.preventDefault();
                if (dropTarget) {
                  moveLesson(dropTarget);
                }
                finishDragging();
              }}
              className={`relative w-full overflow-hidden rounded-2xl border bg-white shadow-md transition ${
                isLessonCollapsed ? "" : "min-h-72"
              } ${
                isDragging
                  ? "border-violet-300 opacity-45 shadow-none"
                  : "border-stone-300 shadow-stone-200/70"
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

              <header className="flex items-center gap-4 border-b border-stone-200 bg-stone-100 px-6 py-4">
                <h2 className="shrink-0 text-xl font-semibold tracking-tight text-stone-900">
                  Lesson {lessonNumber}
                </h2>
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
                  onClick={() => toggleLesson(lesson.id)}
                  aria-label={`${isLessonCollapsed ? "Expand" : "Collapse"} lesson ${lessonNumber}`}
                  title={isLessonCollapsed ? "Expand lesson" : "Collapse lesson"}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-200 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-200"
                >
                  {isLessonCollapsed ? (
                    <ChevronDown className="size-4" aria-hidden="true" />
                  ) : (
                    <ChevronUp className="size-4" aria-hidden="true" />
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
                  draggable
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
                  title="Drag to reorder"
                  className="flex shrink-0 cursor-grab items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-stone-500 transition hover:bg-stone-200 hover:text-stone-700 active:cursor-grabbing"
                >
                  <span className="hidden sm:inline">Drag to reorder</span>
                  <GripVertical className="size-5" aria-hidden="true" />
                </button>
              </header>

              {!isLessonCollapsed && (
              <div className="space-y-4 p-6">
                {lesson.blocks.map((block, blockIndex) => {
                  const contentBlockKey = `${lesson.id}-${block.id}`;
                  const isContentBlockCollapsed =
                    collapsedContentBlocks.has(contentBlockKey);

                  return (
                    <div
                      key={block.id}
                      className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
                    >
                    {block.type === "explanation" ? (
                      <>
                        <div className="flex items-center justify-between gap-3 border-b border-stone-200 bg-stone-50 px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                              <FileText className="size-4" aria-hidden="true" />
                            </span>
                            <p className="font-semibold text-stone-900">
                              Explanation
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                moveContentBlock(lesson.id, block.id, -1)
                              }
                              disabled={blockIndex === 0}
                              aria-label="Move explanation up"
                              title="Move up"
                              className="flex size-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-25"
                            >
                              <ArrowUp className="size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                moveContentBlock(lesson.id, block.id, 1)
                              }
                              disabled={blockIndex === lesson.blocks.length - 1}
                              aria-label="Move explanation down"
                              title="Move down"
                              className="flex size-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-25"
                            >
                              <ArrowDown className="size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                toggleContentBlock(lesson.id, block.id)
                              }
                              aria-label={`${isContentBlockCollapsed ? "Expand" : "Collapse"} explanation`}
                              title={isContentBlockCollapsed ? "Expand" : "Collapse"}
                              className="flex size-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200"
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
                        <div className="flex items-center justify-between gap-3 border-b border-stone-200 bg-stone-50 px-5 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                              <Languages className="size-4" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <span className="sr-only">Sentence block</span>
                              <div className="space-y-0.5 text-sm">
                                <p className="truncate font-medium text-stone-700">
                                  {block.languageBlocks
                                    .map((languageBlock) =>
                                      languageBlock.spanish.trim(),
                                    )
                                    .filter(Boolean)
                                    .join(" ") || "No Spanish text yet"}
                                </p>
                                <p className="truncate text-stone-500">
                                  {block.languageBlocks
                                    .map((languageBlock) =>
                                      languageBlock.acceptedAnswers[0]?.trim(),
                                    )
                                    .filter(Boolean)
                                    .join(" ") || "No English answer yet"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                moveContentBlock(lesson.id, block.id, -1)
                              }
                              disabled={blockIndex === 0}
                              aria-label="Move sentence up"
                              title="Move up"
                              className="flex size-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-25"
                            >
                              <ArrowUp className="size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                moveContentBlock(lesson.id, block.id, 1)
                              }
                              disabled={blockIndex === lesson.blocks.length - 1}
                              aria-label="Move sentence down"
                              title="Move down"
                              className="flex size-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-25"
                            >
                              <ArrowDown className="size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                toggleContentBlock(lesson.id, block.id)
                              }
                              aria-label={`${isContentBlockCollapsed ? "Expand" : "Collapse"} sentence`}
                              title={isContentBlockCollapsed ? "Expand" : "Collapse"}
                              className="flex size-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200"
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
                        <div className="p-6">
                          {block.explainerText == null ? (
                            <button
                              type="button"
                              onClick={() =>
                                addSentenceExplainerText(lesson.id, block.id)
                              }
                              className="mb-4 rounded-lg border border-dashed border-stone-300 px-3 py-2 text-sm font-medium text-stone-500 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                            >
                              Add explainer text
                            </button>
                          ) : (
                            <div className="mb-5 rounded-xl border border-violet-200 bg-violet-50/60 p-4">
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <label
                                  htmlFor={`sentence-explainer-${lesson.id}-${block.id}`}
                                  className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700"
                                >
                                  Explainer text
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSentenceExplainerText(
                                      lesson.id,
                                      block.id,
                                      null,
                                    )
                                  }
                                  aria-label="Remove explainer text"
                                  title="Remove explainer text"
                                  className="flex size-7 items-center justify-center rounded-md text-violet-400 transition hover:bg-violet-100 hover:text-violet-700"
                                >
                                  <X className="size-4" aria-hidden="true" />
                                </button>
                              </div>
                              <textarea
                                ref={(element) => {
                                  const key = `${lesson.id}-${block.id}`;
                                  if (element) {
                                    sentenceExplainerTextRefs.current.set(
                                      key,
                                      element,
                                    );
                                  } else {
                                    sentenceExplainerTextRefs.current.delete(key);
                                  }
                                }}
                                id={`sentence-explainer-${lesson.id}-${block.id}`}
                                value={block.explainerText ?? ""}
                                onChange={(event) =>
                                  updateSentenceExplainerText(
                                    lesson.id,
                                    block.id,
                                    event.target.value,
                                  )
                                }
                                rows={2}
                                placeholder="Add instructions or context for this question."
                                className="block w-full resize-y bg-transparent text-sm leading-6 text-stone-800 outline-none placeholder:text-stone-400"
                              />
                            </div>
                          )}
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {block.languageBlocks.map(
                              (languageBlock, languageBlockIndex) => {
                                const isLastLanguageBlock =
                                  languageBlockIndex ===
                                  block.languageBlocks.length - 1;
                                const nextLanguageBlockId =
                                  Math.max(
                                    0,
                                    ...block.languageBlocks.map(
                                      (currentBlock) => currentBlock.id,
                                    ),
                                  ) + 1;
                                const languageBlockKey = `${lesson.id}-${block.id}-${languageBlock.id}`;
                                const isLanguageBlockCollapsed =
                                  collapsedLanguageBlocks.has(languageBlockKey);

                                return (
                                  <div
                                    key={languageBlock.id}
                                    className="overflow-hidden rounded-xl border border-stone-300 bg-white shadow-md shadow-stone-200/60"
                                  >
                                    <div className="flex items-center justify-between gap-2 border-b border-stone-200 bg-stone-100 px-2 py-1.5">
                                      <span className="px-1 text-xs font-semibold text-stone-500">
                                        Block {languageBlockIndex + 1}
                                      </span>
                                      <div className="flex items-center gap-0.5">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            moveLanguageBlock(
                                              lesson.id,
                                              block.id,
                                              languageBlock.id,
                                              -1,
                                            )
                                          }
                                          disabled={languageBlockIndex === 0}
                                          aria-label={`Move language block ${languageBlockIndex + 1} left`}
                                          title="Move left"
                                          className="flex size-7 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-25"
                                        >
                                          <ArrowLeft className="size-3.5" aria-hidden="true" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            moveLanguageBlock(
                                              lesson.id,
                                              block.id,
                                              languageBlock.id,
                                              1,
                                            )
                                          }
                                          disabled={isLastLanguageBlock}
                                          aria-label={`Move language block ${languageBlockIndex + 1} right`}
                                          title="Move right"
                                          className="flex size-7 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-25"
                                        >
                                          <ArrowRight className="size-3.5" aria-hidden="true" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggleLanguageBlock(
                                              lesson.id,
                                              block.id,
                                              languageBlock.id,
                                            )
                                          }
                                          aria-label={`${isLanguageBlockCollapsed ? "Expand" : "Collapse"} language block ${languageBlockIndex + 1}`}
                                          title={isLanguageBlockCollapsed ? "Expand" : "Collapse"}
                                          className="flex size-7 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200"
                                        >
                                          {isLanguageBlockCollapsed ? (
                                            <ChevronDown className="size-3.5" aria-hidden="true" />
                                          ) : (
                                            <ChevronUp className="size-3.5" aria-hidden="true" />
                                          )}
                                        </button>
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
                                      <div className="px-4 py-3 text-sm text-stone-600">
                                        <span className="font-medium text-stone-800">
                                          {languageBlock.spanish || "Spanish prompt"}
                                        </span>
                                        <span className="mx-2 text-stone-300">→</span>
                                        <span>
                                          {languageBlock.acceptedAnswers[0] ||
                                            "English answer"}
                                        </span>
                                      </div>
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
                                          className="rounded-md px-2 py-1 text-xs font-medium text-amber-600 transition hover:bg-amber-50 hover:text-amber-700"
                                        >
                                          Add context
                                        </button>
                                      ) : (
                                        <div className="flex w-full items-center rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-800">
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
                                              className="w-full bg-transparent text-center text-sm font-medium italic outline-none placeholder:text-amber-500/60"
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
                                            aria-label="Remove context"
                                            title="Remove context"
                                            className="flex size-6 shrink-0 items-center justify-center rounded text-amber-500 transition hover:bg-amber-100 hover:text-amber-700"
                                          >
                                            <X
                                              className="size-3.5"
                                              aria-hidden="true"
                                            />
                                          </button>
                                        </div>
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
                                                            nextLanguageBlockId,
                                                          );
                                                        } else if (
                                                          nextLanguageBlock
                                                        ) {
                                                          languageBlockSpanishRefs.current
                                                            .get(
                                                              `${lesson.id}-${block.id}-${nextLanguageBlock.id}`,
                                                            )
                                                            ?.focus();
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
                                  Math.max(
                                    0,
                                    ...block.languageBlocks.map(
                                      (languageBlock) => languageBlock.id,
                                    ),
                                  ) + 1,
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
                          {block.answerFeedback == null ? (
                            <button
                              type="button"
                              onClick={() =>
                                addSentenceAnswerFeedback(lesson.id, block.id)
                              }
                              className="mt-4 rounded-lg border border-dashed border-stone-300 px-3 py-2 text-sm font-medium text-stone-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              Add answer feedback
                            </button>
                          ) : (
                            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <label
                                  htmlFor={`sentence-feedback-${lesson.id}-${block.id}`}
                                  className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700"
                                >
                                  Answer feedback
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSentenceAnswerFeedback(
                                      lesson.id,
                                      block.id,
                                      null,
                                    )
                                  }
                                  aria-label="Remove answer feedback"
                                  title="Remove answer feedback"
                                  className="flex size-7 items-center justify-center rounded-md text-emerald-500 transition hover:bg-emerald-100 hover:text-emerald-700"
                                >
                                  <X className="size-4" aria-hidden="true" />
                                </button>
                              </div>
                              <textarea
                                ref={(element) => {
                                  const key = `${lesson.id}-${block.id}`;
                                  if (element) {
                                    sentenceAnswerFeedbackRefs.current.set(
                                      key,
                                      element,
                                    );
                                  } else {
                                    sentenceAnswerFeedbackRefs.current.delete(
                                      key,
                                    );
                                  }
                                }}
                                id={`sentence-feedback-${lesson.id}-${block.id}`}
                                value={block.answerFeedback ?? ""}
                                onChange={(event) =>
                                  updateSentenceAnswerFeedback(
                                    lesson.id,
                                    block.id,
                                    event.target.value,
                                  )
                                }
                                rows={2}
                                placeholder="Explain the answer or reinforce the key idea."
                                className="block w-full resize-y bg-transparent text-sm leading-6 text-stone-800 outline-none placeholder:text-stone-400"
                              />
                            </div>
                          )}
                        </div>
                        )}
                      </>
                    )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() =>
                    setOpenBlockPickerLessonId((currentLessonId) =>
                      currentLessonId === lesson.id ? null : lesson.id,
                    )
                  }
                  aria-expanded={openBlockPickerLessonId === lesson.id}
                  className="group flex min-h-20 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 px-4 font-medium text-stone-500 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add content block
                </button>

                {openBlockPickerLessonId === lesson.id && (
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                      Choose a block type
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => addExplanationBlock(lesson.id)}
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
                        onClick={() => addSentenceBlock(lesson.id)}
                        className="group flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 transition group-hover:bg-blue-100">
                          <Languages className="size-5" aria-hidden="true" />
                        </span>
                        <span>
                          <span className="block font-semibold text-stone-900">
                            Sentence
                          </span>
                          <span className="mt-1 block text-sm leading-5 text-stone-500">
                            Build a prompt with learner answer blocks.
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              )}
            </section>
          );
        })}

        <button
          type="button"
          onClick={createLesson}
          className="group flex min-h-40 w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 bg-white px-6 text-lg font-semibold text-stone-700 shadow-sm transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-stone-100 transition group-hover:bg-violet-100">
            <Plus className="size-5" aria-hidden="true" />
          </span>
          Create new lesson
        </button>
      </div>
    </main>
  );
}
