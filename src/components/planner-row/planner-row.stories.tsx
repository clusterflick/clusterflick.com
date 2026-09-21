import type { Meta, StoryObj } from "@storybook/react";
import { Category, type MoviePerformance, type Venue } from "@/types";
import PlannerRow from ".";

/**
 * `PlannerRow` is one film's line in the planner: a `MovieSummary` above a
 * horizontal strip of compact `PerformanceCard`s for the day being viewed.
 *
 * **When to use:** a single-day, film-first list, where the reader compares
 * when each candidate film is on without opening a page per film.
 *
 * **When NOT to use:** the listing page, which shows every day's performances
 * for one film and has the room to lay them out as a grid.
 *
 * The strip stops at `limit` (default `PLANNER_ROW_LIMIT`) and ends in a link
 * to the listing page. That is a safety valve for an unfiltered view, not the
 * expected state — with a handful of venues selected it rarely binds.
 */
const meta = {
  title: "Components/PlannerRow",
  component: PlannerRow,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PlannerRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const venue = (id: string, name: string) => ({ id, name }) as unknown as Venue;

const VENUES: Record<string, Venue> = {
  pcc: venue("pcc", "Prince Charles Cinema"),
  rio: venue("rio", "Rio Cinema"),
  bfi: venue("bfi", "BFI Southbank"),
};

const SHOWINGS = {
  "s-pcc": {
    id: "s-pcc",
    category: Category.Movie,
    url: "https://example.com/pcc",
    venueId: "pcc",
  },
  "s-rio": {
    id: "s-rio",
    category: Category.Movie,
    url: "https://example.com/rio",
    venueId: "rio",
  },
  "s-bfi": {
    id: "s-bfi",
    category: Category.Movie,
    url: "https://example.com/bfi",
    venueId: "bfi",
  },
};

const HOUR = 60 * 60 * 1000;
const BASE = Date.now() + HOUR;

const performances = (count: number): MoviePerformance[] =>
  Array.from({ length: count }, (_, i) => ({
    showingId: ["s-pcc", "s-rio", "s-bfi"][i % 3],
    time: BASE + i * 45 * 60 * 1000,
    bookingUrl: "https://example.com/book",
    screen: String((i % 4) + 1),
  }));

const MOVIE = {
  id: "28",
  title: "Apocalypse Now",
  year: "1979",
  classification: "15",
  duration: 8820000,
  posterPath: "/gQB8Y5RCMkv2zwzFHbUJX3kAhvA.jpg",
  showings: SHOWINGS,
};

const baseArgs = {
  movie: MOVIE,
  href: "/movies/28/apocalypse-now",
  venues: VENUES,
  genres: ["Drama", "War"],
  hydrateUrl: (url: string) => url,
};

/** The expected state: a handful of performances across a few venues. */
export const Default: Story = {
  args: { ...baseArgs, performances: performances(4) },
};

/** A single performance — the commonest row by far. */
export const SinglePerformance: Story = {
  args: { ...baseArgs, performances: performances(1) },
};

/** Past the limit the strip ends in a link to the listing page. */
export const Overflowing: Story = {
  args: { ...baseArgs, performances: performances(22), limit: 15 },
};

/** Earlier performances today fade and say Finished; one is sold out. */
export const MixedStatus: Story = {
  args: {
    ...baseArgs,
    performances: [
      {
        showingId: "s-pcc",
        time: Date.now() - 3 * HOUR,
        bookingUrl: "https://example.com/book",
      },
      {
        showingId: "s-rio",
        time: Date.now() + HOUR,
        bookingUrl: "https://example.com/book",
        status: { soldOut: true },
      },
      {
        showingId: "s-bfi",
        time: Date.now() + 3 * HOUR,
        bookingUrl: "https://example.com/book",
        notes: "Introduced by the director, followed by a Q&A in the bar",
      },
    ],
  },
};

/** Mobile is the design target: the strip scrolls, the summary wraps. */
export const Narrow: Story = {
  args: { ...baseArgs, performances: performances(6) },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
};
