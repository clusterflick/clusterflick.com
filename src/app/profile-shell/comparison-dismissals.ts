/**
 * Which of the profile page's comparison cards the visitor has dismissed, in
 * this browser: a preference about the page, not anything about their lists,
 * so it isn't kept with their account. The sign-up card goes for every
 * profile; the compare card for one profile at a time, since another
 * reader's overlap may still be wanted. Storage that can't be read or
 * written (a private window, blocked site data) just means the card shows
 * again on the next visit.
 */

const SIGN_UP_KEY = "clusterflick-profile-sign-up-dismissed";
const COMPARE_KEY = "clusterflick-profile-compare-dismissed";
/** Handles remembered, newest last; past this, the oldest are forgotten. */
const COMPARE_LIMIT = 100;

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

function readHandles(): string[] {
  try {
    const value: unknown = JSON.parse(read(COMPARE_KEY) ?? "[]");
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export const isSignUpDismissed = () => read(SIGN_UP_KEY) === "1";

export const dismissSignUp = () => write(SIGN_UP_KEY, "1");

export const isComparisonDismissed = (handle: string) =>
  readHandles().includes(handle);

export function dismissComparison(handle: string) {
  const handles = readHandles().filter((item) => item !== handle);
  write(
    COMPARE_KEY,
    JSON.stringify([...handles, handle].slice(-COMPARE_LIMIT)),
  );
}
