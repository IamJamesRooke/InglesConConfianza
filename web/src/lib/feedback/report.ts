// Triage report for owner-facing per-slide feedback
// (docs/engineering/feedback.md, scripts/feedback-report.ts). Pure grouping
// and rendering logic, kept free of file-system/CLI concerns so it can be
// unit-tested directly (tests/unit/feedback-report.test.ts).

type FeedbackAnswerEntry = {
  index: number;
  typed: string;
  correct: boolean;
};

/**
 * One feedback record as stored in data/feedback.jsonl — a loosened mirror
 * of FeedbackRecord (src/lib/feedback/validate.ts). Loosened because older
 * lines on disk may predate a field this report now reads; every field but
 * `message` is optional/nullable here for that reason.
 */
export type FeedbackNoteRecord = {
  moduleId?: string | null;
  moduleName?: string | null;
  lessonId?: string | null;
  lessonName?: string | null;
  slideIndex?: number | null;
  slideCount?: number | null;
  slideKind?: string;
  slideId?: string | null;
  slide?: Record<string, unknown> | null;
  answers?: FeedbackAnswerEntry[];
  hintsUsed?: number | null;
  secondsOnSlide?: number | null;
  muted?: boolean | null;
  speakerId?: string | null;
  progress?: { lessonsCompleted: number; lessonsTotal: number } | null;
  viewport?: { w: number; h: number } | null;
  userAgent?: string;
  language?: string | null;
  pointer?: "touch" | "mouse" | null;
  appVersion?: string;
  page?: string;
  who?: string | null;
  message: string;
  at?: string;
};

type SlideGroup = {
  slideId: string | null;
  slideIndex: number | null;
  slideKind: string;
  slide: Record<string, unknown> | null;
  notes: FeedbackNoteRecord[];
};

type LessonGroup = {
  lessonId: string | null;
  lessonName: string | null;
  slides: SlideGroup[];
};

export type ModuleGroup = {
  moduleId: string | null;
  moduleName: string | null;
  lessons: LessonGroup[];
};

function bySlideOrder(a: SlideGroup, b: SlideGroup): number {
  if (a.slideIndex === null && b.slideIndex === null) return 0;
  if (a.slideIndex === null) return 1;
  if (b.slideIndex === null) return -1;
  return a.slideIndex - b.slideIndex;
}

/**
 * Groups feedback notes by module -> lesson -> slide, in first-seen order
 * for modules/lessons and slide-index order within a lesson. A note with
 * no module/lesson (the home screen) lands under `moduleId: null` /
 * `lessonId: null` groups rather than being dropped.
 */
export function groupFeedback(records: FeedbackNoteRecord[]): ModuleGroup[] {
  const modules: ModuleGroup[] = [];
  const moduleIndex = new Map<string, ModuleGroup>();
  const lessonIndex = new Map<string, LessonGroup>();
  const slideIndex = new Map<string, SlideGroup>();

  for (const record of records) {
    const moduleKey = record.moduleId ?? "\0none";
    let moduleGroup = moduleIndex.get(moduleKey);
    if (!moduleGroup) {
      moduleGroup = {
        moduleId: record.moduleId ?? null,
        moduleName: record.moduleName ?? null,
        lessons: [],
      };
      moduleIndex.set(moduleKey, moduleGroup);
      modules.push(moduleGroup);
    }

    const lessonKey = `${moduleKey}\0${record.lessonId ?? "\0none"}`;
    let lessonGroup = lessonIndex.get(lessonKey);
    if (!lessonGroup) {
      lessonGroup = {
        lessonId: record.lessonId ?? null,
        lessonName: record.lessonName ?? null,
        slides: [],
      };
      lessonIndex.set(lessonKey, lessonGroup);
      moduleGroup.lessons.push(lessonGroup);
    }

    const slideKey = `${lessonKey}\0${record.slideId ?? `\0idx${record.slideIndex ?? "none"}`}`;
    let slideGroup = slideIndex.get(slideKey);
    if (!slideGroup) {
      slideGroup = {
        slideId: record.slideId ?? null,
        slideIndex: record.slideIndex ?? null,
        slideKind: record.slideKind ?? "unknown",
        slide: record.slide ?? null,
        notes: [],
      };
      slideIndex.set(slideKey, slideGroup);
      lessonGroup.slides.push(slideGroup);
    }
    slideGroup.notes.push(record);
  }

  for (const moduleGroup of modules) {
    for (const lessonGroup of moduleGroup.lessons) {
      lessonGroup.slides.sort(bySlideOrder);
    }
  }
  return modules;
}

