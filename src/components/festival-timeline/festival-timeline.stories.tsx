import type { Meta, StoryObj } from "@storybook/react";
import FestivalTimeline from "@/components/festival-timeline";

const DAY = 86_400_000;
// A fixed date keeps the axis labels stable for visual regression.
const START = Date.UTC(2026, 9, 1);

/**
 * `FestivalTimeline` draws festivals as bars across the coming weeks so
 * overlaps and gaps can be seen at a glance, each name linking to its page.
 * A festival already under way runs off the left edge; one starting after the
 * window is left off with a note.
 *
 * **When to use:**
 * - The festivals index, above the festival cards.
 *
 * **When NOT to use:**
 * - Showtimes for a single film or venue — use the venue calendar or planner.
 */
const meta = {
  title: "Components/FestivalTimeline",
  component: FestivalTimeline,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FestivalTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A busy autumn: one festival under way, overlaps, and a one-night event. */
export const Default: Story = {
  args: {
    start: START,
    highlightId: "bfi-london-film-festival",
    items: [
      {
        id: "frightfest",
        name: "FrightFest",
        href: "/festivals/frightfest",
        dateFrom: START - 2 * DAY,
        dateTo: START + 3 * DAY,
      },
      {
        id: "bfi-london-film-festival",
        name: "BFI London Film Festival",
        href: "/festivals/bfi-london-film-festival",
        dateFrom: START + 7 * DAY,
        dateTo: START + 18 * DAY,
      },
      {
        id: "south-london-film-festival",
        name: "The South London Film Festival",
        href: "/festivals/south-london-film-festival",
        dateFrom: START + 25 * DAY,
        dateTo: START + 26 * DAY,
      },
      {
        id: "the-final-film-festival",
        name: "The Final Film Festival",
        href: "/festivals/the-final-film-festival",
        dateFrom: START + 30 * DAY,
        dateTo: START + 30 * DAY,
      },
    ],
  },
};

/** A festival that runs beyond the window ends square, and one starting after it is noted. */
export const RunsPastWindow: Story = {
  args: {
    start: START,
    items: [
      {
        id: "uk-jewish-film-festival",
        name: "UK Jewish Film Festival",
        href: "/festivals/uk-jewish-film-festival",
        dateFrom: START + 20 * DAY,
        dateTo: START + 120 * DAY,
      },
      {
        id: "bfi-flare",
        name: "BFI Flare",
        href: "/festivals/bfi-flare",
        dateFrom: START + 170 * DAY,
        dateTo: START + 180 * DAY,
      },
    ],
  },
};
