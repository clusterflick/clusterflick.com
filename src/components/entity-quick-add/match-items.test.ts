import { describe, expect, it } from "vitest";
import { matchItems } from "./match-items";

const stations = [
  { name: "King George V station" },
  { name: "King's Cross St. Pancras station" },
  { name: "Kingsbury station" },
  { name: "Seven Kings station" },
];

const names = (items: { name: string }[]) => items.map((item) => item.name);

describe("matchItems", () => {
  it("finds a name through its punctuation at every prefix", () => {
    for (const query of [
      "Kings C",
      "Kings Cr",
      "Kings Cro",
      "Kings Cros",
      "Kings Cross",
    ]) {
      expect(names(matchItems(stations, query, 8))).toEqual([
        "King's Cross St. Pancras station",
      ]);
    }
  });

  it("ignores spacing and full stops", () => {
    expect(names(matchItems(stations, "st pancras", 8))).toEqual([
      "King's Cross St. Pancras station",
    ]);
  });

  it("still matches the name as written", () => {
    expect(names(matchItems(stations, "King's Cr", 8))).toEqual([
      "King's Cross St. Pancras station",
    ]);
  });

  it("keeps list order and stops at the limit", () => {
    expect(names(matchItems(stations, "king", 2))).toEqual([
      "King George V station",
      "King's Cross St. Pancras station",
    ]);
  });

  it("matches nothing for an empty or punctuation-only query", () => {
    expect(matchItems(stations, "", 8)).toEqual([]);
    expect(matchItems(stations, " '. ", 8)).toEqual([]);
  });

  it("falls back to near-misses when nothing contains the query", () => {
    expect(names(matchItems(stations, "Kingsbery", 8))).toEqual([
      "Kingsbury station",
    ]);
  });
});
