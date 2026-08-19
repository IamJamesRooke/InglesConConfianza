"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  GripVertical,
  Languages,
  Lightbulb,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";

import { MarkdownEditor } from "@/components/lesson-builder/markdown-editor";

type DropTarget = {
  lessonId: string;
  position: "before" | "after";
};

type Lesson = {
  id: string;
  name: string | null;
  blocks: LessonBlock[];
};

type ExplanationBlock = {
  id: string;
  type: "explanation";
  contentMarkdown: string;
};

type SentenceBlock = {
  id: string;
  type: "sentence";
  promptLabel: string;
  promptText: string;
  helperText: string;
  answerFeedback: string | null;
  conceptLinks: ConceptLink[];
  languageBlocks: LanguageBlock[];
};

type LanguageBlock = {
  id: string;
  spanish: string;
  callout: string | null;
  acceptedAnswers: string[];
  conceptLinks: ConceptLink[];
};

type LessonBlock = ExplanationBlock | SentenceBlock;

type LessonFile = {
  version: 1;
  lessons: Lesson[];
};

type ConceptRole =
  | "primary"
  | "introduced"
  | "reinforced"
  | "required"
  | "incidental";

type ConceptType =
  | "mapping"
  | "vocabulary"
  | "grammar_pattern"
  | "morpheme"
  | "concept_group";

type MappingDirection =
  | "es_to_en"
  | "en_to_es"
  | "bidirectional"
  | "not_directional";

type ConceptLink = {
  id: string;
  label: string;
  type: ConceptType;
  direction: MappingDirection;
  sourceText: string;
  targetText: string;
  contextLabel: string;
  role: ConceptRole;
};

const conceptRoleOptions = [
  { value: "primary", label: "Primary" },
  { value: "introduced", label: "Introduced" },
  { value: "reinforced", label: "Reinforced" },
  { value: "required", label: "Required" },
  { value: "incidental", label: "Incidental" },
] satisfies Array<{ value: ConceptRole; label: string }>;

const conceptTypeOptions = [
  { value: "mapping", label: "Mapping" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "grammar_pattern", label: "Grammar pattern" },
  { value: "morpheme", label: "Morpheme" },
  { value: "concept_group", label: "Concept group" },
] satisfies Array<{ value: ConceptType; label: string }>;

const mappingDirectionOptions = [
  { value: "es_to_en", label: "Spanish → English" },
  { value: "en_to_es", label: "English → Spanish" },
  { value: "bidirectional", label: "Both directions" },
  { value: "not_directional", label: "Not directional" },
] satisfies Array<{ value: MappingDirection; label: string }>;

