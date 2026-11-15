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
    alias: [
      { find: "@", replacement: path.join(dirname, "src") },
      // As vitest.config.ts: the packages from their source, never a build.
      {
        find: /^@clusterflick\/accounts\/(.*)$/,
        replacement: path.join(dirname, "packages/accounts/src/$1"),
      },
      {
        find: /^@clusterflick\/catalogue\/(.*)$/,
        replacement: path.join(dirname, "packages/catalogue/src/$1"),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["firestore-rules/**/*.test.ts"],
    // One emulator, cleared between tests, so the files take turns.
    fileParallelism: false,
  },
});
