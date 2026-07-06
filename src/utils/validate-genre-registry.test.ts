import { describe, it, expect } from "vitest";
import { findGenreRegistryProblems } from "@/utils/validate-genre-registry";
import type { GenreDefinition } from "@/data/genres";

const registry: GenreDefinition[] = [
  { id: "28", name: "Action", slug: "action", seoDescription: "…" },
  { id: "27", name: "Horror", slug: "horror", seoDescription: "…" },
];

describe("findGenreRegistryProblems", () => {
  it("returns no problems when the dataset matches the registry", () => {
    const data = { "28": { name: "Action" }, "27": { name: "Horror" } };
    expect(findGenreRegistryProblems(data, registry)).toEqual([]);
  });

  it("ignores the synthetic Uncategorised genre", () => {
    const data = {
      "28": { name: "Action" },
      "27": { name: "Horror" },
      "95b92df1": { name: "Uncategorised" },
    };
    expect(findGenreRegistryProblems(data, registry)).toEqual([]);
  });

  it("allows registry genres absent from the dataset (empty-state pages)", () => {
    // Horror is in the registry but not in the data — expected, not a problem.
    const data = { "28": { name: "Action" } };
    expect(findGenreRegistryProblems(data, registry)).toEqual([]);
  });

  it("flags a dataset genre with no registry entry", () => {
    const data = { "28": { name: "Action" }, "99": { name: "Documentary" } };
    const problems = findGenreRegistryProblems(data, registry);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("99");
    expect(problems[0]).toContain("Documentary");
  });

  it("flags a name mismatch between dataset and registry", () => {
    const data = {
      "28": { name: "Action & Adventure" },
      "27": { name: "Horror" },
    };
    const problems = findGenreRegistryProblems(data, registry);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("28");
    expect(problems[0]).toMatch(/mismatch/i);
  });

  it("defaults to the real GENRES registry", () => {
    // The real registry maps id 28 → "Action"; a differently-named dataset
    // entry for 28 should be flagged.
    const problems = findGenreRegistryProblems({ "28": { name: "Wrong" } });
    expect(problems.some((p) => p.includes("28"))).toBe(true);
  });
});
