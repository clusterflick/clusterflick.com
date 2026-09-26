import { beforeEach, describe, expect, it, vi } from "vitest";
import { TmdbSearchError } from "@/lib/tmdb-search";
import {
  BATCH_INTERVAL_MS,
  estimateLookupMinutes,
  lookUpRowsOnTmdb,
} from "./tmdb-lookup";

const matchTmdb = vi.hoisted(() => vi.fn());
vi.mock("@/lib/tmdb-search", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/tmdb-search")>()),
  matchTmdb,
}));

/** A clock that only moves when the lookup waits. */
function fakeTime() {
  let time = 0;
  const waits: number[] = [];
  return {
    now: () => time,
    sleep: async (ms: number) => {
      waits.push(ms);
      time += ms;
    },
    waits,
  };
}

const rows = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ title: `Film ${i}`, year: 2000 }));

const getIdToken = async () => "token";

beforeEach(() => {
  matchTmdb.mockReset();
});

describe("lookUpRowsOnTmdb", () => {
  it("sends batches of 15, paced to the Worker's limit", async () => {
    matchTmdb.mockImplementation(async (films: unknown[]) =>
      films.map(() => null),
    );
    const time = fakeTime();
    const progress: number[] = [];

    await lookUpRowsOnTmdb(rows(40), {
      getIdToken,
      ...time,
      onProgress: (done) => progress.push(done),
    });

    expect(matchTmdb.mock.calls.map(([films]) => films.length)).toEqual([
      15, 15, 10,
    ]);
    // The first goes straight away; each after waits its turn.
    expect(time.waits).toEqual([BATCH_INTERVAL_MS, BATCH_INTERVAL_MS]);
    expect(progress).toEqual([15, 30, 40]);
  });

  it("splits rows into found and missing", async () => {
    const film = { id: "194", title: "Amélie", year: "2001" };
    matchTmdb.mockResolvedValue([film, null]);

    const lookup = await lookUpRowsOnTmdb(
      [
        { title: "Amélie", year: 2001, date: 1 },
        { title: "Nowhere", date: 2 },
      ],
      { getIdToken, ...fakeTime() },
    );

    expect(lookup).toEqual({
      found: [{ row: { title: "Amélie", year: 2001, date: 1 }, film }],
      missing: [{ title: "Nowhere", date: 2 }],
    });
    expect(matchTmdb.mock.calls[0][0]).toEqual([
      { title: "Amélie", year: 2001 },
      { title: "Nowhere" },
    ]);
  });

  it("waits out a rate limit and tries the batch again", async () => {
    matchTmdb
      .mockRejectedValueOnce(new TmdbSearchError("rate-limited", "slow down"))
      .mockResolvedValueOnce([null]);
    const time = fakeTime();

    const lookup = await lookUpRowsOnTmdb(rows(1), { getIdToken, ...time });

    expect(lookup.missing).toHaveLength(1);
    expect(time.waits[0]).toBe(60_000);
    expect(matchTmdb).toHaveBeenCalledTimes(2);
  });

  it("retries other failures twice, then throws rather than drop films", async () => {
    matchTmdb.mockRejectedValue(new TmdbSearchError("unavailable", "down"));
    await expect(
      lookUpRowsOnTmdb(rows(1), { getIdToken, ...fakeTime() }),
    ).rejects.toMatchObject({ reason: "unavailable" });
    expect(matchTmdb).toHaveBeenCalledTimes(3);
  });

  it("stops when cancelled", async () => {
    const controller = new AbortController();
    matchTmdb.mockImplementation(async (films: unknown[]) => {
      controller.abort();
      return films.map(() => null);
    });
    const time = fakeTime();
    await expect(
      lookUpRowsOnTmdb(rows(30), {
        getIdToken,
        signal: controller.signal,
        now: time.now,
      }),
    ).rejects.toBeDefined();
    expect(matchTmdb).toHaveBeenCalledTimes(1);
  });
});

describe("estimateLookupMinutes", () => {
  it("is about a minute per 195 films, never under one", () => {
    expect(estimateLookupMinutes(1)).toBe(1);
    expect(estimateLookupMinutes(195)).toBe(1);
    expect(estimateLookupMinutes(2000)).toBe(11);
  });
});
