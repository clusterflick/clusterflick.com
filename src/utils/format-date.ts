/**
 * Centralized date and time formatting utilities.
 * All date display formats should be defined here for consistency.
 *
 * IMPORTANT: All date calculations for filtering and display use London time
 * to ensure consistency for users in any timezone viewing London cinema times.
 */

/**
 * The timezone used for all date calculations.
 * All showings are in London, so we use London time consistently.
 */
export const LONDON_TIMEZONE = "Europe/London";

/**
 * Milliseconds in a day. Used for date arithmetic.
 */
export const MS_PER_DAY = 86400000;

/**
 * Convert a Date to a YYYY-MM-DD string in the London timezone.
 *
 * Why en-CA? We need ISO 8601 format (YYYY-MM-DD) for string comparisons and
 * HTML date inputs. We can't use toISOString() because it converts to UTC first,
 * which would give wrong dates for late-night London times. The en-CA locale
 * natively formats dates as YYYY-MM-DD, giving us the correct London date.
 */
function formatAsLondonDateString(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: LONDON_TIMEZONE });
}

/**
 * Get midnight London time for today as a UTC timestamp.
 * This is the primary function for date range filtering.
 */
export function getLondonMidnightTimestamp(): number {
  // Get today's date in London as YYYY-MM-DD, then convert to timestamp
  const londonDateStr = formatAsLondonDateString(new Date());
  return dateStringToLondonTimestamp(londonDateStr);
}

/**
 * Get the day of the week (0 = Sunday, 6 = Saturday) for the current London date.
 */
export function getLondonDayOfWeek(): number {
  const now = new Date();
  // Get the weekday in London
  const weekdayStr = now.toLocaleDateString("en-US", {
    timeZone: LONDON_TIMEZONE,
    weekday: "short",
  });
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return weekdayMap[weekdayStr] ?? 0;
}

/**
 * Convert a timestamp to a London date string (YYYY-MM-DD).
 */
export function timestampToLondonDateString(timestamp: number): string {
  return formatAsLondonDateString(new Date(timestamp));
}

/**
 * Convert a YYYY-MM-DD date string to a timestamp representing the start of that day
 * in London timezone. This is used for efficient date range filtering - converting
 * boundary dates to timestamps once, then doing fast numeric comparisons.
 *
 * Note: This returns the timestamp for midnight London time on that date.
 * For end-of-range comparisons, add 24 hours (86400000ms) and use < instead of <=.
 */
export function dateStringToLondonTimestamp(dateString: string): number {
  // Parse the date parts
  const [year, month, day] = dateString.split("-").map(Number);

  // Create a date at noon UTC on this date (noon avoids DST edge cases during construction)
  const noonUtc = Date.UTC(year, month - 1, day, 12, 0, 0, 0);

  // Get the UTC offset for London at this time
  // We format a date at this time and extract the offset from it
  const testDate = new Date(noonUtc);
  const londonTimeStr = testDate.toLocaleString("en-GB", {
    timeZone: LONDON_TIMEZONE,
    hour: "2-digit",
    hour12: false,
  });
  const londonHour = parseInt(londonTimeStr, 10);

  // The difference between UTC hour (12) and London hour tells us the offset
  // If London shows 13:00 when UTC is 12:00, London is UTC+1
  const offsetHours = londonHour - 12;

  // Return midnight London time as a UTC timestamp
  // If London is UTC+1, midnight London = 23:00 previous day UTC
  return Date.UTC(year, month - 1, day, 0 - offsetHours, 0, 0, 0);
}

/**
 * Format a duration in milliseconds to a human-readable string.
 * @param durationMs - Duration in milliseconds
 * @param options.compact - If true, omit minutes when exactly on the hour and show just "45m" for sub-hour
 * @returns Formatted string like "1h 30m", "2h", or "45m"
 *
 * @example
 * formatDuration(5400000) // "1h 30m"
 * formatDuration(5400000, { compact: true }) // "1h 30m"
 * formatDuration(7200000, { compact: true }) // "2h"
 * formatDuration(2700000, { compact: true }) // "45m"
 */
export function formatDuration(
  durationMs: number,
  options: { compact?: boolean } = {},
): string {
  const { compact = false } = options;
  const totalMinutes = Math.floor(durationMs / 1000 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (compact) {
    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    }
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

/**
 * Format the date part of a timestamp (without time).
 * Used for "last updated" display.
 * @returns "Monday, 15 January 2024"
 */
export function formatDatePart(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format the time part of a timestamp (without date).
 * Used for "last updated" display.
 * @returns "19:30 GMT"
 */
export function formatTimePart(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/**
 * Format a date for grouping (full date without time).
 * Used for grouping showings by date.
 * @returns "Monday, 15 January 2024"
 */
export function formatDateLong(date: Date | string | number): string {
  const d =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: LONDON_TIMEZONE,
  });
}

/**
 * Format a date in short form.
 * Used for date range display in filters.
 * @returns "30 Jan"
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Get the number of days from now (in London time) to a given timestamp.
 * Uses London timezone to ensure consistency with showings display.
 * @returns Number of days (0 = today, 1 = tomorrow), or null if outside range
 */
export function getDaysFromNow(
  timestamp: number,
  maxDays: number = 10,
): number | null {
  const todayMidnight = getLondonMidnightTimestamp();

  // Calculate days difference using timestamps
  const diffMs = timestamp - todayMidnight;
  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  if (diffDays >= 0 && diffDays <= maxDays) {
    return diffDays;
  }
  return null;
}

/**
 * Format a number of days from now as a relative string.
 * @returns "today", "tomorrow", or "in X days"
 */
export function formatDaysFromNow(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

/**
 * Check if a timestamp is in the past.
 */
export function isInPast(timestamp: number): boolean {
  return timestamp < Date.now();
}
