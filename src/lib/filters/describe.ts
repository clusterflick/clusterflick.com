import {
  AccessibilityFeature,
  ACCESSIBILITY_NONE,
  Category,
  Genre,
  Person,
  Venue,
} from "@/types";
import { ACCESSIBILITY_LABELS } from "@/utils/accessibility-labels";
import {
  FORMAT_GROUPS,
  PEOPLE_GROUPS,
  DAY_START_MINUTES,
  DAY_END_MINUTES,
} from "./modules";
import {
  formatDateShort,
  getLondonMidnightTimestamp,
  getLondonDayOfWeek,
  timestampToLondonDateString,
  minutesToShortTime,
  MS_PER_DAY,
} from "@/utils/format-date";
import { FilterState } from "./types";

/**
 * Options for describing filters
 */
export type DescribeOptions = {
  state: FilterState;
  categories: { value: Category; label: string }[];
  venues: Record<string, Venue> | null;
  genres: Record<string, Genre> | null;
  /** Name lookup for the director and cast filters; without it they go undescribed. */
  people?: Record<string, Person> | null;
  /**
   * Title lookup for the films filter — the loaded dataset. Only films it
   * holds are named or counted; without it the filter goes undescribed.
   */
  movies?: Record<string, { title: string }> | null;
  cinemaVenueIds: string[];
  nearbyVenueIds?: string[]; // Optional: for "Venues Near Me" detection
};

/**
 * Result of describing filters
 */
export type FilterDescription = {
  events: string;
  venues: string;
  dates: string;
};

/**
 * Formats a list of items with proper grammar.
 * - 1 item: "A"
 * - 2 items: "A & B"
 * - 3 items: "A, B & C"
 * - 4+ items with maxShow=2: "A & 3 more"
 *
 * `conjunction` is "or" for every multi-select filter, because they all match a
 * film that satisfies *any* of the selected values — two directors returns the
 * films of either, not the films they made together.
 */
export function formatList(
  items: string[],
  maxShow: number,
  overflowSuffix = "",
  conjunction = "&",
): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

  if (items.length <= maxShow) {
    const allButLast = items.slice(0, -1);
    const last = items[items.length - 1];
    return `${allButLast.join(", ")} ${conjunction} ${last}`;
  }

  // Truncate
  const overflow = items.length - 1;
  const suffix = overflowSuffix ? ` ${overflowSuffix}` : "";
  return `${items[0]} ${conjunction} ${overflow} more${suffix}`;
}

/**
 * Describes the categories/events part of the filter.
 */
function describeCategories(
  state: FilterState,
  categoryLabels: { value: Category; label: string }[],
): string | null {
  const categories = state.categories;

  // null/undefined means all categories selected
  if (!categories) {
    return null; // Will be handled by caller as "All events"
  }

  if (categories.length === 0) {
    return "No events";
  }

  // Get labels for selected categories
  const labels = categories
    .map((cat) => categoryLabels.find((c) => c.value === cat)?.label)
    .filter((label): label is string => !!label);

  return formatList(labels, 3, "event types", "or");
}

/**
 * Describes the genres part of the filter.
 * Returns:
 * - null if all genres selected (no filter)
 * - "none" if no genres selected (empty array)
 * - genre names otherwise
 */
function describeGenres(
  state: FilterState,
  genreLookup: Record<string, Genre> | null,
): string | null | "none" {
  const genres = state.genres;

  // null/undefined means all genres (no filter)
  if (!genres || !genreLookup) {
    return null;
  }

  // Empty array means no genres selected
  if (genres.length === 0) {
    return "none";
  }

  // Get names for selected genres
  const names = genres
    .map((id) => genreLookup[id]?.name)
    .filter((name): name is string => !!name);

  if (names.length === 0) {
    return "none";
  }

  return formatList(names, 3, "", "or");
}

/**
 * Checks if selected venues match all venues in a specific group.
 * Returns the group name if matched, null otherwise.
 */
function matchVenueGroup(
  selectedVenueIds: string[],
  venueLookup: Record<string, Venue>,
): string | null {
  if (selectedVenueIds.length === 0) return null;

  // Group all venues by their groupName
  const venuesByGroup = new Map<string, string[]>();
  for (const venue of Object.values(venueLookup)) {
    if (venue.structure === "group" && venue.groupName) {
      const existing = venuesByGroup.get(venue.groupName) || [];
      existing.push(venue.id);
      venuesByGroup.set(venue.groupName, existing);
    }
  }

  // Check if the selection matches any complete group
  const selectedSet = new Set(selectedVenueIds);
  for (const [groupName, groupVenueIds] of venuesByGroup) {
    if (
      groupVenueIds.length > 1 &&
      groupVenueIds.length === selectedVenueIds.length
    ) {
      const allMatch = groupVenueIds.every((id) => selectedSet.has(id));
      if (allMatch) {
        return groupName;
      }
    }
  }

  return null;
}

