import type { Meta, StoryObj } from "@storybook/react";
import RankedBarChart from "@/components/ranked-bar-chart";

/**
 * `RankedBarChart` draws a ranked list as horizontal bars, largest first,
 * with the row the story is about in the accent colour.
 *
 * **When to use:**
 * - One item compared against the rest of a set (a borough against every
 *   other borough), where the point is where it falls.
 * - A ranked set of up to ~40 rows with short labels.
 *
 * **When NOT to use:**
 * - Change over time — a line chart reads trends; this reads rank.
 * - Several series per row — this draws one value per row.
 * - A single headline number — state it in the copy.
 */
const meta = {
  title: "Components/RankedBarChart",
  component: RankedBarChart,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RankedBarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const boroughs = [
  { key: "westminster", label: "Westminster", value: 74327 },
  { key: "camden", label: "Camden", value: 47672 },
  { key: "hackney", label: "Hackney", value: 13912 },
  { key: "city-of-london", label: "City of London", value: 5899 },
  { key: "lewisham", label: "Lewisham", value: 88 },
];

/** One row emphasised — the value too small to see still gets a sliver. */
export const Highlighted: Story = {
  args: {
    caption: "Film screenings by borough",
    labelHeading: "Borough",
    valueHeading: "Screenings",
    items: boroughs.map((item) => ({
      ...item,
      href: `/london-cinemas/${item.key}`,
      highlight: item.key === "lewisham",
    })),
  },
};

/** No emphasis and no links: a plain ranked list. */
export const Plain: Story = {
  args: {
    caption: "Film screenings by borough",
    labelHeading: "Borough",
    valueHeading: "Screenings",
    items: boroughs,
  },
};
