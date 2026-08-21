import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  CurriculumConcept,
  CurriculumFile,
  TeachingPriority,
} from "@/lib/curriculum/types";

const curriculumFilePath = path.join(
  process.cwd(),
  "data",
  "curriculum.json",
);

let mutationQueue = Promise.resolve();

const teachingPriorities = [
  "essential",
  "important",
  "post_mastery",
  "enrichment",
  "supplemental",
  "reference",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isCurriculumConcept(
  value: unknown,
): value is CurriculumConcept {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.spanish === "string" &&
    value.spanish.trim().length > 0 &&
    typeof value.english === "string" &&
    value.english.trim().length > 0 &&
    !value.english.includes(" / ") &&
    isRecord(value.example) &&
    typeof value.example.spanish === "string" &&
    value.example.spanish.trim().length > 0 &&
    typeof value.example.english === "string" &&
    value.example.english.trim().length > 0 &&
    Array.isArray(value.collections) &&
    value.collections.every(
      (collection) =>
        typeof collection === "string" &&
        collection.trim().length > 0 &&
        collection === collection.trim(),
    ) &&
    new Set(value.collections).size === value.collections.length &&
    typeof value.teachingPriority === "string" &&
    teachingPriorities.includes(value.teachingPriority as TeachingPriority)
  );
}

function isCurriculumFile(value: unknown): value is CurriculumFile {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !Array.isArray(value.concepts) ||
    !value.concepts.every(isCurriculumConcept)
  ) {
    return false;
  }

  const ids = value.concepts.map((concept) => concept.id);
  return new Set(ids).size === ids.length;
}

export async function readCurriculumFile(): Promise<CurriculumFile> {
  const file = await readFile(curriculumFilePath, "utf8");
  const parsed: unknown = JSON.parse(file);

  if (!isCurriculumFile(parsed)) {
    throw new Error("Saved curriculum file has an invalid shape.");
  }

  return parsed;
}

async function writeCurriculumFile(curriculumFile: CurriculumFile) {
  const temporaryPath = `${curriculumFilePath}.tmp`;

  await mkdir(path.dirname(curriculumFilePath), { recursive: true });
  await writeFile(
    temporaryPath,
    `${JSON.stringify(curriculumFile, null, 2)}\n`,
  );
  await rename(temporaryPath, curriculumFilePath);
}

export function mutateCurriculumFile(
  mutate: (curriculumFile: CurriculumFile) => CurriculumFile,
) {
  const mutation = mutationQueue.then(async () => {
    const curriculumFile = await readCurriculumFile();
    const nextCurriculumFile = mutate(curriculumFile);
    await writeCurriculumFile(nextCurriculumFile);
    return nextCurriculumFile;
  });

  mutationQueue = mutation.then(
    () => undefined,
    () => undefined,
  );

  return mutation;
}
