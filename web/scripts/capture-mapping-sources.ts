import "dotenv/config";

import { databaseDate } from "./curriculum-data";
import { buildMappingSourceArchive } from "./mapping-source-capture";
import { prisma } from "../src/lib/database/prisma";

async function main() {
  const apply = process.argv.includes("--apply");
  const archive = await buildMappingSourceArchive();
  const bytes = archive.documents.reduce(
    (total, document) => total + document.byteLength,
    0,
  );

  if (!apply) {
    console.log(
      `Dry run: found ${archive.documents.length} mapping source documents (${bytes} bytes) and ${archive.entries.length} Markdown table rows. Re-run with --apply to capture them in PostgreSQL.`,
    );
    return;
  }

  await prisma.$transaction(
    async (transaction) => {
      const [documentCount, entryCount] = await Promise.all([
        transaction.mappingSourceDocument.count(),
        transaction.mappingSourceEntry.count(),
      ]);
      if (documentCount || entryCount) {
        throw new Error(
          "Mapping source tables are not empty. Capture refuses to overwrite archived source evidence.",
        );
      }

      await transaction.mappingSourceDocument.createMany({
        data: archive.documents.map((document, sortOrder) => ({
          path: document.path,
          direction: document.direction,
          hub: document.hub,
          kind: document.kind,
          extension: document.extension,
          content: document.content,
          sha256: document.sha256,
          byteLength: document.byteLength,
          lineCount: document.lineCount,
          tags: document.tags,
          capturedAt: databaseDate(document.capturedAt),
          sortOrder,
        })),
      });

      for (let index = 0; index < archive.entries.length; index += 500) {
        await transaction.mappingSourceEntry.createMany({
          data: archive.entries.slice(index, index + 500).map((entry) => ({
            id: entry.id,
            documentPath: entry.documentPath,
            position: entry.position,
            lineNumber: entry.lineNumber,
            section: entry.section,
            rawText: entry.rawText,
            cells: entry.cells,
            spanish: entry.spanish ?? null,
            english: entry.english ?? null,
            tags: entry.tags,
          })),
        });
      }
    },
    { timeout: 120_000 },
  );

  console.log(
    `Captured ${archive.documents.length} mapping source documents (${bytes} bytes) and ${archive.entries.length} extracted table rows in PostgreSQL.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
