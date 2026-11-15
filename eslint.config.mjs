import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** Firestore's writes, which only `commitUserWrite` may call. */
const FIRESTORE_WRITES =
  "/^(writeBatch|setDoc|updateDoc|deleteDoc|addDoc|runTransaction)$/";
const USE_COMMIT_USER_WRITE =
  "Write a reader's data with commitUserWrite (@/lib/firebase/commit-user-write): it purges their cached public profile, which a direct write leaves showing what it no longer holds.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/firebase/commit-user-write.ts", "src/**/*.test.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        // import { setDoc } from "firebase/firestore/lite"
        {
          selector: `ImportDeclaration[source.value=/^firebase\\/firestore/] > ImportSpecifier[imported.name=${FIRESTORE_WRITES}]`,
          message: USE_COMMIT_USER_WRITE,
        },
        // const { setDoc } = await import("firebase/firestore/lite")
        {
          selector: `VariableDeclarator[init.argument.type="ImportExpression"] > ObjectPattern > Property[key.name=${FIRESTORE_WRITES}]`,
          message: USE_COMMIT_USER_WRITE,
        },
        // (await import("firebase/firestore/lite")).setDoc
        {
          selector: `MemberExpression[object.argument.type="ImportExpression"][property.name=${FIRESTORE_WRITES}]`,
          message: USE_COMMIT_USER_WRITE,
        },
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
    // Storybook build output:
    "storybook-static/**",
    // Mock Service Worker:
    ".storybook/static/mockServiceWorker.js",
    // The packages' published builds:
    "packages/*/dist/**",
  ]),
]);

export default eslintConfig;
