import type { StorybookConfig } from "@storybook/nextjs-vite";
import { mergeConfig } from "vite";

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
    });
  },
};
export default config;
