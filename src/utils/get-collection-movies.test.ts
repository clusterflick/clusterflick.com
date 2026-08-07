import { describe, it, expect } from "vitest";
import { Category, type Collection, type Movie } from "@/types";
import {
  getCollectionScreenings,
  getCollectionEvents,
} from "./get-collection-movies";

const DAY = 86_400_000;
const NOW = 1_700_000_000_000; // 2023-11-14

function makeMovie(
  id: string,
  times: number[],
  overrides: Partial<Movie> = {},
): Movie {
  const showingId = `${id}-s0`;
  return {
    id,
    title: id,
    normalizedTitle: id,
    showings: {
      [showingId]: {
        id: showingId,
        category: Category.Movie,
        url: `https://example.com/${showingId}`,
        venueId: "venue-1",
      },
    },
    performances: times.map((time) => ({
      bookingUrl: `https://example.com/book/${showingId}`,
      showingId,
      time,
    })),
    ...overrides,
  };
}

const collection: Collection = {
  id: "1241",
  name: "Harry Potter",
  slug: "harry-potter",
  parts: [
    { id: "671", title: "Philosopher's Stone", releaseDate: "2001-11-16" },
    { id: "672", title: "Chamber of Secrets", releaseDate: "2002-11-13" },
    { id: "673", title: "Prisoner of Azkaban", releaseDate: "2004-05-31" },
  ],
};

describe("getCollectionScreenings", () => {
  it("returns every part, splitting those with upcoming performances", () => {
    const movies = {
      "671": makeMovie("671", [NOW + DAY, NOW + 2 * DAY]),
      "673": makeMovie("673", [NOW + DAY]),
    };

    const { entries, showing, notShowing } = getCollectionScreenings(
      collection,
      movies,
      NOW,
    );

    expect(entries).toHaveLength(3);
    expect(showing.map((e) => e.part.id)).toEqual(["671", "673"]);
    expect(notShowing.map((e) => e.part.id)).toEqual(["672"]);
    expect(showing[0].performanceCount).toBe(2);
    expect(showing[0].movie?.id).toBe("671");
  });

  it("orders entries by release date", () => {
    const { entries } = getCollectionScreenings(collection, {}, NOW);

    expect(entries.map((e) => e.part.title)).toEqual([
      "Philosopher's Stone",
      "Chamber of Secrets",
      "Prisoner of Azkaban",
    ]);
  });

  it("treats a film whose performances have all passed as not showing", () => {
    const movies = { "671": makeMovie("671", [NOW - DAY]) };

    const { showing, notShowing } = getCollectionScreenings(
      collection,
      movies,
      NOW,
    );

    expect(showing).toHaveLength(0);
    expect(notShowing).toHaveLength(3);
    // The part is still listed, just without a bookable film attached.
    expect(notShowing.find((e) => e.part.id === "671")?.movie).toBeUndefined();
  });

  it("includes a screening film that carries the collection id but has no part", () => {
    // TMDB omits a release date for a collection's unreleased entries, and
    // those are dropped when the collection is built — so a preview screening
    // of a forthcoming instalment has no part to match against.
    const movies = {
      "671": makeMovie("671", [NOW + DAY]),
      "999": makeMovie("999", [NOW + DAY], {
        collectionId: "1241",
        title: "The Cursed Child",
        releaseDate: "2026-07-01",
      }),
    };

    const { entries, showing } = getCollectionScreenings(
      collection,
      movies,
      NOW,
    );

    expect(entries).toHaveLength(4);
    // Sorted into release order, so it lands after the three released parts.
    expect(showing.map((e) => e.part.id)).toEqual(["671", "999"]);
    expect(showing[1].part.title).toBe("The Cursed Child");
  });

  it("ignores films from other collections and films with no showings left", () => {
    const movies = {
      "999": makeMovie("999", [NOW + DAY], { collectionId: "other" }),
      "998": makeMovie("998", [NOW - DAY], { collectionId: "1241" }),
    };

    const { entries, showing } = getCollectionScreenings(
      collection,
      movies,
      NOW,
    );

    expect(entries).toHaveLength(3);
    expect(showing).toHaveLength(0);
  });

  it("does not double-count a film that is both a part and carries the id", () => {
    const movies = {
      "671": makeMovie("671", [NOW + DAY], { collectionId: "1241" }),
    };

    const { entries, showing } = getCollectionScreenings(
      collection,
      movies,
      NOW,
    );

    expect(entries).toHaveLength(3);
    expect(showing).toHaveLength(1);
  });
});

