import type { StorybookConfig } from "@storybook/nextjs-vite";
import { mergeConfig, type Rollup } from "vite";

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
    // Set the data filename to match the actual file in public/data
    NEXT_PUBLIC_DATA_FILENAME: "data.meta.adeda41fc3.json",
  }),
  async viteFinal(config) {
    return mergeConfig(config, {
      define: {
        "process.env.NEXT_PUBLIC_DATA_FILENAME": JSON.stringify(
          "data.meta.adeda41fc3.json",
        ),
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
