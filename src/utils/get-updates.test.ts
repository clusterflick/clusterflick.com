import { describe, it, expect } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  Category,
  type CinemaData,
  type DiffBlob,
  type DiffModifiedShowing,
  type DiffShowing,
  type Movie,
} from "@/types";
import {
  buildUpdates,
  getUpdateReleasePath,
  groupUpdatesByDay,
  readDiffBlobs,
  summariseDay,
  type UpdateFilm,
  type UpdateRelease,
} from "./get-updates";

const DAY = 86_400_000;
const JUL_25 = new Date("2026-07-25T04:41:53Z").getTime();

const movie = (
  id: string,
  title: string,
  showingIds: string[],
  /** Per-showing first-sighting times, keyed by showing id. */
  seen: Record<string, number> = {},
): Movie =>
  ({
    id,
    title,
    normalizedTitle: title.toLowerCase(),
    posterPath: `/${id}.jpg`,
    year: "1999",
    showings: Object.fromEntries(
      showingIds.map((showingId) => [
        showingId,
        { id: showingId, seen: seen[showingId] },
      ]),
    ),
    performances: [],
  }) as unknown as Movie;

const data = (movies: Movie[], venueIds: string[] = ["a.com"]): CinemaData =>
  ({
    generatedAt: "2026-07-26T04:45:54Z",
    movies: Object.fromEntries(movies.map((m) => [m.id, m])),
    venues: Object.fromEntries(
      venueIds.map((id) => [id, { id, name: `Venue ${id}` }]),
    ),
    people: {},
    genres: {},
    filenames: [],
    urlPrefixes: [],
  }) as unknown as CinemaData;

const added = (
  showingId: string,
  title: string,
  performances: number[],
): DiffShowing => ({
  showingId,
  title,
  url: `https://example.com/${showingId}`,
  category: Category.Movie,
  performances,
  futurePerformanceCount: performances.length,
  nextPerformance: performances[0] ?? null,
});

const modified = (
  showingId: string,
  title: string,
  addedTimes: number[],
): DiffModifiedShowing => ({
  showingId,
  title,
  url: `https://example.com/${showingId}`,
  category: Category.Movie,
  performances: {
    previousCount: 1,
    currentCount: 1 + addedTimes.length,
    added: addedTimes,
    removed: [],
    rescheduled: 0,
  },
});

const blob = (
  asOf: string,
  venues: DiffBlob["venues"],
  tag = asOf,
  /** Real tag by default: it sets the boundary of the run's diff period. */
  previousRelease = "20260724.180427",
): DiffBlob => ({
  metadata: {
    currentRelease: tag,
    previousRelease,
    asOf,
    venueCount: Object.keys(venues).length,
  },
  venues,
});

const venue = (
  overrides: Partial<DiffBlob["venues"][string]> = {},
): DiffBlob["venues"][string] => ({
  name: "Venue a.com",
  venueAdded: false,
  venueRemoved: false,
  venueEmpty: false,
  showings: { added: [], removed: [], modified: [] },
  ...overrides,
});