describe("getCollectionScreenings — films inside events", () => {
  const marathonOf = (id: string, filmIds: string[], times = [NOW + DAY]) =>
    makeMovie(id, times, {
      includedMovies: filmIds.map((filmId) => ({
        id: filmId,
        title: `film ${filmId}`,
        collectionId: "1241",
      })),
    });

  it("counts a film with no standalone listing as showing inside its event", () => {
    const movies = {
      "671": makeMovie("671", [NOW + DAY]),
      ev: marathonOf("ev", ["672", "673"]),
    };

    const { showing, notShowing } = getCollectionScreenings(
      collection,
      movies,
      NOW,
    );

    expect(showing.map((e) => e.part.id)).toEqual(["671", "672", "673"]);
    expect(notShowing).toHaveLength(0);
    expect(showing[0].movie?.id).toBe("671");
    expect(showing[0].event).toBeUndefined();
    expect(showing[1].event?.id).toBe("ev");
    expect(showing[1].movie).toBeUndefined();
  });

  it("prefers a standalone listing over the event carrying the same film", () => {
    const movies = {
      "671": makeMovie("671", [NOW + DAY, NOW + 2 * DAY]),
      ev: marathonOf("ev", ["671"]),
    };

    const entry = getCollectionScreenings(collection, movies, NOW).showing[0];

    expect(entry.movie?.id).toBe("671");
    expect(entry.event).toBeUndefined();
    expect(entry.performanceCount).toBe(2);
  });

  it("falls back to the event when the standalone listing has lapsed", () => {
    const movies = {
      "671": makeMovie("671", [NOW - DAY]),
      ev: marathonOf("ev", ["671"]),
    };

    const entry = getCollectionScreenings(collection, movies, NOW).showing[0];

    expect(entry.movie).toBeUndefined();
    expect(entry.event?.id).toBe("ev");
  });

  it("ignores events whose own performances have passed", () => {
    const movies = { ev: marathonOf("ev", ["672"], [NOW - DAY]) };

    const { showing, notShowing } = getCollectionScreenings(
      collection,
      movies,
      NOW,
    );

    expect(showing).toHaveLength(0);
    expect(notShowing).toHaveLength(3);
  });

  it("picks the first matching event when a film is in several", () => {
    const movies = {
      first: marathonOf("first", ["672"]),
      second: marathonOf("second", ["672"]),
    };

    const entry = getCollectionScreenings(collection, movies, NOW).showing[0];

    expect(entry.event?.id).toBe("first");
  });
});

describe("getCollectionEvents", () => {
  const marathon = (
    id: string,
    includedCollectionIds: (string | undefined)[],
  ) =>
    makeMovie(id, [NOW + DAY], {
      includedMovies: includedCollectionIds.map((collectionId, index) => ({
        id: `${id}-inc${index}`,
        title: `included ${index}`,
        collectionId,
      })),
    });

  it("finds multi-film events including a film from the collection", () => {
    const movies = {
      m1: marathon("m1", ["1241", "1241"]),
      m2: marathon("m2", ["other"]),
    };

    const result = getCollectionEvents(collection, movies, NOW);

    expect(result).toHaveLength(1);
    expect(result[0].movie.id).toBe("m1");
    expect(result[0].performanceCount).toBe(1);
  });

  it("ignores events whose performances have all passed", () => {
    const past = makeMovie("m1", [NOW - DAY], {
      includedMovies: [{ id: "i", title: "i", collectionId: "1241" }],
    });

    expect(getCollectionEvents(collection, { m1: past }, NOW)).toHaveLength(0);
  });

  it("ranks by how widely the event is showing", () => {
    const movies = {
      few: makeMovie("few", [NOW + DAY], {
        includedMovies: [{ id: "a", title: "a", collectionId: "1241" }],
      }),
      many: makeMovie("many", [NOW + DAY, NOW + 2 * DAY], {
        includedMovies: [{ id: "b", title: "b", collectionId: "1241" }],
      }),
    };

    expect(
      getCollectionEvents(collection, movies, NOW).map((e) => e.movie.id),
    ).toEqual(["many", "few"]);
  });

  it("returns nothing when no event touches the collection", () => {
    expect(
      getCollectionEvents(
        collection,
        { m1: makeMovie("m1", [NOW + DAY]) },
        NOW,
      ),
    ).toHaveLength(0);
  });
});
