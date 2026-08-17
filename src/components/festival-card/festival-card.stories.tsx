import type { Meta, StoryObj } from "@storybook/react";
import FestivalCard from "@/components/festival-card";

/**
 * `FestivalCard` renders one festival as a horizontal card — logo, name, date
 * range and the festival's film/showing counts — linking to its festival page.
 *
 * It wraps `VenueCard`, so it inherits the standard lift-and-glow hover, and
 * owns the date-range formatting so every surface phrases a run of dates the
 * same way.
 *
 * **When to use:**
 * - Anywhere a festival is named alongside other content and should read as a
 *   destination: the movie page's "Screening as part of", the venue page's
 *   "Festivals".
 *
 * **When NOT to use:**
 * - Festival *listing* pages — use `EventCard`, which has room for a blurb.
 * - Plain link lists — use `LinkedList` or `LinkGrid`.
 *
 * Counts are always the festival's own totals, never scoped to the page you
 * are on, so they match the festival page the card leads to.
 */
const meta = {
  title: "Components/FestivalCard",
  component: FestivalCard,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FestivalCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const dateFrom = new Date("2026-03-18T19:00:00Z").getTime();
const dateTo = new Date("2026-03-29T21:15:00Z").getTime();

/** The usual case — a festival running across a range of dates. */
export const Default: Story = {
  args: {
    festival: {
      id: "bfi-flare",
      name: "BFI Flare",
      imagePath: null,
      movieCount: 42,
      performanceCount: 118,
      dateFrom,
      dateTo,
    },
  },
};

/** A one-day festival shows a single date rather than a range. */
export const SingleDay: Story = {
  args: {
    festival: {
      id: "the-shortest-nights-film-festival",
      name: "The Shortest Nights Film Festival",
      imagePath: null,
      movieCount: 6,
      performanceCount: 6,
      dateFrom,
      dateTo: dateFrom,
    },
  },
};

/** Without performance dates the card falls back to the counts alone. */
export const NoDates: Story = {
  args: {
    festival: {
      id: "kinoteka",
      name: "Kinoteka",
      imagePath: null,
      movieCount: 11,
      performanceCount: 23,
      dateFrom: null,
      dateTo: null,
    },
  },
};
