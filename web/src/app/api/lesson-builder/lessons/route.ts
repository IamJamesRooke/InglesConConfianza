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
  conceptLinks?: ConceptLink[];
  languageBlocks: LanguageBlock[];
};

type LanguageBlock = {
  id: string;
  spanish: string;
  callout: string | null;
  acceptedAnswers: string[];
  conceptLinks?: ConceptLink[];
};

type LessonBlock = ExplanationBlock | SentenceBlock;

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
  type?: ConceptType;
  direction?: MappingDirection;
  sourceText?: string;
  targetText?: string;
  contextLabel?: string;
  role: ConceptRole;
};

const conceptRoles = [
  "primary",
  "introduced",
  "reinforced",
  "required",
  "incidental",
];

const conceptTypes = [
  "mapping",
  "vocabulary",
  "grammar_pattern",
  "morpheme",
  "concept_group",
];

const mappingDirections = [
  "es_to_en",
  "en_to_es",
  "bidirectional",
  "not_directional",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isConceptRole(value: unknown): value is ConceptRole {
  return typeof value === "string" && conceptRoles.includes(value);
}

function isConceptType(value: unknown): value is ConceptType {
  return typeof value === "string" && conceptTypes.includes(value);
}

function isMappingDirection(value: unknown): value is MappingDirection {
  return typeof value === "string" && mappingDirections.includes(value);
}

function isConceptLink(value: unknown): value is ConceptLink {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    (value.type === undefined || isConceptType(value.type)) &&
    (value.direction === undefined ||
      isMappingDirection(value.direction)) &&
    (value.sourceText === undefined ||
      typeof value.sourceText === "string") &&
    (value.targetText === undefined ||
      typeof value.targetText === "string") &&
    (value.contextLabel === undefined ||
      typeof value.contextLabel === "string") &&
    isConceptRole(value.role)
  );
}

function isOptionalConceptLinks(value: unknown) {
  return (
    value === undefined ||
    (Array.isArray(value) && value.every(isConceptLink))
  );
}

function isLanguageBlock(value: unknown): value is LanguageBlock {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.spanish === "string" &&
    isStringOrNull(value.callout) &&
    isOptionalConceptLinks(value.conceptLinks) &&
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
      isOptionalConceptLinks(value.conceptLinks) &&
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
