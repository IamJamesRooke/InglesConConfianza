import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const lessonsFilePath = path.join(process.cwd(), "data", "lessons.json");

type LessonFile = {
  version: 1;
  lessons: Lesson[];
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
  languageBlocks: LanguageBlock[];
};

type LanguageBlock = {
  id: string;
  spanish: string;
  callout: string | null;
  acceptedAnswers: string[];
};

type LessonBlock = ExplanationBlock | SentenceBlock;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isLanguageBlock(value: unknown): value is LanguageBlock {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.spanish === "string" &&
    isStringOrNull(value.callout) &&
    Array.isArray(value.acceptedAnswers) &&
    value.acceptedAnswers.every((answer) => typeof answer === "string")
  );
}

function isLessonBlock(value: unknown): value is LessonBlock {
  if (!isRecord(value) || typeof value.id !== "string") {
    return false;
  }

  if (value.type === "explanation") {
    return typeof value.contentMarkdown === "string";
  }

  if (value.type === "sentence") {
    return (
      typeof value.promptLabel === "string" &&
      typeof value.promptText === "string" &&
      typeof value.helperText === "string" &&
      isStringOrNull(value.answerFeedback) &&
      Array.isArray(value.languageBlocks) &&
      value.languageBlocks.every(isLanguageBlock)
    );
  }

  return false;
}

function isLesson(value: unknown): value is Lesson {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isStringOrNull(value.name) &&
    Array.isArray(value.blocks) &&
    value.blocks.every(isLessonBlock)
  );
}

function isLessonFile(value: unknown): value is LessonFile {
  return (
    isRecord(value) &&
    value.version === 1 &&
    Array.isArray(value.lessons) &&
    value.lessons.every(isLesson)
  );
}

export async function GET() {
  try {
    const file = await readFile(lessonsFilePath, "utf8");
    const parsed: unknown = JSON.parse(file);

    if (!isLessonFile(parsed)) {
      return NextResponse.json(
        { error: "Saved lessons file has an invalid shape." },
        { status: 500 },
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return NextResponse.json({ version: 1, lessons: [] });
    }

    return NextResponse.json(
      { error: "Unable to read lessons file." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isLessonFile(body)) {
    return NextResponse.json(
      { error: "Lesson payload has an invalid shape." },
      { status: 400 },
    );
  }

  await mkdir(path.dirname(lessonsFilePath), { recursive: true });
  await writeFile(lessonsFilePath, `${JSON.stringify(body, null, 2)}\n`);

  return NextResponse.json(body);
}
