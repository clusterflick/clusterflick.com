import { describe, expect, test } from "vitest";
import { ALL_PROFILE_SECTIONS, type UserProfile } from ".";
import { getProfileDraft, isDraftChanged, readDraft } from "./draft";

const SAVED: UserProfile = {
  handle: "film-fan",
  public: true,
  sections: ALL_PROFILE_SECTIONS,
  displayName: "Siobhán O'Brien",
  links: { letterboxd: "film_fan" },
  favourites: [{ id: "949", title: "Heat", year: "1995" }],
};

describe("the profile draft", () => {
  test("starts from the saved profile and reads back as it, unchanged", () => {
    const read = readDraft(getProfileDraft(SAVED));
    expect(read.valid).toBe(true);
    expect(read.value).toEqual({
      handle: "film-fan",
      displayName: "Siobhán O'Brien",
      links: { letterboxd: "film_fan" },
      favourites: [{ id: "949", title: "Heat", year: "1995" }],
      sections: ALL_PROFILE_SECTIONS,
    });
    expect(isDraftChanged(read.value, SAVED)).toBe(false);
  });

  test("reads what was typed as it would save", () => {
    const draft = {
      ...getProfileDraft(SAVED),
      handle: " Film-Buff ",
      name: "  Siobhán  ",
      links: {
        letterboxd: "https://letterboxd.com/film_fan/",
        imdb: "",
        website: "example.com",
      },
    };
    const read = readDraft(draft);
    expect(read.value).toMatchObject({
      handle: "film-buff",
      displayName: "Siobhán",
      links: { letterboxd: "film_fan", website: "https://example.com/" },
    });
    expect(isDraftChanged(read.value, SAVED)).toBe(true);
  });

  test("says what stops it saving", () => {
    const read = readDraft({
      ...getProfileDraft(null),
      name: "é".repeat(51),
      links: { letterboxd: "", imdb: "nm123", website: "" },
    });
    expect(read.valid).toBe(false);
    expect(read.problems).toEqual({
      handle: "Choose an address",
      name: "At most 50 characters",
      links: { imdb: expect.any(String) },
    });
  });

  test("a new profile, or one without sections, is a change to save", () => {
    const read = readDraft(getProfileDraft({ handle: "a-b-c", public: true }));
    expect(read.value.sections).toEqual(ALL_PROFILE_SECTIONS);
    expect(isDraftChanged(read.value, { handle: "a-b-c", public: true })).toBe(
      true,
    );
    expect(isDraftChanged(read.value, null)).toBe(true);
  });

  test("an emptied name or links saves without them", () => {
    const read = readDraft({
      ...getProfileDraft(SAVED),
      name: "",
      links: { letterboxd: "", imdb: "", website: "" },
      favourites: [],
    });
    expect(read.value).toEqual({
      handle: "film-fan",
      sections: ALL_PROFILE_SECTIONS,
    });
  });
});
