import type { Meta, StoryObj } from "@storybook/react";
import { AccessibilityFeature, FormatSource, type Movie } from "@/types";
import type { VenueScheduleDay } from "@/utils/get-venue-schedule";
import VenueScheduleBoard from ".";
import CollapsibleBoard from "./collapsible-board";

/**
 * `VenueScheduleBoard` is the plain-text "on now" board for a venue
 * page — the next 48 hours (today and tomorrow), grouped by day and listed by
 * start time, echoing the schedule screens you see in a cinema lobby.
 *
 * **When to use:**
 * - Near the top of a venue page, to answer "what can I go see, and when" before
 *   the browse-everything poster grid.
 *
 * **When NOT to use:**
 * - For long-range or filterable schedules — link out to the full venue schedule
 *   instead. This board is deliberately just today and tomorrow.
 * - For film discovery by poster — use `PosterRow` / `FilmPosterGrid`.
 */
const meta = {
  title: "Components/VenueScheduleBoard",
  component: VenueScheduleBoard,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof VenueScheduleBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

const TODAY_MIDNIGHT = Date.UTC(2024, 6, 12, 0, 0, 0);
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function movie(id: string, title: string): Movie {
  return {
    id,
    title,
    normalizedTitle: title,
    showings: {},
    performances: [],
  } as Movie;
}

function entry(
  id: string,
  title: string,
  time: number,
  extras: {
    source?: FormatSource;
    accessibility?: AccessibilityFeature[];
    soldOut?: boolean;
  } = {},
) {
  return {
    movie: movie(id, title),
    performance: {
      bookingUrl: "https://example.com/book",
      showingId: `${id}-s0`,
      time,
      ...(extras.source ? { format: { source: extras.source } } : {}),
      ...(extras.accessibility
        ? {
            accessibility: Object.fromEntries(
              extras.accessibility.map((f) => [f, true]),
            ),
          }
        : {}),
      ...(extras.soldOut ? { status: { soldOut: true } } : {}),
    },
  };
}

const POPULATED: VenueScheduleDay[] = [
  {
    label: "Today",
    date: TODAY_MIDNIGHT,
    entries: [
      entry("a", "Perfect Days", TODAY_MIDNIGHT + 12.5 * HOUR),
      entry("b", "The Zone of Interest", TODAY_MIDNIGHT + 15 * HOUR, {
        accessibility: [AccessibilityFeature.Subtitled],
      }),
      entry("c", "Stop Making Sense", TODAY_MIDNIGHT + 18 * HOUR, {
        source: FormatSource.ThirtyFiveMm,
        soldOut: true,
      }),
      entry("d", "Aftersun", TODAY_MIDNIGHT + 20.75 * HOUR),
    ],
  },
  {
    label: "Tomorrow",
    date: TODAY_MIDNIGHT + DAY,
    entries: [
      entry("e", "In the Mood for Love", TODAY_MIDNIGHT + DAY + 14 * HOUR, {
        source: FormatSource.SeventyMm,
      }),
      entry(
        "f",
        "Portrait of a Lady on Fire",
        TODAY_MIDNIGHT + DAY + 19 * HOUR,
        {
          accessibility: [
            AccessibilityFeature.Subtitled,
            AccessibilityFeature.AudioDescription,
          ],
        },
      ),
    ],
  },
];

export const Default: Story = {
  args: {
    days: POPULATED,
    seeAllHref: "/films?venues=example",
  },
};

export const OneDayEmpty: Story = {
  args: {
    days: [
      POPULATED[0],
      { label: "Tomorrow", date: TODAY_MIDNIGHT + DAY, entries: [] },
    ],
    seeAllHref: "/films?venues=example",
  },
};

export const Empty: Story = {
  args: {
    days: [
      { label: "Today", date: TODAY_MIDNIGHT, entries: [] },
      { label: "Tomorrow", date: TODAY_MIDNIGHT + DAY, entries: [] },
    ],
    seeAllHref: "/films?venues=example",
  },
};

const BUSY_TITLES = [
  "Dune: Part Two",
  "Inside Out 2",
  "The Garfield Movie",
  "Kingdom of the Planet of the Apes",
  "IF",
  "Furiosa",
  "The Fall Guy",
  "Kung Fu Panda 4",
  "Bad Boys: Ride or Die",
  "A Quiet Place: Day One",
  "Deadpool & Wolverine",
  "Twisters",
];

/**
 * A large chain with many screens overflows the 750px cap, so the board clips
 * with a fade and a "Show all performances" toggle. `maxHeight` is lowered here
 * to trigger the behaviour with fewer rows.
 */
export const Collapsible: Story = {
  args: {
    days: POPULATED,
    seeAllHref: "/films?venues=example",
  },
  render: (args) => {
    const busyDay = (label: string, dayOffset: number): VenueScheduleDay => ({
      label,
      date: TODAY_MIDNIGHT + dayOffset * DAY,
      entries: BUSY_TITLES.map((title, i) =>
        entry(
          `busy-${dayOffset}-${i}`,
          title,
          TODAY_MIDNIGHT + dayOffset * DAY + (10 + i) * HOUR,
        ),
      ),
    });
    return (
      <CollapsibleBoard maxHeight={320}>
        <VenueScheduleBoard
          {...args}
          days={[busyDay("Today", 0), busyDay("Tomorrow", 1)]}
        />
      </CollapsibleBoard>
    );
  },
};
