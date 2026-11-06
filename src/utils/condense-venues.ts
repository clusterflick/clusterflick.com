import type { UpdateVenue, UpdateVenueGroup } from "./get-updates";

/*
 * Kept apart from get-updates.ts, which reads the diffs from disk: the venue
 * list that calls this is a client component, and importing anything from that
 * module would pull `fs` into the browser bundle. Types only cross over.
 */

/** One item in a condensed venue list: a venue, or several of one chain. */
export type VenueListEntry =
  | { kind: "venue"; venue: UpdateVenue }
  | { kind: "group"; group: UpdateVenueGroup; count: number };

/**
 * Condense a film's venues for a sentence: chains first, as a count each, then
 * the venues that stand alone, cut to `limit` items.
 *
 * A rollout reaches a dozen venues of two or three chains, and naming every one
 * turned each line of "More showings" into a paragraph. "9 Cineworld, 6 Vue,
 * Curzon Bloomsbury and 1 more" says where the film went at a glance; the names
 * are a click away for anyone who wants them. A chain is only counted once it
 * has two venues in the list: one Cineworld is just a venue, and names itself.
 *
 * Chains lead, largest first, because they are the bulk of the reach. The rest
 * keep the order they arrived in. Cutting to a single hidden entry costs a
 * click and saves nothing, so the cut only happens once it hides two.
 */
export function condenseVenues(
  venues: UpdateVenue[],
  limit: number,
): { entries: VenueListEntry[]; hiddenVenues: number; isCondensed: boolean } {
  const groupCounts = new Map<
    string,
    { group: UpdateVenueGroup; count: number }
  >();
  for (const { group } of venues) {
    if (!group) continue;
    const existing = groupCounts.get(group.href);
    if (existing) existing.count += 1;
    else groupCounts.set(group.href, { group, count: 1 });
  }

  const grouped = [...groupCounts.values()]
    .filter(({ count }) => count > 1)
    .sort((a, b) => b.count - a.count);
  const groupedHrefs = new Set(grouped.map(({ group }) => group.href));

  const all: VenueListEntry[] = [
    ...grouped.map(({ group, count }) => ({
      kind: "group" as const,
      group,
      count,
    })),
    ...venues
      .filter(({ group }) => !group || !groupedHrefs.has(group.href))
      .map((venue) => ({ kind: "venue" as const, venue })),
  ];

  const isCut = all.length > limit + 1;
  const entries = isCut ? all.slice(0, limit) : all;
  const shownVenues = entries.reduce(
    (total, entry) => total + (entry.kind === "group" ? entry.count : 1),
    0,
  );

  return {
    entries,
    hiddenVenues: venues.length - shownVenues,
    isCondensed: isCut || grouped.length > 0,
  };
}
