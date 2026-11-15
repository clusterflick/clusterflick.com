import { defineConfig } from "vitest/config";

/**
 * The package's tests on their own, for its publish workflow: the site's
 * config also loads Storybook, which needs the site's data downloaded. The
 * site's `npm test` runs these same files with everything else.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
