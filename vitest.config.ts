import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

import { playwright } from "@vitest/browser-playwright";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  resolve: {
    alias: {
      "@": path.join(dirname, "src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        // Plain Node unit tests for pure utilities/domain logic.
        test: {
          name: "unit",
          environment: "node",
          // Set from the processed data at build time (get-venue-count-floor);
          // unit tests run without it, so they get a fixed figure.
          env: { NEXT_PUBLIC_VENUE_COUNT_FLOOR: "500" },
          include: ["src/**/*.test.ts", "scripts/**/*.test.js"],
        },
      },
      {
        extends: true,
        // The Firestore rules, against the emulator: `npm run test:rules`
        // starts it (it needs Java) and runs this project inside it.
        test: {
          name: "rules",
          environment: "node",
          include: ["firestore-rules/**/*.test.ts"],
          // One emulator, cleared between tests, so the files take turns.
          fileParallelism: false,
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
    ],
  },
});
