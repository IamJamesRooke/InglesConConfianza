import { access, appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CurriculumRole } from "@/lib/curriculum/types";

// docs/curation lives at the repo root, one level above the Next.js app
// (`web/`), which is this process's cwd in both `next dev`/`next start` and
// the curation scripts.
const inlineLevelsLogPath = path.join(
  process.cwd(),
  "..",
  "docs",
  "curation",
  "archive",
  "manifests",
  "inline-levels.tsv",
);

const HEADER =
  "# concept-id\trole\treason — appended by the /admin/curriculum \"set level in place\" shortcut (Alt+0..5)\n";

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Appends one `<id>\t<role>\tinline` row to the inline-levels manifest,
// creating the file (with a `#` header, matching every other manifest under
// docs/curation/) the first time a row is set this way.
export async function appendInlineLevelLine(
  conceptId: string,
  role: CurriculumRole,
  filePath: string = inlineLevelsLogPath,
) {
  await mkdir(path.dirname(filePath), { recursive: true });
  if (!(await fileExists(filePath))) {
    await writeFile(filePath, HEADER, "utf8");
  }
  await appendFile(filePath, `${conceptId}\t${role}\tinline\n`, "utf8");
}
