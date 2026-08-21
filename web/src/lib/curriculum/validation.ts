import type {
  CurriculumConcept,
  CurriculumFile,
  CurriculumRole,
} from "@/lib/curriculum/types";
import {
  curriculumRoles,
  type ReviewBatch,
  type ReviewCandidate,
  type ReviewFile,
} from "@/lib/curriculum/review-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "string" &&
        item.trim().length > 0 &&
        item === item.trim(),
    )
  );
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
    isStringList(value.collections) &&
    new Set(value.collections).size === value.collections.length &&
    typeof value.curriculumRole === "string" &&
    curriculumRoles.includes(value.curriculumRole as CurriculumRole)
  );
}

export function isCurriculumFile(value: unknown): value is CurriculumFile {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !Array.isArray(value.concepts) ||
    !value.concepts.every(isCurriculumConcept)
  ) {
    return false;
  }

  const ids = value.concepts.map((concept) => concept.id);
  const edges = value.concepts.map(
    (concept) => `${concept.spanish}\u0000${concept.english}`,
  );
  return (
    new Set(ids).size === ids.length &&
    new Set(edges).size === edges.length
  );
}

export function isReviewCandidate(value: unknown): value is ReviewCandidate {
  if (!isRecord(value) || !isCurriculumConcept(value)) return false;

  const candidate = value as CurriculumConcept & Record<string, unknown>;

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
    (candidate.deleted === undefined ||
      typeof candidate.deleted === "boolean") &&
    (candidate.migrated === undefined ||
      typeof candidate.migrated === "boolean") &&
    typeof candidate.ownerNote === "string"
  );
}

export function isReviewBatch(value: unknown): value is ReviewBatch {
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

export function isReviewFile(value: unknown): value is ReviewFile {
  return (
    isRecord(value) &&
    value.version === 1 &&
    Array.isArray(value.batches) &&
    value.batches.every(isReviewBatch) &&
    new Set(value.batches.map((batch) => batch.id)).size ===
      value.batches.length
  );
}
