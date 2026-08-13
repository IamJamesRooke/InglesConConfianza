import Database from "better-sqlite3";
import path from "node:path";

// Get the path of the database
const databasePath = path.join(
  process.cwd(),
  "..",
  "database",
  "curriculum.sqlite",
);

// Open the database at the db location
const database = new Database(databasePath);

// Define block type
export type Block = {
  id: number;
  spanish: string;
  english: string;
}

export function getBlocks(): Block[] {
    const statement = database.prepare(
        "SELECT id, spanish, english FROM blocks ORDER BY id",
    );

    return statement.all() as Block[];
}
