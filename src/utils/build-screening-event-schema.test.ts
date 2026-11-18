import { describe, it, expect } from "vitest";
import {
  FormatDimension,
  FormatPresentation,
  FormatSource,
  type MoviePerformance,
  type Venue,
} from "@clusterflick/catalogue/types";
import { buildScreeningEventSchema } from "./build-screening-event-schema";
import { buildMovieJsonLd } from "./build-movie-json-ld";

const movieUrl = "https://clusterflick.com/movies/1/heat/";
const movie = { title: "Heat", duration: 170 * 60 * 1000 };
const venue = {
  id: "venue",
  name: "Prince Charles Cinema",
  url: "https://princecharlescinema.com",
  address: "7 Leicester Place, London WC2H 7BY, UK",
  geo: { lat: 51.5113, lon: -0.1302 },
} as Venue;
const performance = (
  extra: Partial<MoviePerformance> = {},
): MoviePerformance => ({
  bookingUrl: "https://princecharlescinema.com/book/1",
  showingId: "showing",
  time: Date.UTC(2026, 10, 20, 19, 30),
  ...extra,
});

describe("buildScreeningEventSchema", () => {
  it("presents the film as the page's Movie node", () => {
    const event = buildScreeningEventSchema(
      performance(),
      movie,
      movieUrl,
      venue,
    );
    const movieNode = buildMovieJsonLd({
      movie: { title: "Heat" },
      url: movieUrl,
      dateModified: "2026-11-18T00:00:00.000Z",
      genreNames: [],
      directorNames: [],
      actorNames: [],
    });

    expect(event).not.toHaveProperty("workFeatured");
    expect(event.workPresented).toEqual({
      "@type": "Movie",
      "@id": movieNode["@id"],
      name: "Heat",
      url: movieUrl,
    });
  });

  it("gives no videoFormat for a screening with no format", () => {
    const event = buildScreeningEventSchema(
      performance(),
      movie,
      movieUrl,
      venue,
    );
    expect(event).not.toHaveProperty("videoFormat");
  });

  it("names a single format as text", () => {
    const event = buildScreeningEventSchema(
      performance({ format: { source: FormatSource.ThirtyFiveMm } }),
      movie,
      movieUrl,
      venue,
    );
    expect(event.videoFormat).toBe("35mm");
  });

  it("lists every format the venue set", () => {
    const event = buildScreeningEventSchema(
      performance({
        format: {
          presentation: FormatPresentation.Imax,
          dimension: FormatDimension.ThreeD,
        },
      }),
      movie,
      movieUrl,
      venue,
    );
    expect(event.videoFormat).toEqual(["IMAX", "3D"]);
  });

  it("ends the screening a runtime after it starts", () => {
    const event = buildScreeningEventSchema(
      performance(),
      movie,
      movieUrl,
      venue,
    );
    expect(event.startDate).toBe("2026-11-20T19:30:00.000Z");
    expect(event.endDate).toBe("2026-11-20T22:20:00.000Z");
  });
});