describe("buildUpdates", () => {
  it("returns nothing when there are no diffs", () => {
    expect(buildUpdates([], data([]))).toEqual([]);
  });

  it("reports an added showing as a new film, linked to its movie page", () => {
    const result = buildUpdates(
      [
        blob("2026-07-25T04:41:53Z", {
          "a.com": venue({
            showings: {
              added: [added("a.com-1", "Fight Club", [JUL_25 + DAY])],
              removed: [],
              modified: [],
            },
          }),
        }),
      ],
      data([movie("550", "Fight Club", ["a.com-1"])]),
    );

    expect(result).toHaveLength(1);
    expect(result[0].asOf).toBe("2026-07-25T04:41:53Z");
    expect(result[0].newFilms).toHaveLength(1);
    expect(result[0].newFilms[0]).toMatchObject({
      key: "550",
      title: "Fight Club",
      href: "/movies/550/fight-club#show-all",
      posterPath: "/550.jpg",
      performanceCount: 1,
      nextPerformance: JUL_25 + DAY,
    });
    expect(result[0].newFilms[0].venues).toEqual([
      { id: "a.com", name: "Venue a.com", href: "/venues/venue-a-com" },
    ]);
  });

  it("groups one film added at several venues into a single entry", () => {
    const result = buildUpdates(
      [
        blob("2026-07-25T04:41:53Z", {
          "a.com": venue({
            showings: {
              added: [added("a.com-1", "Fight Club", [JUL_25 + DAY])],
              removed: [],
              modified: [],
            },
          }),
          "b.com": venue({
            name: "Venue b.com",
            showings: {
              added: [added("b.com-1", "Fight Club", [JUL_25 + 2 * DAY])],
              removed: [],
              modified: [],
            },
          }),
        }),
      ],
      data(
        [movie("550", "Fight Club", ["a.com-1", "b.com-1"])],
        ["a.com", "b.com"],
      ),
    );

    expect(result[0].newFilms).toHaveLength(1);
    expect(result[0].newFilms[0].venues.map((v) => v.id)).toEqual([
      "a.com",
      "b.com",
    ]);
    expect(result[0].newFilms[0].performanceCount).toBe(2);
    // Earliest across every venue, not the last one processed
    expect(result[0].newFilms[0].nextPerformance).toBe(JUL_25 + DAY);
  });

  it("demotes a film to more screenings once it has been seen earlier in the window", () => {
    const cinemaData = data([movie("550", "Fight Club", ["a.com-1"])]);
    const result = buildUpdates(
      [
        blob("2026-07-25T04:41:53Z", {
          "a.com": venue({
            showings: {
              added: [added("a.com-1", "Fight Club", [JUL_25 + DAY])],
              removed: [],
              modified: [],
            },
          }),
        }),
        blob("2026-07-26T04:41:53Z", {
          "a.com": venue({
            showings: {
              added: [],
              removed: [],
              modified: [modified("a.com-1", "Fight Club", [JUL_25 + 5 * DAY])],
            },
          }),
        }),
      ],
      cinemaData,
    );

    // Newest run first
    expect(result.map((r) => r.asOf)).toEqual([
      "2026-07-26T04:41:53Z",
      "2026-07-25T04:41:53Z",
    ]);
    expect(result[0].newFilms).toHaveLength(0);
    expect(result[0].moreShowings).toHaveLength(1);
    expect(result[0].moreShowings[0].performanceCount).toBe(1);
    expect(result[1].newFilms).toHaveLength(1);
  });

  it("treats added dates for a film never seen in the window as more screenings", () => {
    const result = buildUpdates(
      [
        blob("2026-07-25T04:41:53Z", {
          "a.com": venue({
            showings: {
              added: [],
              removed: [],
              modified: [modified("a.com-1", "Fight Club", [JUL_25 + DAY])],
            },
          }),
        }),
      ],
      data([movie("550", "Fight Club", ["a.com-1"])]),
    );

    expect(result[0].newFilms).toHaveLength(0);
    expect(result[0].moreShowings).toHaveLength(1);
  });

  it("keeps two runs on the same day as separate entries", () => {
    const cinemaData = data([movie("550", "Fight Club", ["a.com-1"])]);
    const result = buildUpdates(
      [
        blob("2026-07-25T04:41:53Z", {
          "a.com": venue({
            showings: {
              added: [added("a.com-1", "Fight Club", [JUL_25 + DAY])],
              removed: [],
              modified: [],
            },
          }),
        }),
        blob("2026-07-25T16:37:21Z", {
          "a.com": venue({
            showings: {
              added: [],
              removed: [],
              modified: [modified("a.com-1", "Fight Club", [JUL_25 + 3 * DAY])],
            },
          }),
        }),
      ],
      cinemaData,
    );

    // One section per run, so the page and the feed describe the same units
    expect(result).toHaveLength(2);
    expect(result[0].moreShowings).toHaveLength(1);
    expect(result[1].newFilms).toHaveLength(1);
  });

  it("does not demote a film added at two venues within the same run", () => {
    const result = buildUpdates(
      [
        blob("2026-07-25T04:41:53Z", {
          "a.com": venue({
            showings: {
              added: [added("a.com-1", "Fight Club", [JUL_25 + DAY])],
              removed: [],
              modified: [],
            },
          }),
          "b.com": venue({
            name: "Venue b.com",
            showings: {
              added: [added("b.com-1", "Fight Club", [JUL_25 + 2 * DAY])],
              removed: [],
              modified: [],
            },
          }),
        }),
      ],
      data(
        [movie("550", "Fight Club", ["a.com-1", "b.com-1"])],
        ["a.com", "b.com"],
      ),
    );

    expect(result[0].newFilms).toHaveLength(1);
    expect(result[0].moreShowings).toHaveLength(0);
  });

  it("ignores modified showings whose only change was a reschedule", () => {
    const result = buildUpdates(
      [
        blob("2026-07-25T04:41:53Z", {
          "a.com": venue({
            showings: {
              added: [],
              removed: [],
              modified: [modified("a.com-1", "Fight Club", [])],
            },
          }),
        }),
      ],
      data([movie("550", "Fight Club", ["a.com-1"])]),
    );

    // Nothing left to report, so the run produces no entry at all
    expect(result).toEqual([]);
  });

  it("renders an unmatched event without a link or poster", () => {
    const result = buildUpdates(
      [
        blob("2026-07-25T04:41:53Z", {
          "a.com": venue({
            showings: {
              added: [added("a.com-99", "Pub Film Quiz", [JUL_25 + DAY])],
              removed: [],
              modified: [],
            },
          }),
        }),
      ],
      data([]),
    );

    expect(result[0].newFilms[0]).toMatchObject({
      title: "Pub Film Quiz",
      href: null,
      posterPath: undefined,
    });
  });

  it("falls back to the movie match when the showing has left the dataset", () => {
    const withMatch: DiffShowing = {
      ...added("a.com-gone", "Fight Club", [JUL_25 + DAY]),
      themoviedb: { id: 550, title: "Fight Club", releaseDate: "1999-10-15" },
    };
    const result = buildUpdates(
      [
        blob("2026-07-25T04:41:53Z", {
          "a.com": venue({
            showings: { added: [withMatch], removed: [], modified: [] },
          }),
        }),
      ],
      // The film is still listed, but under a different showing
      data([movie("550", "Fight Club", ["a.com-other"])]),
    );

    expect(result[0].newFilms[0]).toMatchObject({
      key: "550",
      href: "/movies/550/fight-club#show-all",
    });
  });

  it("reports a newly added venue", () => {
    const result = buildUpdates(
      [
        blob("2026-07-25T04:41:53Z", {
          "a.com": venue({ venueAdded: true }),
        }),
      ],
      data([]),
    );

    expect(result[0].newVenues).toEqual([
      { id: "a.com", name: "Venue a.com", href: "/venues/venue-a-com" },
    ]);
  });

  it("sorts films by how many screenings they brought", () => {
    const result = buildUpdates(
      [
        blob("2026-07-25T04:41:53Z", {
          "a.com": venue({
            showings: {
              added: [
                added("a.com-1", "One Night", [JUL_25 + DAY]),
                added("a.com-2", "Big Run", [
                  JUL_25 + DAY,
                  JUL_25 + 2 * DAY,
                  JUL_25 + 3 * DAY,
                ]),
              ],
              removed: [],
              modified: [],
            },
          }),
        }),
      ],
      data([
        movie("1", "One Night", ["a.com-1"]),
        movie("2", "Big Run", ["a.com-2"]),
      ]),
    );

    expect(result[0].newFilms.map((f) => f.title)).toEqual([
      "Big Run",
      "One Night",
    ]);
  });

  it("treats a film rolling out to another venue as more screenings, not new", () => {
    const WEEK_EARLIER = JUL_25 - 7 * DAY;
    const result = buildUpdates(
      [
        blob(
          "2026-07-25T04:41:53Z",
          {
            "b.com": venue({
              name: "Venue b.com",
              showings: {
                added: [added("b.com-1", "Fight Club", [JUL_25 + DAY])],
                removed: [],
                modified: [],
              },
            }),
          },
          "20260725.054153",
        ),
      ],
      data(
        [
          // Already playing at a.com since last week; b.com is a rollout
          movie("550", "Fight Club", ["a.com-1", "b.com-1"], {
            "a.com-1": WEEK_EARLIER,
            "b.com-1": JUL_25,
          }),
        ],
        ["a.com", "b.com"],
      ),
    );

    expect(result[0].newFilms).toHaveLength(0);
    expect(result[0].moreShowings).toHaveLength(1);
    expect(result[0].moreShowings[0].title).toBe("Fight Club");
  });

  it("still counts a film opening at several venues at once as new", () => {
    const result = buildUpdates(
      [
        blob(
          "2026-07-25T04:41:53Z",
          {
            "a.com": venue({
              showings: {
                added: [added("a.com-1", "Fight Club", [JUL_25 + DAY])],
                removed: [],
                modified: [],
              },
            }),
            "b.com": venue({
              name: "Venue b.com",
              showings: {
                added: [added("b.com-1", "Fight Club", [JUL_25 + DAY])],
                removed: [],
                modified: [],
              },
            }),
          },
          "20260725.054153",
        ),
      ],
      data(
        [
          // Both sightings land inside this run's period
          movie("550", "Fight Club", ["a.com-1", "b.com-1"], {
            "a.com-1": JUL_25,
            "b.com-1": JUL_25,
          }),
        ],
        ["a.com", "b.com"],
      ),
    );

    expect(result[0].newFilms).toHaveLength(1);
    expect(result[0].moreShowings).toHaveLength(0);
  });

  it("treats a film as new when no first sighting is recorded", () => {
    const result = buildUpdates(
      [
        blob(
          "2026-07-25T04:41:53Z",
          {
            "a.com": venue({
              showings: {
                added: [added("a.com-1", "Fight Club", [JUL_25 + DAY])],
                removed: [],
                modified: [],
              },
            }),
          },
          "20260725.054153",
        ),
      ],
      // No `seen` anywhere, so there is nothing to judge a rollout on
      data([movie("550", "Fight Club", ["a.com-1"])]),
    );

    expect(result[0].newFilms).toHaveLength(1);
  });

  it("carries the release tag through, so entries can be linked to", () => {
    const result = buildUpdates(
      [
        blob(
          "2026-07-25T04:41:53Z",
          {
            "a.com": venue({
              showings: {
                added: [added("a.com-1", "Fight Club", [JUL_25 + DAY])],
                removed: [],
                modified: [],
              },
            }),
          },
          "20260725.054153",
        ),
      ],
      data([movie("550", "Fight Club", ["a.com-1"])]),
    );

    expect(result[0].tag).toBe("20260725.054153");
  });

  it("drops a run that changed nothing worth showing", () => {
    const result = buildUpdates(
      [
        blob("2026-07-25T04:41:53Z", {
          "a.com": venue({
            showings: {
              added: [],
              removed: [],
              // A reschedule only — nothing a reader can act on
              modified: [modified("a.com-1", "Fight Club", [])],
            },
          }),
        }),
        blob("2026-07-25T16:37:21Z", {
          "a.com": venue({
            showings: {
              added: [added("a.com-1", "Fight Club", [JUL_25 + DAY])],
              removed: [],
              modified: [],
            },
          }),
        }),
      ],
      data([movie("550", "Fight Club", ["a.com-1"])]),
    );

    expect(result).toHaveLength(1);
    expect(result[0].asOf).toBe("2026-07-25T16:37:21Z");
  });
});

