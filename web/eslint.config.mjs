import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Isolated Playwright/UX-check dev servers build into throwaway dirs
    // like this (see docs/ux-checks); never lint their compiled output.
    ".next-ux-check-*/**",
    ".next-verify-*/**",
  ]),
]);

export default eslintConfig;
