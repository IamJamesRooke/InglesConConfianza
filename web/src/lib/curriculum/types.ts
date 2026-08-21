export type CurriculumConcept = {
  id: string;
  spanish: string;
  english: string;
  example: {
    spanish: string;
    english: string;
  };
  collections: string[];
  teachingPriority: TeachingPriority;
};

export type TeachingPriority =
  | "essential"
  | "important"
  | "post_mastery"
  | "enrichment"
  | "supplemental"
  | "reference";

export type CurriculumFile = {
  version: 1;
  concepts: CurriculumConcept[];
};
