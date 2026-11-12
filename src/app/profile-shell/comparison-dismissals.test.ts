import { beforeEach, describe, expect, test } from "vitest";
import {
  dismissComparison,
  dismissSignUp,
  isComparisonDismissed,
  isSignUpDismissed,
} from "./comparison-dismissals";

// A Map standing in for the browser's storage, which the unit tests run
// without.
const store = new Map<string, string>();
globalThis.localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
} as Storage;

beforeEach(() => store.clear());

describe("comparison dismissals", () => {
  test("the sign-up card stays dismissed for the rest of the day", () => {
    dismissSignUp("2026-11-12");
    expect(isSignUpDismissed("2026-11-12")).toBe(true);
    expect(isSignUpDismissed("2026-11-13")).toBe(false);
  });

  test("the compare card is dismissed per profile, for the day", () => {
    dismissComparison("film-fan", "2026-11-12");
    dismissComparison("film-buff", "2026-11-12");
    expect(isComparisonDismissed("film-fan", "2026-11-12")).toBe(true);
    expect(isComparisonDismissed("someone", "2026-11-12")).toBe(false);
    expect(isComparisonDismissed("film-fan", "2026-11-13")).toBe(false);
  });

  test("a new day's dismissal starts afresh", () => {
    dismissComparison("film-fan", "2026-11-12");
    dismissComparison("film-buff", "2026-11-13");
    expect(isComparisonDismissed("film-fan", "2026-11-13")).toBe(false);
    expect(isComparisonDismissed("film-buff", "2026-11-13")).toBe(true);
  });

  test("anything unreadable is nothing dismissed", () => {
    store.set("clusterflick-profile-compare-dismissed", "not json");
    expect(isComparisonDismissed("film-fan", "2026-11-12")).toBe(false);
  });
});
