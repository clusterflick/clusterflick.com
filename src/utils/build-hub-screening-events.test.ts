import { describe, it, expect } from "vitest";
import {
  Category,
  type Movie,
  type Venue,
} from "@clusterflick/catalogue/types";
import { buildHubScreeningEvents } from "./build-hub-screening-events";

const venue = {
  id: "venue-a",
  name: "Venue A",
  url: "https://venue-a.example",
  address: "1 Street, London",
  geo: { lat: 51.5, lon: -0.1 },
} as Venue;

function movie(
  id: string,
  title: string,
  times: number[],
  venueId = "venue-a",
) {
  return {
    id,
    title,
    normalizedTitle: title.toLowerCase(),
    showings: {
      [`${id}-s`]: {
        id: `${id}-s`,
        category: Category.Movie,
        url: "https://venue-a.example/film",
        venueId,
      },
    },
    performances: times.map((time) => ({
      bookingUrl: "https://venue-a.example/book",
      showingId: `${id}-s`,
      time,
    })),
  } as Movie;
}

describe("buildHubScreeningEvents", () => {
  it("takes the soonest screenings across every film", () => {
    const events = buildHubScreeningEvents(
      [
        movie("1", "Later Film", [3000, 4000]),
        movie("2", "Sooner Film", [1000, 2000]),
      ],
      { "venue-a": venue },
      3,
    );

    expect(events.map((event) => event.name)).toEqual([
      "Sooner Film",
      "Sooner Film",
      "Later Film",
    ]);
    expect(events[0]).toMatchObject({
      "@type": "ScreeningEvent",
      startDate: new Date(1000).toISOString(),
      url: "https://clusterflick.com/movies/2/sooner-film",
      location: expect.objectContaining({ name: "Venue A" }),
    });
  });

  it("skips a screening whose venue is not in the dataset", () => {
    const events = buildHubScreeningEvents(
      [
        movie("1", "Lost Venue", [1000], "venue-gone"),
        movie("2", "Found", [2000]),
      ],
      { "venue-a": venue },
    );

    expect(events.map((event) => event.name)).toEqual(["Found"]);
  });
});
