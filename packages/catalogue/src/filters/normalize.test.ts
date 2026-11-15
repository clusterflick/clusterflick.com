import { describe, it, expect } from "vitest";
import { normalizeForSearch, normalizeToWords } from "./normalize";

describe("normalizeToWords", () => {
  it("splits where normalizeForSearch runs together", () => {
    // The trailing "and" is the shared folding turning "+" into a word, exactly
    // as substring search already does.
    expect(normalizeToWords("Astonishing Animated Shorts for ages 4+")).toEqual(
      ["astonishing", "animated", "shorts", "for", "ages", "4", "and"],
    );
  });

  it("folds identically to normalizeForSearch", () => {
    // The two must stay in step: the fuzzy matcher compares word runs against a
    // query normalised by the other function, so any divergence in folding
    // would silently stop corrections matching.
    for (const title of [
      "A Clockwork Orange",
      "Amélie",
      "Pomp & Circumstance",
      "8½",
      "WALL·E",
      "Сталкер",
      "Halloween + Halloween II",
      '"El Perro del Hortelano" - Teatro a la Fresca',
    ]) {
      expect(normalizeToWords(title).join("")).toBe(normalizeForSearch(title));
    }
  });

  it("drops empty segments rather than emitting blanks", () => {
    // Punctuation runs and surrounding whitespace produce no empty words. Each
    // "&" and "+" folds to its own "and" before the split.
    expect(normalizeToWords("  --  Q&A  ++ ")).toEqual([
      "q",
      "and",
      "a",
      "and",
      "and",
    ]);
  });
});
