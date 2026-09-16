#!/usr/bin/env node
// Lint for src/styles/**/*.css and src/app/globals.css (Phase 3a covered
// only styles/lesson-builder/*.css — see docs/design/lesson-builder-rebuild.md
// Phase 3, docs/design/lesson-builder.md §5; extended to the whole
// stylesheet tree per docs/engineering/cleanup-plan.md section D, after a
// three-way cascade across globals.css/learner-foundations-home.css/
// practice-responsive-overrides.css showed import order silently deciding
// which of several duplicate declarations won). Fails the build on:
//   (a) a top-level selector declared more than once in the same file —
//       media-query overrides are fine (they're a different nesting level
//       and are expected to re-target a selector deliberately).
//   (b) `!important` anywhere outside print.css.
//   (c) a stylesheet under src/styles/ (or src/app/globals.css) that
//       nothing imports.
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
const STYLES_DIR = path.join(ROOT, "src", "styles");
const GLOBALS_CSS = path.join(ROOT, "src", "app", "globals.css");
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

const cssFiles = readdirSync(CSS_DIR)
  .filter((f) => f.endsWith(".css"))
  .sort();

// Every stylesheet under src/styles/ (recursively) plus src/app/globals.css —
// the full set (c) and the duplicate-selector/!important checks (a)/(b) now
// run against, not just styles/lesson-builder/.
const allStyleFiles = [
  ...listFilesRecursive(STYLES_DIR, [".css"]),
  GLOBALS_CSS,
].sort();

// --- (a) duplicate top-level selectors, (b) !important -------------------
for (const full of allStyleFiles) {
  const file = path.relative(ROOT, full);
  const baseName = path.basename(full);
  const source = readFileSync(full, "utf8");

  const stripped = stripComments(source);
  const rules = parseRules(stripped);
  // Compare whole selector-list preludes verbatim, not split into individual
  // comma parts: a rule legitimately reuses one selector inside a bigger
  // group (e.g. ".a, .b { color: red }" alongside ".a { width: 1px }") —
  // that's normal authoring, not the cascade-order bug this check exists
  // for. The bug is the *same* selector (or selector list) declared twice,
  // which relies on file/import order to pick a winner.
  const topLevelCounts = new Map();
  for (const rule of rules) {
    if (rule.depth !== 0 || !rule.prelude || rule.prelude.startsWith("@")) continue;
    const sel = rule.prelude.trim().replace(/\s+/g, " ");
    if (!sel) continue;
    topLevelCounts.set(sel, (topLevelCounts.get(sel) ?? 0) + 1);
  }
  for (const [sel, count] of topLevelCounts) {
    if (count > 1) {
      fail(`${file}: top-level selector "${sel}" is declared ${count} times — merge into one rule.`);
    }
  }

  if (baseName !== "print.css" && /!important/.test(stripped)) {
    // Also allow !important inside an explicit
    // `@media (prefers-reduced-motion: reduce) { ... }` block — the one
    // place it's load-bearing (forcing off animation/transition/scroll
    // that would otherwise come from an inline style or a more specific
    // rule), not a specificity workaround.
    const reducedMotionRanges = [];
    const mediaRe = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{/g;
    let mm;
    while ((mm = mediaRe.exec(stripped))) {
      let depth = 1;
      let i = mm.index + mm[0].length;
      while (i < stripped.length && depth > 0) {
        if (stripped[i] === "{") depth++;
        else if (stripped[i] === "}") depth--;
        i++;
      }
      reducedMotionRanges.push([mm.index, i]);
    }
    const inReducedMotionBlock = (offset) =>
      reducedMotionRanges.some(([start, end]) => offset >= start && offset < end);

    const lineStarts = [0];
    for (let i = 0; i < stripped.length; i++) {
      if (stripped[i] === "\n") lineStarts.push(i + 1);
    }
    const impRe = /!important/g;
    let im;
    while ((im = impRe.exec(stripped))) {
      if (inReducedMotionBlock(im.index)) continue;
      const lineNum = lineStarts.filter((s) => s <= im.index).length;
      fail(
        `${file}:${lineNum}: "!important" is only allowed in print.css or inside an "@media (prefers-reduced-motion: reduce)" block.`,
      );
    }
  }
}

// --- (c) every stylesheet under src/styles/ (and globals.css) is imported -
const allSourceFiles = listFilesRecursive(SRC_DIR, [".ts", ".tsx", ".mjs", ".js"]);
const importedCssPaths = new Set();
for (const file of allSourceFiles) {
  const text = readFileSync(file, "utf8");
  const re = /import\s+["']([^"']+\.css)["']/g;
  let m;
  while ((m = re.exec(text))) {
    // Resolve relative to the importing file so "./x.css" and "@/styles/x.css"
    // both normalize to a path under SRC_DIR comparable to allStyleFiles.
    let importPath = m[1];
    if (importPath.startsWith("@/")) {
      importPath = path.join(SRC_DIR, importPath.slice(2));
    } else if (importPath.startsWith(".")) {
      importPath = path.resolve(path.dirname(file), importPath);
    } else {
      continue; // bare/package import (e.g. "tailwindcss"), not ours to check
    }
    importedCssPaths.add(importPath);
  }
}
for (const full of allStyleFiles) {
  if (!importedCssPaths.has(full)) {
    fail(`${path.relative(ROOT, full)}: not imported anywhere (checked *.ts/*.tsx/*.mjs/*.js under src/).`);
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
