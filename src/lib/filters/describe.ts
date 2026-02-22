import {
  AccessibilityFeature,
  ACCESSIBILITY_NONE,
  Category,
  Genre,
  Venue,
} from "@/types";
import { ACCESSIBILITY_LABELS } from "@/utils/accessibility-labels";
import {
  formatDateShort,
  getLondonMidnightTimestamp,
  getLondonDayOfWeek,
  timestampToLondonDateString,
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
 */
function formatList(
  items: string[],
  maxShow: number,
  overflowSuffix = "",
): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} & ${items[1]}`;

  if (items.length <= maxShow) {
    const allButLast = items.slice(0, -1);
    const last = items[items.length - 1];
    return `${allButLast.join(", ")} & ${last}`;
  }

  // Truncate
  const overflow = items.length - 1;
  const suffix = overflowSuffix ? ` ${overflowSuffix}` : "";
  return `${items[0]} & ${overflow} more${suffix}`;
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

  return formatList(labels, 3, "event types");
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

  return formatList(names, 3);
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

  return `At ${formatList(names, 2)}`;
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

  return formatList(labels, 3);
}

/**
 * Generates a human-readable description of the current filter state.
 */
export function describeFilters(options: DescribeOptions): FilterDescription {
  const { state, categories, venues, genres, cinemaVenueIds, nearbyVenueIds } =
    options;

  // Build events description
  let eventsDesc: string;

  const categoryDesc = describeCategories(state, categories);
  const genreDesc = describeGenres(state, genres);
  const accessibilityDesc = describeAccessibility(state);
  const searchQuery = state.search?.trim();
  const showingTitleQuery = state.showingTitleSearch?.trim();

  // Check if "all events" (all categories, all genres, all accessibility)
  const allCategories = !state.categories;
  const allGenres = !state.genres;
  const allAccessibility = !state.accessibility;

  // Handle no genres or no accessibility selected case
  if (genreDesc === "none") {
    eventsDesc = "No genres selected";
  } else if (accessibilityDesc === "none") {
    eventsDesc = "No accessibility features selected";
  } else if (allCategories && allGenres && allAccessibility) {
    // All categories, all genres, and all accessibility selected
    eventsDesc = "All events";
    if (searchQuery) {
      eventsDesc += ` matching "${searchQuery}"`;
    }
    if (showingTitleQuery) {
      eventsDesc += ` with showing title "${showingTitleQuery}"`;
    }
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

    // Add search suffix
    if (searchQuery) {
      eventsDesc += ` matching "${searchQuery}"`;
    }
    if (showingTitleQuery) {
      eventsDesc += ` with showing title "${showingTitleQuery}"`;
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
  if (state.hideFinished) {
    datesDesc += " and not finished";
  }

  return {
    events: eventsDesc,
    venues: venuesDesc,
    dates: datesDesc,
  };
}
