import type { CinemaData } from "@/types";
import { pruneByPerformances } from "@/utils/prune-movies";

export interface StatusStats {
  /** When the release these figures come from was generated. */
  generatedAt: string;
  /** Venues with at least one showing left, against every venue tracked. */
  venues: { active: number; total: number };
  /**
   * External sources (not venue sites) and how many showings each supplied.
   * `name` falls back to the id for a source the pipeline has added since the
   * site's copy of clusterflick/scripts was last updated.
   */
  sources: Array<{ source: string; name: string; count: number }>;
  events: number;
  showings: number;
}

/**
 * The about page's Status figures, counted at build time from the release the
 * page is built from. They used to be counted in the browser, which meant
 * downloading every listings chunk for four numbers.
 *
 * Performances before `todayMidnight` are dropped first, as the client does
 * when it loads the listings, so on the day of a build these agree with what
 * every other page shows.
 */
export function getStatusStats(
  data: Pick<CinemaData, "generatedAt" | "venues" | "movies">,
  todayMidnight: number,
  sourceNames: Record<string, string>,
): StatusStats {
  // Builds new records rather than editing them, so the shared dataset is
  // left untouched.
  const movies = pruneByPerformances(
    data.movies,
    (performance) => performance.time >= todayMidnight,
  );
  const venueIds = Object.keys(data.venues);
  // Longest first, so "bfi.org.uk-bfi-festivals" wins over a shorter id that
  // happens to prefix it.
  const sourceIds = Object.keys(sourceNames).sort(
    (a, b) => b.length - a.length,
  );

  // Most venues we track are listing something at any given time, but not all —
  // some are seasonal, some go quiet between programmes. Showing the active
  // count against the total says both how much is on and how much we cover.
  const activeVenues = new Set<string>();
  const sourceCounts = new Map<string, number>();
  let showings = 0;

  for (const movie of Object.values(movies)) {
    showings += movie.performances.length;

    for (const [showingId, showing] of Object.entries(movie.showings)) {
      if (showing.venueId in data.venues) activeVenues.add(showing.venueId);

      // Showings scraped from venue sites have IDs starting with {venueId}-
      if (venueIds.some((id) => showingId.startsWith(`${id}-`))) continue;

      // External showing IDs are {sourceId}-{eventSpecificId}. Some source
      // ids end in a dash of their own ("thecliq.app-"), hence startsWith.
      const known = sourceIds.find((id) =>
        showingId.startsWith(id.endsWith("-") ? id : `${id}-`),
      );
      // Otherwise the leading domain. The match is lazy because the event
      // part can itself hold a domain — BFI festival IDs end in the host
      // venue's ("bfi.org.uk-bfi-festivals-<uuid>-curzon.com-…"), and a
      // greedy match counted each of those as a source of its own.
      const source = known ?? showingId.match(/^(.+?\.[a-z]{2,})-/)?.[1];
      if (source) {
        sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
      }
    }
  }

  return {
    generatedAt: data.generatedAt,
    venues: { active: activeVenues.size, total: venueIds.length },
    sources: [...sourceCounts.entries()]
      .map(([source, count]) => ({
        source,
        name: sourceNames[source] ?? source,
        count,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "en-GB")),
    events: Object.keys(movies).length,
    showings,
  };
}
