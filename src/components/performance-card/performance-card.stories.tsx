import type { Meta, StoryObj } from "@storybook/react";
import {
  AccessibilityFeature,
  FormatDimension,
  FormatPresentation,
  FormatSource,
} from "@/types";
import PerformanceCard, { PerformanceCardActions } from ".";

/**
 * `PerformanceCard` shows one performance of a film: time, venue, screen,
 * accessibility and format tags, and any venue notes.
 *
 * **When to use:** anywhere a single screening is listed — the film's listing
 * page, and the planner's per-film strips (`size="compact"`).
 *
 * **When NOT to use:** to represent a film. The card assumes the film is
 * already established by the page or row around it and never names it, only a
 * venue's own title for the showing when that differs.
 *
 * The card is presentational. Pass `PerformanceCardActions` as its children for
 * the whole-card venue link, the Book button and the Finished/Sold Out badge;
 * leave them out for static, crawler-facing renders.
 */
const meta = {
  title: "Components/PerformanceCard",
  component: PerformanceCard,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ display: "flex", gap: 8, maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PerformanceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const IN_TWO_HOURS = Date.now() + 2 * 60 * 60 * 1000;
const TWO_HOURS_AGO = Date.now() - 2 * 60 * 60 * 1000;

const actions = (status?: "past" | "soldOut") => (
  <PerformanceCardActions
    showingUrl="https://example.com/showing"
    bookingUrl="https://example.com/book"
    venueName="Prince Charles Cinema"
    status={status}
  />
);

/** The listing page's card, filling its grid cell. */
export const Default: Story = {
  args: {
    time: IN_TWO_HOURS,
    venueName: "Prince Charles Cinema",
    screen: "1",
    children: actions(),
  },
};

/** Tags and notes, which the listing page shows in full. */
export const WithTagsAndNotes: Story = {
  args: {
    time: IN_TWO_HOURS,
    venueName: "BFI Southbank",
    screen: "NFT1",
    accessibility: { [AccessibilityFeature.AudioDescription]: true },
    format: {
      source: FormatSource.SeventyMm,
      presentation: FormatPresentation.Imax,
      dimension: FormatDimension.ThreeD,
    },
    notes: "Introduced by the director\nFollowed by a Q&A",
    children: actions(),
  },
};

/** Past performances fade and carry a Finished badge in place of Book. */
export const Past: Story = {
  args: {
    time: TWO_HOURS_AGO,
    venueName: "Prince Charles Cinema",
    status: "past",
    children: actions("past"),
  },
};

/** Sold-out performances fade the same way, with a Sold Out badge. */
export const SoldOut: Story = {
  args: {
    time: IN_TWO_HOURS,
    venueName: "Prince Charles Cinema",
    status: "soldOut",
    children: actions("soldOut"),
  },
};

/** The planner's fixed-width card for a horizontal strip. */
export const Compact: Story = {
  args: {
    time: IN_TWO_HOURS,
    venueName: "Rio Cinema",
    screen: "2",
    size: "compact",
    accessibility: { [AccessibilityFeature.Subtitled]: true },
    notes:
      "Part of the season. Introduced by the programmer, followed by a discussion in the bar afterwards.",
    children: actions(),
  },
};

/**
 * With the film named under the time, for lists that mix films (the planner's
 * by-time view). The film links to its page; the rest of the card to the venue.
 */
export const WithFilm: Story = {
  args: {
    time: IN_TWO_HOURS,
    venueName: "Rio Cinema",
    screen: "1",
    size: "compact",
    film: {
      title: "Apocalypse Now",
      year: "1979",
      posterPath: "/gQB8Y5RCMkv2zwzFHbUJX3kAhvA.jpg",
      href: "/movies/28/apocalypse-now",
    },
    children: actions(),
  },
};

/** Static render: no link, badge or Book button, as crawlers see it. */
export const Static: Story = {
  args: {
    time: IN_TWO_HOURS,
    venueName: "Prince Charles Cinema",
    screen: "1",
  },
};
