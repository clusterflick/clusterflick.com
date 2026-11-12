import { describe, expect, test } from "vitest";
import {
  getProfileLinkLabel,
  getProfileLinkUrl,
  parseLinkInput,
  ProfileLinkId,
  readDisplayName,
  readProfileLinks,
  sanitiseDisplayName,
  stripDisplayNameInput,
} from "./identity";

describe("sanitiseDisplayName", () => {
  test.each([
    ["Siobhán O'Brien", "Siobhán O'Brien"],
    ["  Alice   Smith ", "Alice Smith"],
    ['<b>"Al" & Co</b>', "bAl Co/b"],
    ["back\\slash", "backslash"],
    ["two\nlines\ttabbed", "twolinestabbed"],
    ["a\u0085b c‮d⁦e", "abcde"],
    ["$$ Money", "Money"],
    ["Cinema 🎬", "Cinema 🎬"],
  ])("%j → %j", (input, output) => {
    expect(sanitiseDisplayName(input)).toBe(output);
  });
});

describe("stripDisplayNameInput", () => {
  test("drops what a name can't hold but keeps a space being typed", () => {
    expect(stripDisplayNameInput('Al "the" ')).toBe("Al the ");
  });
});

describe("readDisplayName", () => {
  test("strips a stored name as it reads it", () => {
    expect(readDisplayName("<Alice>")).toBe("Alice");
  });

  test.each([undefined, 42, "", "   ", "<>", "é".repeat(51)])(
    "%j is no name",
    (value) => {
      expect(readDisplayName(value)).toBeUndefined();
    },
  );

  test("counts characters, not UTF-16 units", () => {
    expect(readDisplayName("🎬".repeat(50))).toBe("🎬".repeat(50));
  });
});

describe("parseLinkInput", () => {
  test.each<[ProfileLinkId, string, string]>([
    [ProfileLinkId.Letterboxd, "film_fan", "film_fan"],
    [ProfileLinkId.Letterboxd, "@film_fan", "film_fan"],
    [ProfileLinkId.Letterboxd, "https://letterboxd.com/film_fan/", "film_fan"],
    [ProfileLinkId.Letterboxd, "letterboxd.com/film_fan", "film_fan"],
    [ProfileLinkId.Imdb, "ur1234567", "ur1234567"],
    [ProfileLinkId.Imdb, "https://www.imdb.com/user/ur1234567/", "ur1234567"],
    [ProfileLinkId.Imdb, "m.imdb.com/user/ur1234567", "ur1234567"],
    [ProfileLinkId.Website, "example.com", "https://example.com/"],
    [
      ProfileLinkId.Website,
      "https://Example.com/films?a=1",
      "https://example.com/films?a=1",
    ],
    [ProfileLinkId.Website, "  ", ""],
  ])("%s %j → %j", (id, input, value) => {
    expect(parseLinkInput(id, input)).toEqual({ value });
  });

  test.each<[ProfileLinkId, string]>([
    [ProfileLinkId.Letterboxd, "https://letterboxd.com/film/heat/x/"],
    [ProfileLinkId.Letterboxd, "film fan"],
    [ProfileLinkId.Imdb, "nm0000123"],
    [ProfileLinkId.Imdb, "https://www.imdb.com/title/tt0113277/"],
    [ProfileLinkId.Website, "http://example.com"],
    [ProfileLinkId.Website, "javascript:alert(1)"],
    [ProfileLinkId.Website, "https://user:pass@example.com/"],
    [ProfileLinkId.Website, "localhost"],
    [ProfileLinkId.Website, `example.com/${"a".repeat(200)}`],
  ])("%s %j is refused", (id, input) => {
    expect(parseLinkInput(id, input)).toHaveProperty("problem");
  });
});

describe("readProfileLinks", () => {
  test("keeps the links it can show and drops the rest", () => {
    expect(
      readProfileLinks({
        letterboxd: "film_fan",
        imdb: "nm0000123",
        website: "javascript:alert(1)",
        twitter: "film_fan",
      }),
    ).toEqual({ letterboxd: "film_fan" });
  });

  test("anything but a map is no links", () => {
    expect(readProfileLinks("film_fan")).toEqual({});
  });
});

describe("where links go and what they're called", () => {
  test.each<[ProfileLinkId, string, string, string]>([
    [
      ProfileLinkId.Letterboxd,
      "film_fan",
      "https://letterboxd.com/film_fan/",
      "Letterboxd",
    ],
    [
      ProfileLinkId.Imdb,
      "ur1234567",
      "https://www.imdb.com/user/ur1234567/",
      "IMDb",
    ],
    [
      ProfileLinkId.Website,
      "https://www.example.com/films",
      "https://www.example.com/films",
      "example.com",
    ],
  ])("%s %s", (id, value, url, label) => {
    expect(getProfileLinkUrl(id, value)).toBe(url);
    expect(getProfileLinkLabel(id, value)).toBe(label);
  });
});
