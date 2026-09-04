export const lessonProgressStorageKey = "icc.lessonProgress.v1";
const progressEvent = "icc:lesson-progress";

export type LessonProgressEntry = {
  completedAt?: string;
  lastOpenedAt?: string;
  stepId?: string;
};
export type LessonProgress = Record<string, LessonProgressEntry>;
const emptyProgress: LessonProgress = {};
let cachedRaw: string | null = null;
let cachedProgress: LessonProgress = emptyProgress;
let memoryOnly = false;

export function parseProgress(raw: string | null): LessonProgress {
  try {
    const value: unknown = JSON.parse(raw ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).flatMap(([id, entry]) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry))
          return [];
        const valid: LessonProgressEntry = {};
        for (const key of ["completedAt", "lastOpenedAt"] as const) {
          if (
            typeof entry[key] === "string" &&
            Number.isFinite(Date.parse(entry[key]))
          ) {
            valid[key] = entry[key];
          }
        }
        if (typeof entry.stepId === "string") valid.stepId = entry.stepId;
        return [[id, valid]];
      }),
    );
  } catch {
    return {};
  }
}

export function readProgress(): LessonProgress {
  if (typeof window === "undefined") return emptyProgress;
  if (memoryOnly) return cachedProgress;
  try {
    const raw = window.localStorage.getItem(lessonProgressStorageKey);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedProgress = parseProgress(raw);
    }
  } catch {
    memoryOnly = true;
  }
  return cachedProgress;
}

export function serverProgress() {
  return emptyProgress;
}

export function subscribeToProgress(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === lessonProgressStorageKey || event.key === null)
      onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(progressEvent, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(progressEvent, onChange);
  };
}

export function saveLessonProgress(
  lessonId: string,
  update: LessonProgressEntry,
) {
  const progress = readProgress();
  cachedProgress = {
    ...progress,
    [lessonId]: { ...progress[lessonId], ...update },
  };
  cachedRaw = JSON.stringify(cachedProgress);
  try {
    window.localStorage.setItem(lessonProgressStorageKey, cachedRaw);
    memoryOnly = false;
  } catch {
    // Practice remains usable when the browser denies persistent storage.
    memoryOnly = true;
  }
  window.dispatchEvent(new Event(progressEvent));
}

export function resumeStepIndex(
  blocks: { id: string }[],
  entry?: LessonProgressEntry,
) {
  if (entry?.completedAt || !entry?.stepId) return 0;
  return Math.max(
    0,
    blocks.findIndex((block) => block.id === entry.stepId),
  );
}

export function nextLessonToStudy<T extends { id: string; stepCount: number }>(
  lessons: T[],
  progress: LessonProgress,
): T | undefined {
  const available = lessons.filter((lesson) => lesson.stepCount > 0);
  const unfinished = available.filter(
    (lesson) => !progress[lesson.id]?.completedAt,
  );
  const recentlyOpened = unfinished
    .filter((lesson) => progress[lesson.id]?.lastOpenedAt)
    .sort(
      (a, b) =>
        Date.parse(progress[b.id].lastOpenedAt!) -
        Date.parse(progress[a.id].lastOpenedAt!),
    );
  return recentlyOpened[0] ?? unfinished[0] ?? available[0];
}
