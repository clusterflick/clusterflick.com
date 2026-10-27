import { describe, expect, it } from "vitest";
import { getScreeningFilterUrl } from "./get-screening-filter-url";
import {
  getDefaultState,
  resolveFilterStateFromUrl,
} from "@/lib/filters/manager";
import { FilterId } from "@/lib/filters/types";

describe("getScreeningFilterUrl", () => {
  it("selects the venue and the screening's London day", () => {
    // 23:30 UTC in summer is 00:30 the next day in London.
    const start = Date.UTC(2026, 6, 10, 23, 30);
    expect(
      getScreeningFilterUrl(
        "https://clusterflick.com/movies/123/heat/",
        "rio-cinema",
        start,
      ),
    ).toBe(
      "https://clusterflick.com/movies/123/heat/?base=all&venues=rio-cinema&dateStart=2026-07-11&dateEnd=2026-07-11",
    );
  });

  it("keeps a relative address relative", () => {
    expect(
      getScreeningFilterUrl(
        "/movies/123/heat/",
        "rio-cinema",
        Date.UTC(2026, 0, 5, 20),
      ),
    ).toBe(
      "/movies/123/heat/?base=all&venues=rio-cinema&dateStart=2026-01-05&dateEnd=2026-01-05",
    );
  });

  it("reads back as that venue on that day", () => {
    const url = getScreeningFilterUrl(
      "/movies/123/heat/",
      "rio-cinema",
      Date.UTC(2026, 0, 5, 20),
    );
    const state = resolveFilterStateFromUrl(
      new URL(url, "https://clusterflick.com").search,
      getDefaultState(),
    );
    expect(state?.[FilterId.Venues]).toEqual(["rio-cinema"]);
    expect(state?.[FilterId.DateRange]?.start).toBe(
      state?.[FilterId.DateRange]?.end,
    );
    expect(state?.[FilterId.Categories]).toBeNull();
  });
});
