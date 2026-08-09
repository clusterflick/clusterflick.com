import { readFileSync } from "fs";
import { join } from "path";
import type { Genre, Movie, Person } from "@/types";

/**
 * A film that has stopped screening. Everything a movie carries about itself
 * survives; everything about where and when to watch it does not, because
 * there is nowhere and no when any more.
 */
export type DepartedMovie = Omit<Movie, "showings" | "performances"> & {
  /** data-transformed release tag the film was last listed in. */
  lastSeen: string;
  /** Start time of the last performance we ever saw, when we saw one. */
  lastPerformance?: number;
};

export type DepartedData = {
  movies: Record<string, DepartedMovie>;
  people: Record<string, Person>;
  genres: Record<string, Genre>;
};

const EMPTY: DepartedData = { movies: {}, people: {}, genres: {} };

let cached: DepartedData | undefined;

/**
 * Load the departed-movies bundle published alongside the combined data.
 *
 * Deliberately read straight from `combined-data/` rather than from the chunks
 * in `public/data/`: these films are only ever rendered into static pages at
 * build time, and routing them through the chunks would put a growing tail of
 * unwatchable films into the payload every visitor downloads.
 *
 * A missing bundle is not an error. It is what every build saw before the
 * registry existed, and what a build sees if data-combined publishes without
 * one — in both cases there are simply no departed pages.
 */
export function getDepartedData(): DepartedData {
  if (cached) return cached;

  const bundlePath = join(
    process.cwd(),
    "combined-data",
    "departed-movies.json",
  );

  try {
    const parsed = JSON.parse(readFileSync(bundlePath, "utf-8"));
    cached = {
      movies: parsed.movies ?? {},
      people: parsed.people ?? {},
      genres: parsed.genres ?? {},
    };
  } catch {
    console.warn(
      "No departed-movies.json found; films that have finished their run will 404.",
    );
    cached = EMPTY;
  }

  return cached;
}
