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
    // CommonJS CLI scripts (require() is intentional here) and Claude Code
    // skill tooling — not app code, not meant to be linted against Next rules.
    "scripts/**",
    ".agents/**",
    ".claude/**",
  ]),
]);

export default eslintConfig;
