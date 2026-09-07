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

// Priority tiers for course sequencing, ordered most → least priority.
// See docs/curation/role-granularity/plan.md.
//   core      — the MVP set: minimum to build correct sentences with a dictionary
//   essential — high-utility content vocab an MVP still teaches explicitly
//   common    — standard vocab for the course after the MVP
//   extended  — real but later (formal/abstract/specialized, most phrasal verbs)
//   rare      — dictionary/drill completeness only, never explicitly taught
//   trash     — malformed / duplicate / not real content
export type CurriculumRole =
  | "core"
  | "essential"
  | "common"
  | "extended"
  | "rare"
  | "trash";

export const curriculumRoles: CurriculumRole[] = [
  "core",
  "essential",
  "common",
  "extended",
  "rare",
  "trash",
];

export type CurriculumFile = {
  version: 1;
  concepts: CurriculumConcept[];
};
