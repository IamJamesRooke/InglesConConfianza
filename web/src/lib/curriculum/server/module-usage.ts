import "server-only";

import { buildModuleSyllabusUsage, type ModuleUsageEntry } from "@/lib/curriculum/module-usage";
import { readLessonFile } from "@/lib/lesson-builder/server/lesson-store";

export type { ModuleUsageEntry };

export async function readModuleSyllabusUsage(): Promise<Map<string, ModuleUsageEntry[]>> {
  const file = await readLessonFile();
  return buildModuleSyllabusUsage(file.modules);
}
