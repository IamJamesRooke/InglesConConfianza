import { stat } from "node:fs/promises";
import path from "node:path";

import type { PrismaClient } from "../src/generated/prisma/client";
import type { ReviewBatch } from "../src/lib/curriculum/review-types";

type ExistingConcept = {
  id: string;
  spanish: string;
  english: string;
  exampleSpanish: string;
  exampleEnglish: string;
  curriculumRole: string;
  collections: Array<{ collectionName: string }>;
};

export type PreflightIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  candidateId?: string;
};

type PreflightContext = {
  existingConcepts: ExistingConcept[];
  existingBatchIds: Set<string>;
  sourcePathExists: (sourcePath: string) => Promise<boolean>;
};

export function normalizeMappingText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .toLocaleLowerCase("en")
    .replace(/\s+/g, " ")
    .trim();
}

function mappingKey(spanish: string, english: string) {
  return `${normalizeMappingText(spanish)}\u0000${normalizeMappingText(english)}`;
}

function mappingSkeleton(spanish: string, english: string) {
  return mappingKey(
    spanish.replace(/\[[^\]]+\]/g, "[]"),
    english.replace(/\[[^\]]+\]/g, "[]"),
  );
}

function hasBalancedBrackets(value: string) {
  let depth = 0;
  for (const character of value) {
    if (character === "[") depth += 1;
    if (character === "]") depth -= 1;
    if (depth < 0 || depth > 1) return false;
  }
  return depth === 0;
}

function looksSentenceShaped(value: string) {
  return /[.!?]$/.test(value.trim()) || value.trim().split(/\s+/).length > 9;
}

function sameStringSet(first: string[], second: string[]) {
  return (
    first.length === second.length &&
    first.every((value) => second.includes(value))
  );
}

