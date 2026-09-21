import type { Meta, StoryObj } from "@storybook/react";
import { Category, type Venue } from "@/types";
import PlannerLane, { PlannerLaneCard } from ".";

/**
 * `PlannerLane` is a planner strip: a faint lane holding a horizontally
 * scrolling line of `PlannerLaneCard`s, fading whichever edge has more beyond.
 *
 * **When to use:** inside a planner row, film or hour — `PlannerRow` and
 * `PlannerHourRow` both build on it.
 *
 * **When NOT to use:** a row of posters (`PosterRow`), or a grid of showings
 * with room to wrap (the listing page).
 *
 * `PlannerLaneCard` maps one performance to a compact `PerformanceCard` with its
 * venue link, badge and Book button; pass `film` when the lane mixes films.
 */
const meta = {
  title: "Components/PlannerLane",
  component: PlannerLane,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PlannerLane>;

export default meta;
type Story = StoryObj<typeof meta>;

const VENUES = {
  rio: { id: "rio", name: "Rio Cinema" },
} as unknown as Record<string, Venue>;

const MOVIE = {
  title: "Paris, Texas",
  showings: {
    s: {
      id: "s",
      category: Category.Movie,
      url: "https://example.com/rio",
      venueId: "rio",
    },
  },
};

const HOUR = 60 * 60 * 1000;

const cards = (count: number) =>
  Array.from({ length: count }, (_, i) => (
    <PlannerLaneCard
      key={i}
      movie={MOVIE}
      performance={{
        showingId: "s",
        time: Date.now() + (i + 1) * HOUR,
        bookingUrl: "https://example.com/book",
      }}
      venues={VENUES}
      hydrateUrl={(url) => url}
    />
  ));

/** A couple of cards: the lane still reads as a track when nothing scrolls. */
export const Default: Story = {
  args: { children: cards(2) },
};

/** More than fit: the right edge fades, and the left once scrolled. */
export const Overflowing: Story = {
  args: { children: cards(8) },
};