function slideTextLines(slide: Record<string, unknown> | null): string[] {
  if (!slide) return [];
  if (typeof slide.markdown === "string") {
    return [slide.markdown];
  }
  if (Array.isArray(slide.pieces)) {
    return (slide.pieces as Array<Record<string, unknown>>).map((piece) => {
      const spanish = typeof piece.spanish === "string" ? piece.spanish : "";
      const accepted = Array.isArray(piece.acceptedAnswers)
        ? String(piece.acceptedAnswers[0] ?? "")
        : "";
      const given = piece.given === true ? " (dado, no evaluado)" : "";
      return `- ${spanish} → ${accepted}${given}`;
    });
  }
  if (
    typeof slide.finalSentenceEnglish === "string" ||
    typeof slide.finalSentenceSpanish === "string"
  ) {
    return [
      `${String(slide.finalSentenceEnglish ?? "")} / ${String(slide.finalSentenceSpanish ?? "")}`,
    ];
  }
  if ("nextLessonId" in slide) {
    return [`Siguiente lección: ${String(slide.nextLessonId ?? "(ninguna)")}`];
  }
  return [];
}

function noteLines(note: FeedbackNoteRecord): string[] {
  const who = note.who || "Anónimo";
  const when = note.at || "fecha desconocida";
  const device = [
    note.viewport ? `${note.viewport.w}×${note.viewport.h}` : null,
    note.pointer ?? null,
    note.language ?? null,
  ]
    .filter(Boolean)
    .join(", ");
  const answers = (note.answers ?? [])
    .map((answer) => `#${answer.index}:${answer.correct ? "✓" : "✗"} "${answer.typed}"`)
    .join("; ");
  const metaParts = [
    device ? `dispositivo: ${device}` : null,
    note.hintsUsed != null ? `pistas: ${note.hintsUsed}` : null,
    note.secondsOnSlide != null ? `tiempo: ${note.secondsOnSlide}s` : null,
    answers ? `respuestas: ${answers}` : null,
  ].filter(Boolean);
  const lines = [`- **${who}** (${when})${metaParts.length ? ` — ${metaParts.join(" · ")}` : ""}`];
  lines.push(`  > ${note.message}`);
  return lines;
}

/** Renders the grouped report as Markdown, ending with a summary table. */
export function renderReportMarkdown(groups: ModuleGroup[]): string {
  const lines: string[] = ["# Reporte de comentarios", ""];
  const lessonCounts: { label: string; count: number }[] = [];
  const slideCounts: { label: string; count: number }[] = [];

  for (const moduleGroup of groups) {
    lines.push(`## ${moduleGroup.moduleName || moduleGroup.moduleId || "Sin módulo"}`);
    lines.push("");
    for (const lessonGroup of moduleGroup.lessons) {
      const lessonLabel = lessonGroup.lessonName || lessonGroup.lessonId || "Sin lección";
      lines.push(`### ${lessonLabel}`);
      lines.push("");
      let lessonNoteCount = 0;
      for (const slideGroup of lessonGroup.slides) {
        const slideLabel = `Slide ${slideGroup.slideIndex ?? "?"} — ${slideGroup.slideKind}`;
        lines.push(`#### ${slideLabel}`);
        lines.push(...slideTextLines(slideGroup.slide));
        lines.push("");
        for (const note of slideGroup.notes) {
          lines.push(...noteLines(note));
        }
        lines.push("");
        lessonNoteCount += slideGroup.notes.length;
        slideCounts.push({
          label: `${lessonLabel} — ${slideLabel}`,
          count: slideGroup.notes.length,
        });
      }
      lessonCounts.push({ label: lessonLabel, count: lessonNoteCount });
    }
  }

  lines.push("## Resumen");
  lines.push("");
  lines.push("| Lección | Comentarios |");
  lines.push("| --- | --- |");
  for (const { label, count } of lessonCounts) {
    lines.push(`| ${label} | ${count} |`);
  }
  lines.push("");
  lines.push("### Slides con más comentarios");
  lines.push("");
  lines.push("| Slide | Comentarios |");
  lines.push("| --- | --- |");
  for (const { label, count } of [...slideCounts].sort((a, b) => b.count - a.count).slice(0, 10)) {
    lines.push(`| ${label} | ${count} |`);
  }
  lines.push("");

  return lines.join("\n");
}

/** Parses one data/feedback.jsonl file's contents into records, skipping
 * any line that isn't valid JSON rather than failing the whole report. */
export function parseFeedbackJsonl(contents: string): FeedbackNoteRecord[] {
  const records: FeedbackNoteRecord[] = [];
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      records.push(JSON.parse(trimmed) as FeedbackNoteRecord);
    } catch {
      // Skip a malformed line rather than aborting the whole report.
    }
  }
  return records;
}