function normalizeAnswer(answer: string) {
  return answer.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function createConceptLink(): ConceptLink {
  return {
    id: createId("concept_link"),
    label: "",
    type: "mapping",
    direction: "es_to_en",
    sourceText: "",
    targetText: "",
    contextLabel: "",
    role: "introduced",
  };
}

function normalizeConceptLink(conceptLink: Partial<ConceptLink>): ConceptLink {
  return {
    id: conceptLink.id ?? createId("concept_link"),
    label: conceptLink.label ?? "",
    type: conceptLink.type ?? "mapping",
    direction: conceptLink.direction ?? "es_to_en",
    sourceText: conceptLink.sourceText ?? "",
    targetText: conceptLink.targetText ?? "",
    contextLabel: conceptLink.contextLabel ?? "",
    role: conceptLink.role ?? "introduced",
  };
}

function normalizeLessons(lessons: Lesson[]) {
  return lessons.map((lesson) => ({
    ...lesson,
    blocks: lesson.blocks.map((block) => {
      if (block.type === "explanation") {
        return block;
      }

      return {
        ...block,
        conceptLinks: (block.conceptLinks ?? []).map(normalizeConceptLink),
        languageBlocks: block.languageBlocks.map((languageBlock) => ({
          ...languageBlock,
          conceptLinks: (languageBlock.conceptLinks ?? []).map(
            normalizeConceptLink,
          ),
        })),
      };
    }),
  }));
}

function getAnswerValidationMessage(
  answers: string[],
  answerIndex: number,
) {
  const normalizedAnswer = normalizeAnswer(answers[answerIndex] ?? "");

  if (!normalizedAnswer) {
    return answerIndex === 0
      ? "Primary English answer is required."
      : "Complete or remove this alternative.";
  }

  const duplicateCount = answers.filter(
    (answer) => normalizeAnswer(answer) === normalizedAnswer,
  ).length;

  return duplicateCount > 1 ? "This answer is duplicated." : null;
}

function getSentenceValidationIssueCount(sentence: SentenceBlock) {
  if (sentence.languageBlocks.length === 0) {
    return 1;
  }

  return sentence.languageBlocks.reduce((issueCount, languageBlock) => {
    const spanishIssueCount = languageBlock.spanish.trim() ? 0 : 1;
    const answerIssueCount = languageBlock.acceptedAnswers.reduce(
      (answerIssues, _, answerIndex) =>
        answerIssues +
        (getAnswerValidationMessage(
          languageBlock.acceptedAnswers,
          answerIndex,
        )
          ? 1
          : 0),
      0,
    );

    return issueCount + spanishIssueCount + answerIssueCount;
  }, 0);
}

function SentenceLearnerPreview({ sentence }: { sentence: SentenceBlock }) {
  const [answers, setAnswers] = useState<string[]>(() =>
    sentence.languageBlocks.map(() => ""),
  );
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);
  const [helpedBlockIndex, setHelpedBlockIndex] = useState<number | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const helpTimerRef = useRef<number | null>(null);
  const hasFeedback = Boolean(sentence.answerFeedback?.trim());
  const correctAnswers = sentence.languageBlocks.map(
    (languageBlock, languageBlockIndex) => {
      const currentAnswer = normalizeAnswer(answers[languageBlockIndex] ?? "");
      return (
        Boolean(currentAnswer) &&
        languageBlock.acceptedAnswers.some(
          (acceptedAnswer) => normalizeAnswer(acceptedAnswer) === currentAnswer,
        )
      );
    },
  );
  const isComplete =
    helpedBlockIndex === null &&
    sentence.languageBlocks.length > 0 &&
    correctAnswers.every(Boolean);

  const clearHelpTimer = useCallback(() => {
    if (helpTimerRef.current !== null) {
      window.clearTimeout(helpTimerRef.current);
      helpTimerRef.current = null;
    }
  }, []);

  const showHelp = useCallback((languageBlockIndex: number) => {
    clearHelpTimer();
    setAnswers((currentAnswers) => {
      const nextAnswers = [...currentAnswers];
      if (
        helpedBlockIndex !== null &&
        helpedBlockIndex !== languageBlockIndex
      ) {
        nextAnswers[helpedBlockIndex] = "";
      }
      nextAnswers[languageBlockIndex] =
        sentence.languageBlocks[languageBlockIndex]?.acceptedAnswers[0] ?? "";
      return nextAnswers;
    });
    setHelpedBlockIndex(languageBlockIndex);
    setIsFeedbackVisible(false);

    helpTimerRef.current = window.setTimeout(() => {
      setAnswers((currentAnswers) => {
        const nextAnswers = [...currentAnswers];
        nextAnswers[languageBlockIndex] = "";
        return nextAnswers;
      });
      setHelpedBlockIndex(null);
      helpTimerRef.current = null;
      inputRefs.current[languageBlockIndex]?.focus();
    }, 2500);
  }, [clearHelpTimer, helpedBlockIndex, sentence.languageBlocks]);

  useEffect(() => clearHelpTimer, [clearHelpTimer]);

  function updatePreviewAnswer(answer: string, languageBlockIndex: number) {
    if (helpedBlockIndex === languageBlockIndex) {
      clearHelpTimer();
      setHelpedBlockIndex(null);
    }

    const nextAnswers = [...answers];
    nextAnswers[languageBlockIndex] = answer;
    setAnswers(nextAnswers);

    const languageBlock = sentence.languageBlocks[languageBlockIndex];
    const normalizedAnswer = normalizeAnswer(answer);
    const isCorrect =
      Boolean(normalizedAnswer) &&
      languageBlock.acceptedAnswers.some(
        (acceptedAnswer) => normalizeAnswer(acceptedAnswer) === normalizedAnswer,
      );

    if (isCorrect && languageBlockIndex < sentence.languageBlocks.length - 1) {
      window.setTimeout(
        () => inputRefs.current[languageBlockIndex + 1]?.focus(),
        0,
      );
    }

    const allAnswersCorrect = sentence.languageBlocks.every(
      (currentBlock, currentBlockIndex) => {
        const currentAnswer = normalizeAnswer(
          nextAnswers[currentBlockIndex] ?? "",
        );
        return (
          Boolean(currentAnswer) &&
          currentBlock.acceptedAnswers.some(
            (acceptedAnswer) =>
              normalizeAnswer(acceptedAnswer) === currentAnswer,
          )
        );
      },
    );

    if (allAnswersCorrect && hasFeedback) {
      setIsFeedbackVisible(true);
    } else if (!allAnswersCorrect) {
      setIsFeedbackVisible(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-[var(--surface-sunken)] p-5 shadow-sm">
      {sentence.promptLabel.trim() && (
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {sentence.promptLabel}
        </p>
      )}
      {sentence.promptText?.trim() && (
        <h3 className="mt-2 whitespace-pre-wrap text-3xl font-semibold leading-tight text-foreground">
          {sentence.promptText}
        </h3>
      )}

      {sentence.languageBlocks.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {sentence.languageBlocks.map((languageBlock, languageBlockIndex) => (
            <div key={languageBlock.id}>
              <span className="mb-2 block text-center text-lg font-bold text-stone-800">
                {languageBlock.spanish || "Spanish prompt"}
              </span>
              {languageBlock.callout?.trim() && (
                <span className="mb-2 block text-center text-sm font-medium italic text-amber-700">
                  {languageBlock.callout}
                </span>
              )}
              <input
                ref={(element) => {
                  inputRefs.current[languageBlockIndex] = element;
                }}
                type="text"
                value={answers[languageBlockIndex] ?? ""}
                onChange={(event) =>
                  updatePreviewAnswer(event.target.value, languageBlockIndex)
                }
                onKeyDown={(event) => {
                  if (event.altKey && event.key.toLowerCase() === "h") {
                    event.preventDefault();
                    showHelp(languageBlockIndex);
                  }
                }}
                aria-label={`Traducción de ${languageBlock.spanish || `bloque ${languageBlockIndex + 1}`}`}
                autoComplete="off"
                className={`w-full rounded-xl border px-5 py-4 text-center text-xl outline-none transition-colors focus:ring-2 focus:ring-stone-400 ${
                  correctAnswers[languageBlockIndex] &&
                  helpedBlockIndex !== languageBlockIndex
                    ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                    : helpedBlockIndex === languageBlockIndex
                      ? "border-amber-300 bg-amber-50 text-stone-500 italic"
                      : "border-stone-300 bg-white text-stone-950"
                }`}
              />
              <div className="mt-1.5 flex min-h-7 items-start justify-between gap-2">
                <span aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => showHelp(languageBlockIndex)}
                  aria-label={`Mostrar pista para ${languageBlock.spanish || `bloque ${languageBlockIndex + 1}`}`}
                  title="Mostrar pista"
                  className={`flex size-7 shrink-0 items-center justify-center rounded-md transition ${
                    helpedBlockIndex === languageBlockIndex
                      ? "bg-amber-100 text-amber-700"
                      : "text-stone-400 hover:bg-white hover:text-amber-600"
                  }`}
                >
                  <Lightbulb className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-red-300 bg-white px-4 py-6 text-center text-sm font-medium text-red-600">
          Add a language block to preview this sentence.
        </p>
      )}

      {sentence.helperText?.trim() && (
        <p className="mt-5 text-sm text-stone-500">{sentence.helperText}</p>
      )}

      {isComplete && (
        <p className="mt-4 text-sm font-semibold text-emerald-700" role="status">
          ¡Correcto!
        </p>
      )}

      {hasFeedback && isFeedbackVisible && (
        <div className="mt-4 whitespace-pre-wrap rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-stone-700">
          {sentence.answerFeedback}
        </div>
      )}
    </div>
  );
}

export default function LessonBuilderPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [openBlockPickerLessonId, setOpenBlockPickerLessonId] = useState<
    string | null
  >(null);
  const [collapsedLessons, setCollapsedLessons] = useState(
    () => new Set<string>(),
  );
  const [collapsedContentBlocks, setCollapsedContentBlocks] = useState(
    () => new Set<string>(),
  );
  const [collapsedLanguageBlocks, setCollapsedLanguageBlocks] = useState(
    () => new Set<string>(),
  );
  const [previewSentenceBlocks, setPreviewSentenceBlocks] = useState(
    () => new Set<string>(),
  );
  const languageBlockSpanishRefs = useRef(
    new Map<string, HTMLInputElement>(),
  );
  const acceptedAnswerRefs = useRef(new Map<string, HTMLInputElement>());
  const languageBlockCalloutRefs = useRef(new Map<string, HTMLInputElement>());
  const sentenceAnswerFeedbackRefs = useRef(
    new Map<string, HTMLTextAreaElement>(),
  );
  const savedLessonsJsonRef = useRef(JSON.stringify([]));

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

  async function saveLessons() {
    setSaveStatus("saving");

    try {
      const lessonFile: LessonFile = { version: 1, lessons };
      const response = await fetch("/api/lesson-builder/lessons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lessonFile),
      });

      if (!response.ok) {
        throw new Error("Unable to save lessons.");
      }

      savedLessonsJsonRef.current = JSON.stringify(lessons);
      setIsDirty(false);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  function createLesson() {
    setLessons((currentLessons) => [
      ...currentLessons,
      { id: createId("lesson"), name: null, blocks: [] },
    ]);
  }

  function renameLesson(lessonId: string, name: string) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? { ...lesson, name: name.trimStart() || null }
          : lesson,
      ),
    );
  }

  function deleteLesson(lessonId: string) {
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

  function toggleLesson(lessonId: string) {
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

  function toggleContentBlock(lessonId: string, blockId: string) {
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

  function toggleSentencePreview(lessonId: string, sentenceBlockId: string) {
    const key = `${lessonId}-${sentenceBlockId}`;
    setPreviewSentenceBlocks((currentKeys) => {
      const nextKeys = new Set(currentKeys);
      if (nextKeys.has(key)) {
        nextKeys.delete(key);
      } else {
        nextKeys.add(key);
      }
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

  function moveContentBlock(
    lessonId: string,
    blockId: string,
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

  function addExplanationBlock(lessonId: string) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) => {
        if (lesson.id !== lessonId) {
          return lesson;
        }

        return {
          ...lesson,
          blocks: [
            ...lesson.blocks,
            {
              id: createId("block"),
              type: "explanation",
              contentMarkdown: "",
            },
          ],
        };
      }),
    );
    setOpenBlockPickerLessonId(null);
  }

  function addSentenceBlock(lessonId: string) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) => {
        if (lesson.id !== lessonId) {
          return lesson;
        }

        return {
          ...lesson,
          blocks: [
            ...lesson.blocks,
            {
              id: createId("block"),
              type: "sentence",
              promptLabel: "",
              promptText: "",
              helperText: "",
              answerFeedback: null,
              conceptLinks: [],
              languageBlocks: [
                {
                  id: createId("lang"),
                  spanish: "",
                  callout: null,
                  acceptedAnswers: [""],
                  conceptLinks: [],
                },
              ],
            },
          ],
        };
      }),
    );
    setOpenBlockPickerLessonId(null);
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
                block.id === sentenceBlockId && block.type === "sentence"
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
                block.id === sentenceBlockId && block.type === "sentence"
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
                block.id === sentenceBlockId && block.type === "sentence"
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
    lessonId: string,
    sentenceBlockId: string,
  ) {
    updateSentenceAnswerFeedback(lessonId, sentenceBlockId, "");
    window.setTimeout(() => {
      sentenceAnswerFeedbackRefs.current
        .get(`${lessonId}-${sentenceBlockId}`)
        ?.focus();
    }, 0);
  }

  function addSentenceConceptLink(lessonId: string, sentenceBlockId: string) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === sentenceBlockId && block.type === "sentence"
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
                block.id === sentenceBlockId && block.type === "sentence"
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
                block.id === sentenceBlockId && block.type === "sentence"
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

  function addLanguageBlockConceptLink(
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
                block.id === sentenceBlockId && block.type === "sentence"
                  ? {
                      ...block,
                      languageBlocks: block.languageBlocks.map(
                        (languageBlock) =>
                          languageBlock.id === languageBlockId
                            ? {
                                ...languageBlock,
                                conceptLinks: [
                                  ...languageBlock.conceptLinks,
                                  createConceptLink(),
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
  }

  function updateLanguageBlockConceptLink(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
    conceptLinkId: string,
    updates: Partial<Omit<ConceptLink, "id">>,
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
                                conceptLinks: languageBlock.conceptLinks.map(
                                  (conceptLink) =>
                                    conceptLink.id === conceptLinkId
                                      ? { ...conceptLink, ...updates }
                                      : conceptLink,
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

  function removeLanguageBlockConceptLink(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
    conceptLinkId: string,
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
                                conceptLinks:
                                  languageBlock.conceptLinks.filter(
                                    (conceptLink) =>
                                      conceptLink.id !== conceptLinkId,
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

    window.setTimeout(() => {
      languageBlockSpanishRefs.current
        .get(`${lessonId}-${sentenceBlockId}-${languageBlockId}`)
        ?.focus();
    }, 0);
  }

  function toggleLanguageBlock(
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
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
    lessonId: string,
    sentenceBlockId: string,
    languageBlockId: string,
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
    <main className="flex-1 bg-background px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Lesson Builder
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoadingLessons
                ? "Loading saved lessons..."
                : isDirty
                  ? "Unsaved changes"
                  : saveStatus === "saved"
                    ? "All changes saved"
                    : saveStatus === "error"
                      ? "Could not load or save lessons"
                      : "Loaded from lessons.json"}
            </p>
          </div>
          <button
            type="button"
            onClick={saveLessons}
            disabled={isLoadingLessons || !isDirty || saveStatus === "saving"}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <Save className="size-4" aria-hidden="true" />
            {saveStatus === "saving" ? "Saving..." : "Save"}
          </button>
        </div>

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
              className={`relative w-full overflow-hidden rounded-2xl border bg-[var(--surface)] shadow-md transition ${
                isLessonCollapsed ? "" : "min-h-72"
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

              <header className="flex items-center gap-4 border-b border-border bg-[var(--surface-sunken)] px-6 py-4">
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
                  const sentenceValidationIssueCount =
                    block.type === "sentence"
                      ? getSentenceValidationIssueCount(block)
                      : 0;
                  const isSentencePreviewVisible =
                    block.type === "sentence" &&
                    previewSentenceBlocks.has(contentBlockKey);

                  return (
                    <div
                      key={block.id}
                      className="overflow-hidden rounded-xl border border-border bg-[var(--surface-raised)] shadow-sm"
                    >
                    {block.type === "explanation" ? (
                      <>
                        <div className="flex items-center justify-between gap-3 border-b border-border bg-[var(--surface-sunken)] px-5 py-3">
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
                        <div className="flex items-center justify-between gap-3 border-b border-border bg-[var(--surface-sunken)] px-5 py-3">
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
                            <span
                              className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex ${
                                sentenceValidationIssueCount === 0
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {sentenceValidationIssueCount === 0
                                ? "Ready"
                                : `${sentenceValidationIssueCount} ${sentenceValidationIssueCount === 1 ? "issue" : "issues"}`}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                toggleSentencePreview(lesson.id, block.id)
                              }
                              aria-pressed={isSentencePreviewVisible}
                              aria-label={`${isSentencePreviewVisible ? "Edit" : "Preview"} sentence`}
                              title={
                                isSentencePreviewVisible
                                  ? "Return to editing"
                                  : "Preview as learner"
                              }
                              className={`flex size-8 items-center justify-center rounded-md transition ${
                                isSentencePreviewVisible
                                  ? "bg-blue-100 text-blue-700"
                                  : "text-stone-500 hover:bg-stone-200"
                              }`}
                            >
                              {isSentencePreviewVisible ? (
                                <Pencil className="size-4" aria-hidden="true" />
                              ) : (
                                <Eye className="size-4" aria-hidden="true" />
                              )}
                            </button>
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
                          {isSentencePreviewVisible ? (
                            <SentenceLearnerPreview sentence={block} />
                          ) : (
                          <>
                            <div className="mb-5 rounded-xl border border-violet-200 bg-violet-50/60 p-4">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
                                Question prompt
                              </p>
                              <label className="mb-3 block">
                                <span className="mb-1 block text-xs font-medium text-stone-500">
                                  Label (optional)
                                </span>
                                <input
                                  type="text"
                                  value={block.promptLabel}
                                  onChange={(event) =>
                                    updateSentencePromptLabel(
                                      lesson.id,
                                      block.id,
                                      event.target.value,
                                    )
                                  }
                                  placeholder="For example: Tu turno"
                                  className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm font-medium outline-none transition placeholder:text-stone-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                                />
                              </label>
                              <label
                                htmlFor={`sentence-prompt-${lesson.id}-${block.id}`}
                                className="mb-1 block text-xs font-medium text-stone-500"
                              >
                                Prompt (optional)
                              </label>
                              <textarea
                                id={`sentence-prompt-${lesson.id}-${block.id}`}
                                value={block.promptText}
                                onChange={(event) =>
                                  updateSentencePromptText(
                                    lesson.id,
                                    block.id,
                                    event.target.value,
                                  )
                                }
                                rows={2}
                                placeholder="For example: ¿Cómo se dice “Estoy preparando”?"
                                className="block w-full resize-y rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm leading-6 text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                              />
                              <label className="mt-3 block">
                                <span className="mb-1 block text-xs font-medium text-stone-500">
                                  Helper text (optional)
                                </span>
                                <input
                                  type="text"
                                  value={block.helperText ?? ""}
                                  onChange={(event) =>
                                    updateSentenceHelperText(
                                      lesson.id,
                                      block.id,
                                      event.target.value,
                                    )
                                  }
                                  placeholder="For example: No hay penalización por equivocarse."
                                  className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-stone-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                                />
                              </label>
                            </div>
                            <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
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
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {block.languageBlocks.map(
                              (languageBlock, languageBlockIndex) => {
                                const isLastLanguageBlock =
                                  languageBlockIndex ===
                                  block.languageBlocks.length - 1;
                                const languageBlockKey = `${lesson.id}-${block.id}-${languageBlock.id}`;
                                const isLanguageBlockCollapsed =
                                  collapsedLanguageBlocks.has(languageBlockKey);
                                const isSpanishMissing =
                                  !languageBlock.spanish.trim();

                                return (
                                  <div
                                    key={languageBlock.id}
                                    className={`overflow-hidden rounded-xl border bg-white shadow-md shadow-stone-200/60 ${
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
                                    }`}
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
                                      <div className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2">
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                                            Concepts
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              addLanguageBlockConceptLink(
                                                lesson.id,
                                                block.id,
                                                languageBlock.id,
                                              )
                                            }
                                            className="rounded px-1.5 py-0.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                                          >
                                            Add
                                          </button>
                                        </div>
                                        {languageBlock.conceptLinks.length >
                                        0 ? (
                                          <div className="space-y-1.5">
                                            {languageBlock.conceptLinks.map(
                                              (conceptLink) => (
                                                <div
                                                  key={conceptLink.id}
                                                  className="space-y-1.5 rounded-md bg-white p-2"
                                                >
                                                  <div className="flex items-center gap-1.5">
                                                    <select
                                                      value={conceptLink.type}
                                                      onChange={(event) =>
                                                        updateLanguageBlockConceptLink(
                                                          lesson.id,
                                                          block.id,
                                                          languageBlock.id,
                                                          conceptLink.id,
                                                          {
                                                            type: event.target
                                                              .value as ConceptType,
                                                          },
                                                        )
                                                      }
                                                      className="min-w-0 flex-1 rounded-md border border-stone-200 bg-white px-1.5 py-1.5 text-xs outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                                    >
                                                      {conceptTypeOptions.map(
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
                                                        updateLanguageBlockConceptLink(
                                                          lesson.id,
                                                          block.id,
                                                          languageBlock.id,
                                                          conceptLink.id,
                                                          {
                                                            role: event.target
                                                              .value as ConceptRole,
                                                          },
                                                        )
                                                      }
                                                      className="w-28 rounded-md border border-stone-200 bg-white px-1.5 py-1.5 text-xs outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                                    >
                                                      {conceptRoleOptions.map(
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
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        removeLanguageBlockConceptLink(
                                                          lesson.id,
                                                          block.id,
                                                          languageBlock.id,
                                                          conceptLink.id,
                                                        )
                                                      }
                                                      aria-label="Remove language block concept"
                                                      title="Remove concept"
                                                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                                                    >
                                                      <X
                                                        className="size-3.5"
                                                        aria-hidden="true"
                                                      />
                                                    </button>
                                                  </div>
                                                  <select
                                                    value={conceptLink.direction}
                                                    onChange={(event) =>
                                                      updateLanguageBlockConceptLink(
                                                        lesson.id,
                                                        block.id,
                                                        languageBlock.id,
                                                        conceptLink.id,
                                                        {
                                                          direction: event.target
                                                            .value as MappingDirection,
                                                        },
                                                      )
                                                    }
                                                    className="w-full rounded-md border border-stone-200 bg-white px-1.5 py-1.5 text-xs outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
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
                                                  <div className="grid grid-cols-2 gap-1.5">
                                                    <input
                                                      type="text"
                                                      value={
                                                        conceptLink.sourceText
                                                      }
                                                      onChange={(event) =>
                                                        updateLanguageBlockConceptLink(
                                                          lesson.id,
                                                          block.id,
                                                          languageBlock.id,
                                                          conceptLink.id,
                                                          {
                                                            sourceText:
                                                              event.target.value,
                                                          },
                                                        )
                                                      }
                                                      placeholder="Source"
                                                      className="min-w-0 rounded-md border border-stone-200 bg-white px-2 py-1.5 text-xs outline-none transition placeholder:text-stone-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                                    />
                                                    <input
                                                      type="text"
                                                      value={
                                                        conceptLink.targetText
                                                      }
                                                      onChange={(event) =>
                                                        updateLanguageBlockConceptLink(
                                                          lesson.id,
                                                          block.id,
                                                          languageBlock.id,
                                                          conceptLink.id,
                                                          {
                                                            targetText:
                                                              event.target.value,
                                                          },
                                                        )
                                                      }
                                                      placeholder="Target"
                                                      className="min-w-0 rounded-md border border-stone-200 bg-white px-2 py-1.5 text-xs outline-none transition placeholder:text-stone-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                                    />
                                                  </div>
                                                  <input
                                                    type="text"
                                                    value={
                                                      conceptLink.contextLabel
                                                    }
                                                    onChange={(event) =>
                                                      updateLanguageBlockConceptLink(
                                                        lesson.id,
                                                        block.id,
                                                        languageBlock.id,
                                                        conceptLink.id,
                                                        {
                                                          contextLabel:
                                                            event.target.value,
                                                        },
                                                      )
                                                    }
                                                    placeholder="Context"
                                                    className="w-full rounded-md border border-stone-200 bg-white px-2 py-1.5 text-xs outline-none transition placeholder:text-stone-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                                  />
                                                  <input
                                                    type="text"
                                                    value={conceptLink.label}
                                                    onChange={(event) =>
                                                      updateLanguageBlockConceptLink(
                                                        lesson.id,
                                                        block.id,
                                                        languageBlock.id,
                                                        conceptLink.id,
                                                        {
                                                          label:
                                                            event.target.value,
                                                        },
                                                      )
                                                    }
                                                    placeholder="Optional label"
                                                    className="w-full rounded-md border border-stone-200 bg-white px-2 py-1.5 text-xs outline-none transition placeholder:text-stone-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                                  />
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        ) : (
                                          <p className="text-xs text-stone-400">
                                            No concepts yet.
                                          </p>
                                        )}
                                      </div>
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
                          </>
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
