export type CurriculumConcept = {
  id: string;
  spanish: string;
  english: string;
  example: {
    spanish: string;
    english: string;
  };
  collections: string[];
  curriculumRole: CurriculumRole;
};

export type CurriculumRole = "core" | "supporting" | "reference" | "trash";

export type CurriculumFile = {
  version: 1;
  concepts: CurriculumConcept[];
};
