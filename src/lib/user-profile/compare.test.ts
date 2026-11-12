import { describe, expect, test } from "vitest";
import { UserListId, type UserLists } from "@/lib/user-lists";
import { ALL_PROFILE_SECTIONS, ProfileSectionId } from ".";
import { compareProfileLists, isEmptyComparison } from "./compare";

const entry = (title: string) => ({ title, addedAt: 1 });
const lists = (watchlist: string[], seen: string[]): UserLists => ({
  [UserListId.Watchlist]: Object.fromEntries(
    watchlist.map((title) => [title.toLowerCase(), entry(title)]),
  ),
  [UserListId.Seen]: Object.fromEntries(
    seen.map((title) => [title.toLowerCase(), entry(title)]),
  ),
});

const OWNER = lists(["Heat", "Alien", "Ran"], ["Dune", "Akira", "Tar"]);
const VISITOR = lists(["Alien", "Akira", "Heat"], ["Dune", "Ran", "Tar"]);

describe("compareProfileLists", () => {
  test("finds each kind of film in common, sorted by title", () => {
    const ids = (films: { id: string }[]) => films.map(({ id }) => id);
    const comparison = compareProfileLists(
      OWNER,
      ALL_PROFILE_SECTIONS,
      VISITOR,
    );
    expect(ids(comparison.bothWant)).toEqual(["alien", "heat"]);
    expect(ids(comparison.bothSeen)).toEqual(["dune", "tar"]);
    expect(ids(comparison.theyveSeenYouWant)).toEqual(["akira"]);
    expect(ids(comparison.youveSeenTheyWant)).toEqual(["ran"]);
  });

  test("compares nothing from a hidden watchlist", () => {
    const comparison = compareProfileLists(
      OWNER,
      { ...ALL_PROFILE_SECTIONS, [ProfileSectionId.Watchlist]: false },
      VISITOR,
    );
    expect(comparison.bothWant).toEqual([]);
    expect(comparison.youveSeenTheyWant).toEqual([]);
    expect(comparison.bothSeen).toHaveLength(2);
  });

  test("compares nothing from a hidden Seen list, though it's sent for the stats", () => {
    const comparison = compareProfileLists(
      OWNER,
      { ...ALL_PROFILE_SECTIONS, [ProfileSectionId.Seen]: false },
      VISITOR,
    );
    expect(comparison.bothSeen).toEqual([]);
    expect(comparison.theyveSeenYouWant).toEqual([]);
    expect(comparison.bothWant).toHaveLength(2);
  });

  test("is empty with nothing in common", () => {
    expect(
      isEmptyComparison(
        compareProfileLists(OWNER, ALL_PROFILE_SECTIONS, lists(["Up"], [])),
      ),
    ).toBe(true);
  });
});
