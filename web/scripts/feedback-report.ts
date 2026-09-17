import { readFileSync } from "node:fs";
import path from "node:path";

import {
  groupFeedback,
  parseFeedbackJsonl,
  renderReportMarkdown,
} from "../src/lib/feedback/report";

// Triage report for the coordinator (docs/engineering/feedback.md):
//
//   npm run feedback:report              # data/feedback.jsonl
//   npm run feedback:report -- some.jsonl
//
// Reads `data/feedback.jsonl` by default and prints a Markdown report
// grouped by module -> lesson -> slide, ending with a summary table.
//
// Feedback storage is moving to Postgres with an /admin/feedback page in a
// later session — this reader stays JSONL-only for now; a DB reader will be
// added alongside that page rather than a CSV import path here.

const argument = process.argv[2];
const filePath = argument
  ? path.resolve(process.cwd(), argument)
  : path.join(process.cwd(), "data", "feedback.jsonl");

let contents: string;
try {
  contents = readFileSync(filePath, "utf8");
} catch {
  console.error(`Could not read ${filePath}`);
  process.exit(1);
}

const records = parseFeedbackJsonl(contents);
const groups = groupFeedback(records);
console.log(renderReportMarkdown(groups));
