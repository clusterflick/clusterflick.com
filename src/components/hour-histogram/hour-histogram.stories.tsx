import type { Meta, StoryObj } from "@storybook/react";
import HourHistogram from "@/components/hour-histogram";

/**
 * `HourHistogram` counts something by hour of the day, as 24 columns from
 * midnight to midnight.
 *
 * **When to use:**
 * - Showing when in the day something tends to happen, as the data status
 *   page does for releases.
 *
 * **When NOT to use:**
 * - For more than one series: it has no legend or second colour. Draw a
 *   histogram per series instead.
 * - For a trend over days or weeks; that is a line, not a distribution.
 */
const meta = {
  title: "Components/HourHistogram",
  component: HourHistogram,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof HourHistogram>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A morning peak and a spread through the evening. */
export const Default: Story = {
  args: {
    unit: "releases",
    label: "Releases by hour of the day",
    hours: [
      2, 0, 0, 0, 3, 31, 42, 18, 6, 4, 7, 8, 9, 6, 5, 9, 14, 19, 22, 16, 12, 9,
      7, 4,
    ],
  },
};
