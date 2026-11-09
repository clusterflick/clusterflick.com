import { describe, expect, it } from "vitest";
import { getListProgress } from "./list-progress";

describe("getListProgress", () => {
  it("counts the list's films on the Seen list", () => {
    const seen = {
      "11": { title: "Star Wars", addedAt: 0 },
      "999": { title: "Not On The List", addedAt: 0 },
    };
    expect(getListProgress(["11", "1891", "238"], seen)).toEqual({
      seen: 1,
      total: 3,
    });
  });
});
