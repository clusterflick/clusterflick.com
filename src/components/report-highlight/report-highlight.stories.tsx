import type { Meta, StoryObj } from "@storybook/react";
import ReportHighlight from "@/components/report-highlight";

/**
 * `ReportHighlight` singles out one venue in a report: what it stands out
 * for, the number it stands out with, and the venue as a card.
 *
 * **When to use:**
 * - A report section's leader ("winner"), or a venue worth calling out that
 *   isn't the leader ("mention"), such as a multiplex near the top of a
 *   ranking independents usually own.
 *
 * **When NOT to use:**
 * - Listing several venues — use `VenueCard`s in a grid, or a
 *   `RankedBarChart`.
 * - A number with no venue behind it — a stat tile says that.
 */
const meta = {
  title: "Components/ReportHighlight",
  component: ReportHighlight,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ReportHighlight>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Winner: Story = {
  args: {
    title: "Most adventurous programme",
    stat: "86%",
    statLabel: "of screenings were of films at least 25 years old",
    venue: {
      name: "The Nickel",
      href: "/venues/the-nickel",
      type: "Cinema",
      imagePath: null,
    },
  },
};

export const Mention: Story = {
  args: {
    variant: "mention",
    title: "Most international multiplex",
    stat: "1,722",
    statLabel: "screenings of films not in English in two months",
    venue: {
      name: "Cineworld Ilford",
      href: "/venues/cineworld-ilford",
      type: "Cinema",
      imagePath: null,
    },
  },
};