/**
 * Describes the venues part of the filter.
 */
function describeVenues(
  state: FilterState,
  venueLookup: Record<string, Venue> | null,
  cinemaVenueIds: string[],
  nearbyVenueIds?: string[],
): string {
  const venues = state.venues;

  // null/undefined means all venues
  if (!venues) {
    return "At all venues";
  }

  if (venues.length === 0) {
    return "No venues selected";
  }

  // Check if the selection matches cinema venues exactly
  if (cinemaVenueIds.length > 0 && venues.length === cinemaVenueIds.length) {
    const isCinemas = venues.every((id) => cinemaVenueIds.includes(id));
    if (isCinemas) {
      return "At Cinemas";
    }
  }

  // Check if the selection matches nearby venues exactly
  if (
    nearbyVenueIds &&
    nearbyVenueIds.length > 0 &&
    venues.length === nearbyVenueIds.length
  ) {
    const isNearby = venues.every((id) => nearbyVenueIds.includes(id));
    if (isNearby) {
      return "At Venues Near Me";
    }
  }

  if (!venueLookup) {
    return `At ${venues.length} venues`;
  }

  // Check if selection matches a complete venue group (e.g., all Everyman venues)
  const groupMatch = matchVenueGroup(venues, venueLookup);
  if (groupMatch) {
    return `At all ${groupMatch}`;
  }

  // Get venue names
  const names = venues
    .map((id) => venueLookup[id]?.name)
    .filter((name): name is string => !!name)
    // Shorten venue names by removing common prefixes
    .map(
      (name) =>
        name
          .replace(
            /^(Curzon|Picturehouse|Everyman|Vue|Odeon|Cineworld|ODEON)\s*/i,
            "",
          )
          .replace(/\s*(Picturehouse|Cinema)$/i, "")
          .trim() || name,
    );

  if (names.length === 0) {
    return `At ${venues.length} venues`;
  }

  return `At ${formatList(names, 2, "", "or")}`;
}

/**
 * Detects if a date range matches a known preset using timestamp comparisons.
 */
function matchDatePreset(range: {
  start: number | null;
  end: number | null;
}): string | null {
  const { start, end } = range;
  if (start === null || end === null) return null;

  const todayMidnight = getLondonMidnightTimestamp();
  const dayOfWeek = getLondonDayOfWeek();

  // Today
  if (start === todayMidnight && end === todayMidnight) {
    return "Showing Today";
  }

  // Tomorrow
  const tomorrowMidnight = todayMidnight + MS_PER_DAY;
  if (start === tomorrowMidnight && end === tomorrowMidnight) {
    return "Showing Tomorrow";
  }

  // This Week (today to Sunday)
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const endOfWeekMidnight = todayMidnight + daysUntilSunday * MS_PER_DAY;
  if (start === todayMidnight && end === endOfWeekMidnight) {
    return "Showing This Week";
  }

  // Next 7 Days
  const next7Midnight = todayMidnight + 7 * MS_PER_DAY;
  if (start === todayMidnight && end === next7Midnight) {
    return "Showing in Next 7 Days";
  }

  // This Weekend
  let saturdayOffset: number;
  let sundayOffset: number;
  if (dayOfWeek === 0) {
    saturdayOffset = -1;
    sundayOffset = 0;
  } else if (dayOfWeek === 6) {
    saturdayOffset = 0;
    sundayOffset = 1;
  } else {
    saturdayOffset = 6 - dayOfWeek;
    sundayOffset = 7 - dayOfWeek;
  }
  const saturdayMidnight = todayMidnight + saturdayOffset * MS_PER_DAY;
  const sundayMidnight = todayMidnight + sundayOffset * MS_PER_DAY;
  if (start === saturdayMidnight && end === sundayMidnight) {
    return "Showing This Weekend";
  }

  // Any Time (~5 years)
  const allTimeEnd = todayMidnight + 5 * 365 * MS_PER_DAY;
  if (start === todayMidnight && end === allTimeEnd) {
    return "Showing Any Time";
  }

  return null;
}

/**
 * Describes the date range part of the filter.
 */
