import type { CinemaData, Movie, Venue } from "@/types";
import { VENUE_GROUPS } from "@/data/venue-groups";
import {
  DEFAULT_CATEGORIES,
  getPrimaryCategory,
} from "@/lib/filters/modules/categories";
import { getVenueGroupUrl } from "@/utils/get-venue-group-url";
import {
  pickPosters,
  type ProgrammePoster,
} from "@/utils/get-programme-summary";
import { LISTINGS_STATS_DAYS } from "@/utils/get-listings-stats";
import { MS_PER_DAY } from "@/utils/format-date";

export type CinemaGroupListItem = {
  slug: string;
  name: string;
  href: string;
  imagePath: string | null;
  description: string;
  /** Venues the dataset holds for the chain, showing anything or not. */
  venueCount: number;
  /** Films with a showing at the chain in the coming week. */
  films: number;
  /** Their showings at the chain's venues. */
  screenings: number;
  /** Of those films, the ones no venue outside the chain is showing. */
  onlyHere: number;
  posters: ProgrammePoster[];
};

export type CinemaGroupsIndex = {
  /** Chains with something on, most films first. */
  activeGroups: CinemaGroupListItem[];
  /** Chains with nothing on this week, named rather than carded. */
  inactiveGroups: CinemaGroupListItem[];
  /** Every venue in the dataset, chain or not. */
  totalVenues: number;
  /** Every screening in the coming week, chain or not. */
  totalScreenings: number;
};

type FilmWeek = {
  movie: Movie;
  /** Venues showing it in the week. */
  venueIds: Set<string>;
  /** Its showings in the week, per venue. */
  screeningsByVenue: Map<string, number>;
};

/**
 * Everything `/cinema-groups` shows: each chain's coming week by the home
 * page's rule (films in the catalogue's default categories with a showing in
 * the next seven days), and how many of those films nowhere outside the chain
 * is showing. Image paths are passed in, since the page resolves them from
 * the filesystem and the story can't.
 *
 * A chain has no "next screening": one always starts within minutes, so
 * naming it would say nothing. What tells chains apart is what only they are
 * showing, so the posters lead with that, busiest first, and fill up with the
 * chain's busiest films otherwise.
 */
export function getCinemaGroupsIndex(
  data: Pick<CinemaData, "movies" | "venues">,
  venuesByGroup: Map<string, Venue[]>,
  {
    now,
    getImagePath,
  }: { now: number; getImagePath: (slug: string) => string | null },
): CinemaGroupsIndex {
  const end = now + LISTINGS_STATS_DAYS * MS_PER_DAY;

  const week: FilmWeek[] = [];
  let totalScreenings = 0;
  for (const movie of Object.values(data.movies)) {
    if (!DEFAULT_CATEGORIES.includes(getPrimaryCategory(movie))) continue;
    const screeningsByVenue = new Map<string, number>();
    for (const performance of movie.performances) {
      if (performance.time < now || performance.time >= end) continue;
      const venueId = movie.showings[performance.showingId]?.venueId;
      if (!venueId) continue;
      screeningsByVenue.set(venueId, (screeningsByVenue.get(venueId) ?? 0) + 1);
      totalScreenings++;
    }
    if (screeningsByVenue.size === 0) continue;
    week.push({
      movie,
      venueIds: new Set(screeningsByVenue.keys()),
      screeningsByVenue,
    });
  }

  const groups = VENUE_GROUPS.map((group) => {
    const venueIds = new Set(
      (venuesByGroup.get(group.slug) ?? []).map((venue) => venue.id),
    );
    const films = week.flatMap((film) => {
      let screenings = 0;
      for (const [venueId, count] of film.screeningsByVenue) {
        if (venueIds.has(venueId)) screenings += count;
      }
      if (screenings === 0) return [];
      const onlyHere = [...film.venueIds].every((id) => venueIds.has(id));
      return [{ movie: film.movie, screenings, onlyHere }];
    });
    return { group, venueCount: venueIds.size, films };
  }).filter(({ venueCount }) => venueCount > 0);

  // Most films first, so the busiest chains lead and the posters below are
  // picked in the order the cards are read.
  groups.sort(
    (a, b) =>
      b.films.length - a.films.length ||
      a.group.name.localeCompare(b.group.name),
  );

  // Each card prefers films no earlier card has used, as the formats index
  // does: the same releases top every multiplex, and four cards of the same
  // posters would hide what sets the chains apart.
  const usedPosters = new Set<string>();

  const items = groups.map(({ group, venueCount, films }) => {
    const isUsed = (movie: Movie) => (usedPosters.has(movie.id) ? 1 : 0);
    const ordered = [...films]
      .sort(
        (a, b) =>
          Number(b.onlyHere) - Number(a.onlyHere) ||
          isUsed(a.movie) - isUsed(b.movie) ||
          b.screenings - a.screenings ||
          a.movie.title.localeCompare(b.movie.title),
      )
      .map(({ movie }) => movie);
    const posters = pickPosters(ordered);
    for (const movie of ordered.slice(0, posters.length)) {
      usedPosters.add(movie.id);
    }

    return {
      slug: group.slug,
      name: group.name,
      href: getVenueGroupUrl(group),
      imagePath: getImagePath(group.slug),
      description: group.description,
      venueCount,
      films: films.length,
      screenings: films.reduce((total, film) => total + film.screenings, 0),
      onlyHere: films.filter((film) => film.onlyHere).length,
      posters,
    } satisfies CinemaGroupListItem;
  });

  return {
    activeGroups: items.filter((item) => item.films > 0),
    inactiveGroups: items
      .filter((item) => item.films === 0)
      .sort((a, b) => a.name.localeCompare(b.name)),
    totalVenues: Object.keys(data.venues).length,
    totalScreenings,
  };
}
