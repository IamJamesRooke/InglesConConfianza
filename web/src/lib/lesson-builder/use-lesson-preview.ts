"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { PracticeLesson } from "@/components/practice/lesson-selector";
import type { Lesson } from "@/lib/lesson-builder/types";

export type PreviewOrigin = {
  element: HTMLElement | null;
  inputSelection: [number, number] | null;
  range: Range | null;
  scrollY: number;
};

export type LessonPreviewPlatform = {
  activeElement: () => HTMLElement | null;
  inputSelection: (element: HTMLElement | null) => [number, number] | null;
  editableRange: (element: HTMLElement | null) => Range | null;
  scrollY: () => number;
  requestFrame: (callback: () => void) => void;
  scrollTo: (top: number) => void;
  contains: (element: HTMLElement) => boolean;
  focus: (element: HTMLElement) => void;
  setInputSelection: (
    element: HTMLElement,
    selection: [number, number],
  ) => void;
  restoreRange: (range: Range) => void;
};

const browserPreviewPlatform: LessonPreviewPlatform = {
  activeElement: () =>
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  inputSelection: (element) =>
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
      ? [element.selectionStart ?? 0, element.selectionEnd ?? 0]
      : null,
  editableRange: (element) => {
    const selection = window.getSelection();
    return element?.isContentEditable && selection?.rangeCount
      ? selection.getRangeAt(0).cloneRange()
      : null;
  },
  scrollY: () => window.scrollY,
  requestFrame: (callback) => requestAnimationFrame(callback),
  scrollTo: (top) => window.scrollTo({ top, behavior: "auto" }),
  contains: (element) => document.contains(element),
  focus: (element) => element.focus({ preventScroll: true }),
  setInputSelection: (element, selection) => {
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      element.setSelectionRange(...selection);
    }
  },
  restoreRange: (range) => {
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  },
};

export function capturePreviewOrigin(
  platform: LessonPreviewPlatform,
): PreviewOrigin {
  const element = platform.activeElement();
  return {
    element,
    inputSelection: platform.inputSelection(element),
    range: platform.editableRange(element),
    scrollY: platform.scrollY(),
  };
}

export function restorePreviewOrigin(
  origin: PreviewOrigin,
  platform: LessonPreviewPlatform,
) {
  platform.scrollTo(origin.scrollY);
  if (!origin.element || !platform.contains(origin.element)) return;

  platform.focus(origin.element);
  if (origin.inputSelection) {
    platform.setInputSelection(origin.element, origin.inputSelection);
  } else if (origin.range) {
    platform.restoreRange(origin.range);
  }
}

export function schedulePreviewOriginReturn(
  originRef: { current: PreviewOrigin | null },
  platform: LessonPreviewPlatform,
) {
  platform.requestFrame(() => {
    const origin = originRef.current;
    originRef.current = null;
    if (origin) restorePreviewOrigin(origin, platform);
  });
}

export function buildLessonPreview(
  lessons: Lesson[],
  lessonId: string | null,
): PracticeLesson | null {
  const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  const lesson = lessons[lessonIndex];
  if (!lesson) return null;

  return {
    id: lesson.id,
    lessonNumber: lessonIndex + 1,
    name: lesson.name,
    explanationCount: lesson.blocks.filter(
      (block) => block.type === "explanation",
    ).length,
    practiceCount: lesson.blocks.filter((block) => block.type === "sentence")
      .length,
    previewText: "",
    concepts: [],
    blocks: lesson.blocks,
  };
}

export function useLessonPreview(
  lessons: Lesson[],
  platform: LessonPreviewPlatform = browserPreviewPlatform,
) {
  const [previewLessonId, setPreviewLessonId] = useState<string | null>(null);
  const originRef = useRef<PreviewOrigin | null>(null);

  const openPreview = useCallback(
    (lessonId: string) => {
      originRef.current = capturePreviewOrigin(platform);
      setPreviewLessonId(lessonId);
    },
    [platform],
  );

  const closePreview = useCallback(() => {
    setPreviewLessonId(null);
    schedulePreviewOriginReturn(originRef, platform);
  }, [platform]);

  const preview = useMemo(
    () => buildLessonPreview(lessons, previewLessonId),
    [lessons, previewLessonId],
  );

  return { preview, openPreview, closePreview };
}
