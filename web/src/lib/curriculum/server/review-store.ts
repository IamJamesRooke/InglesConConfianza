import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { isCurriculumConcept } from "@/lib/curriculum/server/curriculum-store";
import {
  curriculumRoles,
  type ReviewBatch,
  type ReviewCandidate,
  type ReviewFile,
} from "@/lib/curriculum/review-types";

const reviewFilePath = path.join(
  process.cwd(),
  "data",
  "curriculum-review.json",
);

let mutationQueue = Promise.resolve();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringList(value: unknown) {
  return (
    Array.isArray(value) &&
    value.every(
      (item) => typeof item === "string" && item.trim().length > 0 && item === item.trim(),
    )
  );
}

export function isReviewCandidate(value: unknown): value is ReviewCandidate {
  if (!isRecord(value) || !isCurriculumConcept(value)) return false;

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.action === "add" || candidate.action === "revise") &&
    (candidate.existingConceptId === undefined ||
      (typeof candidate.existingConceptId === "string" &&
        candidate.existingConceptId.length > 0)) &&
    typeof candidate.suggestedCurriculumRole === "string" &&
    curriculumRoles.includes(
      candidate.suggestedCurriculumRole as (typeof curriculumRoles)[number],
    ) &&
    isStringList(candidate.sourcePaths) &&
    typeof candidate.rationale === "string" &&
    candidate.rationale.trim().length > 0 &&
    typeof candidate.approved === "boolean" &&
    (candidate.deleted === undefined || typeof candidate.deleted === "boolean") &&
    (candidate.migrated === undefined || typeof candidate.migrated === "boolean") &&
    typeof candidate.ownerNote === "string"
  );
}

function isReviewBatch(value: unknown): value is ReviewBatch {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.title === "string" &&
    value.title.trim().length > 0 &&
    typeof value.createdAt === "string" &&
    (value.status === "open" || value.status === "migrated") &&
    (value.migratedAt === undefined || typeof value.migratedAt === "string") &&
    isStringList(value.sourcePaths) &&
    Array.isArray(value.candidates) &&
    value.candidates.every(isReviewCandidate) &&
    new Set(value.candidates.map((candidate) => candidate.id)).size ===
      value.candidates.length
  );
}

function isReviewFile(value: unknown): value is ReviewFile {
  return (
    isRecord(value) &&
    value.version === 1 &&
    Array.isArray(value.batches) &&
    value.batches.every(isReviewBatch) &&
    new Set(value.batches.map((batch) => batch.id)).size === value.batches.length
  );
}

export async function readReviewFile(): Promise<ReviewFile> {
  const file = await readFile(reviewFilePath, "utf8");
  const parsed: unknown = JSON.parse(file);

  if (!isReviewFile(parsed)) {
    throw new Error("Saved curriculum review file has an invalid shape.");
  }

  return parsed;
}

async function writeReviewFile(reviewFile: ReviewFile) {
  const temporaryPath = `${reviewFilePath}.tmp`;

  await mkdir(path.dirname(reviewFilePath), { recursive: true });
  await writeFile(temporaryPath, `${JSON.stringify(reviewFile, null, 2)}\n`);
  await rename(temporaryPath, reviewFilePath);
}

export function mutateReviewFile(
  mutate: (reviewFile: ReviewFile) => ReviewFile,
) {
  const mutation = mutationQueue.then(async () => {
    const reviewFile = await readReviewFile();
    const nextReviewFile = mutate(reviewFile);
    await writeReviewFile(nextReviewFile);
    return nextReviewFile;
  });

  mutationQueue = mutation.then(
    () => undefined,
    () => undefined,
  );

  return mutation;
}
