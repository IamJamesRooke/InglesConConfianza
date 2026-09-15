#!/usr/bin/env node
// Lint for src/styles/lesson-builder/*.css (Phase 3a — see
// docs/design/lesson-builder-rebuild.md Phase 3, docs/design/lesson-builder.md
// §5). Fails the build on:
//   (a) a top-level selector declared more than once in the same file —
//       media-query overrides are fine (they're a different nesting level
//       and are expected to re-target a selector deliberately).
//   (b) `!important` anywhere outside print.css.
//   (c) a stylesheet under styles/lesson-builder/ that nothing imports.
// Warns (does not fail) on:
//   (d) a class used in a lesson-builder .tsx file with no matching rule in
//       any lesson-builder stylesheet. Noisy by nature (Tailwind utilities,
//       dynamically built class names, shared classes styled elsewhere) —
//       listed for a human to skim, not enforced.
//
// Usage: node scripts/lint-css.mjs   (invoked via `npm run lint:css`)

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSS_DIR = path.join(ROOT, "src", "styles", "lesson-builder");
const SRC_DIR = path.join(ROOT, "src");

let failed = false;
const fail = (msg) => {
  console.error(`✖ ${msg}`);
  failed = true;
};
const warn = (msg) => console.warn(`⚠ ${msg}`);

function listFilesRecursive(dir, exts) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      out.push(...listFilesRecursive(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

// Strip comments, then walk brace-by-brace so we know each rule's prelude
// (selector list) and nesting depth (0 = top level, 1+ = inside @media/etc).
function stripComments(source) {
  // Replace comment bodies with spaces (keeping embedded newlines) so line
  // numbers reported below still line up with the original file.
  return source.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    match.replace(/[^\n]/g, " "),
  );
}

function parseRules(stripped) {
  const rules = [];
  let depth = 0;
  let buf = "";
  for (let i = 0; i < stripped.length; i++) {
    const c = stripped[i];
    if (c === "{") {
      rules.push({ prelude: buf.trim(), depth });
      depth++;
      buf = "";
    } else if (c === "}") {
      depth--;
      buf = "";
    } else {
      buf += c;
    }
  }
  return rules;
}

// Split a selector list on top-level commas only — a comma inside :is(...),
// :where(...), :not(...), etc. does not start a new selector.
function splitSelectorList(prelude) {
  const parts = [];
  let depth = 0;
  let buf = "";
  for (const ch of prelude) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  parts.push(buf);
  return parts;
}

const cssFiles = readdirSync(CSS_DIR)
  .filter((f) => f.endsWith(".css"))
  .sort();

// --- (a) duplicate top-level selectors, (b) !important -------------------
for (const file of cssFiles) {
  const full = path.join(CSS_DIR, file);
  const source = readFileSync(full, "utf8");

  const stripped = stripComments(source);
  const rules = parseRules(stripped);
  const topLevelCounts = new Map();
  for (const rule of rules) {
    if (rule.depth !== 0 || !rule.prelude || rule.prelude.startsWith("@")) continue;
    for (const part of splitSelectorList(rule.prelude)) {
      const sel = part.trim().replace(/\s+/g, " ");
      if (!sel) continue;
      topLevelCounts.set(sel, (topLevelCounts.get(sel) ?? 0) + 1);
    }
  }
  for (const [sel, count] of topLevelCounts) {
    if (count > 1) {
      fail(`${file}: top-level selector "${sel}" is declared ${count} times — merge into one rule.`);
    }
  }

  if (file !== "print.css" && /!important/.test(stripped)) {
    const strippedLines = stripped.split("\n");
    strippedLines.forEach((line, idx) => {
      if (line.includes("!important")) {
        fail(`${file}:${idx + 1}: "!important" is only allowed in print.css.`);
      }
    });
  }
}

// --- (c) every stylesheet under styles/lesson-builder/ is imported -------
const allSourceFiles = listFilesRecursive(SRC_DIR, [".ts", ".tsx", ".mjs", ".js"]);
const importedCssPaths = new Set();
for (const file of allSourceFiles) {
  const text = readFileSync(file, "utf8");
  const re = /import\s+["']([^"']*lesson-builder\/[a-zA-Z0-9-]+\.css)["']/g;
  let m;
  while ((m = re.exec(text))) {
    importedCssPaths.add(path.basename(m[1]));
  }
}
for (const file of cssFiles) {
  if (!importedCssPaths.has(file)) {
    fail(`${file}: not imported anywhere (checked *.ts/*.tsx/*.mjs/*.js under src/).`);
  }
}

// --- (d) classnames used in TSX with no rule anywhere (warning only) -----
const allCssSelectorText = cssFiles
  .map((file) => readFileSync(path.join(CSS_DIR, file), "utf8"))
  .join("\n");

const componentDir = path.join(SRC_DIR, "components", "lesson-builder");
let tsxFiles = [];
try {
  tsxFiles = listFilesRecursive(componentDir, [".tsx"]);
} catch {
  tsxFiles = [];
}

const classNameRe = /className=\{?[`"']([^`"'{}]*)[`"']/g;
const usedClasses = new Set();
for (const file of tsxFiles) {
  const text = readFileSync(file, "utf8");
  let m;
  while ((m = classNameRe.exec(text))) {
    for (const cls of m[1].split(/\s+/)) {
      // Skip Tailwind-shaped utility tokens (contain ':' variants, digits+
      // units, or bracket arbitrary values) — this list is for lesson-
      // builder's own semantic classes, not Tailwind's utility vocabulary.
      if (!cls) continue;
      if (/[:\[\]/]/.test(cls)) continue;
      if (!cls.startsWith("lesson-") && !cls.startsWith("concept-") && !cls.startsWith("module-navigator")) continue;
      usedClasses.add(cls);
    }
  }
}
const missing = [...usedClasses]
  .filter((cls) => !allCssSelectorText.includes(cls))
  .sort();
if (missing.length) {
  warn(`${missing.length} class(es) used in lesson-builder TSX with no rule found in any lesson-builder stylesheet (best-effort scan, expect some noise):`);
  for (const cls of missing) warn(`  .${cls}`);
}

if (failed) {
  console.error("\nlint-css: FAILED");
  process.exit(1);
} else {
  console.log(`lint-css: OK (${cssFiles.length} files checked)`);
}