function describeDateRange(state: FilterState): string {
  const range = state.dateRange;

  if (!range) {
    return "Showing any time";
  }

  // Check for preset match
  const preset = matchDatePreset(range);
  if (preset) {
    return preset;
  }

  // Custom range - convert timestamps to strings for display
  const formatOpts = { includeYearIfDifferent: true };

  if (range.start !== null && range.end !== null) {
    const startStr = timestampToLondonDateString(range.start);
    const endStr = timestampToLondonDateString(range.end);
    if (range.start === range.end) {
      return `Showing on ${formatDateShort(startStr, formatOpts)}`;
    }
    return `Showing ${formatDateShort(startStr, formatOpts)} - ${formatDateShort(endStr, formatOpts)}`;
  }

  if (range.start !== null) {
    return `Showing from ${formatDateShort(timestampToLondonDateString(range.start), formatOpts)}`;
  }

  if (range.end !== null) {
    return `Showing until ${formatDateShort(timestampToLondonDateString(range.end), formatOpts)}`;
  }

  return "Showing any time";
}

/**
 * Describes the time-of-day part of the filter.
 * Returns null when no time filter is applied (the full day).
 */
function describeTimeRange(state: FilterState): string | null {
  const range = state.timeRange;
  if (!range) return null;

  const { start, end } = range;
  if (start === DAY_START_MINUTES && end === DAY_END_MINUTES) {
    return null;
  }

  if (start === DAY_START_MINUTES) {
    return `before ${minutesToShortTime(end)}`;
  }
  if (end === DAY_END_MINUTES) {
    return `after ${minutesToShortTime(start)}`;
  }
  return `${minutesToShortTime(start)} to ${minutesToShortTime(end)}`;
}

/**
 * Describes the accessibility part of the filter.
 * Returns:
 * - null if no filter applied (all included)
 * - "none" if no features selected (empty array)
 * - formatted feature names otherwise
 */
function describeAccessibility(state: FilterState): string | null | "none" {
  const accessibility = state.accessibility;

  // null/undefined means no filter
  if (!accessibility) {
    return null;
  }

  // Empty array means none selected
  if (accessibility.length === 0) {
    return "none";
  }

  // Get labels for selected features
  const labels = accessibility.map((value) => {
    if (value === ACCESSIBILITY_NONE) return "No accessibility";
    return ACCESSIBILITY_LABELS[value as AccessibilityFeature] ?? value;
  });

  return formatList(labels, 3, "", "or");
}

/**
 * Describes the director and cast filters as clauses to append to the events
 * description ("directed by Martin Scorsese"), not standalone ones.
 */
function describePeople(
  state: FilterState,
  peopleLookup: Record<string, Person> | null | undefined,
): string[] {
  if (!peopleLookup) return [];

  const phrases: string[] = [];
  for (const group of PEOPLE_GROUPS) {
    const selected = state[group.filterId];
    if (!selected || selected.length === 0) continue;

    const names = selected
      .map((id) => peopleLookup[id]?.name)
      .filter((name): name is string => !!name);
    if (names.length === 0) continue;

    phrases.push(`${group.verb} ${formatList(names, 2, "people", "or")}`);
  }

  return phrases;
}

/**
 * Describes the films filter as a clause to append to the events description:
 * `"Alien" or "Heat"` by name while that reads as a sentence, a count beyond.
 *
 * Counts only the films the dataset holds. The rest of a selection — a
 * watchlist's films that have finished their run — stays in the state for when
 * they come back, but saying "12 films" over a grid of three would read as a
 * bug. A selection holding none of them still restricts to nothing, so it is
 * said as such rather than left out.
 */
function describeMovies(
  state: FilterState,
  moviesLookup: Record<string, { title: string }> | null | undefined,
): string | null {
  const selected = state.movies;
  if (!moviesLookup || !selected || selected.length === 0) return null;

  const titles = selected
    .map((id) => moviesLookup[id]?.title)
    .filter((title): title is string => !!title);

  if (titles.length === 0) return "from films not currently showing";
  if (titles.length <= 2) {
    return `for ${formatList(
      titles.map((title) => `"${title}"`),
      2,
      "",
      "or",
    )}`;
  }
  return `from ${titles.length} selected films`;
}

/**
 * Describes the format filters (source / presentation / dimension).
 * - `emptyTitle`: title of the first group with nothing selected (no matches)
 * - `labels`: selected option labels across all active groups
 */
function describeFormats(state: FilterState): {
  emptyTitle: string | null;
  labels: string[];
} {
  let emptyTitle: string | null = null;
  const labels: string[] = [];

  for (const group of FORMAT_GROUPS) {
    const value = state[group.filterId];
    // null means all selected (no filter)
    if (!value) continue;
    // Empty array means nothing selected — no performances match
    if (value.length === 0) {
      if (!emptyTitle) emptyTitle = group.title;
      continue;
    }
    for (const selectedValue of value) {
      const label = group.options.find(
        (option) => option.value === selectedValue,
      )?.label;
      if (label) labels.push(label);
    }
  }

  return { emptyTitle, labels };
}

