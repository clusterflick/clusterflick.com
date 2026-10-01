import { FilterChip, FilterId, FilterState } from "@/lib/filters";

/** The Refine rows, in display order. */
export const REFINE_ROWS = [
  { id: "accessibility", title: "Accessibility" },
  { id: "showings", title: "Showings" },
  { id: "format", title: "Format" },
  { id: "genre", title: "Genre" },
  { id: "ratings", title: "Ratings" },
  { id: "people", title: "Directors & cast" },
  { id: "films", title: "Films" },
  { id: "programmes", title: "Clubs & festivals" },
] as const;

export type RefineRowId = (typeof REFINE_ROWS)[number]["id"];

/**
 * Where a filter's controls live: one of the core sections, or a Refine row.
 * The id is the element to bring into view (a section heading, the search
 * input, or the row).
 */
export type FilterTarget =
  | { kind: "core"; elementId: string }
  | { kind: "row"; row: RefineRowId };

const SEARCH: FilterTarget = { kind: "core", elementId: "filter-search" };
const DATES: FilterTarget = { kind: "core", elementId: "dates-heading" };
const row = (id: RefineRowId): FilterTarget => ({ kind: "row", row: id });

/**
 * Every filter's place in the overlay. A Record over FilterId, so a new filter
 * doesn't compile until it has been given one.
 */
export const FILTER_TARGETS: Record<FilterId, FilterTarget> = {
  [FilterId.Search]: SEARCH,
  [FilterId.ShowingTitleSearch]: SEARCH,
  [FilterId.ShowingUrlSearch]: SEARCH,
  [FilterId.PerformanceNotesSearch]: SEARCH,
  [FilterId.DateRange]: DATES,
  [FilterId.TimeRange]: DATES,
  [FilterId.Venues]: { kind: "core", elementId: "venues-heading" },
  [FilterId.Categories]: { kind: "core", elementId: "events-heading" },
  [FilterId.HideSeen]: { kind: "core", elementId: "hide-seen" },
  [FilterId.Accessibility]: row("accessibility"),
  [FilterId.FormatSource]: row("format"),
  [FilterId.FormatPresentation]: row("format"),
  [FilterId.FormatDimension]: row("format"),
  [FilterId.Genres]: row("genre"),
  [FilterId.LetterboxdRating]: row("ratings"),
  [FilterId.ImdbRating]: row("ratings"),
  [FilterId.RottenTomatoesRating]: row("ratings"),
  [FilterId.Directors]: row("people"),
  [FilterId.Cast]: row("people"),
  [FilterId.Movies]: row("films"),
  [FilterId.FilmClubs]: row("programmes"),
  [FilterId.Festivals]: row("programmes"),
  [FilterId.HideFinished]: row("showings"),
  [FilterId.HideSoldOut]: row("showings"),
};

export type RowStatus = { summary: string; isSet: boolean };

/**
 * Each Refine row's one-line summary, read off the active-filters chips so the
 * row and the strip can never describe a filter differently.
 *
 * Showings is worded on its own: hiding past showings is the default and has
 * no chip, but it is still worth saying what the row is set to.
 */
export function getRowStatuses(
  chips: FilterChip[],
  state: FilterState,
): Record<RefineRowId, RowStatus> {
  const labels = new Map<RefineRowId, string[]>();
  for (const chip of chips) {
    const target = FILTER_TARGETS[chip.filterIds[0]];
    if (target.kind !== "row") continue;
    labels.set(target.row, [...(labels.get(target.row) ?? []), chip.label]);
  }

  const statuses = {} as Record<RefineRowId, RowStatus>;
  for (const { id } of REFINE_ROWS) {
    const rowLabels = labels.get(id) ?? [];
    statuses[id] = {
      summary: rowLabels.length > 0 ? rowLabels.join(" · ") : "Any",
      isSet: rowLabels.length > 0,
    };
  }

  const past = state.hideFinished ? "Hiding past" : "Including past";
  const soldOut = state.hideFinished ? " and sold out" : ", hiding sold out";
  statuses.showings = {
    summary: state.hideSoldOut ? `${past}${soldOut}` : past,
    isSet: !state.hideFinished || state.hideSoldOut,
  };

  return statuses;
}
