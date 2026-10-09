import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // next/script injects inline scripts at runtime, which the site's
      // hash-based Content-Security-Policy blocks (see scripts/csp.mjs).
      "no-restricted-imports": [
        "error",
        { paths: [{ name: "next/script", message: "Blocked by the site's CSP; see scripts/csp.mjs." }] },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
