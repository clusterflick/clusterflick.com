import { describe, it, expect } from "vitest";
import {
  Category,
  FormatPresentation,
  FormatSource,
  type Movie,
  type MoviePerformance,
  type MoviePerformanceFormat,
  type Venue,
} from "@/types";
import type { MoviesRecord } from "@/lib/filters/types";
import {
  getFormatsIndex,
  getFilmSourcesUrl,
  RARE_FORMAT_SHOWINGS,
} from "./get-formats-index";

const HOUR = 3_600_000;
const NOW = 1_700_000_000_000; // 2023-11-14

function makeMovie(
  id: string,
  showings: {
    venueId: string;
    format: MoviePerformanceFormat;
    count: number;
  }[],
): Movie {
  const performances: MoviePerformance[] = showings.flatMap(
    ({ format, count }, s) =>
      Array.from({ length: count }, (_, i) => ({
        bookingUrl: `https://example.com/book/${id}`,
        showingId: `${id}-s${s}`,
        time: NOW + (i + 1) * HOUR,
        format,
      })),
  );
  return {
    id,
    title: id,
    normalizedTitle: id,
    showings: Object.fromEntries(
      showings.map(({ venueId }, s) => [
        `${id}-s${s}`,
        {
          id: `${id}-s${s}`,
          category: Category.Movie,
          url: `https://example.com/${id}`,
          venueId,
        },
      ]),
    ),
    performances,
    posterPath: `/${id}.jpg`,
  } as Movie;
}

const record = (...movies: Movie[]): MoviesRecord =>
  Object.fromEntries(movies.map((movie) => [movie.id, movie]));

const venues = {
  "bfi-imax": { id: "bfi-imax", name: "BFI IMAX" },
  prince: { id: "prince", name: "Prince Charles Cinema" },
} as unknown as Record<string, Venue>;

const index = (movies: MoviesRecord) =>
  getFormatsIndex(movies, venues, { now: NOW, getImagePath: () => null });

const find = (result: ReturnType<typeof index>, id: string) =>
  result.formats.find((format) => format.id === id)!;

describe("getFormatsIndex", () => {
  it("counts films, showings and venues per format", () => {
    const result = index(
      record(
        makeMovie("epic", [
          {
            venueId: "bfi-imax",
            format: { source: FormatSource.SeventyMm },
            count: 30,
          },
          {
            venueId: "prince",
            format: { source: FormatSource.SeventyMm },
            count: 5,
          },
        ]),
      ),
    );
    const seventy = find(result, FormatSource.SeventyMm);
    expect(seventy.movieCount).toBe(1);
    expect(seventy.performanceCount).toBe(35);
    expect(seventy.venueCount).toBe(2);
    expect(seventy.onlyVenue).toBeNull();
  });

  it("names the venue when a format is only at one", () => {
    const result = index(
      record(
        makeMovie("epic", [
          {
            venueId: "bfi-imax",
            format: { source: FormatSource.ImaxSeventyMm },
            count: 30,
          },
        ]),
      ),
    );
    expect(find(result, FormatSource.ImaxSeventyMm).onlyVenue).toBe("BFI IMAX");
  });

  it("fails loudly on a venue the dataset doesn't know", () => {
    expect(() =>
      index(
        record(
          makeMovie("epic", [
            {
              venueId: "missing",
              format: { source: FormatSource.Vhs },
              count: 1,
            },
          ]),
        ),
      ),
    ).toThrow(/unknown venue/);
  });

  it("gives the next screening only for rare formats", () => {
    const result = index(
      record(
        makeMovie("rare", [
          {
            venueId: "prince",
            format: { source: FormatSource.SixteenMm },
            count: 2,
          },
        ]),
        makeMovie("busy", [
          {
            venueId: "prince",
            format: { presentation: FormatPresentation.Imax },
            count: RARE_FORMAT_SHOWINGS,
          },
        ]),
      ),
    );
    expect(find(result, FormatSource.SixteenMm).next?.title).toBe("rare");
    expect(find(result, FormatPresentation.Imax).next).toBeNull();
  });

  it("prefers films an earlier card hasn't already shown", () => {
    const result = index(
      record(
        makeMovie("epic", [
          {
            venueId: "bfi-imax",
            format: { source: FormatSource.SeventyMm },
            count: 9,
          },
          {
            venueId: "bfi-imax",
            format: { source: FormatSource.ImaxSeventyMm },
            count: 9,
          },
        ]),
        makeMovie("other", [
          {
            venueId: "prince",
            format: { source: FormatSource.ImaxSeventyMm },
            count: 1,
          },
        ]),
      ),
    );
    const titles = find(result, FormatSource.ImaxSeventyMm).posters.map(
      (poster) => poster.title,
    );
    expect(titles).toEqual(["other", "epic"]);
  });

  it("leaves formats with nothing on out of the sections", () => {
    const result = index(
      record(
        makeMovie("epic", [
          {
            venueId: "prince",
            format: { source: FormatSource.ThirtyFiveMm },
            count: 1,
          },
        ]),
      ),
    );
    expect(result.sections.map((section) => section.id)).toEqual(["source"]);
    expect(result.sections[0].formats.map((format) => format.id)).toEqual([
      FormatSource.ThirtyFiveMm,
    ]);
    expect(result.emptyFormats.map((format) => format.id)).toContain(
      FormatSource.Nitrate,
    );
    expect(result.formats).toHaveLength(
      result.sections[0].formats.length + result.emptyFormats.length,
    );
  });
});

describe("getFilmSourcesUrl", () => {
  it("filters the catalogue to every print format", () => {
    expect(getFilmSourcesUrl()).toBe(
      "/catalogue?base=all&source=70mm,imax-70mm,35mm,16mm,nitrate",
    );
  });
});
