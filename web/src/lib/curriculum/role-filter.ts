// The role/level half of the curriculum `where` clause, pulled out of
// curriculum-store.ts so it can be unit tested without a database (that file
// is server-only and pulls in Prisma). An explicit `role` always wins; with
// `role: "all"`, an optional `maxLevel` narrows to P1..P<maxLevel>; with
// neither, every role (including Unranked/Trash) is included.
import { rolesUpToLevel, type CurriculumLevel, type CurriculumRole } from "@/lib/curriculum/types";

export function curriculumRoleWhere(
  role: CurriculumRole | "all",
  maxLevel?: CurriculumLevel,
):
  | { curriculumRole: CurriculumRole }
  | { curriculumRole: { in: CurriculumRole[] } }
  | Record<string, never> {
  if (role !== "all") return { curriculumRole: role };
  if (maxLevel) return { curriculumRole: { in: rolesUpToLevel(maxLevel) } };
  return {};
}
