import type { Meta, StoryObj } from "@storybook/react";
import ReleaseFreshness from "@/components/release-freshness";

/**
 * `ReleaseFreshness` says how long ago the newest dataset release was,
 * counted in the reader's browser, and turns into a warning once that passes
 * `STALE_AFTER_HOURS` (36).
 *
 * **When to use:**
 * - On a page about the published datasets, where a reader wants to know the
 *   data is current: /datasets and /datasets/status.
 *
 * **When NOT to use:**
 * - For anything other than the dataset releases. It reads
 *   `/datasets/latest.json` once mounted, to catch a release newer than the
 *   page's build.
 *
 * The stories are drawn against a release relative to now, since the
 * component reads the reader's clock as soon as it mounts.
 */
const meta = {
  title: "Components/ReleaseFreshness",
  component: ReleaseFreshness,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
    // The release date it names moves with the clock
    chromatic: { disableSnapshot: true },
  },
  tags: ["autodocs"],
  args: {
    latestUrl: null,
  },
} satisfies Meta<typeof ReleaseFreshness>;

export default meta;
type Story = StoryObj<typeof meta>;

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 3_600_000).toISOString();

/** A release a few hours old: the usual state. */
export const Fresh: Story = {
  args: {
    latest: { tag: "20261026.050352", publishedAt: hoursAgo(3) },
    builtAt: hoursAgo(2),
  },
};

/**
 * Past the threshold. The page was built when the release was new, and the
 * browser's clock is what turns it into a warning.
 */
export const Stale: Story = {
  args: {
    latest: { tag: "20261024.050352", publishedAt: hoursAgo(50) },
    builtAt: hoursAgo(49),
  },
};
