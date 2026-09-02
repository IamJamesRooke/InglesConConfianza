import type { CurriculumConcept, CurriculumRole } from "@/lib/curriculum/types";

export type ReviewCandidate = CurriculumConcept & {
  action: "add" | "revise";
  existingConceptId?: string;
  suggestedCurriculumRole: CurriculumRole;
  sourcePaths: string[];
  rationale: string;
  approved: boolean;
  deleted?: boolean;
  migrated?: boolean;
  ownerNote: string;
};

export type ReviewBatch = {
  id: string;
  title: string;
  sourcePaths: string[];
  createdAt: string;
  status: "open" | "migrated";
  migratedAt?: string;
  candidates: ReviewCandidate[];
};

export type ReviewFile = {
  version: 1;
  batches: ReviewBatch[];
};

export const curriculumRoles: CurriculumRole[] = [
  "core",
  "supporting",
  "reference",
  "trash",
];
