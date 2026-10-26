import { describe, expect, it } from "vitest";
import {
  addDays,
  getDailyRange,
  getHoursSince,
  getLondonDay,
  getRecentDays,
  getStreaks,
  getTimeOfDay,
  summariseReleases,
  type ReleaseLogRow,
} from "./release-status";

const row = (
  dataset: "data" | "calendar",
  publishedAt: string,
  tag = publishedAt,
): ReleaseLogRow => ({
  dataset,
  repository: `clusterflick/data-${dataset === "data" ? "transformed" : "calendar"}`,
  tag,
  publishedAt,
});

describe("getLondonDay", () => {
  it("files a release by the London day, not the UTC one", () => {
    // 23:30 UTC in summer is 00:30 the next morning in London
    expect(getLondonDay(new Date("2026-06-30T23:30:00Z"))).toBe("2026-07-01");
    // In winter London is on UTC
    expect(getLondonDay(new Date("2026-12-31T23:30:00Z"))).toBe("2026-12-31");
  });
});

describe("addDays", () => {
  it("crosses month and year ends", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("getRecentDays", () => {
  it("lists every day up to today, oldest first, with zero for days without", () => {
    expect(
      getRecentDays({ "2026-10-24": 2, "2026-10-26": 1 }, "2026-10-26", 3),
    ).toEqual([
      { day: "2026-10-24", releases: 2 },
      { day: "2026-10-25", releases: 0 },
      { day: "2026-10-26", releases: 1 },
    ]);
  });
});

describe("getStreaks", () => {
  const days = {
    "2026-10-01": 1,
    "2026-10-02": 3,
    "2026-10-03": 1,
    "2026-10-05": 2,
    "2026-10-06": 1,
  };

  it("finds the longest run of days with a release", () => {
    expect(getStreaks(days, "2026-10-06").longest).toBe(3);
  });

  it("counts the current run back from today", () => {
    expect(getStreaks(days, "2026-10-06").current).toBe(2);
  });

  it("keeps the current run going while today's release hasn't landed", () => {
    expect(getStreaks(days, "2026-10-07").current).toBe(2);
  });

  it("ends the current run once a whole day has passed without one", () => {
    expect(getStreaks(days, "2026-10-08").current).toBe(0);
  });
});

describe("getDailyRange", () => {
  it("leaves out today, which isn't over", () => {
    const days = { "2026-10-24": 2, "2026-10-25": 4, "2026-10-26": 0 };
    expect(getDailyRange(days, "2026-10-26", 2)).toEqual({
      fewest: 2,
      median: 3,
    });
  });

  it("counts a day with no release as zero", () => {
    const days = { "2026-10-23": 2, "2026-10-25": 2 };
    expect(getDailyRange(days, "2026-10-26", 3).fewest).toBe(0);
  });
});

describe("getHoursSince", () => {
  it("counts whole hours", () => {
    expect(
      getHoursSince("2026-10-26T05:07:56Z", new Date("2026-10-27T17:00:00Z")),
    ).toBe(35);
  });
});

describe("getTimeOfDay", () => {
  const now = new Date("2026-10-26T12:00:00Z");
  const rows = [
    row("data", "2026-10-24T05:10:00Z"),
    row("calendar", "2026-10-24T05:20:00Z"),
    row("data", "2026-10-24T17:40:00Z"),
    row("calendar", "2026-10-24T17:52:00Z"),
    row("data", "2026-10-25T06:05:00Z"),
    row("calendar", "2026-10-25T06:13:00Z"),
    // Outside a two-day window
    row("data", "2026-10-20T03:00:00Z"),
  ];

  it("counts the data releases in each London hour", () => {
    const { hours, releases } = getTimeOfDay(rows, now, 3);
    // 24 Oct is BST, so 05:10Z is 06:10 and 17:40Z is 18:40; 25 Oct is GMT
    expect(releases).toBe(3);
    expect(hours[6]).toBe(2);
    expect(hours[18]).toBe(1);
  });

  it("gives the time of each day's first release", () => {
    expect(getTimeOfDay(rows, now, 3).firstOfDay).toEqual({
      median: 6 * 60 + 8,
      p90: 6 * 60 + 10,
    });
  });

  it("measures the calendar's lag behind the data release before it", () => {
    expect(getTimeOfDay(rows, now, 3).calendarLag).toBe(10);
  });
});

describe("summariseReleases", () => {
  const rows = [
    row("data", "2025-02-09T21:19:15Z", "20250209.211915"),
    row("calendar", "2025-02-10T22:38:21Z", "20250210.223821"),
    row("data", "2026-10-26T05:07:56Z", "20261026.050352"),
  ];

  it("gives each dataset its first and latest release and total", () => {
    const status = summariseReleases(
      rows,
      {},
      new Date("2026-10-26T06:00:00Z"),
    );
    const data = status.datasets.find(({ key }) => key === "data")!;
    expect(data.first.tag).toBe("20250209.211915");
    expect(data.latest.tag).toBe("20261026.050352");
    expect(data.total).toBe(2);
    expect(data.days).toEqual({ "2025-02-09": 1, "2026-10-26": 1 });
  });

  it("includes the release the site was built from when the log is behind", () => {
    const status = summariseReleases(
      rows,
      {
        calendar: row("calendar", "2026-10-26T05:18:21Z", "20261026.051820"),
        data: row("data", "2026-10-26T05:07:56Z", "20261026.050352"),
      },
      new Date("2026-10-26T06:00:00Z"),
    );
    const calendar = status.datasets.find(({ key }) => key === "calendar")!;
    expect(calendar.latest.tag).toBe("20261026.051820");
    expect(calendar.total).toBe(2);
    expect(status.datasets.find(({ key }) => key === "data")!.total).toBe(2);
  });

  it("fails rather than show a dataset with no history", () => {
    expect(() => summariseReleases(rows.slice(0, 1), {}, new Date())).toThrow(
      /calendar/,
    );
  });
});
