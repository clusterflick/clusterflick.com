import {
  getLondonMidnightTimestamp,
  timestampToLondonDateString,
} from "@/utils/format-date";

/**
 * The catalogue opened on what's showing at these venues today — the same view
 * as the "What's on near me today" quick filter in the filter overlay, as a
 * link. It leaves `base` at its default, so the categories (films, shorts,
 * multi-film events) and hide-finished match that preset without being spelt
 * out; only the venues and the day are set.
 *
 * The date is baked in when the link is built, so build it on the client at
 * view time, never at build time.
 */
export function getNearMeTodayUrl(venueIds: string[]): string {
  const today = timestampToLondonDateString(getLondonMidnightTimestamp());
  const venues = venueIds.map(encodeURIComponent).join(",");
  return `/catalogue?venues=${venues}&dateStart=${today}&dateEnd=${today}`;
}
