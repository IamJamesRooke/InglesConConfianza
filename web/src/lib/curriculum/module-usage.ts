// Pure half of module-usage — see server/module-usage.ts for the fs-backed
// wrapper. Kept out of "server-only" so it's directly unit-testable.
import type { LessonModule } from "@/lib/lesson-builder/types";

export type ModuleUsageEntry = {
  moduleId: string;
  moduleName: string | null;
  list: "main" | "review";
};

/** Which module(s) require each curriculum concept, from modules[].syllabus
 * — levels are retired, so this is the new "must-teach" signal. A concept
 * can appear more than once (main in one module, review in another). */
export function buildModuleSyllabusUsage(modules: LessonModule[]): Map<string, ModuleUsageEntry[]> {
  const usage = new Map<string, ModuleUsageEntry[]>();

  const record = (
    conceptId: string | null,
    moduleId: string,
    moduleName: string | null,
    list: "main" | "review",
  ) => {
    if (!conceptId) return; // freehand syllabus items aren't real curriculum ids
    const entries = usage.get(conceptId) ?? [];
    entries.push({ moduleId, moduleName, list });
    usage.set(conceptId, entries);
  };

  for (const courseModule of modules) {
    const syllabus = courseModule.syllabus ?? { main: [], review: [] };
    for (const item of syllabus.main) record(item.conceptId, courseModule.id, courseModule.name, "main");
    for (const item of syllabus.review) record(item.conceptId, courseModule.id, courseModule.name, "review");
  }

  return usage;
}