export async function analyzeReviewBatch(
  batch: ReviewBatch,
  context: PreflightContext,
) {
  const issues: PreflightIssue[] = [];
  const existingById = new Map(
    context.existingConcepts.map((concept) => [concept.id, concept]),
  );
  const existingByEdge = new Map<string, ExistingConcept[]>();
  const existingBySkeleton = new Map<string, ExistingConcept[]>();
  const existingBySpanish = new Map<string, ExistingConcept[]>();

  for (const concept of context.existingConcepts) {
    const edge = mappingKey(concept.spanish, concept.english);
    const skeleton = mappingSkeleton(concept.spanish, concept.english);
    const spanish = normalizeMappingText(concept.spanish);
    existingByEdge.set(edge, [...(existingByEdge.get(edge) ?? []), concept]);
    existingBySkeleton.set(skeleton, [
      ...(existingBySkeleton.get(skeleton) ?? []),
      concept,
    ]);
    existingBySpanish.set(spanish, [
      ...(existingBySpanish.get(spanish) ?? []),
      concept,
    ]);
  }

  if (context.existingBatchIds.has(batch.id)) {
    issues.push({
      severity: "error",
      code: "batch-exists",
      message: `Review batch already exists: ${batch.id}`,
    });
  }

  const batchEdges = new Map<string, string>();
  const batchSkeletons = new Map<string, string>();
  const sourcePaths = new Set([
    ...batch.sourcePaths,
    ...batch.candidates.flatMap((candidate) => candidate.sourcePaths),
  ]);

  for (const sourcePath of sourcePaths) {
    if (!(await context.sourcePathExists(sourcePath))) {
      issues.push({
        severity: "error",
        code: "missing-source-path",
        message: `Source path does not currently exist: ${sourcePath}`,
      });
    }
  }

  for (const candidate of batch.candidates) {
    const edge = mappingKey(candidate.spanish, candidate.english);
    const skeleton = mappingSkeleton(candidate.spanish, candidate.english);
    const target = candidate.existingConceptId
      ? existingById.get(candidate.existingConceptId)
      : undefined;

    if (candidate.collections.length === 0) {
      issues.push({
        severity: "error",
        code: "missing-collections",
        candidateId: candidate.id,
        message: "Every candidate needs at least one queryable collection.",
      });
    }
    if (candidate.sourcePaths.length === 0) {
      issues.push({
        severity: "error",
        code: "missing-provenance",
        candidateId: candidate.id,
        message: "Every candidate needs source-path provenance.",
      });
    }
    if (
      !hasBalancedBrackets(candidate.spanish) ||
      !hasBalancedBrackets(candidate.english)
    ) {
      issues.push({
        severity: "error",
        code: "unbalanced-placeholders",
        candidateId: candidate.id,
        message: "Spanish and English concept placeholders must use balanced brackets.",
      });
    }
    if (candidate.english.includes("/")) {
      issues.push({
        severity: "warning",
        code: "possible-combined-target",
        candidateId: candidate.id,
        message: "English contains a slash; confirm that it is one target rather than alternatives.",
      });
    }
    if (
      looksSentenceShaped(candidate.spanish) ||
      looksSentenceShaped(candidate.english)
    ) {
      issues.push({
        severity: "warning",
        code: "sentence-shaped-concept",
        candidateId: candidate.id,
        message: "Concept fields look sentence-shaped; confirm that the source example was generalized.",
      });
    }

    if (candidate.action === "add") {
      if (existingById.has(candidate.id)) {
        issues.push({
          severity: "error",
          code: "concept-id-exists",
          candidateId: candidate.id,
          message: `Concept ID already exists: ${candidate.id}`,
        });
      }
      const duplicates = existingByEdge.get(edge) ?? [];
      if (duplicates.length > 0) {
        issues.push({
          severity: "error",
          code: "duplicate-existing-edge",
          candidateId: candidate.id,
          message: `Normalized Spanish-English edge already exists as ${duplicates.map((item) => item.id).join(", ")}; use a revision if collections or examples need to change.`,
        });
      }
    } else {
      if (!candidate.existingConceptId || !target) {
        issues.push({
          severity: "error",
          code: "missing-revision-target",
          candidateId: candidate.id,
          message: `Revision target does not exist: ${candidate.existingConceptId ?? "(missing ID)"}`,
        });
      }
      const conflictingEdges = (existingByEdge.get(edge) ?? []).filter(
        (concept) => concept.id !== candidate.existingConceptId,
      );
      if (conflictingEdges.length > 0) {
        issues.push({
          severity: "error",
          code: "revision-creates-duplicate",
          candidateId: candidate.id,
          message: `Revision would duplicate ${conflictingEdges.map((item) => item.id).join(", ")}.`,
        });
      }
      if (
        target &&
        target.spanish === candidate.spanish &&
        target.english === candidate.english &&
        target.exampleSpanish === candidate.example.spanish &&
        target.exampleEnglish === candidate.example.english &&
        target.curriculumRole === candidate.curriculumRole &&
        sameStringSet(
          target.collections.map((item) => item.collectionName),
          candidate.collections,
        )
      ) {
        issues.push({
          severity: "warning",
          code: "no-op-revision",
          candidateId: candidate.id,
          message: `Revision does not change ${target.id}.`,
        });
      }
    }

    const earlierCandidateId = batchEdges.get(edge);
    if (earlierCandidateId) {
      issues.push({
        severity: "error",
        code: "duplicate-batch-edge",
        candidateId: candidate.id,
        message: `Normalized edge duplicates candidate ${earlierCandidateId} in this batch.`,
      });
    } else {
      batchEdges.set(edge, candidate.id);
    }

    const earlierSkeletonId = batchSkeletons.get(skeleton);
    if (earlierSkeletonId && earlierSkeletonId !== earlierCandidateId) {
      issues.push({
        severity: "warning",
        code: "probable-batch-duplicate",
        candidateId: candidate.id,
        message: `Placeholder-normalized shape matches candidate ${earlierSkeletonId}.`,
      });
    } else {
      batchSkeletons.set(skeleton, candidate.id);
    }

    const probableExisting = (existingBySkeleton.get(skeleton) ?? []).filter(
      (concept) =>
        mappingKey(concept.spanish, concept.english) !== edge &&
        concept.id !== candidate.existingConceptId,
    );
    if (probableExisting.length > 0) {
      issues.push({
        severity: "warning",
        code: "probable-existing-duplicate",
        candidateId: candidate.id,
        message: `Placeholder-normalized shape resembles ${probableExisting
          .slice(0, 5)
          .map((item) => item.id)
          .join(", ")}.`,
      });
    }

    const sameSpanish = (existingBySpanish.get(normalizeMappingText(candidate.spanish)) ?? [])
      .filter(
        (concept) =>
          normalizeMappingText(concept.english) !==
            normalizeMappingText(candidate.english) &&
          concept.id !== candidate.existingConceptId,
      );
    if (sameSpanish.length > 0) {
      issues.push({
        severity: "warning",
        code: "existing-spanish-collision",
        candidateId: candidate.id,
        message: `Spanish concept already has other English targets: ${sameSpanish
          .slice(0, 5)
          .map((item) => item.id)
          .join(", ")}. Confirm this is an independent mapping.`,
      });
    }
  }

  return issues;
}

export async function preflightReviewBatch(
  client: PrismaClient,
  batch: ReviewBatch,
) {
  const [existingConcepts, existingBatches] = await Promise.all([
    client.curriculumConcept.findMany({
      include: { collections: { select: { collectionName: true } } },
    }),
    client.reviewBatch.findMany({ select: { id: true } }),
  ]);
  const repositoryRoot = path.resolve(process.cwd(), "..");
  return analyzeReviewBatch(batch, {
    existingConcepts,
    existingBatchIds: new Set(existingBatches.map((item) => item.id)),
    sourcePathExists: async (sourcePath) => {
      try {
        await stat(path.resolve(repositoryRoot, sourcePath));
        return true;
      } catch {
        return false;
      }
    },
  });
}

export function printPreflightIssues(issues: PreflightIssue[]) {
  for (const issue of issues) {
    const candidate = issue.candidateId ? ` [${issue.candidateId}]` : "";
    const output = `${issue.severity.toUpperCase()} ${issue.code}${candidate}: ${issue.message}`;
    if (issue.severity === "error") console.error(output);
    else console.warn(output);
  }
}
