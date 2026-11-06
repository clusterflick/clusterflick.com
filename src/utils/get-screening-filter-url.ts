import { timestampToLondonDateString } from "@/utils/format-date";

/**
 * A film page's address, filtered to one screening's venue and day — where a
 * screening on a venue's calendar links to, so the page opens on the showing
 * that was clicked rather than every showing across London.
 *
 * `base=all` rather than the browsing defaults: the default event types would
 * hide a quiz or a talk, leaving the page empty for the event just clicked.
 * The day, not the exact time, so a matinee and an evening showing at the
 * same venue are both there to choose between.
 */
export function getScreeningFilterUrl(
  movieUrl: string,
  venueId: string,
  start: number,
): string {
  const url = new URL(movieUrl, "https://clusterflick.com");
  const day = timestampToLondonDateString(start);
  url.searchParams.set("base", "all");
  url.searchParams.set("venues", venueId);
  url.searchParams.set("dateStart", day);
  url.searchParams.set("dateEnd", day);
  return /^[a-z][a-z\d+.-]*:/i.test(movieUrl)
    ? url.toString()
    : `${url.pathname}${url.search}${url.hash}`;
}
