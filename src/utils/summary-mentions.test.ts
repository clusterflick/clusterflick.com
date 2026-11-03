import { describe, it, expect } from "vitest";
import { findSummaryMentions } from "./summary-mentions";

const phrasesAt = (text: string, phrases: string[]) =>
  findSummaryMentions(text, phrases).map((m) => [m.phrase, m.index]);

describe("findSummaryMentions", () => {
  it("finds each phrase's first mention, in the order the text names them", () => {
    expect(phrasesAt("Ran, then Her, then Ran again.", ["Her", "Ran"])).toEqual(
      [
        ["Ran", 0],
        ["Her", 10],
      ],
    );
  });

  it("doesn't find a title where it only starts a longer one", () => {
    expect(phrasesAt("Her Smell is at the Rio.", ["Her", "Her Smell"])).toEqual(
      [["Her Smell", 0]],
    );
  });

  it("still finds the shorter title where it stands alone", () => {
    expect(
      phrasesAt("Her Smell, and later Her.", ["Her", "Her Smell"]),
    ).toEqual([
      ["Her Smell", 0],
      ["Her", 21],
    ]);
  });

  it("never matches inside a word, and ignores case", () => {
    expect(phrasesAt("There is HER.", ["Her"])).toEqual([["Her", 9]]);
  });

  it("treats regex characters in titles as text", () => {
    expect(
      phrasesAt("See (500) Days of Summer?", ["(500) Days of Summer"]),
    ).toEqual([["(500) Days of Summer", 4]]);
  });
});
