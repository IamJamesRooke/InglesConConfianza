import "dotenv/config";

import type { Prisma } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/database/prisma";
import {
  manifestArgs,
  readManifestRows,
  runScript,
  type ManifestRow,
} from "./lib/manifest";

type Op =
  | { kind: "delete"; name: string; reason: string }
  | { kind: "merge"; from: string; into: string; reason: string }
  | { kind: "rename"; from: string; to: string; reason: string };

function parse(rows: ManifestRow[]): Op[] {
  const ops: Op[] = [];
  for (const { fields: parts, line, source } of rows) {
    const where = `${source}:${line}`;
    const verb = parts[0]?.toUpperCase();
    if (verb === "DELETE") {
      if (!parts[1]) throw new Error(`${where}: DELETE needs a collection name.`);
      ops.push({ kind: "delete", name: parts[1], reason: parts[2] ?? "" });
    } else if (verb === "MERGE") {
      if (!parts[1] || !parts[2]) {
        throw new Error(`${where}: MERGE needs <from> <into>.`);
      }
      ops.push({
        kind: "merge",
        from: parts[1],
        into: parts[2],
        reason: parts[3] ?? "",
      });
    } else if (verb === "RENAME") {
      if (!parts[1] || !parts[2]) {
        throw new Error(`${where}: RENAME needs <from> <to>.`);
      }
      ops.push({
        kind: "rename",
        from: parts[1],
        to: parts[2],
        reason: parts[3] ?? "",
      });
    } else {
      throw new Error(`${where}: expected DELETE, MERGE, or RENAME, got "${verb}".`);
    }
  }
  return ops;
}

async function relink(
  transaction: Prisma.TransactionClient,
  from: string,
  to: string,
) {
  await transaction.collection.upsert({
    where: { name: to },
    create: { name: to },
    update: {},
  });
  const fromLinks = await transaction.conceptCollection.findMany({
    where: { collectionName: from },
    select: { conceptId: true, position: true },
  });
  for (const link of fromLinks) {
    const clash = await transaction.conceptCollection.findUnique({
      where: {
        conceptId_collectionName: {
          conceptId: link.conceptId,
          collectionName: to,
        },
      },
    });
    if (clash) {
      // Concept already carries the target; just drop the source link.
      await transaction.conceptCollection.delete({
        where: {
          conceptId_collectionName: {
            conceptId: link.conceptId,
            collectionName: from,
          },
        },
      });
    } else {
      await transaction.conceptCollection.update({
        where: {
          conceptId_collectionName: {
            conceptId: link.conceptId,
            collectionName: from,
          },
        },
        data: { collectionName: to },
      });
    }
  }
  await transaction.collection.delete({ where: { name: from } });
}

async function main() {
  const { apply, paths } = manifestArgs();
  const ops = parse(await readManifestRows(paths));

  const names = await prisma.collection.findMany({ select: { name: true } });
  const existing = new Set(names.map((n) => n.name));

  const counts = await prisma.conceptCollection.groupBy({
    by: ["collectionName"],
    _count: { _all: true },
  });
  const sizeOf = new Map(
    counts.map((c) => [c.collectionName, c._count._all] as const),
  );

  for (const op of ops) {
    if (op.kind === "delete") {
      if (!existing.has(op.name)) {
        console.log(`skip DELETE ${op.name} (absent)`);
        continue;
      }
      console.log(`DELETE ${op.name}  (${sizeOf.get(op.name) ?? 0} links)`);
    } else {
      if (!existing.has(op.from)) {
        console.log(`skip ${op.kind.toUpperCase()} ${op.from} (absent)`);
        continue;
      }
      const target = op.kind === "merge" ? op.into : op.to;
      console.log(
        `${op.kind.toUpperCase()} ${op.from} -> ${target}  (${
          sizeOf.get(op.from) ?? 0
        } links${existing.has(target) ? `, target has ${sizeOf.get(target) ?? 0}` : ", new"})`,
      );
    }
  }

  console.log(`${ops.length} operations ${apply ? "applying" : "(dry run)"}.`);
  if (!apply) return;

  for (const op of ops) {
    if (op.kind === "delete") {
      if (!existing.has(op.name)) continue;
      await prisma.$transaction(async (transaction) => {
        await transaction.conceptCollection.deleteMany({
          where: { collectionName: op.name },
        });
        await transaction.collection.delete({ where: { name: op.name } });
      });
    } else {
      if (!existing.has(op.from)) continue;
      const target = op.kind === "merge" ? op.into : op.to;
      await prisma.$transaction((transaction) => relink(transaction, op.from, target));
    }
  }

  const [collectionCount, linkCount] = await Promise.all([
    prisma.collection.count(),
    prisma.conceptCollection.count(),
  ]);
  console.log(
    `Done. ${collectionCount} collections, ${linkCount} concept links.`,
  );
}

runScript(main);
