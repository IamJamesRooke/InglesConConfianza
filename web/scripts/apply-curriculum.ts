import "dotenv/config";

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

// One-shot curation batch: detect each manifest's type, run its write, then
// export snapshots, verify, and run db:test — halting on the first failure.
//
//   npm run curriculum:apply <manifest.tsv> [...]            # dry run
//   npm run curriculum:apply <manifest.tsv> [...] --apply     # write the chain

const ROLES = new Set(["core", "supporting", "reference", "trash"]);
const ID = /^[0-9a-z]{10}$/;

type Kind = "concept" | "role" | "add" | "untag" | "collection";

const SCRIPT: Record<Kind, string> = {
  concept: "apply-concept-manifest.ts",
  role: "apply-role-manifest.ts",
  add: "add-concepts.ts",
  untag: "untag-concepts.ts",
  collection: "apply-collection-manifest.ts",
};

function detectKind(manifestPath: string): Kind {
  const firstRow = readFileSync(manifestPath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line !== "" && !line.startsWith("#"));
  if (!firstRow) throw new Error(`${manifestPath}: no data rows.`);
  const f = firstRow.split("\t");

  if (["DELETE", "MERGE", "RENAME"].includes(f[0]?.toUpperCase())) {
    return "collection";
  }
  if (ID.test(f[0] ?? "")) {
    if (f.length <= 3 && ROLES.has(f[1] ?? "")) return "role";
    if ((f[1] ?? "").includes(":") && !ROLES.has(f[3] ?? "")) return "untag";
    if (ROLES.has(f[3] ?? "")) return "concept";
    throw new Error(`${manifestPath}: id-led but unrecognised column shape.`);
  }
  if (ROLES.has(f[4] ?? "")) return "add";
  throw new Error(`${manifestPath}: could not detect manifest type from "${firstRow}".`);
}

function run(script: string, args: string[]): void {
  execFileSync("npx", ["tsx", path.join("scripts", script), ...args], {
    stdio: "inherit",
  });
}

function main(): void {
  const apply = process.argv.includes("--apply");
  const manifests = process.argv.slice(2).filter((a) => a !== "--apply");
  if (manifests.length === 0) {
    throw new Error("Usage: tsx scripts/apply-curriculum.ts <manifest.tsv> [...] [--apply]");
  }

  const plan = manifests.map((manifestPath) => ({
    manifestPath,
    kind: detectKind(manifestPath),
  }));
  for (const { manifestPath, kind } of plan) {
    console.log(`\n### ${kind.toUpperCase()}  ${manifestPath}`);
    run(SCRIPT[kind], [manifestPath]);
  }

  if (!apply) {
    console.log("\nDry run. Re-run with --apply to write and verify the chain.");
    return;
  }

  for (const { manifestPath, kind } of plan) {
    console.log(`\n### apply ${kind}  ${manifestPath}`);
    run(SCRIPT[kind], [manifestPath, "--apply"]);
  }

  console.log("\n### export snapshots");
  run("export-curriculum-snapshots.ts", ["--apply"]);
  console.log("\n### db:verify");
  run("verify-curriculum-database.ts", []);
  console.log("\n### db:test");
  execFileSync("npx", ["tsx", "--test", "tests/curriculum-database.test.ts", "tests/topic-audits.test.ts"], {
    stdio: "inherit",
  });

  console.log(
    [
      "",
      "✓ Applied, exported, verified, tested. Now commit:",
      "",
      "  git add docs/curation/ prisma/seed-data/",
      "  git commit    # summarise the batch; list the manifests:",
      ...manifests.map((m) => `                #   ${path.basename(m)}`),
    ].join("\n"),
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
