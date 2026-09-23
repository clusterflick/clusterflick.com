import type { Meta, StoryObj } from "@storybook/react";
import type { Movie } from "@/types";
import type { NearMeVenue, NearMeFilmClub } from "@/utils/get-near-me-data";
import type { LocalVenuesItem } from ".";
import LocalVenues from ".";

/**
 * `LocalVenues` shows the reader's locals — the closest venues with a real week
 * of screenings — each with its next few screenings and the film clubs it
 * hosts. It is the top of the Near Me page and the home page's Near Me section.
 *
 * **When to use:**
 * - To answer "what's on at the places I'd actually go?" for a located reader.
 *   Pick the venues with `getLocalVenues`, which applies the screening floor.
 *
 * **When NOT to use:**
 * - For a single venue's schedule on its own page — use `VenueScheduleBoard`.
 * - For a long list of nearby venues — use `LinkedList` with the distance as
 *   the detail; this card is deliberately heavy and is meant for two or three.
 */
const meta = {
  title: "Components/LocalVenues",
  component: LocalVenues,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof LocalVenues>;

export default meta;
type Story = StoryObj<typeof meta>;

const HOUR = 60 * 60 * 1000;
// Relative to now, so the day labels read Today / Tomorrow / a weekday.
const NOW = Date.now();

function venue(id: string, name: string, imagePath: string | null) {
  return {
    id,
    name,
    href: `/venues/${id}`,
    type: "Cinema",
    imagePath,
    lat: 51.5,
    lon: -0.05,
    boroughSlug: "hackney",
    filmCount: 24,
    performanceCount: 96,
  } satisfies NearMeVenue;
}

function club(id: string, name: string, imagePath: string) {
  return {
    id,
    name,
    href: `/film-clubs/${id}`,
    imagePath,
    seoDescription: null,
    movieCount: 3,
    performanceCount: 3,
    venueIds: [],
  } satisfies NearMeFilmClub;
}

function screening(id: string, title: string, hoursFromNow: number) {
  return {
    movie: {
      id,
      title,
      normalizedTitle: title,
      showings: {},
      performances: [],
    } as Movie,
    performance: {
      bookingUrl: "https://example.com/book",
      showingId: `${id}-s0`,
      time: NOW + hoursFromNow * HOUR,
    },
  };
}

const RIO: LocalVenuesItem = {
  venue: venue(
    "rio-cinema",
    "Rio Cinema",
    "/images/venues/riocinema.org.uk.png",
  ),
  distance: 0.3,
  weekScreeningCount: 38,
  nextScreenings: [
    screening("a", "Perfect Days", 1),
    screening("b", "The Zone of Interest", 3.5),
    screening("c", "Stop Making Sense", 26),
    screening("d", "Aftersun", 29),
    screening("e", "Paris, Texas", 50),
  ],
  filmClubs: [
    club(
      "ghibliotheque",
      "Ghibliotheque",
      "/images/film-clubs/ghibliotheque.jpg",
    ),
    club(
      "jellied-reels",
      "Jellied Reels",
      "/images/film-clubs/jellied-reels.jpg",
    ),
  ],
};

const GENESIS: LocalVenuesItem = {
  venue: venue(
    "genesis-cinema",
    "Genesis Cinema",
    "/images/venues/genesiscinema.co.uk.png",
  ),
  distance: 1.4,
  weekScreeningCount: 112,
  nextScreenings: [
    screening("f", "Dune: Part Two", 0.5),
    screening("g", "Poor Things", 2),
    screening("h", "Anatomy of a Fall", 2.25),
    screening("i", "The Holdovers", 4),
    screening("j", "Past Lives", 5),
  ],
  filmClubs: [],
};

const NO_LOGO: LocalVenuesItem = {
  venue: venue("castle-hall", "Castle Hall Community Cinema", null),
  distance: 0.45,
  weekScreeningCount: 6,
  nextScreenings: [
    screening("k", "The Iron Claw", 20),
    screening("l", "All of Us Strangers", 44),
  ],
  filmClubs: [],
};

/** The usual case: two locals, one hosting film clubs. */
export const TwoLocals: Story = {
  args: { locals: [RIO, GENESIS] },
};

/** A third local within half a mile joins the first two. */
export const ThreeLocals: Story = {
  args: { locals: [RIO, NO_LOGO, GENESIS] },
};

/** A single local, e.g. at the edge of London. */
export const OneLocal: Story = {
  args: { locals: [RIO] },
};
