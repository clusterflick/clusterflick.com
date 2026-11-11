import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  getHandleProblem,
  getProfilePath,
  normaliseHandle,
  parseProfile,
  RESERVED_HANDLES,
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

describe("the rules' copy", () => {
  const rules = readFileSync(
    path.join(import.meta.dirname, "..", "..", "..", "firestore.rules"),
    "utf8",
  );
  const body = rules.match(/function isClaimableHandle[\s\S]*?\n {2}\}/)?.[0];

  test("has the same reserved handles", () => {
    const list = body?.match(/handle in \[([\s\S]*?)\]/)?.[1];
    const reserved = [...(list ?? "").matchAll(/'([^']+)'/g)].map(
      ([, handle]) => handle,
    );
    expect(reserved.sort()).toEqual([...RESERVED_HANDLES].sort());
  });

  test("has the same pattern and lengths", () => {
    expect(body).toContain("handle.matches('^[a-z0-9_-]{3,30}$')");
  });
});
