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
    alias: [
      { find: "@", replacement: path.join(dirname, "src") },
      // The site builds the packages from their source, as tsconfig.json's
      // `paths` does for Next and Storybook; only the Workers use the
      // published build.
      {
        find: /^@clusterflick\/catalogue\/(.*)$/,
        replacement: path.join(dirname, "packages/catalogue/src/$1"),
      },
      {
        find: /^@clusterflick\/accounts\/(.*)$/,
        replacement: path.join(dirname, "packages/accounts/src/$1"),
      },
    ],
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
          include: [
            "src/**/*.test.ts",
            "packages/*/src/**/*.test.ts",
            "scripts/**/*.test.js",
          ],
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
