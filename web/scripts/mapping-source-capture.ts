import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import type {
  MappingSourceArchive,
  MappingSourceDocument,
  MappingSourceEntry,
} from "../src/lib/curriculum/mapping-source-types";

export const mappingSourceRoot = "docs/curriculum/mappings" as const;
export const mappingSourceCapturedAt = "2026-08-23";

const repositoryRoot = path.resolve(process.cwd(), "..");

async function listFiles(directory: string): Promise<string[]> {
  const items = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    items.map(async (item) => {
      const itemPath = path.join(directory, item.name);
      return item.isDirectory() ? listFiles(itemPath) : [itemPath];
    }),
  );
  return nested.flat();
}

function unique(values: string[]) {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function filenameTags(filePath: string) {
  const stem = path.basename(filePath, path.extname(filePath));
  return stem
    .replace(/^\d+[-_ ]*/, "")
    .split(/[-_ ]+/)
    .map((value) => value.toLowerCase())
    .filter((value) => value.length > 1);
}

function documentMetadata(filePath: string, absoluteRoot: string, pillar: string) {
  const relativeToRoot = path
    .relative(absoluteRoot, filePath)
    .split(path.sep);
  const first = relativeToRoot[0] ?? "root";
  const direction = [
    "cognates",
    "past-and-past-participle",
    "structure",
    "structure-verb-forms",
    "transformations",
    "vocabulary",
  ].includes(pillar)
    ? "spanish-to-english"
    : first === "english-to-spanish" || first === "spanish-to-english"
      ? first
      : "undirected";
  const hub = pillar === "cognates" || pillar === "transformations"
    ? first
    : pillar === "past-and-past-participle" ||
        pillar === "structure" ||
        pillar === "structure-verb-forms"
      ? first === "README.md"
        ? "root"
        : first
      : pillar === "vocabulary"
        ? path.basename(filePath, path.extname(filePath))
        : direction === "undirected"
          ? "root"
          : (relativeToRoot[1] ?? "root");
  const basename = path.basename(filePath);
  const extension = path.extname(filePath).slice(1).toLowerCase();
  const kind =
    basename === "README.md"
      ? "index"
      : basename === "AGENTS.md" || basename === "DATA-READINESS.md"
        ? "guidance"
        : extension === "json"
          ? "manifest"
          : "mapping-source";
  const tags = unique([
    pillar === "vocabulary"
      ? "vocabulary source"
      : pillar === "transformations"
        ? "transformation source"
        : pillar === "past-and-past-participle"
          ? "past-form source"
        : pillar === "structure"
          ? "structure source"
        : pillar === "structure-verb-forms"
          ? "verb-form source"
        : "mapping source",
    "source archive",
    direction,
    hub,
    kind,
    extension,
    ...filenameTags(filePath),
  ]);
  return { pillar, direction, hub, kind, extension, tags: unique([...tags, pillar]) };
}

function parseTableLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;

  const cells: string[] = [];
  let current = "";
  let escaped = false;
  for (const character of trimmed.slice(1, -1)) {
    if (escaped) {
      current += character;
      escaped = false;
    } else if (character === "\\") {
      current += character;
      escaped = true;
    } else if (character === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  cells.push(current.trim());
  return cells;
}

function isTableSeparator(cells: string[] | null) {
  return Boolean(
    cells &&
      cells.length > 0 &&
      cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, ""))),
  );
}

function normalizedHeader(value: string) {
  return value.replace(/[*_`]/g, "").trim().toLowerCase();
}

function cleanedCell(value: string) {
  return value.replace(/^\*\*(.*)\*\*$/, "$1").replace(/^`(.*)`$/, "$1").trim();
}

function languageIndexes(headers: string[], direction: string) {
  const normalized = headers.map(normalizedHeader);
  let spanish = normalized.findIndex((header) =>
    /^(spanish|español|espanol)$/.test(header),
  );
  let english = normalized.findIndex((header) =>
    /^(english|inglés|ingles)$/.test(header),
  );
  const source = normalized.findIndex((header) => /^(source|source text)$/.test(header));
  const target = normalized.findIndex((header) => /^(target|target text)$/.test(header));

  if (spanish < 0 && english < 0 && source >= 0 && target >= 0) {
    if (direction === "english-to-spanish") {
      english = source;
      spanish = target;
    } else if (direction === "spanish-to-english") {
      spanish = source;
      english = target;
    }
  }
  return { spanish, english };
}

export function extractMappingSourceEntries(
  documentPath: string,
  content: string,
  documentTags: string[],
  direction: string,
) {
  const lines = content.split(/\r?\n/);
  const entries: MappingSourceEntry[] = [];
  let section = "";
  let tableNumber = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const heading = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (heading) section = heading[1].replace(/[*_`]/g, "").trim();

    const headers = parseTableLine(line);
    const separator = parseTableLine(lines[index + 1] ?? "");
    if (!headers || !isTableSeparator(separator)) continue;

    tableNumber += 1;
    const indexes = languageIndexes(headers, direction);
    let rowIndex = index + 2;
    while (rowIndex < lines.length) {
      const rowLine = lines[rowIndex] ?? "";
      const cells = parseTableLine(rowLine);
      if (!cells) break;
      if (!isTableSeparator(cells) && cells.some((cell) => cell.length > 0)) {
        const position = entries.length;
        const spanish = indexes.spanish >= 0 ? cleanedCell(cells[indexes.spanish] ?? "") : "";
        const english = indexes.english >= 0 ? cleanedCell(cells[indexes.english] ?? "") : "";
        entries.push({
          id: `${documentPath}#table-${tableNumber}-row-${position + 1}`,
          documentPath,
          position,
          lineNumber: rowIndex + 1,
          section,
          rawText: rowLine,
          cells,
          ...(spanish ? { spanish } : {}),
          ...(english ? { english } : {}),
          tags: unique([...documentTags, "table row", ...(section ? [section] : [])]),
        });
      }
      rowIndex += 1;
    }
    index = rowIndex - 1;
  }
  return entries;
}

export async function buildSourceArchive(relativeRoot: string, pillar: string): Promise<MappingSourceArchive> {
  const absoluteRoot = path.join(repositoryRoot, relativeRoot);
  const files = (await listFiles(absoluteRoot)).sort((left, right) =>
    left.localeCompare(right),
  );
  const documents: MappingSourceDocument[] = [];
  const entries: MappingSourceEntry[] = [];

  for (const filePath of files) {
    const buffer = await readFile(filePath);
    const content = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    const documentPath = path.relative(repositoryRoot, filePath).split(path.sep).join("/");
    const metadata = documentMetadata(filePath, absoluteRoot, pillar);
    documents.push({
      path: documentPath,
      ...metadata,
      content,
      sha256: createHash("sha256").update(buffer).digest("hex"),
      byteLength: buffer.byteLength,
      lineCount: content.length === 0 ? 0 : content.split(/\r?\n/).length,
      tags: metadata.tags,
      capturedAt: mappingSourceCapturedAt,
    });
    entries.push(
      ...extractMappingSourceEntries(
        documentPath,
        content,
        metadata.tags,
        metadata.direction,
      ),
    );
  }

  return { version: 1, sourceRoot: "docs/curriculum", documents, entries };
}

export async function buildMappingSourceArchive() {
  return buildSourceArchive(mappingSourceRoot, "mappings");
}
