import type { Movie, Venue } from "@clusterflick/catalogue/types";
import { MS_PER_DAY } from "@clusterflick/catalogue/utils/format-date";
import { LISTINGS_STATS_DAYS } from "./get-listings-stats";

// The lead has to leave room for the synopsis after it in a ~155 character
// description, so it names fewer venues rather than crowd that out.
const MAX_LEAD_LENGTH = 120;

const listFormat = new Intl.ListFormat("en-GB", {
  style: "long",
  type: "conjunction",
});

/**
 * The opening sentence of a film page's meta description: how many venues
 * show it in the coming week, and the busiest of them by name. It's the same
 * week the home page counts (`LISTINGS_STATS_DAYS`), because a venue
 * publishing months ahead would otherwise inflate "this week".
 *
 * Deliberately no next screening time: the page is a build-time snapshot, and
 * a search result keeps showing its snippet for days after the showing has
 * gone. Returns null when nothing is on in the week, so the caller can fall
 * back to wording that makes no claim about it.
 */
export function getMovieSeoLead(
  movie: Pick<Movie, "title" | "showings" | "performances">,
  venues: Record<string, Pick<Venue, "name" | "programming">>,
  now: number,
): string | null {
  const end = now + LISTINGS_STATS_DAYS * MS_PER_DAY;
  const screeningsByVenue = new Map<string, number>();
  for (const performance of movie.performances) {
    if (performance.time < now || performance.time >= end) continue;
    const venueId = movie.showings[performance.showingId]?.venueId;
    if (!venueId || !venues[venueId]) continue;
    screeningsByVenue.set(venueId, (screeningsByVenue.get(venueId) ?? 0) + 1);
  }
  if (screeningsByVenue.size === 0) return null;

  // Busiest first, name as the tie-break so a rebuild gives the same text.
  const ranked = [...screeningsByVenue]
    .sort(
      ([a, countA], [b, countB]) =>
        countB - countA || venues[a].name.localeCompare(venues[b].name),
    )
    .map(([id]) => venues[id]);

  // Many venues listed are pubs, galleries and halls, so "cinemas" only when
  // that is what they all are.
  const place = ranked.every((venue) => venue.programming === "cinema")
    ? "cinema"
    : "venue";

  if (ranked.length === 1) {
    return `${movie.title} is showing at ${ranked[0].name} this week.`;
  }

  const count = `${ranked.length} London ${place}s`;
  for (let n = Math.min(3, ranked.length); n > 0; n--) {
    const names = ranked.slice(0, n).map((venue) => venue.name);
    const lead =
      n === ranked.length
        ? `${movie.title} is showing at ${listFormat.format(names)} this week.`
        : `${movie.title} is showing at ${count} this week, including ${listFormat.format(names)}.`;
    if (lead.length <= MAX_LEAD_LENGTH) return lead;
  }
  return `${movie.title} is showing at ${count} this week.`;
}

/**
 * A venue's area for its page title, or null when the title needn't carry
 * one: the venue is outside the boroughs, or its name already says where it
 * is ("Hackney Picturehouse"; "Curzon Bloomsbury", in Camden, still gets it).
 * A borough named for two places is in the name if either is ("Chelsea"),
 * and one "upon Thames" by its town ("Richmond").
 */
export function getVenueTitleArea(
  venueName: string,
  boroughName: string | null | undefined,
): string | null {
  if (!boroughName) return null;
  const name = venueName.toLowerCase();
  const places = [
    boroughName,
    ...boroughName.replace(/ upon Thames$/, "").split(" and "),
  ];
  return places.some((place) => name.includes(place.toLowerCase()))
    ? null
    : boroughName;
}
