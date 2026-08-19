"use client";

import { FileText, GripVertical, Languages, Plus, Trash2 } from "lucide-react";
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
  languageBlocks: LanguageBlock[];
};

type LanguageBlock = {
  id: number;
  spanish: string;
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
  const languageBlockSpanishRefs = useRef(
    new Map<string, HTMLInputElement>(),
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
              languageBlocks: [
                {
                  id: 1,
                  spanish: "",
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

  function updateLanguageBlock(
    lessonId: number,
    sentenceBlockId: number,
    languageBlockId: number,
    field: "spanish" | "answer",
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
                            ? field === "spanish"
                              ? { ...languageBlock, spanish: value }
                              : {
                                  ...languageBlock,
                                  acceptedAnswers: [value],
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
              className={`relative min-h-72 w-full overflow-hidden rounded-2xl border bg-white shadow-md transition ${
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

              <div className="space-y-4 p-6">
                {lesson.blocks.map((block) => (
                  <div
                    key={block.id}
                    className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
                  >
                    {block.type === "explanation" ? (
                      <>
                        <div className="flex items-center gap-3 border-b border-stone-200 bg-stone-50 px-5 py-3">
                          <span className="flex size-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                            <FileText className="size-4" aria-hidden="true" />
                          </span>
                          <p className="font-semibold text-stone-900">
                            Explanation
                          </p>
                        </div>
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
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 border-b border-stone-200 bg-stone-50 px-5 py-3">
                          <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                            <Languages className="size-4" aria-hidden="true" />
                          </span>
                          <p className="font-semibold text-stone-900">
                            Sentence
                          </p>
                        </div>
                        <div className="p-6">
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

                                return (
                                  <div
                                    key={languageBlock.id}
                                    className="overflow-hidden rounded-xl border border-stone-300 bg-white shadow-md shadow-stone-200/60"
                                  >
                                    <label className="flex min-h-28 items-center justify-center px-4 py-6">
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
                                          updateLanguageBlock(
                                            lesson.id,
                                            block.id,
                                            languageBlock.id,
                                            "spanish",
                                            event.target.value,
                                          )
                                        }
                                        placeholder="Spanish prompt"
                                        className="w-full bg-transparent text-center text-xl font-semibold tracking-tight text-stone-900 outline-none placeholder:text-stone-300"
                                      />
                                    </label>
                                    <label className="flex min-h-14 items-center justify-center border-t border-stone-800 bg-stone-900 px-4 py-3">
                                      <span className="sr-only">
                                        English answer
                                      </span>
                                      <input
                                        type="text"
                                        value={
                                          languageBlock.acceptedAnswers[0] ?? ""
                                        }
                                        onChange={(event) =>
                                          updateLanguageBlock(
                                            lesson.id,
                                            block.id,
                                            languageBlock.id,
                                            "answer",
                                            event.target.value,
                                          )
                                        }
                                        onKeyDown={(event) => {
                                          if (
                                            event.key === "Tab" &&
                                            !event.shiftKey &&
                                            isLastLanguageBlock
                                          ) {
                                            event.preventDefault();
                                            addLanguageBlock(
                                              lesson.id,
                                              block.id,
                                              nextLanguageBlockId,
                                            );
                                          }
                                        }}
                                        placeholder="English answer"
                                        className="w-full bg-transparent text-center text-sm font-semibold text-white outline-none placeholder:text-stone-500"
                                      />
                                    </label>
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
                        </div>
                      </>
                    )}
                  </div>
                ))}

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