const updateFilm = (title: string, performanceCount: number): UpdateFilm => ({
  key: title,
  title,
  href: null,
  venues: [{ id: "a.com", name: "Venue a.com", href: null }],
  performanceCount,
  nextPerformance: null,
});

const release = (
  asOf: string,
  overrides: Partial<UpdateRelease> = {},
): UpdateRelease => ({
  tag: asOf,
  asOf,
  newFilms: [],
  moreShowings: [],
  newVenues: [],
  ...overrides,
});

describe("groupUpdatesByDay", () => {
  it("returns nothing when there are no runs", () => {
    expect(groupUpdatesByDay([])).toEqual([]);
  });

  it("puts two runs on the same day onto one entry, newest first", () => {
    const days = groupUpdatesByDay([
      release("2026-08-13T17:05:00Z"),
      release("2026-08-13T05:15:00Z"),
    ]);

    expect(days).toHaveLength(1);
    expect(days[0].date).toBe("2026-08-13");
    expect(days[0].releases.map((r) => r.asOf)).toEqual([
      "2026-08-13T17:05:00Z",
      "2026-08-13T05:15:00Z",
    ]);
  });

  it("keeps days in reverse-chronological order", () => {
    const days = groupUpdatesByDay([
      release("2026-08-13T17:05:00Z"),
      release("2026-08-12T18:19:00Z"),
      release("2026-08-12T06:02:00Z"),
    ]);

    expect(days.map((day) => day.date)).toEqual(["2026-08-13", "2026-08-12"]);
    expect(days[1].releases).toHaveLength(2);
  });

  // The pipeline publishes London wall-clock tags, so a run just after midnight
  // during BST carries a UTC timestamp on the day before. It belongs to the day
  // it is labelled with on the page, not the day UTC puts it on.
  it("files a run just after London midnight under the London date", () => {
    const days = groupUpdatesByDay([release("2026-08-13T23:30:00Z")]);

    expect(days[0].date).toBe("2026-08-14");
  });

  it("links a run to an anchor on its day's page", () => {
    const path = getUpdateReleasePath(
      release("2026-08-13T17:05:00Z", { tag: "20260813.180500" }),
    );

    expect(path).toBe("/updates/2026-08-13/#20260813.180500");
  });
});

