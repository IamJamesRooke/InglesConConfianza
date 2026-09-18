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

// Teacher-facing wording for a role — a raw "P1" never reaches a teacher.
// The curriculum row editor keeps its own list (same labels plus a
// description per option, for its <select>); this is the plain lookup for
// everywhere else, including pure modules that must not import a component.
const curriculumRoleLabels: Record<CurriculumRole, string> = {
  P1: "Level 1",
  P2: "Level 2",
  P3: "Level 3",
  P4: "Level 4",
  P5: "Level 5",
  Unranked: "Unranked",
  Trash: "Trash",
};

export function curriculumRoleLabel(role?: string | null): string {
  return curriculumRoleLabels[role as CurriculumRole] ?? "Unranked";
}

export type CurriculumLevel = 1 | 2 | 3 | 4 | 5;

const LEVEL_ROLES: Record<CurriculumLevel, CurriculumRole> = {
  1: "P1",
  2: "P2",
  3: "P3",
  4: "P4",
  5: "P5",
};

// The set of roles that count as "level <= n": P1..Pn, in priority order.
export function rolesUpToLevel(maxLevel: CurriculumLevel): CurriculumRole[] {
  return curriculumRoles.filter(
    (role) => role.startsWith("P") && Number(role.slice(1)) <= maxLevel,
  );
}

export function roleForLevel(level: CurriculumLevel): CurriculumRole {
  return LEVEL_ROLES[level];
}

export type CurriculumFile = {
  version: 1;
  concepts: CurriculumConcept[];
};
