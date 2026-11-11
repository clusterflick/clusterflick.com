import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// The Firestore rules, against the emulator: `npm run test:rules` starts it (it
// needs Java) and runs this inside it. Its own config, not a project in
// vitest.config.ts, because loading that one evaluates .storybook/main.ts,
// which needs the processed data the rules job doesn't download.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.join(dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["firestore-rules/**/*.test.ts"],
    // One emulator, cleared between tests, so the files take turns.
    fileParallelism: false,
  },
});
