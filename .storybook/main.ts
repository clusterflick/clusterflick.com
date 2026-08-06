import type { StorybookConfig } from "@storybook/nextjs-vite";
import { mergeConfig, type Rollup } from "vite";
import getMetaDataFilename from "../src/utils/get-meta-data-filename";

// The metadata filename is content-hashed, so it changes every time the data is
// reprocessed — CI regenerates it from a fresh release on every run. Resolve it
// from disk exactly as next.config.ts does; a pinned literal goes stale silently,
// because StoryDataLoader catches the resulting 404 and renders a "Failed to load
// data" panel rather than failing a test.
const metaDataFilename = getMetaDataFilename();
if (!metaDataFilename) {
  throw new Error(
    "No data.meta.*.json found in public/data — run `npm run process-combined-data` before building Storybook",
  );
}

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "msw-storybook-addon",
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public", "./static"],
  env: (config) => ({
    ...config,
    NEXT_PUBLIC_DATA_FILENAME: metaDataFilename,
  }),
  async viteFinal(config) {
    return mergeConfig(config, {
      define: {
        "process.env.NEXT_PUBLIC_DATA_FILENAME":
          JSON.stringify(metaDataFilename),
      },
      build: {
        // Suppress sourcemap warnings for Next.js app directory files
        sourcemap: false,
        rollupOptions: {
          // Next.js App Router components carry a "use client" directive that
          // is meaningless to Rollup, which warns that it stripped it (plus a
          // noisy secondary warning about failing to resolve its sourcemap
          // location). Both are harmless — silence them.
          onwarn(
            warning: Rollup.RollupLog,
            defaultHandler: Rollup.LoggingFunction,
          ) {
            if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
            if (
              warning.code === "SOURCEMAP_ERROR" &&
              warning.message.includes("Can't resolve original location")
            ) {
              return;
            }
            defaultHandler(warning);
          },
        },
      },
    });
  },
};
export default config;
