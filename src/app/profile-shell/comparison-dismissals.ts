/**
 * Which of the profile page's comparison cards the visitor has dismissed
 * today, in this browser: a preference about the page, not anything about
 * their lists, so it isn't kept with their account. A dismissal lasts the
 * rest of the day, so the card is out of the way for the visit without
 * being gone for good. The sign-up card goes for every profile; the compare
 * card for one profile, since another reader's overlap may still be wanted.
 * Storage that can't be read or written (a private window, blocked site
 * data) just means the card shows again.
 */

const SIGN_UP_KEY = "clusterflick-profile-sign-up-dismissed";
const COMPARE_KEY = "clusterflick-profile-compare-dismissed";

/** Today in the visitor's own time zone, as YYYY-MM-DD. */
export function getToday(now = new Date()): string {
  return now.toLocaleDateString("en-CA");
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not remembered; the card comes back next time.
  }
}

/** Handles dismissed today. Another day's are dropped as they're read. */
function readHandles(today: string): string[] {
  try {
    const value: unknown = JSON.parse(read(COMPARE_KEY) ?? "null");
    if (
      typeof value !== "object" ||
      value === null ||
      (value as { day?: unknown }).day !== today
    ) {
      return [];
    }
    const { handles } = value as { handles?: unknown };
    return Array.isArray(handles)
      ? handles.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export const isSignUpDismissed = (today = getToday()) =>
  read(SIGN_UP_KEY) === today;

export const dismissSignUp = (today = getToday()) => write(SIGN_UP_KEY, today);

export const isComparisonDismissed = (handle: string, today = getToday()) =>
  readHandles(today).includes(handle);

export function dismissComparison(handle: string, today = getToday()) {
  const handles = readHandles(today).filter((item) => item !== handle);
  write(
    COMPARE_KEY,
    JSON.stringify({ day: today, handles: [...handles, handle] }),
  );
}
