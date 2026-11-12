import { describe, expect, test } from "vitest";
import {
  getHandleProblem,
  getProfilePath,
  getShownSections,
  normaliseHandle,
  parseProfile,
  ProfileSectionId,
} from ".";

describe("normaliseHandle", () => {
  test("lowercases and trims", () => {
    expect(normaliseHandle("  Film-Fan ")).toBe("film-fan");
  });
});

describe("getHandleProblem", () => {
  test.each([
    ["abc", null],
    ["film_fan-99", null],
    ["a".repeat(30), null],
    ["ab", "too-short"],
    ["a".repeat(31), "too-long"],
    ["film.fan", "characters"],
    ["film fan", "characters"],
    ["Film", "characters"],
    ["filmé", "characters"],
    ["admin", "reserved"],
  ])("%s → %s", (handle, problem) => {
    expect(getHandleProblem(handle)).toBe(problem);
  });
});

describe("getProfilePath", () => {
  test("is under /u/ with the trailing slash", () => {
    expect(getProfilePath("film-fan")).toBe("/u/film-fan/");
  });
});

describe("parseProfile", () => {
  test("reads a stored profile", () => {
    expect(parseProfile({ handle: "film-fan", public: true })).toEqual({
      handle: "film-fan",
      public: true,
    });
  });

  test("anything but true is private", () => {
    expect(parseProfile({ handle: "film-fan" })?.public).toBe(false);
  });

  test("no document, or no handle, is no profile", () => {
    expect(parseProfile(undefined)).toBeNull();
    expect(parseProfile({ public: true })).toBeNull();
  });
});

describe("sections", () => {
  const chosen = {
    seenStats: true,
    watchlist: false,
    favouriteVenues: false,
    seen: true,
  };

  test("are read when every one is a boolean", () => {
    expect(
      parseProfile({ handle: "film-fan", public: true, sections: chosen }),
    ).toEqual({ handle: "film-fan", public: true, sections: chosen });
  });

  test("are left unchosen when any is missing or isn't a boolean", () => {
    const partial = Object.fromEntries(
      Object.entries(chosen).filter(([id]) => id !== "seen"),
    );
    expect(
      parseProfile({ handle: "a-b-c", public: false, sections: partial }),
    ).not.toHaveProperty("sections");
    expect(
      parseProfile({
        handle: "a-b-c",
        public: false,
        sections: { ...chosen, seen: "yes" },
      }),
    ).not.toHaveProperty("sections");
  });

  test("show everything before they're chosen, as profiles always did", () => {
    const shown = getShownSections({ handle: "film-fan", public: true });
    expect(Object.values(ProfileSectionId).every((id) => shown[id])).toBe(true);
  });

  test("show only what was chosen once they are", () => {
    expect(
      getShownSections({ handle: "film-fan", public: true, sections: chosen }),
    ).toEqual(chosen);
  });
});
