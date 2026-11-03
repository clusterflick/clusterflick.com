import type { Meta, StoryObj } from "@storybook/react";
import StatsBand from ".";

/**
 * `StatsBand` is a row of large linked figures, for the scale of something at
 * a glance. Each figure counts up from zero once, the first time the band is
 * scrolled into view; the static HTML, and a reader who prefers reduced
 * motion, get the real numbers straight away. Four across on desktop, two by
 * two on a phone.
 *
 * **When to use:** a handful of figures that are the point, each leading to
 * the page that lists what it counts — the home page's week in London.
 *
 * **When NOT to use:** figures inside running text, or a chart of change over
 * time — use `RankedBarChart` or `ReleaseDayBars`. Never for more than four.
 */
const meta = {
  title: "Components/StatsBand",
  component: StatsBand,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof StatsBand>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The home page's week, with the 35mm count picked out. */
export const Default: Story = {
  args: {
    label: "This week in London",
    items: [
      {
        id: "films",
        value: 431,
        label: "Films",
        detail: "showing this week",
        href: "/catalogue",
      },
      {
        id: "screenings",
        value: 16_902,
        label: "Screenings",
        detail: "in the next 7 days",
        href: "/planner",
      },
      {
        id: "venues",
        value: 188,
        label: "Venues",
        detail: "screening, of 504 we track",
        href: "/venues",
      },
      {
        id: "35mm",
        value: 30,
        label: "On 35mm",
        detail: "19 films on celluloid",
        href: "/formats/35mm",
        highlight: true,
      },
    ],
  },
};

/** Three figures, as when nothing is on 35mm this week. */
export const ThreeFigures: Story = {
  args: {
    items: Default.args.items.slice(0, 3),
  },
};
