export type MappingSourceDocument = {
  path: string;
  direction: string;
  hub: string;
  kind: string;
  extension: string;
  content: string;
  sha256: string;
  byteLength: number;
  lineCount: number;
  tags: string[];
  capturedAt: string;
};

export type MappingSourceEntry = {
  id: string;
  documentPath: string;
  position: number;
  lineNumber: number;
  section: string;
  rawText: string;
  cells: string[];
  spanish?: string;
  english?: string;
  tags: string[];
};

export type MappingSourceArchive = {
  version: 1;
  sourceRoot: "docs/curriculum/mappings";
  documents: MappingSourceDocument[];
  entries: MappingSourceEntry[];
};
