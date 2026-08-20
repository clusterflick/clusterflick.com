import type { Meta, StoryObj } from "@storybook/react";
import FilmClubCard from "@/components/film-club-card";

/**
 * `FilmClubCard` renders one film club as a horizontal card — logo, name and
 * the club's film/showing counts — linking to its film club page.
 *
 * It wraps `VenueCard`, so it inherits the standard lift-and-glow hover, and
 * sits alongside `FestivalCard` under the movie page's "Screening as part of".
 * Unlike a festival, a club carries no date range: it runs indefinitely, so the
 * span of its current programme would say nothing about it.
 *
 * **When to use:**
 * - Anywhere a film club is named alongside other content and should read as a
 *   destination: the movie page's "Screening as part of".
 *
 * **When NOT to use:**
 * - Film club *listing* pages — use `EventCard`, which has room for a blurb.
 * - Plain link lists — use `LinkedList` or `LinkGrid`.
 *
 * Counts are always the club's own totals, never scoped to the page you are on,
 * so they match the club page the card leads to.
 */
const meta = {
  title: "Components/FilmClubCard",
  component: FilmClubCard,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FilmClubCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The usual case — a club with a handful of films currently listed. */
export const Default: Story = {
  args: {
    filmClub: {
      id: "bloody-mary-film-club",
      name: "Bloody Mary Film Club",
      imagePath: null,
      movieCount: 4,
      performanceCount: 6,
    },
  },
};

/** A club running a single screening reads in the singular. */
export const SingleScreening: Story = {
  args: {
    filmClub: {
      id: "acton-film-club",
      name: "Acton Film Club",
      imagePath: null,
      movieCount: 1,
      performanceCount: 1,
    },
  },
};