describe("summariseDay", () => {
  it("sums every run in the day", () => {
    const summary = summariseDay({
      date: "2026-08-13",
      releases: [
        release("2026-08-13T17:05:00Z", {
          newFilms: [updateFilm("Fight Club", 3)],
          moreShowings: [updateFilm("Heat", 4)],
        }),
        release("2026-08-13T05:15:00Z", {
          newFilms: [updateFilm("Bliss", 1)],
          newVenues: [{ id: "b.com", name: "Venue b.com", href: null }],
        }),
      ],
    });

    expect(summary).toBe("2 films added, 4 showings added, 1 venue added");
  });

  it("names only the kinds of change the day actually brought", () => {
    const summary = summariseDay({
      date: "2026-08-13",
      releases: [
        release("2026-08-13T17:05:00Z", {
          moreShowings: [updateFilm("Heat", 1)],
        }),
      ],
    });

    expect(summary).toBe("1 showing added");
  });
});

describe("readDiffBlobs", () => {
  // The directory is the download target for data-diffed assets generally, and
  // venue-registry.json arriving there parsed as a diff and failed the build.
  it("reads only the tag-named diff blobs, ignoring other assets", () => {
    const directory = mkdtempSync(join(tmpdir(), "diffed-data-"));
    writeFileSync(
      join(directory, "20260816.222719.json"),
      JSON.stringify({ metadata: { currentRelease: "20260816.222719" } }),
    );
    writeFileSync(
      join(directory, "venue-registry.json"),
      JSON.stringify({ venues: { "a.com": { lastSeen: "20260816.222719" } } }),
    );

    const blobs = readDiffBlobs(directory);

    expect(blobs).toHaveLength(1);
    expect(blobs[0].metadata.currentRelease).toBe("20260816.222719");

    rmSync(directory, { recursive: true, force: true });
  });

  it("yields no updates when the directory is missing", () => {
    expect(readDiffBlobs(join(tmpdir(), "no-such-diffed-data"))).toEqual([]);
  });
});
