import { PEOPLE_GROUPS, PeopleFilterId } from "@/lib/filters";

/**
 * The films grid, filtered to one person's credits.
 *
 * This is what a director or cast name links to instead of a page of their own.
 * The reader forms the intent on a film's page — "what else did they do?" — so
 * the name has to be the door; without that the filters are real but
 * undiscoverable.
 *
 * `base=all` rather than the browsing defaults, because this is an "everything
 * by X" link: the today→+7d window and the Films/Multiple/Shorts categories
 * would routinely answer a director with one film three weeks out by showing
 * nothing at all.
 *
 * @throws If the filter id is not one of the people groups — a programming
 *   error rather than bad data, and a link to a filter that does not exist
 *   would fail silently as an empty grid.
 */
export function getPersonFilterUrl(
  filterId: PeopleFilterId,
  personId: string,
): string {
  const group = PEOPLE_GROUPS.find(({ filterId: id }) => id === filterId);
  if (!group) {
    throw new Error(`No people filter group for "${filterId}"`);
  }
  return `/films?base=all&${group.urlParam}=${encodeURIComponent(personId)}`;
}
