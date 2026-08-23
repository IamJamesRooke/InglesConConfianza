import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const sourceRoot = path.resolve(
  process.cwd(),
  "..",
  "docs/curriculum/mappings/english-to-spanish",
);
const ledgerPath = path.resolve(
  process.cwd(),
  "..",
  "docs/curriculum/mappings/english-to-spanish-migration-ledger.json",
);

const dispositions = [
  "pending",
  "migrated",
  "reviewed",
  "non-concept",
  "moved",
] as const;

type Disposition = (typeof dispositions)[number];

type TerminalDisposition = Exclude<Disposition, "pending">;

type LedgerDisposition = {
  disposition: TerminalDisposition;
  destinationIds: string[];
  note: string;
};

type LedgerHub = {
  name: string;
  files: string[];
};

type MigrationLedger = {
  version: 1;
  sourceRoot: "docs/curriculum/mappings/english-to-spanish";
  originalHubCount: number;
  originalFileCount: number;
  hubs: LedgerHub[];
  dispositions: Record<string, LedgerDisposition>;
};

async function walkMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return walkMarkdownFiles(entryPath);
      return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
    }),
  );
  return nested.flat().sort((first, second) => first.localeCompare(second));
}

async function buildLedger(): Promise<MigrationLedger> {
  const entries = await readdir(sourceRoot, { withFileTypes: true });
  const hubNames = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((first, second) => first.localeCompare(second));

  const hubs = await Promise.all(
    hubNames.map(async (name): Promise<LedgerHub> => {
      const files = await walkMarkdownFiles(path.join(sourceRoot, name));
      return {
        name,
        files: files.map((filePath) =>
          path.relative(path.join(sourceRoot, name), filePath),
        ),
      };
    }),
  );

  const rootFiles = (await readdir(sourceRoot, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(sourceRoot, entry.name));
  if (rootFiles.length > 0) {
    hubs.unshift({
      name: "_root",
      files: rootFiles.map((filePath) => path.basename(filePath)),
    });
  }

  return {
    version: 1,
    sourceRoot: "docs/curriculum/mappings/english-to-spanish",
    originalHubCount: hubNames.length,
    originalFileCount: hubs.flatMap((hub) => hub.files).length,
    hubs,
    dispositions: {},
  };
}

function isLedger(value: unknown): value is MigrationLedger {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const ledger = value as Record<string, unknown>;
  if (
    ledger.version !== 1 ||
    ledger.sourceRoot !== "docs/curriculum/mappings/english-to-spanish" ||
    typeof ledger.originalHubCount !== "number" ||
    typeof ledger.originalFileCount !== "number" ||
    !Array.isArray(ledger.hubs) ||
    typeof ledger.dispositions !== "object" ||
    ledger.dispositions === null ||
    Array.isArray(ledger.dispositions)
  ) {
    return false;
  }

  return ledger.hubs.every((hubValue) => {
    if (
      typeof hubValue !== "object" ||
      hubValue === null ||
      Array.isArray(hubValue)
    ) {
      return false;
    }
    const hub = hubValue as Record<string, unknown>;
    return (
      typeof hub.name === "string" &&
      Array.isArray(hub.files) &&
      hub.files.every((fileValue) => typeof fileValue === "string")
    );
  }) &&
    Object.values(
      ledger.dispositions as Record<string, unknown>,
    ).every((dispositionValue) => {
      if (
        typeof dispositionValue !== "object" ||
        dispositionValue === null ||
        Array.isArray(dispositionValue)
      ) {
        return false;
      }
      const disposition = dispositionValue as Record<string, unknown>;
      return (
        typeof disposition.disposition === "string" &&
        disposition.disposition !== "pending" &&
        dispositions.includes(disposition.disposition as Disposition) &&
        Array.isArray(disposition.destinationIds) &&
        disposition.destinationIds.every((id) => typeof id === "string") &&
        typeof disposition.note === "string"
      );
    });
}

async function pathExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadLedger() {
  const value = JSON.parse(await readFile(ledgerPath, "utf8")) as unknown;
  if (!isLedger(value)) throw new Error("The mappings migration ledger is invalid.");
  return value;
}

async function initializeLedger() {
  if (await pathExists(ledgerPath)) {
    throw new Error(`Refusing to overwrite existing ledger: ${ledgerPath}`);
  }
  const ledger = await buildLedger();
  await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
  console.log(
    `Initialized mapping ledger with ${ledger.originalHubCount} hubs and ${ledger.originalFileCount} files.`,
  );
}

async function checkLedger() {
  const ledger = await loadLedger();
  const repositoryRoot = path.resolve(process.cwd(), "..");
  const currentPaths = new Set(
    (await walkMarkdownFiles(sourceRoot)).map((filePath) =>
      path.relative(repositoryRoot, filePath),
    ),
  );
  const ledgerFiles = ledger.hubs.flatMap((hub) =>
    hub.files.map((file) =>
      path.join(
        ledger.sourceRoot,
        ...(hub.name === "_root" ? [] : [hub.name]),
        file,
      ),
    ),
  );
  const ledgerPaths = new Set(ledgerFiles);
  const errors: string[] = [];

  if (ledger.originalFileCount !== ledgerFiles.length) {
    errors.push(
      `Ledger file total is ${ledgerFiles.length}, expected ${ledger.originalFileCount}.`,
    );
  }
  const ledgerHubCount = ledger.hubs.filter((hub) => hub.name !== "_root").length;
  if (ledger.originalHubCount !== ledgerHubCount) {
    errors.push(
      `Ledger hub total is ${ledgerHubCount}, expected ${ledger.originalHubCount}.`,
    );
  }
  if (ledgerPaths.size !== ledgerFiles.length) {
    errors.push("Ledger contains duplicate source paths.");
  }

  for (const currentPath of currentPaths) {
    if (!ledgerPaths.has(currentPath)) {
      errors.push(`Untracked source file: ${currentPath}`);
    }
  }
  for (const filePath of ledgerFiles) {
    const disposition = ledger.dispositions[filePath];
    if (!disposition && !currentPaths.has(filePath)) {
      errors.push(`Pending source file is missing: ${filePath}`);
    }
    if (
      disposition &&
      disposition.destinationIds.length === 0 &&
      disposition.note.trim().length === 0
    ) {
      errors.push(`Disposed file needs a destination ID or note: ${filePath}`);
    }
  }
  for (const dispositionPath of Object.keys(ledger.dispositions)) {
    if (!ledgerPaths.has(dispositionPath)) {
      errors.push(`Disposition references an unknown source: ${dispositionPath}`);
    }
  }

  const counts = Object.fromEntries(
    dispositions.map((disposition) => [
      disposition,
      disposition === "pending"
        ? ledgerFiles.filter((file) => !ledger.dispositions[file]).length
        : ledgerFiles.filter(
            (file) => ledger.dispositions[file]?.disposition === disposition,
          ).length,
    ]),
  ) as Record<Disposition, number>;
  const completedHubs = ledger.hubs.filter(
    (hub) =>
      hub.name !== "_root" &&
      hub.files.every((file) =>
        Boolean(
          ledger.dispositions[
            path.join(ledger.sourceRoot, hub.name, file)
          ],
        ),
      ),
  ).length;

  console.log(`Original hubs: ${ledger.originalHubCount}`);
  console.log(`Completed hubs: ${completedHubs}`);
  console.log(`Original files: ${ledger.originalFileCount}`);
  console.log(`Current files: ${currentPaths.size}`);
  for (const disposition of dispositions) {
    console.log(`${disposition}: ${counts[disposition]}`);
  }

  if (errors.length > 0) {
    for (const error of errors) console.error(`ERROR: ${error}`);
    throw new Error(`Mapping ledger check failed with ${errors.length} error(s).`);
  }
  console.log("Mapping ledger check passed.");
}

async function main() {
  if (process.argv.includes("--initialize")) {
    await initializeLedger();
    return;
  }
  await checkLedger();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
