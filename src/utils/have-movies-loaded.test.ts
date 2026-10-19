import { describe, expect, it } from "vitest";
import { haveMoviesLoaded } from "./have-movies-loaded";

const metaData = {
  filenames: ["data.0.aaa.json", "data.1.bbb.json", "data.2.ccc.json"],
  mapping: { "0": ["a", "b"], "1": ["c"], "2": ["d", "e"] },
};

describe("haveMoviesLoaded", () => {
  it("waits for the chunk holding a film", () => {
    expect(haveMoviesLoaded(metaData, new Set(), ["c"])).toBe(false);
    expect(
      haveMoviesLoaded(metaData, new Set(["data.1.bbb.json"]), ["c"]),
    ).toBe(true);
  });

  it("waits for every chunk the films are spread across", () => {
    const loaded = new Set(["data.0.aaa.json"]);
    expect(haveMoviesLoaded(metaData, loaded, ["a", "e"])).toBe(false);
    loaded.add("data.2.ccc.json");
    expect(haveMoviesLoaded(metaData, loaded, ["a", "e"])).toBe(true);
  });

  it("ignores chunks holding none of the films", () => {
    expect(
      haveMoviesLoaded(metaData, new Set(["data.0.aaa.json"]), ["b"]),
    ).toBe(true);
  });

  it("has nothing to wait for when no film is in the dataset", () => {
    expect(haveMoviesLoaded(metaData, new Set(), ["gone"])).toBe(true);
    expect(haveMoviesLoaded(metaData, new Set(), [])).toBe(true);
  });
});
