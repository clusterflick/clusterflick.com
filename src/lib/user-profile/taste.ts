import type { SeenStats } from "@/lib/user-lists/seen-stats";

/**
 * A genre leads the line only if this share of the films with details are
 * it: under a quarter, "mostly" would be wrong.
 */
const GENRE_SHARE = 0.3;
/** A second genre joins the first if it's nearly as common. */
const SECOND_GENRE_RATIO = 0.7;
/** A decade is named only if this share of the dated films are from it. */
const DECADE_SHARE = 0.4;

/**
 * One line of a reader's taste, from the stats their profile already shows:
 * "Mostly drama and crime · Big on the 1990s · 4 Wong Kar-wai films". Each
 * part only where it's true enough to say: a genre most of the films share,
 * a decade a good share are from, and the director seen most, who the stats
 * only rank with two films or more. Null when none of them holds, rather
 * than a line that says nothing.
 *
 * Worked out in the browser from the stats, so it costs the page nothing and
 * changes as the Seen list does.
 */
export function getTasteLine(stats: SeenStats): string | null {
  const parts: string[] = [];

  const [first, second] = stats.genres;
  if (first && first.count >= stats.withDetails * GENRE_SHARE) {
    const genres = [first.name];
    if (second && second.count >= first.count * SECOND_GENRE_RATIO) {
      genres.push(second.name);
    }
    parts.push(
      `Mostly ${genres.map((name) => name.toLowerCase()).join(" and ")}`,
    );
  }

  const dated = stats.decades.reduce((sum, { count }) => sum + count, 0);
  const decade = stats.decades.reduce<(typeof stats.decades)[number] | null>(
    (best, current) => (!best || current.count > best.count ? current : best),
    null,
  );
  if (decade && dated > 0 && decade.count >= dated * DECADE_SHARE) {
    parts.push(`Big on the ${decade.decade}s`);
  }

  const [director] = stats.topDirectors;
  if (director) parts.push(`${director.count} ${director.name} films`);

  return parts.length > 0 ? parts.join(" · ") : null;
}
