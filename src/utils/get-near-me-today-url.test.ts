import { describe, it, expect, vi, afterEach } from "vitest";
import { filterManager } from "@/lib/filters/manager";
import { FilterId } from "@/lib/filters/types";
import { getLondonMidnightTimestamp } from "@/utils/format-date";
import { getNearMeTodayUrl } from "./get-near-me-today-url";

describe("getNearMeTodayUrl", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens the catalogue on the nearby venues, today, with the default film categories", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-23T18:00:00Z"));

    const url = getNearMeTodayUrl(["rio-cinema", "genesiscinema.co.uk"]);
    expect(url).toBe(
      "/catalogue?venues=rio-cinema,genesiscinema.co.uk&dateStart=2026-09-23&dateEnd=2026-09-23",
    );

    const state = filterManager.resolveFilterStateFromUrl(
      url.slice(url.indexOf("?")),
      filterManager.getDefaultState(),
    )!;
    const today = getLondonMidnightTimestamp();
    expect(state[FilterId.Venues]).toEqual([
      "rio-cinema",
      "genesiscinema.co.uk",
    ]);
    expect(state[FilterId.DateRange]).toEqual({ start: today, end: today });
    expect(state[FilterId.Categories]).toEqual(
      filterManager.getDefaultState()[FilterId.Categories],
    );
    expect(state[FilterId.HideFinished]).toBe(true);
  });
});