/**
 * Generates a human-readable description of the current filter state.
 */
export function describeFilters(options: DescribeOptions): FilterDescription {
  const {
    state,
    categories,
    venues,
    genres,
    people,
    movies,
    cinemaVenueIds,
    nearbyVenueIds,
  } = options;

  // Build events description
  let eventsDesc: string;
  // A dimension with nothing selected returns no events at all, so the
  // clauses below have nothing to qualify — they are suppressed rather than
  // hung off "No genres selected".
  let selectionIsEmpty = false;

  const categoryDesc = describeCategories(state, categories);
  const genreDesc = describeGenres(state, genres);
  const accessibilityDesc = describeAccessibility(state);
  const { emptyTitle: formatEmptyTitle, labels: formatLabels } =
    describeFormats(state);
  const peoplePhrases = describePeople(state, people);
  const moviesPhrase = describeMovies(state, movies);
  const searchQuery = state.search?.trim();
  const showingTitleQuery = state.showingTitleSearch?.trim();
  const performanceNotesQuery = state.performanceNotesSearch?.trim();

  // Check if "all events" (all categories, genres, accessibility, and formats)
  const allCategories = !state.categories;
  const allGenres = !state.genres;
  const allAccessibility = !state.accessibility;
  const allFormats = FORMAT_GROUPS.every((group) => !state[group.filterId]);
  const allPeople = peoplePhrases.length === 0;
  const allMovies = moviesPhrase === null;

  // Handle no genres / accessibility / format values selected case
  if (genreDesc === "none") {
    eventsDesc = "No genres selected";
    selectionIsEmpty = true;
  } else if (accessibilityDesc === "none") {
    eventsDesc = "No accessibility features selected";
    selectionIsEmpty = true;
  } else if (formatEmptyTitle) {
    eventsDesc = `No ${formatEmptyTitle} selected`;
    selectionIsEmpty = true;
  } else if (
    allCategories &&
    allGenres &&
    allAccessibility &&
    allFormats &&
    allPeople &&
    allMovies
  ) {
    // All categories, genres, accessibility, formats and people selected
    eventsDesc = "All events";
  } else {
    const parts: string[] = [];

    // Add genre prefix if specific genres selected
    if (genreDesc) {
      parts.push(`${genreDesc} Genre`);
    }

    // Add category description
    if (categoryDesc) {
      parts.push(categoryDesc);
    } else if (allCategories) {
      parts.push("Events");
    }

    eventsDesc = parts.join(" ");

    // Add accessibility suffix if specific features selected
    if (accessibilityDesc && accessibilityDesc !== "none") {
      eventsDesc += ` with ${accessibilityDesc}`;
    }

    // Add format suffix if specific formats selected
    if (formatLabels.length > 0) {
      eventsDesc += ` in ${formatList(formatLabels, 3, "", "or")}`;
    }
  }

  // Appended once rather than per branch: these read as clauses on whatever the
  // branches settled on, whether that is "All events" or "Films".
  if (!selectionIsEmpty) {
    if (moviesPhrase) {
      eventsDesc += ` ${moviesPhrase}`;
    }
    if (peoplePhrases.length > 0) {
      eventsDesc += ` ${peoplePhrases.join(" and ")}`;
    }
    if (searchQuery) {
      eventsDesc += ` matching "${searchQuery}"`;
    }
    if (showingTitleQuery) {
      eventsDesc += ` with showing title "${showingTitleQuery}"`;
    }
    if (performanceNotesQuery) {
      eventsDesc += ` with notes "${performanceNotesQuery}"`;
    }
  }

  // Build venues description
  const venuesDesc = describeVenues(
    state,
    venues,
    cinemaVenueIds,
    nearbyVenueIds,
  );

  // Build dates description
  let datesDesc = describeDateRange(state);
  const timeDesc = describeTimeRange(state);
  if (timeDesc) {
    datesDesc += `, ${timeDesc}`;
  }
  // Availability toggles ride along with the dates, since both narrow which
  // performances survive rather than which films do. Hiding finished showings
  // is the default, so it goes unsaid; only turning it off is worth a mention.
  if (state.hideSoldOut) datesDesc += " and not sold out";
  if (!state.hideFinished) datesDesc += ", including finished";

  return {
    events: eventsDesc,
    venues: venuesDesc,
    dates: datesDesc,
  };
}
