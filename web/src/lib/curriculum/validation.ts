import {
  curriculumRoles,
  type CurriculumConcept,
  type CurriculumFile,
  type CurriculumRole,
} from "@/lib/curriculum/types";
import type {
  MappingSourceArchive,
  MappingSourceDocument,
  MappingSourceEntry,
} from "@/lib/curriculum/mapping-source-types";

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

function isMappingSourceDocument(
  value: unknown,
): value is MappingSourceDocument {
  return (
    isRecord(value) &&
    typeof value.path === "string" &&
    value.path.startsWith("docs/curriculum/") &&
    typeof value.pillar === "string" &&
    value.pillar.length > 0 &&
    typeof value.direction === "string" &&
    value.direction.length > 0 &&
    typeof value.hub === "string" &&
    value.hub.length > 0 &&
    typeof value.kind === "string" &&
    value.kind.length > 0 &&
    typeof value.extension === "string" &&
    typeof value.content === "string" &&
    typeof value.sha256 === "string" &&
    /^[0-9a-f]{64}$/.test(value.sha256) &&
    Number.isInteger(value.byteLength) &&
    (value.byteLength as number) >= 0 &&
    Number.isInteger(value.lineCount) &&
    (value.lineCount as number) >= 0 &&
    isStringList(value.tags) &&
    typeof value.capturedAt === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.capturedAt)
  );
}

function isMappingSourceEntry(value: unknown): value is MappingSourceEntry {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.documentPath === "string" &&
    value.documentPath.startsWith("docs/curriculum/") &&
    Number.isInteger(value.position) &&
    (value.position as number) >= 0 &&
    Number.isInteger(value.lineNumber) &&
    (value.lineNumber as number) > 0 &&
    typeof value.section === "string" &&
    typeof value.rawText === "string" &&
    Array.isArray(value.cells) &&
    value.cells.every((cell) => typeof cell === "string") &&
    (value.spanish === undefined || typeof value.spanish === "string") &&
    (value.english === undefined || typeof value.english === "string") &&
    isStringList(value.tags)
  );
}

export function isMappingSourceArchive(
  value: unknown,
): value is MappingSourceArchive {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    value.sourceRoot !== "docs/curriculum" ||
    !Array.isArray(value.documents) ||
    !value.documents.every(isMappingSourceDocument) ||
    !Array.isArray(value.entries) ||
    !value.entries.every(isMappingSourceEntry)
  ) {
    return false;
  }

  const documentPaths = value.documents.map((document) => document.path);
  const entryIds = value.entries.map((entry) => entry.id);
  const knownPaths = new Set(documentPaths);
  return (
    knownPaths.size === documentPaths.length &&
    new Set(entryIds).size === entryIds.length &&
    value.entries.every((entry) => knownPaths.has(entry.documentPath))
  );
}
