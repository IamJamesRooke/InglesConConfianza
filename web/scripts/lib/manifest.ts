import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "../../src/lib/database/prisma";

// Shared scaffolding for the curriculum manifest scripts (apply-concept,
// apply-role, add-concepts, untag-concepts, apply-collection). Each script still
// owns its column layout and its writes; this is only the repeated plumbing.

export type ManifestRow = { fields: string[]; line: number; source: string };

// CLI: one or more manifest paths plus an optional --apply flag.
export function manifestArgs(): { apply: boolean; paths: string[] } {
  const apply = process.argv.includes("--apply");
  const paths = process.argv.slice(2).filter((argument) => argument !== "--apply");
  if (paths.length === 0) {
    const script = path.basename(process.argv[1] ?? "manifest script");
    throw new Error(`Usage: tsx scripts/${script} <manifest.tsv> [...] [--apply]`);
  }
  return { apply, paths };
}

// Read TSV rows from every path, dropping blank lines and #-comments. Column
// validation is the caller's job.
export async function readManifestRows(paths: string[]): Promise<ManifestRow[]> {
  const rows: ManifestRow[] = [];
  for (const source of paths) {
    const contents = await readFile(source, "utf8");
    contents.split("\n").forEach((rawLine, index) => {
      const trimmed = rawLine.trim();
      if (trimmed === "" || trimmed.startsWith("#")) return;
      rows.push({ fields: rawLine.split("\t"), line: index + 1, source });
    });
  }
  return rows;
}

// Drop collections that no concept carries any more. Run after any write that
// can orphan a collection.
export async function cleanOrphanCollections(): Promise<void> {
  await prisma.collection.deleteMany({
    where: { conceptMemberships: { none: {} } },
  });
}

// Print the current concept count per curriculum role, sorted.
export async function logRoleCounts(heading = "Role counts are now:"): Promise<void> {
  const counts = await prisma.curriculumConcept.groupBy({
    by: ["curriculumRole"],
    _count: { _all: true },
  });
  console.log(heading);
  for (const count of counts.sort((a, b) =>
    a.curriculumRole.localeCompare(b.curriculumRole),
  )) {
    console.log(`  ${count.curriculumRole.padEnd(12)} ${count._count._all}`);
  }
}

// Standard entrypoint wrapper: run main(), surface the message on failure,
// always disconnect.
export function runScript(main: () => Promise<void>): void {
  main()
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
