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

/** Values written as percentages, with the leader emphasised. */
export const Percentages: Story = {
  args: {
    caption: "Share of screenings of films 25+ years old",
    labelHeading: "Venue",
    valueHeading: "Share",
    formatValue: (value: number) => `${Math.round(value)}%`,
    items: [
      { key: "nickel", label: "The Nickel", value: 85.8, highlight: true },
      { key: "pcc", label: "Prince Charles Cinema", value: 69.4 },
      { key: "close-up", label: "Close-Up Film Centre", value: 68.6 },
    ],
  },
};

/** Each bar split in two, with a legend naming the parts. */
export const Split: Story = {
  args: {
    caption: "Screenings from a physical print, by format",
    labelHeading: "Format",
    valueHeading: "Screenings",
    split: { split: "Everything else", rest: "The Odyssey" },
    items: [
      { key: "35mm", label: "35mm", value: 641, splitValue: 395 },
      { key: "70mm", label: "70mm", value: 347, splitValue: 30 },
      { key: "imax", label: "IMAX 70mm", value: 322, splitValue: 0 },
      { key: "16mm", label: "16mm", value: 24, splitValue: 24 },
      { key: "vhs", label: "VHS", value: 8, splitValue: 8 },
    ],
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
