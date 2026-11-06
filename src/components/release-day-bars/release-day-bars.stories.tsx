import type { Meta, StoryObj } from "@storybook/react";
import ReleaseDayBars, {
  type ReleaseDayBarsItem,
} from "@/components/release-day-bars";
import { addDays } from "@/utils/release-status";

/**
 * `ReleaseDayBars` draws a run of days as a row of marks, filled green for a
 * day with at least one release and outlined for a day without.
 *
 * **When to use:**
 * - Showing whether something happened every day over a period, as the data
 *   status page does for each dataset's last 90 days.
 *
 * **When NOT to use:**
 * - For a quantity per day: every day with a release looks the same, and the
 *   count is only in the tooltip. Use a bar chart for magnitude.
 */
const meta = {
  title: "Components/ReleaseDayBars",
  component: ReleaseDayBars,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ReleaseDayBars>;

export default meta;
type Story = StoryObj<typeof meta>;

const days = (releases: (index: number) => number): ReleaseDayBarsItem[] =>
  Array.from({ length: 90 }, (_, index) => ({
    day: addDays("2026-10-26", index - 89),
    releases: releases(index),
  }));

/** A release every day. */
export const EveryDay: Story = {
  args: {
    label: "Data files",
    days: days((index) => 1 + (index % 3)),
  },
};

/** Two days missed, and today's release still to come. */
export const WithGaps: Story = {
  args: {
    label: "Data files",
    days: days((index) =>
      index === 40 || index === 41 || index === 89 ? 0 : 2,
    ),
  },
};
