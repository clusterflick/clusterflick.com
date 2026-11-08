import { beforeEach, describe, expect, it, vi } from "vitest";
import { TmdbSearchError } from "@/lib/tmdb-search";
import type { FilmDetailsData } from "./film-details";
import { syncFilmDetails } from "./film-details-sync";

const fetchTmdbDetails = vi.hoisted(() => vi.fn());
vi.mock("@/lib/tmdb-search", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/tmdb-search")>()),
  fetchTmdbDetails,
}));

const getIdToken = async () => "token";
const fakeTime = () => {
  let time = 0;
  return {
    now: () => time,
    sleep: async (ms: number) => {
      time += ms;
    },
  };
};

/** TMDB's answer for an id: a film with one director named after it. */
const tmdbFilm = (id: string) => ({
  id,
  genres: ["18"],
  directors: [{ id: `d${id}`, name: `Director ${id}` }],
  cast: [],
});

/** A details document in memory, read and written as Firestore would. */
function fakeStore(initial: FilmDetailsData = { films: {}, people: {} }) {
  const data = structuredClone(initial);
  const writes: unknown[] = [];
  return {
    data,
    writes,
    read: async () => structuredClone(data),
    write: async (
      details: FilmDetailsData,
      remove: { films?: string[]; people?: string[] } = {},
    ) => {
      writes.push({ details, remove });
      for (const id of remove.films ?? []) delete data.films[id];
      for (const id of remove.people ?? []) delete data.people[id];
      Object.assign(data.films, details.films);
      Object.assign(data.people, details.people);
    },
  };
}

beforeEach(() => {
  fetchTmdbDetails.mockReset();
  fetchTmdbDetails.mockImplementation(async (ids: string[]) =>
    ids.map(tmdbFilm),
  );
});

describe("syncFilmDetails", () => {
  it("reads the dataset first and asks TMDB only for the rest", async () => {
    const store = fakeStore();
    const result = await syncFilmDetails({
      listedIds: ["949", "603", "a1b2c3d4"],
      movies: {
        "949": { id: "949", genres: ["80"], directors: ["1"] },
        a1b2c3d4: { id: "a1b2c3d4", isUnmatched: true },
      },
      people: { "1": { name: "Michael Mann" } },
      getIdToken,
      read: store.read,
      write: store.write,
      ...fakeTime(),
    });

    expect(fetchTmdbDetails).toHaveBeenCalledTimes(1);
    expect(fetchTmdbDetails.mock.calls[0][0]).toEqual(["603"]);
    expect(Object.keys(store.data.films).sort()).toEqual(["603", "949"]);
    expect(store.data.people).toEqual({
      "1": "Michael Mann",
      d603: "Director 603",
    });
    expect(result).toEqual({ added: 2, notFound: 0, removed: 0 });
  });

  it("removes films on no list, and names only they used", async () => {
    const store = fakeStore({
      films: {
        "949": { genres: [], directors: ["1"], cast: ["2"] },
        "603": { genres: [], directors: ["3"], cast: ["2"] },
      },
      people: { "1": "Michael Mann", "2": "Shared Actor", "3": "Lana" },
    });
    const result = await syncFilmDetails({
      listedIds: ["949"],
      movies: {},
      people: {},
      getIdToken,
      read: store.read,
      write: store.write,
    });

    expect(Object.keys(store.data.films)).toEqual(["949"]);
    expect(store.data.people).toEqual({
      "1": "Michael Mann",
      "2": "Shared Actor",
    });
    expect(result.removed).toBe(1);
    expect(fetchTmdbDetails).not.toHaveBeenCalled();
  });

  it("writes nothing when the details already match the lists", async () => {
    const store = fakeStore({
      films: { "949": { genres: [], directors: [], cast: [] } },
      people: {},
    });
    await syncFilmDetails({
      listedIds: ["949"],
      movies: {},
      people: {},
      getIdToken,
      read: store.read,
      write: store.write,
    });
    expect(store.writes).toEqual([]);
  });

  it("writes a batch at a time, so a failure keeps what was done", async () => {
    const ids = Array.from({ length: 20 }, (_, i) => String(1000 + i));
    fetchTmdbDetails
      .mockImplementationOnce(async (batch: string[]) => batch.map(tmdbFilm))
      .mockRejectedValue(new TmdbSearchError("unavailable", "down"));
    const store = fakeStore();

    await expect(
      syncFilmDetails({
        listedIds: ids,
        movies: {},
        people: {},
        getIdToken,
        read: store.read,
        write: store.write,
        ...fakeTime(),
      }),
    ).rejects.toThrow("down");
    // The first batch of 15 is saved; the failing one was retried, not saved.
    expect(Object.keys(store.data.films)).toHaveLength(15);
    expect(fetchTmdbDetails).toHaveBeenCalledTimes(4);
  });

  it("leaves films TMDB doesn't know without details, and counts them", async () => {
    fetchTmdbDetails.mockResolvedValue([null]);
    const store = fakeStore();
    const result = await syncFilmDetails({
      listedIds: ["999999"],
      movies: {},
      people: {},
      getIdToken,
      read: store.read,
      write: store.write,
    });
    expect(result).toEqual({ added: 0, notFound: 1, removed: 0 });
    expect(store.data.films).toEqual({});
  });
});
