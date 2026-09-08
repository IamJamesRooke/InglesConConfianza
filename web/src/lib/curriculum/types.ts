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

// Priority tiers for course sequencing, ordered most → least priority. These
// are hand-assigned, one row at a time — start everything at "Unranked" and
// promote organically. The enum's declaration order (here and in the Postgres
// type) is the priority order, so `ORDER BY curriculum_role` sorts correctly.
//   P1       — highest leverage, teach first
//   P2       — high priority
//   P3       — mid priority
//   P4       — lower priority, later in the course
//   P5       — lowest, niche / completeness only
//   Unranked — not yet triaged (the default for every row)
//   Trash    — malformed / duplicate / not real content, staged for deletion
export type CurriculumRole =
  | "P1"
  | "P2"
  | "P3"
  | "P4"
  | "P5"
  | "Unranked"
  | "Trash";

export const curriculumRoles: CurriculumRole[] = [
  "P1",
  "P2",
  "P3",
  "P4",
  "P5",
  "Unranked",
  "Trash",
];

export type CurriculumFile = {
  version: 1;
  concepts: CurriculumConcept[];
};
