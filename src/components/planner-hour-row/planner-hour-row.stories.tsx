import type { Meta, StoryObj } from "@storybook/react";
import { Category, type MoviePerformance, type Venue } from "@/types";
import PlannerHourRow, { PlannerHourGap } from ".";

/**
 * `PlannerHourRow` is one hour of the planner's by-time view: the hour as a
 * heading above a lane of every performance starting in it. Because the lane
 * mixes films, each card names its film with a poster and title.
 *
 * **When to use:** a single-day view grouped by when things start, for a
 * reader who knows when they are free and wants to see what fits.
 *
 * **When NOT to use:** grouping by film — that is `PlannerRow`, where the row's
 * summary names the film and the cards leave it out.
 *
 * `PlannerHourGap` stands in for a run of empty hours between two busy ones.
 */
const meta = {
  title: "Components/PlannerHourRow",
  component: PlannerHourRow,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PlannerHourRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const VENUES = {
  pcc: { id: "pcc", name: "Prince Charles Cinema" },
  rio: { id: "rio", name: "Rio Cinema" },
} as unknown as Record<string, Venue>;

const showings = (venueId: string) => ({
  [`s-${venueId}`]: {
    id: `s-${venueId}`,
    category: Category.Movie,
    url: `https://example.com/${venueId}`,
    venueId,
  },
});

const HOUR = 60 * 60 * 1000;
const BASE = Date.now() + 2 * HOUR;

const item = (
  id: string,
  title: string,
  year: string,
  venueId: string,
  minutes: number,
  posterPath?: string,
) => {
  const performance: MoviePerformance = {
    showingId: `s-${venueId}`,
    time: BASE + minutes * 60 * 1000,
    bookingUrl: "https://example.com/book",
  };
  return {
    movie: { id, title, showings: showings(venueId) },
    performance,
    film: { title, year, posterPath, href: `/movies/${id}/film` },
  };
};

/** A typical evening hour: a few films across a couple of venues. */
export const Default: Story = {
  args: {
    label: "19:00",
    venues: VENUES,
    hydrateUrl: (url) => url,
    items: [
      item(
        "28",
        "Apocalypse Now",
        "1979",
        "pcc",
        0,
        "/gQB8Y5RCMkv2zwzFHbUJX3kAhvA.jpg",
      ),
      item("2", "Film Quiz Night", "", "rio", 15),
      item("3", "Paris, Texas", "1984", "rio", 30),
      item("4", "Stalker", "1979", "pcc", 45),
    ],
  },
};

/**
 * A wide release starting at the same time at several venues collapses to one
 * card with a tab to open the others; its later showing stays its own card.
 */
export const RepeatedFilm: Story = {
  args: {
    label: "18:00",
    venues: VENUES,
    hydrateUrl: (url) => url,
    items: [
      item("5", "Resident Evil", "2026", "pcc", 0),
      item("5", "Resident Evil", "2026", "rio", 0),
      item("5", "Resident Evil", "2026", "pcc", 0),
      item("3", "Paris, Texas", "1984", "rio", 15),
      item("5", "Resident Evil", "2026", "rio", 45),
    ],
  },
};

/**
 * Past the limit the lane ends in "Show more", which opens the next batch in
 * place. Shown here with a limit of 3; the real one is 50.
 */
export const OverLimit: Story = {
  args: {
    label: "20:00",
    venues: VENUES,
    hydrateUrl: (url) => url,
    limit: 3,
    items: Array.from({ length: 8 }, (_, i) =>
      item(`f${i}`, `Film ${i + 1}`, "2026", i % 2 ? "rio" : "pcc", i * 5),
    ),
  },
};

/** A quiet hour with a single showing. */
export const SingleShowing: Story = {
  args: {
    label: "11:00",
    venues: VENUES,
    hydrateUrl: (url) => url,
    items: [item("3", "Paris, Texas", "1984", "rio", 0)],
  },
};

/** The divider standing in for a run of empty hours. */
export const Gap: StoryObj<typeof PlannerHourGap> = {
  render: () => <PlannerHourGap from="15:00" until="19:00" />,
};
