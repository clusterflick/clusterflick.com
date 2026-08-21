import { describe, it, expect } from "vitest";
import type { CollectionSummary } from "@/types";
import { getMovieCollections } from "./get-movie-collections";

const collections: Record<string, CollectionSummary> = {
  "1": {
    id: "1",
    name: "Friday the 13th",
    slug: "friday-the-13th",
    partCount: 11,
  },
  "2": { id: "2", name: "Scream", slug: "scream", partCount: 6 },
  "3": {
    id: "3",
    name: "A Nightmare on Elm Street",
    slug: "elm-street",
    partCount: 9,
  },
};

describe("getMovieCollections", () => {
  it("returns the film's own collection", () => {
    expect(
      getMovieCollections({ collectionId: "1" }, collections).map((c) => c.id),
    ).toEqual(["1"]);
  });

  it("ignores a collection with no page of its own", () => {
    expect(getMovieCollections({ collectionId: "999" }, collections)).toEqual(
      [],
    );
  });

  it("takes an event's collections from the films it screens, deduplicated", () => {
    const event = {
      includedMovies: [
        { id: "a", title: "A", collectionId: "1" },
        { id: "b", title: "B", collectionId: "1" },
        { id: "c", title: "C" },
      ],
    };

    expect(getMovieCollections(event, collections).map((c) => c.id)).toEqual([
      "1",
    ]);
  });

  it("orders an event's collections by how much of it they account for", () => {
    const event = {
      includedMovies: [
        { id: "a", title: "A", collectionId: "3" },
        { id: "b", title: "B", collectionId: "2" },
        { id: "c", title: "C", collectionId: "2" },
      ],
    };

    expect(getMovieCollections(event, collections).map((c) => c.id)).toEqual([
      "2",
      "3",
    ]);
  });

  it("has nothing to say about a standalone film in no collection", () => {
    expect(getMovieCollections({}, collections)).toEqual([]);
  });
});
