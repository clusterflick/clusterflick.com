import { PEOPLE_GROUPS, PeopleFilterId } from "@/lib/filters";

/**
 * The films grid, filtered to one person's credits — what a director or cast
 * name links to instead of a page of their own.
 *
 * `base=all` rather than the browsing defaults, because this is an "everything
 * by X" link: the today→+7d window would routinely answer a director with one
 * film three weeks out by showing nothing.
 */
export function getPersonFilterUrl(
  filterId: PeopleFilterId,
  personId: string,
): string {
  const group = PEOPLE_GROUPS.find(({ filterId: id }) => id === filterId);
  if (!group) throw new Error(`No people filter group for "${filterId}"`);
  return `/catalogue?base=all&${group.urlParam}=${encodeURIComponent(personId)}`;
}
