import type { CurriculumRole } from "./types";

export type CognateItem = {
  id: string;
  spanish: string;
  english: string;
  partOfSpeech: string;
  cognateType: string;
  cognateStatus: string;
  groupLabel: string;
  pattern: string;
  curriculumRole: CurriculumRole;
  tags: string[];
  sourcePaths: string[];
  existingConceptId?: string;
};

export type CognateCatalog = { version: 1; items: CognateItem[] };
